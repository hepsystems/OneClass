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

    // Whiteboard Elements (now integrated)
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

    // Video Zoom States
    const videoZoomStates = new Map(); // Map: videoElement.id -> { currentScale: 1, isZoomed: false, offsetX: 0, offsetY: 0 }

    // Whiteboard Global Variables (moved from whiteboard.js)
    let currentTool = 'pen';
    let isDrawing = false;
    let startX, startY, lastX, lastY;
    let currentStrokePoints = [];
    let snapshot = null;
    let whiteboardCtx; // Declared here, assigned in setupWhiteboardControls
    // whiteboardCanvas is already a const above
    // currentUser, currentClassroom are already global `let`
    let whiteboardPages = [
        []
    ]; // Initialize with one empty page
    let currentPageIndex = 0;
    let currentColor = '#FFFFFF'; // Default color
    let currentBrushSize = 5; // Default brush size
    const MAX_HISTORY_STEPS = 10;
    let undoStack = [];
    let redoStack = [];


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
        setupWhiteboardControls(); // Call the integrated setup
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
        whiteboardPages = [
            []
        ]; // Reset whiteboard pages
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
                socket.emit('join', {
                    'classroomId': currentClassroom.id,
                    'role': currentUser.role
                });
                showNotification("Connected to classroom: " + currentClassroom.name);
                // After successful connection and join, fetch whiteboard history
                setTimeout(() => {
                    if (socket.connected) {
                        fetchWhiteboardHistory();
                    }
                }, 100); // Short delay to ensure room join is processed
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
            console.log('Received chat message:', data);
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message-item'); // Base class for all messages

            // Use the data.user_id from the server for consistent message origin
            if (data.user_id === currentUser.id) {
                messageElement.classList.add('chat-message-current-user');
            } else {
                messageElement.classList.add('chat-message-other-user');
            }

            // Check for user role and apply special styling
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
            console.log('Received chat history:', history);
            chatMessages.innerHTML = '';
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('chat-message-item'); // Base class for all messages

                if (msg.user_id === currentUser.id) {
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
                showNotification('Whiteboard rendering error. Please try reloading.', true);
                return;
            }

            // Enhanced check for data validation
            if (!data.action || !data.pageIndex) {
                console.error('[Whiteboard] Received malformed whiteboard data:', data);
                return;
            }

            const {
                action,
                pageIndex
            } = data;

            if (action === 'draw') {
                const drawingItem = data.data;
                // Add better validation for drawing item
                if (!drawingItem || !drawingItem.type) {
                    console.error('[Whiteboard] Received invalid drawing item:', drawingItem);
                    return;
                }

                if (!whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                whiteboardPages[pageIndex].push(drawingItem);

                if (pageIndex === currentPageIndex) {
                    drawWhiteboardItem(drawingItem);
                }
            } else if (action === 'clear') {
                if (whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                    showNotification(`Whiteboard page ${pageIndex + 1} cleared by admin.`);
                }
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000';
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
            } else if (action === 'history' && data.history) {
                // This is a comprehensive update, e.g., on initial load
                whiteboardPages = data.history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [
                        []
                    ];
                }
                currentPageIndex = 0;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                showNotification('Whiteboard history loaded.');
            }
        });

        socket.on('whiteboard_page_change', (data) => {
            const {
                newPageIndex
            } = data;
            // Validate the page index
            if (newPageIndex >= 0 && newPageIndex < whiteboardPages.length) {
                currentPageIndex = newPageIndex;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                showNotification(`Whiteboard page changed to ${newPageIndex + 1}`);
            } else if (newPageIndex >= whiteboardPages.length) {
                // If a new page is created
                const newPagesCount = newPageIndex - whiteboardPages.length + 1;
                for (let i = 0; i < newPagesCount; i++) {
                    whiteboardPages.push([]);
                }
                currentPageIndex = newPageIndex;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                showNotification(`New whiteboard page created: ${newPageIndex + 1}`);
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
            videoElement.style.cursor = state.isZoomed ? 'grab' : 'zoom-in';
            containerElement.classList.toggle('zoomed', state.isZoomed);
        }

        // Mouse Down for dragging
        containerElement.addEventListener('mousedown', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            if (!state || !state.isZoomed) return;
            isDragging = true;
            startX = e.clientX - state.offsetX;
            startY = e.clientY - state.offsetY;
            videoElement.style.cursor = 'grabbing';
            containerElement.classList.add('dragging');
            e.preventDefault();
        });

        // Mouse Move for dragging
        containerElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            // Update offsets
            state.offsetX = e.clientX - startX;
            state.offsetY = e.clientY - startY;

            applyTransform(videoElement.id);
        });

        // Mouse Up to stop dragging
        document.addEventListener('mouseup', () => {
            isDragging = false;
            videoElement.style.cursor = 'grab';
            containerElement.classList.remove('dragging');
        });

        // Click to toggle zoom
        containerElement.addEventListener('click', () => {
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;
            state.isZoomed = !state.isZoomed;
            if (state.isZoomed) {
                state.currentScale = 2.0; // Zoom to a default level
            } else {
                state.currentScale = 1.0;
                state.offsetX = 0;
                state.offsetY = 0;
            }
            applyTransform(videoElement.id);
        });
    }

    // --- Whiteboard Functions ---

    /**
     * Setups up the canvas context and event listeners for whiteboard functionality.
     */
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
            console.error('Whiteboard canvas not found!');
            return;
        }

        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeCanvas();

        whiteboardCtx.fillStyle = '#000000';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        // Event listeners for drawing
        whiteboardCanvas.addEventListener('mousedown', startDrawing);
        whiteboardCanvas.addEventListener('mousemove', draw);
        whiteboardCanvas.addEventListener('mouseup', stopDrawing);
        whiteboardCanvas.addEventListener('mouseout', stopDrawing);
        whiteboardCanvas.addEventListener('touchstart', startDrawing);
        whiteboardCanvas.addEventListener('touchmove', draw);
        whiteboardCanvas.addEventListener('touchend', stopDrawing);

        // Event listeners for UI controls
        toolButtons.forEach(button => {
            button.addEventListener('click', selectTool);
        });

        colorPicker.addEventListener('change', (e) => {
            currentColor = e.target.value;
        });
        brushSizeSlider.addEventListener('change', (e) => {
            currentBrushSize = e.target.value;
        });

        undoButton.addEventListener('click', undo);
        redoButton.addEventListener('click', redo);
        clearButton.addEventListener('click', clearCanvas);
        saveButton.addEventListener('click', saveCanvas);

        prevWhiteboardPageBtn.addEventListener('click', prevPage);
        nextWhiteboardPageBtn.addEventListener('click', nextPage);

        // Initial UI state update
        updateUndoRedoButtons();
        updateWhiteboardPageDisplay();
    }

    function resizeCanvas() {
        const parent = whiteboardCanvas.parentElement;
        whiteboardCanvas.width = parent.clientWidth;
        whiteboardCanvas.height = parent.clientHeight;
        // Re-render the current page after resize
        renderCurrentWhiteboardPage();
    }

    window.addEventListener('resize', resizeCanvas);


    /**
     * Fetches the entire whiteboard history from the server.
     * This is crucial for initial page load and synchronization.
     */
    function fetchWhiteboardHistory() {
        if (socket && socket.connected) {
            console.log('[Whiteboard] Requesting whiteboard history...');
            socket.emit('whiteboard_history_request', {
                classroomId: currentClassroom.id
            });
        } else {
            console.error('[Whiteboard] Socket not connected. Cannot fetch history.');
            showNotification('Could not load whiteboard history. Please ensure you are connected.', true);
        }
    }


    /**
     * Renders the drawing commands for the current page onto the canvas.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const pageHistory = whiteboardPages[currentPageIndex] || [];
        pageHistory.forEach(item => {
            drawWhiteboardItem(item);
        });
    }

    /**
     * Draws a single drawing item on the canvas.
     * @param {object} item - The drawing item object.
     */
    function drawWhiteboardItem(item) {
        if (!whiteboardCtx) return;

        // Apply shared styles
        whiteboardCtx.strokeStyle = item.color;
        whiteboardCtx.lineWidth = item.size;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';

        // Apply tool-specific properties
        if (item.type === 'pen' || item.type === 'eraser') {
            whiteboardCtx.globalCompositeOperation = item.type === 'eraser' ? 'destination-out' : 'source-over';
        } else {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }
        whiteboardCtx.fillStyle = item.color;

        switch (item.type) {
            case 'pen':
            case 'eraser':
                if (item.points.length > 1) {
                    whiteboardCtx.beginPath();
                    whiteboardCtx.moveTo(item.points[0].x, item.points[0].y);
                    for (let i = 1; i < item.points.length; i++) {
                        whiteboardCtx.lineTo(item.points[i].x, item.points[i].y);
                    }
                    whiteboardCtx.stroke();
                } else if (item.points.length === 1) {
                    whiteboardCtx.beginPath();
                    whiteboardCtx.arc(item.points[0].x, item.points[0].y, item.size / 2, 0, 2 * Math.PI);
                    whiteboardCtx.fill();
                }
                break;
            case 'line':
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.startX, item.startY);
                whiteboardCtx.lineTo(item.endX, item.endY);
                whiteboardCtx.stroke();
                break;
            case 'rectangle':
                whiteboardCtx.beginPath();
                if (item.fill) {
                    whiteboardCtx.fillRect(item.startX, item.startY, item.width, item.height);
                } else {
                    whiteboardCtx.strokeRect(item.startX, item.startY, item.width, item.height);
                }
                break;
            case 'circle':
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(item.centerX, item.centerY, item.radius, 0, 2 * Math.PI);
                if (item.fill) {
                    whiteboardCtx.fill();
                } else {
                    whiteboardCtx.stroke();
                }
                break;
        }
    }


    /**
     * Handles the start of a drawing action.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function startDrawing(e) {
        if (currentUser.role !== 'admin') return;
        const {
            x,
            y
        } = getMousePos(e);
        isDrawing = true;
        startX = x;
        startY = y;
        currentStrokePoints = [{
            x,
            y
        }];
        snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    }

    /**
     * Handles the drawing motion.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function draw(e) {
        if (!isDrawing) return;
        const {
            x,
            y
        } = getMousePos(e);
        lastX = x;
        lastY = y;
        currentStrokePoints.push({
            x,
            y
        });

        // Only draw on canvas and emit for 'pen' and 'eraser'
        if (currentTool === 'pen' || currentTool === 'eraser') {
            whiteboardCtx.putImageData(snapshot, 0, 0); // Restore snapshot
            drawWhiteboardItem({
                type: currentTool,
                points: currentStrokePoints,
                color: currentColor,
                size: currentBrushSize
            });

            // Emit every 5 points to optimize network traffic
            if (currentStrokePoints.length % 5 === 0) {
                emitWhiteboardData('draw', {
                    type: currentTool,
                    points: currentStrokePoints,
                    color: currentColor,
                    size: currentBrushSize
                });
            }
        }
    }

    /**
     * Handles the end of a drawing action.
     */
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        // Emit the final, complete drawing data for 'pen'/'eraser'
        if (currentTool === 'pen' || currentTool === 'eraser' && currentStrokePoints.length > 1) {
            emitWhiteboardData('draw', {
                type: currentTool,
                points: currentStrokePoints,
                color: currentColor,
                size: currentBrushSize
            });
            pushToUndoStack();
            currentStrokePoints = []; // Reset for next stroke
        }
        snapshot = null;
    }


    /**
     * Helper to get mouse or touch position relative to the canvas.
     * @param {MouseEvent|TouchEvent} e - The event object.
     * @returns {object} The x and y coordinates.
     */
    function getMousePos(e) {
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
     * Emits whiteboard data to the server, including the current page index.
     * @param {string} action - The action type (e.g., 'draw', 'clear').
     * @param {object} data - The drawing data.
     */
    function emitWhiteboardData(action, data) {
        if (socket && socket.connected) {
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
        }
    }

    /**
     * Selects the current drawing tool.
     * @param {Event} e - The event object.
     */
    function selectTool(e) {
        if (e.target.dataset.tool) {
            currentTool = e.target.dataset.tool;
            toolButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            showNotification(`Tool selected: ${currentTool}`);
        }
    }

    /**
     * Pushes the current canvas state to the undo stack.
     */
    function pushToUndoStack() {
        const currentData = whiteboardPages[currentPageIndex].slice(); // Clone the array
        undoStack.push(currentData);
        if (undoStack.length > MAX_HISTORY_STEPS) {
            undoStack.shift(); // Remove the oldest state
        }
        redoStack.length = 0; // Clear the redo stack on new action
        updateUndoRedoButtons();
    }

    /**
     * Undoes the last drawing action.
     */
    function undo() {
        if (undoStack.length > 0) {
            const lastState = undoStack.pop();
            redoStack.push(whiteboardPages[currentPageIndex].slice());
            whiteboardPages[currentPageIndex] = lastState;
            renderCurrentWhiteboardPage();
            updateUndoRedoButtons();
            showNotification('Undo successful.');
        } else {
            showNotification('Nothing to undo.', true);
        }
    }

    /**
     * Redoes the last undone action.
     */
    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            undoStack.push(whiteboardPages[currentPageIndex].slice());
            whiteboardPages[currentPageIndex] = nextState;
            renderCurrentWhiteboardPage();
            updateUndoRedoButtons();
            showNotification('Redo successful.');
        } else {
            showNotification('Nothing to redo.', true);
        }
    }

    /**
     * Clears the canvas.
     */
    function clearCanvas() {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can clear the whiteboard.', true);
            return;
        }
        const confirmClear = confirm('Are you sure you want to clear the canvas? This cannot be undone by other users.');
        if (confirmClear) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000';
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCtx.height);
            emitWhiteboardData('clear', {}); // Emit clear event
            pushToUndoStack();
            showNotification('Whiteboard cleared.');
        }
    }

    /**
     * Saves the current canvas as an image.
     */
    function saveCanvas() {
        const image = whiteboardCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `whiteboard_page_${currentPageIndex + 1}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Whiteboard saved as an image.');
    }

    /**
     * Updates the enabled/disabled state of the undo/redo buttons.
     */
    function updateUndoRedoButtons() {
        undoButton.disabled = undoStack.length === 0;
        redoButton.disabled = redoStack.length === 0;
    }

    /**
     * Updates the whiteboard page display.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
            nextWhiteboardPageBtn.disabled = false; // Always allow next to create a new page
        }
    }

    /**
     * Navigates to the previous page.
     */
    function prevPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            emitWhiteboardPageChange(currentPageIndex);
        }
    }

    /**
     * Navigates to the next page, or creates one if it doesn't exist.
     */
    function nextPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else {
            // Create a new page
            whiteboardPages.push([]);
            currentPageIndex = whiteboardPages.length - 1;
            showNotification('New whiteboard page created.');
        }
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        emitWhiteboardPageChange(currentPageIndex);
    }

    /**
     * Emits a page change event to the server.
     * @param {number} pageIndex - The new page index.
     */
    function emitWhiteboardPageChange(pageIndex) {
        if (socket && socket.connected) {
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: pageIndex
            });
        }
    }

    // --- Chat Functions ---

    /**
     * Setups event listeners for chat functionality.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }

    /**
     * Sends a chat message to the server.
     */
    function sendMessage() {
        if (!socket || !currentClassroom || !chatInput.value.trim()) {
            return;
        }

        const message = chatInput.value.trim();
        const payload = {
            classroomId: currentClassroom.id,
            message: message
        };

        // Emit the message and clear the input
        socket.emit('message', payload);
        chatInput.value = '';
    }


    // --- Library Functions ---

    /**
     * Fetches and displays the list of files in the classroom library.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/files`);
            if (!response.ok) {
                throw new Error('Failed to fetch library files.');
            }
            let files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            if (searchTerm) {
                files = files.filter(file => file.filename.toLowerCase().includes(searchTerm));
            }

            if (libraryFilesList) {
                libraryFilesList.innerHTML = ''; // Clear the list first
                if (files.length === 0) {
                    libraryFilesList.innerHTML = '<p>No files uploaded yet.</p>';
                    return;
                }
                files.forEach(file => {
                    const fileElement = document.createElement('li');
                    fileElement.innerHTML = `
                        <span>${file.filename}</span>
                        <a href="${file.url}" download="${file.filename}">
                            <button class="download-btn">Download</button>
                        </a>
                    `;
                    libraryFilesList.appendChild(fileElement);
                });
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            showNotification('Failed to load library files.', true);
        }
    }


    // --- Assessment Functions ---

    /**
     * Loads and displays assessments.
     */
    async function loadAssessments() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`);
            if (!response.ok) throw new Error('Failed to fetch assessments.');
            let assessments = await response.json();

            const searchTerm = assessmentSearchInput.value.toLowerCase();
            if (searchTerm) {
                assessments = assessments.filter(assessment => assessment.title.toLowerCase().includes(searchTerm) || assessment.description.toLowerCase().includes(searchTerm));
            }

            if (assessmentListDiv) {
                assessmentListDiv.innerHTML = '';
                if (assessments.length === 0) {
                    assessmentListDiv.innerHTML = '<p>No assessments available yet.</p>';
                    return;
                }
                assessments.forEach(assessment => {
                    const assessmentItem = document.createElement('div');
                    assessmentItem.className = 'assessment-item';
                    let statusText = '';
                    const now = new Date();
                    const scheduledTime = new Date(assessment.scheduled_at);
                    const endTime = new Date(scheduledTime.getTime() + assessment.duration_minutes * 60000);

                    if (now < scheduledTime) {
                        statusText = `<span class="assessment-status-pending">Scheduled for: ${scheduledTime.toLocaleString()}</span>`;
                    } else if (now >= scheduledTime && now <= endTime) {
                        statusText = `<span class="assessment-status-active">Active</span>`;
                    } else {
                        statusText = `<span class="assessment-status-ended">Ended</span>`;
                    }

                    assessmentItem.innerHTML = `
                        <h3>${assessment.title}</h3>
                        <p>${assessment.description}</p>
                        <p><strong>Duration:</strong> ${assessment.duration_minutes} minutes</p>
                        <p><strong>Status:</strong> ${statusText}</p>
                        <button class="view-assessment-btn" data-assessment-id="${assessment.id}">View Details</button>
                    `;
                    assessmentListDiv.appendChild(assessmentItem);
                });
            }

            document.querySelectorAll('.view-assessment-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const assessmentId = e.target.dataset.assessmentId;
                    viewAssessmentDetails(assessmentId);
                });
            });
        } catch (error) {
            console.error('Error loading assessments:', error);
            showNotification('Failed to load assessments.', true);
        }
    }


    // --- Event Listeners and Initial Setup ---

    // Auth forms
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
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
                const result = await response.json();
                if (response.ok) {
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    sessionStorage.setItem('user_id', currentUser.id);
                    displayMessage(authMessage, result.message, false);
                    checkLoginStatus();
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
                const result = await response.json();
                displayMessage(authMessage, result.message, !response.ok);
                if (response.ok) {
                    // Switch back to login view after successful registration
                    loginContainer.classList.remove('hidden');
                    registerContainer.classList.add('hidden');
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

    // Dashboard controls
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout');
                const result = await response.json();
                if (response.ok) {
                    currentUser = null;
                    currentClassroom = null;
                    localStorage.clear();
                    sessionStorage.clear();
                    cleanupClassroomResources();
                    showSection(authSection);
                    showNotification(result.message);
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
                showNotification('Only administrators can create classrooms.', true);
                return;
            }
            const name = newClassroomNameInput.value.trim();
            if (!name) {
                displayMessage(classroomMessage, 'Classroom name cannot be empty.', true);
                return;
            }
            try {
                const response = await fetch('/api/create-classroom', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name
                    })
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
                console.error('Create classroom error:', error);
                displayMessage(classroomMessage, 'An error occurred while creating the classroom.', true);
            }
        });
    }

    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadAvailableClassrooms);
    }

    // Classroom navigation
    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            cleanupClassroomResources();
            showSection(dashboardSection);
            loadAvailableClassrooms();
            updateNavActiveState(navDashboard);
        });
    }
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            cleanupClassroomResources();
            showSection(dashboardSection);
            loadAvailableClassrooms();
            updateNavActiveState(navDashboard);
        });
    }
    if (navChat) {
        navChat.addEventListener('click', () => {
            showClassroomSubSection(chatSection);
            updateNavActiveState(navChat);
        });
    }
    if (navWhiteboard) {
        navWhiteboard.addEventListener('click', () => {
            showClassroomSubSection(whiteboardArea);
            updateNavActiveState(navWhiteboard);
        });
    }
    if (navLibrary) {
        navLibrary.addEventListener('click', () => {
            showClassroomSubSection(librarySection);
            updateNavActiveState(navLibrary);
        });
    }
    if (navAssessments) {
        navAssessments.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            updateNavActiveState(navAssessments);
        });
    }
    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
        });
    }

    // Settings
    if (navSettings) {
        navSettings.addEventListener('click', () => {
            showSection(settingsSection);
            updateNavActiveState(navSettings);
            if (currentUser) {
                settingsUsernameInput.value = currentUser.username;
                settingsEmailInput.value = currentUser.email;
            }
        });
    }

    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = settingsUsernameInput.value;
            const email = settingsEmailInput.value;
            const password = updateProfileForm.password.value; // Optional password field
            const payload = {
                username,
                email
            };
            if (password) {
                payload.password = password;
            }
            try {
                const response = await fetch('/api/update-profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (response.ok) {
                    currentUser.username = result.username;
                    currentUser.email = result.email;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                    updateProfileForm.reset();
                    showNotification('Profile updated successfully.');
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Update profile error:', error);
                showNotification('An error occurred while updating your profile.', true);
            }
        });
    }

    // Share link functionality
    if (classCodeSpan) {
        classCodeSpan.addEventListener('click', () => {
            if (shareLinkDisplay.classList.contains('hidden')) {
                const shareUrl = `${window.location.origin}/classroom/${currentClassroom.id}`;
                shareLinkInput.value = shareUrl;
                shareLinkDisplay.classList.remove('hidden');
                shareLinkInput.select();
                showNotification('Share link generated.');
            } else {
                shareLinkDisplay.classList.add('hidden');
            }
        });
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            showNotification('Link copied to clipboard!');
        });
    }

    // Broadcast controls
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }
    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }

    // Library controls
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification('Only administrators can upload files.', true);
                return;
            }
            if (!currentClassroom) {
                showNotification('You must be in a classroom to upload files.', true);
                return;
            }
            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification('Please select files to upload.', true);
                return;
            }
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            try {
                const response = await fetch(`/api/classrooms/${currentClassroom.id}/files/upload`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    libraryFileInput.value = ''; // Clear the input
                    loadLibraryFiles();
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('File upload error:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }

    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }

    // Assessment controls
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addQuestionField();
        });
    }

    if (submitAssessmentBtn) {
        submitAssessmentBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionTextarea.value.trim();
            const scheduledAt = assessmentScheduledAtInput.value;
            const durationMinutes = assessmentDurationMinutesInput.value;

            if (!title || !description || !scheduledAt || !durationMinutes) {
                displayMessage(assessmentCreationMessage, 'All fields must be filled out.', true);
                return;
            }

            const questions = [];
            document.querySelectorAll('.question-block').forEach(qBlock => {
                const questionText = qBlock.querySelector('.question-text-input').value.trim();
                const questionType = qBlock.querySelector('.question-type-select').value;
                const options = [];
                qBlock.querySelectorAll('.option-input').forEach(opt => {
                    if (opt.value.trim()) {
                        options.push(opt.value.trim());
                    }
                });
                questions.push({
                    text: questionText,
                    type: questionType,
                    options: options.length > 0 ? options : null, // Send null if no options
                });
            });

            const assessmentData = {
                title,
                description,
                scheduled_at: scheduledAt,
                duration_minutes: parseInt(durationMinutes, 10),
                questions
            };

            try {
                const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(assessmentData)
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(assessmentCreationMessage, result.message, false);
                    assessmentCreationForm.reset();
                    questionsContainer.innerHTML = '';
                    loadAssessments(); // Reload the list
                } else {
                    displayMessage(assessmentCreationMessage, result.error, true);
                }
            } catch (error) {
                console.error('Create assessment error:', error);
                displayMessage(assessmentCreationMessage, 'An error occurred while creating the assessment.', true);
            }
        });
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
