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
                socket.emit('webrtc_peer_disconnected', {
                    classroomId: currentClassroom.id,
                    peer_id: peerId
                });
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
                containerElement.classList.add('zoomed');
            } else {
                containerElement.classList.remove('zoomed');
            }
        }

        containerElement.addEventListener('click', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            // Simple click to toggle zoom
            if (state.isZoomed) {
                state.currentScale = 1;
                state.isZoomed = false;
                state.offsetX = 0;
                state.offsetY = 0;
                containerElement.style.transform = 'none';
            } else {
                state.currentScale = maxZoom;
                state.isZoomed = true;
                // Calculate offset to zoom in on the clicked point
                const rect = containerElement.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                const normalizedX = (clickX / rect.width) - 0.5;
                const normalizedY = (clickY / rect.height) - 0.5;
                state.offsetX = -normalizedX * rect.width * (state.currentScale - 1);
                state.offsetY = -normalizedY * rect.height * (state.currentScale - 1);
                containerElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX}px, ${state.offsetY}px)`;
            }

            videoZoomStates.set(videoElement.id, state);
        });

        containerElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            const direction = e.deltaY > 0 ? 1 : -1;
            const newScale = Math.max(minZoom, Math.min(maxZoom, state.currentScale + direction * zoomStep));

            if (newScale !== state.currentScale) {
                // Adjust pan to keep centered on mouse position
                const rect = containerElement.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const factor = (newScale - state.currentScale) / (state.currentScale - 1);
                const newOffsetX = state.offsetX - (mouseX - rect.width / 2 - state.offsetX) * factor;
                const newOffsetY = state.offsetY - (mouseY - rect.height / 2 - state.offsetY) * factor;

                state.currentScale = newScale;
                state.isZoomed = newScale > 1;

                if (state.isZoomed) {
                    state.offsetX = newOffsetX;
                    state.offsetY = newOffsetY;
                } else {
                    state.offsetX = 0;
                    state.offsetY = 0;
                }

                applyTransform(videoElement.id);
                videoZoomStates.set(videoElement.id, state);
            }
        });

        // Panning logic
        containerElement.addEventListener('mousedown', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (state && state.isZoomed) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                containerElement.style.cursor = 'grabbing';
            }
        });

        containerElement.addEventListener('mousemove', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (isDragging && state && state.isZoomed) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                state.offsetX += dx;
                state.offsetY += dy;

                startX = e.clientX;
                startY = e.clientY;

                applyTransform(videoElement.id);
                videoZoomStates.set(videoElement.id, state);
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
    }

    // --- Library Functions ---

    /**
     * Fetches and displays the list of files for the current classroom.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            console.error("No classroom selected to load files from.");
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/files`);
            const files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            const filteredFiles = files.filter(file => file.filename.toLowerCase().includes(searchTerm));

            if (libraryFilesList) {
                libraryFilesList.innerHTML = '';
                if (filteredFiles.length === 0) {
                    libraryFilesList.innerHTML = '<li>No files found.</li>';
                } else {
                    filteredFiles.forEach(file => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span><a href="/uploads/${file.filename}" target="_blank">${file.filename}</a></span>
                            <span class="file-size">(${file.size} KB)</span>
                            <span class="file-upload-date">${new Date(file.upload_date).toLocaleDateString()}</span>
                            <button class="delete-file-btn" data-filename="${file.filename}">Delete</button>
                        `;
                        libraryFilesList.appendChild(li);
                    });
                }
            }

            document.querySelectorAll('.delete-file-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const filename = e.target.dataset.filename;
                    if (confirm(`Are you sure you want to delete ${filename}?`)) {
                        try {
                            const response = await fetch('/api/delete-file', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ filename, classroomId: currentClassroom.id })
                            });
                            const result = await response.json();
                            if (response.ok) {
                                showNotification(result.message);
                                loadLibraryFiles(); // Reload the list
                            } else {
                                showNotification(result.error, true);
                            }
                        } catch (error) {
                            console.error('Error deleting file:', error);
                            showNotification('An error occurred while deleting the file.', true);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error fetching library files:', error);
        }
    }

    // --- Assessment Functions ---

    /**
     * Loads and displays assessments for the current classroom, filtering by search term.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`);
            const assessments = await response.json();
            const searchTerm = assessmentSearchInput.value.toLowerCase();
            const filteredAssessments = assessments.filter(a => a.title.toLowerCase().includes(searchTerm));

            assessmentListDiv.innerHTML = '';
            if (filteredAssessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments found.</p>';
                return;
            }

            filteredAssessments.forEach(assessment => {
                const assessmentItem = document.createElement('div');
                assessmentItem.className = 'assessment-item';
                assessmentItem.innerHTML = `
                    <h3>${assessment.title}</h3>
                    <p>${assessment.description}</p>
                    <p><strong>Status:</strong> ${assessment.is_active ? 'Active' : 'Not Started'}</p>
                    <div class="assessment-actions">
                        ${currentUser.role === 'admin' ?
                        `<button class="start-assessment-btn" data-id="${assessment.id}" ${assessment.is_active ? 'disabled' : ''}>Start</button>
                         <button class="view-submissions-btn" data-id="${assessment.id}">View Submissions</button>
                         <button class="delete-assessment-btn" data-id="${assessment.id}">Delete</button>`
                        : `<button class="take-assessment-btn" data-id="${assessment.id}" ${!assessment.is_active ? 'disabled' : ''}>Take Assessment</button>`}
                    </div>
                `;
                assessmentListDiv.appendChild(assessmentItem);
            });

            // Add event listeners for new buttons
            document.querySelectorAll('.start-assessment-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const assessmentId = btn.dataset.id;
                    const response = await fetch('/api/start-assessment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ classroomId: currentClassroom.id, assessmentId })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        showNotification(result.message);
                        loadAssessments(); // Reload the list
                    } else {
                        showNotification(result.error, true);
                    }
                });
            });

            document.querySelectorAll('.view-submissions-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    viewSubmissions(btn.dataset.id);
                });
            });

            document.querySelectorAll('.delete-assessment-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const assessmentId = btn.dataset.id;
                    if (confirm('Are you sure you want to delete this assessment?')) {
                        const response = await fetch('/api/delete-assessment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ classroomId: currentClassroom.id, assessmentId })
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showNotification(result.message);
                            loadAssessments(); // Reload the list
                        } else {
                            showNotification(result.error, true);
                        }
                    }
                });
            });

            document.querySelectorAll('.take-assessment-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await fetchAssessmentToTake(btn.dataset.id);
                });
            });
        } catch (error) {
            console.error('Error fetching assessments:', error);
            assessmentListDiv.innerHTML = '<p>Failed to load assessments.</p>';
        }
    }

    // --- Whiteboard Functions ---

    function setupWhiteboardControls() {
        if (!whiteboardCanvas) return;

        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeCanvas();

        // Whiteboard drawing loop
        // This is primarily for visual feedback (e.g., drawing the current line)
        // and doesn't affect the final saved drawing on the server
        let animationFrameId = null;
        const drawingLoop = () => {
            if (isDrawing && (currentTool === 'pen' || currentTool === 'eraser')) {
                // This is where you would draw the live preview of the current stroke.
                // However, since we're now just pushing points, a simpler approach is to
                // draw a line segment from the last point to the current one.
                if (currentStrokePoints.length > 1) {
                    const p1 = currentStrokePoints[currentStrokePoints.length - 2];
                    const p2 = currentStrokePoints[currentStrokePoints.length - 1];
                    whiteboardCtx.strokeStyle = currentTool === 'eraser' ? '#000000' : currentColor;
                    whiteboardCtx.lineWidth = currentBrushSize;
                    whiteboardCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
                    whiteboardCtx.beginPath();
                    whiteboardCtx.moveTo(p1.x, p1.y);
                    whiteboardCtx.lineTo(p2.x, p2.y);
                    whiteboardCtx.stroke();
                }
            }
            animationFrameId = requestAnimationFrame(drawingLoop);
        };
        drawingLoop();

        // Event listeners
        const getMousePos = (e) => {
            const rect = whiteboardCanvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const throttledAddPoint = throttle((point) => {
            if (isDrawing && (currentTool === 'pen' || currentTool === 'eraser')) {
                currentStrokePoints.push(point);
            }
        }, 15); // Adjust this value to change drawing smoothness vs. network traffic

        whiteboardCanvas.addEventListener('mousedown', (e) => {
            if (currentUser && currentUser.role !== 'admin') return;
            isDrawing = true;
            const pos = getMousePos(e);
            startX = pos.x;
            startY = pos.y;
            lastX = pos.x;
            lastY = pos.y;
            currentStrokePoints = [{ x: startX, y: startY }];

            if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'text') {
                snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
            e.preventDefault();
        });

        whiteboardCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing || (currentUser && currentUser.role !== 'admin')) return;
            const pos = getMousePos(e);

            if (currentTool === 'pen' || currentTool === 'eraser') {
                throttledAddPoint(pos);
            } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
                whiteboardCtx.putImageData(snapshot, 0, 0);
                whiteboardCtx.strokeStyle = currentColor;
                whiteboardCtx.fillStyle = currentColor;
                whiteboardCtx.lineWidth = currentBrushSize;
                whiteboardCtx.globalCompositeOperation = 'source-over';
                drawShape(currentTool, startX, startY, pos.x, pos.y);
            }
        });

        whiteboardCanvas.addEventListener('mouseup', (e) => {
            if (!isDrawing || (currentUser && currentUser.role !== 'admin')) return;
            isDrawing = false;
            const endPos = getMousePos(e);

            const drawingItem = {
                tool: currentTool,
                color: currentColor,
                width: currentBrushSize,
                points: currentStrokePoints,
                x1: startX,
                y1: startY,
                x2: endPos.x,
                y2: endPos.y,
            };

            // Reset for the next stroke
            currentStrokePoints = [];
            
            // Only emit to the server on mouseup for pen and eraser
            // Shapes and text are handled differently
            if (currentTool === 'pen' || currentTool === 'eraser') {
                socket.emit('whiteboard_data', {
                    classroomId: currentClassroom.id,
                    action: 'draw',
                    pageIndex: currentPageIndex,
                    data: {
                        tool: drawingItem.tool,
                        color: drawingItem.color,
                        width: drawingItem.width,
                        points: currentStrokePoints // Points array should be included for drawing a line
                    }
                });
                // Add to local history for undo
                undoStack.push(drawingItem);
                redoStack.length = 0; // Clear redo stack on new action
            } else if (currentTool === 'line') {
                socket.emit('whiteboard_data', {
                    classroomId: currentClassroom.id,
                    action: 'draw',
                    pageIndex: currentPageIndex,
                    data: { tool: 'line', color: currentColor, width: currentBrushSize, x1: startX, y1: startY, x2: endPos.x, y2: endPos.y }
                });
            } else if (currentTool === 'rectangle') {
                socket.emit('whiteboard_data', {
                    classroomId: currentClassroom.id,
                    action: 'draw',
                    pageIndex: currentPageIndex,
                    data: { tool: 'rectangle', color: currentColor, width: currentBrushSize, x1: startX, y1: startY, x2: endPos.x, y2: endPos.y }
                });
            } else if (currentTool === 'circle') {
                socket.emit('whiteboard_data', {
                    classroomId: currentClassroom.id,
                    action: 'draw',
                    pageIndex: currentPageIndex,
                    data: { tool: 'circle', color: currentColor, width: currentBrushSize, x1: startX, y1: startY, x2: endPos.x, y2: endPos.y }
                });
            }
            updateUndoRedoButtons();
            e.preventDefault();
        });

        // Other event listeners
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;
                if (currentTool === 'text') {
                    const text = prompt("Enter text:");
                    if (text) {
                        const pos = getMousePos(e);
                        // TODO: Implement text drawing logic here
                    }
                }
            });
        });

        colorPicker.addEventListener('input', (e) => {
            currentColor = e.target.value;
        });

        brushSizeSlider.addEventListener('input', (e) => {
            currentBrushSize = parseInt(e.target.value);
        });

        if (undoButton) {
            undoButton.addEventListener('click', undo);
        }

        if (redoButton) {
            redoButton.addEventListener('click', redo);
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the whiteboard?')) {
                    socket.emit('whiteboard_data', {
                        classroomId: currentClassroom.id,
                        action: 'clear',
                        pageIndex: currentPageIndex,
                        data: {}
                    });
                }
            });
        }
    }


    /**
     * Draws a single drawing item on the canvas.
     * @param {object} drawingItem - The drawing command object.
     */
    function drawWhiteboardItem(drawingItem) {
        whiteboardCtx.save(); // Save the current state
        whiteboardCtx.strokeStyle = drawingItem.color;
        whiteboardCtx.fillStyle = drawingItem.color;
        whiteboardCtx.lineWidth = drawingItem.width;

        if (drawingItem.tool === 'pen' || drawingItem.tool === 'eraser') {
            whiteboardCtx.globalCompositeOperation = drawingItem.tool === 'eraser' ? 'destination-out' : 'source-over';
            whiteboardCtx.lineCap = 'round';
            whiteboardCtx.lineJoin = 'round';
            if (drawingItem.points && drawingItem.points.length > 1) {
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(drawingItem.points[0].x, drawingItem.points[0].y);
                for (let i = 1; i < drawingItem.points.length; i++) {
                    whiteboardCtx.lineTo(drawingItem.points[i].x, drawingItem.points[i].y);
                }
                whiteboardCtx.stroke();
            }
        } else if (drawingItem.tool === 'line') {
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(drawingItem.x1, drawingItem.y1);
            whiteboardCtx.lineTo(drawingItem.x2, drawingItem.y2);
            whiteboardCtx.stroke();
        } else if (drawingItem.tool === 'rectangle') {
            const width = drawingItem.x2 - drawingItem.x1;
            const height = drawingItem.y2 - drawingItem.y1;
            whiteboardCtx.beginPath();
            whiteboardCtx.strokeRect(drawingItem.x1, drawingItem.y1, width, height);
        } else if (drawingItem.tool === 'circle') {
            const dx = drawingItem.x2 - drawingItem.x1;
            const dy = drawingItem.y2 - drawingItem.y1;
            const radius = Math.sqrt(dx * dx + dy * dy);
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(drawingItem.x1, drawingItem.y1, radius, 0, 2 * Math.PI);
            whiteboardCtx.stroke();
        } else if (drawingItem.tool === 'text') {
            whiteboardCtx.font = `${drawingItem.width}px sans-serif`;
            whiteboardCtx.fillText(drawingItem.text, drawingItem.x, drawingItem.y);
        }
        whiteboardCtx.restore(); // Restore to the previous state
    }

    /**
     * Clears the canvas and re-draws all commands for the current page.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx || !whiteboardCanvas) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const drawingsOnPage = whiteboardPages[currentPageIndex] || [];
        drawingsOnPage.forEach(drawWhiteboardItem);
    }

    /**
     * Fetches the whiteboard history for the current classroom.
     */
    async function fetchWhiteboardHistory() {
        if (!currentClassroom || !currentClassroom.id) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/whiteboard-history`);
            if (response.ok) {
                const history = await response.json();
                whiteboardPages = history.length > 0 ? history : [
                    []
                ];
                currentPageIndex = 0; // Reset to the first page on load
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
            } else {
                console.error("Failed to fetch whiteboard history.");
            }
        } catch (error) {
            console.error("Error fetching whiteboard history:", error);
        }
    }

    // --- Page Navigation Functions ---

    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
        }
        if (prevWhiteboardPageBtn) {
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
        }
        if (nextWhiteboardPageBtn) {
            nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1;
        }
    }

    if (prevWhiteboardPageBtn) {
        prevWhiteboardPageBtn.addEventListener('click', () => {
            if (currentPageIndex > 0) {
                currentPageIndex--;
                socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
            }
        });
    }

    if (nextWhiteboardPageBtn) {
        nextWhiteboardPageBtn.addEventListener('click', () => {
            if (currentPageIndex < whiteboardPages.length - 1) {
                currentPageIndex++;
                socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
            } else {
                // Create a new page if we are at the last one
                whiteboardPages.push([]);
                currentPageIndex++;
                socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
            }
        });
    }

    // --- Utility Functions ---

    /**
     * Throttling utility function.
     * @param {Function} func - The function to throttle.
     * @param {number} limit - The time in milliseconds to wait before allowing the function to be called again.
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // --- Chat Functions ---

    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendChatMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    sendChatMessage();
                }
            });
        }
    }

    function sendChatMessage() {
        if (!socket || !currentClassroom || !currentClassroom.id || !chatInput) return;
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('message', {
                classroomId: currentClassroom.id,
                message: message
            });
            chatInput.value = '';
        }
    }

    // --- Event Listeners and Initial State ---

    // The main entry point
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();
            if (response.ok) {
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                sessionStorage.setItem('user_id', result.user.id); // Store user_id in sessionStorage
                currentUser = result.user;
                showNotification(result.message);
                checkLoginStatus();
            } else {
                displayMessage(authMessage, result.error, true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            const role = registerForm.role.value;
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });
            const result = await response.json();
            displayMessage(authMessage, result.message || result.error, !response.ok);
            if (response.ok) {
                // Switch back to login after successful registration
                loginContainer.classList.remove('hidden');
                registerContainer.classList.add('hidden');
            }
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
            authMessage.textContent = '';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            authMessage.textContent = '';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentClassroom');
            sessionStorage.removeItem('user_id');
            currentUser = null;
            cleanupClassroomResources();
            showNotification("Logged out successfully.");
            checkLoginStatus();
        });
    }

    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            const name = newClassroomNameInput.value.trim();
            if (!name) {
                displayMessage(classroomMessage, 'Please enter a classroom name.', true);
                return;
            }
            try {
                const response = await fetch('/api/create-classroom', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(classroomMessage, `Classroom "${result.name}" created with ID: ${result.id}`, false);
                    newClassroomNameInput.value = '';
                    loadAvailableClassrooms();
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred. Please try again.', true);
            }
        });
    }

    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            cleanupClassroomResources();
            showSection(dashboardSection);
            loadAvailableClassrooms(); // Refresh the list
            updateNavActiveState(navDashboard);
        });
    }

    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            if (currentClassroom) {
                cleanupClassroomResources();
            }
            showSection(dashboardSection);
            loadAvailableClassrooms();
            updateNavActiveState(navDashboard);
        });
    }

    if (navSettings) {
        navSettings.addEventListener('click', () => {
            showSection(settingsSection);
            updateNavActiveState(navSettings);
            if (currentUser) {
                settingsUsernameInput.value = currentUser.username;
                settingsEmailInput.value = currentUser.email || '';
            }
        });
    }

    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
        });
    }

    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = settingsUsernameInput.value.trim();
            const newEmail = settingsEmailInput.value.trim();
            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newUsername, email: newEmail })
                });
                const result = await response.json();
                if (response.ok) {
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    showNotification("Profile updated successfully!");
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification("An error occurred while updating profile.", true);
            }
        });
    }

    // Share Link Functionality
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            const link = shareLinkInput.value;
            if (link) {
                navigator.clipboard.writeText(link).then(() => {
                    showNotification("Classroom link copied to clipboard!");
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    showNotification("Failed to copy link.", true);
                });
            }
        });
    }

    // Video Broadcast Event Listeners
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }
    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }

    // Library Event Listeners
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (!currentClassroom || !currentClassroom.id) {
                showNotification("Please enter a classroom first.", true);
                return;
            }
            const file = libraryFileInput.files[0];
            if (!file) {
                showNotification("Please select a file to upload.", true);
                return;
            }
            const formData = new FormData();
            formData.append('file', file);
            formData.append('classroomId', currentClassroom.id);
            try {
                const response = await fetch('/api/upload-file', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    libraryFileInput.value = '';
                    loadLibraryFiles(); // Refresh the list
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }

    // Whiteboard Sub-section navigation
    if (navWhiteboard) {
        navWhiteboard.addEventListener('click', () => {
            showClassroomSubSection(whiteboardArea);
            updateNavActiveState(navWhiteboard);
        });
    }
    // Chat Sub-section navigation
    if (navChat) {
        navChat.addEventListener('click', () => {
            showClassroomSubSection(chatSection);
            updateNavActiveState(navChat);
            // Request chat history when switching to the chat tab
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('request_chat_history', { classroomId: currentClassroom.id });
            }
        });
    }
    // Library Sub-section navigation
    if (navLibrary) {
        navLibrary.addEventListener('click', () => {
            showClassroomSubSection(librarySection);
            updateNavActiveState(navLibrary);
            loadLibraryFiles();
        });
    }
    // Assessments Sub-section navigation
    if (navAssessments) {
        navAssessments.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            updateNavActiveState(navAssessments);
            loadAssessments(); // Load initial assessment list
        });
    }

    // New assessment form handling
    if (assessmentCreationForm) {
        assessmentCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const questions = [];
            document.querySelectorAll('.question-block').forEach(qBlock => {
                const type = qBlock.querySelector('select[name="question-type"]').value;
                const text = qBlock.querySelector('textarea[name="question-text"]').value;
                const options = [];
                qBlock.querySelectorAll('.option-input').forEach(opt => {
                    options.push(opt.value);
                });
                const correctAnswer = qBlock.querySelector('input[name="correct-answer"]').value;
                questions.push({ type, text, options, correctAnswer });
            });

            const newAssessment = {
                classroomId: currentClassroom.id,
                title: assessmentTitleInput.value,
                description: assessmentDescriptionTextarea.value,
                scheduled_at: assessmentScheduledAtInput.value,
                duration_minutes: assessmentDurationMinutesInput.value,
                questions: questions
            };

            try {
                const response = await fetch('/api/create-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newAssessment)
                });
                const result = await response.json();
                displayMessage(assessmentCreationMessage, result.message || result.error, !response.ok);
                if (response.ok) {
                    assessmentCreationForm.reset();
                    questionsContainer.innerHTML = '';
                    loadAssessments(); // Refresh the list
                }
            } catch (error) {
                console.error('Error creating assessment:', error);
                displayMessage(assessmentCreationMessage, 'An error occurred.', true);
            }
        });
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            questionBlock.innerHTML = `
                <h4>New Question</h4>
                <label>Question Type:</label>
                <select name="question-type">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="short-answer">Short Answer</option>
                </select>
                <label>Question Text:</label>
                <textarea name="question-text" required></textarea>
                <div class="options-container">
                    <label>Options (for Multiple Choice):</label>
                    <input type="text" class="option-input" placeholder="Option A">
                    <input type="text" class="option-input" placeholder="Option B">
                    <button type="button" class="add-option-btn">Add Option</button>
                </div>
                <label>Correct Answer:</label>
                <input type="text" name="correct-answer" required>
                <button type="button" class="remove-question-btn">Remove</button>
            `;
            questionsContainer.appendChild(questionBlock);

            questionBlock.querySelector('.add-option-btn').addEventListener('click', (e) => {
                const optionsContainer = e.target.closest('.options-container');
                const newOptionInput = document.createElement('input');
                newOptionInput.type = 'text';
                newOptionInput.className = 'option-input';
                newOptionInput.placeholder = `Option ${String.fromCharCode(65 + optionsContainer.querySelectorAll('.option-input').length)}`;
                optionsContainer.insertBefore(newOptionInput, e.target);
            });

            questionBlock.querySelector('.remove-question-btn').addEventListener('click', (e) => {
                e.target.closest('.question-block').remove();
            });
        });
    }

    // Function to fetch a specific assessment to take
    async function fetchAssessmentToTake(assessmentId) {
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            if (response.ok) {
                const assessment = await response.json();
                currentAssessmentToTake = assessment;
                displayAssessmentForTaking(assessment);
            } else {
                showNotification("Could not load assessment details.", true);
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
            showNotification("Error loading assessment.", true);
        }
    }

    // Function to display the assessment form
    function displayAssessmentForTaking(assessment) {
        takeAssessmentTitle.textContent = assessment.title;
        takeAssessmentDescription.textContent = assessment.description;
        takeAssessmentForm.innerHTML = '';
        assessment.questions.forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.className = 'take-assessment-question';
            qDiv.innerHTML = `
                <p><strong>${index + 1}. ${q.text}</strong></p>
                <div class="answers-container" data-question-type="${q.type}">
                    ${q.type === 'multiple-choice' ?
                    q.options.map((opt, i) =>
                        `<label><input type="radio" name="question-${index}" value="${opt}" required>${opt}</label>`
                    ).join('') :
                    `<textarea name="question-${index}" rows="3" required></textarea>`
                }
                </div>
            `;
            takeAssessmentForm.appendChild(qDiv);
        });
        showClassroomSubSection(takeAssessmentContainer);
        // If the assessment is already active, start the timer
        if (assessment.is_active) {
            startAssessmentTimer(new Date(assessment.end_time));
        } else {
            assessmentTimerDisplay.textContent = 'Awaiting start by administrator...';
            assessmentTimerDisplay.classList.remove('active');
        }
    }

    // Function to start the countdown timer
    function startAssessmentTimer(endTime) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }
        assessmentEndTime = endTime.getTime();
        assessmentTimerDisplay.classList.add('active');

        function updateTimer() {
            const now = new Date().getTime();
            const distance = assessmentEndTime - now;

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            assessmentTimerDisplay.textContent = `Time Left: ${hours}h ${minutes}m ${seconds}s`;

            if (distance < 300000) { // 5 minutes warning
                assessmentTimerDisplay.classList.remove('warning');
                assessmentTimerDisplay.classList.add('critical');
            } else if (distance < 600000) { // 10 minutes warning
                assessmentTimerDisplay.classList.add('warning');
            } else {
                assessmentTimerDisplay.classList.remove('warning', 'critical');
            }

            if (distance < 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = "Time's up!";
                assessmentTimerDisplay.classList.add('critical');
                submitAnswers(); // Automatically submit answers
            }
        }
        assessmentTimerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call to display immediately
    }

    // Function to handle submission of answers
    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', submitAnswers);
    }

    async function submitAnswers() {
        if (!currentAssessmentToTake) return;
        const answers = [];
        currentAssessmentToTake.questions.forEach((q, index) => {
            const questionElement = takeAssessmentForm.querySelector(`.take-assessment-question:nth-child(${index + 1})`);
            let answer;
            if (q.type === 'multiple-choice') {
                const selected = questionElement.querySelector(`input[name="question-${index}"]:checked`);
                answer = selected ? selected.value : null;
            } else {
                answer = questionElement.querySelector(`textarea[name="question-${index}"]`).value;
            }
            answers.push({ question_text: q.text, answer });
        });

        try {
            const response = await fetch('/api/submit-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classroomId: currentClassroom.id,
                    assessmentId: currentAssessmentToTake.id,
                    answers: answers
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                clearInterval(assessmentTimerInterval);
                assessmentTimerInterval = null;
                showClassroomSubSection(assessmentsSection); // Go back to the list
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error submitting answers:', error);
            showNotification('An error occurred during submission.', true);
        }
    }

    // Function to view submissions as an admin
    async function viewSubmissions(assessmentId) {
        if (currentUser.role !== 'admin') {
            showNotification("You do not have permission to view submissions.", true);
            return;
        }

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            if (response.ok) {
                const submissions = await response.json();
                submissionsAssessmentTitle.textContent = `Submissions for: ${submissions.assessment_title}`;
                submissionsList.innerHTML = '';
                submissions.submissions.forEach(sub => {
                    const li = document.createElement('li');
                    li.className = 'submission-item';
                    li.innerHTML = `
                        <h4>Submitted by: ${sub.username}</h4>
                        <p>Score: ${sub.score !== undefined ? `${sub.score}/${sub.total_questions}` : 'Not Marked'}</p>
                        <button class="view-submission-details-btn" data-submission-id="${sub.id}">View Details</button>
                    `;
                    submissionsList.appendChild(li);
                });
                showClassroomSubSection(viewSubmissionsContainer);
            } else {
                showNotification("Could not load submissions.", true);
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showNotification("Error loading submissions.", true);
        }
    }

    // Event listener for viewing submission details
    if (submissionsList) {
        submissionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-submission-details-btn')) {
                const submissionId = e.target.dataset.submissionId;
                // TODO: Implement a function to fetch and display a single submission's details for marking
                // showSubmissionDetails(submissionId);
                showNotification("Viewing submission details is not yet implemented.", false);
            }
        });
    }

    // Back button from submissions view
    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            loadAssessments();
        });
    }

    // Back button from taking assessment
    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            if (assessmentTimerInterval) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerInterval = null;
            }
            showClassroomSubSection(assessmentsSection);
        });
    }


    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadAvailableClassrooms);
    }
    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }
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
