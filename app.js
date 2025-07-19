// app.js (Fixed whiteboardCtx issue and enabled admin drawing, added verbose logging for whiteboard)

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
    const settingsEmailInput = document.getElementById('settings-email'); // Disabled email field
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
    const penColorInput = document.getElementById('pen-color');
    const penWidthInput = document.getElementById('pen-width');
    const widthValueSpan = document.getElementById('width-value');
    const clearBoardBtn = document.getElementById('clear-whiteboard-btn');

    // Video Broadcast Elements (moved from classroom.js)
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryFilesList = document.getElementById('library-files-list');

    // Assessment Elements (New and Updated)
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionInput = document.getElementById('assessment-description');
    const assessmentScheduledDateInput = document.getElementById('assessment-scheduled-date'); // New
    const assessmentScheduledTimeInput = document.getElementById('assessment-scheduled-time'); // New
    const assessmentDurationInput = document.getElementById('assessment-duration'); // New
    const createAssessmentBtn = document.getElementById('create-assessment-btn');
    const assessmentListDiv = document.getElementById('assessment-list');

    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const takeAssessmentScheduledTime = document.getElementById('take-assessment-scheduled-time'); // New
    const takeAssessmentDuration = document.getElementById('take-assessment-duration'); // New
    const assessmentTimerDisplay = document.getElementById('assessment-timer'); // New
    const takeAssessmentForm = document.getElementById('take-assessment-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');

    const takeAssessmentContainer = document.getElementById('take-assessment-container'); // New
    const assessmentCreationForm = document.getElementById('assessment-creation-form'); // New
    const assessmentListContainer = document.getElementById('assessment-list-container'); // New
    const viewSubmissionsContainer = document.getElementById('view-submissions-container'); // New
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn'); // New


    // --- Global Variables (moved from classroom.js) ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let assessmentTimerInterval; // For the assessment timer


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

    // --- Whiteboard Variables ---
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let penColor = '#FFFFFF'; // Default white
    let penWidth = 2; // Default width
    let whiteboardCtx; // Moved outside, will initialize later


    // --- Utility Functions ---
    function displayMessage(element, message, isError) {
        element.textContent = message;
        element.className = isError ? 'error' : 'success';
    }

    // Function to show a temporary message box (replaces alert)
    function showMessageBox(message, isError = false, duration = 5000) {
        const messageBox = document.createElement('div');
        messageBox.className = isError ? 'alert-message' : 'success-message';
        messageBox.textContent = message;
        document.body.appendChild(messageBox);
        setTimeout(() => messageBox.remove(), duration);
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
        setupWhiteboardControls(); // Ensure whiteboard controls are set up
        // Reset broadcast buttons state
        if (startBroadcastBtn) startBroadcastBtn.disabled = false;
        if (endBroadcastBtn) endBroadcastBtn.disabled = true;

        // Hide share link display when entering a new classroom
        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';

        // Handle admin-only and user-only elements visibility
        updateRoleBasedElementsVisibility();
    }

    function updateRoleBasedElementsVisibility() {
        const adminElements = document.querySelectorAll('[data-admin-only]');
        const userElements = document.querySelectorAll('[data-user-only]');

        if (currentUser && currentUser.role === 'admin') {
            adminElements.forEach(el => el.classList.remove('hidden'));
            userElements.forEach(el => el.classList.add('hidden')); // Hide user-only for admin
        } else if (currentUser && currentUser.role === 'user') {
            adminElements.forEach(el => el.classList.add('hidden')); // Hide admin-only for user
            userElements.forEach(el => el.classList.remove('hidden'));
        } else {
            // Hide both if no user or unknown role
            adminElements.forEach(el => el.classList.add('hidden'));
            userElements.forEach(el => el.classList.add('hidden'));
        }
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
                // Pass the user's role when joining the classroom
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
                const { prevX, prevY, currX, currY, color, width } = data.data || data; // Handle both direct data and nested 'data' from DB
                console.log(`[Whiteboard] Received draw data: prevX=${prevX}, prevY=${prevY}, currX=${currX}, currY=${currY}, color=${color}, width=${width}`);
                drawLine(prevX, prevY, currX, currY, color, width);
            } else if (data.action === 'clear') {
                console.log('[Whiteboard] Received clear command.');
                if (whiteboardCtx) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
            } else if (data.action === 'history' && data.data) {
                // Redraw history for new participants
                console.log('[Whiteboard] Receiving history. Items:', data.data.length);
                // Clear current canvas before redrawing history
                if (whiteboardCtx) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
                data.data.forEach(drawCommand => {
                    if (drawCommand.action === 'draw' && drawCommand.data) { // Ensure it's a draw command and has data
                        const { prevX, prevY, currX, currY, color, width } = drawCommand.data;
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
                    showMessageBox("Could not access camera/microphone for video call. Receiving might be affected.", true);
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
            updateRoleBasedElementsVisibility(); // Ensure elements are hidden/shown on login
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
                            showMessageBox("Classroom not found or not joined yet.", true);
                            showSection(dashboardSection);
                            loadUserClassrooms(); // Reload classrooms for the user
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching classroom details:", err);
                        showMessageBox("Could not load classroom.", true);
                        showSection(dashboardSection); // Fallback to dashboard on error
                        loadUserClassrooms();
                    });
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
                    document.querySelectorAll('#whiteboard-tools-container [data-admin-only] button, #whiteboard-tools-container [data-admin-only] label, #whiteboard-tools-container [data-admin-only] input, #whiteboard-tools-container [data-admin-only] span')
                            .forEach(control => control.style.display = 'none');
                    // Clear chat messages
                    if (chatMessages) chatMessages.innerHTML = '';
                    // Clear remote videos
                    if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
                    // Clear library files list
                    if (libraryFilesList) libraryFilesList.innerHTML = '';
                    // Clear assessment list
                    if (assessmentListDiv) assessmentListDiv.innerHTML = '';
                    updateRoleBasedElementsVisibility(); // Re-hide/show elements based on logged out state
                } else {
                    showMessageBox('Failed to logout.', true);
                }
            } catch (error) {
                console.error('Error during logout:', error);
                showMessageBox('An error occurred during logout.', true);
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
            document.querySelectorAll('#whiteboard-tools-container [data-admin-only] button, #whiteboard-tools-container [data-admin-only] label, #whiteboard-tools-container [data-admin-only] input, #whiteboard-tools-container [data-admin-only] span')
                    .forEach(control => control.style.display = 'none');
            // Clear chat messages
            if (chatMessages) chatMessages.innerHTML = '';
            // Clear remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
            // Clear library files list
            if (libraryFilesList) libraryFilesList.innerHTML = '';
            // Clear assessment list
            if (assessmentListDiv) assessmentListDiv.innerHTML = '';
            currentClassroom = null; // Clear current classroom state
            localStorage.removeItem('currentClassroom');
            updateRoleBasedElementsVisibility(); // Re-hide/show elements based on dashboard view
        });
    }

    // Nav to Classroom (from Dashboard)
    if (navClassroom) {
        navClassroom.addEventListener('click', () => {
            if (currentClassroom && currentClassroom.id) {
                enterClassroom(currentClassroom.id, currentClassroom.name);
            } else {
                showMessageBox('Please create or join a classroom first!', true);
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
            document.querySelectorAll('#whiteboard-tools-container [data-admin-only] button, #whiteboard-tools-container [data-admin-only] label, #whiteboard-tools-container [data-admin-only] input, #whiteboard-tools-container [data-admin-only] span')
                    .forEach(control => control.style.display = 'none');
            // Clear chat messages
            if (chatMessages) chatMessages.innerHTML = '';
            // Clear remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
            // Clear library files list
            if (libraryFilesList) libraryFilesList.innerHTML = '';
            // Clear assessment list
            if (assessmentListDiv) assessmentListDiv.innerHTML = '';
            updateRoleBasedElementsVisibility(); // Re-hide/show elements based on settings view
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
            document.querySelectorAll('#whiteboard-tools-container [data-admin-only] button, #whiteboard-tools-container [data-admin-only] label, #whiteboard-tools-container [data-admin-only] input, #whiteboard-tools-container [data-admin-only] span')
                    .forEach(control => control.style.display = 'none');
            // Clear chat messages
            if (chatMessages) chatMessages.innerHTML = '';
            // Clear remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
            // Clear library files list
            if (libraryFilesList) libraryFilesList.innerHTML = '';
            // Clear assessment list
            if (assessmentListDiv) assessmentListDiv.innerHTML = '';
            currentClassroom = null; // Clear current classroom state
            localStorage.removeItem('currentClassroom');
            updateRoleBasedElementsVisibility(); // Re-hide/show elements based on dashboard view
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
        navLibrary.addEventListener('click', () => { showClassroomSubSection(librarySection); updateNavActiveState(navLibrary); loadLibraryFiles(); });
    }
    if (navAssessments) {
        navAssessments.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            updateNavActiveState(navAssessments);
            // Decide which assessment view to show based on role
            if (currentUser && currentUser.role === 'admin') {
                showAssessmentCreationForm();
            } else {
                showAssessmentListForUser();
            }
            loadAssessments(); // Load assessments for display
        });
    }

    // Update Profile
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = settingsUsernameInput.value;

            if (!username) {
                showMessageBox('Username cannot be empty.', true);
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
                    showMessageBox(result.message, false);
                    currentUser.username = username; // Update local user object
                    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Update local storage
                    currentUsernameDisplay.textContent = currentUser.username; // Update dashboard display
                } else {
                    showMessageBox('Error updating profile: ' + (result.error || 'Unknown error'), true);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showMessageBox('An error occurred during profile update.', true);
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
                        showMessageBox('Error generating share link: ' + (data.error || 'Unknown error'), true);
                    }
                } catch (error) {
                    console.error('Error generating share link:', error);
                    showMessageBox('An error occurred while generating the share link.', true);
                }
            } else {
                showMessageBox('Please create or join a classroom first to get a shareable link.', true);
            }
        });
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select(); // Select the text in the input field
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy'); // Copy the text
            showMessageBox('Link copied to clipboard!', false, 3000);
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
        const whiteboardCanvas = document.getElementById('whiteboard-canvas');
        if (!whiteboardCanvas) {
             console.warn("[Whiteboard] Canvas element not found.");
             return;
        }
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        if (!whiteboardCtx) {
            console.error("[Whiteboard] 2D context failed to initialize.");
            return;
        }
        console.log("[Whiteboard] Whiteboard context initialized:", whiteboardCtx);


        // Set canvas dimensions
        const whiteboardArea = document.getElementById('whiteboard-area');
        const parentWidth = whiteboardArea ? whiteboardArea.offsetWidth : 800;
        whiteboardCanvas.width = Math.min(parentWidth * 0.95, 800);
        whiteboardCanvas.height = 600;
        console.log(`[Whiteboard] Canvas dimensions set: ${whiteboardCanvas.width}x${whiteboardCanvas.height}`);


        // Select all controls within the whiteboard-tools-container div
        const allWhiteboardControls = document.querySelectorAll('#whiteboard-tools-container [data-admin-only] button, #whiteboard-tools-container [data-admin-only] label, #whiteboard-tools-container [data-admin-only] input, #whiteboard-tools-container [data-admin-only] span');

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
                // Ensure share-whiteboard-btn and join-broadcast are not hidden/disabled by this block
                // (though share button might be handled elsewhere for visibility)
                if (control.id !== 'share-whiteboard-btn' && control.id !== 'join-broadcast') {
                    control.style.display = 'inline-block'; // Or 'block' depending on layout
                    control.disabled = false;
                }
            });
            whiteboardCanvas.style.pointerEvents = 'auto'; // Make canvas interactive
        }

        if (penColorInput) {
            penColorInput.addEventListener('change', (e) => {
                penColor = e.target.value;
                whiteboardCtx.strokeStyle = penColor;
                console.log(`[Whiteboard] Pen color changed to: ${penColor}`);
            });
        }

        if (penWidthInput) {
            penWidthInput.addEventListener('input', (e) => {
                penWidth = parseInt(e.target.value);
                if (widthValueSpan) widthValueSpan.textContent = `${penWidth}px`;
                whiteboardCtx.lineWidth = penWidth;
                console.log(`[Whiteboard] Pen width changed to: ${penWidth}`);
            });
            if (widthValueSpan) widthValueSpan.textContent = `${penWidthInput.value}px`;
        }

        if (clearBoardBtn) {
            clearBoardBtn.addEventListener('click', () => {
                // FIX: Use currentClassroom.id
                if (socket && currentClassroom && currentClassroom.id && currentUser && currentUser.role === 'admin') {
                    console.log(`[Whiteboard] Sending clear command for classroom: ${currentClassroom.id}`);
                    socket.emit('whiteboard_data', { action: 'clear', classroomId: currentClassroom.id });
                } else if (currentUser && currentUser.role !== 'admin') {
                    showMessageBox("Only administrators can clear the whiteboard.", true);
                }
            });
        }

        whiteboardCanvas.addEventListener('mousedown', (e) => {
            if (currentUser && currentUser.role === 'admin') {
                isDrawing = true;
                [lastX, lastY] = [e.offsetX, e.offsetY];
                console.log(`[Whiteboard] Mouse DOWN at (${lastX}, ${lastY}) with color ${penColor} and width ${penWidth}`);
            }
        });

        whiteboardCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing || currentUser.role !== 'admin') return;
            
            const currX = e.offsetX;
            const currY = e.offsetY;

            // Draw locally immediately for responsiveness
            drawLine(lastX, lastY, currX, currY, penColor, penWidth);
            // console.log(`[Whiteboard] Drawing locally from (${lastX}, ${lastY}) to (${currX}, ${currY})`);

            // Emit drawing data to the server
            // FIX: Use currentClassroom.id
            const drawData = {
                action: 'draw',
                classroomId: currentClassroom.id,
                prevX: lastX,
                prevY: lastY,
                currX: currX,
                currY: currY,
                color: penColor,
                width: penWidth
            };
            socket.emit('whiteboard_data', drawData);
            // console.log('[Whiteboard] Emitted draw data:', drawData);

            [lastX, lastY] = [currX, currY];
        });

        whiteboardCanvas.addEventListener('mouseup', () => {
            isDrawing = false;
            console.log('[Whiteboard] Mouse UP. Drawing stopped.');
        });

        whiteboardCanvas.addEventListener('mouseout', () => {
            isDrawing = false;
            console.log('[Whiteboard] Mouse OUT. Drawing stopped.');
        });

        // Set initial context properties
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.strokeStyle = penColor; // Apply initial pen color
        whiteboardCtx.lineWidth = penWidth;   // Apply initial pen width
        console.log(`[Whiteboard] Initial context properties set: strokeStyle=${whiteboardCtx.strokeStyle}, lineWidth=${whiteboardCtx.lineWidth}`);
    }

    function drawLine(prevX, prevY, currX, currY, color, width) {
        if (!whiteboardCtx) {
            console.warn('[Whiteboard] Cannot draw: whiteboardCtx is null.');
            return;
        }
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
            showMessageBox("Only administrators can start a broadcast in a classroom.", true);
            return;
        }

        if (localStream && localStream.active) {
            showMessageBox("Broadcast already active.", true);
            return;
        }

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            console.log("[WebRTC] Local stream acquired.");

            showMessageBox('Broadcast started!', false, 3000);

            if (startBroadcastBtn) startBroadcastBtn.disabled = false; // Keep enabled for potential re-starts
            if (endBroadcastBtn) endBroadcastBtn.disabled = false;

        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);
            showMessageBox('Could not start broadcast. Please ensure camera and microphone access are granted. Error: ' + err.message, true);
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

        showMessageBox('Broadcast ended.', false, 3000);

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

    // --- Library Functionality ---
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            const files = libraryFileInput.files;
            if (files.length === 0) {
                showMessageBox('Please select files to upload.', true);
                return;
            }
            if (!currentClassroom || !currentClassroom.id) {
                showMessageBox('Please join a classroom first.', true);
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
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    showMessageBox(result.message, false);
                    libraryFileInput.value = ''; // Clear file input
                    loadLibraryFiles(); // Reload the list of files
                } else {
                    showMessageBox('Error uploading files: ' + (result.error || 'Unknown error'), true);
                }
            } catch (error) {
                console.error('Error uploading files:', error);
                showMessageBox('An error occurred during file upload.', true);
            }
        });
    }

    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            libraryFilesList.innerHTML = '<p>Join a classroom to see library files.</p>';
            return;
        }
        try {
            const response = await fetch(`/api/library-files/${currentClassroom.id}`);
            const files = await response.json();
            libraryFilesList.innerHTML = '';
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

    // Helper to show/hide assessment forms based on role
    function showAssessmentCreationForm() {
        assessmentCreationForm.classList.remove('hidden');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
    }

    function showAssessmentListForUser() {
        assessmentCreationForm.classList.add('hidden');
        assessmentListContainer.classList.remove('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
    }

    function showTakeAssessmentForm() {
        assessmentCreationForm.classList.add('hidden');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden');
        viewSubmissionsContainer.classList.add('hidden');
    }

    function showSubmissionsView() {
        assessmentCreationForm.classList.add('hidden');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.remove('hidden');
    }


    if (createAssessmentBtn) {
        createAssessmentBtn.addEventListener('click', async () => {
            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionInput.value.trim();
            const scheduledDate = assessmentScheduledDateInput.value; // YYYY-MM-DD
            const scheduledTime = assessmentScheduledTimeInput.value; // HH:MM
            const durationMinutes = parseInt(assessmentDurationInput.value);

            if (!title) {
                showMessageBox('Assessment title is required.', true);
                return;
            }
            if (!scheduledDate || !scheduledTime) {
                showMessageBox('Scheduled date and time are required.', true);
                return;
            }
            if (isNaN(durationMinutes) || durationMinutes <= 0) {
                showMessageBox('Duration must be a positive number of minutes.', true);
                return;
            }
            if (!currentClassroom || !currentClassroom.id) {
                showMessageBox('Please join a classroom to create an assessment.', true);
                return;
            }

            // Combine date and time into a single ISO 8601 string
            const scheduledAt = `${scheduledDate}T${scheduledTime}`;

            try {
                const response = await fetch('/api/assessments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        classroomId: currentClassroom.id,
                        title: title,
                        description: description,
                        scheduled_at: scheduledAt,
                        duration_minutes: durationMinutes
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    showMessageBox(result.message, false);
                    assessmentTitleInput.value = ''; // Clear input
                    assessmentDescriptionInput.value = ''; // Clear input
                    assessmentScheduledDateInput.value = ''; // Clear input
                    assessmentScheduledTimeInput.value = ''; // Clear input
                    assessmentDurationInput.value = ''; // Clear input
                    loadAssessments(); // Reload the list of assessments
                    // After creating, show the list view for admins
                    showAssessmentCreationForm(); // Keep creation form visible for adding more, or switch to list
                } else {
                    showMessageBox('Error creating assessment: ' + (result.error || 'Unknown error'), true);
                }
            } catch (error) {
                console.error('Error creating assessment:', error);
                showMessageBox('An error occurred during assessment creation.', true);
            }
        });
    }

    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            assessmentListDiv.innerHTML = '<p>Join a classroom to see assessments.</p>';
            return;
        }
        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            const assessments = await response.json();
            assessmentListDiv.innerHTML = '';
            if (assessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments in this classroom yet.</p>';
            } else {
                assessments.forEach(assessment => {
                    const assessmentDiv = document.createElement('div');
                    assessmentDiv.className = 'assessment-item'; // Add a class for styling
                    
                    const scheduledDateTime = new Date(assessment.scheduled_at);
                    const formattedDate = scheduledDateTime.toLocaleDateString();
                    const formattedTime = scheduledDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    assessmentDiv.innerHTML = `
                        <h4>${assessment.title}</h4>
                        <p>${assessment.description || 'No description provided.'}</p>
                        <p><strong>Scheduled:</strong> ${formattedDate} at ${formattedTime}</p>
                        <p><strong>Duration:</strong> ${assessment.duration_minutes} minutes</p>
                        <small>Created by: ${assessment.creator_username} on ${new Date(assessment.created_at).toLocaleDateString()}</small>
                        <button class="view-assessment-btn" data-assessment-id="${assessment.id}">View/Take Assessment</button>
                    `;
                    assessmentListDiv.appendChild(assessmentDiv);
                });

                // Add event listeners for "View/Take Assessment" buttons
                document.querySelectorAll('.view-assessment-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        loadSpecificAssessment(assessmentId);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            assessmentListDiv.innerHTML = '<p>Failed to load assessments.</p>';
        }
    }

    async function loadSpecificAssessment(assessmentId) {
        if (!currentClassroom || !currentClassroom.id || !assessmentId) {
            showMessageBox('Cannot load assessment: missing classroom or assessment ID.', true);
            return;
        }

        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            const assessment = await response.json();

            if (response.ok) {
                takeAssessmentTitle.textContent = assessment.title;
                takeAssessmentDescription.textContent = assessment.description || 'No description provided.';
                
                const scheduledDateTime = new Date(assessment.scheduled_at);
                const formattedDate = scheduledDateTime.toLocaleDateString();
                const formattedTime = scheduledDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                takeAssessmentScheduledTime.textContent = `${formattedDate} at ${formattedTime}`;
                takeAssessmentDuration.textContent = assessment.duration_minutes;

                takeAssessmentForm.innerHTML = ''; // Clear previous questions

                if (assessment.questions && assessment.questions.length > 0) {
                    assessment.questions.forEach((question, index) => {
                        const questionDiv = document.createElement('div');
                        questionDiv.className = 'assessment-question';
                        let questionHtml = `<p><strong>${index + 1}. ${question.question_text}</strong></p>`;

                        if (question.question_type === 'mcq' && question.options) {
                            question.options.forEach((option, optIndex) => {
                                const optionId = `q${question.id}-opt${optIndex}`;
                                questionHtml += `
                                    <label for="${optionId}">
                                        <input type="radio" name="question-${question.id}" id="${optionId}" value="${option}">
                                        ${option}
                                    </label><br>
                                `;
                            });
                        } else if (question.question_type === 'text') {
                            questionHtml += `<textarea name="question-${question.id}" rows="4" placeholder="Your answer"></textarea>`;
                        }
                        questionDiv.innerHTML = questionHtml;
                        takeAssessmentForm.appendChild(questionDiv);
                    });
                } else {
                    takeAssessmentForm.innerHTML = '<p>No questions have been added to this assessment yet.</p>';
                }
                
                startAssessmentTimer(assessment.scheduled_at, assessment.duration_minutes);
                showTakeAssessmentForm(); // Show the form to take the assessment

            } else {
                showMessageBox('Error loading assessment details: ' + (assessment.error || 'Unknown error'), true);
            }
        } catch (error) {
            console.error('Error loading specific assessment:', error);
            showMessageBox('An error occurred while loading the assessment.', true);
        }
    }

    // Timer functionality
    function startAssessmentTimer(scheduledAtISO, durationMinutes) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval); // Clear any existing timer
        }

        const scheduledTime = new Date(scheduledAtISO).getTime();
        const durationMs = durationMinutes * 60 * 1000;
        const endTime = scheduledTime + durationMs;

        function updateTimer() {
            const now = new Date().getTime();
            const timeLeftMs = endTime - now;

            if (timeLeftMs <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = "Time's Up!";
                submitAnswersBtn.disabled = true; // Disable submission
                showMessageBox("Time for the assessment has ended!", true);
                // Optionally auto-submit here
                // submitAnswers();
                return;
            }

            const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

            assessmentTimerDisplay.textContent = `Time Left: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        // Run immediately and then every second
        updateTimer();
        assessmentTimerInterval = setInterval(updateTimer, 1000);
    }

    // Back to assessment list from take assessment view
    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            if (assessmentTimerInterval) {
                clearInterval(assessmentTimerInterval); // Stop timer
                assessmentTimerDisplay.textContent = ''; // Clear timer display
            }
            showAssessmentListForUser(); // Go back to the list view for users
            loadAssessments(); // Reload the list
        });
    }

    // --- Initial Load ---
    checkLoginStatus(); // Initialize app state based on login status
});
