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
        fetchWhiteboardHistory(); // Load whiteboard history for the current page
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

                // Simple boundary check (prevents panning too far out)
                const maxPanX = (videoElement.offsetWidth * state.currentScale - containerElement.offsetWidth) / (2 * state.currentScale);
                const maxPanY = (videoElement.offsetHeight * state.currentScale - containerElement.offsetHeight) / (2 * state.currentScale);

                state.offsetX = Math.max(-maxPanX, Math.min(maxPanX, newOffsetX));
                state.offsetY = Math.max(-maxPanY, Math.min(maxPanY, newOffsetY));
                
                applyTransform(videoElement.id);
            }
        });

        containerElement.addEventListener('mouseup', () => {
            isDragging = false;
            const state = videoZoomStates.get(videoElement.id);
            if (state && state.isZoomed) {
                 containerElement.style.cursor = 'zoom-out'; // Restore zoom-out cursor if still zoomed
            } else {
                containerElement.style.cursor = 'zoom-in';
            }
        });

        containerElement.addEventListener('mouseleave', () => { // Stop drag if mouse leaves container
            isDragging = false;
            const state = videoZoomStates.get(videoElement.id);
            if (state && state.isZoomed) {
                 containerElement.style.cursor = 'zoom-out';
            } else {
                containerElement.style.cursor = 'zoom-in';
            }
        });


        // --- Optional: Scroll Wheel for Finer Zoom ---
        containerElement.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevent page scrolling
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            // Get mouse position relative to the video element
            const rect = videoElement.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate current position of mouse relative to video's content
            const currentContentX = (mouseX / state.currentScale) - state.offsetX;
            const currentContentY = (mouseY / state.currentScale) - state.offsetY;

            let newScale = state.currentScale;
            if (e.deltaY < 0) { // Scroll up (zoom in)
                newScale += zoomStep;
            } else { // Scroll down (zoom out)
                newScale -= zoomStep;
            }

            newScale = Math.max(minZoom, Math.min(maxZoom, newScale));

            if (newScale !== state.currentScale) {
                state.currentScale = newScale;
                state.isZoomed = newScale > minZoom; // Update isZoomed based on scale

                // Adjust offsets to zoom towards the mouse pointer
                state.offsetX = (mouseX / newScale) - currentContentX;
                state.offsetY = (mouseY / newScale) - currentContentY;

                applyTransform(videoElement.id);
            }
        }, { passive: false }); // Use passive: false to allow preventDefault for wheel event
    }

                                                    

    /**
     * Updates the drawing color.
     */
    function updateColor() {
        currentColor = colorPicker.value;
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.fillStyle = currentColor;
    }

    /**
     * Updates the brush/stroke size.
     */
    function updateBrushSize() {
        currentBrushSize = parseInt(brushSizeSlider.value);
        whiteboardCtx.lineWidth = currentBrushSize;
    }

    /**
     * Clears the current whiteboard page and emits the clear event.
     * @param {boolean} [emitEvent=true] - Whether to emit the clear event to the server.
     */
    function clearCanvas(emitEvent = true) {
        if (currentUser.role !== 'admin') {
            showNotification("Only administrators can clear the whiteboard.", true);
            return;
        }
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        
        whiteboardPages[currentPageIndex] = []; // Clear local data for current page
        saveState(); // Save the cleared state

        if (emitEvent && socket && currentClassroom && currentClassroom.id) {
            socket.emit('whiteboard_data', { action: 'clear', classroomId: currentClassroom.id, data: { pageIndex: currentPageIndex } });
        }
        showNotification(`Whiteboard page ${currentPageIndex + 1} cleared.`);
    }

    /**
     * Saves the current canvas content as a PNG image.
     */
    function saveImage() {
        if (currentUser.role !== 'admin') {
            showNotification("Only administrators can save the whiteboard image.", true);
            return;
        }
        const dataURL = whiteboardCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `whiteboard-page-${currentPageIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification(`Whiteboard page ${currentPageIndex + 1} saved as image.`);
    }

    /**
     * Saves the current canvas state to the undo stack.
     * Clears the redo stack when a new state is saved.
     */
    function saveState() {
        if (undoStack.length >= MAX_HISTORY_STEPS) {
            undoStack.shift();
        }
        undoStack.push(whiteboardCanvas.toDataURL());
        redoStack.length = 0;
        updateUndoRedoButtons();
    }

    /**
     * Loads a canvas state from a data URL.
     * @param {string} dataURL - The data URL of the canvas image.
     */
    function loadState(dataURL) {
        const img = new Image();
        img.onload = () => {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000';
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.drawImage(img, 0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        };
        img.src = dataURL;
    }

    /**
     * Performs an undo operation.
     */
    function undo() {
        if (undoStack.length > 1) {
            const lastState = undoStack.pop();
            redoStack.push(lastState);
            loadState(undoStack[undoStack.length - 1]);
        } else if (undoStack.length === 1) {
            const lastState = undoStack.pop();
            redoStack.push(lastState);
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000';
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        updateUndoRedoButtons();
    }

    /**
     * Performs a redo operation.
     */
    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            undoStack.push(nextState);
            loadState(nextState);
        }
        updateUndoRedoButtons();
    }

    /**
     * Updates the enabled/disabled state of the undo and redo buttons.
     */
    function updateUndoRedoButtons() {
        if (undoButton) undoButton.disabled = undoStack.length <= 1;
        if (redoButton) redoButton.disabled = redoStack.length === 0;
    }

    /**
     * Fetches whiteboard history for all pages from the server.
     */
    async function fetchWhiteboardHistory() {
        if (!currentClassroom || !currentClassroom.id) {
            console.warn("Cannot fetch whiteboard history: No current classroom.");
            return;
        }
        try {
            const response = await fetch(`/api/whiteboard-history/${currentClassroom.id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log("No whiteboard history found for this classroom. Starting fresh.");
                    whiteboardPages = [[]];
                    currentPageIndex = 0;
                    renderCurrentWhiteboardPage();
                    updateWhiteboardPageDisplay();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            whiteboardPages = data.history || [[]];
            if (whiteboardPages.length === 0) {
                whiteboardPages = [[]];
            }
            currentPageIndex = 0; // Always reset to first page when loading history
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            showNotification("Whiteboard history loaded.");
        } catch (error) {
            console.error("Error fetching whiteboard history:", error);
            whiteboardPages = [[]];
            currentPageIndex = 0;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            showNotification("Failed to load whiteboard history.", true);
        }
    }

    /**
     * Renders the drawing commands for the current page onto the canvas.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Ensure background is black
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const currentPage = whiteboardPages[currentPageIndex];
        if (currentPage) {
            currentPage.forEach(command => {
                whiteboardCtx.save();
                // Apply properties based on the command data
                whiteboardCtx.strokeStyle = command.data.color;
                whiteboardCtx.lineWidth = command.data.width;
                whiteboardCtx.fillStyle = command.data.color;
                if (command.data.tool === 'eraser') {
                    whiteboardCtx.globalCompositeOperation = 'destination-out';
                } else {
                    whiteboardCtx.globalCompositeOperation = 'source-over';
                }
                // Pass the entire data object to drawWhiteboardItem
                drawWhiteboardItem(command.data);
                whiteboardCtx.restore();
            });
        }
        updateWhiteboardPageDisplay();
    }

    /**
     * Updates the whiteboard page display and navigation button states.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1}/${whiteboardPages.length}`;
        }
        if (prevWhiteboardPageBtn) {
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
        }
        if (nextWhiteboardPageBtn) {
            // Next button is disabled if at last page AND not admin (cannot create new pages)
            nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1 && currentUser.role !== 'admin';
        }
    }

    /**
     * Navigates to the next whiteboard page. Creates a new page if at the end (admin only).
     */
    function goToNextWhiteboardPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else if (currentUser.role === 'admin') {
            whiteboardPages.push([]); // Add a new empty page
            currentPageIndex = whiteboardPages.length - 1;
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: currentPageIndex,
                action: 'add_page'
            });
        } else {
            showNotification("No next page available.", true);
            return;
        }
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
        showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`);
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    function goToPreviousWhiteboardPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
            showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`);
        } else {
            showNotification("Already on the first page.", true);
        }
    }


    // --- Chat Functions ---

    /**
     * Sets up chat message sending controls.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                const message = chatInput.value.trim();
                if (message && socket && currentClassroom && currentClassroom.id) {
                    socket.emit('message', {
                        classroomId: currentClassroom.id,
                        message: message,
                        username: currentUser.username,
                        role: currentUser.role,
                        user_id: sessionStorage.getItem('user_id') // Ensure user_id is sent
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
    }

    // --- Library Functions ---

    /**
     * Loads and displays files in the classroom library.
     * Filters files based on the search input.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            if (libraryFilesList) libraryFilesList.innerHTML = '<p>Select a classroom to view library files.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/library-files/${currentClassroom.id}`);
            let files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            if (searchTerm) {
                files = files.filter(file =>
                    (file.original_filename && file.original_filename.toLowerCase().includes(searchTerm)) ||
                    (file.filename && file.filename.toLowerCase().includes(searchTerm))
                );
            }

            if (libraryFilesList) libraryFilesList.innerHTML = '';

            if (files.length === 0) {
                if (libraryFilesList) libraryFilesList.innerHTML = '<p>No files in this library yet or no files matching your search.</p>';
            } else {
                files.forEach(file => {
                    const fileDiv = document.createElement('div');
                    fileDiv.innerHTML = `
                        <span><a href="${file.url}" target="_blank">${file.original_filename || file.filename}</a></span>
                        ${currentUser && currentUser.role === 'admin' ? `<button class="delete-file-btn" data-file-id="${file.id}">Delete</button>` : ''}
                    `;
                    if (libraryFilesList) libraryFilesList.appendChild(fileDiv);
                });
                if (currentUser && currentUser.role === 'admin') {
                    document.querySelectorAll('.delete-file-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const fileId = e.target.dataset.fileId;
                            // Using a custom modal/notification instead of confirm()
                            showNotification("Are you sure you want to delete this file? (Click again to confirm)", false);
                            // Simple double-click confirmation for now, or implement a proper modal
                            e.target.dataset.confirmDelete = 'true';
                            setTimeout(() => {
                                delete e.target.dataset.confirmDelete; // Reset after a short delay
                            }, 3000); // 3 seconds to confirm
                            
                            if (e.detail === 2 && e.target.dataset.confirmDelete === 'true') { // Check for double click and confirmation flag
                                try {
                                    const response = await fetch(`/api/library-files/${fileId}`, {
                                        method: 'DELETE'
                                    });
                                    const result = await response.json();
                                    if (response.ok) {
                                        showNotification(result.message);
                                        loadLibraryFiles();
                                    } else {
                                        showNotification(`Error deleting file: ${result.error}`, true);
                                    }
                                } catch (error) {
                                    console.error('Error deleting file:', error);
                                    showNotification('Error deleting file.', true);
                                }
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            if (libraryFilesList) libraryFilesList.innerHTML = '<p>Failed to load library files.</p>';
        }
    }


    // --- Assessment Functions ---

    let questionCounter = 0; // To keep track of questions in the creation form

    /**
     * Adds a new question input field to the assessment creation form.
     */
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

    /**
 * Submits a new assessment created by an admin.
 */
