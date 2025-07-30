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
    const classroomIdDisplay = document.getElementById('classroom-id-display');
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
    let autoSaveInterval; // Variable to hold the interval ID for auto-saving to server
    let lastAutoSaveDataURL = null; // To check if content changed before saving to server

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
            } else {
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
            }
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
        // Load whiteboard state from localStorage first, then request server history
        loadWhiteboardFromLocalStorage(); //
        fetchWhiteboardHistory(); // Load whiteboard history for the current page

        // Start periodic auto-save to server (Bonus)
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
        }
        autoSaveInterval = setInterval(autoSaveWhiteboardToServer, 30000); // Save every 30 seconds
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

        // Clear chat messages and remote videos
        if (chatMessages) chatMessages.innerHTML = '';
        if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        
        currentClassroom = null;
        localStorage.removeItem('currentClassroom');
        // Clear whiteboard from localStorage when leaving a classroom
        if (classroomIdDisplay && classroomIdDisplay.textContent && classroomIdDisplay.textContent !== 'N/A') {
            localStorage.removeItem(`whiteboard-${classroomIdDisplay.textContent}`);
        }


        // Clear any active assessment timer
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
        }
        if (assessmentTimerDisplay) {
            assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        }

        // Clear auto-save interval (Bonus)
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
        lastAutoSaveDataURL = null;
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
                // Request whiteboard history immediately after connecting
                socket.emit('request_whiteboard_history', { classroomId: currentClassroom.id }); //
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
            // Save whiteboard to local storage on disconnect
            saveWhiteboardToLocalStorage();
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
                }
            } else if (data.action === 'history' && data.history) {
                whiteboardPages = data.history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [[]]; // Ensure at least one page
                }
                currentPageIndex = 0; // Reset to first page
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                // After loading history, if admin, save current state to local storage
                if (currentUser && currentUser.role === 'admin') {
                    saveWhiteboardToLocalStorage(); //
                }
            } else if (data.action === 'snapshot_load' && data.snapshotDataURL) { // Handle loading a full canvas snapshot from server (Bonus)
                console.log("Received whiteboard snapshot from server. Loading...");
                const img = new Image();
                img.onload = () => {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000'; // Fill with black before drawing image
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.drawImage(img, 0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    showNotification("Whiteboard loaded from server snapshot.");
                };
                img.onerror = () => {
                    console.error("Error loading whiteboard snapshot image from server.");
                    showNotification("Failed to load whiteboard snapshot from server.", true);
                };
                img.src = data.snapshotDataURL;
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
        socket.emit('admin_action_update', { classroomId: currentClassroom.id, message: `Admin ${currentUser.username} ended the broadcast.` });
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

            if (e.target.classList.contains('video-overlay')) { // Only toggle zoom when clicking the overlay
                state.isZoomed = !state.isZoomed;
                state.currentScale = state.isZoomed ? 2.0 : 1.0; // Zoom to 2x or reset to 1x
                applyTransform(videoElement.id);
            }
        });

        // --- Panning (Dragging) after Zoom ---
        containerElement.addEventListener('mousedown', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (state && state.isZoomed && e.button === 0) { // Only allow drag if zoomed and left-click
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                containerElement.style.cursor = 'grabbing';
            }
        });

        containerElement.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const state = videoZoomStates.get(videoElement.id);
                if (!state) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                state.offsetX += dx / state.currentScale; // Adjust movement based on zoom level
                state.offsetY += dy / state.currentScale;

                startX = e.clientX;
                startY = e.clientY;
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

        // --- Scroll to Zoom In/Out ---
        containerElement.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevent page scrolling
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            const oldScale = state.currentScale;
            if (e.deltaY < 0) { // Scroll up = zoom in
                state.currentScale = Math.min(maxZoom, state.currentScale + zoomStep);
            } else { // Scroll down = zoom out
                state.currentScale = Math.max(minZoom, state.currentScale - zoomStep);
            }

            // Adjust offsets to zoom towards the mouse cursor
            if (state.currentScale !== oldScale) {
                const rect = videoElement.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                state.offsetX += (mouseX / oldScale - mouseX / state.currentScale);
                state.offsetY += (mouseY / oldScale - mouseY / state.currentScale);

                state.isZoomed = state.currentScale > minZoom;
                applyTransform(videoElement.id);
            }
        });

        // Initial application of transform
        applyTransform(videoElement.id);
    }


    // --- Whiteboard Functions ---

    /**
     * Initializes the whiteboard canvas context and event listeners.
     */
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
            console.error("Whiteboard canvas not found.");
            return;
        }
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeCanvas(); // Set initial canvas size
        window.addEventListener('resize', resizeCanvas);

        // Fill canvas with black initially
        whiteboardCtx.fillStyle = '#000000';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        // Attach event listeners for drawing
        if (currentUser && currentUser.role === 'admin') {
            whiteboardCanvas.addEventListener('mousedown', startDrawing);
            whiteboardCanvas.addEventListener('mousemove', draw);
            whiteboardCanvas.addEventListener('mouseup', stopDrawing);
            whiteboardCanvas.addEventListener('mouseleave', stopDrawing);

            toolButtons.forEach(button => {
                button.addEventListener('click', () => {
                    toolButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    currentTool = button.dataset.tool;
                    showNotification(`Tool changed to: ${currentTool}`);
                });
            });

            colorPicker.addEventListener('input', (e) => {
                currentColor = e.target.value;
            });

            brushSizeSlider.addEventListener('input', (e) => {
                currentBrushSize = parseInt(e.target.value);
            });

            undoButton.addEventListener('click', undoLastAction);
            redoButton.addEventListener('click', redoLastAction);
            clearButton.addEventListener('click', clearWhiteboard);
            saveButton.addEventListener('click', () => saveWhiteboardToLocalStorage(true)); // Pass true to force notification

            prevWhiteboardPageBtn.addEventListener('click', () => changeWhiteboardPage(-1));
            nextWhiteboardPageBtn.addEventListener('click', () => changeWhiteboardPage(1));
        }

        updateUndoRedoButtons();
        updateWhiteboardPageDisplay();
    }

    /**
     * Resizes the canvas to fill its parent container while maintaining aspect ratio or specific dimensions.
     * Fills with black to ensure no transparent areas.
     */
    function resizeCanvas() {
        const parent = whiteboardCanvas.parentElement;
        whiteboardCanvas.width = parent.clientWidth;
        whiteboardCanvas.height = parent.clientHeight;
        // Re-render current page after resize to persist content
        renderCurrentWhiteboardPage();
    }

    /**
     * Converts mouse coordinates to canvas coordinates.
     * @param {MouseEvent} event - The mouse event.
     * @returns {object} An object with x and y coordinates.
     */
    function getMousePos(event) {
        const rect = whiteboardCanvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    /**
     * Starts a drawing stroke.
     * @param {MouseEvent} e - The mouse event.
     */
    function startDrawing(e) {
        if (currentUser && currentUser.role !== 'admin') return;
        isDrawing = true;
        const pos = getMousePos(e);
        startX = pos.x;
        startY = pos.y;
        lastX = pos.x; // Initialize lastX, lastY
        lastY = pos.y; //
        currentStrokePoints = [{ x: startX, y: startY }]; // Start collecting points for the stroke

        whiteboardCtx.beginPath();
        whiteboardCtx.moveTo(startX, startY);

        // Take a snapshot of the canvas state before drawing
        snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    }

    /**
     * Draws on the canvas.
     * @param {MouseEvent} e - The mouse event.
     */
    function draw(e) {
        if (!isDrawing || (currentUser && currentUser.role !== 'admin')) return;

        const currentPos = getMousePos(e);
        const currentX = currentPos.x;
        const currentY = currentPos.y;

        // Restore snapshot to clear temporary drawing (for shapes, if implemented)
        // If snapshot logic is mainly for shapes, for pen/eraser, we just draw continuously
        // For line smoothing, we don't restore snapshot, we just draw segments
        if (snapshot) {
            whiteboardCtx.putImageData(snapshot, 0, 0);
        }

        // Apply properties
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';

        if (currentTool === 'eraser') {
            whiteboardCtx.globalCompositeOperation = 'destination-out';
            whiteboardCtx.strokeStyle = '#000000'; // Eraser "color" doesn't matter, it's transparent
        } else {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }

        // Apply smoothing for 'pen' and 'eraser' tools
        if (currentTool === 'pen' || currentTool === 'eraser') {
            const midX = (lastX + currentX) / 2; //
            const midY = (lastY + currentY) / 2; //

            // Draw a quadratic curve to the midpoint
            whiteboardCtx.quadraticCurveTo(lastX, lastY, midX, midY); //
            whiteboardCtx.stroke();
            whiteboardCtx.beginPath(); // Start new path from the midpoint
            whiteboardCtx.moveTo(midX, midY);

            // Update lastX, lastY for the next segment
            lastX = currentX;
            lastY = currentY;

            // Store points for undo/redo and syncing
            currentStrokePoints.push({ x: currentX, y: currentY }); //

        } else if (currentTool === 'rectangle') {
            // Drawing logic for rectangle (live preview)
            whiteboardCtx.beginPath();
            whiteboardCtx.rect(startX, startY, currentX - startX, currentY - startY);
            whiteboardCtx.stroke();
        } else if (currentTool === 'circle') {
            // Drawing logic for circle (live preview)
            const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)) / 2;
            const centerX = (startX + currentX) / 2;
            const centerY = (startY + currentY) / 2;
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            whiteboardCtx.stroke();
        }
        // Add more tools here
    }

    /**
     * Ends a drawing stroke and sends the drawing data to the server.
     */
    function stopDrawing() {
        if (!isDrawing || (currentUser && currentUser.role !== 'admin')) return;
        isDrawing = false;
        whiteboardCtx.closePath();

        const drawingData = {
            tool: currentTool,
            color: currentColor,
            width: currentBrushSize,
            start: { x: startX, y: startY },
            end: { x: lastX, y: lastY }, // For line/pen, this is the last point of the segment
            points: currentStrokePoints, // Store all points for complex strokes
            // Add other properties if needed for shapes (e.g., radius for circle)
        };

        // Add the drawing action to the current page's history
        addDrawingActionToHistory(drawingData);

        // Emit the drawing data to the server
        if (socket && currentClassroom) {
            socket.emit('whiteboard_draw', {
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex,
                data: drawingData
            });
        }
        snapshot = null; // Clear snapshot after drawing is complete
        currentStrokePoints = []; // Reset for the next stroke

        saveWhiteboardToLocalStorage(); // Save to local storage on drawing completion
    }

    /**
     * Adds a drawing action to the local history for undo/redo.
     * @param {object} action - The drawing action object.
     */
    function addDrawingActionToHistory(action) {
        // Ensure the current page exists
        if (!whiteboardPages[currentPageIndex]) {
            whiteboardPages[currentPageIndex] = [];
        }

        // Clear redo stack when a new action is performed
        redoStack.length = 0;

        // Add action to undo stack for the current page
        undoStack.push({ pageIndex: currentPageIndex, action: action });

        // Maintain max history steps
        if (undoStack.length > MAX_HISTORY_STEPS) {
            undoStack.shift(); // Remove the oldest action
        }
        updateUndoRedoButtons();
    }

    /**
     * Undoes the last drawing action on the current page.
     */
    function undoLastAction() {
        if (undoStack.length === 0 || (currentUser && currentUser.role !== 'admin')) {
            showNotification("Nothing to undo.", true);
            return;
        }

        const lastAction = undoStack.pop();
        if (lastAction.pageIndex !== currentPageIndex) {
            // If the last action is not on the current page, push it back and re-evaluate
            undoStack.push(lastAction);
            showNotification("Last action is on a different page. Please go to that page to undo.", true);
            return;
        }

        redoStack.push(lastAction); // Push to redo stack
        updateUndoRedoButtons();

        // Remove the action from the current page's whiteboardPages array
        const pageDrawings = whiteboardPages[currentPageIndex];
        // Find and remove the exact action object, assuming it's the last one
        // A more robust undo might require storing index or unique ID
        pageDrawings.pop();

        // Re-render the current page to reflect the undo
        renderCurrentWhiteboardPage();

        // Inform server about undo (optional, if server also maintains per-client undo)
        // For now, server only gets explicit draw/clear. A full undo sync would be complex.
        // For simplicity, this undo is client-side only.
        showNotification("Last action undone.");
        saveWhiteboardToLocalStorage(); // Save to local storage after undo
    }

    /**
     * Redoes the last undone drawing action on the current page.
     */
    function redoLastAction() {
        if (redoStack.length === 0 || (currentUser && currentUser.role !== 'admin')) {
            showNotification("Nothing to redo.", true);
            return;
        }

        const lastUndoneAction = redoStack.pop();
        if (lastUndoneAction.pageIndex !== currentPageIndex) {
            redoStack.push(lastUndoneAction);
            showNotification("Last undone action is on a different page. Please go to that page to redo.", true);
            return;
        }

        undoStack.push(lastUndoneAction); // Push back to undo stack
        updateUndoRedoButtons();

        // Add the action back to the current page's whiteboardPages array
        whiteboardPages[currentPageIndex].push(lastUndoneAction.action);

        // Re-render the current page to reflect the redo
        renderCurrentWhiteboardPage();

        showNotification("Last action redone.");
        saveWhiteboardToLocalStorage(); // Save to local storage after redo
    }

    /**
     * Updates the enabled/disabled state of undo/redo buttons.
     */
    function updateUndoRedoButtons() {
        if (undoButton) undoButton.disabled = undoStack.length === 0;
        if (redoButton) redoButton.disabled = redoStack.length === 0;
    }

    /**
     * Clears the entire whiteboard canvas.
     */
    function clearWhiteboard() {
        if (currentUser && currentUser.role !== 'admin') {
            showNotification("Only administrators can clear the whiteboard.", true);
            return;
        }
        if (confirm('Are you sure you want to clear the entire whiteboard page? This cannot be undone by others.')) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

            // Clear the history for the current page
            whiteboardPages[currentPageIndex] = [];
            undoStack.length = 0; // Clear undo/redo stacks when clearing
            redoStack.length = 0;
            updateUndoRedoButtons();

            // Emit clear event to server
            if (socket && currentClassroom) {
                socket.emit('whiteboard_clear', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex
                });
            }
            showNotification("Whiteboard cleared.");
            saveWhiteboardToLocalStorage(); // Save to local storage after clearing
        }
    }

    /**
     * Renders all drawing items for the current page onto the canvas.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx || !whiteboardCanvas) return;

        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Ensure background is black
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const drawingsOnPage = whiteboardPages[currentPageIndex] || [];
        drawingsOnPage.forEach(item => {
            drawWhiteboardItem(item);
        });
        updateWhiteboardPageDisplay();
    }

    /**
     * Draws a single whiteboard item (path or shape) onto the canvas.
     * This function is used for re-rendering history.
     * @param {object} item - The drawing item object.
     */
    function drawWhiteboardItem(item) {
        if (!whiteboardCtx) return;

        whiteboardCtx.save(); // Save current state before applying item properties

        whiteboardCtx.strokeStyle = item.color;
        whiteboardCtx.lineWidth = item.width;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';

        if (item.tool === 'eraser') {
            whiteboardCtx.globalCompositeOperation = 'destination-out';
        } else {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }

        whiteboardCtx.beginPath();

        if (item.tool === 'pen' || item.tool === 'eraser') {
            if (item.points && item.points.length > 0) {
                // Reconstruct smoothed path from points
                whiteboardCtx.moveTo(item.points[0].x, item.points[0].y);
                for (let i = 0; i < item.points.length - 1; i++) {
                    const p1 = item.points[i];
                    const p2 = item.points[i + 1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    whiteboardCtx.quadraticCurveTo(p1.x, p1.y, midX, midY); //
                }
                // Draw the last segment to the very last point
                whiteboardCtx.lineTo(item.points[item.points.length - 1].x, item.points[item.points.length - 1].y);
                whiteboardCtx.stroke();
            }
        } else if (item.tool === 'rectangle') {
            whiteboardCtx.rect(item.start.x, item.start.y, item.end.x - item.start.x, item.end.y - item.start.y);
            whiteboardCtx.stroke();
        } else if (item.tool === 'circle') {
            const radius = Math.sqrt(Math.pow(item.end.x - item.start.x, 2) + Math.pow(item.end.y - item.start.y, 2)) / 2;
            const centerX = (item.start.x + item.end.x) / 2;
            const centerY = (item.start.y + item.end.y) / 2;
            whiteboardCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            whiteboardCtx.stroke();
        }
        // Add more tools here for rendering
        whiteboardCtx.restore(); // Restore to previous state
    }


    /**
     * Fetches whiteboard history from the server.
     */
    function fetchWhiteboardHistory() {
        if (socket && currentClassroom) {
            console.log("Requesting whiteboard history from server.");
            socket.emit('request_whiteboard_history', { classroomId: currentClassroom.id }); //
        }
    }

    /**
     * Saves the current whiteboard canvas content to localStorage as a Base64 image.
     * @param {boolean} forceNotification - If true, displays a notification even if auto-saving.
     */
    function saveWhiteboardToLocalStorage(forceNotification = false) { //
        if (!whiteboardCanvas || !currentClassroom || !currentClassroom.id || !currentUser || currentUser.role !== 'admin') {
            // Only admins should save local whiteboard state, other users get it from server.
            return;
        }
        try {
            const dataURL = whiteboardCanvas.toDataURL('image/png');
            localStorage.setItem(`whiteboard-${currentClassroom.id}`, dataURL);
            if (forceNotification) {
                showNotification("Whiteboard saved to browser storage!");
            }
            console.log("Whiteboard saved to localStorage.");
        } catch (e) {
            console.error("Failed to save whiteboard to localStorage:", e);
            if (forceNotification) {
                showNotification("Failed to save whiteboard to browser storage.", true);
            }
        }
    }

    /**
     * Loads the whiteboard canvas content from localStorage.
     */
    function loadWhiteboardFromLocalStorage() { //
        if (!whiteboardCanvas || !currentClassroom || !currentClassroom.id) {
            return;
        }
        try {
            const savedDataURL = localStorage.getItem(`whiteboard-${currentClassroom.id}`);
            if (savedDataURL) {
                const img = new Image();
                img.onload = () => {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000'; // Fill with black before drawing image
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.drawImage(img, 0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    showNotification("Whiteboard loaded from browser storage.");
                };
                img.onerror = () => {
                    console.error("Error loading saved whiteboard image from localStorage. Clearing stale data.");
                    localStorage.removeItem(`whiteboard-${currentClassroom.id}`);
                    showNotification("Failed to load whiteboard from browser storage. Data corrupted.", true);
                    renderCurrentWhiteboardPage(); // Render blank or history
                };
                img.src = savedDataURL;
            } else {
                console.log("No whiteboard data found in localStorage for this classroom.");
                renderCurrentWhiteboardPage(); // Ensure initial render for potentially empty history
            }
        } catch (e) {
            console.error("Failed to load whiteboard from localStorage:", e);
            showNotification("Failed to load whiteboard from browser storage.", true);
            renderCurrentWhiteboardPage(); // Render blank or history on error
        }
    }

    /**
     * Auto-saves the current canvas image to the server if it has changed. (Bonus)
     */
    function autoSaveWhiteboardToServer() { //
        if (!whiteboardCanvas || !currentClassroom || !currentClassroom.id || !socket || !currentUser || currentUser.role !== 'admin') {
            // Only admins auto-save to server
            return;
        }
        try {
            const currentDataURL = whiteboardCanvas.toDataURL('image/png');
            // Only send if the canvas content has actually changed since the last auto-save
            if (currentDataURL !== lastAutoSaveDataURL) {
                socket.emit('save_whiteboard_snapshot', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex,
                    snapshotDataURL: currentDataURL
                });
                lastAutoSaveDataURL = currentDataURL;
                console.log(`[Whiteboard] Auto-saving snapshot for page ${currentPageIndex} to server.`);
                // showNotification(`Whiteboard auto-saved to server (Page ${currentPageIndex + 1})`); // Too frequent notification
            } else {
                console.log(`[Whiteboard] No changes to save for page ${currentPageIndex}.`);
            }
        } catch (e) {
            console.error("Failed to auto-save whiteboard to server:", e);
        }
    }


    /**
     * Changes the current whiteboard page.
     * @param {number} direction - 1 for next page, -1 for previous page.
     */
    function changeWhiteboardPage(direction) {
        if (!currentClassroom || !socket) return;

        let newIndex = currentPageIndex + direction;

        // Ensure new page index is within bounds (or create new page if going forward)
        if (direction === 1 && newIndex >= whiteboardPages.length) {
            whiteboardPages.push([]); // Create a new empty page
            showNotification(`Created new whiteboard page ${newIndex + 1}.`);
        } else if (newIndex < 0) {
            newIndex = 0; // Prevent going below page 0
            showNotification("Already on the first page.", true);
        } else if (newIndex >= whiteboardPages.length) {
            newIndex = whiteboardPages.length - 1; // Prevent going beyond last page
            showNotification("Already on the last page.", true);
        }

        if (newIndex !== currentPageIndex) {
            currentPageIndex = newIndex;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();

            // Notify server about page change
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: currentPageIndex
            });
            saveWhiteboardToLocalStorage(); // Save to local storage after page change
        }
    }

    /**
     * Updates the display for the current whiteboard page number.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} / ${whiteboardPages.length}`;
        }
        // Also update button states
        if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
        // nextWhiteboardPageBtn is never truly disabled if we can create new pages
        // if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1;
    }


    // --- Chat Functions ---

    /**
     * Sets up event listeners for chat functionality.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.removeEventListener('click', handleSendMessage); // Prevent multiple listeners
            sendMessageBtn.addEventListener('click', handleSendMessage);
        }
        if (chatInput) {
            chatInput.removeEventListener('keypress', handleChatInputKeypress); // Prevent multiple listeners
            chatInput.addEventListener('keypress', handleChatInputKeypress);
        }
    }

    /**
     * Handles sending a chat message.
     */
    function handleSendMessage() {
        const message = chatInput.value.trim();
        if (message && socket && currentClassroom && currentUser) {
            socket.emit('message', {
                classroomId: currentClassroom.id,
                username: currentUser.username,
                role: currentUser.role,
                user_id: currentUser.id, // Include user_id for client-side message differentiation
                message: message
            });
            chatInput.value = '';
        }
    }

    /**
     * Handles keypress events in the chat input to send message on Enter.
     * @param {KeyboardEvent} e - The keyboard event.
     */
    function handleChatInputKeypress(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    }


    // --- Library Functions ---

    /**
     * Loads files stored in the classroom library.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            libraryFilesList.innerHTML = '<li>Please enter a classroom to view library files.</li>';
            return;
        }
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/library`);
            const files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            const filteredFiles = searchTerm
                ? files.filter(file => file.filename.toLowerCase().includes(searchTerm))
                : files;

            libraryFilesList.innerHTML = '';
            if (filteredFiles.length === 0) {
                libraryFilesList.innerHTML = '<li>No files found in the library.</li>';
            } else {
                filteredFiles.forEach(file => {
                    const li = document.createElement('li');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = file.url; // Assuming `file.url` is the direct download link
                    downloadLink.textContent = file.filename;
                    downloadLink.target = '_blank'; // Open in new tab
                    li.appendChild(downloadLink);

                    // Add delete button for admins
                    if (currentUser && currentUser.role === 'admin') {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.classList.add('delete-file-btn');
                        deleteBtn.onclick = async () => {
                            if (confirm(`Are you sure you want to delete "${file.filename}"?`)) {
                                try {
                                    const deleteResponse = await fetch(`/api/classrooms/${currentClassroom.id}/library/${file.id}`, {
                                        method: 'DELETE'
                                    });
                                    const result = await deleteResponse.json();
                                    if (deleteResponse.ok) {
                                        showNotification(result.message);
                                        loadLibraryFiles(); // Reload list
                                        socket.emit('admin_action_update', {
                                            classroomId: currentClassroom.id,
                                            message: `Admin ${currentUser.username} deleted a file from the library.`
                                        });
                                    } else {
                                        showNotification(result.error, true);
                                    }
                                } catch (error) {
                                    console.error('Error deleting file:', error);
                                    showNotification('An error occurred during file deletion.', true);
                                }
                            }
                        };
                        li.appendChild(deleteBtn);
                    }
                    libraryFilesList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            libraryFilesList.innerHTML = '<li>Failed to load library files.</li>';
        }
    }

    /**
     * Handles file upload to the library.
     */
    async function uploadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id || !currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can upload files to the library.", true);
            return;
        }

        const files = libraryFileInput.files;
        if (files.length === 0) {
            showNotification("Please select files to upload.", true);
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/library`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                libraryFileInput.value = ''; // Clear input
                loadLibraryFiles(); // Reload list
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `Admin ${currentUser.username} uploaded new files to the library.`
                });
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            showNotification('An error occurred during file upload.', true);
        }
    }


    // --- Assessment Functions ---

    /**
     * Renders a question element for the assessment creation form.
     * @param {object} [question={}] - Optional existing question data to pre-populate.
     * @param {number} [index=0] - Optional index for the question (used for display).
     */
    function renderQuestionInput(question = {}, index = 0) {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-input-group');
        questionDiv.dataset.questionIndex = index;
        questionDiv.innerHTML = `
            <h4>Question ${index + 1}</h4>
            <input type="text" class="question-text" placeholder="Question text" value="${question.question_text || ''}" required>
            <select class="question-type">
                <option value="multiple_choice" ${question.question_type === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
                <option value="true_false" ${question.question_type === 'true_false' ? 'selected' : ''}>True/False</option>
                <option value="short_answer" ${question.question_type === 'short_answer' ? 'selected' : ''}>Short Answer</option>
            </select>
            <div class="options-container" style="${question.question_type === 'multiple_choice' ? '' : 'display:none;'}">
                <p>Options (one per line, mark correct with *)</p>
                <textarea class="question-options" rows="4" placeholder="Option 1\n*Option 2 (correct)\nOption 3">${(question.options && Array.isArray(question.options)) ? question.options.join('\n') : ''}</textarea>
            </div>
            <div class="true-false-container" style="${question.question_type === 'true_false' ? '' : 'display:none;'}">
                <label><input type="radio" name="tf_answer_${index}" value="True" ${question.correct_answer === 'True' ? 'checked' : ''}> True</label>
                <label><input type="radio" name="tf_answer_${index}" value="False" ${question.correct_answer === 'False' ? 'checked' : ''}> False</label>
            </div>
            <div class="short-answer-container" style="${question.question_type === 'short_answer' ? '' : 'display:none;'}">
                <input type="text" class="correct-short-answer" placeholder="Correct Answer (e.g., 'Volcano')" value="${question.correct_answer || ''}">
            </div>
            <button type="button" class="remove-question-btn">Remove Question</button>
        `;
        questionsContainer.appendChild(questionDiv);

        // Add event listeners for type change
        const questionTypeSelect = questionDiv.querySelector('.question-type');
        const optionsContainer = questionDiv.querySelector('.options-container');
        const trueFalseContainer = questionDiv.querySelector('.true-false-container');
        const shortAnswerContainer = questionDiv.querySelector('.short-answer-container');

        questionTypeSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            optionsContainer.style.display = type === 'multiple_choice' ? '' : 'none';
            trueFalseContainer.style.display = type === 'true_false' ? '' : 'none';
            shortAnswerContainer.style.display = type === 'short_answer' ? '' : 'none';
        });

        // Add event listener for remove button
        questionDiv.querySelector('.remove-question-btn').addEventListener('click', () => {
            questionDiv.remove();
            // Re-index questions after removal
            document.querySelectorAll('.question-input-group').forEach((qDiv, idx) => {
                qDiv.dataset.questionIndex = idx;
                qDiv.querySelector('h4').textContent = `Question ${idx + 1}`;
                const tfRadios = qDiv.querySelectorAll('input[type="radio"][name^="tf_answer_"]');
                tfRadios.forEach(radio => {
                    radio.name = `tf_answer_${idx}`; // Update radio button names
                });
            });
        });
    }

    /**
     * Gathers assessment data from the form.
     * @returns {object|null} The assessment data or null if validation fails.
     */
    function getAssessmentDataFromForm() {
        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionTextarea.value.trim();
        const scheduledAt = assessmentScheduledAtInput.value;
        const durationMinutes = parseInt(assessmentDurationMinutesInput.value);

        if (!title || !scheduledAt || isNaN(durationMinutes) || durationMinutes <= 0) {
            displayMessage(assessmentCreationMessage, 'Please fill in all required assessment fields: Title, Scheduled Time, and Duration.', true);
            return null;
        }

        const questions = [];
        let questionIsValid = true;
        document.querySelectorAll('.question-input-group').forEach(qDiv => {
            const questionText = qDiv.querySelector('.question-text').value.trim();
            const questionType = qDiv.querySelector('.question-type').value;
            let options = [];
            let correctAnswer = '';

            if (!questionText) {
                questionIsValid = false;
                displayMessage(assessmentCreationMessage, 'All question texts must be filled.', true);
                return;
            }

            if (questionType === 'multiple_choice') {
                const optionsText = qDiv.querySelector('.question-options').value.trim();
                if (!optionsText) {
                    questionIsValid = false;
                    displayMessage(assessmentCreationMessage, 'Multiple choice questions must have options.', true);
                    return;
                }
                options = optionsText.split('\n').map(opt => opt.trim());
                const correctOptions = options.filter(opt => opt.startsWith('*'));
                if (correctOptions.length !== 1) {
                    questionIsValid = false;
                    displayMessage(assessmentCreationMessage, 'Multiple choice questions must have exactly one correct option marked with an asterisk (*).', true);
                    return;
                }
                correctAnswer = correctOptions[0].substring(1).trim(); // Remove asterisk
                options = options.map(opt => opt.startsWith('*') ? opt.substring(1).trim() : opt.trim()); // Clean options
            } else if (questionType === 'true_false') {
                const checkedRadio = qDiv.querySelector('input[type="radio"]:checked');
                if (!checkedRadio) {
                    questionIsValid = false;
                    displayMessage(assessmentCreationMessage, 'True/False questions must have a correct answer selected.', true);
                    return;
                }
                correctAnswer = checkedRadio.value;
            } else if (questionType === 'short_answer') {
                correctAnswer = qDiv.querySelector('.correct-short-answer').value.trim();
                if (!correctAnswer) {
                    questionIsValid = false;
                    displayMessage(assessmentCreationMessage, 'Short answer questions must have a correct answer specified.', true);
                    return;
                }
            }
            questions.push({ question_text: questionText, question_type: questionType, options: options, correct_answer: correctAnswer });
        });

        if (!questionIsValid) {
            return null;
        }

        if (questions.length === 0) {
            displayMessage(assessmentCreationMessage, 'Please add at least one question to the assessment.', true);
            return null;
        }

        return {
            title: title,
            description: description,
            scheduled_at: scheduledAt,
            duration_minutes: durationMinutes,
            questions: questions
        };
    }

    /**
     * Submits a new assessment to the server.
     */
    async function submitAssessment() {
        if (!currentClassroom || !currentClassroom.id || !currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can create assessments.", true);
            return;
        }

        const assessmentData = getAssessmentDataFromForm();
        if (!assessmentData) {
            return; // Error message already displayed by getAssessmentDataFromForm
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentData)
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(assessmentCreationMessage, result.message, false);
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = ''; // Clear questions
                renderQuestionInput(); // Add one default question
                loadAssessments(); // Refresh the list
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `Admin ${currentUser.username} created a new assessment: "${assessmentData.title}".`
                });
            } else {
                displayMessage(assessmentCreationMessage, result.error, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            displayMessage(assessmentCreationMessage, 'An error occurred during assessment creation.', true);
        }
    }

    /**
     * Loads and displays assessments for the current classroom.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            assessmentListDiv.innerHTML = '<li>Please enter a classroom to view assessments.</li>';
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`);
            let assessments = await response.json();

            const searchTerm = assessmentSearchInput.value.toLowerCase();
            if (searchTerm) {
                assessments = assessments.filter(ass =>
                    ass.title.toLowerCase().includes(searchTerm) ||
                    ass.description.toLowerCase().includes(searchTerm)
                );
            }

            assessmentListDiv.innerHTML = '';
            if (assessments.length === 0) {
                assessmentListDiv.innerHTML = '<li>No assessments found.</li>';
            } else {
                assessments.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)); // Sort by scheduled time

                assessments.forEach(assessment => {
                    const li = document.createElement('li');
                    const scheduledTime = new Date(assessment.scheduled_at).toLocaleString();
                    const now = new Date();
                    const isScheduled = new Date(assessment.scheduled_at) > now;
                    const hasEnded = new Date(assessment.scheduled_at).getTime() + (assessment.duration_minutes * 60 * 1000) < now.getTime();
                    const isActive = !isScheduled && !hasEnded;

                    let statusText = '';
                    let actionButton = '';
                    let statusClass = '';

                    if (hasEnded) {
                        statusText = 'Ended';
                        statusClass = 'assessment-status-ended';
                        if (currentUser && currentUser.role === 'admin') {
                            actionButton = `<button class="view-submissions-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>`;
                        } else {
                            actionButton = `<button class="view-my-submission-btn" data-assessment-id="${assessment.id}">View My Submission</button>`;
                        }
                    } else if (isActive) {
                        statusText = 'Active';
                        statusClass = 'assessment-status-active';
                        if (currentUser && currentUser.role === 'admin') {
                            actionButton = `<button class="manage-assessment-btn" data-assessment-id="${assessment.id}">Manage Active</button>
                                            <button class="end-assessment-btn" data-assessment-id="${assessment.id}">End Now</button>`;
                        } else {
                            actionButton = `<button class="take-assessment-btn" data-assessment-id="${assessment.id}">Take Assessment</button>`;
                        }
                    } else if (isScheduled) {
                        statusText = `Scheduled for ${scheduledTime}`;
                        statusClass = 'assessment-status-scheduled';
                        if (currentUser && currentUser.role === 'admin') {
                            actionButton = `<button class="start-assessment-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">Start Now</button>
                                            <button class="edit-assessment-btn" data-assessment-id="${assessment.id}">Edit</button>
                                            <button class="delete-assessment-btn" data-assessment-id="${assessment.id}">Delete</button>`;
                        }
                    }

                    li.innerHTML = `
                        <div>
                            <strong>${assessment.title}</strong> (${assessment.duration_minutes} mins) <span class="assessment-status ${statusClass}">${statusText}</span><br>
                            <small>${assessment.description}</small>
                        </div>
                        <div class="assessment-actions">
                            ${actionButton}
                        </div>
                    `;
                    assessmentListDiv.appendChild(li);
                });

                // Attach event listeners to newly created buttons
                document.querySelectorAll('.start-assessment-btn').forEach(button => {
                    button.addEventListener('click', () => startAssessment(button.dataset.assessmentId, button.dataset.assessmentTitle));
                });
                document.querySelectorAll('.end-assessment-btn').forEach(button => {
                    button.addEventListener('click', () => endAssessment(button.dataset.assessmentId));
                });
                document.querySelectorAll('.take-assessment-btn').forEach(button => {
                    button.addEventListener('click', () => displayAssessmentForTaking(button.dataset.assessmentId));
                });
                document.querySelectorAll('.view-submissions-btn').forEach(button => {
                    button.addEventListener('click', () => viewSubmissions(button.dataset.assessmentId, button.dataset.assessmentTitle));
                });
                // TODO: Implement edit and view my submission buttons
                document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                    button.addEventListener('click', () => deleteAssessment(button.dataset.assessmentId));
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            assessmentListDiv.innerHTML = '<li>Failed to load assessments.</li>';
        }
    }

    /**
     * Admin starts an assessment immediately.
     * @param {string} assessmentId - The ID of the assessment to start.
     * @param {string} assessmentTitle - The title of the assessment.
     */
    async function startAssessment(assessmentId, assessmentTitle) {
        if (!confirm(`Are you sure you want to START the assessment "${assessmentTitle}" NOW? This will make it active for all students.`)) {
            return;
        }
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                loadAssessments(); // Refresh list to show active status
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `Admin ${currentUser.username} started the assessment "${assessmentTitle}".`
                });
                // Server should emit 'assessment_started' to all clients in classroom
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error starting assessment:', error);
            showNotification('An error occurred while trying to start the assessment.', true);
        }
    }

    /**
     * Admin ends an active assessment immediately.
     * @param {string} assessmentId - The ID of the assessment to end.
     */
    async function endAssessment(assessmentId) {
        if (!confirm(`Are you sure you want to END this assessment NOW? Any ongoing attempts will be submitted.`)) {
            return;
        }
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}/end`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                loadAssessments(); // Refresh list to show ended status
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `Admin ${currentUser.username} ended an active assessment.`
                });
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error ending assessment:', error);
            showNotification('An error occurred while trying to end the assessment.', true);
        }
    }

    /**
     * Deletes an assessment.
     * @param {string} assessmentId - The ID of the assessment to delete.
     */
    async function deleteAssessment(assessmentId) {
        if (!confirm("Are you sure you want to delete this assessment? This action cannot be undone.")) {
            return;
        }
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                loadAssessments(); // Reload the list
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

    /**
     * Displays a specific assessment for a student to take.
     * @param {string} assessmentId - The ID of the assessment to display.
     */
    async function displayAssessmentForTaking(assessmentId) {
        if (!currentClassroom || !currentClassroom.id || !currentUser) {
            showNotification("Please log in and enter a classroom.", true);
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}`);
            const assessment = await response.json();

            if (!response.ok) {
                showNotification(assessment.error || 'Failed to fetch assessment details.', true);
                return;
            }

            if (new Date(assessment.end_time) < new Date()) {
                showNotification("This assessment has already ended.", true);
                loadAssessments(); // Refresh list to show correct status
                return;
            }

            if (new Date(assessment.scheduled_at) > new Date()) {
                showNotification(`This assessment is scheduled for ${new Date(assessment.scheduled_at).toLocaleString()} and has not started yet.`, true);
                return;
            }

            currentAssessmentToTake = assessment;
            takeAssessmentTitle.textContent = assessment.title;
            takeAssessmentDescription.textContent = assessment.description;
            takeAssessmentForm.innerHTML = ''; // Clear previous questions

            assessment.questions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('take-assessment-question');
                questionDiv.innerHTML = `<h4>Question ${index + 1}: ${question.question_text}</h4>`;

                if (question.question_type === 'multiple_choice' && question.options) {
                    question.options.forEach(option => {
                        const optionId = `q${index}-opt-${option.replace(/\s/g, '-')}`;
                        questionDiv.innerHTML += `
                            <label>
                                <input type="radio" name="question_${index}" value="${option}" id="${optionId}">
                                ${option}
                            </label><br>
                        `;
                    });
                } else if (question.question_type === 'true_false') {
                    questionDiv.innerHTML += `
                        <label><input type="radio" name="question_${index}" value="True"> True</label>
                        <label><input type="radio" name="question_${index}" value="False"> False</label>
                    `;
                } else if (question.question_type === 'short_answer') {
                    questionDiv.innerHTML += `
                        <input type="text" name="question_${index}" placeholder="Your answer">
                    `;
                }
                takeAssessmentForm.appendChild(questionDiv);
            });

            showSection(classroomSection); // Keep in classroom section
            showClassroomSubSection(takeAssessmentContainer); // Show the assessment taking interface

            startAssessmentTimer(new Date(assessment.end_time)); // Start the countdown timer
            showNotification(`Now taking assessment: "${assessment.title}". Time has started!`);

        } catch (error) {
            console.error('Error displaying assessment:', error);
            showNotification('An error occurred while loading the assessment.', true);
        }
    }

    /**
     * Starts the countdown timer for an assessment.
     * @param {Date} endTime - The exact time the assessment should end.
     */
    function startAssessmentTimer(endTime) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }
        assessmentEndTime = endTime;

        const updateTimer = () => {
            const now = new Date();
            const timeLeft = assessmentEndTime.getTime() - now.getTime();

            if (timeLeft <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerInterval = null;
                assessmentTimerDisplay.textContent = 'Time Left: 00:00:00 - Ended!';
                assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
                showNotification("Time's up! Your assessment will be submitted.", true);
                if (takeAssessmentContainer.classList.contains('active')) {
                    submitAssessmentAnswers(true); // Auto-submit if time runs out
                }
                return;
            }

            const totalSeconds = Math.floor(timeLeft / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            const format = (num) => num.toString().padStart(2, '0');
            assessmentTimerDisplay.textContent = `Time Left: ${format(hours)}:${format(minutes)}:${format(seconds)}`;

            // Apply warning/critical styles
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
            if (totalSeconds <= 60) { // Last 1 minute
                assessmentTimerDisplay.classList.add('critical');
            } else if (totalSeconds <= 300) { // Last 5 minutes
                assessmentTimerDisplay.classList.add('warning');
            } else {
                assessmentTimerDisplay.classList.add('active');
            }
        };

        assessmentTimerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Call immediately to show initial time
    }

    /**
     * Submits student answers for an assessment.
     * @param {boolean} isAutoSubmit - True if submitted automatically by timer, false if manually.
     */
    async function submitAssessmentAnswers(isAutoSubmit = false) {
        if (!currentAssessmentToTake || !currentUser || !currentClassroom) {
            showNotification("No assessment is currently active to submit.", true);
            return;
        }

        const answers = [];
        currentAssessmentToTake.questions.forEach((question, index) => {
            let studentAnswer = '';
            if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
                const selected = takeAssessmentForm.querySelector(`input[name="question_${index}"]:checked`);
                if (selected) {
                    studentAnswer = selected.value;
                }
            } else if (question.question_type === 'short_answer') {
                const input = takeAssessmentForm.querySelector(`input[name="question_${index}"]`);
                if (input) {
                    studentAnswer = input.value.trim();
                }
            }
            answers.push({
                question_index: index,
                question_text: question.question_text, // Store question text with answer for review
                question_type: question.question_type,
                submitted_answer: studentAnswer,
                correct_answer: question.correct_answer // Store correct answer for backend marking
            });
        });

        const submissionData = {
            assessment_id: currentAssessmentToTake.id,
            classroomId: currentClassroom.id,
            student_id: currentUser.id,
            student_username: currentUser.username,
            answers: answers,
            submission_time: new Date().toISOString(),
            is_auto_submit: isAutoSubmit
        };

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData)
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(assessmentSubmissionMessage, result.message, false);
                showNotification(`Assessment "${currentAssessmentToTake.title}" submitted successfully!`);
                clearInterval(assessmentTimerInterval); // Stop timer
                assessmentTimerInterval = null;
                assessmentTimerDisplay.textContent = 'Time Left: --:--:--'; // Reset display

                // Optionally, navigate back to assessment list or show submission summary
                showClassroomSubSection(assessmentsSection); // Go back to assessment list
                loadAssessments(); // Reload assessments to update status for the user
            } else {
                displayMessage(assessmentSubmissionMessage, result.error, true);
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error submitting assessment answers:', error);
            displayMessage(assessmentSubmissionMessage, 'An error occurred during submission.', true);
            showNotification('An error occurred during submission.', true);
        }
    }

    /**
     * Fetches and displays submissions for a specific assessment (admin view).
     * @param {string} assessmentId - The ID of the assessment.
     * @param {string} assessmentTitle - The title of the assessment.
     */
    async function viewSubmissions(assessmentId, assessmentTitle) {
        if (!currentClassroom || !currentClassroom.id || !currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can view submissions.", true);
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}/submissions`);
            const submissions = await response.json();

            if (!response.ok) {
                showNotification(submissions.error || 'Failed to fetch submissions.', true);
                return;
            }

            submissionsAssessmentTitle.textContent = `Submissions for: ${assessmentTitle}`;
            submissionsList.innerHTML = '';

            if (submissions.length === 0) {
                submissionsList.innerHTML = '<li>No submissions found for this assessment.</li>';
            } else {
                submissions.forEach(submission => {
                    const li = document.createElement('li');
                    const submissionTime = new Date(submission.submission_time).toLocaleString();
                    const scoreDisplay = submission.score !== undefined ? `Score: ${submission.score}/${submission.total_questions}` : 'Not marked';
                    const markButton = submission.score === undefined ? `<button class="mark-submission-btn" data-submission-id="${submission.id}" data-assessment-title="${assessmentTitle}" data-assessment-id="${assessmentId}">Mark</button>` : '';

                    li.innerHTML = `
                        <strong>Student: ${submission.student_username}</strong><br>
                        Submitted: ${submission_time}<br>
                        ${scoreDisplay} ${markButton}
                        <div class="submission-details" style="display:none;">
                            <h5>Answers:</h5>
                            <ul>
                                ${submission.answers.map(answer => `
                                    <li>
                                        Q: ${answer.question_text}<br>
                                        Your Answer: ${answer.submitted_answer || 'No answer'}<br>
                                        Correct Answer: ${answer.correct_answer || 'N/A'}
                                        ${answer.is_correct !== undefined ? `(${answer.is_correct ? 'Correct' : 'Incorrect'})` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <button class="toggle-submission-details">View Details</button>
                        <hr>
                    `;
                    submissionsList.appendChild(li);
                });

                document.querySelectorAll('.toggle-submission-details').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const detailsDiv = e.target.previousElementSibling;
                        detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
                        e.target.textContent = detailsDiv.style.display === 'none' ? 'View Details' : 'Hide Details';
                    });
                });

                document.querySelectorAll('.mark-submission-btn').forEach(button => {
                    button.addEventListener('click', () => markSubmission(button.dataset.submissionId, button.dataset.assessmentId, button.dataset.assessmentTitle));
                });
            }

            showClassroomSubSection(viewSubmissionsContainer);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showNotification('An error occurred while fetching submissions.', true);
        }
    }

    /**
     * Marks a specific submission (admin action).
     * @param {string} submissionId - The ID of the submission to mark.
     * @param {string} assessmentId - The ID of the parent assessment.
     * @param {string} assessmentTitle - The title of the parent assessment.
     */
    async function markSubmission(submissionId, assessmentId, assessmentTitle) {
        if (!confirm("Are you sure you want to mark this submission? This will calculate the score.")) {
            return;
        }
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}/submissions/${submissionId}/mark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                viewSubmissions(assessmentId, assessmentTitle); // Refresh the submissions list
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `Admin ${currentUser.username} marked a submission for assessment "${assessmentTitle}".`
                });
                socket.emit('mark_notification', { // Notify the student who submitted
                    studentId: result.student_id, // Server should return student_id
                    assessmentTitle: assessmentTitle
                });
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error marking submission:', error);
            showNotification('An error occurred while marking the submission.', true);
        }
    }


    // --- Event Listeners and Initial Setup ---

    // Auth
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
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
                    sessionStorage.setItem('user_id', currentUser.id); // Store user_id for client-side chat message check
                    displayMessage(authMessage, result.message, false);
                    checkLoginStatus(); // Re-check to update UI
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Login error:', error);
                displayMessage(authMessage, 'An error occurred during login.', true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const role = registerForm.role.value;
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(authMessage, result.message, false);
                    registerForm.reset();
                    showRegisterLink.click(); // Switch back to login view
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Registration error:', error);
                displayMessage(authMessage, 'An error occurred during registration.', true);
            }
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginContainer) loginContainer.classList.add('hidden');
            if (registerContainer) registerContainer.classList.remove('hidden');
            if (authMessage) authMessage.textContent = '';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerContainer) registerContainer.classList.add('hidden');
            if (loginContainer) loginContainer.classList.remove('hidden');
            if (authMessage) authMessage.textContent = '';
        });
    }

    // Dashboard
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                const result = await response.json();
                if (response.ok) {
                    currentUser = null;
                    localStorage.removeItem('currentUser');
                    sessionStorage.removeItem('user_id'); // Clear user_id on logout
                    cleanupClassroomResources(); // Clean up classroom if logged out
                    showNotification(result.message);
                    checkLoginStatus(); // Re-check to update UI (show auth)
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('An error occurred during logout.', true);
            }
        });
    }

    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification("Only administrators can create classrooms.", true);
                return;
            }
            const classroomName = newClassroomNameInput.value.trim();
            if (classroomName) {
                try {
                    const response = await fetch('/api/classrooms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: classroomName })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        displayMessage(classroomMessage, result.message, false);
                        newClassroomNameInput.value = '';
                        loadAvailableClassrooms(); // Refresh list
                    } else {
                        displayMessage(classroomMessage, result.error, true);
                    }
                } catch (error) {
                    console.error('Create classroom error:', error);
                    displayMessage(classroomMessage, 'An error occurred.', true);
                }
            } else {
                displayMessage(classroomMessage, 'Classroom name cannot be empty.', true);
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
        cleanupClassroomResources(); // Ensure resources are cleaned if user navigates back to dashboard from classroom
        loadAvailableClassrooms(); // Refresh classrooms list
    });

    if (navClassroom) navClassroom.addEventListener('click', () => {
        if (currentClassroom) {
            showSection(classroomSection);
            showClassroomSubSection(whiteboardArea); // Default to whiteboard
            updateNavActiveState(navWhiteboard);
        } else {
            showNotification("Please enter or create a classroom first.", true);
            showSection(dashboardSection); // Go back to dashboard if no classroom is active
            updateNavActiveState(navDashboard);
        }
    });

    if (navSettings) navSettings.addEventListener('click', () => {
        showSection(settingsSection);
        updateNavActiveState(navSettings);
        // Pre-fill settings form
        if (currentUser) {
            settingsUsernameInput.value = currentUser.username;
            settingsEmailInput.value = currentUser.email;
        }
    });

    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        cleanupClassroomResources(); // Clean up on leaving classroom
        loadAvailableClassrooms();
    });

    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
    });

    // Update Profile
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const newUsername = settingsUsernameInput.value.trim();
            const newEmail = settingsEmailInput.value.trim();
            const password = updateProfileForm.password.value; // For re-authentication/confirmation

            if (!newUsername || !newEmail) {
                showNotification("Username and Email cannot be empty.", true);
                return;
            }

            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentUser.id, // Ensure user ID is sent
                        username: newUsername,
                        email: newEmail,
                        password: password // Include password for re-auth
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    currentUser.username = newUsername;
                    currentUser.email = newEmail;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                    showNotification(result.message);
                    updateProfileForm.reset(); // Clear password field
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Profile update error:', error);
                showNotification('An error occurred during profile update.', true);
            }
        });
    }


    // Classroom Sub-sections
    if (navChat) navChat.addEventListener('click', () => {
        showClassroomSubSection(chatSection);
        updateNavActiveState(navChat);
    });
    if (navWhiteboard) navWhiteboard.addEventListener('click', () => {
        showClassroomSubSection(whiteboardArea);
        updateNavActiveState(navWhiteboard);
    });
    if (navLibrary) navLibrary.addEventListener('click', () => {
        showClassroomSubSection(librarySection);
        updateNavActiveState(navLibrary);
        loadLibraryFiles(); // Reload files when navigating to library
    });
    if (navAssessments) navAssessments.addEventListener('click', () => {
        showClassroomSubSection(assessmentsSection);
        updateNavActiveState(navAssessments);
        loadAssessments(); // Reload assessments when navigating to assessments
    });


    // Share Link
    if (shareLinkDisplay) {
        shareLinkDisplay.addEventListener('click', () => {
            if (shareLinkInput && currentClassroom) {
                shareLinkInput.value = `${window.location.origin}/classroom/${currentClassroom.id}`;
                shareLinkDisplay.classList.remove('hidden');
            }
        });
    }
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            if (shareLinkInput) {
                shareLinkInput.select();
                document.execCommand('copy');
                showNotification('Classroom link copied to clipboard!');
            }
        });
    }


    // Library Upload
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', uploadLibraryFiles);
    }
    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }


    // Assessment Creation
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const currentQuestionCount = document.querySelectorAll('.question-input-group').length;
            renderQuestionInput({}, currentQuestionCount);
        });
    }
    if (submitAssessmentBtn) {
        submitAssessmentBtn.addEventListener('click', submitAssessment);
    }
    if (assessmentSearchInput) {
        assessmentSearchInput.addEventListener('input', loadAssessments);
    }
    // Take Assessment
    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', () => submitAssessmentAnswers(false));
    }
    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            loadAssessments(); // Refresh list
            clearInterval(assessmentTimerInterval); // Stop timer
            assessmentTimerInterval = null;
            if (assessmentTimerDisplay) {
                assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
                assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
            }
        });
    }
    // View Submissions
    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            loadAssessments(); // Refresh list
        });
    }


    // Initialize app on load
    checkLoginStatus();
});
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

