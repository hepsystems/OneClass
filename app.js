// classroom.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Socket.IO Setup ---
    const socket = io(); // Connect to the Socket.IO server

    // --- DOM Element References for Classroom Features ---
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const ctx = whiteboardCanvas ? whiteboardCanvas.getContext('2d') : null;

    const penToolBtn = document.getElementById('pen-tool');
    const eraserToolBtn = document.getElementById('eraser-tool');
    const penColorInput = document.getElementById('pen-color');
    const penWidthInput = document.getElementById('pen-width');
    const widthValueSpan = document.getElementById('width-value');
    const clearWhiteboardBtn = document.getElementById('clear-whiteboard-btn');

    const chatMessagesDiv = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatButton = document.getElementById('send-chat-button');

    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryFilesListDiv = document.getElementById('library-files-list');

    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionInput = document.getElementById('assessment-description');
    const createAssessmentBtn = document.getElementById('create-assessment-btn');
    const assessmentListDiv = document.getElementById('assessment-list');

    // WebRTC Elements
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const joinBroadcastBtn = document.getElementById('join-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');

    // --- Global State for Classroom ---
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    // --- Whiteboard State ---
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = penColorInput ? penColorInput.value : '#000000';
    let currentWidth = penWidthInput ? parseInt(penWidthInput.value) : 2;
    let currentTool = 'pen'; // 'pen' or 'eraser'

    const whiteboardHistory = []; // Stores drawing commands for new participants

    // --- WebRTC State ---
    let localStream;
    const peerConnections = {}; // Stores RTCPeerConnection objects, key is peerId (socket.id)
    const activeBroadcastClassroomId = {}; // To track which classroom is broadcasting

    // --- Utility Functions ---

    // Function to get current classroom ID safely
    function getCurrentClassroomId() {
        return currentClassroom ? currentClassroom.id : null;
    }

    function drawLine(x1, y1, x2, y2, color, width, tool, emit = false) {
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out'; // Erase effect
        } else {
            ctx.globalCompositeOperation = 'source-over'; // Normal drawing
        }

        ctx.stroke();

        if (emit) {
            socket.emit('whiteboard_data', {
                classroomId: getCurrentClassroomId(),
                action: 'draw',
                x1, y1, x2, y2, color, width, tool
            });
            whiteboardHistory.push({ x1, y1, x2, y2, color, width, tool }); // Add to history
        }
    }

    function clearWhiteboard(emit = false) {
        if (!ctx) return;
        ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        if (emit) {
            socket.emit('whiteboard_data', {
                classroomId: getCurrentClassroomId(),
                action: 'clear'
            });
            whiteboardHistory.length = 0; // Clear history
        }
    }

    // --- Whiteboard Event Listeners ---
    if (whiteboardCanvas) {
        whiteboardCanvas.addEventListener('mousedown', (e) => {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });

        whiteboardCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            drawLine(lastX, lastY, e.offsetX, e.offsetY, currentColor, currentWidth, currentTool, true);
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });

        whiteboardCanvas.addEventListener('mouseup', () => isDrawing = false);
        whiteboardCanvas.addEventListener('mouseout', () => isDrawing = false);

        // Tool and Color/Width changes
        if (penToolBtn) {
            penToolBtn.addEventListener('click', () => currentTool = 'pen');
        }
        if (eraserToolBtn) {
            eraserToolBtn.addEventListener('click', () => currentTool = 'eraser');
        }
        if (penColorInput) {
            penColorInput.addEventListener('change', (e) => currentColor = e.target.value);
        }
        if (penWidthInput) {
            penWidthInput.addEventListener('input', (e) => {
                currentWidth = parseInt(e.target.value);
                if (widthValueSpan) widthValueSpan.textContent = `${currentWidth}px`;
            });
        }
        if (clearWhiteboardBtn) {
            clearWhiteboardBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the whiteboard?')) {
                    clearWhiteboard(true);
                }
            });
        }
    }

    // --- Chat Event Listeners ---
    if (sendChatButton) {
        sendChatButton.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && getCurrentClassroomId()) {
                socket.emit('chat_message', {
                    classroomId: getCurrentClassroomId(),
                    message: message
                });
                chatInput.value = ''; // Clear input
            }
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatButton.click();
            }
        });
    }

    // --- Library Event Listeners ---
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            const files = libraryFileInput.files;
            if (files.length === 0) {
                alert('Please select files to upload.');
                return;
            }
            if (!getCurrentClassroomId()) {
                alert('Please enter a classroom to upload files.');
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            formData.append('classroomId', getCurrentClassroomId());

            try {
                const response = await fetch('/api/upload-library-files', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    loadLibraryFiles(getCurrentClassroomId()); // Reload files after upload
                } else {
                    alert('Error uploading files: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error uploading files:', error);
                alert('An error occurred during file upload.');
            }
        });
    }

    async function loadLibraryFiles(classroomId) {
        if (!classroomId) return;
        try {
            const response = await fetch(`/api/library-files/${classroomId}`);
            const files = await response.json();
            if (libraryFilesListDiv) {
                libraryFilesListDiv.innerHTML = ''; // Clear previous list
                if (files.length === 0) {
                    libraryFilesListDiv.innerHTML = '<p>No files in library yet.</p>';
                } else {
                    const ul = document.createElement('ul');
                    files.forEach(file => {
                        const li = document.createElement('li');
                        li.innerHTML = `<a href="${file.url}" target="_blank">${file.filename}</a>`;
                        ul.appendChild(li);
                    });
                    libraryFilesListDiv.appendChild(ul);
                }
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            if (libraryFilesListDiv) {
                libraryFilesListDiv.innerHTML = '<p>Failed to load library files.</p>';
            }
        }
    }

    // --- Assessments Event Listeners ---
    if (createAssessmentBtn) {
        createAssessmentBtn.addEventListener('click', async () => {
            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionInput.value.trim();
            if (!title) {
                alert('Assessment title cannot be empty.');
                return;
            }
            if (!getCurrentClassroomId()) {
                alert('Please enter a classroom to create an assessment.');
                return;
            }

            try {
                const response = await fetch('/api/create-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        classroomId: getCurrentClassroomId(),
                        title: title,
                        description: description
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    assessmentTitleInput.value = '';
                    assessmentDescriptionInput.value = '';
                    loadAssessments(getCurrentClassroomId()); // Reload assessments
                } else {
                    alert('Error creating assessment: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error creating assessment:', error);
                alert('An error occurred during assessment creation.');
            }
        });
    }

    async function loadAssessments(classroomId) {
        if (!classroomId) return;
        try {
            const response = await fetch(`/api/assessments/${classroomId}`);
            const assessments = await response.json();
            if (assessmentListDiv) {
                assessmentListDiv.innerHTML = ''; // Clear previous list
                if (assessments.length === 0) {
                    assessmentListDiv.innerHTML = '<p>No assessments created yet.</p>';
                } else {
                    assessments.forEach(assessment => {
                        const div = document.createElement('div');
                        div.innerHTML = `
                            <h4>${assessment.title}</h4>
                            <p>${assessment.description || 'No description.'}</p>
                            <small>Created by: ${assessment.creator_username} on ${new Date(assessment.created_at).toLocaleString()}</small>
                        `;
                        assessmentListDiv.appendChild(div);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            if (assessmentListDiv) {
                assessmentListDiv.innerHTML = '<p>Failed to load assessments.</p>';
            }
        }
    }

    // --- WebRTC (Video Broadcast) Functions and Event Listeners ---

    // STUN/TURN server configuration (use Google's public STUN server for development)
    const rtcConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    async function startBroadcast() {
        if (!getCurrentClassroomId()) {
            alert('Please join a classroom before starting a broadcast.');
            return;
        }

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideo) localVideo.srcObject = localStream;
            activeBroadcastClassroomId[getCurrentClassroomId()] = true; // Mark as broadcasting

            // Emit to server that this user is starting a broadcast
            socket.emit('start_broadcast', { classroomId: getCurrentClassroomId(), peer_id: socket.id });
            alert('Broadcast started. Others can now join.');
        } catch (err) {
            console.error('Error accessing media devices:', err);
            alert('Could not start broadcast. Please check your camera/microphone permissions.');
        }
    }

    async function createPeerConnection(peerId, isOfferer) {
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections[peerId] = pc;

        // Add local tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', {
                    classroomId: getCurrentClassroomId(),
                    recipient_id: peerId,
                    candidate: event.candidate.toJSON()
                });
            }
        };

        // Handle remote stream/track
        pc.ontrack = (event) => {
            console.log('Remote track received:', event.streams[0]);
            let remoteVideo = document.getElementById(`video-${peerId}`);
            if (!remoteVideo) {
                remoteVideo = document.createElement('video');
                remoteVideo.id = `video-${peerId}`;
                remoteVideo.autoplay = true;
                remoteVideo.playsinline = true; // For iOS compatibility
                remoteVideo.controls = true; // Show controls for testing
                if (remoteVideoContainer) remoteVideoContainer.appendChild(remoteVideo);
            }
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            } else if (event.track) {
                // Fallback for individual tracks (some browsers)
                const newStream = new MediaStream();
                newStream.addTrack(event.track);
                remoteVideo.srcObject = newStream;
            }
        };

        // Handle signaling for offer/answer
        if (isOfferer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc_offer', {
                classroomId: getCurrentClassroomId(),
                recipient_id: peerId,
                offer: pc.localDescription.toJSON()
            });
        }
        return pc;
    }

    async function joinBroadcast() {
        if (!getCurrentClassroomId()) {
            alert('Please join a classroom before joining a broadcast.');
            return;
        }
        if (!localStream) {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideo) localVideo.srcObject = localStream;
            } catch (err) {
                console.error('Error accessing media devices:', err);
                alert('Could not join broadcast. Please check your camera/microphone permissions.');
                return;
            }
        }
        alert('Attempting to join broadcast...');
        // The 'start_broadcast' event from the broadcaster will trigger the offer/answer handshake.
        // This button primarily ensures local media is ready and the user is expecting a broadcast.
    }

    function endBroadcast() {
        // Stop local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
            localStream = null;
        }

        // Close all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                // Remove remote video element
                const remoteVideo = document.getElementById(`video-${peerId}`);
                if (remoteVideo) remoteVideo.remove();
            }
        }

        // Notify others about disconnection
        const currentId = getCurrentClassroomId();
        if (currentId && activeBroadcastClassroomId[currentId]) {
            socket.emit('webrtc_peer_disconnected', { classroomId: currentId, peer_id: socket.id });
            delete activeBroadcastClassroomId[currentId]; // Mark broadcast as ended for this user
        }
        alert('Broadcast ended.');
    }

    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }
    if (joinBroadcastBtn) {
        joinBroadcastBtn.addEventListener('click', joinBroadcast);
    }
    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }


    // --- Socket.IO Event Handlers (Client-Side) ---

    // Event fired from app.js when user enters a classroom
    window.addEventListener('classroomEntered', (event) => {
        const { id, username, userId } = event.detail;
        currentClassroom = { id: id, name: document.getElementById('class-name-value').textContent }; // Update global state
        currentUser = { username: username, id: userId }; // Ensure currentUser is up-to-date

        socket.emit('join_room', { classroomId: id, username: username, userId: userId });
        console.log(`Joined Socket.IO room for classroom: ${id}`);

        // Load classroom-specific data
        loadLibraryFiles(id);
        loadAssessments(id);

        // Request whiteboard history from server
        // This is a simplified approach; in a real app, the server would maintain the history
        // and send it upon join, or a specific peer could send it.
        if (whiteboardHistory.length > 0) {
             socket.emit('whiteboard_data', {
                 classroomId: id,
                 action: 'history',
                 recipient_id: socket.id, // Send to this specific client's socket ID
                 history: whiteboardHistory
             });
        }
    });

    // Event fired from app.js when user leaves a classroom (e.g., goes to dashboard or logs out)
    window.addEventListener('classroomLeft', () => {
        const classroomId = getCurrentClassroomId();
        if (classroomId) {
            socket.emit('leave_room', { classroomId: classroomId, username: currentUser ? currentUser.username : 'Unknown' });
            console.log(`Left Socket.IO room for classroom: ${classroomId}`);
        }
        currentClassroom = null;
        clearWhiteboard(); // Clear whiteboard when leaving classroom
        endBroadcast(); // End any active broadcast
    });


    socket.on('chat_message', (data) => {
        if (chatMessagesDiv) {
            const messageElement = document.createElement('div');
            messageElement.textContent = `[${data.timestamp}] ${data.username}: ${data.message}`;
            chatMessagesDiv.appendChild(messageElement);
            chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Scroll to bottom
        }
    });

    socket.on('whiteboard_data', (data) => {
        if (data.action === 'draw') {
            drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.width, data.tool, false);
        } else if (data.action === 'clear') {
            clearWhiteboard(false);
        } else if (data.action === 'history' && data.history) {
            // Apply received history
            data.history.forEach(drawing => {
                drawLine(drawing.x1, drawing.y1, drawing.x2, drawing.y2, drawing.color, drawing.width, drawing.tool, false);
            });
        }
    });

    socket.on('participant_join', (data) => {
        console.log(`${data.username} (${data.user_id}) joined the classroom.`);
        // If this client is a broadcaster, initiate a new peer connection for the new participant
        if (activeBroadcastClassroomId[getCurrentClassroomId()] && data.user_id !== currentUser.id) {
            console.log(`Broadcaster detected new participant: ${data.username}, creating PC for them.`);
            createPeerConnection(data.user_id, true); // This client is the offerer
        } else if (data.user_id === currentUser.id && activeBroadcastClassroomId[getCurrentClassroomId()]) {
             // If I just joined and there's an active broadcast, I should receive offers
             console.log("I just joined and there's an active broadcast. Ready to receive offers.");
        }
    });

    socket.on('participant_leave', (data) => {
        console.log(`${data.username} left the classroom.`);
    });


    // WebRTC Signaling Handlers
    socket.on('webrtc_offer', async (data) => {
        // This client (answerer) receives an offer from another peer (sender_id)
        if (data.sender_id === socket.id) return; // Ignore offer from self

        if (!localStream) {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideo) localVideo.srcObject = localStream;
            } catch (err) {
                console.error('Error accessing media devices for offer:', err);
                return;
            }
        }

        const pc = await createPeerConnection(data.sender_id, false); // This client is the answerer
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc_answer', {
            classroomId: getCurrentClassroomId(),
            recipient_id: data.sender_id,
            answer: pc.localDescription.toJSON()
        });
        console.log(`Received offer from ${data.sender_id}, sent answer.`);
    });

    socket.on('webrtc_answer', async (data) => {
        // This client (offerer) receives an answer from another peer (sender_id)
        if (data.sender_id === socket.id) return; // Ignore answer from self

        const pc = peerConnections[data.sender_id];
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log(`Received answer from ${data.sender_id}.`);
        }
    });

    socket.on('webrtc_ice_candidate', async (data) => {
        // This client receives an ICE candidate from another peer (sender_id)
        if (data.sender_id === socket.id) return; // Ignore candidate from self

        const pc = peerConnections[data.sender_id];
        if (pc && data.candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log(`Added ICE candidate from ${data.sender_id}.`);
            } catch (e) {
                console.error('Error adding received ICE candidate:', e);
            }
        }
    });

    socket.on('webrtc_peer_disconnected', (data) => {
        // A peer has disconnected, clean up its connection and video
        console.log(`Peer disconnected: ${data.peer_id}`);
        if (peerConnections[data.peer_id]) {
            peerConnections[data.peer_id].close();
            delete peerConnections[data.peer_id];
        }
        const remoteVideo = document.getElementById(`video-${data.peer_id}`);
        if (remoteVideo) {
            remoteVideo.remove();
        }
    });


    // Initial setup when classroom.js loads (if user is already in a classroom)
    if (getCurrentClassroomId() && currentUser) {
        socket.emit('join_room', {
            classroomId: getCurrentClassroomId(),
            username: currentUser.username,
            userId: currentUser.id
        });
        loadLibraryFiles(getCurrentClassroomId());
        loadAssessments(getCurrentClassroomId());
    }

});