async function submitAssessment() {
    // --- Security and Classroom Checks ---
    if (!currentUser || currentUser.role !== 'admin') {
        showNotification("Only administrators can create assessments.", true);
        return;
    }
    if (!currentClassroom || !currentClassroom.id) {
        showNotification("Please select a classroom first.", true);
        return;
    }

    // --- Retrieve Input Values ---
    const title = assessmentTitleInput.value.trim();
    const description = assessmentDescriptionTextarea.value.trim();
    const scheduledAtLocal = assessmentScheduledAtInput.value; // Get the local date/time string from the input
    const durationMinutes = parseInt(assessmentDurationMinutesInput.value, 10);

    const questions = []; // Initialize questions array

    // --- Input Validation (Frontend) ---
    if (!title) {
        displayMessage(assessmentCreationMessage, 'Please enter an assessment title.', true);
        return;
    }
    if (!scheduledAtLocal) { // Check for empty local date/time input
        displayMessage(assessmentCreationMessage, 'Please set a scheduled date and time.', true);
        return;
    }
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
        displayMessage(assessmentCreationMessage, 'Please enter a valid duration in minutes (a positive number).', true);
        return;
    }

    // --- DATE/TIME CONVERSION TO UTC (CRUCIAL FIX) ---
    let scheduledAtUTC = null; // Declare a variable to store the UTC ISO string

    if (scheduledAtLocal) {
        // Create a Date object from the local date/time string.
        // The Date constructor will interpret this string in the user's local timezone.
        const localDate = new Date(scheduledAtLocal);

        // Convert the local Date object to an ISO 8601 string representing UTC time.
        // .toISOString() always returns a UTC timestamp ending with 'Z'.
        scheduledAtUTC = localDate.toISOString();
    } else {
        // Fallback or error handling if for some reason scheduledAtLocal is empty here
        console.warn("scheduledAtLocal was empty during UTC conversion attempt.");
        displayMessage(assessmentCreationMessage, 'Error converting scheduled time. Please ensure the date/time is correctly entered.', true);
        return;
    }
    // --- END OF DATE/TIME CONVERSION ---


    // --- Collect Questions ---
    const questionItems = questionsContainer.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text').value.trim();
        const questionType = item.querySelector('.question-type').value;
        let options = [];
        let correctAnswer = '';

        if (questionType === 'mcq') {
            item.querySelectorAll('.mcq-option').forEach(input => {
                if (input.value.trim() !== '') {
                    options.push(input.value.trim());
                }
            });
            correctAnswer = item.querySelector('.mcq-correct-answer').value.trim();
        }

        if (questionText) {
            questions.push({
                id: `q${index + 1}-${Date.now()}`, // Simple unique ID for now
                question_text: questionText,
                question_type: questionType,
                options: options.length > 0 ? options : undefined,
                correct_answer: correctAnswer || undefined
            });
        }
    });

    if (questions.length === 0) {
        displayMessage(assessmentCreationMessage, 'Please add at least one question.', true);
        return;
    }

    // --- Submit Assessment to Backend ---
    try {
        const response = await fetch('/api/assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                classroomId: currentClassroom.id,
                title,
                description,
                scheduled_at: scheduledAtUTC, // <--- THIS IS THE CRITICAL UPDATED VALUE
                duration_minutes: durationMinutes,
                questions // Send the questions array
            })
        });

        const result = await response.json();

        // --- Handle Response ---
        if (response.ok) {
            displayMessage(assessmentCreationMessage, result.message, false);
            assessmentCreationForm.reset(); // Clear form inputs
            questionsContainer.innerHTML = ''; // Clear question fields
            questionCounter = 0; // Reset question counter
            addQuestionField(); // Add one empty question field back for new assessment
            loadAssessments(); // Reload the list of assessments to show the new one
            showNotification("Assessment created successfully!");
        } else {
            displayMessage(assessmentCreationMessage, result.error, true);
            showNotification(`Error creating assessment: ${result.error}`, true);
        }
    } catch (error) {
        console.error('Error submitting assessment:', error);
        displayMessage(assessmentCreationMessage, 'An error occurred during submission.', true);
        showNotification('An error occurred during assessment creation.', true);
    }
}


    /**
     * Loads and displays available assessments for the current classroom.
     * Filters assessments based on the search input.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            assessmentListDiv.innerHTML = '<p>Select a classroom to view assessments.</p>';
            return;
        }

        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
        assessmentListContainer.classList.remove('hidden');

        if (currentUser && currentUser.role === 'admin') {
            assessmentCreationForm.classList.remove('hidden');
            assessmentCreationForm.classList.add('admin-feature-highlight');
            if (questionsContainer.children.length === 0) {
                addQuestionField();
            }
        } else {
            assessmentCreationForm.classList.add('hidden');
            assessmentCreationForm.classList.remove('admin-feature-highlight');
        }

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            let assessments = await response.json();

            const searchTerm = assessmentSearchInput.value.toLowerCase();
            if (searchTerm) {
                assessments = assessments.filter(assessment =>
                    assessment.title.toLowerCase().includes(searchTerm) ||
                    (assessment.description && assessment.description.toLowerCase().includes(searchTerm))
                );
            }

            assessmentListDiv.innerHTML = '';

            if (assessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments available in this classroom or no assessments matching your search.</p>';
            } else {
                const now = new Date();
                assessments.forEach(assessment => {
                    // Defensive parsing for scheduled_at and duration_minutes
                    const scheduledTime = new Date(assessment.scheduled_at);
                    const durationMinutes = parseInt(assessment.duration_minutes, 10);
                    
                    let status = '';
                    let actionButton = '';

                    if (isNaN(scheduledTime.getTime()) || isNaN(durationMinutes) || durationMinutes <= 0) {
                        status = `<span style="color: orange;">(Invalid Schedule Data)</span>`;
                        actionButton = `<button class="take-assessment-btn btn-secondary" disabled>Invalid Schedule</button>`;
                        showNotification(`Assessment "${assessment.title}" has invalid scheduling data.`, true);
                    } else {
                        const endTime = new Date(scheduledTime.getTime() + durationMinutes * 60 * 1000);

                        if (now < scheduledTime) {
                            status = `<span style="color: blue;">(Upcoming: ${scheduledTime.toLocaleString()})</span>`;
                            actionButton = `<button class="take-assessment-btn btn-secondary" disabled>Upcoming</button>`;
                        } else if (now >= scheduledTime && now <= endTime) {
                            status = `<span style="color: green;">(Active - Ends: ${endTime.toLocaleTimeString()})</span>`;
                            actionButton = `<button class="take-assessment-btn btn-primary" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}" data-assessment-description="${assessment.description}">Take Assessment</button>`;
                        } else {
                            status = `<span style="color: red;">(Ended: ${endTime.toLocaleString()})</span>`;
                            actionButton = `<button class="take-assessment-btn btn-secondary" disabled>Ended</button>`;
                        }
                    }

                    const assessmentItem = document.createElement('div');
                    assessmentItem.classList.add('assessment-item');
                    assessmentItem.innerHTML = `
                        <div>
                            <h4>${assessment.title} ${status}</h4>
                            <p>${assessment.description || 'No description'}</p>
                            <p>Created by: ${getDisplayName(assessment.creator_username, assessment.creator_role || 'user')} on ${new Date(assessment.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            ${currentUser.role === 'admin' ?
                                `<button class="view-submissions-btn btn-info" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>
                                <button class="delete-assessment-btn btn-danger" data-assessment-id="${assessment.id}">Delete</button>` :
                                actionButton
                            }
                        </div>
                    `;
                    assessmentListDiv.appendChild(assessmentItem);
                });

                document.querySelectorAll('.take-assessment-btn').forEach(button => {
                    if (!button.disabled) { // Only add listener if not disabled
                        button.addEventListener('click', (e) => {
                            const assessmentId = e.target.dataset.assessmentId;
                            const assessmentTitle = e.target.dataset.assessmentTitle;
                            const assessmentDescription = e.target.dataset.assessmentDescription;
                            takeAssessment(assessmentId, assessmentTitle, assessmentDescription);
                        });
                    }
                });

                document.querySelectorAll('.view-submissions-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        const assessmentTitle = e.target.dataset.assessmentTitle;
                        viewSubmissions(assessmentId, assessmentTitle);
                    });
                });

                document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        // Using a custom modal/notification instead of confirm()
                        showNotification("Are you sure you want to delete this assessment? (Click again to confirm)", false);
                        e.target.dataset.confirmDelete = 'true';
                        setTimeout(() => {
                            delete e.target.dataset.confirmDelete;
                        }, 3000);

                        if (e.detail === 2 && e.target.dataset.confirmDelete === 'true') {
                            try {
                                const response = await fetch(`/api/assessments/${assessmentId}`, { method: 'DELETE' });
                                const result = await response.json();
                                if (response.ok) {
                                    showNotification(result.message);
                                    loadAssessments();
                                } else {
                                    showNotification(`Error deleting assessment: ${result.error}`, true);
                                }
                            } catch (error) {
                                console.error('Error deleting assessment:', error);
                                showNotification('An error occurred during deletion.', true);
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            assessmentListDiv.innerHTML = '<p>Failed to load assessments.</p>';
        }
        updateUIBasedOnRole();
    }

    /**
     * Displays an assessment for a user to take.
     * @param {string} assessmentId - The ID of the assessment.
     * @param {string} title - The title of the assessment.
     * @param {string} description - The description of the assessment.
     */
    async function takeAssessment(assessmentId, title, description) {
        // Clear any previous timer
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
        }
        if (assessmentTimerDisplay) {
            assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        }

        assessmentListContainer.classList.add('hidden');
        assessmentCreationForm.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden');
        takeAssessmentContainer.classList.add('user-view-subtle');
        viewSubmissionsContainer.classList.add('hidden');

        takeAssessmentTitle.textContent = title;
        takeAssessmentDescription.textContent = description;
        takeAssessmentForm.innerHTML = '';
        assessmentSubmissionMessage.textContent = '';
        submitAnswersBtn.disabled = true; // Disable until assessment is active or questions loaded

        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            const assessment = await response.json();
            currentAssessmentToTake = assessment; // Update with full object

            console.log("Fetched assessment details:", assessment); // Debugging: Check received assessment object

            const now = new Date();
            const scheduledTime = new Date(assessment.scheduled_at);
            const durationMinutes = parseInt(assessment.duration_minutes, 10);

            // Validate scheduledTime and durationMinutes
            if (isNaN(scheduledTime.getTime()) || isNaN(durationMinutes) || durationMinutes <= 0) {
                console.error("Invalid scheduled_at or duration_minutes:", assessment.scheduled_at, assessment.duration_minutes);
                takeAssessmentForm.innerHTML = '<p style="color:red;">Error: Assessment scheduling data is invalid. Please contact an administrator.</p>';
                assessmentTimerDisplay.textContent = 'Error: Invalid Time Data';
                assessmentTimerDisplay.classList.add('error');
                submitAnswersBtn.disabled = true;
                showNotification("Assessment time data is invalid. Please contact an administrator.", true);
                return; // Exit function if data is invalid
            }

            assessmentEndTime = new Date(scheduledTime.getTime() + durationMinutes * 60 * 1000);

            if (now < scheduledTime) {
                takeAssessmentForm.innerHTML = `<p>This assessment starts on: <strong>${scheduledTime.toLocaleString()}</strong></p>`;
                assessmentTimerDisplay.textContent = `Starts in: ${formatTime(scheduledTime.getTime() - now.getTime())}`;
                assessmentTimerDisplay.classList.add('upcoming');
                showNotification("This assessment has not started yet.", true);
                submitAnswersBtn.disabled = true;
                return;
            } else if (now > assessmentEndTime) {
                takeAssessmentForm.innerHTML = `<p>This assessment has already ended on: <strong>${assessmentEndTime.toLocaleString()}</strong></p>`;
                assessmentTimerDisplay.textContent = 'Assessment Ended';
                assessmentTimerDisplay.classList.add('ended');
                showNotification("This assessment has already ended.", true);
                submitAnswersBtn.disabled = true;
                return;
            }

            // If we reach here, the assessment is active
            submitAnswersBtn.disabled = false;
            startAssessmentTimer(assessmentEndTime); // Start the timer

            if (!assessment.questions || assessment.questions.length === 0) {
                takeAssessmentForm.innerHTML = '<p>No questions found for this assessment.</p>';
                submitAnswersBtn.disabled = true;
                return;
            }

            assessment.questions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('question-display');
                questionDiv.dataset.questionId = question.id;
                // Use question.question_text directly as backend now stores it consistently
                questionDiv.innerHTML = `<label>Question ${index + 1}: ${question.question_text}</label>`;

                // Use question.question_type directly
                if (question.question_type === 'text') {
                    const textarea = document.createElement('textarea');
                    textarea.name = `question_${question.id}`;
                    textarea.placeholder = 'Your answer here...';
                    textarea.rows = 3;
                    questionDiv.appendChild(textarea);
                } else if (question.question_type === 'mcq' && question.options) {
                    question.options.forEach((option, optIndex) => {
                        const optionId = `q${question.id}-opt${optIndex}`;
                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.name = `question_${question.id}`;
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
            takeAssessmentForm.innerHTML = '<p>Failed to load questions. An error occurred.</p>';
            submitAnswersBtn.disabled = true;
            showNotification('Failed to load assessment questions.', true);
        }
    }

    /**
     * Starts the countdown timer for an assessment.
     * @param {Date} endTime - The exact Date object when the assessment should end.
     */
    function startAssessmentTimer(endTime) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }

        assessmentEndTime = endTime; // Store the end time globally

        function updateTimer() {
            const now = new Date().getTime();
            const timeLeft = assessmentEndTime.getTime() - now;

            if (timeLeft <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = 'Time Left: 00:00:00 - Automatically Submitted!';
                assessmentTimerDisplay.classList.remove('warning', 'critical');
                assessmentTimerDisplay.classList.add('ended');
                showNotification("Time's up! Your assessment has been automatically submitted.", false);
                submitAnswers(true); // Automatically submit
                takeAssessmentForm.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
                submitAnswersBtn.disabled = true;
                return;
            }

            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const displayTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            assessmentTimerDisplay.textContent = `Time Left: ${displayTime}`;

            // Add visual cues for remaining time
            if (timeLeft < 60 * 1000) { // Less than 1 minute
                assessmentTimerDisplay.classList.add('critical');
                assessmentTimerDisplay.classList.remove('warning');
            } else if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes
                assessmentTimerDisplay.classList.add('warning');
                assessmentTimerDisplay.classList.remove('critical');
            } else {
                assessmentTimerDisplay.classList.remove('warning', 'critical');
            }
        }

        updateTimer(); // Initial call to display immediately
        assessmentTimerInterval = setInterval(updateTimer, 1000);
        assessmentTimerDisplay.classList.add('active');
    }

    /**
     * Helper to format milliseconds into HH:MM:SS string.
     * @param {number} ms - Milliseconds.
     * @returns {string} Formatted time string.
     */
    function formatTime(ms) {
        // Ensure ms is a valid number before calculations
        if (isNaN(ms) || ms < 0) {
            return '--:--:--'; // Return a default invalid time string
        }
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }


    /**
     * Submits the user's answers for an assessment.
     * @param {boolean} [isAutoSubmit=false] - True if this is an automatic submission due to timer.
     */
    async function submitAnswers(isAutoSubmit = false) {
        if (!currentAssessmentToTake || !currentClassroom || !currentClassroom.id) {
            showNotification('No assessment selected for submission.', true);
            return;
        }

        // Prevent double submission or submission after manual disable
        if (submitAnswersBtn.disabled && !isAutoSubmit) {
            showNotification('Assessment already submitted or ended.', true);
            return;
        }

        // Stop the timer if it's running
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
        }
        if (assessmentTimerDisplay) {
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        }

        const answers = [];
        const questionDivs = takeAssessmentForm.querySelectorAll('.question-display');

        questionDivs.forEach(qDiv => {
            const questionId = qDiv.dataset.questionId;
            let userAnswer = '';
            const questionData = currentAssessmentToTake.questions.find(q => q.id === questionId);

            const textarea = qDiv.querySelector('textarea');
            const radioInputs = qDiv.querySelectorAll('input[type="radio"]:checked');

            if (textarea) {
                userAnswer = textarea.value.trim();
            } else if (radioInputs.length > 0) {
                userAnswer = radioInputs[0].value;
            }
            
            answers.push({
                question_id: questionId,
                question_text: questionData.question_text, // Use consistent key
                question_type: questionData.question_type, // Use consistent key
                user_answer: userAnswer,
                correct_answer: questionData.correct_answer // Pass correct answer for server-side scoring
            });
        });

        try {
            const response = await fetch(`/api/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: currentAssessmentToTake.id,
                    classroomId: currentClassroom.id,
                    answers: answers,
                    is_auto_submit: isAutoSubmit // Indicate if it's an auto-submission
                })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(assessmentSubmissionMessage, `Assessment submitted! Your score: ${result.score}/${result.total_questions}`, false);
                submitAnswersBtn.disabled = true;
                takeAssessmentForm.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true); // Disable form after submission
                showNotification(`Assessment submitted! Score: ${result.score}/${result.total_questions}`);
                setTimeout(() => {
                    loadAssessments(); // Go back to assessment list
                }, 2000);
            } else {
                displayMessage(assessmentSubmissionMessage, result.error, true);
                showNotification(`Error submitting assessment: ${result.error}`, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            displayMessage(assessmentSubmissionMessage, 'An error occurred during submission.', true);
            showNotification('An error occurred during assessment submission.', true);
        }
    }

    /**
     * Views submissions for a specific assessment (admin only).
     * @param {string} assessmentId - The ID of the assessment.
     * @param {string} title - The title of the assessment.
     */
    async function viewSubmissions(assessmentId, title) {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can view submissions.", true);
            return;
        }
        submissionsAssessmentTitle.textContent = `Submissions for: ${title}`;
        submissionsList.innerHTML = 'Loading submissions...';
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden'); // Ensure take assessment is hidden
        viewSubmissionsContainer.classList.remove('hidden');
        viewSubmissionsContainer.classList.add('admin-feature-highlight');

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            const submissions = await response.json();

            submissionsList.innerHTML = '';
            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
                return;
            }

            submissions.forEach(submission => {
                const submissionItem = document.createElement('div');
                submissionItem.classList.add('submission-item');
                const studentDisplayName = getDisplayName(submission.username, submission.student_role || 'user');
                submissionItem.innerHTML = `
                    <h5>Submitted by: ${studentDisplayName} on ${new Date(submission.submitted_at).toLocaleString()}</h5>
                    <p>Score: ${submission.score}/${submission.total_questions}</p>
                    <button class="mark-submission-btn btn-info" data-submission-id="${submission.id}" data-assessment-id="${assessmentId}">Mark Submission</button>
                    <div id="marking-area-${submission.id}" class="marking-area hidden"></div>
                `;
                
                submission.answers.forEach(answer => {
                    const answerPair = document.createElement('div');
                    answerPair.classList.add('question-answer-pair');
                    answerPair.innerHTML = `
                        <p><strong>Q:</strong> ${answer.question_text}</p>
                        <p><strong>User Answer:</strong> ${answer.user_answer || 'N/A'}</p>
                    `;
                    if (answer.is_correct !== undefined && answer.is_correct !== null) {
                        answerPair.innerHTML += `<p><strong>Correct:</strong> <span style="color: ${answer.is_correct ? 'green' : 'red'};">${answer.is_correct ? 'Yes' : 'No'}</span> (Expected: ${answer.correct_answer || 'N/A'})</p>`;
                        answerPair.style.backgroundColor = answer.is_correct ? '#e6ffe6' : '#ffe6e6';
                    } else if (answer.correct_answer) {
                        answerPair.innerHTML += `<p><strong>Expected Answer:</strong> ${answer.correct_answer}</p>`;
                    }
                    if (answer.admin_feedback) {
                        answerPair.innerHTML += `<p><strong>Admin Feedback:</strong> ${answer.admin_feedback}</p>`;
                    }
                    submissionItem.appendChild(answerPair);
                });
                submissionsList.appendChild(submissionItem);
            });

            document.querySelectorAll('.mark-submission-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const submissionId = e.target.dataset.submissionId;
                    const assessmentId = e.target.dataset.assessmentId;
                    markSubmission(submissionId, assessmentId);
                });
            });

        } catch (error) {
            console.error('Error loading submissions:', error);
            submissionsList.innerHTML = '<p>Failed to load submissions.</p>';
            showNotification('Failed to load submissions.', true);
        }
    }

    /**
     * Displays a specific submission for admin to mark.
     * @param {string} submissionId - The ID of the submission to mark.
     * @param {string} assessmentId - The ID of the parent assessment.
     */
    async function markSubmission(submissionId, assessmentId) {
        const markingArea = document.getElementById(`marking-area-${submissionId}`);
        if (!markingArea) return;

        markingArea.classList.remove('hidden');
        markingArea.innerHTML = '<p>Loading submission for marking...</p>';

        try {
            const response = await fetch(`/api/submissions/${submissionId}`);
            const submission = await response.json();

            if (!response.ok) {
                throw new Error(submission.error || 'Failed to load submission for marking.');
            }

            let markingHtml = `
                <h5>Marking Submission from ${getDisplayName(submission.student_username, submission.student_role || 'user')}</h5>
                <form id="marking-form-${submission.id}">
            `;

            submission.answers.forEach((answer, index) => {
                markingHtml += `
                    <div class="marking-question-item">
                        <p><strong>Q${index + 1}:</strong> ${answer.question_text}</p>
                        <p><strong>User Answer:</strong> ${answer.user_answer || 'N/A'}</p>
                        ${answer.correct_answer ? `<p><strong>Expected:</strong> ${answer.correct_answer}</p>` : ''}
                        
                        <label>
                            <input type="checkbox" class="is-correct-checkbox" data-question-id="${answer.question_id}" ${answer.is_correct ? 'checked' : ''}> Mark as Correct
                        </label>
                        <textarea class="admin-feedback-comment" data-question-id="${answer.question_id}" placeholder="Add feedback comment (optional)">${answer.admin_feedback || ''}</textarea>
                    </div>
                `;
            });

            markingHtml += `
                    <button type="button" class="save-marks-btn btn-success" data-submission-id="${submission.id}" data-assessment-id="${assessmentId}">Save Marks</button>
                    <button type="button" class="cancel-marking-btn btn-secondary">Cancel</button>
                </form>
            `;
            markingArea.innerHTML = markingHtml;

            markingArea.querySelector('.save-marks-btn').addEventListener('click', () => saveMarkedSubmission(submissionId, assessmentId));
            markingArea.querySelector('.cancel-marking-btn').addEventListener('click', () => markingArea.classList.add('hidden'));

        } catch (error) {
            console.error('Error loading submission for marking:', error);
            markingArea.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            showNotification(`Error loading submission for marking: ${error.message}`, true);
        }
    }

    /**
     * Saves the marked submission data to the backend.
     * @param {string} submissionId - The ID of the submission being marked.
     * @param {string} assessmentId - The ID of the parent assessment.
     */
    async function saveMarkedSubmission(submissionId, assessmentId) {
        const markingArea = document.getElementById(`marking-area-${submissionId}`);
        const updatedAnswers = [];

        markingArea.querySelectorAll('.marking-question-item').forEach(qItem => {
            const questionId = qItem.querySelector('.is-correct-checkbox').dataset.questionId;
            const isCorrect = qItem.querySelector('.is-correct-checkbox').checked;
            const adminFeedback = qItem.querySelector('.admin-feedback-comment').value.trim();

            updatedAnswers.push({
                question_id: questionId,
                is_correct: isCorrect,
                admin_feedback: adminFeedback || undefined // Only include if not empty
            });
        });

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/mark-submission/${submissionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updated_answers: updatedAnswers
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                markingArea.classList.add('hidden');
                viewSubmissions(assessmentId, submissionsAssessmentTitle.textContent.replace('Submissions for: ', '')); // Refresh submissions list
            } else {
                showNotification(`Error saving marks: ${result.error}`, true);
            }
        } catch (error) {
            console.error('Error saving marked submission:', error);
            showNotification('An error occurred while saving marks.', true);
        }
    }

    /**
     * Displays feedback for a user's own submitted assessment.
     * This function is a placeholder and would need a dedicated UI section
     * for a user to view their past submissions.
     * @param {object} submission - The submission object with marking feedback.
     */
    function displaySubmissionFeedback(submission) {
        // This would typically be called when a user navigates to "My Submissions"
        // and clicks on a specific submission to view its feedback.
        // For now, it just logs to console and shows a notification.
        console.log("Displaying feedback for submission:", submission);
        showNotification(`Feedback for "${submission.assessment_title}" is available.`);

        // Example of how you might render it in a modal or dedicated section:
        // const feedbackModal = document.getElementById('feedback-modal'); // Assume you have this
        // feedbackModal.innerHTML = `
        //     <h3>Feedback for ${submission.assessment_title}</h3>
        //     <p>Your Score: ${submission.score}/${submission.total_questions}</p>
        //     ${submission.answers.map(answer => `
        //         <div class="feedback-question-item">
        //             <p><strong>Q:</strong> ${answer.question_text}</p>
        //             <p><strong>Your Answer:</strong> ${answer.user_answer}</p>
        //             <p><strong>Correct:</strong> <span style="color: ${answer.is_correct ? 'green' : 'red'};">${answer.is_correct ? 'Yes' : 'No'}</span></p>
        //             ${answer.admin_feedback ? `<p><strong>Admin Comment:</strong> ${answer.admin_feedback}</p>` : ''}
        //         </div>
        //     `).join('')}
        // `;
        // feedbackModal.classList.remove('hidden');
    }


    // --- Event Listeners ---

    // Auth Section
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginContainer.classList.add('hidden'); registerContainer.classList.remove('hidden'); authMessage.textContent = ''; });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerContainer.classList.add('hidden'); loginContainer.classList.remove('hidden'); authMessage.textContent = ''; });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            try {
                const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
                const result = await response.json();
                if (response.ok) {
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    sessionStorage.setItem('user_id', currentUser.id); // Store user_id in sessionStorage
                    displayMessage(authMessage, result.message, false);
                    checkLoginStatus();
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
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value;
            try {
                const response = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password, role }) });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(authMessage, result.message + " Please log in.", false);
                    registerForm.reset();
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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    localStorage.removeItem('currentUser');
                    sessionStorage.removeItem('user_id'); // Clear user_id from sessionStorage
                    currentUser = null;
                    cleanupClassroomResources(); // Clean up all classroom-related state
                    showSection(authSection);
                    showNotification("Logged out successfully.");
                } else {
                    showNotification('Failed to logout.', true);
                }
            } catch (error) {
                console.error('Error during logout:', error);
                showNotification('An error occurred during logout.', true);
            }
        });
    }

    // Dashboard Section
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
                const response = await fetch('/api/classrooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: classroomName }) });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(classroomMessage, result.message, false);
                    newClassroomNameInput.value = '';
                    loadAvailableClassrooms();
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred.', true);
            }
        });
    }

    // Classroom Search Input
    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadAvailableClassrooms);
    }

    // Navigation
    if (navDashboard) navDashboard.addEventListener('click', () => { showSection(dashboardSection); updateNavActiveState(navDashboard); loadAvailableClassrooms(); updateUIBasedOnRole(); cleanupClassroomResources(); });
    if (navClassroom) navClassroom.addEventListener('click', () => { if (currentClassroom && currentClassroom.id) { enterClassroom(currentClassroom.id, currentClassroom.name); } else { showNotification('Please create or join a classroom first!', true); } });
    if (navSettings) navSettings.addEventListener('click', () => { showSection(settingsSection); updateNavActiveState(navSettings); if (currentUser) { settingsUsernameInput.value = currentUser.username; settingsEmailInput.value = currentUser.email; } cleanupClassroomResources(); });
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => { showSection(dashboardSection); updateNavActiveState(navDashboard); loadAvailableClassrooms(); updateUIBasedOnRole(); cleanupClassroomResources(); });
    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => { showSection(dashboardSection); updateNavActiveState(navDashboard); loadAvailableClassrooms(); updateUIBasedOnRole(); });

    // Classroom Sub-section Navigation
    if (navChat) navChat.addEventListener('click', () => { showClassroomSubSection(chatSection); updateNavActiveState(navChat); setupChatControls(); });
    if (navWhiteboard) navWhiteboard.addEventListener('click', () => { showClassroomSubSection(whiteboardArea); updateNavActiveState(navWhiteboard); setupWhiteboardControls(); });
    if (navLibrary) navLibrary.addEventListener('click', () => { showClassroomSubSection(librarySection); updateNavActiveState(navLibrary); loadLibraryFiles(); });
    if (navAssessments) navAssessments.addEventListener('click', () => { showClassroomSubSection(assessmentsSection); updateNavActiveState(navAssessments); loadAssessments(); });

    // Settings Section
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = settingsUsernameInput.value;
            if (!username) { showNotification('Username cannot be empty.', true); return; }
            try {
                const response = await fetch('/api/update-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username }) });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    currentUser.username = username;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                } else {
                    showNotification('Error updating profile: ' + (result.error || 'Unknown error'), true);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('An error occurred during profile update.', true);
            }
        });
    }

    // Share Link
    if (shareLinkInput && copyShareLinkBtn) { // Ensure elements exist before adding listeners
        // The share button is now on the whiteboard section
        const shareWhiteboardBtn = document.getElementById('share-whiteboard-btn');
        if (shareWhiteboardBtn) {
            shareWhiteboardBtn.addEventListener('click', async () => {
                const classroomId = currentClassroom ? currentClassroom.id : null;
                if (classroomId) {
                    try {
                        const response = await fetch(`/api/generate-share-link/${classroomId}`);
                        const data = await response.json();
                        if (response.ok) {
                            shareLinkInput.value = data.share_link;
                            shareLinkDisplay.classList.remove('hidden');
                            shareLinkInput.select(); // Select the text for easy copying
                            showNotification("Share link generated. Click 'Copy Link' to copy.");
                        } else {
                            showNotification('Error generating share link: ' + (data.error || 'Unknown error'), true);
                        }
                    } catch (error) {
                        console.error('Error generating share link:', error);
                        showNotification('An error occurred while generating the share link.', true);
                    }
                } else {
                    showNotification('Please create or join a classroom first to get a shareable link.', true);
                }
            });
        }
        copyShareLinkBtn.addEventListener('click', () => { shareLinkInput.select(); document.execCommand('copy'); showNotification('Link copied to clipboard!'); });
    }

    // Broadcast Controls (already handled in setupWhiteboardControls, but ensure listeners are attached)
    if (startBroadcastBtn) startBroadcastBtn.addEventListener('click', startBroadcast);
    if (endBroadcastBtn) endBroadcastBtn.addEventListener('click', endBroadcast);
    broadcastTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // If broadcast is active and type changes, restart it
            if (localStream && localStream.active) {
                showNotification("Broadcast type changed. Restarting broadcast...");
                endBroadcast();
                setTimeout(() => startBroadcast(), 500); // Small delay for cleanup
            }
        });
    });

    // Library Search Input
    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }

    // Assessment Controls
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestionField);
    if (submitAssessmentBtn) submitAssessmentBtn.addEventListener('click', submitAssessment);
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', () => submitAnswers(false)); // Manual submission
    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => { currentAssessmentToTake = null; loadAssessments(); });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => { loadAssessments(); });

    // Assessment Search Input
    if (assessmentSearchInput) {
        assessmentSearchInput.addEventListener('input', loadAssessments);
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
