// app.js (Complete Rewrite with Enhanced Whiteboard Persistence, Draggable Text, and all features)
// This file contains the complete client-side logic for a real-time,
// multi-functional online classroom application. It handles user authentication,
// classroom management, real-time chat, a collaborative whiteboard, and
// WebRTC-based video broadcasting.

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    // Top-level application containers
    const app = document.getElementById('app');

    // Authentication Section Elements
    const authSection = document.getElementById('auth-section');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    // Dashboard Section Elements
    const dashboardSection = document.getElementById('dashboard-section');
    const classroomIdDisplay = document.getElementById('classroom-id-display');
    const currentUsernameDisplay = document.getElementById('current-username-display');
    const navDashboard = document.getElementById('nav-dashboard');
    const navClassroom = document.getElementById('nav-classroom');
    const navSettings = document.getElementById('nav-settings');
    const logoutBtn = document.getElementById('logout-btn');

    // Classroom Creation Elements (within Dashboard)
    const createClassroomSection = document.getElementById('create-classroom-section');
    const newClassroomNameInput = document.getElementById('new-classroom-name');
    const createClassroomBtn = document.getElementById('create-classroom-btn');
    const classroomMessage = document.getElementById('classroom-message');
    const classroomList = document.getElementById('classroom-list');
    const classroomSearchInput = document.getElementById('classroom-search-input');

    // Main Classroom Section Elements
    const classroomSection = document.getElementById('classroom-section');
    const classNameValue = document.getElementById('class-name-value');
    const classCodeSpan = document.getElementById('class-code');
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    // Classroom Sub-navigation Buttons
    const navChat = document.getElementById('nav-chat');
    const navWhiteboard = document.getElementById('nav-whiteboard');
    const navLibrary = document.getElementById('nav-library');
    const navAssessments = document.getElementById('nav-assessments');

    // Classroom Sub-section Content Areas
    const chatSection = document.getElementById('chat-section');
    const whiteboardArea = document.getElementById('whiteboard-area');
    const librarySection = document.getElementById('library-section');
    const assessmentsSection = document.getElementById('assessments-section');

    // Settings Section Elements
    const settingsSection = document.getElementById('settings-section');
    const updateProfileForm = document.getElementById('update-profile-form');
    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');

    // Share Link Elements (for classrooms)
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');

    // Chat Functionality Elements
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessages = document.getElementById('chat-messages');

    // Whiteboard Elements
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const toolButtons = document.querySelectorAll('.tool-button');
    const colorPicker = document.getElementById('colorPicker');
    const brushSizeSlider = document.getElementById('brushSize');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const clearButton = document.getElementById('clearButton');
    const saveButton = document.getElementById('saveButton');
    const whiteboardRoleMessage = document.getElementById('whiteboard-role-message');
    const prevWhiteboardPageBtn = document.getElementById('prev-whiteboard-page-btn');
    const nextWhiteboardPageBtn = document.getElementById('next-whiteboard-page-btn');
    const whiteboardPageDisplay = document.getElementById('whiteboard-page-display');
    const shareWhiteboardBtn = document.getElementById('share-whiteboard-btn');
    const textToolButton = document.getElementById('textTool');

    // Video Broadcast Elements
    const broadcastTypeRadios = document.querySelectorAll('input[name="broadcastType"]');
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const localVideoContainer = document.getElementById('local-video-container');
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastRoleMessage = document.getElementById('broadcast-role-message');

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryRoleMessage = document.getElementById('library-role-message');
    const libraryFilesList = document.getElementById('library-files-list');
    const librarySearchInput = document.getElementById('library-search-input');

    // Assessment Elements
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionTextarea = document.getElementById('assessment-description');
    const assessmentScheduledAtInput = document.getElementById('assessment-scheduled-at');
    const assessmentDurationMinutesInput = document.getElementById('assessment-duration-minutes');
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentListDiv = document.getElementById('assessment-list');
    const assessmentSearchInput = document.getElementById('assessment-search-input');
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const assessmentTimerDisplay = document.getElementById('assessment-timer');
    const takeAssessmentForm = document.getElementById('take-assessment-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');
    const viewSubmissionsContainer = document.getElementById('view-submissions-container');
    const submissionsAssessmentTitle = document.getElementById('submissions-assessment-title');
    const submissionsList = document.getElementById('submissions-list');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');

    // Global Notification Container
    const notificationsContainer = document.getElementById('notifications-container');

    // Sidebar and Menu Elements
    const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    // --- Global Variables ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentAssessmentToTake = null;
    let assessmentTimerInterval = null;
    let assessmentEndTime = null;

    // WebRTC Variables
    let localStream;
    let currentBroadcastType = 'video_audio';
    const peerConnections = {};
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
        ]
    };
    const iceCandidateQueues = {};
    let isSocketIoInitialized = false;

    // Video Zoom State Management
    const videoZoomStates = new Map();

    // Whiteboard Global Variables
    let whiteboardCtx;
    let currentTool = 'pen';
    let isDrawing = false;
    let startX, startY;
    let temporaryShapeData = null;
    let whiteboardPages = [
        []
    ];
    let currentPageIndex = 0;
    let currentColor = '#FFFFFF';
    let currentBrushSize = 5;
    const MAX_HISTORY_STEPS = 10;
    let undoStack = [];
    let redoStack = [];

    // Text Tool specific variables
    let activeTextInput = null;
    let isDraggingText = false;
    let draggedTextItemIndex = -1;
    let dragStartOffsetX = 0;
    let dragStartOffsetY = 0;

    let questionCounter = 0;

    // --- Utility Functions ---

    /**
     * Displays a temporary notification message to the user at the top of the screen.
     * @param {string} message - The text message to display.
     * @param {boolean} isError - True if the message indicates an error, false for success/info.
     */
    function showNotification(message, isError = false) {
        if (notificationsContainer) {
            notificationsContainer.textContent = message;
            notificationsContainer.className = isError ? 'error-notification' : 'success-notification';
            notificationsContainer.classList.add('show');
            setTimeout(() => {
                notificationsContainer.classList.remove('show');
                notificationsContainer.textContent = '';
            }, 5000);
        }
    }

    /**
     * Helper function to display form-specific messages.
     * @param {HTMLElement} element - The DOM element to display the message in.
     * @param {string} message - The message text to set.
     * @param {boolean} isError - True for an error message, false for a success message.
     */
    function displayMessage(element, message, isError) {
        if (element) {
            element.textContent = message;
            element.className = isError ? 'error' : 'success';
        }
    }

    /**
     * Controls the visibility of major application sections.
     * @param {HTMLElement} sectionToShow - The section to make visible.
     */
    function showSection(sectionToShow) {
        [authSection, dashboardSection, classroomSection, settingsSection].forEach(section => {
            if (section) {
                section.classList.add('hidden');
                section.classList.remove('active');
            }
        });
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.classList.add('active');
            console.log(`[UI] Showing section: ${sectionToShow.id}`);
        } else {
            console.warn('[UI] Attempted to show a null section.');
        }
    }

    /**
     * Controls the visibility of sub-sections within the classroom.
     * @param {HTMLElement} subSectionToShow - The sub-section to make visible.
     */
    function showClassroomSubSection(subSectionToShow) {
        [chatSection, whiteboardArea, librarySection, assessmentsSection, takeAssessmentContainer, viewSubmissionsContainer, assessmentListContainer].forEach(subSection => {
            if (subSection) {
                subSection.classList.add('hidden');
            }
        });
        if (subSectionToShow) {
            subSectionToShow.classList.remove('hidden');
            console.log(`[UI] Showing classroom sub-section: ${subSectionToShow.id}`);
        }
    }

    /**
     * Sets the active state for classroom sub-navigation buttons.
     * @param {HTMLElement} buttonToActivate - The button to highlight as active.
     */
    function setActiveClassroomNavButton(buttonToActivate) {
        [navChat, navWhiteboard, navLibrary, navAssessments].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        if (buttonToActivate) {
            buttonToActivate.classList.add('active');
        }
    }

    /**
     * Handles routing based on the user's login state.
     */
    function navigate() {
        console.log('[App] Navigating based on user state...');
        if (currentUser) {
            showSection(dashboardSection);
            // Update UI elements with user and classroom info
            if (currentUsernameDisplay) currentUsernameDisplay.textContent = currentUser.username;
            // Show/hide admin-specific sections
            if (createClassroomSection) createClassroomSection.classList.toggle('hidden', currentUser.role !== 'admin');
        } else {
            showSection(authSection);
        }
    }

    /**
     * Initializes the Socket.IO connection and sets up event listeners.
     */
    function initializeSocketIo() {
        if (isSocketIoInitialized) {
            return;
        }
        socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

        socket.on('connect', () => {
            console.log(`[Socket.IO] Connected with SID: ${socket.id}.`);
            if (currentClassroom) {
                socket.emit('join', {
                    classroomId: currentClassroom.id,
                    username: currentUser.username,
                    userId: currentUser.id
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO] Disconnected.');
        });

        socket.on('status', (data) => {
            console.log(`[Socket.IO] Status message received: ${data.message}`);
            showNotification(data.message, false);
        });

        socket.on('message', (data) => {
            console.log('[Chat] Message received:', data);
            displayMessageInChat(data.username, data.message, data.role);
        });

        socket.on('classroom_list_updated', async () => {
            console.log('[Socket.IO] Classroom list updated. Reloading list...');
            await loadClassroomList();
        });

        // WebRTC Signaling Handlers
        socket.on('webrtc_offer', async (data) => {
            console.log(`[WebRTC] Received WebRTC offer from UserId: ${data.offerer_user_id}`);
            handleWebRtcOffer(data);
        });

        socket.on('webrtc_answer', (data) => {
            console.log(`[WebRTC] Received WebRTC answer from UserId: ${data.answerer_user_id}`);
            handleWebRtcAnswer(data);
        });

        socket.on('webrtc_ice_candidate', (data) => {
            console.log(`[WebRTC] Received ICE candidate from UserId: ${data.sender_id}`);
            handleIceCandidate(data);
        });

        socket.on('webrtc_leave', (data) => {
            console.log(`[WebRTC] Peer left: ${data.user_id}`);
            handlePeerLeave(data.user_id);
        });

        // Whiteboard Handlers
        socket.on('whiteboard_data', (data) => {
            console.log(`[Whiteboard] Received data for page ${data.pageIndex + 1}:`, data.action);
            handleWhiteboardData(data);
        });

        isSocketIoInitialized = true;
    }

    /**
     * Displays a message in the chat area with appropriate styling.
     * @param {string} username - Sender's username.
     * @param {string} message - Message text.
     * @param {string} role - Sender's role ('admin' or 'user').
     */
    function displayMessageInChat(username, message, role) {
        if (!chatMessages) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        if (role === 'admin') {
            messageElement.classList.add('admin-message');
        }

        const usernameSpan = document.createElement('span');
        usernameSpan.classList.add('username');
        usernameSpan.textContent = `${username}: `;

        const messageText = document.createTextNode(message);
        messageElement.appendChild(usernameSpan);
        messageElement.appendChild(messageText);

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Authentication Functions ---

    /**
     * Handles the user login process.
     * @param {Event} e - The form submission event.
     */
    async function handleLogin(e) {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });
            const data = await response.json();

            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                displayMessage(authMessage, `Welcome, ${currentUser.username}!`, false);
                navigate();
                initializeSocketIo(); // Initialize Socket.IO after successful login
                await loadClassroomList();
            } else {
                throw new Error(data.error || 'Login failed.');
            }
        } catch (error) {
            console.error('[Auth] Login error:', error);
            displayMessage(authMessage, `Login failed: ${error.message}`, true);
        }
    }

    /**
     * Handles the user registration process.
     * @param {Event} e - The form submission event.
     */
    async function handleRegister(e) {
        e.preventDefault();
        const username = registerForm.username.value;
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        const role = registerForm.role.value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    role
                })
            });
            const data = await response.json();

            if (response.ok) {
                displayMessage(authMessage, `Registration successful! You can now log in.`, false);
                showSection(loginContainer); // Switch to login form after successful registration
            } else {
                throw new Error(data.error || 'Registration failed.');
            }
        } catch (error) {
            console.error('[Auth] Registration error:', error);
            displayMessage(authMessage, `Registration failed: ${error.message}`, true);
        }
    }

    /**
     * Handles user logout. Clears session and local storage.
     */
    async function handleLogout() {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
            });
            if (response.ok) {
                currentUser = null;
                currentClassroom = null;
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentClassroom');
                // Stop any video streams
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                    localVideo.srcObject = null;
                }
                // Close all peer connections
                for (const peerId in peerConnections) {
                    if (peerConnections[peerId].pc) {
                        peerConnections[peerId].pc.close();
                    }
                    delete peerConnections[peerId];
                }
                if (socket) {
                    socket.disconnect();
                }
                isSocketIoInitialized = false;
                navigate();
                showNotification('You have been logged out.');
            } else {
                throw new Error('Logout failed on the server.');
            }
        } catch (error) {
            console.error('[Auth] Logout error:', error);
            showNotification('An error occurred during logout.', true);
        }
    }

    // --- Classroom Functions ---

    /**
     * Handles the creation of a new classroom (admin only).
     * @param {Event} e - The form submission event.
     */
    async function handleCreateClassroom(e) {
        e.preventDefault();
        const classroomName = newClassroomNameInput.value.trim();
        if (!classroomName) {
            displayMessage(classroomMessage, 'Classroom name cannot be empty.', true);
            return;
        }

        try {
            const response = await fetch('/api/classrooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: classroomName
                })
            });
            const data = await response.json();

            if (response.ok) {
                displayMessage(classroomMessage, `Classroom "${data.name}" created successfully! Code: ${data.id}`, false);
                newClassroomNameInput.value = '';
                await loadClassroomList();
            } else {
                throw new Error(data.error || 'Failed to create classroom.');
            }
        } catch (error) {
            console.error('[Classroom] Creation error:', error);
            displayMessage(classroomMessage, `Failed to create classroom: ${error.message}`, true);
        }
    }

    /**
     * Fetches and displays the list of available classrooms.
     */
    async function loadClassroomList() {
        if (!classroomList) return;
        classroomList.innerHTML = 'Loading...';
        try {
            const response = await fetch('/api/classrooms');
            const data = await response.json();

            if (response.ok) {
                const classrooms = data.classrooms;
                const searchTerm = classroomSearchInput.value.toLowerCase();
                const filteredClassrooms = classrooms.filter(c =>
                    c.name.toLowerCase().includes(searchTerm) || c.id.toLowerCase().includes(searchTerm)
                );

                classroomList.innerHTML = '';
                if (filteredClassrooms.length === 0) {
                    classroomList.innerHTML = '<p>No classrooms found.</p>';
                } else {
                    filteredClassrooms.forEach(classroom => {
                        const classroomItem = document.createElement('div');
                        classroomItem.classList.add('classroom-item');
                        classroomItem.innerHTML = `
                            <span><strong>${classroom.name}</strong></span>
                            <span>Code: ${classroom.id}</span>
                            <button class="join-classroom-btn" data-id="${classroom.id}" data-name="${classroom.name}">Join</button>
                        `;
                        classroomList.appendChild(classroomItem);
                    });
                }
            } else {
                throw new Error(data.error || 'Failed to load classrooms.');
            }
        } catch (error) {
            console.error('[Classroom] Load error:', error);
            classroomList.innerHTML = `<p class="error">Failed to load classrooms: ${error.message}</p>`;
        }
    }

    /**
     * Handles joining a specific classroom.
     * @param {string} classroomId - The ID of the classroom to join.
     * @param {string} classroomName - The name of the classroom to join.
     */
    async function handleJoinClassroom(classroomId, classroomName) {
        try {
            const response = await fetch(`/api/classrooms/${classroomId}/join`, {
                method: 'POST',
            });
            const data = await response.json();

            if (response.ok) {
                currentClassroom = {
                    id: classroomId,
                    name: classroomName,
                    ...data
                };
                localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom));
                showSection(classroomSection);
                updateClassroomUi();
                initializeSocketIo();
                socket.emit('join', {
                    classroomId: classroomId,
                    username: currentUser.username,
                    userId: currentUser.id
                });
                await fetchClassroomData();
                showNotification(`Joined classroom: ${classroomName}`);
            } else {
                throw new Error(data.error || 'Failed to join classroom.');
            }
        } catch (error) {
            console.error('[Classroom] Join error:', error);
            showNotification(`Failed to join classroom: ${error.message}`, true);
        }
    }

    /**
     * Updates the UI to reflect the currently joined classroom.
     */
    function updateClassroomUi() {
        if (currentClassroom) {
            if (classNameValue) classNameValue.textContent = currentClassroom.name;
            if (classCodeSpan) classCodeSpan.textContent = currentClassroom.id;
        }
        showClassroomSubSection(whiteboardArea);
        setActiveClassroomNavButton(navWhiteboard);
    }

    /**
     * Fetches real-time whiteboard, chat, and other data for the current classroom.
     */
    async function fetchClassroomData() {
        if (!currentClassroom || !currentClassroom.id) return;
        try {
            // Fetch whiteboard data and render it
            const whiteboardResponse = await fetch(`/api/classrooms/${currentClassroom.id}/whiteboard`);
            const whiteboardData = await whiteboardResponse.json();
            if (whiteboardResponse.ok) {
                whiteboardPages = whiteboardData.whiteboard_data;
                currentPageIndex = 0;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [
                        []
                    ]; // Ensure at least one page exists
                }
                renderCurrentWhiteboardPage();
                updateWhiteboardControls();
            } else {
                throw new Error(whiteboardData.error || 'Failed to load whiteboard data.');
            }

            // Fetch chat history
            const chatResponse = await fetch(`/api/classrooms/${currentClassroom.id}/chat`);
            const chatData = await chatResponse.json();
            if (chatResponse.ok) {
                if (chatMessages) chatMessages.innerHTML = '';
                chatData.messages.forEach(msg => {
                    displayMessageInChat(msg.username, msg.message, msg.role);
                });
            } else {
                throw new Error(chatData.error || 'Failed to load chat history.');
            }
        } catch (error) {
            console.error('[Classroom] Data fetch error:', error);
            showNotification(`Failed to load classroom data: ${error.message}`, true);
        }
    }

    /**
     * Updates the WebRTC UI to show admin-specific controls.
     */
    function updateBroadcastUi() {
        if (currentUser.role === 'admin' && broadcastRoleMessage) {
            broadcastRoleMessage.textContent = 'You are the Admin. You can start and stop the broadcast.';
            if (startBroadcastBtn) startBroadcastBtn.classList.remove('hidden');
            if (endBroadcastBtn) endBroadcastBtn.classList.remove('hidden');
            if (broadcastTypeRadios.length > 0) {
                broadcastTypeRadios.forEach(radio => radio.parentElement.classList.remove('hidden'));
            }
        } else if (broadcastRoleMessage) {
            broadcastRoleMessage.textContent = 'You are a participant. Waiting for the Admin to start the broadcast.';
            if (startBroadcastBtn) startBroadcastBtn.classList.add('hidden');
            if (endBroadcastBtn) endBroadcastBtn.classList.add('hidden');
            if (broadcastTypeRadios.length > 0) {
                broadcastTypeRadios.forEach(radio => radio.parentElement.classList.add('hidden'));
            }
        }
    }

    // --- WebRTC Functions ---

    /**
     * Initializes the local media stream (camera/mic).
     */
    async function startLocalStream() {
        if (localStream) {
            console.log('[WebRTC] Local stream already running.');
            return;
        }
        console.log('[WebRTC] Requesting local media stream...');
        const streamOptions = {
            video: currentBroadcastType.includes('video'),
            audio: currentBroadcastType.includes('audio')
        };
        try {
            localStream = await navigator.mediaDevices.getUserMedia(streamOptions);
            if (localVideo) {
                localVideo.srcObject = localStream;
            }
            console.log('[WebRTC] Local stream started successfully.');
        } catch (e) {
            console.error('[WebRTC] Error starting local stream:', e);
            showNotification('Failed to get local media. Check camera/mic permissions.', true);
        }
    }

    /**
     * Stops the local media stream and associated tracks.
     */
    function stopLocalStream() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            if (localVideo) localVideo.srcObject = null;
            console.log('[WebRTC] Local stream stopped.');
        }
    }

    /**
     * Creates a new RTCPeerConnection and sets up its event handlers.
     * @param {string} peerUserId - The ID of the remote peer.
     * @param {boolean} isCaller - True if this side is the one initiating the call (admin).
     * @param {string} peerUsername - The username of the remote peer.
     * @param {string} peerSocketId - The Socket.IO SID of the remote peer.
     * @returns {Promise<void>}
     */
    async function createPeerConnection(peerUserId, isCaller, peerUsername, peerSocketId) {
        if (!currentUser || !currentUser.id) {
            console.error('[WebRTC] Cannot create peer connection: Current user data is missing.');
            showNotification('WebRTC error: User data missing.', true);
            return;
        }

        if (peerConnections[peerUserId] && peerConnections[peerUserId].pc) {
            console.warn(`[WebRTC] Peer connection for user ${peerUserId} already exists. Reusing it.`);
            return;
        }

        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerUserId] = {
            pc,
            socketId: peerSocketId,
            username: peerUsername
        };
        console.log(`[WebRTC] Created new RTCPeerConnection for user ${peerUserId}`);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC] Sending ICE Candidate from ${currentUser.id} to UserId: ${peerUserId}.`);
                socket.emit('webrtc_ice_candidate', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerUserId,
                    sender_id: currentUser.id,
                    candidate: event.candidate,
                    socket_id: socket.id
                });
            }
        };

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received track from peer ${peerUserId}.`);
            const remoteVideoEl = document.getElementById(`video-${peerUserId}`);
            if (remoteVideoEl) {
                remoteVideoEl.srcObject = event.streams[0];
            } else {
                // Create a new video element for the remote stream
                const newVideoContainer = document.createElement('div');
                newVideoContainer.id = `container-${peerUserId}`;
                newVideoContainer.classList.add('video-participant');
                newVideoContainer.innerHTML = `
                    <video id="video-${peerUserId}" class="remote-video" autoplay playsinline></video>
                    <div class="video-info">
                        <span class="video-username">${peerUsername}</span>
                    </div>
                `;
                remoteVideoContainer.appendChild(newVideoContainer);
                const newVideoEl = document.getElementById(`video-${peerUserId}`);
                newVideoEl.srcObject = event.streams[0];

                // Set up zoom listeners for the new video element
                initializeZoomableVideo(newVideoEl, newVideoContainer);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE connection state for ${peerUserId}: ${pc.iceConnectionState}`);
        };

        // Add local stream tracks to the new peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
                console.log(`[WebRTC] Added local track to peer connection for ${peerUserId}.`);
            });
        }

        // Process queued ICE candidates if they arrived before the remote description was set
        if (iceCandidateQueues[peerUserId]) {
            console.log(`[WebRTC] Processing ${iceCandidateQueues[peerUserId].length} queued ICE candidates for ${peerUserId}`);
            iceCandidateQueues[peerUserId].forEach(candidate => {
                if (pc.remoteDescription) {
                    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => {
                        console.error(`[WebRTC] Error adding queued ICE candidate for ${peerUserId}:`, e);
                    });
                }
            });
            delete iceCandidateQueues[peerUserId]; // Clear the queue after processing
        }
    }

    /**
     * Handles a received WebRTC offer.
     * @param {object} data - The offer data payload.
     */
    async function handleWebRtcOffer(data) {
        if (!currentUser || currentUser.id === data.offerer_user_id) {
            return; // Ignore offers from self
        }

        const offererUserId = data.offerer_user_id;
        const offererSocketId = data.offerer_socket_id;
        const peerUsername = data.username || `Peer ${offererUserId.substring(0, 4)}`;

        if (!peerConnections[offererUserId] || !peerConnections[offererUserId].pc) {
            await createPeerConnection(offererUserId, false, peerUsername, offererSocketId);
        } else {
            if (offererSocketId && peerConnections[offererUserId].socketId !== offererSocketId) {
                peerConnections[offererUserId].socketId = offererSocketId;
            }
        }

        try {
            const pcInfo = peerConnections[offererUserId];
            if (!pcInfo || !pcInfo.pc) {
                console.error(`[WebRTC] PC object not found for offerer UserId ${offererUserId}.`);
                showNotification(`WebRTC error: Peer connection missing for ${peerUsername}.`, true);
                return;
            }
            const pc = pcInfo.pc;

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            console.log(`[WebRTC] Set remote description (offer) for UserId ${offererUserId}.`);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log(`[WebRTC] Created and set local description (answer) for UserId ${offererUserId}.`);

            socket.emit('webrtc_answer', {
                classroomId: currentClassroom.id,
                recipient_id: offererUserId,
                answer: answer,
                answerer_user_id: currentUser.id,
                answerer_socket_id: socket.id,
                username: currentUser.username
            });
            console.log(`[WebRTC] Sent WebRTC answer to UserId: ${offererUserId}.`);
        } catch (error) {
            console.error(`[WebRTC] Error handling offer from ${offererUserId}:`, error);
            showNotification(`WebRTC error with peer ${peerUsername}.`, true);
        }
    }

    /**
     * Handles a received WebRTC answer.
     * @param {object} data - The answer data payload.
     */
    async function handleWebRtcAnswer(data) {
        const answererUserId = data.answerer_user_id;
        const pcInfo = peerConnections[answererUserId];
        if (!pcInfo || !pcInfo.pc) {
            console.error(`[WebRTC] PC not found for answerer: ${answererUserId}. Cannot set remote description.`);
            return;
        }
        try {
            await pcInfo.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log(`[WebRTC] Set remote description (answer) for UserId: ${answererUserId}.`);
        } catch (error) {
            console.error(`[WebRTC] Error handling answer from ${answererUserId}:`, error);
        }
    }

    /**
     * Handles a received WebRTC ICE candidate.
     * @param {object} data - The ICE candidate data payload.
     */
    async function handleIceCandidate(data) {
        if (!currentUser || currentUser.id === data.sender_id) {
            return; // Ignore candidates from self
        }
        const senderId = data.sender_id;
        const pcInfo = peerConnections[senderId];
        if (!pcInfo || !pcInfo.pc) {
            console.warn(`[WebRTC] PeerConnection not found for ${senderId}. Queuing ICE candidate.`);
            if (!iceCandidateQueues[senderId]) {
                iceCandidateQueues[senderId] = [];
            }
            iceCandidateQueues[senderId].push(data.candidate);
            return;
        }

        try {
            await pcInfo.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log(`[WebRTC] Added ICE candidate from ${senderId}.`);
        } catch (e) {
            console.error(`[WebRTC] Error adding ICE candidate from ${senderId}:`, e);
        }
    }

    /**
     * Handles when a remote peer leaves the broadcast.
     * @param {string} userId - The ID of the user who left.
     */
    function handlePeerLeave(userId) {
        const pcInfo = peerConnections[userId];
        if (pcInfo && pcInfo.pc) {
            pcInfo.pc.close();
            delete peerConnections[userId];
            const remoteVideoContainer = document.getElementById(`container-${userId}`);
            if (remoteVideoContainer) {
                remoteVideoContainer.remove();
            }
            console.log(`[WebRTC] Peer ${userId} removed.`);
        }
    }

    /**
     * Handles the start broadcast button click (admin only).
     */
    async function startBroadcast() {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can start a broadcast.', true);
            return;
        }
        await startLocalStream();
        if (localStream) {
            // Admin broadcasts to everyone else in the room
            socket.emit('start_broadcast', {
                classroomId: currentClassroom.id,
                username: currentUser.username
            });
            console.log('[WebRTC] Admin has initiated a broadcast. Sending offers to all other peers.');
        }
    }

    /**
     * Handles the end broadcast button click (admin only).
     */
    function endBroadcast() {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can end a broadcast.', true);
            return;
        }
        stopLocalStream();
        // Notify all peers to close their connections
        socket.emit('end_broadcast', {
            classroomId: currentClassroom.id
        });
        // Close all peer connections on the admin's side
        for (const peerId in peerConnections) {
            if (peerConnections[peerId].pc) {
                peerConnections[peerId].pc.close();
            }
            delete peerConnections[peerId];
        }
        // Remove all remote video elements
        remoteVideoContainer.innerHTML = '';
        showNotification('Broadcast has ended.');
    }

    /**
     * Initializes zoom functionality for a video element.
     * @param {HTMLVideoElement} videoElement - The video element to make zoomable.
     * @param {HTMLElement} container - The container element to manage drag events.
     */
    function initializeZoomableVideo(videoElement, container) {
        if (!videoElement || !container) return;

        let isDragging = false;
        let startX, startY;
        let lastX, lastY;
        const minZoom = 1;
        const maxZoom = 3;
        const zoomStep = 0.1;

        // Initialize state for this video element
        videoZoomStates.set(videoElement.id, {
            currentScale: minZoom,
            isZoomed: false,
            offsetX: 0,
            offsetY: 0
        });

        // Mouse down for dragging
        container.addEventListener('mousedown', (e) => {
            if (!videoZoomStates.get(videoElement.id).isZoomed) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            lastX = videoZoomStates.get(videoElement.id).offsetX;
            lastY = videoZoomStates.get(videoElement.id).offsetY;
            container.style.cursor = 'grabbing';
            e.preventDefault(); // Prevent text selection
        });

        // Mouse move for dragging
        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const state = videoZoomStates.get(videoElement.id);
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            state.offsetX = lastX + dx;
            state.offsetY = lastY + dy;

            videoElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX}px, ${state.offsetY}px)`;
        });

        // Mouse up to end dragging
        container.addEventListener('mouseup', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        // Double-click to toggle zoom
        container.addEventListener('dblclick', () => {
            const state = videoZoomStates.get(videoElement.id);
            if (!state.isZoomed) {
                state.currentScale = 2;
                state.isZoomed = true;
            } else {
                state.currentScale = minZoom;
                state.isZoomed = false;
                state.offsetX = 0;
                state.offsetY = 0;
            }
            videoElement.style.transition = 'transform 0.3s ease-in-out';
            videoElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX}px, ${state.offsetY}px)`;
            setTimeout(() => {
                videoElement.style.transition = 'none'; // Disable transition for dragging
            }, 300);
        });

        // Initial cursor style
        container.style.cursor = 'grab';
    }

    // --- Whiteboard Functions ---

    /**
     * Initializes the whiteboard canvas and its context.
     */
    function initializeWhiteboard() {
        if (!whiteboardCanvas) return;
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeWhiteboardCanvas();
        window.addEventListener('resize', resizeWhiteboardCanvas);
        setupWhiteboardEventListeners();
        updateWhiteboardControls();
    }

    /**
     * Resizes the canvas to fill its parent container.
     */
    function resizeWhiteboardCanvas() {
        const rect = whiteboardCanvas.parentElement.getBoundingClientRect();
        whiteboardCanvas.width = rect.width;
        whiteboardCanvas.height = rect.height;
        renderCurrentWhiteboardPage(); // Redraw content on resize
    }

    /**
     * Pushes the current whiteboard state to the undo stack.
     */
    function pushToUndoStack() {
        // Clear redo stack when a new action is performed
        redoStack = [];
        // Push a deep copy of the current page's drawing history
        undoStack.push(JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex])));
        // Trim the stack to the max history steps
        if (undoStack.length > MAX_HISTORY_STEPS) {
            undoStack.shift(); // Remove the oldest state
        }
        console.log(`[Whiteboard] Pushed to undo stack. Stack size: ${undoStack.length}`);
    }

    /**
     * Renders the drawing commands for the current page onto the canvas.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        whiteboardPages[currentPageIndex].forEach(item => {
            if (item.type === 'path') {
                drawPath(item.data, item.color, item.size);
            } else if (item.type === 'text') {
                drawText(item.data);
            }
        });
    }

    /**
     * Draws a path on the canvas from a set of points.
     * @param {Array<object>} points - Array of {x, y} coordinates.
     * @param {string} color - Stroke color.
     * @param {number} size - Stroke width.
     */
    function drawPath(points, color, size) {
        if (points.length < 2) return;
        whiteboardCtx.beginPath();
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = size;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            whiteboardCtx.lineTo(points[i].x, points[i].y);
        }
        whiteboardCtx.stroke();
    }

    /**
     * Draws a text item on the canvas.
     * @param {object} textData - The text item data.
     */
    function drawText(textData) {
        whiteboardCtx.font = `${textData.size}px sans-serif`;
        whiteboardCtx.fillStyle = textData.color;
        whiteboardCtx.fillText(textData.text, textData.x, textData.y);
    }

    /**
     * Handles incoming whiteboard data from other users.
     * @param {object} data - The payload from the Socket.IO event.
     */
    function handleWhiteboardData(data) {
        if (data.userId === currentUser.id) {
            // Ignore events from self, as we handle local rendering immediately
            return;
        }

        if (data.pageIndex !== currentPageIndex) {
            // If data is for a different page, update that page's history
            if (!whiteboardPages[data.pageIndex]) {
                whiteboardPages[data.pageIndex] = [];
            }
            if (data.action === 'draw' && data.data) {
                whiteboardPages[data.pageIndex].push(data.data);
            } else if (data.action === 'clear') {
                whiteboardPages[data.pageIndex] = [];
            }
        } else {
            // Update the current page's history and re-render
            if (data.action === 'draw' && data.data) {
                whiteboardPages[currentPageIndex].push(data.data);
                renderCurrentWhiteboardPage();
            } else if (data.action === 'clear') {
                whiteboardPages[currentPageIndex] = [];
                renderCurrentWhiteboardPage();
            }
        }
    }

    /**
     * Sets up all mouse and touch event listeners for whiteboard drawing.
     */
    function setupWhiteboardEventListeners() {
        if (!whiteboardCanvas) return;
        const getMousePos = (e) => {
            const rect = whiteboardCanvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const startDrawing = (e) => {
            if (currentTool === 'pen') {
                isDrawing = true;
                const pos = getMousePos(e);
                temporaryShapeData = {
                    type: 'path',
                    data: [{
                        x: pos.x,
                        y: pos.y
                    }],
                    color: currentColor,
                    size: currentBrushSize
                };
            } else if (currentTool === 'text') {
                // If text tool is active, place a text input field
                if (activeTextInput) {
                    // Finalize previous text input before creating a new one
                    finalizeText();
                }
                const pos = getMousePos(e);
                placeTextInput(pos.x, pos.y);
            }
        };

        const draw = (e) => {
            if (!isDrawing || currentTool !== 'pen') return;
            const pos = getMousePos(e);
            temporaryShapeData.data.push({
                x: pos.x,
                y: pos.y
            });
            renderCurrentWhiteboardPage();
            drawPath(temporaryShapeData.data, temporaryShapeData.color, temporaryShapeData.size);
        };

        const stopDrawing = () => {
            if (!isDrawing) return;
            isDrawing = false;
            if (temporaryShapeData && temporaryShapeData.data.length > 1) {
                whiteboardPages[currentPageIndex].push(temporaryShapeData);
                emitWhiteboardData('draw', temporaryShapeData);
                pushToUndoStack();
            }
            temporaryShapeData = null;
        };

        // Event listeners for drawing
        whiteboardCanvas.addEventListener('mousedown', startDrawing);
        whiteboardCanvas.addEventListener('mousemove', draw);
        whiteboardCanvas.addEventListener('mouseup', stopDrawing);
        whiteboardCanvas.addEventListener('mouseleave', stopDrawing);

        // Event listeners for text dragging
        whiteboardCanvas.addEventListener('mousedown', (e) => {
            if (currentTool === 'text') {
                const pos = getMousePos(e);
                for (let i = whiteboardPages[currentPageIndex].length - 1; i >= 0; i--) {
                    const item = whiteboardPages[currentPageIndex][i];
                    if (item.type === 'text') {
                        // Simple hit test for dragging
                        whiteboardCtx.font = `${item.size}px sans-serif`;
                        const textMetrics = whiteboardCtx.measureText(item.text);
                        const textWidth = textMetrics.width;
                        const textHeight = item.size; // approximation

                        if (pos.x >= item.x && pos.x <= item.x + textWidth &&
                            pos.y >= item.y - textHeight && pos.y <= item.y) {
                            isDraggingText = true;
                            draggedTextItemIndex = i;
                            dragStartOffsetX = pos.x - item.x;
                            dragStartOffsetY = pos.y - item.y;
                            e.preventDefault();
                            break;
                        }
                    }
                }
            }
        });

        whiteboardCanvas.addEventListener('mousemove', (e) => {
            if (!isDraggingText) return;
            const pos = getMousePos(e);
            const item = whiteboardPages[currentPageIndex][draggedTextItemIndex];
            if (item) {
                item.x = pos.x - dragStartOffsetX;
                item.y = pos.y - dragStartOffsetY;
                renderCurrentWhiteboardPage();
            }
        });

        whiteboardCanvas.addEventListener('mouseup', () => {
            if (isDraggingText) {
                isDraggingText = false;
                if (draggedTextItemIndex !== -1) {
                    emitWhiteboardData('draw', whiteboardPages[currentPageIndex][draggedTextItemIndex]);
                    pushToUndoStack();
                    draggedTextItemIndex = -1;
                }
            }
        });
    }

    /**
     * Places a textarea element on the canvas for text input.
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     */
    function placeTextInput(x, y) {
        // Create and style the textarea
        const textarea = document.createElement('textarea');
        textarea.classList.add('whiteboard-text-input');
        textarea.style.left = `${x}px`;
        textarea.style.top = `${y}px`;
        textarea.style.color = currentColor;
        textarea.style.fontSize = `${currentBrushSize}px`;
        textarea.style.fontFamily = 'sans-serif'; // Or any other font
        textarea.placeholder = 'Type here...';

        whiteboardArea.appendChild(textarea);
        textarea.focus();

        activeTextInput = textarea;

        // Finalize text input when user clicks away
        const finalizeTextHandler = (e) => {
            if (e.target !== textarea && !e.target.classList.contains('tool-button')) {
                finalizeText();
                document.removeEventListener('click', finalizeTextHandler);
            }
        };

        // Wait a moment before adding the listener to prevent immediate triggering
        setTimeout(() => {
            document.addEventListener('click', finalizeTextHandler);
        }, 100);
    }

    /**
     * Finalizes the text from the active input field and adds it to the drawing history.
     */
    function finalizeText() {
        if (!activeTextInput) return;
        const text = activeTextInput.value.trim();
        if (text) {
            const rect = whiteboardCanvas.getBoundingClientRect();
            const textData = {
                type: 'text',
                text: text,
                x: activeTextInput.offsetLeft - rect.left,
                y: activeTextInput.offsetTop - rect.top + activeTextInput.clientHeight,
                color: activeTextInput.style.color,
                size: parseInt(activeTextInput.style.fontSize)
            };
            whiteboardPages[currentPageIndex].push(textData);
            emitWhiteboardData('draw', textData);
            pushToUndoStack();
            renderCurrentWhiteboardPage();
        }
        activeTextInput.remove();
        activeTextInput = null;
    }

    /**
     * Handles the 'undo' action.
     */
    function undo() {
        if (undoStack.length > 0) {
            // Get the last state before the current one
            const lastState = undoStack.pop();
            // Push the current state to the redo stack
            redoStack.push(JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex])));
            // Restore the previous state
            whiteboardPages[currentPageIndex] = lastState;
            renderCurrentWhiteboardPage();
            // Emit the new state to all clients
            emitWhiteboardData('update', {
                page_data: whiteboardPages[currentPageIndex]
            });
            console.log('[Whiteboard] Undo performed.');
            updateWhiteboardControls();
        } else {
            showNotification('Nothing to undo.', true);
        }
    }

    /**
     * Handles the 'redo' action.
     */
    function redo() {
        if (redoStack.length > 0) {
            // Pop from the redo stack
            const nextState = redoStack.pop();
            // Push the current state to the undo stack
            undoStack.push(JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex])));
            // Restore the next state
            whiteboardPages[currentPageIndex] = nextState;
            renderCurrentWhiteboardPage();
            // Emit the new state to all clients
            emitWhiteboardData('update', {
                page_data: whiteboardPages[currentPageIndex]
            });
            console.log('[Whiteboard] Redo performed.');
            updateWhiteboardControls();
        } else {
            showNotification('Nothing to redo.', true);
        }
    }

    /**
     * Clears the current whiteboard page.
     * @param {boolean} [emitEvent=true] - Whether to emit a Socket.IO event.
     */
    function clearWhiteboard(emitEvent = true) {
        if (activeTextInput) {
            finalizeText();
        }
        if (window.confirm('Are you sure you want to clear the entire page?')) {
            whiteboardPages[currentPageIndex] = [];
            renderCurrentWhiteboardPage();
            pushToUndoStack();
            if (emitEvent && socket && currentClassroom) {
                emitWhiteboardData('clear', {});
                console.log(`[Whiteboard] Emitted 'clear' event for page ${currentPageIndex + 1}.`);
            }
            showNotification(`Whiteboard page ${currentPageIndex + 1} cleared.`);
        }
    }

    /**
     * Saves the current whiteboard canvas content as a PNG image file.
     */
    function saveWhiteboard() {
        if (!whiteboardCanvas) return;
        const dataURL = whiteboardCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `whiteboard-page-${currentPageIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Whiteboard saved as PNG.');
    }

    /**
     * Navigates to a different whiteboard page.
     * @param {number} newPageIndex - The index of the page to navigate to.
     */
    function navigateWhiteboardPage(newPageIndex) {
        if (activeTextInput) {
            finalizeText();
        }

        if (newPageIndex < 0 || newPageIndex > whiteboardPages.length) {
            console.warn(`[Whiteboard] Invalid page index: ${newPageIndex}`);
            return;
        }

        // Auto-create a new page if navigating to the next one
        if (newPageIndex >= whiteboardPages.length) {
            whiteboardPages.push([]);
        }

        currentPageIndex = newPageIndex;
        renderCurrentWhiteboardPage();
        updateWhiteboardControls();
        showNotification(`Switched to whiteboard page ${currentPageIndex + 1}`);
    }

    /**
     * Updates the UI state of the whiteboard controls (e.g., page display, button disabled states).
     */
    function updateWhiteboardControls() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
        }
        if (prevWhiteboardPageBtn) {
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
        }
        // Next button is never disabled, as we can always create a new page
    }

    /**
     * Emits whiteboard drawing/clear data to the Socket.IO server.
     * @param {string} action - The action type (e.g., 'draw', 'clear').
     * @param {object} data - The drawing-specific data.
     */
    function emitWhiteboardData(action, data) {
        if (socket && socket.connected && currentClassroom && currentClassroom.id) {
            const payload = {
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex,
                action: action,
                data: data,
                userId: currentUser.id,
                username: currentUser.username,
                role: currentUser.role
            };
            socket.emit('whiteboard_data', payload);
        } else {
            console.warn('[Whiteboard] Socket not connected or classroom not set. Cannot emit whiteboard data.');
        }
    }

    // --- Chat Functions ---

    /**
     * Sets up event listeners for the chat input and send button.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }

    /**
     * Sends a chat message to the server via Socket.IO.
     */
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && socket && currentClassroom && currentClassroom.id && currentUser) {
            socket.emit('message', {
                classroomId: currentClassroom.id,
                message: message,
                username: currentUser.username,
                role: currentUser.role,
                userId: currentUser.id
            });
            chatInput.value = '';
        } else {
            console.warn('[Chat] Cannot send message: Message empty, socket not connected, or classroom/user info missing.');
            showNotification('Could not send message. Please ensure you are in a classroom and logged in.', true);
        }
    }

    // --- Library Functions ---

    /**
     * Loads and displays files present in the current classroom's library.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            if (libraryFilesList) libraryFilesList.innerHTML = '<p>Select a classroom to view library files.</p>';
            console.warn('[Library] Cannot load files: No current classroom.');
            return;
        }
        if (libraryFilesList) libraryFilesList.innerHTML = 'Loading files...';

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/library`);
            const data = await response.json();

            if (response.ok) {
                const files = data.files;
                const searchTerm = librarySearchInput.value.toLowerCase();
                const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchTerm));

                if (libraryFilesList) {
                    libraryFilesList.innerHTML = '';
                    if (filteredFiles.length === 0) {
                        libraryFilesList.innerHTML = '<p>No files found.</p>';
                    } else {
                        filteredFiles.forEach(file => {
                            const fileItem = document.createElement('div');
                            fileItem.classList.add('library-file-item');
                            const downloadUrl = `/api/files/${file.id}/download`;
                            fileItem.innerHTML = `
                                <span>${file.filename}</span>
                                <a href="${downloadUrl}" download="${file.filename}" class="download-file-btn">Download</a>
                            `;
                            libraryFilesList.appendChild(fileItem);
                        });
                    }
                }
            } else {
                throw new Error(data.error || 'Failed to load library files.');
            }
        } catch (error) {
            console.error('[Library] Load error:', error);
            if (libraryFilesList) libraryFilesList.innerHTML = `<p class="error">Failed to load files: ${error.message}</p>`;
        }
    }

    /**
     * Handles file upload to the classroom library.
     */
    async function handleFileUpload() {
        if (!currentClassroom || !currentClassroom.id) {
            showNotification('Please join a classroom before uploading files.', true);
            return;
        }
        if (libraryFileInput.files.length === 0) {
            showNotification('Please select a file to upload.', true);
            return;
        }

        const formData = new FormData();
        formData.append('file', libraryFileInput.files[0]);

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/library/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
                showNotification('File uploaded successfully!');
                libraryFileInput.value = ''; // Clear the input
                await loadLibraryFiles(); // Reload the list
            } else {
                throw new Error(data.error || 'File upload failed.');
            }
        } catch (error) {
            console.error('[Library] Upload error:', error);
            showNotification(`File upload failed: ${error.message}`, true);
        }
    }

    /**
     * Updates the library section's UI based on the user's role.
     */
    function updateLibraryUi() {
        if (currentUser.role === 'admin' && libraryRoleMessage) {
            libraryRoleMessage.textContent = 'As an admin, you can upload and manage library files.';
            if (libraryFileInput) libraryFileInput.parentElement.classList.remove('hidden');
            if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.classList.remove('hidden');
        } else if (libraryRoleMessage) {
            libraryRoleMessage.textContent = 'You are a participant. You can view and download library files.';
            if (libraryFileInput) libraryFileInput.parentElement.classList.add('hidden');
            if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.classList.add('hidden');
        }
    }

    // --- Assessment Functions ---

    /**
     * Displays the assessment creation form (admin only).
     */
    function showAssessmentCreationForm() {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can create assessments.', true);
            return;
        }
        if (assessmentListContainer) assessmentListContainer.classList.add('hidden');
        if (assessmentCreationForm) assessmentCreationForm.classList.remove('hidden');
        questionsContainer.innerHTML = '';
        questionCounter = 0;
        addQuestion(); // Start with one question
    }

    /**
     * Adds a new question field to the assessment creation form.
     */
    function addQuestion() {
        questionCounter++;
        const questionHtml = `
            <div class="question-item">
                <h4>Question ${questionCounter}</h4>
                <label>Question Type:</label>
                <select name="question_type_${questionCounter}" class="question-type-select">
                    <option value="text">Text Answer</option>
                    <option value="mcq">Multiple Choice</option>
                </select>
                <label>Question Text:</label>
                <input type="text" name="question_text_${questionCounter}" required>
                <div class="mcq-options hidden">
                    <label>Options (comma-separated):</label>
                    <input type="text" name="mcq_options_${questionCounter}">
                    <label>Correct Answer (exact text of one option):</label>
                    <input type="text" name="correct_answer_${questionCounter}">
                </div>
            </div>
        `;
        const div = document.createElement('div');
        div.innerHTML = questionHtml;
        questionsContainer.appendChild(div);

        const selectElement = div.querySelector('.question-type-select');
        const mcqOptionsDiv = div.querySelector('.mcq-options');
        selectElement.addEventListener('change', (e) => {
            if (e.target.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
            }
        });
    }

    /**
     * Handles the creation of a new assessment.
     * @param {Event} e - The form submission event.
     */
    async function handleCreateAssessment(e) {
        e.preventDefault();
        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionTextarea.value.trim();
        const scheduled_at = assessmentScheduledAtInput.value;
        const duration = parseInt(assessmentDurationMinutesInput.value, 10);

        if (!title || !scheduled_at || isNaN(duration) || duration <= 0) {
            displayMessage(assessmentCreationMessage, 'Please fill out all required fields.', true);
            return;
        }

        const questions = [];
        const questionDivs = questionsContainer.querySelectorAll('.question-item');
        let isValid = true;
        questionDivs.forEach((qDiv, index) => {
            const questionType = qDiv.querySelector('.question-type-select').value;
            const questionText = qDiv.querySelector(`input[name="question_text_${index+1}"]`).value.trim();
            if (!questionText) {
                isValid = false;
                return;
            }

            let questionData = {
                type: questionType,
                question_text: questionText
            };

            if (questionType === 'mcq') {
                const optionsStr = qDiv.querySelector(`input[name="mcq_options_${index+1}"]`).value.trim();
                const correctAnswer = qDiv.querySelector(`input[name="correct_answer_${index+1}"]`).value.trim();
                if (!optionsStr || !correctAnswer) {
                    isValid = false;
                    return;
                }
                const options = optionsStr.split(',').map(o => o.trim());
                questionData.options = options;
                questionData.correct_answer = correctAnswer;
            }
            questions.push(questionData);
        });

        if (!isValid || questions.length === 0) {
            displayMessage(assessmentCreationMessage, 'Please ensure all questions have valid text and options/answers for MCQ types.', true);
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    description,
                    scheduled_at,
                    duration,
                    questions
                })
            });
            const data = await response.json();

            if (response.ok) {
                displayMessage(assessmentCreationMessage, 'Assessment created successfully!', false);
                assessmentCreationForm.reset();
                showClassroomSubSection(assessmentListContainer);
                await loadAssessments();
            } else {
                throw new Error(data.error || 'Failed to create assessment.');
            }
        } catch (error) {
            console.error('[Assessment] Creation error:', error);
            displayMessage(assessmentCreationMessage, `Failed to create assessment: ${error.message}`, true);
        }
    }

    /**
     * Fetches and displays the list of assessments for the current classroom.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            if (assessmentListDiv) assessmentListDiv.innerHTML = '<p>Select a classroom to view assessments.</p>';
            return;
        }
        if (assessmentListDiv) assessmentListDiv.innerHTML = 'Loading assessments...';

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`);
            const data = await response.json();

            if (response.ok) {
                const assessments = data.assessments;
                const searchTerm = assessmentSearchInput.value.toLowerCase();
                const filteredAssessments = assessments.filter(a => a.title.toLowerCase().includes(searchTerm));

                if (assessmentListDiv) {
                    assessmentListDiv.innerHTML = '';
                    if (filteredAssessments.length === 0) {
                        assessmentListDiv.innerHTML = '<p>No assessments found.</p>';
                    } else {
                        filteredAssessments.forEach(assessment => {
                            const scheduledTime = new Date(assessment.scheduled_at);
                            const now = new Date();
                            const isLive = now >= scheduledTime && (now - scheduledTime) < (assessment.duration * 60 * 1000);
                            const status = isLive ? '<span class="status-live">Live</span>' : 'Scheduled';
                            const actionBtn = currentUser.role === 'admin' ?
                                `<button class="view-submissions-btn" data-id="${assessment.id}">View Submissions</button>` :
                                `<button class="take-assessment-btn" data-id="${assessment.id}" ${isLive ? '' : 'disabled'}>Take Assessment</button>`;

                            const assessmentItem = document.createElement('div');
                            assessmentItem.classList.add('assessment-item');
                            assessmentItem.innerHTML = `
                                <h4>${assessment.title} ${status}</h4>
                                <p>${assessment.description}</p>
                                <p>Scheduled: ${scheduledTime.toLocaleString()}</p>
                                <p>Duration: ${assessment.duration} minutes</p>
                                ${actionBtn}
                            `;
                            assessmentListDiv.appendChild(assessmentItem);
                        });
                    }
                }
            } else {
                throw new Error(data.error || 'Failed to load assessments.');
            }
        } catch (error) {
            console.error('[Assessment] Load error:', error);
            if (assessmentListDiv) assessmentListDiv.innerHTML = `<p class="error">Failed to load assessments: ${error.message}</p>`;
        }
    }

    /**
     * Prepares and displays the assessment-taking form.
     * @param {string} assessmentId - The ID of the assessment to take.
     */
    async function takeAssessment(assessmentId) {
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch assessment details.');
            }
            currentAssessmentToTake = data.assessment;

            // Check if assessment is live
            const scheduledTime = new Date(currentAssessmentToTake.scheduled_at);
            const now = new Date();
            const timeElapsed = now.getTime() - scheduledTime.getTime();
            const totalDurationMs = currentAssessmentToTake.duration * 60 * 1000;
            const timeLeftMs = totalDurationMs - timeElapsed;

            if (timeLeftMs <= 0) {
                showNotification('This assessment has ended.', true);
                currentAssessmentToTake = null;
                return;
            }

            // Display assessment info
            if (takeAssessmentTitle) takeAssessmentTitle.textContent = currentAssessmentToTake.title;
            if (takeAssessmentDescription) takeAssessmentDescription.textContent = currentAssessmentToTake.description;
            if (takeAssessmentForm) takeAssessmentForm.innerHTML = '';
            if (submitAnswersBtn) submitAnswersBtn.disabled = false;

            // Render questions
            currentAssessmentToTake.questions.forEach((q, index) => {
                const qDiv = document.createElement('div');
                qDiv.classList.add('question-display');
                qDiv.dataset.questionId = q.id;
                let questionHtml = `<p><strong>${index + 1}. ${q.question_text}</strong></p>`;
                if (q.type === 'mcq' && q.options) {
                    q.options.forEach(option => {
                        questionHtml += `
                            <label class="mcq-option">
                                <input type="radio" name="question_${q.id}" value="${option}">
                                ${option}
                            </label>
                        `;
                    });
                } else {
                    questionHtml += `<textarea name="question_${q.id}" rows="4" placeholder="Type your answer here..." required></textarea>`;
                }
                qDiv.innerHTML = questionHtml;
                if (takeAssessmentForm) takeAssessmentForm.appendChild(qDiv);
            });

            startAssessmentTimer(timeLeftMs);
            showClassroomSubSection(takeAssessmentContainer);
        } catch (error) {
            console.error('[Assessment] Take error:', error);
            showNotification(`Failed to load assessment: ${error.message}`, true);
        }
    }

    /**
     * Starts the countdown timer for an assessment.
     * @param {number} timeLeftMs - The time left in milliseconds.
     */
    function startAssessmentTimer(timeLeftMs) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }
        assessmentEndTime = new Date(Date.now() + timeLeftMs);

        const updateTimer = () => {
            const now = new Date().getTime();
            const timeLeft = assessmentEndTime - now;

            if (timeLeft <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerInterval = null;
                if (assessmentTimerDisplay) assessmentTimerDisplay.textContent = 'Time Up!';
                submitAnswers(true); // Auto-submit
                return;
            }

            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            const displayTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (assessmentTimerDisplay) {
                assessmentTimerDisplay.textContent = `Time Left: ${displayTime}`;
                assessmentTimerDisplay.classList.remove('warning', 'critical');
                if (timeLeft < 60 * 1000) {
                    assessmentTimerDisplay.classList.add('critical');
                } else if (timeLeft < 5 * 60 * 1000) {
                    assessmentTimerDisplay.classList.add('warning');
                }
            }
        };

        updateTimer();
        assessmentTimerInterval = setInterval(updateTimer, 1000);
        if (assessmentTimerDisplay) assessmentTimerDisplay.classList.add('active');
        console.log('[Assessment] Assessment timer started.');
    }

    /**
     * Submits the user's collected answers for the current assessment.
     * @param {boolean} [isAutoSubmit=false] - True if this is an automatic submission.
     */
    async function submitAnswers(isAutoSubmit = false) {
        if (!currentAssessmentToTake || !currentClassroom || !currentUser) {
            showNotification('Missing data for submission.', true);
            return;
        }

        if (submitAnswersBtn) submitAnswersBtn.disabled = true;
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
        }
        if (assessmentTimerDisplay) assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        if (assessmentSubmissionMessage) assessmentSubmissionMessage.textContent = 'Submitting...';

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
            answers.push({
                question_id: questionId,
                user_answer: userAnswer
            });
        });

        try {
            const response = await fetch(`/api/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    username: currentUser.username,
                    answers: answers
                })
            });
            const data = await response.json();

            if (response.ok) {
                const message = isAutoSubmit ? 'Time up! Your answers have been automatically submitted.' : 'Your answers have been submitted successfully!';
                showNotification(message);
                showClassroomSubSection(assessmentListContainer);
            } else {
                throw new Error(data.error || 'Submission failed.');
            }
        } catch (error) {
            console.error('[Assessment] Submission error:', error);
            showNotification(`Submission failed: ${error.message}`, true);
            if (submitAnswersBtn) submitAnswersBtn.disabled = false;
        } finally {
            if (assessmentSubmissionMessage) assessmentSubmissionMessage.textContent = '';
        }
    }

    /**
     * Fetches and displays submissions for a specific assessment (admin only).
     * @param {string} assessmentId - The ID of the assessment.
     */
    async function viewSubmissions(assessmentId) {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can view submissions.', true);
            return;
        }
        if (submissionsList) submissionsList.innerHTML = 'Loading submissions...';

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch submissions.');
            }

            const assessment = data.assessment;
            const submissions = data.submissions;

            if (submissionsAssessmentTitle) submissionsAssessmentTitle.textContent = `Submissions for: ${assessment.title}`;
            if (submissionsList) {
                submissionsList.innerHTML = '';
                if (submissions.length === 0) {
                    submissionsList.innerHTML = '<p>No submissions yet.</p>';
                } else {
                    submissions.forEach(submission => {
                        const submissionItem = document.createElement('div');
                        submissionItem.classList.add('submission-item');
                        let scoreDisplay = '';
                        if (submission.score !== undefined) {
                            scoreDisplay = `Score: ${submission.score}/${submission.total_questions}`;
                        } else {
                            scoreDisplay = 'Score: Pending (manual grading required)';
                        }
                        submissionItem.innerHTML = `
                            <h4>${submission.username}</h4>
                            <p>${scoreDisplay}</p>
                            <div class="submission-details hidden">
                                <h5>Answers:</h5>
                                ${submission.answers.map(answer => {
                                    const question = assessment.questions.find(q => q.id === answer.question_id);
                                    if (!question) return '';
                                    const correctness = question.type === 'mcq' ?
                                        (answer.user_answer === question.correct_answer ? '✅' : '❌') : '';
                                    return `<p><strong>Q:</strong> ${question.question_text}<br><strong>A:</strong> ${answer.user_answer} ${correctness}</p>`;
                                }).join('')}
                            </div>
                            <button class="toggle-answers-btn">Show/Hide Answers</button>
                        `;
                        submissionsList.appendChild(submissionItem);
                    });

                    // Add event listeners for the toggle buttons
                    submissionsList.querySelectorAll('.toggle-answers-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const details = btn.previousElementSibling;
                            details.classList.toggle('hidden');
                        });
                    });
                }
            }
            showClassroomSubSection(viewSubmissionsContainer);
        } catch (error) {
            console.error('[Assessment] View submissions error:', error);
            showNotification(`Failed to load submissions: ${error.message}`, true);
        }
    }

    // --- Event Listeners and Initializers ---

    /**
     * Sets up all the main application event listeners.
     */
    function setupEventListeners() {
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (registerForm) registerForm.addEventListener('submit', handleRegister);
        if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
        });
        if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
        });
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        if (navDashboard) navDashboard.addEventListener('click', () => {
            showSection(dashboardSection);
            loadClassroomList();
        });
        if (navSettings) navSettings.addEventListener('click', () => {
            showSection(settingsSection);
            if (currentUser && settingsUsernameInput) settingsUsernameInput.value = currentUser.username;
            if (currentUser && settingsEmailInput) settingsEmailInput.value = currentUser.email;
        });

        if (createClassroomBtn) createClassroomBtn.addEventListener('click', handleCreateClassroom);
        if (classroomList) {
            classroomList.addEventListener('click', (e) => {
                if (e.target.classList.contains('join-classroom-btn')) {
                    const id = e.target.dataset.id;
                    const name = e.target.dataset.name;
                    handleJoinClassroom(id, name);
                }
            });
        }
        if (classroomSearchInput) classroomSearchInput.addEventListener('input', loadClassroomList);
        if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            // Leave Socket.IO room
            if (socket && currentClassroom) {
                socket.emit('leave', {
                    classroomId: currentClassroom.id,
                    username: currentUser.username,
                    userId: currentUser.id
                });
            }
            currentClassroom = null;
            localStorage.removeItem('currentClassroom');
            loadClassroomList();
        });
        if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            loadClassroomList();
        });
        if (copyShareLinkBtn) copyShareLinkBtn.addEventListener('click', () => {
            if (shareLinkInput) {
                shareLinkInput.select();
                document.execCommand('copy');
                showNotification('Classroom link copied to clipboard!');
            }
        });

        // Classroom Sub-navigation
        if (navChat) navChat.addEventListener('click', () => {
            showClassroomSubSection(chatSection);
            setActiveClassroomNavButton(navChat);
            // Ensure chat history is loaded and scrolled to bottom
            fetchClassroomData();
        });
        if (navWhiteboard) navWhiteboard.addEventListener('click', () => {
            showClassroomSubSection(whiteboardArea);
            setActiveClassroomNavButton(navWhiteboard);
            renderCurrentWhiteboardPage(); // Re-render to ensure correct sizing
            updateWhiteboardControls();
        });
        if (navLibrary) navLibrary.addEventListener('click', async () => {
            showClassroomSubSection(librarySection);
            setActiveClassroomNavButton(navLibrary);
            await loadLibraryFiles();
            updateLibraryUi();
        });
        if (navAssessments) navAssessments.addEventListener('click', async () => {
            showClassroomSubSection(assessmentListContainer);
            setActiveClassroomNavButton(navAssessments);
            await loadAssessments();
        });

        // Whiteboard Controls
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (activeTextInput) finalizeText();
                document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;
                console.log(`[Whiteboard] Tool changed to: ${currentTool}`);
            });
        });
        if (colorPicker) colorPicker.addEventListener('input', (e) => currentColor = e.target.value);
        if (brushSizeSlider) brushSizeSlider.addEventListener('input', (e) => currentBrushSize = e.target.value);
        if (undoButton) undoButton.addEventListener('click', undo);
        if (redoButton) redoButton.addEventListener('click', redo);
        if (clearButton) clearButton.addEventListener('click', () => clearWhiteboard(true));
        if (saveButton) saveButton.addEventListener('click', saveWhiteboard);
        if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', () => navigateWhiteboardPage(currentPageIndex - 1));
        if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', () => navigateWhiteboardPage(currentPageIndex + 1));
        if (textToolButton) textToolButton.addEventListener('click', finalizeText); // Finalize when switching away from text tool

        // Chat Controls
        setupChatControls();

        // Video Broadcast Controls
        if (startBroadcastBtn) startBroadcastBtn.addEventListener('click', startBroadcast);
        if (endBroadcastBtn) endBroadcastBtn.addEventListener('click', endBroadcast);
        broadcastTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentBroadcastType = e.target.value;
                console.log(`[WebRTC] Broadcast type changed to: ${currentBroadcastType}`);
            });
        });

        // Library Controls
        if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.addEventListener('click', handleFileUpload);
        if (librarySearchInput) librarySearchInput.addEventListener('input', loadLibraryFiles);

        // Assessment Controls
        const createAssessmentBtn = document.getElementById('create-assessment-btn');
        if (createAssessmentBtn) createAssessmentBtn.addEventListener('click', showAssessmentCreationForm);
        if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestion);
        if (assessmentCreationForm) assessmentCreationForm.addEventListener('submit', handleCreateAssessment);
        if (assessmentListDiv) {
            assessmentListDiv.addEventListener('click', async (e) => {
                const btn = e.target;
                if (btn.classList.contains('take-assessment-btn')) {
                    await takeAssessment(btn.dataset.id);
                } else if (btn.classList.contains('view-submissions-btn')) {
                    await viewSubmissions(btn.dataset.id);
                }
            });
        }
        if (assessmentSearchInput) assessmentSearchInput.addEventListener('input', loadAssessments);
        if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', () => submitAnswers(false));
        if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentListContainer);
            loadAssessments();
        });
        if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentListContainer);
            loadAssessments();
        });

        // Sidebar Controls
        if (hamburgerMenuBtn) {
            hamburgerMenuBtn.addEventListener('click', () => {
                console.log('[Sidebar] Sidebar opened via hamburger menu.');
                sidebar.classList.add('active');
                sidebar.classList.remove('hidden');
                document.body.classList.add('sidebar-open');
            });
        }
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => {
                console.log('[Sidebar] Sidebar closed via close button.');
                sidebar.classList.remove('active');
                sidebar.classList.add('hidden');
                document.body.classList.remove('sidebar-open');
            });
        }
        document.addEventListener('click', (e) => {
            if (sidebar && sidebar.classList.contains('active') && !sidebar.contains(e.target) && !hamburgerMenuBtn.contains(e.target) && !e.target.closest('.sidebar-trigger-ignore')) {
                console.log('[Sidebar] Sidebar closed by clicking outside.');
                sidebar.classList.remove('active');
                sidebar.classList.add('hidden');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // --- Application Initialization ---
    function init() {
        console.log('[App] Initializing...');
        initializeWhiteboard();
        setupEventListeners();
        updateBroadcastUi();
        navigate();
        if (currentUser) {
            initializeSocketIo();
            if (currentClassroom) {
                // If a classroom is in local storage, try to re-join it
                handleJoinClassroom(currentClassroom.id, currentClassroom.name);
            } else {
                // Otherwise, go to the dashboard to select one
                loadClassroomList();
            }
        }
    }

    // Call the main initialization function when the DOM is ready
    init();
});
