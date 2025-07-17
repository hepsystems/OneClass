// app.js (Integrated Professional Whiteboard, Stable Drawing, Black Board, Chat History, Resized Video/Whiteboard)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const app = document.getElementById('app');
    const authSection = document.getElementById('auth-section');
    const loginContainer = document.getElementById('login-container'); // New container ID
    const registerContainer = document.getElementById('register-container'); // New container ID
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');
    const showRegisterLink = document.getElementById('show-register-link'); // New link ID
    const showLoginLink = document.getElementById('show-login-link'); // New link ID

    const dashboardSection = document.getElementById('dashboard-section');
    const classroomIdDisplay = document.getElementById('classroom-id-display');
    const currentUsernameDisplay = document.getElementById('current-username-display');
    const navDashboard = document.getElementById('nav-dashboard');
    const navClassroom = document.getElementById('nav-classroom');
    const navSettings = document.getElementById('nav-settings');
    const logoutBtn = document.getElementById('logout-btn');

    const createClassroomSection = document.getElementById('create-classroom-section'); // New: Admin-only section
    const newClassroomNameInput = document.getElementById('new-classroom-name');
    const createClassroomBtn = document.getElementById('create-classroom-btn');
    const classroomMessage = document.getElementById('classroom-message');
    const joinClassroomIdInput = document.getElementById('join-classroom-id');
    const joinClassroomBtn = document.getElementById('join-classroom-btn');
    const joinClassroomMessage = document.getElementById('join-classroom-message');
    const classroomList = document.getElementById('classroom-list');

    const classroomSection = document.getElementById('classroom-section');
    const classNameValue = document.getElementById('class-name-value'); // For displaying current classroom name
    const classCodeSpan = document.getElementById('class-code'); // For displaying current classroom ID
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    const navChat = document.getElementById('nav-chat');
    const navWhiteboard = document.getElementById('nav-whiteboard');
    const navLibrary = document.getElementById('nav-library');
    const navAssessments = document.getElementById('nav-assessments');

    const chatSection = document.getElementById('chat-section');
    const whiteboardArea = document.getElementById('whiteboard-area');
    const librarySection = document.getElementById('library-section');
    const assessmentsSection = document.getElementById('assessments-section');

    const settingsSection = document.getElementById('settings-section');
    const updateProfileForm = document.getElementById('update-profile-form');
    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email'); // Disabled email field
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');

    // Share link elements (now integrated with whiteboard save functionality)
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');

    // Chat functionality elements
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessages = document.getElementById('chat-messages');

    // Whiteboard Elements (NEW PROFESSIONAL WHITEBOARD ELEMENTS)
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const toolButtons = document.querySelectorAll('.tool-button');
    const colorPicker = document.getElementById('colorPicker');
    const brushSizeSlider = document.getElementById('brushSize');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const clearButton = document.getElementById('clearButton');
    const saveButton = document.getElementById('saveButton');
    const whiteboardRoleMessage = document.getElementById('whiteboard-role-message'); // For role-specific messages

    // Video Broadcast Elements
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastRoleMessage = document.getElementById('broadcast-role-message'); // For role-specific messages

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input'); // For admin-only visibility
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn'); // For admin-only visibility
    const libraryRoleMessage = document.getElementById('library-role-message'); // For role-specific messages

    // Assessment Elements
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionTextarea = document.getElementById('assessment-description');
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentListDiv = document.getElementById('assessment-list');
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const takeAssessmentForm = document.getElementById('take-assessment-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');
    const viewSubmissionsContainer = document.getElementById('view-submissions-container');
    const submissionsAssessmentTitle = document.getElementById('submissions-assessment-title');
    const submissionsList = document.getElementById('submissions-list');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');


    // --- Global Variables ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentAssessmentToTake = null; // Stores the assessment being taken by a student

    // WebRTC Variables
    let localStream;
    const peerConnections = {}; // Store RTCPeerConnection objects keyed by peerId (which is the remote socket.id)
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' }, // Public STUN server
            // Add TURN servers if needed for more complex network scenarios
            // { 'urls': 'turn:your-turn-server.com:3478', 'username': 'user', 'credential': 'password' }
        ]
    };

    // --- Whiteboard Variables (NEW PROFESSIONAL WHITEBOARD VARIABLES) ---
    let whiteboardCtx; // Context for the whiteboard canvas
    let isDrawing = false;
    let startX, startY; // For shapes and text
    let lastX, lastY;   // For freehand drawing (pen, eraser)
    let currentColor = colorPicker ? colorPicker.value : '#FFFFFF'; // Initialize with default white or picker value
    let currentBrushSize = brushSizeSlider ? parseInt(brushSizeSlider.value) : 5; // Default width
    let currentTool = 'pen'; // Default tool

    // Undo/Redo stacks
    const undoStack = [];
    const redoStack = [];
    const MAX_HISTORY_STEPS = 50; // Limit history to prevent excessive memory usage

    let snapshot; // To store canvas state for drawing temporary shapes (for previewing shapes)


    // --- Utility Functions ---
    function displayMessage(element, message, isError) {
        element.textContent = message;
        element.className = isError ? 'error' : 'success';
    }

    function showSection(sectionToShow) {
        [authSection, dashboardSection, classroomSection, settingsSection].forEach(section => {
            if (section) { // Check if element exists
                section.classList.add('hidden');
                section.classList.remove('active');
            }
        });
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.classList.add('active');
        }
    }

    function showClassroomSubSection(subSectionToShow) {
        [whiteboardArea, chatSection, librarySection, assessmentsSection].forEach(subSection => {
            if (subSection) {
                subSection.classList.add('hidden');
                subSection.classList.remove('active');
            }
        });
        if (subSectionToShow) {
            subSectionToShow.classList.remove('hidden');
            subSectionToShow.classList.add('active');
        }
    }

    function updateNavActiveState(activeButton) {
        [navDashboard, navClassroom, navSettings, navChat, navWhiteboard, navLibrary, navAssessments].forEach(btn => {
            if (btn) btn.classList.remove('active-nav');
        });
        if (activeButton) {
            activeButton.classList.add('active-nav');
        }
    }

    /**
     * Updates UI elements based on the current user's role.
     * Elements with `data-admin-only` are shown only for admins.
     * Elements with `data-user-only` are shown only for regular users.
     */
    function updateUIBasedOnRole() {
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isUser = currentUser && currentUser.role === 'user';

        console.log(`[UI Update] Current User Role: ${currentUser ? currentUser.role : 'N/A'}`);

        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
            el.classList.toggle('admin-feature-highlight', isAdmin);
        });

        document.querySelectorAll('[data-user-only]').forEach(el => {
            el.classList.toggle('hidden', !isUser);
            el.classList.toggle('user-view-subtle', isUser);
        });

        // Specific messages for restricted features
        if (whiteboardRoleMessage) {
            whiteboardRoleMessage.classList.toggle('hidden', isAdmin);
            whiteboardRoleMessage.textContent = isAdmin ? '' : 'Only administrators can draw on the whiteboard. Your view is read-only.';
        }
        if (broadcastRoleMessage) {
            broadcastRoleMessage.classList.toggle('hidden', isAdmin);
            broadcastRoleMessage.textContent = isAdmin ? '' : 'Only administrators can start a video broadcast.';
        }
        if (libraryRoleMessage) {
            libraryRoleMessage.classList.toggle('hidden', isAdmin);
            libraryRoleMessage.textContent = isAdmin ? '' : 'Only administrators can upload files to the library.';
        }

        // --- Crucial Fix: Ensure pointer-events is correctly set here ---
        if (whiteboardCanvas) {
            whiteboardCanvas.style.pointerEvents = isAdmin ? 'auto' : 'none';
            console.log(`[UI Update] Whiteboard Canvas pointer-events set to: ${whiteboardCanvas.style.pointerEvents} (isAdmin: ${isAdmin})`);
        }
    }

    // Function to get the display name with role tag
    function getDisplayName(username, role) {
        return role === 'admin' ? `${username} (Admin)` : username;
    }


    async function loadUserClassrooms() {
        if (!currentUser || !currentUser.id) {
            console.warn("No current user to load classrooms for.");
            classroomList.innerHTML = '<li>Please log in to see your classrooms.</li>';
            return;
        }
        try {
            const response = await fetch('/api/classrooms');
            const classrooms = await response.json();
            classroomList.innerHTML = ''; // Clear previous list
            if (classrooms.length === 0) {
                classroomList.innerHTML = '<li>No classrooms found. Create one or join!</li>';
            } else {
                classrooms.forEach(classroom => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${classroom.name} (ID: ${classroom.id})</span>
                        <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" class="go-to-classroom-btn">Go to Classroom</button>
                    `;
                    classroomList.appendChild(li);
                });

                document.querySelectorAll('.go-to-classroom-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.dataset.classroomId;
                        const name = e.target.dataset.classroomName;
                        enterClassroom(id, name);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
            classroomList.innerHTML = '<li>Failed to load classrooms.</li>';
        }
    }

    function enterClassroom(id, name) {
        currentClassroom = { id: id, name: name };
        localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom));
        classroomIdDisplay.textContent = id; // Update dashboard display
        classNameValue.textContent = name; // Update classroom section display
        classCodeSpan.textContent = id; // Update classroom section display

        showSection(classroomSection);
        showClassroomSubSection(whiteboardArea); // Default to whiteboard
        updateNavActiveState(navWhiteboard); // Update active nav button

        // Apply role-based UI immediately upon entering classroom
        updateUIBasedOnRole(); // This will handle whiteboard pointer-events

        // --- Direct calls to merged classroom functionality ---
        initializeSocketIO();
        setupWhiteboardControls(); // Ensure whiteboard controls are set up
        
        // Reset broadcast buttons state based on role
        if (currentUser && currentUser.role === 'admin') {
            if (startBroadcastBtn) startBroadcastBtn.disabled = false;
            if (endBroadcastBtn) endBroadcastBtn.disabled = true;
        } else {
            // Hide broadcast buttons for non-admins
            if (startBroadcastBtn) startBroadcastBtn.classList.add('hidden');
            if (endBroadcastBtn) endBroadcastBtn.classList.add('hidden');
        }


        // Hide share link display when entering a new classroom
        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';

        // Load assessments when entering classroom
        loadAssessments();
        loadLibraryFiles(); // Load library files
    }

    // --- Socket.IO Initialization ---
    function initializeSocketIO() {
        if (socket) {
            socket.disconnect(); // Ensure previous connection is closed
        }
        socket = io(); // Connect to the Socket.IO server

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected. SID:', socket.id);
            if (currentClassroom && currentClassroom.id) {
                socket.emit('join', { 'classroomId': currentClassroom.id, 'role': currentUser.role });
            } else {
                console.error('[Socket.IO] Cannot join classroom: currentClassroom.id is undefined.');
            }
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO] Disconnected');
            // Clean up WebRTC peer connections on disconnect
            for (const peerId in peerConnections) {
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
            }
            // Also explicitly remove remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        });

        socket.on('status', (data) => {
            console.log('[Socket.IO] Server Status:', data.message);
        });

        socket.on('message', (data) => {
            console.log('[Chat] Received Message:', data);
            const messageElement = document.createElement('div');
            // Display username with (Admin) tag if applicable
            const senderDisplayName = getDisplayName(data.username, data.role);
            messageElement.textContent = `${senderDisplayName} (${data.timestamp}): ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        });

        // --- Chat History Listener (NEW) ---
        socket.on('chat_history', (history) => {
            console.log('[Chat] Received chat history. Items:', history.length);
            chatMessages.innerHTML = ''; // Clear current messages before loading history
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                const senderDisplayName = getDisplayName(msg.username, msg.role);
                // Format timestamp from ISO string to local time
                const date = new Date(msg.timestamp);
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                messageElement.textContent = `${senderDisplayName} (${formattedTime}): ${msg.message}`;
                chatMessages.appendChild(messageElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        });


        socket.on('user_joined', (data) => {
            console.log(`[Socket.IO] ${data.username} (${data.sid}) has joined the classroom.`);
            const statusMessage = document.createElement('div');
            // Display username with (Admin) tag if applicable
            const joinedDisplayName = getDisplayName(data.username, data.role);
            statusMessage.textContent = `${joinedDisplayName} has joined the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // If I am the admin broadcaster and have a local stream,
            // create an offer for the new participant's SID
            if (localStream && localStream.active && currentUser && currentUser.role === 'admin' && data.sid !== socket.id) {
                console.log(`[WebRTC] Admin broadcasting. Creating offer for new peer: ${data.sid}`);
                createPeerConnection(data.sid, true); // true indicates caller (initiating offer)
            }
        });

        socket.on('user_left', (data) => {
            console.log(`[Socket.IO] ${data.username} (${data.sid}) has left the classroom.`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has left the classroom.`; // Role not available here, so no tag
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            const peerId = data.sid;
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
                }
            }
        });

        // --- Whiteboard Socket.IO Handlers (UPDATED) ---
        socket.on('whiteboard_data', (data) => {
            if (data.action === 'draw') {
                // Ensure the context is available before drawing
                if (!whiteboardCtx) {
                    console.warn('[Whiteboard] Cannot draw: whiteboardCtx is null when receiving draw data.');
                    return;
                }
                // Apply received drawing action
                const { tool, startX, startY, endX, endY, color, width, text } = data.data;

                // Temporarily set context properties for drawing received data
                const originalStrokeStyle = whiteboardCtx.strokeStyle;
                const originalLineWidth = whiteboardCtx.lineWidth;
                const originalFillStyle = whiteboardCtx.fillStyle;
                const originalGlobalCompositeOperation = whiteboardCtx.globalCompositeOperation;

                whiteboardCtx.strokeStyle = color;
                whiteboardCtx.lineWidth = width;
                whiteboardCtx.fillStyle = color; // For text

                if (tool === 'eraser') {
                    whiteboardCtx.globalCompositeOperation = 'destination-out';
                } else {
                    whiteboardCtx.globalCompositeOperation = 'source-over';
                }

                switch (tool) {
                    case 'pen':
                    case 'eraser':
                        // For pen/eraser, data comes as segments.
                        // The server sends individual segments, so draw each as a line.
                        // If we were sending full paths, this would be different.
                        // For stability, ensure a path is always started and stroked.
                        whiteboardCtx.beginPath();
                        whiteboardCtx.moveTo(startX, startY);
                        whiteboardCtx.lineTo(endX, endY);
                        whiteboardCtx.stroke();
                        break;
                    case 'line':
                        whiteboardCtx.beginPath();
                        whiteboardCtx.moveTo(startX, startY);
                        whiteboardCtx.lineTo(endX, endY);
                        whiteboardCtx.stroke();
                        break;
                    case 'rectangle':
                        whiteboardCtx.beginPath();
                        whiteboardCtx.rect(startX, startY, endX - startX, endY - startY);
                        whiteboardCtx.stroke();
                        break;
                    case 'circle':
                        const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                        whiteboardCtx.beginPath();
                        whiteboardCtx.arc(startX, startY, radius, 0, Math.PI * 2);
                        whiteboardCtx.stroke();
                        break;
                    case 'text':
                        whiteboardCtx.font = `${width * 2}px Inter, sans-serif`; // Use width as base for font size
                        whiteboardCtx.fillText(text, startX, startY);
                        break;
                }

                // Restore original context properties
                whiteboardCtx.strokeStyle = originalStrokeStyle;
                whiteboardCtx.lineWidth = originalLineWidth;
                whiteboardCtx.fillStyle = originalFillStyle;
                whiteboardCtx.globalCompositeOperation = originalGlobalCompositeOperation;

            } else if (data.action === 'clear') {
                console.log('[Whiteboard] Received clear command.');
                if (whiteboardCtx) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    // Fill with black after clearing
                    whiteboardCtx.fillStyle = '#000000';
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
            } else if (data.action === 'history' && data.data) {
                // Redraw history for new participants
                console.log('[Whiteboard] Receiving history. Items:', data.data.length);
                // Clear current canvas before redrawing history
                if (whiteboardCtx) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000'; // Ensure background is black
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }

                data.data.forEach(drawCommand => {
                    if (drawCommand.action === 'draw' && drawCommand.data) {
                        const { tool, startX, startY, endX, endY, color, width, text } = drawCommand.data;

                        // Temporarily set context properties for drawing history
                        const originalStrokeStyle = whiteboardCtx.strokeStyle;
                        const originalLineWidth = whiteboardCtx.lineWidth;
                        const originalFillStyle = whiteboardCtx.fillStyle;
                        const originalGlobalCompositeOperation = whiteboardCtx.globalCompositeOperation;

                        whiteboardCtx.strokeStyle = color;
                        whiteboardCtx.lineWidth = width;
                        whiteboardCtx.fillStyle = color; // For text

                        if (tool === 'eraser') {
                            whiteboardCtx.globalCompositeOperation = 'destination-out';
                        } else {
                            whiteboardCtx.globalCompositeOperation = 'source-over';
                        }

                        switch (tool) {
                            case 'pen':
                            case 'eraser':
                                // For historical pen/eraser data, draw as individual line segments
                                whiteboardCtx.beginPath();
                                whiteboardCtx.moveTo(startX, startY);
                                whiteboardCtx.lineTo(endX, endY);
                                whiteboardCtx.stroke();
                                break;
                            case 'line':
                                whiteboardCtx.beginPath();
                                whiteboardCtx.moveTo(startX, startY);
                                whiteboardCtx.lineTo(endX, endY);
                                whiteboardCtx.stroke();
                                break;
                            case 'rectangle':
                                whiteboardCtx.beginPath();
                                whiteboardCtx.rect(startX, startY, endX - startX, endY - startY);
                                whiteboardCtx.stroke();
                                break;
                            case 'circle':
                                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                                whiteboardCtx.beginPath();
                                whiteboardCtx.arc(startX, startY, radius, 0, Math.PI * 2);
                                whiteboardCtx.stroke();
                                break;
                            case 'text':
                                whiteboardCtx.font = `${width * 2}px Inter, sans-serif`;
                                whiteboardCtx.fillText(text, startX, startY);
                                break;
                        }
                        // Restore original context properties after drawing each history item
                        whiteboardCtx.strokeStyle = originalStrokeStyle;
                        whiteboardCtx.lineWidth = originalLineWidth;
                        whiteboardCtx.fillStyle = originalFillStyle;
                        whiteboardCtx.globalCompositeOperation = originalGlobalCompositeOperation;
                    }
                });
            }
        });

        // --- WebRTC Socket.IO Handlers ---
        socket.on('webrtc_offer', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore offer from self
            console.log('[WebRTC] Received WebRTC Offer from:', data.sender_id);

            const peerId = data.sender_id;
            if (!peerConnections[peerId]) {
                // Create PC if it doesn't exist. This is the receiver, so isCaller is false.
                createPeerConnection(peerId, false);
            }

            // Ensure local stream is acquired if not already (for receiving)
            if (!localStream) {
                try {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    localVideo.srcObject = localStream;
                    console.log("[WebRTC] Acquired local stream for receiving.");
                    // If we acquired stream after peer connection created, add tracks now
                    if (peerConnections[peerId] && !peerConnections[peerId].getLocalStreams().length) {
                         localStream.getTracks().forEach(track => peerConnections[peerId].addTrack(track, localStream));
                    }
                } catch (err) {
                    console.error("[WebRTC] Error acquiring local stream for receiving:", err);
                    alert("Could not access camera/microphone for video call. Receiving might be affected.");
                }
            } else {
                 if (peerConnections[peerId] && !peerConnections[peerId].getLocalStreams().length) {
                    localStream.getTracks().forEach(track => peerConnections[peerId].addTrack(track, localStream));
                 }
            }

            try {
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnections[peerId].createAnswer();
                await peerConnections[peerId].setLocalDescription(answer);
                socket.emit('webrtc_answer', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId, // Send answer back to the offerer
                    answer: peerConnections[peerId].localDescription
                });
                console.log('[WebRTC] Sent WebRTC Answer to:', peerId);
            } catch (error) {
                console.error('[WebRTC] Error handling offer:', error);
            }
        });

        socket.on('webrtc_answer', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore answer from self
            console.log('[WebRTC] Received WebRTC Answer from:', data.sender_id);
            const peerId = data.sender_id;
            if (peerConnections[peerId]) {
                try {
                    await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (error) {
                    console.error('[WebRTC] Error handling answer:', error);
                }
            }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore candidate from self
            console.log('[WebRTC] Received ICE Candidate from:', data.sender_id);
            const peerId = data.sender_id;
            if (peerConnections[peerId] && data.candidate) { // Ensure candidate is not null
                try {
                    await peerConnections[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (error) {
                    if (!error.message.includes('wrong state') && !error.message.includes('remote answer sdp')) {
                        console.error('[WebRTC] Error adding ICE candidate:', error);
                    }
                }
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            console.log('[WebRTC] Peer disconnected signal received:', data.peer_id);
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

    function checkLoginStatus() {
        if (currentUser) {
            showSection(dashboardSection);
            // Display username with (Admin) tag if applicable
            currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
            classroomIdDisplay.textContent = currentClassroom ? currentClassroom.id : 'N/A';
            loadUserClassrooms();
            updateNavActiveState(navDashboard);
            updateUIBasedOnRole(); // Apply role-based UI on dashboard load

            // Handle direct classroom link access (e.g., /classroom/<id>)
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                const idFromUrl = pathParts[2];
                // Fetch classroom details to get the correct name
                fetch(`/api/classrooms`)
                    .then(res => res.json())
                    .then(classrooms => {
                        const matched = classrooms.find(cls => cls.id === idFromUrl);
                        if (matched) {
                            enterClassroom(matched.id, matched.name);
                        } else {
                            // If classroom not found, clear currentClassroom and show dashboard
                            localStorage.removeItem('currentClassroom');
                            currentClassroom = null;
                            alert("Classroom not found or not joined yet.");
                            showSection(dashboardSection);
                            loadUserClassrooms(); // Reload classrooms for the user
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching classroom details:", err);
                        alert("Could not load classroom.");
                        showSection(dashboardSection); // Fallback to dashboard on error
                        loadUserClassrooms();
                    });
            }
        } else {
            showSection(authSection);
            // Ensure no role-specific elements are visible if not logged in
            document.querySelectorAll('[data-admin-only], [data-user-only]').forEach(el => {
                el.classList.add('hidden');
            });
        }
    }

    // --- Authentication Section (Login/Register Form Toggling) ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear messages
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear messages
        });
    }

    // --- Event Listeners ---

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    displayMessage(authMessage, result.message, false);
                    checkLoginStatus(); // Navigate to dashboard and apply role-based UI
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during login:', error);
                displayMessage(authMessage, 'An error occurred during login.', true);
            }
        });
    }

    // Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value; // Get the selected role

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role }) // Include role in the request
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(authMessage, result.message + " Please log in.", false);
                    registerForm.reset(); // Clear form
                    // Optionally switch to login form
                    loginContainer.classList.remove('hidden');
                    registerContainer.classList.add('hidden');
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                displayMessage(authMessage, 'An error occurred during registration.', true);
            }
        });
    }

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentClassroom');
                    currentUser = null;
                    currentClassroom = null;
                    showSection(authSection);
                    // --- Direct calls for cleanup ---
                    if (socket && currentClassroom && currentClassroom.id) {
                        socket.emit('leave', { 'classroomId': currentClassroom.id });
                        socket.disconnect(); // Disconnect the socket regardless
                        socket = null;
                    } else if (socket) { // If currentClassroom is null but socket exists, just disconnect
                        socket.disconnect();
                        socket = null;
                    }
                    endBroadcast(); // Clean up broadcast related resources
                    // Clear whiteboard canvas
                    if (whiteboardCtx && whiteboardCanvas) {
                        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                        whiteboardCtx.fillStyle = '#000000'; // Fill with black on logout
                        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    }
                    // Hide all role-specific controls on logout
                    document.querySelectorAll('[data-admin-only], [data-user-only]').forEach(el => {
                        el.classList.add('hidden');
                        el.classList.remove('admin-feature-highlight', 'user-view-subtle');
                    });
                    // Clear role messages
                    document.querySelectorAll('.role-message').forEach(msg => {
                        msg.classList.add('hidden');
                        msg.textContent = '';
                    });

                    // Clear chat messages
                    if (chatMessages) chatMessages.innerHTML = '';
                    // Clear remote videos
                    if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
                } else {
                    alert('Failed to logout.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }

    // Create Classroom Button
    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            const classroomName = newClassroomNameInput.value;
            if (!classroomName) {
                displayMessage(classroomMessage, 'Please enter a classroom name.', true);
                return;
            }
            if (currentUser.role !== 'admin') {
                displayMessage(classroomMessage, 'Only administrators can create classrooms.', true);
                return;
            }

            try {
                const response = await fetch('/api/create-classroom', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: classroomName })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(classroomMessage, result.message, false);
                    newClassroomNameInput.value = ''; // Clear input
                    loadUserClassrooms(); // Reload list
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred.', true);
            }
        });
    }

    // Join Classroom Button
    if (joinClassroomBtn) {
        joinClassroomBtn.addEventListener('click', async () => {
            const classroomId = joinClassroomIdInput.value;
            if (!classroomId) {
                displayMessage(joinClassroomMessage, 'Please enter a classroom ID.', true);
                return;
            }

            try {
                const response = await fetch('/api/join-classroom', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ classroomId: classroomId })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(joinClassroomMessage, result.message, false);
                    joinClassroomIdInput.value = ''; // Clear input
                    loadUserClassrooms(); // Reload list
                    // If successfully joined, automatically enter the classroom
                    if (result.classroom && result.classroom.id) {
                         enterClassroom(result.classroom.id, result.classroom.name);
                    }
                } else {
                    displayMessage(joinClassroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error joining classroom:', error);
                displayMessage(joinClassroomMessage, 'An error occurred.', true);
            }
        });
    }

    // Dashboard Navigation
    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadUserClassrooms();
            updateUIBasedOnRole(); // Re-apply role-based UI for dashboard
            // --- Direct calls for cleanup ---
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('leave', { 'classroomId': currentClassroom.id });
                socket.disconnect();
                socket = null;
            } else if (socket) {
                socket.disconnect();
                socket = null;
            }
            endBroadcast(); // Clean up broadcast related resources
            // Clear whiteboard canvas
            if (whiteboardCtx && whiteboardCanvas) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.fillStyle = '#000000'; // Fill with black on navigation
                whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
            // Clear chat messages
            if (chatMessages) chatMessages.innerHTML = '';
            // Clear remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        });
    }

    // Nav to Classroom (from Dashboard)
    if (navClassroom) {
        navClassroom.addEventListener('click', () => {
            if (currentClassroom && currentClassroom.id) {
                enterClassroom(currentClassroom.id, currentClassroom.name);
            } else {
                alert('Please create or join a classroom first!');
            }
        });
    }

    // Nav to Settings
    if (navSettings) {
        navSettings.addEventListener('click', () => {
            showSection(settingsSection);
            updateNavActiveState(navSettings);
            if (currentUser) {
                settingsUsernameInput.value = currentUser.username;
                settingsEmailInput.value = currentUser.email;
            }
            // --- Direct calls for cleanup ---
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('leave', { 'classroomId': currentClassroom.id });
                socket.disconnect();
                socket = null;
            } else if (socket) {
                socket.disconnect();
                socket = null;
            }
            endBroadcast(); // Clean up broadcast related resources
            // Clear whiteboard canvas
            if (whiteboardCtx && whiteboardCanvas) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.fillStyle = '#000000'; // Fill with black on navigation
                whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
            // Clear chat messages
            if (chatMessages) chatMessages.innerHTML = '';
            // Clear remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        });
    }

    // Back to Dashboard from Classroom
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadUserClassrooms();
            updateUIBasedOnRole(); // Re-apply role-based UI for dashboard
            // --- Direct calls for cleanup ---
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('leave', { 'classroomId': currentClassroom.id });
                socket.disconnect();
                socket = null;
            } else if (socket) {
                socket.disconnect();
                socket = null;
            }
            endBroadcast(); // Clean up broadcast related resources
            // Clear whiteboard canvas
            if (whiteboardCtx && whiteboardCanvas) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.fillStyle = '#000000'; // Fill with black on navigation
                whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
            // Clear chat messages
            if (chatMessages) chatMessages.innerHTML = '';
            // Clear remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
            currentClassroom = null; // Clear current classroom state
            localStorage.removeItem('currentClassroom');
        });
    }

    // Back to Dashboard from Settings
    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadUserClassrooms();
            updateUIBasedOnRole(); // Re-apply role-based UI for dashboard
        });
    }

    // Classroom Sub-section Navigation
    if (navChat) {
        navChat.addEventListener('click', () => { showClassroomSubSection(chatSection); updateNavActiveState(navChat); });
    }
    if (navWhiteboard) {
        navWhiteboard.addEventListener('click', () => { showClassroomSubSection(whiteboardArea); updateNavActiveState(navWhiteboard); });
    }
    if (navLibrary) {
        navLibrary.addEventListener('click', () => { showClassroomSubSection(librarySection); updateNavActiveState(navLibrary); loadLibraryFiles(); });
    }
    if (navAssessments) {
        navAssessments.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            updateNavActiveState(navAssessments);
            loadAssessments(); // Load assessments when navigating to this section
        });
    }

    // Update Profile
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = settingsUsernameInput.value;

            if (!username) {
                alert('Username cannot be empty.');
                return;
            }

            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    currentUser.username = username; // Update local user object
                    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Update local storage
                    // Update dashboard display with new username and role tag
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                } else {
                    alert('Error updating profile: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('An error occurred during profile update.');
            }
        });
    }

    // --- Share Classroom Link (now separate from whiteboard save) ---
    // The share link button is still present in index.html, but moved outside the whiteboard toolbar
    // and its functionality remains the same.
    // This is the original logic from your provided app.js for the share link.
    const shareWhiteboardBtn = document.getElementById('share-whiteboard-btn'); // This ID is now unused in the new HTML structure

    if (shareLinkDisplay && shareLinkInput && copyShareLinkBtn) { // Check if elements exist
        // The share button is now removed from the whiteboard toolbar.
        // If you want a general "Get Share Link" for the classroom, you'd need a separate button outside the whiteboard toolbar.
        // For now, I'm assuming the save functionality is separate from getting a classroom share link.
        // If you still want a "Get Share Link" button for the classroom, you'll need to add it back to index.html outside the new whiteboard toolbar.
        // For now, the old shareWhiteboardBtn will be removed.
    }

    if (copyShareLinkBtn) { // This button is still in index.html, but now its functionality is standalone.
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select(); // Select the text in the input field
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy'); // Copy the text
            alert('Link copied to clipboard!');
        });
    }


    // --- Chat Functionality ---
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && socket && currentClassroom && currentClassroom.id) {
                socket.emit('message', {
                    classroomId: currentClassroom.id,
                    message: message,
                    username: currentUser.username,
                    role: currentUser.role // Include sender's role
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


    // --- Whiteboard Functionality (NEW PROFESSIONAL WHITEBOARD LOGIC) ---
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
             console.warn("[Whiteboard] Canvas element not found. Whiteboard controls not set up.");
             return;
        }
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        if (!whiteboardCtx) {
            console.error("[Whiteboard] 2D context failed to initialize. Whiteboard will not function.");
            return;
        }
        console.log("[Whiteboard] Whiteboard context initialized:", whiteboardCtx);

        // Set initial drawing properties for the context
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.fillStyle = currentColor; // For shapes and text

        /**
         * Adjusts the canvas dimensions to fit its parent container while maintaining aspect ratio.
         * This function is called on window load and resize to ensure responsiveness.
         * It also preserves the drawing content.
         */
        function resizeCanvas() {
            const container = whiteboardCanvas.parentElement; // Use whiteboardCanvas.parentElement directly
            // Get the current content of the canvas before resizing
            const imageData = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

            // Set canvas dimensions to be responsive within its container
            const aspectRatio = 1200 / 800; // UPDATED Aspect ratio for 1200x800
            let newWidth = container.clientWidth - 40; // Account for padding/margins of container
            let newHeight = newWidth / aspectRatio;

            // If height exceeds available space, adjust based on height
            // Allow it to take up more vertical space, e.g., 90% of viewport height
            if (newHeight > window.innerHeight * 0.9) {
                newHeight = window.innerHeight * 0.9;
                newWidth = newHeight * aspectRatio;
            }

            // Ensure minimum dimensions if needed, or just let it scale down
            whiteboardCanvas.width = Math.max(newWidth, 300); // Minimum width
            whiteboardCanvas.height = Math.max(newHeight, 200); // Minimum height

            // Restore the saved content after resizing
            whiteboardCtx.putImageData(imageData, 0, 0);

            // Reapply drawing styles after resizing, as context state can be reset
            whiteboardCtx.lineJoin = 'round';
            whiteboardCtx.lineCap = 'round';
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.fillStyle = currentColor;
            console.log(`[Whiteboard] Canvas resized to: ${whiteboardCanvas.width}x${whiteboardCanvas.height}`);
        }

        /**
         * Saves the current canvas state to the undo stack.
         * Clears the redo stack when a new state is saved.
         */
        function saveState() {
            // If the undo stack is at its limit, remove the oldest state
            if (undoStack.length >= MAX_HISTORY_STEPS) {
                undoStack.shift(); // Remove the first element
            }
            undoStack.push(whiteboardCanvas.toDataURL());
            redoStack.length = 0; // Clear redo stack on new action
            updateUndoRedoButtons();
            console.log(`[Whiteboard History] State saved. Undo stack size: ${undoStack.length}`);
        }

        /**
         * Loads a canvas state from a data URL.
         * @param {string} dataURL - The data URL of the canvas image.
         */
        function loadState(dataURL) {
            const img = new Image();
            img.onload = () => {
                // To ensure the background remains black, fill it before drawing the image
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.fillStyle = '#000000'; // Fill with black
                whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.drawImage(img, 0, 0, whiteboardCanvas.width, whiteboardCanvas.height); // Draw the saved image
                console.log('[Whiteboard History] State loaded from history.');
            };
            img.src = dataURL;
        }

        /**
         * Performs an undo operation by loading the previous state from the undo stack.
         */
        function undo() {
            if (undoStack.length > 1) { // Keep at least one state (the initial blank canvas)
                const lastState = undoStack.pop();
                redoStack.push(lastState);
                loadState(undoStack[undoStack.length - 1]);
                console.log(`[Whiteboard History] Undo performed. Undo stack size: ${undoStack.length}, Redo stack size: ${redoStack.length}`);
            } else if (undoStack.length === 1) { // If only initial state left, clear canvas
                const lastState = undoStack.pop();
                redoStack.push(lastState);
                clearCanvas(false); // Clear without saving a new state
                console.log('[Whiteboard History] Undo to initial blank state.');
            }
            updateUndoRedoButtons();
        }

        /**
         * Performs a redo operation by loading the next state from the redo stack.
         */
        function redo() {
            if (redoStack.length > 0) {
                const nextState = redoStack.pop();
                undoStack.push(nextState);
                loadState(nextState);
                console.log(`[Whiteboard History] Redo performed. Undo stack size: ${undoStack.length}, Redo stack size: ${redoStack.length}`);
            }
            updateUndoRedoButtons();
        }

        /**
         * Updates the enabled/disabled state of the undo and redo buttons.
         */
        function updateUndoRedoButtons() {
            if (undoButton) undoButton.disabled = undoStack.length <= 1; // Disable if only initial state or less
            if (redoButton) redoButton.disabled = redoStack.length === 0;
        }

        /**
         * Gets the mouse/touch coordinates relative to the canvas.
         * @param {MouseEvent|TouchEvent} e - The event object.
         * @returns {object} An object with x and y coordinates.
         */
        function getCoords(e) {
            const rect = whiteboardCanvas.getBoundingClientRect();
            let clientX, clientY;

            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }

            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        /**
         * Handles the start of a drawing action (mousedown or touchstart).
         * @param {MouseEvent|TouchEvent} e - The event object.
         */
        function handleMouseDown(e) {
            if (currentUser.role !== 'admin') {
                console.log("[Whiteboard] Non-admin attempted drawing. Blocked.");
                return; // Block non-admins from drawing
            }
            isDrawing = true;
            const coords = getCoords(e);
            startX = coords.x;
            startY = coords.y;
            lastX = coords.x; // Initialize lastX, lastY for pen/eraser

            // Save the current canvas state for temporary drawing (e.g., shapes)
            snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

            if (currentTool === 'pen' || currentTool === 'eraser') {
                whiteboardCtx.beginPath(); // Start a new path for the continuous stroke
                whiteboardCtx.moveTo(startX, startY); // Move to the initial point of the stroke
            } else if (currentTool === 'text') {
                const textInput = prompt("Enter text:");
                if (textInput !== null && textInput.trim() !== '') {
                    // Draw text locally
                    whiteboardCtx.font = `${currentBrushSize * 2}px Inter, sans-serif`; // Text size based on brush size
                    whiteboardCtx.fillText(textInput, startX, startY);
                    saveState(); // Save state after text is drawn

                    // Emit text data to server
                    socket.emit('whiteboard_data', {
                        action: 'draw',
                        classroomId: currentClassroom.id,
                        tool: 'text',
                        data: {
                            startX: startX,
                            startY: startY,
                            text: textInput,
                            color: currentColor,
                            width: currentBrushSize // Use brush size for font size
                        }
                    });
                }
                isDrawing = false; // Text tool is a click-and-type action, not drag
            }
            console.log(`[Whiteboard] Mouse/Touch DOWN at (${startX}, ${startY}) for tool: ${currentTool}`);
        }

        /**
         * Handles the movement during a drawing action (mousemove or touchmove).
         * @param {MouseEvent|TouchEvent} e - The event object.
         */
        function handleMouseMove(e) {
            if (!isDrawing || currentUser.role !== 'admin' || currentTool === 'text') return;

            e.preventDefault(); // Prevent scrolling on touch devices while drawing

            const coords = getCoords(e);
            const currentX = coords.x;
            const currentY = coords.y;

            if (currentTool === 'pen' || currentTool === 'eraser') {
                if (currentTool === 'eraser') {
                    whiteboardCtx.globalCompositeOperation = 'destination-out'; // Erase by drawing transparent
                } else {
                    whiteboardCtx.globalCompositeOperation = 'source-over'; // Ensure drawing mode
                }
                whiteboardCtx.lineTo(currentX, currentY);
                whiteboardCtx.stroke();

                // Emit drawing data for pen/eraser segments
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroom.id,
                    tool: currentTool,
                    data: {
                        startX: lastX, // Previous point
                        startY: lastY,
                        endX: currentX, // Current point
                        endY: currentY,
                        color: currentColor,
                        width: currentBrushSize
                    }
                });
                lastX = currentX; // Update lastX, lastY for the next segment
                lastY = currentY;
            } else {
                // For shapes, restore snapshot and redraw preview
                whiteboardCtx.putImageData(snapshot, 0, 0);
                switch (currentTool) {
                    case 'line':
                        drawLineLocal(startX, startY, currentX, currentY);
                        break;
                    case 'rectangle':
                        drawRectangleLocal(startX, startY, currentX, currentY);
                        break;
                    case 'circle':
                        drawCircleLocal(startX, startY, currentX, currentY);
                        break;
                }
            }
        }

        /**
         * Handles the end of a drawing action (mouseup or touchend).
         */
        function handleMouseUp(e) {
            if (!isDrawing || currentUser.role !== 'admin') return;
            isDrawing = false;
            console.log(`[Whiteboard] Mouse/Touch UP. Drawing stopped for tool: ${currentTool}`);


            // For shapes, draw the final shape after restoring snapshot and then save state
            if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
                whiteboardCtx.putImageData(snapshot, 0, 0); // Restore to draw final shape cleanly
                const finalCoords = getCoords(e); // Get final mouse position
                const currentX = finalCoords.x;
                const currentY = finalCoords.y;

                switch (currentTool) {
                    case 'line':
                        drawLineLocal(startX, startY, currentX, currentY);
                        break;
                    case 'rectangle':
                        drawRectangleLocal(startX, startY, currentX, currentY);
                        break;
                    case 'circle':
                        drawCircleLocal(startX, startY, currentX, currentY);
                        break;
                }
                // Emit final shape data
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroom.id,
                    tool: currentTool,
                    data: {
                        startX: startX,
                        startY: startY,
                        endX: currentX,
                        endY: currentY,
                        color: currentColor,
                        width: currentBrushSize
                    }
                });
            }

            // Reset globalCompositeOperation for eraser after the stroke is complete
            if (whiteboardCtx.globalCompositeOperation === 'destination-out') {
                whiteboardCtx.globalCompositeOperation = 'source-over';
            }

            // Save state after a complete drawing action (for all tools except text, which saves immediately)
            if (currentTool !== 'text') {
                saveState();
            }
        }

        /**
         * Draws a line locally on the canvas.
         * @param {number} x1 - Start X.
         * @param {number} y1 - Start Y.
         * @param {number} x2 - End X.
         * @param {number} y2 - End Y.
         */
        function drawLineLocal(x1, y1, x2, y2) {
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(x1, y1);
            whiteboardCtx.lineTo(x2, y2);
            whiteboardCtx.stroke();
        }

        /**
         * Draws a rectangle locally on the canvas.
         * @param {number} x1 - Start X.
         * @param {number} y1 - Start Y.
         * @param {number} x2 - End X.
         * @param {number} y2 - End Y.
         */
        function drawRectangleLocal(x1, y1, x2, y2) {
            const width = x2 - x1;
            const height = y2 - y1;
            whiteboardCtx.beginPath();
            whiteboardCtx.rect(x1, y1, width, height);
            whiteboardCtx.stroke();
        }

        /**
         * Draws a circle locally on the canvas.
         * @param {number} x1 - Start X (center).
         * @param {number} y1 - Start Y (center).
         * @param {number} x2 - End X (defines radius).
         * @param {number} y2 - End Y (defines radius).
         */
        function drawCircleLocal(x1, y1, x2, y2) {
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(x1, y1, radius, 0, Math.PI * 2);
            whiteboardCtx.stroke();
        }

        /**
         * Changes the active tool and updates button styling.
         * @param {string} tool - The tool to activate (e.g., 'pen', 'eraser').
         */
        function selectTool(tool) {
            currentTool = tool;
            toolButtons.forEach(button => {
                if (button.dataset.tool === tool) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
            // Reset globalCompositeOperation when changing from eraser
            if (whiteboardCtx.globalCompositeOperation === 'destination-out' && tool !== 'eraser') {
                whiteboardCtx.globalCompositeOperation = 'source-over';
            }
            console.log(`[Whiteboard] Tool selected: ${currentTool}`);
        }

        /**
         * Updates the drawing color.
         */
        function updateColor() {
            currentColor = colorPicker.value;
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.fillStyle = currentColor;
            console.log(`[Whiteboard] Color updated to: ${currentColor}`);
        }

        /**
         * Updates the brush/stroke size.
         */
        function updateBrushSize() {
            currentBrushSize = parseInt(brushSizeSlider.value);
            whiteboardCtx.lineWidth = currentBrushSize;
            console.log(`[Whiteboard] Brush size updated to: ${currentBrushSize}`);
        }

        /**
         * Clears the entire canvas and saves the new blank state.
         * @param {boolean} [save=true] - Whether to save the cleared state to history.
         */
        function clearCanvas(save = true) {
            if (currentUser.role !== 'admin') {
                alert("Only administrators can clear the whiteboard.");
                return;
            }
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            // After clearing, explicitly fill the canvas with black
            whiteboardCtx.fillStyle = '#000000';
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            if (save) {
                saveState();
                // Emit clear action to server
                socket.emit('whiteboard_data', { action: 'clear', classroomId: currentClassroom.id });
                console.log('[Whiteboard] Clear command emitted to server.');
            }
            console.log('[Whiteboard] Canvas cleared locally.');
        }

        /**
         * Saves the current canvas content as a PNG image.
         */
        function saveImage() {
            if (currentUser.role !== 'admin') {
                alert("Only administrators can save the whiteboard image.");
                return;
            }
            const dataURL = whiteboardCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = 'whiteboard-drawing.png';
            document.body.appendChild(a); // Required for Firefox
            a.click();
            document.body.removeChild(a); // Clean up
            console.log('[Whiteboard] Image saved.');
        }

        // --- Event Listeners for NEW Whiteboard Controls ---
        if (whiteboardCanvas) {
            whiteboardCanvas.addEventListener('mousedown', handleMouseDown);
            whiteboardCanvas.addEventListener('mousemove', handleMouseMove);
            whiteboardCanvas.addEventListener('mouseup', handleMouseUp);
            whiteboardCanvas.addEventListener('mouseout', handleMouseUp); // End drawing if mouse leaves canvas

            whiteboardCanvas.addEventListener('touchstart', handleMouseDown, { passive: false });
            whiteboardCanvas.addEventListener('touchmove', handleMouseMove, { passive: false });
            whiteboardCanvas.addEventListener('touchend', handleMouseUp);
            whiteboardCanvas.addEventListener('touchcancel', handleMouseUp);
        }

        if (toolButtons) {
            toolButtons.forEach(button => {
                button.addEventListener('click', () => selectTool(button.dataset.tool));
            });
        }

        if (colorPicker) {
            colorPicker.addEventListener('input', updateColor);
        }

        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', updateBrushSize);
        }

        if (undoButton) {
            undoButton.addEventListener('click', undo);
        }

        if (redoButton) {
            redoButton.addEventListener('click', redo);
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => clearCanvas(true)); // Pass true to save state
        }

        if (saveButton) {
            saveButton.addEventListener('click', saveImage);
        }

        // Initial canvas sizing and history setup
        resizeCanvas();
        clearCanvas(false); // Clear and fill with black initially, but don't save to undo stack yet
        saveState(); // Save the initial blank black state
        updateUndoRedoButtons(); // Initialize button states

        window.addEventListener('resize', resizeCanvas); // Add resize listener
    }


    // --- Video Broadcasting Functionality (WebRTC) ---

    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }

    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }

    async function startBroadcast() {
        if (!currentClassroom || !currentClassroom.id || !socket || !currentUser || currentUser.role !== 'admin') {
            alert("Only administrators can start a broadcast in a classroom.");
            return;
        }

        if (localStream && localStream.active) {
            alert("Broadcast already active.");
            return;
        }

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            console.log("[WebRTC] Local stream acquired.");

            alert('Broadcast started!');
            if (startBroadcastBtn) startBroadcastBtn.disabled = true;
            if (endBroadcastBtn) endBroadcastBtn.disabled = false;

        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);
            alert('Could not start broadcast. Please ensure camera and microphone access are granted. Error: ' + err.message);
            localStream = null;
            if (startBroadcastBtn) startBroadcastBtn.disabled = false;
            if (endBroadcastBtn) endBroadcastBtn.disabled = true;
        }
    }

    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            localVideo.srcObject = null;
            console.log("[WebRTC] Local stream stopped.");
        }

        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
                }
            }
        }
        if (socket && currentClassroom && currentClassroom.id) {
            socket.emit('webrtc_peer_disconnected', { classroomId: currentClassroom.id, peer_id: socket.id });
        }

        alert('Broadcast ended.');
        if (startBroadcastBtn) startBroadcastBtn.disabled = false;
        if (endBroadcastBtn) endBroadcastBtn.disabled = true;
    }

    function createPeerConnection(peerId, isCaller) {
        console.log(`[WebRTC] Creating peer connection for ${peerId}, isCaller: ${isCaller}`);
        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;

        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        pc.ontrack = (event) => {
            console.log('[WebRTC] Remote track received from:', peerId);
            const remoteVideo = document.createElement('video');
            remoteVideo.id = `remote-video-${peerId}`;
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            remoteVideo.srcObject = event.streams[0];
            remoteVideoContainer.appendChild(remoteVideo);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Sending ICE Candidate to:', peerId);
                socket.emit('webrtc_ice_candidate', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    candidate: event.candidate
                });
            }
        };

        pc.onconnectionstatechange = (event) => {
            console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                console.log(`[WebRTC] Peer ${peerId} connection closed or failed.`);
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

        if (isCaller) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    console.log('[WebRTC] Sending WebRTC Offer to:', peerId);
                    socket.emit('webrtc_offer', {
                        classroomId: currentClassroom.id,
                        recipient_id: peerId,
                        offer: pc.localDescription
                    });
                })
                .catch(error => console.error('[WebRTC] Error creating offer:', error));
        }
    }

    // --- Library Functionality ---
    const libraryFilesList = document.getElementById('library-files-list');

    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (!currentClassroom || !currentClassroom.id) {
                alert('Please enter a classroom first.');
                return;
            }
            if (currentUser.role !== 'admin') {
                alert('Only administrators can upload files to the library.');
                return;
            }

            const fileInput = document.getElementById('library-file-input');
            const files = fileInput.files;

            if (files.length === 0) {
                alert('Please select files to upload.');
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            formData.append('classroomId', currentClassroom.id);

            try {
                const response = await fetch('/api/upload-library-files', {
                    method: 'POST',
                    body: formData // No Content-Type header needed for FormData
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    fileInput.value = ''; // Clear the file input
                    loadLibraryFiles(); // Reload the list of files
                } else {
                    alert('Error uploading files: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error uploading files:', error);
                alert('An error occurred during file upload.');
            }
        });
    }

    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            libraryFilesList.innerHTML = '<p>Select a classroom to view library files.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/library-files/${currentClassroom.id}`);
            const files = await response.json();
            libraryFilesList.innerHTML = ''; // Clear previous list

            if (files.length === 0) {
                libraryFilesList.innerHTML = '<p>No files in this library yet.</p>';
            } else {
                const ul = document.createElement('ul');
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="${file.url}" target="_blank">${file.filename}</a>`;
                    ul.appendChild(li);
                });
                libraryFilesList.appendChild(ul);
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            libraryFilesList.innerHTML = '<p>Failed to load library files.</p>';
        }
    }


    // --- Assessment Functionality ---

    let questionCounter = 0; // To keep track of questions in the creation form

    function addQuestionField() {
        questionCounter++;
        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item');
        questionItem.innerHTML = `
            <label>Question ${questionCounter}:</label>
            <input type="text" class="question-text" placeholder="Enter question text" required>
            <select class="question-type">
                <option value="text">Text Answer</option>
                <option value="mcq">Multiple Choice</option>
            </select>
            <div class="mcq-options hidden">
                <input type="text" class="mcq-option" placeholder="Option A">
                <input type="text" class="mcq-option" placeholder="Option B">
                <input type="text" class="mcq-option" placeholder="Option C">
                <input type="text" class="mcq-option" placeholder="Option D">
                <input type="text" class="mcq-correct-answer" placeholder="Correct Option (e.g., A, B)">
            </div>
        `;
        questionsContainer.appendChild(questionItem);

        // Add event listener for question type change
        const questionTypeSelect = questionItem.querySelector('.question-type');
        const mcqOptionsDiv = questionItem.querySelector('.mcq-options');

        questionTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
            }
        });
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', addQuestionField);
    }

    if (submitAssessmentBtn) {
        submitAssessmentBtn.addEventListener('click', async () => {
            if (!currentClassroom || !currentClassroom.id) {
                displayMessage(assessmentCreationMessage, 'Please select a classroom first.', true);
                return;
            }
            if (currentUser.role !== 'admin') {
                displayMessage(assessmentCreationMessage, 'Only administrators can create assessments.', true);
                return;
            }

            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionTextarea.value.trim();
            const questions = [];

            if (!title) {
                displayMessage(assessmentCreationMessage, 'Assessment title is required.', true);
                return;
            }

            const questionItems = questionsContainer.querySelectorAll('.question-item');
            if (questionItems.length === 0) {
                displayMessage(assessmentCreationMessage, 'Please add at least one question.', true);
                return;
            }

            questionItems.forEach(item => {
                const questionText = item.querySelector('.question-text').value.trim();
                const questionType = item.querySelector('.question-type').value;
                const question = {
                    question_text: questionText,
                    question_type: questionType
                };

                if (questionType === 'mcq') {
                    const options = Array.from(item.querySelectorAll('.mcq-option')).map(input => input.value.trim());
                    const correctAnswer = item.querySelector('.mcq-correct-answer').value.trim();
                    question.options = options.filter(opt => opt !== ''); // Only add non-empty options
                    question.correct_answer = correctAnswer;
                }
                questions.push(question);
            });

            // Basic validation for questions
            const isValid = questions.every(q => {
                if (!q.question_text) return false;
                if (q.question_type === 'mcq' && (q.options.length < 2 || !q.correct_answer)) return false;
                return true;
            });

            if (!isValid) {
                displayMessage(assessmentCreationMessage, 'Please ensure all questions have text, and MCQ questions have at least two options and a correct answer.', true);
                return;
            }

            try {
                const response = await fetch('/api/create-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        classroomId: currentClassroom.id,
                        title: title,
                        description: description,
                        questions: questions
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(assessmentCreationMessage, result.message, false);
                    assessmentTitleInput.value = '';
                    assessmentDescriptionTextarea.value = '';
                    questionsContainer.innerHTML = ''; // Clear questions
                    questionCounter = 0; // Reset counter
                    addQuestionField(); // Add initial empty question field
                    loadAssessments(); // Reload the list of assessments
                } else {
                    displayMessage(assessmentCreationMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating assessment:', error);
                displayMessage(assessmentCreationMessage, 'An error occurred while creating the assessment.', true);
            }
        });
    }

    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            assessmentListDiv.innerHTML = '<p>Select a classroom to view assessments.</p>';
            return;
        }

        // Hide other assessment views
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
        assessmentListContainer.classList.remove('hidden');

        // Show/hide assessment creation form based on user role
        if (currentUser && currentUser.role === 'admin') {
            assessmentCreationForm.classList.remove('hidden');
            assessmentCreationForm.classList.add('admin-feature-highlight');
            takeAssessmentContainer.classList.add('hidden'); // Ensure student view is hidden
            viewSubmissionsContainer.classList.remove('hidden'); // Ensure admin view is shown
            // Ensure initial question field is present if admin
            if (questionsContainer.children.length === 0) {
                addQuestionField();
            }
        } else { // User role
            assessmentCreationForm.classList.add('hidden');
            assessmentCreationForm.classList.remove('admin-feature-highlight');
            takeAssessmentContainer.classList.add('hidden'); // Start with list, not take form
            viewSubmissionsContainer.classList.add('hidden'); // Hide submissions for user
        }


        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            const assessments = await response.json();
            assessmentListDiv.innerHTML = ''; // Clear previous list

            if (assessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments available in this classroom.</p>';
            } else {
                assessments.forEach(assessment => {
                    const assessmentItem = document.createElement('div');
                    assessmentItem.classList.add('assessment-item');
                    assessmentItem.innerHTML = `
                        <div>
                            <h4>${assessment.title}</h4>
                            <p>${assessment.description || 'No description'}</p>
                            <p>Created by: ${getDisplayName(assessment.creator_username, assessment.creator_role || 'user')} on ${new Date(assessment.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            ${currentUser.role === 'admin' ?
                                `<button class="view-submissions-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>` :
                                `<button class="take-assessment-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}" data-assessment-description="${assessment.description}">Take Assessment</button>`
                            }
                        </div>
                    `;
                    assessmentListDiv.appendChild(assessmentItem);
                });

                document.querySelectorAll('.take-assessment-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        const assessmentTitle = e.target.dataset.assessmentTitle;
                        const assessmentDescription = e.target.dataset.assessmentDescription;
                        takeAssessment(assessmentId, assessmentTitle, assessmentDescription);
                    });
                });

                document.querySelectorAll('.view-submissions-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        const assessmentTitle = e.target.dataset.assessmentTitle;
                        viewSubmissions(assessmentId, assessmentTitle);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            assessmentListDiv.innerHTML = '<p>Failed to load assessments.</p>';
        }
    }

    async function takeAssessment(assessmentId, title, description) {
        currentAssessmentToTake = { id: assessmentId, title: title, description: description };

        assessmentListContainer.classList.add('hidden');
        assessmentCreationForm.classList.add('hidden'); // Hide creation form
        takeAssessmentContainer.classList.remove('hidden');
        takeAssessmentContainer.classList.add('user-view-subtle'); // Add subtle highlight for user view
        viewSubmissionsContainer.classList.add('hidden'); // Hide submissions view

        takeAssessmentTitle.textContent = title;
        takeAssessmentDescription.textContent = description;
        takeAssessmentForm.innerHTML = ''; // Clear previous questions
        assessmentSubmissionMessage.textContent = ''; // Clear submission message

        try {
            const response = await fetch(`/api/assessment/${assessmentId}/questions`);
            const questions = await response.json();

            if (questions.length === 0) {
                takeAssessmentForm.innerHTML = '<p>No questions found for this assessment.</p>';
                submitAnswersBtn.disabled = true;
                return;
            }
            submitAnswersBtn.disabled = false;

            questions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('question-display');
                questionDiv.dataset.questionId = question.id;
                questionDiv.innerHTML = `<label>Question ${index + 1}: ${question.question_text}</label>`;

                if (question.question_type === 'text') {
                    const textarea = document.createElement('textarea');
                    textarea.name = `question-${question.id}`;
                    textarea.placeholder = 'Your answer here...';
                    textarea.rows = 3;
                    questionDiv.appendChild(textarea);
                } else if (question.question_type === 'mcq' && question.options) {
                    question.options.forEach((option, optIndex) => {
                        const optionId = `q${question.id}-opt${optIndex}`;
                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.name = `question-${question.id}`;
                        radioInput.id = optionId;
                        radioInput.value = option;
                        radioInput.classList.add('mcq-option-radio');

                        const label = document.createElement('label');
                        label.htmlFor = optionId;
                        label.textContent = option;
                        label.classList.add('mcq-option-label');

                        questionDiv.appendChild(radioInput);
                        questionDiv.appendChild(label);
                        questionDiv.appendChild(document.createElement('br'));
                    });
                }
                takeAssessmentForm.appendChild(questionDiv);
            });
        } catch (error) {
            console.error('Error loading assessment questions:', error);
            takeAssessmentForm.innerHTML = '<p>Failed to load questions.</p>';
            submitAnswersBtn.disabled = true;
        }
    }

    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', async () => {
            if (!currentAssessmentToTake || !currentClassroom || !currentClassroom.id) {
                displayMessage(assessmentSubmissionMessage, 'No assessment selected.', true);
                return;
            }

            const answers = [];
            const questionDivs = takeAssessmentForm.querySelectorAll('.question-display');

            questionDivs.forEach(qDiv => {
                const questionId = qDiv.dataset.questionId;
                let userAnswer = '';

                const textarea = qDiv.querySelector('textarea');
                const radioInputs = qDiv.querySelectorAll('input[type="radio"]:checked');

                if (textarea) {
                    userAnswer = textarea.value.trim();
                } else if (radioInputs.length > 0) {
                    userAnswer = radioInputs[0].value;
                }
                answers.push({ questionId: questionId, answer: userAnswer });
            });

            try {
                const response = await fetch('/api/submit-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assessmentId: currentAssessmentToTake.id,
                        classroomId: currentClassroom.id,
                        answers: answers
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(assessmentSubmissionMessage, `Assessment submitted! Your score: ${result.score}/${result.total_questions}`, false);
                    submitAnswersBtn.disabled = true; // Prevent re-submission
                    // Optionally, clear the form or navigate back
                } else {
                    displayMessage(assessmentSubmissionMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error submitting assessment:', error);
                displayMessage(assessmentSubmissionMessage, 'An error occurred during submission.', true);
            }
        });
    }

    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            currentAssessmentToTake = null;
            loadAssessments(); // Go back to the list of assessments
        });
    }

    async function viewSubmissions(assessmentId, title) {
        assessmentListContainer.classList.add('hidden');
        assessmentCreationForm.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.remove('hidden');
        viewSubmissionsContainer.classList.add('admin-feature-highlight'); // Highlight for admin view

        submissionsAssessmentTitle.textContent = `Submissions for: ${title}`;
        submissionsList.innerHTML = ''; // Clear previous submissions

        try {
            const response = await fetch(`/api/assessment/${assessmentId}/submissions`);
            const submissions = await response.json();

            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions yet for this assessment.</p>';
                return;
            }

            submissions.forEach(submission => {
                const submissionItem = document.createElement('div');
                submissionItem.classList.add('submission-item');
                // Display student username with (Admin) tag if applicable (though unlikely for student submissions)
                const studentDisplayName = getDisplayName(submission.student_username, submission.student_role || 'user'); // Assuming student_role might be passed from backend
                submissionItem.innerHTML = `
                    <h5>Submitted by: ${studentDisplayName} on ${new Date(submission.submitted_at).toLocaleString()}</h5>
                    <p>Score: ${submission.score}/${submission.total_questions}</p>
                `;
                
                submission.answers.forEach(answer => {
                    const answerPair = document.createElement('div');
                    answerPair.classList.add('question-answer-pair');
                    answerPair.innerHTML = `
                        <p><strong>Q:</strong> ${answer.question_text}</p>
                        <p><strong>Your Answer:</strong> ${answer.user_answer || 'N/A'}</p>
                    `;
                    if (answer.is_correct !== undefined && answer.is_correct !== null) {
                        answerPair.innerHTML += `<p><strong>Correct:</strong> ${answer.is_correct ? 'Yes' : 'No'} (Expected: ${answer.correct_answer || 'N/A'})</p>`;
                        answerPair.style.backgroundColor = answer.is_correct ? '#e6ffe6' : '#ffe6e6'; // Light green for correct, light red for incorrect
                    } else if (answer.correct_answer) { // Show correct answer for text questions if available
                        answerPair.innerHTML += `<p><strong>Expected Answer:</strong> ${answer.correct_answer}</p>`;
                    }
                    submissionItem.appendChild(answerPair);
                });
                submissionsList.appendChild(submissionItem);
            });

        } catch (error) {
            console.error('Error loading submissions:', error);
            submissionsList.innerHTML = '<p>Failed to load submissions.</p>';
        }
    }

    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            loadAssessments(); // Go back to the list of assessments
        });
    }

    // --- Initial Load ---
    checkLoginStatus(); // Initialize app state based on login status
});
