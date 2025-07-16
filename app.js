// classroom.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Classroom Variables ---
    let socket;
    let currentClassroomId = null;
    let currentUser = null; // To store logged-in user's data (especially role)

    // WebRTC Variables
    let localStream;
    const peerConnections = {}; // Store RTCPeerConnection objects keyed by peerId
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' }, // Public STUN server
            // Add TURN servers if needed for more complex network scenarios
            // { 'urls': 'turn:your-turn-server.com:3478', 'username': 'user', 'credential': 'password' }
        ]
    };

    // Whiteboard Variables
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const whiteboardCtx = whiteboardCanvas ? whiteboardCanvas.getContext('2d') : null;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let penColor = '#000000'; // Default black
    let penWidth = 2; // Default width

    // --- DOM Elements ---
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-message-btn');
    const chatMessages = document.getElementById('chat-messages');

    // Whiteboard Controls
    const penColorInput = document.getElementById('pen-color');
    const penWidthInput = document.getElementById('pen-width');
    const clearBoardBtn = document.getElementById('clear-board-btn');
    const whiteboardControls = document.querySelectorAll('#whiteboard-section .whiteboard-control'); // Select all controls

    // Video Broadcast Elements
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');

    // --- Classroom Lifecycle Management ---

    // Listen for classroom entry from app.js
    window.addEventListener('classroomEntered', (event) => {
        currentClassroomId = event.detail.classroomId;
        currentUser = event.detail.currentUser; // Get current user details, including role
        console.log(`Entered classroom: ${currentClassroomId} as ${currentUser.username} (${currentUser.role})`);
        initializeSocketIO();
        setupWhiteboardControls(); // Setup controls based on role
    });

    // Listen for classroom exit from app.js
    window.addEventListener('classroomLeft', (event) => {
        console.log(`Leaving classroom: ${event.detail.classroomId}`);
        if (socket) {
            socket.emit('leave', { 'classroomId': event.detail.classroomId });
            socket.disconnect();
            socket = null;
        }
        endBroadcast(); // Clean up broadcast
        currentClassroomId = null;
        currentUser = null;
        // Clear whiteboard canvas
        if (whiteboardCtx) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        // Hide whiteboard controls for non-admins if they were shown
        whiteboardControls.forEach(control => control.style.display = 'none');
    });


    // --- Socket.IO Initialization ---
    function initializeSocketIO() {
        if (socket) {
            socket.disconnect();
        }
        socket = io(); // Connect to the Socket.IO server

        socket.on('connect', () => {
            console.log('Socket.IO Connected');
            socket.emit('join', { 'classroomId': currentClassroomId });
            // Request whiteboard history upon joining
            if (currentClassroomId && currentUser) {
                socket.emit('whiteboard_data', { action: 'history_request', classroomId: currentClassroomId, recipient_id: socket.id });
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO Disconnected');
        });

        socket.on('status', (data) => {
            console.log('Server Status:', data.message);
        });

        socket.on('message', (data) => {
            console.log('Received Message:', data);
            const messageElement = document.createElement('div');
            messageElement.textContent = `${data.username}: ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        });

        socket.on('user_joined', (data) => {
            console.log(`${data.username} has joined the classroom.`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has joined the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // If I am the broadcaster, create an offer for the new participant
            if (localStream && localStream.active && currentUser.role === 'admin') {
                createPeerConnection(data.sid, true); // Create offer for the new peer
            }
        });

        socket.on('user_left', (data) => {
            console.log(`${data.username} has left the classroom.`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has left the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        // --- Whiteboard Socket.IO Handlers ---
        socket.on('whiteboard_data', (data) => {
            if (data.action === 'draw') {
                const { prevX, prevY, currX, currY, color, width } = data;
                drawLine(prevX, prevY, currX, currY, color, width);
            } else if (data.action === 'clear') {
                if (whiteboardCtx) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
            } else if (data.action === 'history' && data.data) {
                // Redraw history for new participants
                data.data.forEach(drawCommand => {
                    if (drawCommand.action === 'draw') {
                        const { prevX, prevY, currX, currY, color, width } = drawCommand;
                        drawLine(prevX, prevY, currX, currY, color, width);
                    }
                });
            }
        });

        // --- WebRTC Socket.IO Handlers ---
        socket.on('webrtc_offer', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore offer from self
            console.log('Received WebRTC Offer from:', data.sender_id);
            if (!localStream) {
                // If not broadcasting yet, get user media to be ready to receive
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    localVideo.srcObject = localStream;
                    console.log("Acquired local stream for receiving.");
                } catch (err) {
                    console.error("Error acquiring local stream for receiving:", err);
                    alert("Could not access camera/microphone for video call.");
                    return;
                }
            }

            const peerId = data.sender_id;
            if (!peerConnections[peerId]) {
                createPeerConnection(peerId, false); // Not the caller
            }

            try {
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnections[peerId].createAnswer();
                await peerConnections[peerId].setLocalDescription(answer);
                socket.emit('webrtc_answer', {
                    classroomId: currentClassroomId,
                    recipient_id: peerId,
                    answer: peerConnections[peerId].localDescription
                });
                console.log('Sent WebRTC Answer to:', peerId);
            } catch (error) {
                console.error('Error handling offer:', error);
            }
        });

        socket.on('webrtc_answer', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore answer from self
            console.log('Received WebRTC Answer from:', data.sender_id);
            const peerId = data.sender_id;
            if (peerConnections[peerId]) {
                try {
                    await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (error) {
                    console.error('Error handling answer:', error);
                }
            }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore candidate from self
            console.log('Received ICE Candidate from:', data.sender_id);
            const peerId = data.sender_id;
            if (peerConnections[peerId]) {
                try {
                    await peerConnections[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            console.log('Peer disconnected:', data.peer_id);
            const peerId = data.peer_id;
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
                }
            }
        });
    }

    // --- Chat Functionality ---
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && socket && currentClassroomId) {
                socket.emit('message', {
                    classroomId: currentClassroomId,
                    message: message,
                    username: currentUser.username // Use the current user's username
                });
                chatInput.value = '';
            }
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
    }

    // --- Whiteboard Functionality ---
    function setupWhiteboardControls() {
        if (!whiteboardCanvas || !whiteboardCtx) return;

        // Disable/enable whiteboard controls based on user role
        if (currentUser && currentUser.role !== 'admin') {
            console.log("Disabling whiteboard controls for non-admin user.");
            whiteboardControls.forEach(control => control.style.display = 'none'); // Hide controls
            whiteboardCanvas.style.pointerEvents = 'none'; // Make canvas non-interactive
        } else {
            console.log("Enabling whiteboard controls for admin user.");
            whiteboardControls.forEach(control => control.style.display = 'block'); // Show controls
            whiteboardCanvas.style.pointerEvents = 'auto'; // Make canvas interactive
        }

        if (penColorInput) {
            penColorInput.addEventListener('change', (e) => {
                penColor = e.target.value;
                whiteboardCtx.strokeStyle = penColor;
            });
        }

        if (penWidthInput) {
            penWidthInput.addEventListener('change', (e) => {
                penWidth = parseInt(e.target.value);
                whiteboardCtx.lineWidth = penWidth;
            });
        }

        if (clearBoardBtn) {
            clearBoardBtn.addEventListener('click', () => {
                if (socket && currentClassroomId && currentUser.role === 'admin') {
                    socket.emit('whiteboard_data', { action: 'clear', classroomId: currentClassroomId });
                } else {
                    alert("Only administrators can clear the whiteboard.");
                }
            });
        }

        whiteboardCanvas.addEventListener('mousedown', (e) => {
            if (currentUser && currentUser.role === 'admin') {
                isDrawing = true;
                [lastX, lastY] = [e.offsetX, e.offsetY];
            } else {
                alert("Only administrators can draw on the whiteboard.");
            }
        });

        whiteboardCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            if (currentUser && currentUser.role === 'admin') {
                const currX = e.offsetX;
                const currY = e.offsetY;

                // Draw locally
                drawLine(lastX, lastY, currX, currY, penColor, penWidth);

                // Send drawing data to server
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroomId,
                    prevX: lastX,
                    prevY: lastY,
                    currX: currX,
                    currY: currY,
                    color: penColor,
                    width: penWidth
                });

                [lastX, lastY] = [currX, currY];
            }
        });

        whiteboardCanvas.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        whiteboardCanvas.addEventListener('mouseout', () => {
            isDrawing = false;
        });

        // Set initial context properties
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.strokeStyle = penColor;
        whiteboardCtx.lineWidth = penWidth;
    }

    function drawLine(prevX, prevY, currX, currY, color, width) {
        if (!whiteboardCtx) return;
        whiteboardCtx.beginPath();
        whiteboardCtx.moveTo(prevX, prevY);
        whiteboardCtx.lineTo(currX, currY);
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = width;
        whiteboardCtx.stroke();
    }


    // --- Video Broadcasting Functionality (WebRTC) ---

    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }

    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }

    async function startBroadcast() {
        if (!currentClassroomId || !socket || !currentUser || currentUser.role !== 'admin') {
            alert("Only administrators can start a broadcast in a classroom.");
            return;
        }

        if (localStream) {
            alert("Broadcast already active.");
            return;
        }

        try {
            // Request access to camera and microphone
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            console.log("Local stream acquired.");

            // Notify server that this user is starting a broadcast
            // The server will then notify other participants to prepare to receive an offer
            socket.emit('start_broadcast', { classroomId: currentClassroomId, userId: socket.id });

            // For each existing participant, create an offer
            // This is handled by the server's 'user_joined' event which will trigger
            // the broadcaster to send offers to existing users too.
            // Or, more robustly, the server would maintain a list of SIDs in a room
            // and send a message to the broadcaster to initiate connections with them.
            // For simplicity here, new participants will trigger the offer.
            // If the room already has users, the server needs to tell the broadcaster
            // to send offers to them. This is often done by the server sending a list of active users.

            alert('Broadcast started!');
            startBroadcastBtn.disabled = true;
            endBroadcastBtn.disabled = false;

        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Could not start broadcast. Please ensure camera and microphone access are granted.');
            localStream = null;
        }
    }

    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop()); // Stop all tracks
            localStream = null;
            localVideo.srcObject = null;
            console.log("Local stream stopped.");
        }

        // Close all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                // Remove remote video element
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
                }
            }
        }
        // Notify other peers that this broadcaster is disconnecting
        if (socket && currentClassroomId) {
            socket.emit('webrtc_peer_disconnected', { classroomId: currentClassroomId, peer_id: socket.id });
        }

        alert('Broadcast ended.');
        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;
    }

    function createPeerConnection(peerId, isCaller) {
        console.log(`Creating peer connection for ${peerId}, isCaller: ${isCaller}`);
        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;

        // Add local stream tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        // When a remote stream track is received, add it to a new video element
        pc.ontrack = (event) => {
            console.log('Remote track received from:', peerId);
            const remoteVideo = document.createElement('video');
            remoteVideo.id = `remote-video-${peerId}`;
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            remoteVideo.srcObject = event.streams[0];
            remoteVideoContainer.appendChild(remoteVideo);
        };

        // Gather ICE candidates and send them to the remote peer via Socket.IO
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE Candidate to:', peerId);
                socket.emit('webrtc_ice_candidate', {
                    classroomId: currentClassroomId,
                    recipient_id: peerId,
                    candidate: event.candidate
                });
            }
        };

        // Handle peer connection state changes
        pc.onconnectionstatechange = (event) => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                console.log(`Peer ${peerId} connection closed or failed.`);
                // Clean up if the peer disconnects without an explicit signal
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
                }
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
            }
        };

        // If this peer is the caller, create an offer
        if (isCaller) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    console.log('Sending WebRTC Offer to:', peerId);
                    socket.emit('webrtc_offer', {
                        classroomId: currentClassroomId,
                        recipient_id: peerId,
                        offer: pc.localDescription
                    });
                })
                .catch(error => console.error('Error creating offer:', error));
        }
    }

    // --- Initial Setup on Load (if app.js already loaded the classroom) ---
    // This handles cases where user refreshes page while in a classroom
    const storedClassroom = localStorage.getItem('currentClassroom');
    const storedUser = localStorage.getItem('currentUser');
    if (storedClassroom && storedUser) {
        const classroomData = JSON.parse(storedClassroom);
        const userData = JSON.parse(storedUser);
        // Simulate classroomEntered event to re-initialize
        window.dispatchEvent(new CustomEvent('classroomEntered', {
            detail: {
                classroomId: classroomData.id,
                currentUser: userData
            }
        }));
    }
});
