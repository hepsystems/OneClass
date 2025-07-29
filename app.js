// app.js (Complete Rewrite with Notifications, Whiteboard Pages, and Selective Broadcast)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const app = document.getElementById('app');
    const authSection = document.getElementById('auth-section');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    const dashboardSection = document.getElementById('dashboard-section');
    const classroomIdDisplay = document.getElementById('classroomId-display');
    const currentUsernameDisplay = document.getElementById('current-username-display');
    const navDashboard = document.getElementById('nav-dashboard');
    const navClassroom = document.getElementById('nav-classroom');
    const navSettings = document.getElementById('nav-settings');
    const logoutBtn = document.getElementById('logout-btn');

    const createClassroomSection = document.getElementById('create-classroom-section');
    const newClassroomNameInput = document.getElementById('new-classroom-name');
    const createClassroomBtn = document.getElementById('create-classroom-btn');
    const classroomMessage = document.getElementById('classroom-message');
    const classroomList = document.getElementById('classroom-list');
    const classroomSearchInput = document.getElementById('classroom-search-input'); // New search input

    const classroomSection = document.getElementById('classroom-section');
    const classNameValue = document.getElementById('class-name-value');
    const classCodeSpan = document.getElementById('class-code');
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
    const settingsEmailInput = document.getElementById('settings-email');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');

    // Share link elements
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');

    // Chat functionality elements
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

    // Video Broadcast Elements
    const broadcastTypeRadios = document.querySelectorAll('input[name="broadcastType"]');
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const localVideoContainer = document.getElementById('local-video-container'); // New: Reference to the local video wrapper
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastRoleMessage = document.getElementById('broadcast-role-message');

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryRoleMessage = document.getElementById('library-role-message');
    const libraryFilesList = document.getElementById('library-files-list'); // Ensure this element is referenced
    const librarySearchInput = document.getElementById('library-search-input'); // New search input

    // Assessment Elements
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionTextarea = document.getElementById('assessment-description');
    const assessmentScheduledAtInput = document.getElementById('assessment-scheduled-at'); // New
    const assessmentDurationMinutesInput = document.getElementById('assessment-duration-minutes'); // New
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentListDiv = document.getElementById('assessment-list');
    const assessmentSearchInput = document.getElementById('assessment-search-input'); // New search input
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const assessmentTimerDisplay = document.getElementById('assessment-timer'); // New timer display
    const takeAssessmentForm = document.getElementById('take-assessment-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');
    const viewSubmissionsContainer = document.getElementById('view-submissions-container');
    const submissionsAssessmentTitle = document.getElementById('submissions-assessment-title');
    const submissionsList = document.getElementById('submissions-list');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');

    const notificationsContainer = document.getElementById('notifications-container');


    // --- Global Variables ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentAssessmentToTake = null;
    let assessmentTimerInterval = null; // For the countdown timer
    let assessmentEndTime = null; // The exact Date object when the assessment should end
    let whiteboardSaveInterval = null; // For periodic auto-saving

    // WebRTC Variables
    let localStream;
    const peerConnections = {};
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
        ]
    };

    // Whiteboard Variables
    let whiteboardCtx;
    let isDrawing = false;
    let startX, startY;
    let lastX, lastY; // Used for live drawing of pen/eraser segments
    let currentColor = colorPicker ? colorPicker.value : '#FF0000'; // Default color
    let currentBrushSize = brushSizeSlider ? parseInt(brushSizeSlider.value) : 5; // Default size
    let currentTool = 'pen';
    let snapshot; // For temporary drawing of shapes

    // For advanced pen/eraser drawing (stroke smoothing, line interpolation)
    let currentStrokePoints = []; // Stores all points for a single pen/eraser stroke

    // Whiteboard History (Multi-page)
    let whiteboardPages = [[]]; // Array of arrays, each sub-array is a page of drawing commands
    let currentPageIndex = 0;
    const undoStack = []; // For local undo/redo of single actions on current page
    const redoStack = [];
    const MAX_HISTORY_STEPS = 50;

    // Video Zoom States
    const videoZoomStates = new Map(); // Map: videoElement.id -> { currentScale: 1, isZoomed: false, offsetX: 0, offsetY: 0 }


    // --- Utility Functions ---

    /**
     * Displays a temporary notification message to the user.
     * @param {string} message - The message to display.
     * @param {boolean} isError - True if it's an error message, false for success/info.
     */
    function showNotification(message, isError = false) {
        if (notificationsContainer) {
            notificationsContainer.textContent = message;
            notificationsContainer.className = isError ? 'error-notification' : 'success-notification';
            notificationsContainer.classList.add('show');
            setTimeout(() => {
                notificationsContainer.classList.remove('show');
                notificationsContainer.textContent = '';
            }, 5000); // Hide after 5 seconds
        }
    }

    /**
     * Helper to display form-specific messages.
     * @param {HTMLElement} element - The paragraph element to display the message in.
     * @param {string} message - The message text.
     * @param {boolean} isError - True for error, false for success.
     */
    function displayMessage(element, message, isError) {
        element.textContent = message;
        element.className = isError ? 'error' : 'success';
    }

    /**
     * Shows a specific main section of the app and hides others.
     * @param {HTMLElement} sectionToShow - The DOM element of the section to show.
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
        }
    }

    /**
     * Shows a specific sub-section within the classroom and hides others.
     * @param {HTMLElement} subSectionToShow - The DOM element of the sub-section to show.
     */
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

    /**
     * Updates the active state of navigation buttons.
     * @param {HTMLElement} activeButton - The button to mark as active.
     */
    function updateNavActiveState(activeButton) {
        [navDashboard, navClassroom, navSettings, navChat, navWhiteboard, navLibrary, navAssessments].forEach(btn => {
            if (btn) btn.classList.remove('active-nav');
        });
        if (activeButton) {
            activeButton.classList.add('active-nav');
        }
    }

    /**
     * Updates UI elements based on the current user's role (admin/user).
     * Elements with `data-admin-only` are shown only for admins.
     * Elements with `data-user-only` are shown only for regular users.
     */
    function updateUIBasedOnRole() {
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isUser = currentUser && currentUser.role === 'user';

        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
            el.classList.toggle('admin-feature-highlight', isAdmin);
        });

        document.querySelectorAll('[data-user-only]').forEach(el => {
            el.classList.toggle('hidden', !isUser);
            el.classList.toggle('user-view-subtle', isUser);
        });

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

        if (whiteboardCanvas) {
            whiteboardCanvas.style.pointerEvents = isAdmin ? 'auto' : 'none';
        }
    }

    /**
     * Returns the display name of a user, appending "(Admin)" if the role is admin.
     * @param {string} username - The user's username.
     * @param {string} role - The user's role ('user' or 'admin').
     * @returns {string} The formatted display name.
     */
    function getDisplayName(username, role) {
        return role === 'admin' ? `${username} (Admin)` : username;
    }


    // --- Authentication Functions ---

    /**
     * Checks the current login status from localStorage and updates the UI.
     * Handles direct classroom link access.
     */
    function checkLoginStatus() {
        if (currentUser) {
            showSection(dashboardSection);
            currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
            classroomIdDisplay.textContent = currentClassroom ? currentClassroom.id : 'N/A';
            loadAvailableClassrooms();
            updateNavActiveState(navDashboard);
            updateUIBasedOnRole();

            // Handle direct classroom link access (e.g., /classroom/<id>)
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                const idFromUrl = pathParts[2];
                fetch(`/api/classrooms`) // Fetch all classrooms to find the one by ID
                    .then(res => res.json())
                    .then(classrooms => {
                        const matched = classrooms.find(cls => cls.id === idFromUrl);
                        if (matched) {
                            enterClassroom(matched.id, matched.name);
                        } else {
                            localStorage.removeItem('currentClassroom');
                            currentClassroom = null;
                            showNotification("Classroom not found or not joined yet.", true);
                            showSection(dashboardSection);
                            loadAvailableClassrooms();
                        }
                    })
                    .catch(err => {
                        console.error("Error fetching classroom details:", err);
                        showNotification("Could not load classroom.", true);
                        showSection(dashboardSection);
                        loadAvailableClassrooms();
                    });
            }
        } else {
            showSection(authSection);
            document.querySelectorAll('[data-admin-only], [data-user-only]').forEach(el => {
                el.classList.add('hidden');
            });
        }
    }

    // --- Dashboard Functions ---

    /**
     * Loads all available classrooms and displays them, categorized by user's participation.
     * Filters classrooms based on the search input.
     */
    async function loadAvailableClassrooms() {
        if (!currentUser || !currentUser.id) {
            classroomList.innerHTML = '<li>Please log in to see available classrooms.</li>';
            return;
        }
        try {
            const response = await fetch('/api/classrooms');
            let classrooms = await response.json();

            const searchTerm = classroomSearchInput.value.toLowerCase();
            if (searchTerm) {
                classrooms = classrooms.filter(cls =>
                    cls.name.toLowerCase().includes(searchTerm) ||
                    cls.id.toLowerCase().includes(searchTerm)
                );
            }

            classroomList.innerHTML = '';

            if (classrooms.length === 0) {
                classroomList.innerHTML = '<li>No classrooms found matching your search.</li>';
                return;
            }

            const userJoinedClassrooms = classrooms.filter(cls =>
                cls.creator_id === currentUser.id || (cls.participants && cls.participants.includes(currentUser.id))
            );
            const otherClassrooms = classrooms.filter(cls =>
                cls.creator_id !== currentUser.id && (!cls.participants || !cls.participants.includes(currentUser.id))
            );

            if (userJoinedClassrooms.length > 0) {
                const h3 = document.createElement('h3');
                h3.textContent = 'Your Classrooms';
                classroomList.appendChild(h3);
                userJoinedClassrooms.forEach(classroom => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${classroom.name} (ID: ${classroom.id})</span>
                        <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" class="go-to-classroom-btn">Enter Classroom</button>
                    `;
                    classroomList.appendChild(li);
                });
            }

            if (otherClassrooms.length > 0) {
                const h3 = document.createElement('h3');
                h3.textContent = 'Available Classrooms to Join';
                classroomList.appendChild(h3);
                otherClassrooms.forEach(classroom => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${classroom.name} (ID: ${classroom.id})</span>
                        <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" class="join-classroom-btn">Join Classroom</button>
                    `;
                    classroomList.appendChild(li);
                });
            }

            if (userJoinedClassrooms.length === 0 && otherClassrooms.length === 0) {
                classroomList.innerHTML = '<li>No classrooms found. Create one or wait for an admin to create one!</li>';
            }

            document.querySelectorAll('.go-to-classroom-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.classroomId;
                    const name = e.target.dataset.classroomName;
                    enterClassroom(id, name);
                });
            });

            document.querySelectorAll('.join-classroom-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = e.target.dataset.classroomId;
                    const name = e.target.dataset.classroomName;
                    try {
                        const response = await fetch('/api/join-classroom', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ classroomId: id })
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showNotification(result.message);
                            loadAvailableClassrooms(); // Reload list to update status
                            enterClassroom(id, name); // Immediately enter after joining
                        } else {
                            showNotification(result.error, true);
                        }
                    } catch (error) {
                        console.error('Error joining classroom:', error);
                        showNotification('An error occurred during joining.', true);
                    }
                });
            });
        } catch (error) {
            console.error('Error loading classrooms:', error);
            classroomList.innerHTML = '<li>Failed to load classrooms.</li>';
        }
    }

    // --- Classroom Functions ---

    /**
     * Enters a specific classroom, updates UI, initializes Socket.IO, and loads content.
     * @param {string} id - The ID of the classroom.
     * @param {string} name - The name of the classroom.
     */
    function enterClassroom(id, name) {
        currentClassroom = { id: id, name: name };
        localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom));
        classroomIdDisplay.textContent = id;
        classNameValue.textContent = name;
        classCodeSpan.textContent = id;

        showSection(classroomSection);
        showClassroomSubSection(whiteboardArea);
        updateNavActiveState(navWhiteboard);
        updateUIBasedOnRole();

        initializeSocketIO();
        setupWhiteboardControls();
        setupChatControls(); // Ensure chat controls are also set up

        // Reset broadcast buttons state based on role
        if (currentUser && currentUser.role === 'admin') {
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
            // Ensure broadcast type radios are visible for admin
            broadcastTypeRadios.forEach(radio => radio.parentElement.classList.remove('hidden'));
        } else {
            startBroadcastBtn.classList.add('hidden');
            endBroadcastBtn.classList.add('hidden');
            // Hide broadcast type radios for non-admins
            broadcastTypeRadios.forEach(radio => radio.parentElement.classList.add('hidden'));
        }

        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';

        loadAssessments();
        loadLibraryFiles();
        fetchWhiteboardHistory(); // Load whiteboard history for the current page
        loadWhiteboardFromLocalStorage(); // Load local whiteboard state
        startPeriodicWhiteboardSave(); // Start auto-saving
    }

    /**
     * Cleans up classroom-related resources when leaving a classroom.
     */
    function cleanupClassroomResources() {
        if (socket && currentClassroom && currentClassroom.id) {
            socket.emit('leave', { 'classroomId': currentClassroom.id });
            socket.disconnect();
            socket = null;
        } else if (socket) {
            socket.disconnect();
            socket = null;
        }
        endBroadcast(); // Clean up all WebRTC resources

        // Clear whiteboard canvas and reset state
        if (whiteboardCtx && whiteboardCanvas) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000'; // Fill with black
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        whiteboardPages = [[]]; // Reset whiteboard pages
        currentPageIndex = 0;
        undoStack.length = 0; // Clear undo/redo stacks
        redoStack.length = 0;
        updateUndoRedoButtons(); // Reset undo/redo buttons
        updateWhiteboardPageDisplay(); // Reset page display
        stopPeriodicWhiteboardSave(); // Stop auto-saving

        // Clear chat messages and remote videos
        if (chatMessages) chatMessages.innerHTML = '';
        if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        
        currentClassroom = null;
        localStorage.removeItem('currentClassroom');

        // Clear any active assessment timer
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
        }
        if (assessmentTimerDisplay) {
            assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        }
    }

    // --- Socket.IO Initialization and Handlers ---

    /**
     * Initializes the Socket.IO connection and sets up event listeners.
     */
    function initializeSocketIO() {
        if (socket) {
            socket.disconnect();
        }
        socket = io();

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected. SID:', socket.id);
            if (currentClassroom && currentClassroom.id) {
                socket.emit('join', { 'classroomId': currentClassroom.id, 'role': currentUser.role });
                showNotification("Connected to classroom: " + currentClassroom.name);
                // Request whiteboard history on reconnect
                socket.emit('request_whiteboard_history', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
            } else {
                console.error('[Socket.IO] Cannot join classroom: currentClassroom.id is undefined.');
                showNotification("Error: Could not join classroom.", true);
            }
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO] Disconnected');
            showNotification("Disconnected from classroom.", true);
            // Close all peer connections and remove remote videos on disconnect
            for (const peerId in peerConnections) {
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
            }
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        });

        socket.on('status', (data) => {
            console.log('[Socket.IO] Server Status:', data.message);
        });

        socket.on('admin_action_update', (data) => {
            console.log('[Admin Action] Received:', data.message);
            showNotification(`Admin Action: ${data.message}`);
            // Re-fetch data if relevant (e.g., library, assessments)
            if (data.message.includes('library')) {
                loadLibraryFiles();
            }
            if (data.message.includes('assessment')) {
                loadAssessments(); // Reload assessments to update status/availability
            }
        });

        socket.on('message', (data) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message-item'); // Base class for all messages

            const currentUserId = sessionStorage.getItem('user_id'); // Get the current logged-in user's ID
            // NOTE: data.sender_id is expected to be available from the server for message origin
            if (data.user_id === currentUserId) { // Use user_id from data, not sender_id
                messageElement.classList.add('chat-message-current-user');
            } else {
                messageElement.classList.add('chat-message-other-user');
            }

            if (data.role === 'admin') {
                messageElement.classList.add('chat-message-admin');
            }

            const senderDisplayName = getDisplayName(data.username, data.role);
            const date = new Date(data.timestamp);
            const options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            const formattedDateTime = date.toLocaleString(undefined, options);
            // Use innerHTML to allow styling of parts of the message content
            messageElement.innerHTML = `<span class="chat-sender-name">${senderDisplayName}</span> <span class="chat-timestamp">(${formattedDateTime}):</span> ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('chat_history', (history) => {
            chatMessages.innerHTML = '';
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('chat-message-item'); // Base class for all messages

                const currentUserId = sessionStorage.getItem('user_id'); // Get the current logged-in user's ID
                // NOTE: msg.user_id is expected to be available from the server for message origin
                if (msg.user_id === currentUserId) { // Use user_id from msg
                    messageElement.classList.add('chat-message-current-user');
                } else {
                    messageElement.classList.add('chat-message-other-user');
                }

                if (msg.role === 'admin') {
                    messageElement.classList.add('chat-message-admin');
                }

                const senderDisplayName = getDisplayName(msg.username, msg.role);
                const date = new Date(msg.timestamp);
                const options = {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                };
                const formattedDateTime = date.toLocaleString(undefined, options);
                // Use innerHTML to allow styling of parts of the message content
                messageElement.innerHTML = `<span class="chat-sender-name">${senderDisplayName}</span> <span class="chat-timestamp">(${formattedDateTime}):</span> ${msg.message}`;
                chatMessages.appendChild(messageElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('user_joined', (data) => {
            console.log(`[Socket.IO] User joined: ${data.username} (${data.sid})`);
            const statusMessage = document.createElement('div');
            const joinedDisplayName = getDisplayName(data.username, data.role);
            statusMessage.textContent = `${joinedDisplayName} has joined the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Admin: If I am the admin broadcaster and have a local stream, create an offer for the new participant
            if (currentUser && currentUser.role === 'admin' && localStream && localStream.active && data.sid !== socket.id) {
                console.log(`[WebRTC] Admin (${socket.id}) broadcasting. Creating offer for new peer: ${data.sid}`);
                createPeerConnection(data.sid, true, data.username); // true indicates caller (initiating offer)
            }
        });

        socket.on('user_left', (data) => {
            console.log(`[Socket.IO] User left: ${data.username} (${data.sid})`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has left the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            const peerId = data.sid;
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                // Remove the entire video wrapper
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        });

        socket.on('whiteboard_data', (data) => {
            if (!whiteboardCtx) {
                console.warn('[Whiteboard] Cannot draw: whiteboardCtx is null when receiving whiteboard data.');
                return;
            }
            const applyDrawingProperties = (tool, color, width) => {
                whiteboardCtx.strokeStyle = color;
                whiteboardCtx.lineWidth = width;
                whiteboardCtx.fillStyle = color;
                if (tool === 'eraser') {
                    whiteboardCtx.globalCompositeOperation = 'destination-out';
                } else {
                    whiteboardCtx.globalCompositeOperation = 'source-over';
                }
            };

            if (data.action === 'draw') {
                const drawingItem = data.data; // This is the actual drawing object sent from the server
                const pageIndex = data.pageIndex; // Correctly get pageIndex from the top-level data object

                // Ensure page exists locally. If not, create it.
                if (!whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                // Store the actual drawing item for re-rendering purposes
                whiteboardPages[pageIndex].push(drawingItem);

                // Only draw if it's the current active page
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.save();
                    // applyDrawingProperties expects tool, color, width from the drawing item
                    applyDrawingProperties(drawingItem.tool, drawingItem.color, drawingItem.width);
                    drawWhiteboardItem(drawingItem); // drawWhiteboardItem expects the full drawing item
                    whiteboardCtx.restore();
                    saveWhiteboardToLocalStorage(); // Save after each draw action
                }
            } else if (data.action === 'clear') {
                const pageIndex = data.pageIndex; // Correctly get pageIndex from the top-level data object
                if (whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = []; // Clear data for that specific page
                }
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    saveWhiteboardToLocalStorage(); // Save after clearing
                }
            } else if (data.action === 'history' && data.history) {
                whiteboardPages = data.history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [[]]; // Ensure at least one page
                }
                // Do not reset currentPageIndex here, it should be maintained by the user or server
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                saveWhiteboardToLocalStorage(); // Save fetched history
            }
        });

        socket.on('whiteboard_page_change', (data) => {
            const { newPageIndex } = data;
            if (newPageIndex >= 0 && newPageIndex < whiteboardPages.length) {
                currentPageIndex = newPageIndex;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                showNotification(`Whiteboard page changed to ${newPageIndex + 1}`);
            }
        });

        socket.on('webrtc_offer', async (data) => {
            if (data.sender_id === socket.id) return;
            console.log(`[WebRTC] Received WebRTC Offer from: ${data.sender_id} to ${socket.id}`);

            const peerId = data.sender_id;
            // Pass username if available in the offer data, otherwise use a placeholder
            const peerUsername = data.username || `Peer ${peerId.substring(0, 4)}`;
            if (!peerConnections[peerId]) {
                createPeerConnection(peerId, false, peerUsername); // false: this peer is the receiver
            }

            try {
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnections[peerId].createAnswer();
                await peerConnections[peerId].setLocalDescription(answer);
                socket.emit('webrtc_answer', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    answer: peerConnections[peerId].localDescription
                });
                console.log(`[WebRTC] Sent WebRTC Answer to: ${peerId} from ${socket.id}`);
            } catch (error) {
                console.error('[WebRTC] Error handling offer:', error);
            }
        });

        socket.on('webrtc_answer', async (data) => {
            if (data.sender_id === socket.id) return;
            console.log(`[WebRTC] Received WebRTC Answer from: ${data.sender_id} to ${socket.id}`);
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
            if (data.sender_id === socket.id) return;
            console.log(`[WebRTC] Received ICE Candidate from: ${data.sender_id} to ${socket.id}`);
            const peerId = data.sender_id;
            if (peerConnections[peerId] && data.candidate) {
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
            console.log(`[WebRTC] Peer disconnected signal received for: ${data.peer_id}`);
            const peerId = data.peer_id;
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                // Remove the entire video wrapper
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        });

        // New Socket.IO event for assessment start (emitted by server)
        socket.on('assessment_started', (data) => {
            // Ensure this event is only processed if the user is currently looking at this assessment
            if (currentAssessmentToTake && currentAssessmentToTake.id === data.assessmentId) {
                showNotification(`Assessment "${data.title}" has started!`);
                startAssessmentTimer(new Date(data.endTime)); // Start timer for the user
            }
        });

        // New Socket.IO event for submission marked feedback (emitted by server)
        socket.on('submission_marked', (data) => {
            if (currentUser && currentUser.id === data.studentId) {
                showNotification(`Your assessment "${data.assessmentTitle}" has been marked!`);
                // Optionally, trigger a view of their marked submission or a notification
                // For now, just a notification. You'd need a separate UI flow to show marked submissions.
                // Example: if you have a "My Submissions" section:
                // loadMySubmissions();
            }
        });
    }

    // --- WebRTC Functions ---

    /**
     * Starts the video/audio broadcast based on admin's selection.
     */
    async function startBroadcast() {
        if (!currentClassroom || !currentClassroom.id || !socket || !currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can start a broadcast in a classroom.", true);
            return;
        }

        if (localStream && localStream.active) {
            showNotification("Broadcast already active. Stopping it first.", true);
            endBroadcast();
            setTimeout(() => startBroadcast(), 500); // Restart after a short delay
            return;
        }

        const selectedType = document.querySelector('input[name="broadcastType"]:checked').value;
        const constraints = {
            video: selectedType === 'video_audio',
            audio: true // Audio is always true for both options
        };

        try {
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            localVideo.srcObject = localStream;
            startBroadcastBtn.disabled = true;
            endBroadcastBtn.disabled = false;
            showNotification(`Broadcast started: ${selectedType === 'video_audio' ? 'Video & Audio' : 'Audio Only'}`);

            // Notify others in the room that admin has started broadcasting
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Admin ${currentUser.username} started a ${selectedType === 'video_audio' ? 'video and audio' : 'audio only'} broadcast.`
            });

            // If there are already peers in the room (e.g., users joined before admin started broadcast),
            // the admin needs to initiate offers to them. This requires the server to send a list of SIDs
            // currently in the room to the admin, or for the admin to track them.
            // For simplicity in this example, we rely on the `user_joined` event to trigger
            // `createPeerConnection` for new users joining after the broadcast starts.
            // A more complete solution for existing users would involve the server notifying the admin
            // of existing peers, and the admin then initiating offers to them.

        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);
            showNotification(`Could not start broadcast. Error: ${err.message}. Please ensure camera and microphone access are granted.`, true);
            localStream = null;
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
        }
    }

    /**
     * Ends the active video/audio broadcast.
     */
    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            localVideo.srcObject = null;
        }

        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                socket.emit('webrtc_peer_disconnected', { classroomId: currentClassroom.id, peer_id: peerId });
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                // Remove the entire video wrapper
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        }

        showNotification('Broadcast ended.');
        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;

        socket.emit('admin_action_update', {
            classroomId: currentClassroom.id,
            message: `Admin ${currentUser.username} ended the broadcast.`
        });
    }

    /**
     * Creates and configures an RTCPeerConnection for a given peer.
     * @param {string} peerId - The Socket.IO ID of the remote peer.
     * @param {boolean} isCaller - True if this peer initiates the offer (e.g., admin broadcasting).
     * @param {string} peerUsername - The username of the remote peer (for display).
     */
    async function createPeerConnection(peerId, isCaller, peerUsername) {
        if (peerConnections[peerId]) {
            console.log(`[WebRTC] Peer connection to ${peerId} already exists.`);
            return;
        }
        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;
        console.log(`[WebRTC] Created RTCPeerConnection for peer: ${peerId}. Is caller: ${isCaller}`);

        // Only add local stream tracks if this is the caller (broadcaster)
        if (isCaller && localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
                console.log(`[WebRTC] Added local track ${track.kind} to peer ${peerId}`);
            });
        } else if (!isCaller) {
            console.log(`[WebRTC] This peer (${socket.id}) is a receiver. Not adding local tracks to ${peerId}.`);
        }

        pc.ontrack = (event) => {
            console.log(`[WebRTC] Remote track received from: ${peerId}, kind: ${event.track.kind}`);
            let videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
            let remoteVideo = document.getElementById(`remote-video-${peerId}`);

            if (!videoWrapper) {
                videoWrapper = document.createElement('div');
                videoWrapper.className = 'remote-video-wrapper';
                videoWrapper.id = `video-wrapper-${peerId}`;

                remoteVideo = document.createElement('video');
                remoteVideo.id = `remote-video-${peerId}`;
                remoteVideo.autoplay = true;
                remoteVideo.playsInline = true;
                remoteVideo.controls = false; // Hide controls for a cleaner look

                const usernameDisplay = document.createElement('p');
                usernameDisplay.className = 'remote-username';
                usernameDisplay.textContent = peerUsername; // Display the peer's username

                const videoOverlay = document.createElement('div');
                videoOverlay.className = 'video-overlay';
                videoOverlay.textContent = 'Click to zoom';

                videoWrapper.appendChild(remoteVideo);
                videoWrapper.appendChild(usernameDisplay);
                videoWrapper.appendChild(videoOverlay); // Add the overlay
                remoteVideoContainer.appendChild(videoWrapper);
                console.log(`[WebRTC] Created remote video element and wrapper for: ${peerId}`);

                // Initialize zoom for the new remote video
                initializeZoomableVideo(remoteVideo, videoWrapper);
            }

            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            } else {
                // Fallback for older browsers or specific scenarios, though event.streams is preferred
                const newStream = new MediaStream();
                newStream.addTrack(event.track);
                remoteVideo.srcObject = newStream;
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC] Sending ICE Candidate from ${socket.id} to: ${peerId}`);
                socket.emit('webrtc_ice_candidate', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    candidate: event.candidate
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                console.log(`[WebRTC] Peer ${peerId} connection closed or failed. Cleaning up.`);
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        };

        if (isCaller) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log(`[WebRTC] Sending WebRTC Offer from ${socket.id} to: ${peerId}`);
                socket.emit('webrtc_offer', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    offer: pc.localDescription,
                    username: currentUser.username // Send current user's username with offer
                });
            } catch (error) {
                console.error('[WebRTC] Error creating offer:', error);
            }
        }
    }

    // --- Video Zoom Functions ---

    /**
     * Initializes zoom functionality for a given video element and its container.
     * @param {HTMLVideoElement} videoElement - The actual <video> DOM element.
     * @param {HTMLElement} containerElement - The wrapper div containing the video.
     */
    function initializeZoomableVideo(videoElement, containerElement) {
        if (!videoElement || !containerElement) return;

        // Ensure a unique ID for the video element for the map key
        if (!videoElement.id) {
            videoElement.id = `video-${Math.random().toString(36).substring(2, 9)}`;
        }

        // Initialize state for this specific video
        videoZoomStates.set(videoElement.id, {
            currentScale: 1,
            isZoomed: false,
            offsetX: 0, // For panning after zoom
            offsetY: 0
        });

        const zoomStep = 0.5; // How much to zoom in/out each step
        const maxZoom = 3.0;
        const minZoom = 1.0;

        let isDragging = false;
        let startX, startY;

        // Function to apply the transform based on current state
        function applyTransform(vidId) {
            const state = videoZoomStates.get(vidId);
            if (!state) return;

            // Apply transform to the video element itself
            videoElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX}px, ${state.offsetY}px)`;
            videoElement.style.transformOrigin = 'center center'; // Keep origin centered for simplicity

            if (state.isZoomed) {
                containerElement.classList.add('video-zoomed');
            } else {
                containerElement.classList.remove('video-zoomed');
                // Reset offset when unzoomed
                state.offsetX = 0;
                state.offsetY = 0;
                videoElement.style.transform = 'none'; // Ensure reset
            }
        }

        // --- Click/Tap to Toggle Zoom ---
        containerElement.addEventListener('click', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            if (!state.isZoomed) {
                // Zoom in
                state.currentScale = 2.0; // Initial zoom level
                state.isZoomed = true;
            } else {
                // Zoom out
                state.currentScale = 1.0;
                state.isZoomed = false;
            }
            applyTransform(videoElement.id);
        });

        // --- Optional: Panning when zoomed ---
        containerElement.addEventListener('mousedown', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (state && state.isZoomed && e.button === 0) { // Left mouse button
                isDragging = true;
                // Calculate start position relative to the video's current transformed position
                startX = e.clientX - state.offsetX * state.currentScale;
                startY = e.clientY - state.offsetY * state.currentScale;
                containerElement.style.cursor = 'grabbing'; // Indicate dragging
            }
        });

        containerElement.addEventListener('mousemove', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (isDragging && state && state.isZoomed) {
                e.preventDefault(); // Prevent text selection or other default behaviors
                let newOffsetX = (e.clientX - startX) / state.currentScale;
                let newOffsetY = (e.clientY - startY) / state.currentScale;

                // Basic bounds checking to prevent panning too far
                const maxPanX = (videoElement.offsetWidth * (state.currentScale - 1)) / (2 * state.currentScale);
                const maxPanY = (videoElement.offsetHeight * (state.currentScale - 1)) / (2 * state.currentScale);

                state.offsetX = Math.max(-maxPanX, Math.min(maxPanX, newOffsetX));
                state.offsetY = Math.max(-maxPanY, Math.min(maxPanY, newOffsetY));


                applyTransform(videoElement.id);
            }
        });

        containerElement.addEventListener('mouseup', () => {
            isDragging = false;
            containerElement.style.cursor = 'grab';
        });

        containerElement.addEventListener('mouseleave', () => {
            isDragging = false;
            containerElement.style.cursor = 'grab';
        });

        // --- Optional: Scroll to Zoom ---
        containerElement.addEventListener('wheel', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            e.preventDefault(); // Prevent page scrolling
            const oldScale = state.currentScale;
            if (e.deltaY < 0) { // Zoom in
                state.currentScale = Math.min(maxZoom, state.currentScale + zoomStep);
            } else { // Zoom out
                state.currentScale = Math.max(minZoom, state.currentScale - zoomStep);
            }

            if (state.currentScale === 1.0) {
                state.isZoomed = false; // Reset if fully zoomed out
            } else {
                state.isZoomed = true;
            }

            // Adjust offset to zoom towards the cursor (simple approach)
            const rect = containerElement.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate new offsetX/Y based on zoom
            // This is a simplified approach and might need refinement for perfect "zoom to cursor"
            state.offsetX -= (mouseX - videoElement.offsetWidth / 2 - state.offsetX) * (1 / oldScale - 1 / state.currentScale);
            state.offsetY -= (mouseY - videoElement.offsetHeight / 2 - state.offsetY) * (1 / oldScale - 1 / state.currentScale);


            applyTransform(videoElement.id);
        }, { passive: false }); // Use passive: false to allow preventDefault
    }


    // --- Whiteboard Functions ---

    /**
     * Initializes the whiteboard canvas context and event listeners.
     */
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
            console.error('Whiteboard canvas element not found.');
            return;
        }

        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeCanvas(); // Set initial canvas size
        // Fill canvas with black on initial load or reset
        whiteboardCtx.fillStyle = '#000000';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);


        // Re-apply current brush size and color
        currentColor = colorPicker ? colorPicker.value : '#FF0000';
        currentBrushSize = brushSizeSlider ? parseInt(brushSizeSlider.value) : 5;

        // Event Listeners for drawing
        whiteboardCanvas.addEventListener('mousedown', startDrawing);
        whiteboardCanvas.addEventListener('mousemove', draw);
        whiteboardCanvas.addEventListener('mouseup', stopDrawing);
        whiteboardCanvas.addEventListener('mouseout', stopDrawing); // Stop drawing if mouse leaves canvas

        // Touch events for mobile
        whiteboardCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        whiteboardCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            draw({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        whiteboardCanvas.addEventListener('touchend', stopDrawing);
        whiteboardCanvas.addEventListener('touchcancel', stopDrawing);

        // Tool selection
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;
                if (currentTool === 'eraser') {
                    // Eraser should be white, but its globalCompositeOperation will make it erase
                    whiteboardCtx.strokeStyle = '#FFFFFF';
                    whiteboardCtx.globalCompositeOperation = 'destination-out';
                } else {
                    whiteboardCtx.strokeStyle = currentColor;
                    whiteboardCtx.globalCompositeOperation = 'source-over';
                }
            });
        });

        // Color picker
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                currentColor = e.target.value;
                if (currentTool !== 'eraser') { // Don't change eraser "color"
                    whiteboardCtx.strokeStyle = currentColor;
                }
            });
        }

        // Brush size slider
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', (e) => {
                currentBrushSize = parseInt(e.target.value);
                whiteboardCtx.lineWidth = currentBrushSize;
            });
        }

        // Undo/Redo buttons
        if (undoButton) undoButton.addEventListener('click', undo);
        if (redoButton) redoButton.addEventListener('click', redo);
        updateUndoRedoButtons(); // Initial state

        // Clear button
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the entire whiteboard page?')) {
                    clearWhiteboard();
                    socket.emit('whiteboard_data', {
                        action: 'clear',
                        classroomId: currentClassroom.id,
                        pageIndex: currentPageIndex
                    });
                }
            });
        }

        // Save button (local save as image)
        if (saveButton) {
            saveButton.addEventListener('click', saveWhiteboardAsImage);
        }

        // Page navigation buttons
        if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', prevWhiteboardPage);
        if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', nextWhiteboardPage);
        updateWhiteboardPageDisplay();

        // Handle canvas resizing
        window.addEventListener('resize', () => {
            if (classroomSection.classList.contains('active') && whiteboardArea.classList.contains('active')) {
                resizeCanvasAndRedraw();
            }
        });
    }

    /**
     * Resizes the canvas to fill its parent and redraws the current content.
     */
    function resizeCanvasAndRedraw() {
        if (!whiteboardCanvas || !whiteboardCtx) return;

        const parent = whiteboardCanvas.parentElement;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Store current canvas content to a temporary canvas
        tempCanvas.width = whiteboardCanvas.width;
        tempCanvas.height = whiteboardCanvas.height;
        tempCtx.drawImage(whiteboardCanvas, 0, 0);

        // Resize the actual canvas
        whiteboardCanvas.width = parent.clientWidth;
        whiteboardCanvas.height = parent.clientHeight;

        // Restore the content to the resized canvas
        // This will scale the old content to the new size
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.drawImage(tempCanvas, 0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        // Re-render the current page to ensure correct scaling and quality
        renderCurrentWhiteboardPage();
    }


    /**
     * Sets the whiteboard canvas size dynamically.
     */
    function resizeCanvas() {
        if (whiteboardCanvas && whiteboardCanvas.parentElement) {
            whiteboardCanvas.width = whiteboardCanvas.parentElement.clientWidth;
            whiteboardCanvas.height = whiteboardCanvas.parentElement.clientHeight;
        }
    }

    /**
     * Starts a drawing stroke.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function startDrawing(e) {
        if (!whiteboardCtx || !currentUser || currentUser.role !== 'admin') return; // Only admin can draw

        isDrawing = true;
        redoStack.length = 0; // Clear redo stack on new drawing action
        updateUndoRedoButtons();

        const { x, y } = getCanvasCoordinates(e);
        startX = x;
        startY = y;
        lastX = x; // Initialize lastX, lastY for smoothing
        lastY = y;

        currentStrokePoints = [{ x, y }]; // Start new stroke
        whiteboardCtx.beginPath();
        whiteboardCtx.moveTo(x, y);

        // Take a snapshot before drawing for undo
        snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    }

    /**
     * Continues a drawing stroke.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function draw(e) {
        if (!isDrawing || !whiteboardCtx || !currentUser || currentUser.role !== 'admin') return;

        const { x: currentX, y: currentY } = getCanvasCoordinates(e);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            currentStrokePoints.push({ x: currentX, y: currentY });

            // Apply midpoint smoothing using quadraticCurveTo
            const midX = (lastX + currentX) / 2;
            const midY = (lastY + currentY) / 2;

            whiteboardCtx.lineCap = 'round';
            whiteboardCtx.lineJoin = 'round';
            whiteboardCtx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';

            whiteboardCtx.quadraticCurveTo(lastX, lastY, midX, midY);
            whiteboardCtx.stroke();

            lastX = currentX;
            lastY = currentY;

        } else if (currentTool === 'line') {
            // Restore snapshot to clear previous temporary line
            whiteboardCtx.putImageData(snapshot, 0, 0);
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(startX, startY);
            whiteboardCtx.lineTo(currentX, currentY);
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.globalCompositeOperation = 'source-over';
            whiteboardCtx.stroke();
        } else if (currentTool === 'rectangle') {
            whiteboardCtx.putImageData(snapshot, 0, 0);
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.globalCompositeOperation = 'source-over';
            whiteboardCtx.strokeRect(startX, startY, currentX - startX, currentY - startY);
        } else if (currentTool === 'circle') {
            whiteboardCtx.putImageData(snapshot, 0, 0);
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(startX, startY, radius, 0, Math.PI * 2);
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.globalCompositeOperation = 'source-over';
            whiteboardCtx.stroke();
        }
    }

    /**
     * Ends a drawing stroke.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;

        const { x: endX, y: endY } = getCanvasCoordinates(e);

        // For pen/eraser, ensure the last segment is drawn
        if ((currentTool === 'pen' || currentTool === 'eraser') && currentStrokePoints.length > 1) {
            whiteboardCtx.lineTo(endX, endY); // Connect to the final point
            whiteboardCtx.stroke();
        }
        whiteboardCtx.closePath();

        // Create a drawing item to send to the server and add to local history
        let drawingItem;
        if (currentTool === 'pen' || currentTool === 'eraser') {
            drawingItem = {
                tool: currentTool,
                color: currentTool === 'eraser' ? '#FFFFFF' : currentColor, // Store actual color for pen, white for eraser
                width: currentBrushSize,
                points: currentStrokePoints, // Store all points for stroke
                globalCompositeOperation: currentTool === 'eraser' ? 'destination-out' : 'source-over',
            };
        } else if (currentTool === 'line') {
            drawingItem = {
                tool: 'line',
                color: currentColor,
                width: currentBrushSize,
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY,
                globalCompositeOperation: 'source-over',
            };
        } else if (currentTool === 'rectangle') {
            drawingItem = {
                tool: 'rectangle',
                color: currentColor,
                width: currentBrushSize,
                startX: startX,
                startY: startY,
                width: endX - startX,
                height: endY - startY,
                globalCompositeOperation: 'source-over',
            };
        } else if (currentTool === 'circle') {
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            drawingItem = {
                tool: 'circle',
                color: currentColor,
                width: currentBrushSize,
                centerX: startX,
                centerY: startY,
                radius: radius,
                globalCompositeOperation: 'source-over',
            };
        }

        // Add to local history and emit to server
        if (drawingItem) {
            whiteboardPages[currentPageIndex].push(drawingItem);
            undoStack.push(drawingItem); // Add to undo stack
            updateUndoRedoButtons();
            socket.emit('whiteboard_data', {
                action: 'draw',
                data: drawingItem,
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex
            });
            saveWhiteboardToLocalStorage(); // Save after each drawing completion
        }
        currentStrokePoints = []; // Reset for next stroke
    }

    /**
     * Gets mouse/touch coordinates relative to the canvas.
     * @param {MouseEvent|TouchEvent} e - The event object.
     * @returns {{x: number, y: number}} - Coordinates.
     */
    function getCanvasCoordinates(e) {
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
     * Redraws all drawing items for the current page.
     * This is called when page changes or history is loaded.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx) {
            console.warn('whiteboardCtx is not initialized for rendering.');
            return;
        }

        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black before re-rendering
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const drawings = whiteboardPages[currentPageIndex] || [];
        drawings.forEach(item => {
            whiteboardCtx.save(); // Save context state before applying item properties
            whiteboardCtx.strokeStyle = item.color;
            whiteboardCtx.lineWidth = item.width;
            whiteboardCtx.fillStyle = item.color; // For filled shapes if they were added later
            whiteboardCtx.globalCompositeOperation = item.globalCompositeOperation;
            drawWhiteboardItem(item);
            whiteboardCtx.restore(); // Restore context state
        });
        updateUndoRedoButtons(); // Update button states after rendering a page
    }

    /**
     * Draws a single whiteboard item based on its type.
     * @param {object} item - The drawing item object.
     */
    function drawWhiteboardItem(item) {
        if (!whiteboardCtx) return;

        whiteboardCtx.beginPath();
        if (item.tool === 'pen' || item.tool === 'eraser') {
            if (item.points && item.points.length > 0) {
                whiteboardCtx.moveTo(item.points[0].x, item.points[0].y);
                for (let i = 1; i < item.points.length; i++) {
                    const p = item.points[i];
                    const lastP = item.points[i - 1];
                    const midX = (lastP.x + p.x) / 2;
                    const midY = (lastP.y + p.y) / 2;
                    whiteboardCtx.quadraticCurveTo(lastP.x, lastP.y, midX, midY);
                }
                whiteboardCtx.lineTo(item.points[item.points.length - 1].x, item.points[item.points.length - 1].y);
            }
        } else if (item.tool === 'line') {
            whiteboardCtx.moveTo(item.startX, item.startY);
            whiteboardCtx.lineTo(item.endX, item.endY);
        } else if (item.tool === 'rectangle') {
            whiteboardCtx.strokeRect(item.startX, item.startY, item.width, item.height);
        } else if (item.tool === 'circle') {
            whiteboardCtx.arc(item.centerX, item.centerY, item.radius, 0, Math.PI * 2);
        }
        whiteboardCtx.stroke();
    }

    /**
     * Fetches whiteboard history from the server.
     */
    function fetchWhiteboardHistory() {
        if (socket && currentClassroom) {
            console.log("Requesting whiteboard history for classroom:", currentClassroom.id, "page:", currentPageIndex);
            socket.emit('request_whiteboard_history', {
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex
            });
        }
    }

    /**
     * Clears the current whiteboard page locally.
     */
    function clearWhiteboard() {
        if (whiteboardCtx) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        whiteboardPages[currentPageIndex] = []; // Clear current page history
        undoStack.length = 0; // Clear undo/redo for this page
        redoStack.length = 0;
        updateUndoRedoButtons();
        saveWhiteboardToLocalStorage(); // Save the cleared state
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    function prevWhiteboardPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: currentPageIndex
            });
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            saveWhiteboardToLocalStorage(); // Save current state
        }
    }

    /**
     * Navigates to the next whiteboard page, creating a new one if necessary.
     */
    function nextWhiteboardPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else {
            // Create a new page if we are at the last one
            whiteboardPages.push([]);
            currentPageIndex++;
        }
        socket.emit('whiteboard_page_change', {
            classroomId: currentClassroom.id,
            newPageIndex: currentPageIndex
        });
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        saveWhiteboardToLocalStorage(); // Save current state
    }

    /**
     * Updates the whiteboard page display (e.g., "Page 1/3").
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1}/${whiteboardPages.length}`;
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
            nextWhiteboardPageBtn.disabled = false; // Always allow creating new pages
        }
    }

    /**
     * Performs an undo action on the whiteboard.
     */
    function undo() {
        if (undoStack.length > 0) {
            const lastAction = undoStack.pop();
            redoStack.push(lastAction); // Push to redo stack

            // Remove the last action from the current page's history
            const pageHistory = whiteboardPages[currentPageIndex];
            const indexToRemove = pageHistory.findIndex(item => item === lastAction); // Find the exact reference
            if (indexToRemove > -1) {
                pageHistory.splice(indexToRemove, 1);
            }

            renderCurrentWhiteboardPage(); // Re-render the canvas from updated history
            updateUndoRedoButtons();
            // Optionally, emit an 'undo' event to the server
            // socket.emit('whiteboard_undo', { classroomId: currentClassroom.id, pageIndex: currentPageIndex, action: lastAction });
            saveWhiteboardToLocalStorage();
        }
    }

    /**
     * Performs a redo action on the whiteboard.
     */
    function redo() {
        if (redoStack.length > 0) {
            const lastRedoAction = redoStack.pop();
            undoStack.push(lastRedoAction); // Push back to undo stack

            // Add the action back to the current page's history
            if (!whiteboardPages[currentPageIndex]) {
                whiteboardPages[currentPageIndex] = [];
            }
            whiteboardPages[currentPageIndex].push(lastRedoAction);

            renderCurrentWhiteboardPage(); // Re-render the canvas from updated history
            updateUndoRedoButtons();
            // Optionally, emit a 'redo' event to the server
            // socket.emit('whiteboard_redo', { classroomId: currentClassroom.id, pageIndex: currentPageIndex, action: lastRedoAction });
            saveWhiteboardToLocalStorage();
        }
    }

    /**
     * Updates the disabled state of undo/redo buttons.
     */
    function updateUndoRedoButtons() {
        if (undoButton) undoButton.disabled = undoStack.length === 0 || !currentUser || currentUser.role !== 'admin';
        if (redoButton) redoButton.disabled = redoStack.length === 0 || !currentUser || currentUser.role !== 'admin';
    }

    /**
     * Saves the whiteboard canvas as an image file.
     */
    function saveWhiteboardAsImage() {
        if (whiteboardCanvas) {
            const dataURL = whiteboardCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `whiteboard-page-${currentPageIndex + 1}-${currentClassroom ? currentClassroom.name : 'classroom'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showNotification('Whiteboard saved as image!');
        }
    }

    /**
     * Saves the current whiteboard page to localStorage as a Base64 image.
     */
    function saveWhiteboardToLocalStorage() {
        if (currentClassroom && whiteboardCanvas) {
            const dataURL = whiteboardCanvas.toDataURL('image/png');
            localStorage.setItem(`whiteboard-${currentClassroom.id}-${currentPageIndex}`, dataURL);
            // console.log(`[Whiteboard] Saved page ${currentPageIndex} to localStorage.`);
        }
    }

    /**
     * Loads the whiteboard page from localStorage.
     */
    function loadWhiteboardFromLocalStorage() {
        if (currentClassroom && whiteboardCanvas && whiteboardCtx) {
            const savedImage = localStorage.getItem(`whiteboard-${currentClassroom.id}-${currentPageIndex}`);
            if (savedImage) {
                const img = new Image();
                img.onload = () => {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000'; // Fill with black before drawing image
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.drawImage(img, 0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    console.log(`[Whiteboard] Loaded page ${currentPageIndex} from localStorage.`);
                };
                img.src = savedImage;
            } else {
                // If nothing in local storage for this page, ensure it's cleared
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.fillStyle = '#000000'; // Fill with black
                whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
        }
    }

    /**
     * Starts a periodic interval to save the whiteboard to the server (Bonus).
     */
    function startPeriodicWhiteboardSave() {
        // Clear any existing interval to prevent duplicates
        stopPeriodicWhiteboardSave();

        whiteboardSaveInterval = setInterval(() => {
            if (currentClassroom && whiteboardCanvas && socket) {
                const imageData = whiteboardCanvas.toDataURL('image/png');
                socket.emit('save_whiteboard_to_server', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex,
                    imageData: imageData
                });
                console.log(`[Whiteboard] Auto-saving page ${currentPageIndex} to server.`);
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Stops the periodic whiteboard saving interval.
     */
    function stopPeriodicWhiteboardSave() {
        if (whiteboardSaveInterval) {
            clearInterval(whiteboardSaveInterval);
            whiteboardSaveInterval = null;
            // console.log("[Whiteboard] Stopped periodic saving.");
        }
    }

    // --- Chat Functions ---

    /**
     * Sets up event listeners for chat functionality.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.removeEventListener('click', handleSendMessage); // Prevent duplicate listeners
            sendMessageBtn.addEventListener('click', handleSendMessage);
        }
        if (chatInput) {
            chatInput.removeEventListener('keypress', handleChatInputKeypress); // Prevent duplicate listeners
            chatInput.addEventListener('keypress', handleChatInputKeypress);
        }
    }

    /**
     * Handles sending a chat message.
     */
    function handleSendMessage() {
        if (!socket || !currentClassroom) {
            showNotification("Not connected to a classroom.", true);
            return;
        }
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('message', {
                classroomId: currentClassroom.id,
                message: message
            });
            chatInput.value = '';
        }
    }

    /**
     * Handles keypress events in the chat input (for sending on Enter).
     * @param {KeyboardEvent} e - The keyboard event object.
     */
    function handleChatInputKeypress(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    }

    // --- Library Functions ---

    /**
     * Loads and displays files in the library. Filters based on search input.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !libraryFilesList) return;

        try {
            const response = await fetch(`/api/library/${currentClassroom.id}`);
            let files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            if (searchTerm) {
                files = files.filter(file =>
                    file.fileName.toLowerCase().includes(searchTerm) ||
                    file.uploader.toLowerCase().includes(searchTerm)
                );
            }

            libraryFilesList.innerHTML = ''; // Clear existing list

            if (files.length === 0) {
                libraryFilesList.innerHTML = '<li>No files uploaded to this classroom yet.</li>';
                return;
            }

            files.forEach(file => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${file.fileName} (Uploaded by: ${file.uploader})</span>
                    <a href="${file.url}" target="_blank" class="download-file-btn">Download</a>
                    ${currentUser && currentUser.role === 'admin' ?
                        `<button class="delete-file-btn" data-file-id="${file.id}">Delete</button>` : ''}
                `;
                libraryFilesList.appendChild(li);
            });

            document.querySelectorAll('.delete-file-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const fileId = e.target.dataset.fileId;
                    if (confirm('Are you sure you want to delete this file?')) {
                        try {
                            const response = await fetch(`/api/library/${currentClassroom.id}/${fileId}`, {
                                method: 'DELETE'
                            });
                            const result = await response.json();
                            if (response.ok) {
                                showNotification(result.message);
                                loadLibraryFiles(); // Refresh the list
                                socket.emit('admin_action_update', {
                                    classroomId: currentClassroom.id,
                                    message: `Admin ${currentUser.username} deleted a library file.`
                                });
                            } else {
                                showNotification(result.error, true);
                            }
                        } catch (error) {
                            console.error('Error deleting file:', error);
                            showNotification('An error occurred during file deletion.', true);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error loading library files:', error);
            libraryFilesList.innerHTML = '<li>Failed to load library files.</li>';
        }
    }

    // --- Assessment Functions ---

    /**
     * Loads and displays available assessments. Filters based on search input.
     */
    async function loadAssessments() {
        if (!currentClassroom || !assessmentListDiv) return;

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            let assessments = await response.json();

            const searchTerm = assessmentSearchInput.value.toLowerCase();
            if (searchTerm) {
                assessments = assessments.filter(assessment =>
                    assessment.title.toLowerCase().includes(searchTerm) ||
                    assessment.description.toLowerCase().includes(searchTerm)
                );
            }

            assessmentListDiv.innerHTML = ''; // Clear existing list

            if (assessments.length === 0) {
                assessmentListDiv.innerHTML = '<li>No assessments created for this classroom yet.</li>';
                return;
            }

            assessments.forEach(assessment => {
                const li = document.createElement('li');
                const isCreator = currentUser && assessment.creator_id === currentUser.id;
                const isAdmin = currentUser && currentUser.role === 'admin';
                const scheduledTime = assessment.scheduled_at ? new Date(assessment.scheduled_at).toLocaleString() : 'Not scheduled';
                const duration = assessment.duration_minutes ? `${assessment.duration_minutes} minutes` : 'Not set';

                li.innerHTML = `
                    <h3>${assessment.title}</h3>
                    <p>${assessment.description}</p>
                    <p><strong>Scheduled:</strong> ${scheduledTime}</p>
                    <p><strong>Duration:</strong> ${duration}</p>
                    ${!isAdmin ? // Regular user view
                        `<button class="take-assessment-btn" data-assessment-id="${assessment.id}">Take Assessment</button>
                        <button class="view-my-submission-btn" data-assessment-id="${assessment.id}">View My Submission</button>` : ''
                    }
                    ${isAdmin ? // Admin view
                        `<button class="start-assessment-btn" data-assessment-id="${assessment.id}">Start Assessment</button>
                        <button class="view-submissions-btn" data-assessment-id="${assessment.id}">View Submissions</button>
                        <button class="edit-assessment-btn" data-assessment-id="${assessment.id}">Edit</button>
                        <button class="delete-assessment-btn" data-assessment-id="${assessment.id}">Delete</button>` : ''
                    }
                `;
                assessmentListDiv.appendChild(li);
            });

            // Attach event listeners for buttons
            document.querySelectorAll('.take-assessment-btn').forEach(button => {
                button.addEventListener('click', (e) => showTakeAssessment(e.target.dataset.assessmentId));
            });
            document.querySelectorAll('.view-my-submission-btn').forEach(button => {
                button.addEventListener('click', (e) => viewMySubmission(e.target.dataset.assessmentId));
            });
            document.querySelectorAll('.start-assessment-btn').forEach(button => {
                button.addEventListener('click', (e) => startAssessment(e.target.dataset.assessmentId));
            });
            document.querySelectorAll('.view-submissions-btn').forEach(button => {
                button.addEventListener('click', (e) => viewSubmissions(e.target.dataset.assessmentId));
            });
            document.querySelectorAll('.edit-assessment-btn').forEach(button => {
                button.addEventListener('click', (e) => editAssessment(e.target.dataset.assessmentId));
            });
            document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteAssessment(e.target.dataset.assessmentId));
            });

        } catch (error) {
            console.error('Error loading assessments:', error);
            assessmentListDiv.innerHTML = '<li>Failed to load assessments.</li>';
        }
    }


    // --- Event Listeners and Initial Calls ---

    // Auth forms
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const password = e.target.password.value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();
                if (response.ok) {
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    sessionStorage.setItem('user_id', currentUser.id); // Store for WebRTC/chat sender ID
                    showNotification('Login successful!');
                    checkLoginStatus(); // Update UI
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during login:', error);
                displayMessage(authMessage, 'An error occurred during login.', true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.username.value;
            const email = e.target.email.value;
            const password = e.target.password.value;
            const role = e.target.role ? e.target.role.value : 'user'; // Default to 'user'

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(authMessage, result.message, false);
                    showRegisterLink.click(); // Switch back to login
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                displayMessage(authMessage, 'An error occurred during registration.', true);
            }
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear message
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear message
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
                currentUser = null;
                localStorage.removeItem('currentUser');
                sessionStorage.removeItem('user_id'); // Clear session storage as well
                cleanupClassroomResources(); // Clean up classroom-related stuff on logout
                showNotification('Logged out successfully.');
                checkLoginStatus(); // Show login screen
            } catch (error) {
                console.error('Error during logout:', error);
                showNotification('An error occurred during logout.', true);
            }
        });
    }

    // Classroom creation
    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            const classroomName = newClassroomNameInput.value.trim();
            if (!classroomName) {
                displayMessage(classroomMessage, 'Classroom name cannot be empty.', true);
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
                    displayMessage(classroomMessage, `Classroom "${result.name}" created with ID: ${result.id}`, false);
                    newClassroomNameInput.value = '';
                    loadAvailableClassrooms(); // Refresh list
                    showNotification(`Classroom "${result.name}" created!`);
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred while creating classroom.', true);
            }
        });
    }

    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadAvailableClassrooms);
    }


    // Navigation
    if (navDashboard) navDashboard.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        cleanupClassroomResources(); // Ensure resources are cleaned if coming from a classroom
        loadAvailableClassrooms(); // Reload classrooms on dashboard
    });

    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        cleanupClassroomResources(); // Clean up classroom-specific resources
        loadAvailableClassrooms();
    });

    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadAvailableClassrooms();
    });

    if (navClassroom) navClassroom.addEventListener('click', () => {
        if (currentClassroom) {
            showSection(classroomSection);
            updateNavActiveState(navClassroom);
            // Re-select the last active classroom sub-section
            if (whiteboardArea && !whiteboardArea.classList.contains('hidden')) {
                updateNavActiveState(navWhiteboard);
            } else if (chatSection && !chatSection.classList.contains('hidden')) {
                updateNavActiveState(navChat);
            } else if (librarySection && !librarySection.classList.contains('hidden')) {
                updateNavActiveState(navLibrary);
            } else if (assessmentsSection && !assessmentsSection.classList.contains('hidden')) {
                updateNavActiveState(navAssessments);
            }
        } else {
            showNotification('Please enter or create a classroom first.', true);
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
        }
    });

    if (navSettings) navSettings.addEventListener('click', () => {
        showSection(settingsSection);
        updateNavActiveState(navSettings);
        if (currentUser) {
            if (settingsUsernameInput) settingsUsernameInput.value = currentUser.username;
            if (settingsEmailInput) settingsEmailInput.value = currentUser.email;
        }
    });

    if (navChat) navChat.addEventListener('click', () => {
        if (currentClassroom) {
            showClassroomSubSection(chatSection);
            updateNavActiveState(navChat);
            if (socket) {
                socket.emit('request_chat_history', { classroomId: currentClassroom.id });
            }
        } else {
            showNotification('Please enter a classroom to access chat.', true);
            updateNavActiveState(navDashboard); // Go back to dashboard if no classroom
        }
    });

    if (navWhiteboard) navWhiteboard.addEventListener('click', () => {
        if (currentClassroom) {
            showClassroomSubSection(whiteboardArea);
            updateNavActiveState(navWhiteboard);
            renderCurrentWhiteboardPage(); // Ensure whiteboard is rendered on tab switch
        } else {
            showNotification('Please enter a classroom to access the whiteboard.', true);
            updateNavActiveState(navDashboard);
        }
    });

    if (navLibrary) navLibrary.addEventListener('click', () => {
        if (currentClassroom) {
            showClassroomSubSection(librarySection);
            updateNavActiveState(navLibrary);
            loadLibraryFiles();
        } else {
            showNotification('Please enter a classroom to access the library.', true);
            updateNavActiveState(navDashboard);
        }
    });

    if (navAssessments) navAssessments.addEventListener('click', () => {
        if (currentClassroom) {
            showClassroomSubSection(assessmentsSection);
            updateNavActiveState(navAssessments);
            loadAssessments();
        } else {
            showNotification('Please enter a classroom to access assessments.', true);
            updateNavActiveState(navDashboard);
        }
    });


    // Update Profile
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = settingsUsernameInput.value.trim();
            const newEmail = settingsEmailInput.value.trim();

            if (!newUsername || !newEmail) {
                displayMessage(e.target.querySelector('.form-message'), 'Username and email cannot be empty.', true);
                return;
            }

            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newUsername, email: newEmail })
                });
                const result = await response.json();
                if (response.ok) {
                    currentUser.username = newUsername;
                    currentUser.email = newEmail;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                    displayMessage(e.target.querySelector('.form-message'), 'Profile updated successfully!', false);
                    showNotification('Profile updated!');
                } else {
                    displayMessage(e.target.querySelector('.form-message'), result.error, true);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                displayMessage(e.target.querySelector('.form-message'), 'An error occurred while updating profile.', true);
            }
        });
    }

    // Share Link
    if (shareLinkDisplay && copyShareLinkBtn) {
        shareLinkDisplay.addEventListener('click', () => {
            if (currentClassroom && currentClassroom.id) {
                const link = `${window.location.origin}/classroom/${currentClassroom.id}`;
                shareLinkInput.value = link;
                shareLinkDisplay.classList.remove('hidden');
                shareLinkInput.select();
                document.execCommand('copy');
                showNotification('Classroom link copied to clipboard!');
            }
        });
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            showNotification('Classroom link copied to clipboard!');
        });
    }

    // Broadcast Controls
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }
    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }


    // Library file upload
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (!currentClassroom || !currentClassroom.id) {
                showNotification('Please enter a classroom to upload files.', true);
                return;
            }
            if (!libraryFileInput || libraryFileInput.files.length === 0) {
                showNotification('Please select files to upload.', true);
                return;
            }

            const formData = new FormData();
            formData.append('classroomId', currentClassroom.id);
            for (const file of libraryFileInput.files) {
                formData.append('files', file);
            }

            try {
                const response = await fetch('/api/upload-library-files', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    libraryFileInput.value = ''; // Clear file input
                    loadLibraryFiles(); // Refresh list
                    socket.emit('admin_action_update', {
                        classroomId: currentClassroom.id,
                        message: `Admin ${currentUser.username} uploaded new library files.`
                    });
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Error uploading files:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }

    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }

    // Assessment creation
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const questionIndex = questionsContainer.children.length;
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question-item');
            questionDiv.innerHTML = `
                <h4>Question ${questionIndex + 1}</h4>
                <input type="text" placeholder="Question Text" class="question-text" required>
                <input type="text" placeholder="Correct Answer" class="question-answer" required>
                <button type="button" class="remove-question-btn">Remove</button>
            `;
            questionsContainer.appendChild(questionDiv);

            questionDiv.querySelector('.remove-question-btn').addEventListener('click', (e) => {
                e.target.parentElement.remove();
                // Re-index questions after removal (optional, but good for display)
                questionsContainer.querySelectorAll('.question-item h4').forEach((h4, i) => {
                    h4.textContent = `Question ${i + 1}`;
                });
            });
        });
    }

    if (assessmentCreationForm) {
        assessmentCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentClassroom || !currentClassroom.id) {
                showNotification('Please enter a classroom to create an assessment.', true);
                return;
            }

            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionTextarea.value.trim();
            const scheduledAt = assessmentScheduledAtInput.value;
            const durationMinutes = parseInt(assessmentDurationMinutesInput.value, 10);

            if (!title || !description) {
                displayMessage(assessmentCreationMessage, 'Title and Description are required.', true);
                return;
            }
            if (isNaN(durationMinutes) || durationMinutes <= 0) {
                displayMessage(assessmentCreationMessage, 'Duration must be a positive number.', true);
                return;
            }

            const questions = [];
            questionsContainer.querySelectorAll('.question-item').forEach(qDiv => {
                const text = qDiv.querySelector('.question-text').value.trim();
                const answer = qDiv.querySelector('.question-answer').value.trim();
                if (text && answer) {
                    questions.push({ text, answer });
                }
            });

            if (questions.length === 0) {
                displayMessage(assessmentCreationMessage, 'At least one question is required.', true);
                return;
            }

            try {
                const assessmentData = {
                    classroomId: currentClassroom.id,
                    title,
                    description,
                    questions,
                    scheduled_at: scheduledAt,
                    duration_minutes: durationMinutes
                };

                const response = await fetch('/api/create-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(assessmentData)
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(assessmentCreationMessage, result.message, false);
                    assessmentCreationForm.reset();
                    questionsContainer.innerHTML = ''; // Clear questions
                    loadAssessments(); // Refresh the list
                    showClassroomSubSection(assessmentsSection); // Go back to assessment list view
                    socket.emit('admin_action_update', {
                        classroomId: currentClassroom.id,
                        message: `Admin ${currentUser.username} created a new assessment.`
                    });
                } else {
                    displayMessage(assessmentCreationMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating assessment:', error);
                displayMessage(assessmentCreationMessage, 'An error occurred during assessment creation.', true);
            }
        });
    }

    if (assessmentSearchInput) {
        assessmentSearchInput.addEventListener('input', loadAssessments);
    }

    // Function to display the "Take Assessment" form
    async function showTakeAssessment(assessmentId) {
        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}/${assessmentId}`);
            if (!response.ok) throw new Error('Assessment not found');
            const assessment = await response.json();

            currentAssessmentToTake = assessment; // Store globally for timer and submission

            showClassroomSubSection(takeAssessmentContainer);
            takeAssessmentTitle.textContent = assessment.title;
            takeAssessmentDescription.textContent = assessment.description;
            takeAssessmentForm.innerHTML = ''; // Clear previous questions

            assessment.questions.forEach((q, index) => {
                const qDiv = document.createElement('div');
                qDiv.classList.add('take-assessment-question-item');
                qDiv.innerHTML = `
                    <p><strong>Question ${index + 1}:</strong> ${q.text}</p>
                    <input type="text" name="answer-${index}" placeholder="Your Answer" required>
                `;
                takeAssessmentForm.appendChild(qDiv);
            });

            // If assessment has a scheduled time and duration, set up the timer
            if (assessment.scheduled_at && assessment.duration_minutes) {
                const startTime = new Date(assessment.scheduled_at);
                assessmentEndTime = new Date(startTime.getTime() + assessment.duration_minutes * 60 * 1000);
                startAssessmentTimer(assessmentEndTime);
            } else {
                if (assessmentTimerDisplay) {
                    assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
                    assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
                }
            }

            assessmentSubmissionMessage.textContent = ''; // Clear any previous submission messages
        } catch (error) {
            console.error('Error loading assessment for taking:', error);
            showNotification('Could not load assessment to take.', true);
            showClassroomSubSection(assessmentsSection); // Go back to list
        }
    }

    // Function to start the assessment timer
    function startAssessmentTimer(endTime) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }

        function updateTimer() {
            const now = new Date().getTime();
            const distance = endTime.getTime() - now;

            if (distance < 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = 'TIME OVER!';
                assessmentTimerDisplay.classList.add('critical');
                showNotification('Assessment time is over! Your answers have been automatically submitted if unsaved.', true);
                // Optionally auto-submit if not already submitted
                if (takeAssessmentForm && !takeAssessmentForm.dataset.submitted) {
                    submitAnswers(true); // Auto-submit
                }
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            assessmentTimerDisplay.textContent = `Time Left: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            assessmentTimerDisplay.classList.add('active');

            if (distance < 5 * 60 * 1000) { // Less than 5 minutes
                assessmentTimerDisplay.classList.add('warning');
            }
            if (distance < 1 * 60 * 1000) { // Less than 1 minute
                assessmentTimerDisplay.classList.add('critical');
            }
        }

        assessmentTimerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call to display immediately
    }

    // Submit answers
    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', async () => {
            await submitAnswers(false); // Manual submit
        });
    }

    async function submitAnswers(isAutoSubmit = false) {
        if (!currentAssessmentToTake || !currentUser || takeAssessmentForm.dataset.submitted) {
            if (isAutoSubmit) {
                console.log("Auto-submit attempted but already submitted or no assessment active.");
                return;
            }
            showNotification('No active assessment to submit or already submitted.', true);
            return;
        }

        const answers = [];
        currentAssessmentToTake.questions.forEach((q, index) => {
            const input = takeAssessmentForm.querySelector(`[name="answer-${index}"]`);
            if (input) {
                answers.push({
                    question_text: q.text,
                    submitted_answer: input.value.trim(),
                    correct_answer: q.answer // Include correct answer for server-side scoring
                });
            }
        });

        try {
            const response = await fetch('/api/submit-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: currentAssessmentToTake.id,
                    classroomId: currentClassroom.id,
                    studentId: currentUser.id,
                    answers: answers
                })
            });
            const result = await response.json();
            if (response.ok) {
                assessmentSubmissionMessage.textContent = result.message;
                assessmentSubmissionMessage.className = 'success';
                takeAssessmentForm.dataset.submitted = 'true'; // Mark as submitted
                clearInterval(assessmentTimerInterval); // Stop timer
                assessmentTimerDisplay.textContent = 'Submitted!';
                assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
                showNotification(isAutoSubmit ? 'Assessment auto-submitted successfully!' : 'Assessment submitted successfully!');
                // Optionally, clear form or disable inputs
                Array.from(takeAssessmentForm.elements).forEach(el => el.disabled = true);
            } else {
                assessmentSubmissionMessage.textContent = result.error;
                assessmentSubmissionMessage.className = 'error';
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            assessmentSubmissionMessage.textContent = 'An error occurred during submission.';
            assessmentSubmissionMessage.className = 'error';
            showNotification('An error occurred during submission.', true);
        }
    }

    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            currentAssessmentToTake = null; // Clear active assessment
            clearInterval(assessmentTimerInterval); // Stop any running timer
            if (assessmentTimerDisplay) {
                assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
                assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
            }
            delete takeAssessmentForm.dataset.submitted; // Reset submission status
            showClassroomSubSection(assessmentsSection);
            loadAssessments(); // Reload the list
        });
    }

    // Admin functions for assessments
    async function startAssessment(assessmentId) {
        if (!confirm('Are you sure you want to START this assessment for all participants? This will start the timer for everyone.')) {
            return;
        }
        try {
            const response = await fetch('/api/start-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assessmentId: assessmentId, classroomId: currentClassroom.id })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                socket.emit('assessment_started_signal', {
                    classroomId: currentClassroom.id,
                    assessmentId: assessmentId,
                    title: result.title,
                    endTime: result.endTime // Server sends the calculated end time
                });
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error starting assessment:', error);
            showNotification('An error occurred while starting the assessment.', true);
        }
    }

    async function viewSubmissions(assessmentId) {
        try {
            const response = await fetch(`/api/submissions/${currentClassroom.id}/${assessmentId}`);
            if (!response.ok) throw new Error('Could not fetch submissions.');
            const submissions = await response.json();

            showClassroomSubSection(viewSubmissionsContainer);
            submissionsAssessmentTitle.textContent = submissions.assessmentTitle;
            submissionsList.innerHTML = '';

            if (submissions.submissions.length === 0) {
                submissionsList.innerHTML = '<li>No submissions yet for this assessment.</li>';
                return;
            }

            submissions.submissions.forEach(sub => {
                const li = document.createElement('li');
                let answersHtml = sub.answers.map(ans => `
                    <p><strong>Q:</strong> ${ans.question_text}</p>
                    <p><strong>Your Answer:</strong> ${ans.submitted_answer}</p>
                    <p class="correct-answer"><strong>Correct Answer:</strong> ${ans.correct_answer}</p>
                `).join('');

                li.innerHTML = `
                    <h4>Submission by: ${sub.studentUsername} (Score: ${sub.score !== undefined ? sub.score : 'N/A'} / ${sub.totalQuestions})</h4>
                    <div>${answersHtml}</div>
                    <button class="mark-submission-btn" data-submission-id="${sub.id}" data-assessment-id="${assessmentId}">Mark Manually</button>
                    <hr>
                `;
                submissionsList.appendChild(li);
            });

            document.querySelectorAll('.mark-submission-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const submissionId = e.target.dataset.submissionId;
                    const assessId = e.target.dataset.assessmentId;
                    try {
                        // This would trigger server-side re-marking and update
                        const markResponse = await fetch('/api/mark-submission', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ submissionId: submissionId, assessmentId: assessId })
                        });
                        const markResult = await markResponse.json();
                        if (markResponse.ok) {
                            showNotification(markResult.message);
                            viewSubmissions(assessId); // Reload submissions to show updated score
                            socket.emit('submission_marked_signal', {
                                classroomId: currentClassroom.id,
                                studentId: markResult.studentId, // ID of student whose submission was marked
                                assessmentTitle: submissions.assessmentTitle
                            });
                        } else {
                            showNotification(markResult.error, true);
                        }
                    } catch (error) {
                        console.error('Error marking submission:', error);
                        showNotification('An error occurred while marking submission.', true);
                    }
                });
            });

        } catch (error) {
            console.error('Error viewing submissions:', error);
            showNotification('Could not view submissions.', true);
            showClassroomSubSection(assessmentsSection);
        }
    }

    async function viewMySubmission(assessmentId) {
        if (!currentUser) {
            showNotification("Please log in to view your submissions.", true);
            return;
        }
        try {
            const response = await fetch(`/api/my-submission/${currentClassroom.id}/${assessmentId}/${currentUser.id}`);
            if (!response.ok) throw new Error('Could not fetch your submission. You might not have submitted yet.');
            const submission = await response.json();

            showClassroomSubSection(viewSubmissionsContainer); // Re-use the submissions view
            submissionsAssessmentTitle.textContent = `My Submission for: ${submission.assessmentTitle}`;
            submissionsList.innerHTML = '';

            const li = document.createElement('li');
            let answersHtml = submission.answers.map(ans => `
                <p><strong>Q:</strong> ${ans.question_text}</p>
                <p><strong>Your Answer:</strong> ${ans.submitted_answer}</p>
                <p class="correct-answer"><strong>Correct Answer:</strong> ${ans.correct_answer}</p>
            `).join('');

            li.innerHTML = `
                <h4>Your Score: ${submission.score !== undefined ? submission.score : 'N/A'} / ${submission.totalQuestions}</h4>
                <div>${answersHtml}</div>
                <hr>
            `;
            submissionsList.appendChild(li);

        } catch (error) {
            console.error('Error viewing my submission:', error);
            showNotification(error.message, true);
            showClassroomSubSection(assessmentsSection);
        }
    }


    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            loadAssessments();
        });
    }

    async function editAssessment(assessmentId) {
        showNotification('Edit functionality not yet implemented.', true);
        // You would fetch assessment details, populate the creation form,
        // and then update it via a PUT/PATCH request to /api/assessments/{id}
    }

    async function deleteAssessment(assessmentId) {
        if (!confirm('Are you sure you want to delete this assessment? This cannot be undone.')) {
            return;
        }
        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}/${assessmentId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                loadAssessments(); // Refresh list
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `Admin ${currentUser.username} deleted an assessment.`
                });
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error deleting assessment:', error);
            showNotification('An error occurred during assessment deletion.', true);
        }
    }


    checkLoginStatus();

    // ✅ Sidebar toggle logic — moved here from bottom
    const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
    const sidebar = document.getElementById('classroom-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    if (hamburgerMenuBtn && sidebar && closeSidebarBtn) {
        hamburgerMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebar.classList.remove('hidden');
            document.body.classList.add('sidebar-open');
        });

        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebar.classList.add('hidden');
            document.body.classList.remove('sidebar-open');
        });

        document.addEventListener('click', (e) => {
            if (
                sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !hamburgerMenuBtn.contains(e.target)
            ) {
                sidebar.classList.remove('active');
                sidebar.classList.add('hidden');
                document.body.classList.remove('sidebar-open');
            }
        });
    }

    // Initialize zoom for local video once DOM is ready
    if (localVideo && localVideoContainer) {
        initializeZoomableVideo(localVideo, localVideoContainer);
    }
});
