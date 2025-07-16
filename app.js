// app.js (All-in-One: Includes functionality previously in classroom.js, with currentClassroom.id fixes)

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
    const settingsEmailInput = document = document.getElementById('settings-email'); // Disabled email field
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');

    // Share link elements
    const shareWhiteboardBtn = document.getElementById('share-whiteboard-btn');
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');

    // Chat functionality elements (moved from classroom.js)
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessages = document.getElementById('chat-messages');

    // Whiteboard Elements (moved from classroom.js)
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const whiteboardCtx = whiteboardCanvas ? whiteboardCanvas.getContext('2d') : null; // Initialize if canvas exists
    const penColorInput = document.getElementById('pen-color');
    const penWidthInput = document.getElementById('pen-width');
    const widthValueSpan = document.getElementById('width-value');
    const clearBoardBtn = document.getElementById('clear-whiteboard-btn');

    // Video Broadcast Elements (moved from classroom.js)
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');


    // --- Global Variables (moved from classroom.js) ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;

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

    // Whiteboard Drawing State Variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let penColor = '#000000'; // Default black
    let penWidth = 2; // Default width


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

        // --- Direct calls to merged classroom functionality ---
        initializeSocketIO();
        setupWhiteboardControls();
        // Reset broadcast buttons state
        if (startBroadcastBtn) startBroadcastBtn.disabled = false;
        if (endBroadcastBtn) endBroadcastBtn.disabled = true;

        // Hide share link display when entering a new classroom
        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';
    }

    // --- Socket.IO Initialization (merged from classroom.js) ---
    function initializeSocketIO() {
        if (socket) {
            socket.disconnect(); // Ensure previous connection is closed
        }
        socket = io(); // Connect to the Socket.IO server

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected. SID:', socket.id);
            // FIX: Use currentClassroom.id
            if (currentClassroom && currentClassroom.id) {
                socket.emit('join', { 'classroomId': currentClassroom.id });
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
            messageElement.textContent = `${data.username}: ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        });

        socket.on('user_joined', (data) => {
            console.log(`[Socket.IO] ${data.username} (${data.sid}) has joined the classroom.`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has joined the classroom.`;
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
            statusMessage.textContent = `${data.username} has left the classroom.`;
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
                console.log('[Whiteboard] Receiving history. Items:', data.data.length);
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
                // FIX: Use currentClassroom.id
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
            currentUsernameDisplay.textContent = currentUser.username;
            classroomIdDisplay.textContent = currentClassroom ? currentClassroom.id : 'N/A';
            loadUserClassrooms();
            updateNavActiveState(navDashboard);
            // Handle direct classroom link access (e.g., /classroom/<id>)
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                const idFromUrl = pathParts[2];
                enterClassroom(idFromUrl, `Classroom ${idFromUrl.substring(0, 8)}...`); // Placeholder name
            }
        } else {
            showSection(authSection);
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
                    checkLoginStatus(); // Navigate to dashboard
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
                    if (socket && currentClassroom && currentClassroom.id) { // FIX: Use currentClassroom.id
                        socket.emit('leave', { 'classroomId': currentClassroom.id });
                        socket.disconnect(); // Disconnect the socket regardless
                        socket = null;
                    } else if (socket) { // If currentClassroom is null but socket exists, just disconnect
                        socket.disconnect();
                        socket = null;
                    }
                    endBroadcast(); // Clean up broadcast related resources
                    // Clear whiteboard canvas
                    if (whiteboardCtx) {
                        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    }
                    // Hide whiteboard controls if they were shown
                    document.querySelectorAll('#whiteboard-tools button, #whiteboard-tools label, #whiteboard-tools input, #whiteboard-tools span')
                            .forEach(control => control.style.display = 'none');
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
            // --- Direct calls for cleanup ---
            if (socket && currentClassroom && currentClassroom.id) { // FIX: Use currentClassroom.id
                socket.emit('leave', { 'classroomId': currentClassroom.id });
                socket.disconnect();
                socket = null;
            } else if (socket) {
                socket.disconnect();
                socket = null;
            }
            endBroadcast(); // Clean up broadcast related resources
            // Clear whiteboard canvas
            if (whiteboardCtx) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
            document.querySelectorAll('#whiteboard-tools button, #whiteboard-tools label, #whiteboard-tools input, #whiteboard-tools span')
                    .forEach(control => control.style.display = 'none');
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
            if (socket && currentClassroom && currentClassroom.id) { // FIX: Use currentClassroom.id
                socket.emit('leave', { 'classroomId': currentClassroom.id });
                socket.disconnect();
                socket = null;
            } else if (socket) {
                socket.disconnect();
                socket = null;
            }
            endBroadcast(); // Clean up broadcast related resources
            // Clear whiteboard canvas
            if (whiteboardCtx) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
            document.querySelectorAll('#whiteboard-tools button, #whiteboard-tools label, #whiteboard-tools input, #whiteboard-tools span')
                    .forEach(control => control.style.display = 'none');
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
            // --- Direct calls for cleanup ---
            if (socket && currentClassroom && currentClassroom.id) { // FIX: Use currentClassroom.id
                socket.emit('leave', { 'classroomId': currentClassroom.id });
                socket.disconnect();
                socket = null;
            } else if (socket) {
                socket.disconnect();
                socket = null;
            }
            endBroadcast(); // Clean up broadcast related resources
            // Clear whiteboard canvas
            if (whiteboardCtx) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
            document.querySelectorAll('#whiteboard-tools button, #whiteboard-tools label, #whiteboard-tools input, #whiteboard-tools span')
                    .forEach(control => control.style.display = 'none');
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
        navLibrary.addEventListener('click', () => { showClassroomSubSection(librarySection); updateNavActiveState(navLibrary); });
    }
    if (navAssessments) {
        navAssessments.addEventListener('click', () => { showClassroomSubSection(assessmentsSection); updateNavActiveState(navAssessments); });
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
                    currentUsernameDisplay.textContent = currentUser.username; // Update dashboard display
                } else {
                    alert('Error updating profile: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('An error occurred during profile update.');
            }
        });
    }

    // --- Share Whiteboard/Classroom Link ---
    if (shareWhiteboardBtn) {
        shareWhiteboardBtn.addEventListener('click', async () => {
            const classroomId = currentClassroom ? currentClassroom.id : classroomIdDisplay.textContent;

            if (classroomId && classroomId !== 'N/A') {
                try {
                    const response = await fetch(`/api/generate-share-link/${classroomId}`);
                    const data = await response.json();
                    if (response.ok) {
                        shareLinkInput.value = data.share_link;
                        shareLinkDisplay.classList.remove('hidden'); // Show the link display
                    } else {
                        alert('Error generating share link: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error generating share link:', error);
                    alert('An error occurred while generating the share link.');
                }
            } else {
                alert('Please create or join a classroom first to get a shareable link.');
            }
        });
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select(); // Select the text in the input field
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy'); // Copy the text
            alert('Link copied to clipboard!');
        });
    }


    // --- Chat Functionality (merged from classroom.js) ---
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            // FIX: Use currentClassroom.id
            if (message && socket && currentClassroom && currentClassroom.id) {
                socket.emit('message', {
                    classroomId: currentClassroom.id,
                    message: message,
                    username: currentUser.username
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


    // --- Whiteboard Functionality (merged from classroom.js) ---
    function setupWhiteboardControls() {
        if (!whiteboardCanvas || !whiteboardCtx) {
             console.warn("[Whiteboard] Canvas or context not found.");
             return;
        }

        // Set canvas dimensions
        const whiteboardArea = document.getElementById('whiteboard-area');
        const parentWidth = whiteboardArea ? whiteboardArea.offsetWidth : 800;
        whiteboardCanvas.width = Math.min(parentWidth * 0.95, 800);
        whiteboardCanvas.height = 600;

        // Select all controls within the whiteboard-tools div
        const allWhiteboardControls = document.querySelectorAll('#whiteboard-tools button, #whiteboard-tools label, #whiteboard-tools input, #whiteboard-tools span');

        // Disable/enable whiteboard controls based on user role
        if (currentUser && currentUser.role !== 'admin') {
            console.log("[Whiteboard] Disabling whiteboard controls for non-admin user.");
            allWhiteboardControls.forEach(control => {
                control.style.display = 'none'; // Hide controls
                control.disabled = true; // Disable if visible
            });
            whiteboardCanvas.style.pointerEvents = 'none'; // Make canvas non-interactive
        } else {
            console.log("[Whiteboard] Enabling whiteboard controls for admin user.");
            allWhiteboardControls.forEach(control => {
                if (control.id !== 'share-whiteboard-btn' && control.id !== 'join-broadcast') {
                    control.style.display = 'inline-block';
                    control.disabled = false;
                }
            });
            whiteboardCanvas.style.pointerEvents = 'auto'; // Make canvas interactive
        }

        if (penColorInput) {
            penColorInput.addEventListener('change', (e) => {
                penColor = e.target.value;
                whiteboardCtx.strokeStyle = penColor;
            });
        }

        if (penWidthInput) {
            penWidthInput.addEventListener('input', (e) => {
                penWidth = parseInt(e.target.value);
                if (widthValueSpan) widthValueSpan.textContent = `${penWidth}px`;
                whiteboardCtx.lineWidth = penWidth;
            });
            if (widthValueSpan) widthValueSpan.textContent = `${penWidthInput.value}px`;
        }

        if (clearBoardBtn) {
            clearBoardBtn.addEventListener('click', () => {
                // FIX: Use currentClassroom.id
                if (socket && currentClassroom && currentClassroom.id && currentUser && currentUser.role === 'admin') {
                    socket.emit('whiteboard_data', { action: 'clear', classroomId: currentClassroom.id });
                } else if (currentUser && currentUser.role !== 'admin') {
                    alert("Only administrators can clear the whiteboard.");
                }
            });
        }

        whiteboardCanvas.addEventListener('mousedown', (e) => {
            if (currentUser && currentUser.role === 'admin') {
                isDrawing = true;
                [lastX, lastY] = [e.offsetX, e.offsetY];
            }
        });

        whiteboardCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;
            if (currentUser && currentUser.role === 'admin') {
                const currX = e.offsetX;
                const currY = e.offsetY;

                drawLine(lastX, lastY, currX, currY, penColor, penWidth);

                // FIX: Use currentClassroom.id
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroom.id,
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


    // --- Video Broadcasting Functionality (WebRTC - merged from classroom.js) ---

    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }

    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }

    async function startBroadcast() {
        // FIX: Use currentClassroom.id
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
        // FIX: Use currentClassroom.id for leaving
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
                // FIX: Use currentClassroom.id
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
                    // FIX: Use currentClassroom.id
                    socket.emit('webrtc_offer', {
                        classroomId: currentClassroom.id,
                        recipient_id: peerId,
                        offer: pc.localDescription
                    });
                })
                .catch(error => console.error('[WebRTC] Error creating offer:', error));
        }
    }


    // --- Initial Load ---
    checkLoginStatus(); // Initialize app state based on login status
});
