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
            const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
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
                const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
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

        // Whiteboard socket handlers
        socket.on('whiteboard_data', (data) => {
            // Check if the drawing command is for the current page
            if (data.pageIndex === currentPageIndex) {
                drawWhiteboardItem(data);
                // After drawing, add the item to the current page's history
                whiteboardPages[currentPageIndex].push(data);
                updateUndoRedoButtons();
            } else if (data.pageIndex > whiteboardPages.length - 1) {
                // If a new page is created by another user, add it to our local state.
                const newPageCount = data.pageIndex - (whiteboardPages.length - 1);
                for (let i = 0; i < newPageCount; i++) {
                    whiteboardPages.push([]);
                }
                // Do not draw it, but allow the user to navigate to it.
                updateWhiteboardPageDisplay();
            }
            console.log(`[Whiteboard] Received new drawing data for page ${data.pageIndex}.`);
        });

        socket.on('whiteboard_history', (data) => {
            console.log(`[Whiteboard] Received history for page ${data.pageIndex}.`);
            // Ensure the page exists locally
            if (data.pageIndex >= 0 && data.pageIndex < whiteboardPages.length) {
                whiteboardPages[data.pageIndex] = data.history;
                redrawWhiteboard();
            }
        });

        socket.on('whiteboard_page_change', (data) => {
            console.log(`[Whiteboard] Received page change to page ${data.pageIndex} from another user.`);
            if (data.pageIndex >= 0 && data.pageIndex < whiteboardPages.length) {
                currentPageIndex = data.pageIndex;
                updateWhiteboardPageDisplay();
                redrawWhiteboard();
                showNotification(`Whiteboard page changed to ${currentPageIndex + 1}.`);
            }
        });

        socket.on('whiteboard_undo', (data) => {
            if (data.pageIndex === currentPageIndex) {
                const undoneItem = whiteboardPages[currentPageIndex].pop();
                if (undoneItem) {
                    redoStack.push(undoneItem);
                    redrawWhiteboard();
                    updateUndoRedoButtons();
                    showNotification('Whiteboard action undone.');
                }
            }
        });

        socket.on('whiteboard_redo', (data) => {
            if (data.pageIndex === currentPageIndex) {
                const redoneItem = redoStack.pop();
                if (redoneItem) {
                    whiteboardPages[currentPageIndex].push(redoneItem);
                    drawWhiteboardItem(redoneItem);
                    updateUndoRedoButtons();
                    showNotification('Whiteboard action redone.');
                }
            }
        });

        socket.on('whiteboard_clear', (data) => {
            if (data.pageIndex === currentPageIndex) {
                // Save a snapshot of the current page for undo before clearing
                if (whiteboardPages[currentPageIndex].length > 0) {
                    undoStack.push({ type: 'clear', data: [...whiteboardPages[currentPageIndex]] });
                    if (undoStack.length > MAX_HISTORY_STEPS) undoStack.shift();
                }
                whiteboardPages[currentPageIndex] = [];
                clearWhiteboard();
                showNotification('Whiteboard has been cleared.');
                updateUndoRedoButtons();
            }
        });

        // WebRTC handlers
        socket.on('webrtc_offer', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore offers from self
            console.log(`[WebRTC] Received offer from ${data.sender_id}`);
            createPeerConnection(data.sender_id, false, data.username);
            const peer = peerConnections[data.sender_id];
            await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('webrtc_answer', {
                'classroomId': currentClassroom.id,
                'recipient_id': data.sender_id,
                'answer': peer.localDescription
            });
            console.log(`[WebRTC] Sending answer to ${data.sender_id}`);
        });

        socket.on('webrtc_answer', async (data) => {
            if (data.sender_id === socket.id) return;
            console.log(`[WebRTC] Received answer from ${data.sender_id}`);
            const peer = peerConnections[data.sender_id];
            if (!peer.currentRemoteDescription) {
                await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
                console.log(`[WebRTC] Set remote description for ${data.sender_id}`);
            }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            if (data.sender_id === socket.id) return;
            console.log(`[WebRTC] Received ICE candidate from ${data.sender_id}`);
            const peer = peerConnections[data.sender_id];
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
                    console.log(`[WebRTC] Added ICE candidate for ${data.sender_id}`);
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            const peerId = data.peer_id;
            console.log(`[WebRTC] Peer disconnected signal received for ${peerId}`);
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        });

    }

    // --- Whiteboard Functions ---

    /**
     * Resizes the canvas to match its container's dimensions.
     */
    function resizeCanvas() {
        if (whiteboardCanvas) {
            const rect = whiteboardCanvas.getBoundingClientRect();
            whiteboardCanvas.width = rect.width;
            whiteboardCanvas.height = rect.height;
            console.log(`[Whiteboard] Canvas resized to ${whiteboardCanvas.width}x${whiteboardCanvas.height}`);
            redrawWhiteboard();
        }
    }

    /**
     * Clears the canvas.
     */
    function clearWhiteboard() {
        if (whiteboardCtx) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
    }

    /**
     * Updates the UI state of the undo and redo buttons.
     */
    function updateUndoRedoButtons() {
        if (undoButton && redoButton) {
            undoButton.disabled = whiteboardPages[currentPageIndex].length === 0;
            redoButton.disabled = redoStack.length === 0;
        }
    }

    /**
     * Updates the page number display.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
            if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
            if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1;
        }
    }

    /**
     * Redraws the entire canvas from the current page's history.
     */
    function redrawWhiteboard() {
        clearWhiteboard();
        const currentPageHistory = whiteboardPages[currentPageIndex];
        if (currentPageHistory) {
            currentPageHistory.forEach(item => {
                drawWhiteboardItem(item);
            });
        }
    }

    /**
     * Draws a single whiteboard item based on the data received.
     * @param {object} item - The drawing command object.
     */
    function drawWhiteboardItem(item) {
        if (!whiteboardCtx || !item || !item.tool) return;

        whiteboardCtx.beginPath();
        whiteboardCtx.strokeStyle = item.color;
        whiteboardCtx.lineWidth = item.size;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';
        
        // Handle eraser tool specifically by setting the color to the canvas background
        if (item.tool === 'eraser') {
            whiteboardCtx.strokeStyle = '#FFFFFF'; // Assuming white background
            whiteboardCtx.lineWidth = item.size;
        }

        switch (item.tool) {
            case 'pen':
            case 'eraser':
                // Draw a series of connected points for strokes
                if (item.points && item.points.length > 1) {
                    whiteboardCtx.beginPath();
                    whiteboardCtx.moveTo(item.points[0].x, item.points[0].y);
                    for (let i = 1; i < item.points.length; i++) {
                        whiteboardCtx.lineTo(item.points[i].x, item.points[i].y);
                    }
                    whiteboardCtx.stroke();
                }
                break;
            case 'line':
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.x1, item.y1);
                whiteboardCtx.lineTo(item.x2, item.y2);
                whiteboardCtx.stroke();
                break;
            case 'rectangle':
                whiteboardCtx.strokeRect(item.x, item.y, item.width, item.height);
                break;
            case 'circle':
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(item.x, item.y, item.radius, 0, 2 * Math.PI);
                whiteboardCtx.stroke();
                break;
            case 'text':
                if (item.text) {
                    whiteboardCtx.fillStyle = item.color;
                    whiteboardCtx.font = `${item.size}px Arial`;
                    whiteboardCtx.fillText(item.text, item.x, item.y);
                }
                break;
        }
    }

    /**
     * Fetches whiteboard history from the server for the current page.
     */
    async function fetchWhiteboardHistory() {
        if (!currentClassroom || !currentClassroom.id) return;

        try {
            const response = await fetch(`/api/whiteboard/history/${currentClassroom.id}/${currentPageIndex}`);
            if (response.ok) {
                const data = await response.json();
                if (data.drawings) {
                    whiteboardPages[currentPageIndex] = data.drawings;
                    console.log(`[Whiteboard] History fetched for page ${currentPageIndex}:`, data.drawings);
                    redrawWhiteboard();
                } else {
                    console.log(`[Whiteboard] No history found for page ${currentPageIndex}.`);
                    whiteboardPages[currentPageIndex] = [];
                    redrawWhiteboard();
                }
            } else {
                console.error(`[Whiteboard] Failed to fetch whiteboard history. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('[Whiteboard] Error fetching whiteboard history:', error);
        }
    }

    /**
     * Saves the current whiteboard page to the server.
     */
    async function saveWhiteboardPage() {
        if (!currentClassroom || !currentClassroom.id) return;
        const historyToSave = whiteboardPages[currentPageIndex];

        try {
            const response = await fetch('/api/whiteboard/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex,
                    drawings: historyToSave
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                console.log(`[Whiteboard] Page ${currentPageIndex + 1} saved successfully.`);
            } else {
                showNotification(result.error, true);
                console.error(`[Whiteboard] Failed to save page: ${result.error}`);
            }
        } catch (error) {
            console.error('[Whiteboard] Error saving whiteboard page:', error);
            showNotification('An error occurred while saving the whiteboard.', true);
        }
    }

    /**
     * Sets up all the event listeners for the whiteboard tools.
     */
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
            console.error("Whiteboard canvas not found.");
            return;
        }

        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        updateWhiteboardPageDisplay();
        updateUndoRedoButtons();

        // Tool Selection
        if (toolButtons) {
            toolButtons.forEach(button => {
                button.addEventListener('click', () => {
                    toolButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    currentTool = button.dataset.tool;
                    showNotification(`Tool changed to: ${currentTool}`);
                });
            });
        }

        // Color and Brush Size
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                currentColor = e.target.value;
            });
        }
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', (e) => {
                currentBrushSize = parseInt(e.target.value);
            });
        }

        // --- Mouse Events for Drawing ---
        whiteboardCanvas.addEventListener('mousedown', (e) => {
            if (currentUser.role !== 'admin') return; // Only admin can draw
            isDrawing = true;
            const rect = whiteboardCanvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            lastX = startX;
            lastY = startY;

            // Save the current state of the canvas for temporary drawing
            if (currentTool !== 'pen' && currentTool !== 'eraser') {
                snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }

            // Start new stroke for pen/eraser
            if (currentTool === 'pen' || currentTool === 'eraser') {
                currentStrokePoints = [{ x: startX, y: startY }];
                // Draw a dot on mousedown for single clicks
                whiteboardCtx.beginPath();
                if (currentTool === 'eraser') {
                    whiteboardCtx.strokeStyle = '#FFFFFF';
                } else {
                    whiteboardCtx.strokeStyle = currentColor;
                }
                whiteboardCtx.lineWidth = currentBrushSize;
                whiteboardCtx.lineCap = 'round';
                whiteboardCtx.lineJoin = 'round';
                whiteboardCtx.moveTo(startX, startY);
                whiteboardCtx.lineTo(startX, startY);
                whiteboardCtx.stroke();
            }
        });

        whiteboardCanvas.addEventListener('mousemove', (e) => {
            if (!isDrawing) return;

            const rect = whiteboardCanvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            if (currentTool === 'pen' || currentTool === 'eraser') {
                // Add point to stroke
                currentStrokePoints.push({ x: currentX, y: currentY });

                // Draw live segment
                whiteboardCtx.beginPath();
                if (currentTool === 'eraser') {
                    whiteboardCtx.strokeStyle = '#FFFFFF';
                    whiteboardCtx.lineWidth = currentBrushSize;
                } else {
                    whiteboardCtx.strokeStyle = currentColor;
                    whiteboardCtx.lineWidth = currentBrushSize;
                }
                whiteboardCtx.lineCap = 'round';
                whiteboardCtx.lineJoin = 'round';
                whiteboardCtx.moveTo(lastX, lastY);
                whiteboardCtx.lineTo(currentX, currentY);
                whiteboardCtx.stroke();

                lastX = currentX;
                lastY = currentY;

            } else if (snapshot) {
                // For shapes, redraw the snapshot and the new shape
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.putImageData(snapshot, 0, 0);

                const width = currentX - startX;
                const height = currentY - startY;

                whiteboardCtx.beginPath();
                whiteboardCtx.strokeStyle = currentColor;
                whiteboardCtx.lineWidth = currentBrushSize;

                if (currentTool === 'line') {
                    whiteboardCtx.moveTo(startX, startY);
                    whiteboardCtx.lineTo(currentX, currentY);
                } else if (currentTool === 'rectangle') {
                    whiteboardCtx.strokeRect(startX, startY, width, height);
                } else if (currentTool === 'circle') {
                    const radius = Math.sqrt(width * width + height * height) / 2;
                    const centerX = startX + width / 2;
                    const centerY = startY + height / 2;
                    whiteboardCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                }
                whiteboardCtx.stroke();
            }
        });

        whiteboardCanvas.addEventListener('mouseup', () => {
            if (!isDrawing) return;
            isDrawing = false;
            let drawingData = null;

            const rect = whiteboardCanvas.getBoundingClientRect();
            const endX = event.clientX - rect.left;
            const endY = event.clientY - rect.top;

            // Finalize and save the drawing command
            switch (currentTool) {
                case 'pen':
                case 'eraser':
                    if (currentStrokePoints.length > 1) { // Only save if there's a real stroke
                        drawingData = {
                            tool: currentTool,
                            color: currentTool === 'eraser' ? '#FFFFFF' : currentColor,
                            size: currentBrushSize,
                            points: currentStrokePoints
                        };
                    }
                    currentStrokePoints = []; // Reset for the next stroke
                    break;
                case 'line':
                    drawingData = {
                        tool: 'line',
                        color: currentColor,
                        size: currentBrushSize,
                        x1: startX,
                        y1: startY,
                        x2: endX,
                        y2: endY
                    };
                    break;
                case 'rectangle':
                    drawingData = {
                        tool: 'rectangle',
                        color: currentColor,
                        size: currentBrushSize,
                        x: startX,
                        y: startY,
                        width: endX - startX,
                        height: endY - startY
                    };
                    break;
                case 'circle':
                    const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
                    const centerX = startX + (endX - startX) / 2;
                    const centerY = startY + (endY - startY) / 2;
                    drawingData = {
                        tool: 'circle',
                        color: currentColor,
                        size: currentBrushSize,
                        x: centerX,
                        y: centerY,
                        radius: radius
                    };
                    break;
                case 'text':
                    const text = prompt("Enter text:");
                    if (text) {
                        drawingData = {
                            tool: 'text',
                            color: currentColor,
                            size: currentBrushSize,
                            x: startX,
                            y: startY + currentBrushSize // Offset to align with click
                        };
                        drawingData.text = text;
                        // Draw immediately for local feedback
                        drawWhiteboardItem(drawingData);
                    }
                    break;
            }

            // If a drawing command was generated, emit it to the server
            if (drawingData) {
                drawingData.pageIndex = currentPageIndex;
                socket.emit('whiteboard_data', drawingData);
                // Add to local history and update undo stack
                whiteboardPages[currentPageIndex].push(drawingData);
                undoStack.push(drawingData);
                redoStack.length = 0; // Clear redo stack on new action
                updateUndoRedoButtons();
                console.log(`[Whiteboard] Emitted drawing data for tool '${drawingData.tool}'.`);
            }
        });

        // Other Controls
        if (undoButton) {
            undoButton.addEventListener('click', () => {
                if (whiteboardPages[currentPageIndex].length > 0) {
                    const lastItem = whiteboardPages[currentPageIndex].pop();
                    redoStack.push(lastItem);
                    // Handle 'clear' special case
                    if (lastItem.type === 'clear' && lastItem.data) {
                        whiteboardPages[currentPageIndex] = lastItem.data;
                    }
                    redrawWhiteboard();
                    updateUndoRedoButtons();
                    socket.emit('whiteboard_undo', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
                }
            });
        }

        if (redoButton) {
            redoButton.addEventListener('click', () => {
                if (redoStack.length > 0) {
                    const redoneItem = redoStack.pop();
                    whiteboardPages[currentPageIndex].push(redoneItem);
                    drawWhiteboardItem(redoneItem);
                    updateUndoRedoButtons();
                    socket.emit('whiteboard_redo', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
                }
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                // Save a snapshot of the current page for undo before clearing
                if (whiteboardPages[currentPageIndex].length > 0) {
                    undoStack.push({ type: 'clear', data: [...whiteboardPages[currentPageIndex]] });
                    if (undoStack.length > MAX_HISTORY_STEPS) undoStack.shift();
                }
                whiteboardPages[currentPageIndex] = [];
                clearWhiteboard();
                updateUndoRedoButtons();
                socket.emit('whiteboard_clear', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', saveWhiteboardPage);
        }

        if (prevWhiteboardPageBtn) {
            prevWhiteboardPageBtn.addEventListener('click', () => {
                if (currentPageIndex > 0) {
                    saveWhiteboardPage().then(() => {
                        currentPageIndex--;
                        updateWhiteboardPageDisplay();
                        fetchWhiteboardHistory();
                        socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
                        showNotification(`Navigating to page ${currentPageIndex + 1}.`);
                    });
                }
            });
        }

        if (nextWhiteboardPageBtn) {
            nextWhiteboardPageBtn.addEventListener('click', () => {
                saveWhiteboardPage().then(() => {
                    currentPageIndex++;
                    // If this is a new page, add an empty array for its history
                    if (currentPageIndex >= whiteboardPages.length) {
                        whiteboardPages.push([]);
                    }
                    updateWhiteboardPageDisplay();
                    fetchWhiteboardHistory();
                    socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
                    showNotification(`Navigating to page ${currentPageIndex + 1}.`);
                });
            });
        }
    }


    // --- Chat Functions ---

    /**
     * Sets up event listeners for the chat functionality.
     */
    function setupChatControls() {
        if (chatInput && sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendChatMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendChatMessage();
                }
            });
        }
    }

    /**
     * Sends a chat message to the server.
     */
    function sendChatMessage() {
        if (!chatInput.value.trim() || !socket || !currentClassroom) return;

        const messageData = {
            classroomId: currentClassroom.id,
            username: currentUser.username,
            role: currentUser.role,
            message: chatInput.value.trim()
        };
        socket.emit('message', messageData);
        chatInput.value = '';
    }

    // --- WebRTC Functions ---

    /**
     * Starts the video broadcast for the current user.
     */
    async function startBroadcast() {
        if (!currentClassroom || !currentClassroom.id || currentUser.role !== 'admin') {
            showNotification("Only administrators can start a broadcast.", true);
            return;
        }

        if (startBroadcastBtn) startBroadcastBtn.disabled = true;
        if (endBroadcastBtn) endBroadcastBtn.disabled = false;

        try {
            const broadcastType = document.querySelector('input[name="broadcastType"]:checked').value;
            console.log(`[WebRTC] Starting broadcast of type: ${broadcastType}`);

            const mediaConstraints = { video: true, audio: true };
            if (broadcastType === 'screen') {
                localStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);
                localStream.getVideoTracks()[0].onended = () => {
                    console.log("[WebRTC] Screen share ended by user.");
                    endBroadcast();
                };
            } else { // 'camera' or default
                localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            }

            if (localVideo) {
                localVideo.srcObject = localStream;
                if (localVideoContainer) localVideoContainer.classList.remove('hidden');
                localVideo.play();
            }

            // Notify server and existing peers
            socket.emit('start_broadcast', { classroomId: currentClassroom.id, username: currentUser.username });

            // Create peer connections with all other users already in the room
            // The server will handle notifying new users to connect to this admin
            fetch(`/api/classrooms/${currentClassroom.id}`)
                .then(res => res.json())
                .then(roomData => {
                    const otherUsers = roomData.participants.filter(p => p.sid !== socket.id);
                    otherUsers.forEach(peer => {
                        createPeerConnection(peer.sid, true, peer.username);
                    });
                })
                .catch(err => console.error("Error fetching room participants:", err));

            showNotification("Broadcast started successfully.");
        } catch (error) {
            console.error('[WebRTC] Error starting broadcast:', error);
            showNotification(`Error starting broadcast: ${error.name}. Please ensure you have media permissions.`, true);
            endBroadcast();
        }
    }

    /**
     * Stops the video broadcast and cleans up resources.
     */
    function endBroadcast() {
        if (startBroadcastBtn) startBroadcastBtn.disabled = false;
        if (endBroadcastBtn) endBroadcastBtn.disabled = true;

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        if (localVideo) {
            localVideo.srcObject = null;
        }
        if (localVideoContainer) localVideoContainer.classList.add('hidden'); // Hide the local video feed

        // Close all active peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
            }
        }
        if (remoteVideoContainer) {
            remoteVideoContainer.innerHTML = '';
        }

        socket.emit('end_broadcast', { classroomId: currentClassroom.id });
        showNotification("Broadcast ended.");
    }

    /**
     * Creates a new RTCPeerConnection.
     * @param {string} peerId - The Socket.IO SID of the peer to connect to.
     * @param {boolean} isCaller - True if this client is initiating the connection (creating the offer).
     * @param {string} username - The username of the peer.
     */
    async function createPeerConnection(peerId, isCaller, username) {
        if (peerConnections[peerId]) {
            console.warn(`[WebRTC] Peer connection to ${peerId} already exists. Skipping.`);
            return;
        }

        console.log(`[WebRTC] Creating peer connection for ${peerId}...`);
        const peer = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = peer;

        // Add local video/audio tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peer.addTrack(track, localStream);
            });
        }

        // Handle remote tracks from the peer
        peer.ontrack = (event) => {
            console.log(`[WebRTC] Received remote track from ${peerId}`);
            if (event.streams && event.streams[0]) {
                let videoElement = document.getElementById(`video-${peerId}`);
                if (!videoElement) {
                    // If video element doesn't exist, create it and a wrapper
                    const videoWrapper = document.createElement('div');
                    videoWrapper.id = `video-wrapper-${peerId}`;
                    videoWrapper.className = 'remote-video-wrapper';

                    videoElement = document.createElement('video');
                    videoElement.id = `video-${peerId}`;
                    videoElement.autoplay = true;
                    videoElement.playsInline = true;
                    videoElement.className = 'remote-video';

                    const usernameLabel = document.createElement('div');
                    usernameLabel.className = 'video-username-label';
                    usernameLabel.textContent = username;

                    videoWrapper.appendChild(videoElement);
                    videoWrapper.appendChild(usernameLabel);
                    remoteVideoContainer.appendChild(videoWrapper);
                    initializeZoomableVideo(videoElement, videoWrapper); // Make the new video element zoomable
                }
                videoElement.srcObject = event.streams[0];
            }
        };

        // Send ICE candidates to the other peer
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC] Sending ICE candidate to ${peerId}`);
                socket.emit('webrtc_ice_candidate', {
                    'classroomId': currentClassroom.id,
                    'recipient_id': peerId,
                    'candidate': event.candidate
                });
            }
        };

        // Handle connection state changes
        peer.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE Connection State for ${peerId}: ${peer.iceConnectionState}`);
        };

        // If this is the caller, create the offer
        if (isCaller) {
            try {
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit('webrtc_offer', {
                    'classroomId': currentClassroom.id,
                    'recipient_id': peerId,
                    'offer': peer.localDescription
                });
                console.log(`[WebRTC] Sending offer to ${peerId}`);
            } catch (e) {
                console.error('Error creating or sending offer:', e);
            }
        }
    }

    function initializeZoomableVideo(videoElement, container) {
        if (!videoZoomStates.has(videoElement.id)) {
            videoZoomStates.set(videoElement.id, { currentScale: 1, isZoomed: false, offsetX: 0, offsetY: 0 });
        }
        const state = videoZoomStates.get(videoElement.id);

        let isDragging = false;
        let lastX = 0;
        let lastY = 0;

        container.addEventListener('dblclick', () => {
            if (state.isZoomed) {
                // Reset zoom
                state.currentScale = 1;
                state.isZoomed = false;
                state.offsetX = 0;
                state.offsetY = 0;
            } else {
                // Zoom in
                state.currentScale = 2;
                state.isZoomed = true;
            }
            applyTransform();
        });

        container.addEventListener('mousedown', (e) => {
            if (!state.isZoomed) return;
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            container.style.cursor = 'grabbing';
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;

            state.offsetX += dx;
            state.offsetY += dy;

            // Keep the video within the container boundaries (optional, but good practice)
            // This is a simple boundary check. More advanced checks would be better.
            const containerRect = container.getBoundingClientRect();
            const videoWidth = videoElement.offsetWidth * state.currentScale;
            const videoHeight = videoElement.offsetHeight * state.currentScale;

            state.offsetX = Math.min(Math.max(state.offsetX, containerRect.width - videoWidth), 0);
            state.offsetY = Math.min(Math.max(state.offsetY, containerRect.height - videoHeight), 0);

            applyTransform();

            lastX = e.clientX;
            lastY = e.clientY;
        });

        function applyTransform() {
            videoElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX / state.currentScale}px, ${state.offsetY / state.currentScale}px)`;
            videoElement.style.transition = state.isZoomed ? 'none' : 'transform 0.3s ease-in-out';
            container.style.overflow = state.isZoomed ? 'hidden' : 'visible'; // Hide overflow when zoomed
        }
    }


    // --- Library Functions ---

    /**
     * Loads and displays library files for the current classroom.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id || !libraryFilesList) return;
        try {
            const response = await fetch(`/api/library-files/${currentClassroom.id}`);
            const files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            const filteredFiles = files.filter(file => file.original_filename.toLowerCase().includes(searchTerm));

            libraryFilesList.innerHTML = '';
            if (filteredFiles.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No files found.';
                libraryFilesList.appendChild(li);
                return;
            }

            filteredFiles.forEach(file => {
                const li = document.createElement('li');
                const fileLink = document.createElement('a');
                fileLink.href = file.url;
                fileLink.textContent = file.original_filename;
                fileLink.target = '_blank';
                fileLink.rel = 'noopener noreferrer';
                li.appendChild(fileLink);

                const uploadedDate = new Date(file.uploaded_at).toLocaleDateString();
                const uploadedBy = file.uploaded_by_username || 'Admin'; // Assuming username is available from server
                const fileInfo = document.createElement('span');
                fileInfo.className = 'file-info';
                fileInfo.textContent = ` (Uploaded: ${uploadedDate})`;
                li.appendChild(fileInfo);

                // Add delete button for admins
                if (currentUser && currentUser.role === 'admin') {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.className = 'delete-file-btn';
                    deleteBtn.addEventListener('click', () => deleteLibraryFile(file.id));
                    li.appendChild(deleteBtn);
                }

                libraryFilesList.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading library files:', error);
            showNotification('Failed to load library files.', true);
        }
    }

    /**
     * Deletes a file from the library.
     * @param {string} fileId - The ID of the file to delete.
     */
    async function deleteLibraryFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const response = await fetch(`/api/library-files/${fileId}`, {
                method: 'DELETE',
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


    // --- Assessment Functions ---

    // Global variable to store active assessment questions
    let activeQuestions = [];

    function addQuestionInput(question = null) {
        const index = questionsContainer.children.length;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-input-group';
        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Question ${index + 1}</span>
                <button type="button" class="remove-question-btn">&times;</button>
            </div>
            <textarea class="question-text" placeholder="Question text" required>${question ? question.text : ''}</textarea>
            <div class="options-container">
                <label>Options:</label>
                <input type="text" class="option-input" placeholder="Option A" value="${question ? question.options[0] : ''}" required>
                <input type="text" class="option-input" placeholder="Option B" value="${question ? question.options[1] : ''}" required>
                <input type="text" class="option-input" placeholder="Option C" value="${question ? question.options[2] : ''}" required>
                <input type="text" class="option-input" placeholder="Option D" value="${question ? question.options[3] : ''}" required>
            </div>
            <div class="correct-answer-container">
                <label>Correct Answer:</label>
                <select class="correct-answer-select" required>
                    <option value="">Select Correct Answer</option>
                    <option value="A" ${question && question.correct_answer === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${question && question.correct_answer === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${question && question.correct_answer === 'C' ? 'selected' : ''}>C</option>
                    <option value="D" ${question && question.correct_answer === 'D' ? 'selected' : ''}>D</option>
                </select>
            </div>
        `;
        questionsContainer.appendChild(questionDiv);

        // Add event listener for the new remove button
        questionDiv.querySelector('.remove-question-btn').addEventListener('click', () => {
            questionDiv.remove();
            updateQuestionNumbers();
        });
    }

    function updateQuestionNumbers() {
        document.querySelectorAll('.question-input-group').forEach((group, index) => {
            group.querySelector('.question-number').textContent = `Question ${index + 1}`;
        });
    }

    async function loadAssessments() {
        if (!currentClassroom || !assessmentListDiv) return;
        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            const assessments = await response.json();
            const searchTerm = assessmentSearchInput.value.toLowerCase();

            assessmentListDiv.innerHTML = '';
            const filteredAssessments = assessments.filter(assessment =>
                assessment.title.toLowerCase().includes(searchTerm) ||
                assessment.created_by_username.toLowerCase().includes(searchTerm)
            );

            if (filteredAssessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments found.</p>';
            } else {
                filteredAssessments.forEach(assessment => {
                    const assessmentCard = document.createElement('div');
                    assessmentCard.className = 'assessment-card';
                    const createdAt = new Date(assessment.created_at).toLocaleString();
                    const scheduledAt = assessment.scheduled_at ? new Date(assessment.scheduled_at).toLocaleString() : 'Not scheduled';
                    const isUserAdmin = currentUser && currentUser.role === 'admin';

                    assessmentCard.innerHTML = `
                        <h4>${assessment.title}</h4>
                        <p><strong>Created by:</strong> ${assessment.created_by_username}</p>
                        <p><strong>Created at:</strong> ${createdAt}</p>
                        <p><strong>Scheduled at:</strong> ${scheduledAt}</p>
                        <p><strong>Duration:</strong> ${assessment.duration_minutes} minutes</p>
                        <div class="assessment-actions">
                            ${isUserAdmin ? `<button class="view-submissions-btn" data-assessment-id="${assessment.id}">View Submissions</button>` : ''}
                            <button class="take-assessment-btn" data-assessment-id="${assessment.id}">Take Assessment</button>
                        </div>
                    `;
                    assessmentListDiv.appendChild(assessmentCard);
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            showNotification('Failed to load assessments.', true);
        }
    }


    // --- Event Listeners ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    sessionStorage.setItem('user_id', result.user.id);
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    currentUser = result.user; // Update global variable
                    showNotification(result.message);
                    checkLoginStatus(); // Re-check status to show dashboard
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                displayMessage(authMessage, 'An error occurred. Please try again.', true);
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
                    setTimeout(() => {
                        showLoginLink.click();
                        authMessage.textContent = '';
                    }, 2000);
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                displayMessage(authMessage, 'An error occurred. Please try again.', true);
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
            try {
                await fetch('/api/logout', { method: 'POST' });
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentClassroom');
                currentUser = null;
                cleanupClassroomResources();
                showSection(authSection);
                showNotification("You have been logged out.");
            } catch (error) {
                console.error('Error logging out:', error);
                showNotification("An error occurred during logout.", true);
            }
        });
    }

    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            cleanupClassroomResources(); // Clean up if coming from a classroom
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadAvailableClassrooms();
        });
    }

    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            cleanupClassroomResources();
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadAvailableClassrooms();
        });
    }

    if (navSettings) {
        navSettings.addEventListener('click', async () => {
            cleanupClassroomResources();
            showSection(settingsSection);
            updateNavActiveState(navSettings);
            try {
                const response = await fetch('/api/@me');
                if (response.ok) {
                    const user = await response.json();
                    settingsUsernameInput.value = user.username;
                    settingsEmailInput.value = user.email;
                }
            } catch (error) {
                console.error('Failed to fetch user data for settings:', error);
                showNotification('Failed to load user profile data.', true);
            }
        });
    }

    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadAvailableClassrooms();
        });
    }

    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = settingsUsernameInput.value;
            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: newUsername })
                });
                const result = await response.json();
                if (response.ok) {
                    // Update the local storage and global variable to reflect the change
                    currentUser.username = newUsername;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                    showNotification(result.message);
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                showNotification('An error occurred while updating the profile.', true);
            }
        });
    }

    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            const classroomName = newClassroomNameInput.value.trim();
            if (!classroomName) {
                displayMessage(classroomMessage, "Classroom name cannot be empty.", true);
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
                    newClassroomNameInput.value = '';
                    loadAvailableClassrooms();
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                displayMessage(classroomMessage, 'An error occurred.', true);
            }
        });
    }

    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadAvailableClassrooms);
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
            // Ensure the canvas is correctly sized and history is loaded on switch
            resizeCanvas();
            fetchWhiteboardHistory();
        });
    }

    if (navLibrary) {
        navLibrary.addEventListener('click', () => {
            showClassroomSubSection(librarySection);
            updateNavActiveState(navLibrary);
            loadLibraryFiles();
        });
    }

    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (!currentClassroom) {
                showNotification('Please enter a classroom first.', true);
                return;
            }
            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification('Please select at least one file to upload.', true);
                return;
            }

            const formData = new FormData();
            for (const file of files) {
                formData.append('files', file);
            }
            formData.append('classroomId', currentClassroom.id);

            try {
                const response = await fetch('/api/upload-library-files', {
                    method: 'POST',
                    body: formData,
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
                console.error('Error uploading files:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }

    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }

    // New Assessment Listeners
    if (navAssessments) {
        navAssessments.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            updateNavActiveState(navAssessments);
            // Hide the creation form, show the list
            if (assessmentCreationForm) assessmentCreationForm.classList.add('hidden');
            if (assessmentListContainer) assessmentListContainer.classList.remove('hidden');
            if (takeAssessmentContainer) takeAssessmentContainer.classList.add('hidden');
            if (viewSubmissionsContainer) viewSubmissionsContainer.classList.add('hidden');
            loadAssessments();
        });
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            addQuestionInput();
            updateQuestionNumbers();
        });
    }

    if (assessmentCreationForm) {
        assessmentCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentClassroom) {
                showNotification('Please enter a classroom first.', true);
                return;
            }
            const title = assessmentTitleInput.value;
            const description = assessmentDescriptionTextarea.value;
            const scheduledAt = assessmentScheduledAtInput.value; // ISO format string
            const durationMinutes = assessmentDurationMinutesInput.value;
            const questions = [];

            let hasError = false;
            document.querySelectorAll('.question-input-group').forEach((group, index) => {
                const questionText = group.querySelector('.question-text').value;
                const options = Array.from(group.querySelectorAll('.option-input')).map(input => input.value);
                const correctAnswer = group.querySelector('.correct-answer-select').value;

                if (!questionText || options.some(opt => !opt) || !correctAnswer) {
                    showNotification(`Question ${index + 1} is incomplete.`, true);
                    hasError = true;
                }
                questions.push({
                    text: questionText,
                    options: options,
                    correct_answer: correctAnswer
                });
            });

            if (hasError) return;

            try {
                const response = await fetch('/api/assessments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        classroomId: currentClassroom.id,
                        title,
                        description,
                        scheduled_at: scheduledAt,
                        duration_minutes: parseInt(durationMinutes),
                        questions
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    assessmentCreationForm.reset();
                    questionsContainer.innerHTML = '';
                    loadAssessments();
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                showNotification('An error occurred while creating the assessment.', true);
            }
        });
    }

    // Delegate event listener for dynamically created buttons
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('take-assessment-btn')) {
            const assessmentId = e.target.dataset.assessmentId;
            try {
                const response = await fetch(`/api/assessments/${assessmentId}`);
                if (!response.ok) {
                    throw new Error('Assessment not found');
                }
                const assessmentData = await response.json();
                currentAssessmentToTake = assessmentData;
                takeAssessmentTitle.textContent = assessmentData.title;
                takeAssessmentDescription.textContent = assessmentData.description;
                renderAssessmentQuestions(assessmentData.questions);
                showClassroomSubSection(assessmentsSection); // Stay in assessments section
                assessmentListContainer.classList.add('hidden');
                takeAssessmentContainer.classList.remove('hidden');

                // Start the timer
                if (assessmentData.scheduled_at) {
                    const scheduledTime = new Date(assessmentData.scheduled_at).getTime();
                    const duration = assessmentData.duration_minutes * 60 * 1000;
                    assessmentEndTime = new Date(scheduledTime + duration);
                    startAssessmentTimer();
                } else {
                    assessmentTimerDisplay.textContent = 'Time limit not set.';
                }

            } catch (error) {
                console.error('Error fetching assessment:', error);
                showNotification('Failed to load assessment details.', true);
            }
        } else if (e.target.classList.contains('view-submissions-btn')) {
            const assessmentId = e.target.dataset.assessmentId;
            try {
                const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
                if (!response.ok) {
                    throw new Error('Submissions not found');
                }
                const submissions = await response.json();
                submissionsAssessmentTitle.textContent = submissions.title;
                renderSubmissions(submissions.submissions);
                showClassroomSubSection(assessmentsSection);
                assessmentListContainer.classList.add('hidden');
                viewSubmissionsContainer.classList.remove('hidden');
            } catch (error) {
                console.error('Error fetching submissions:', error);
                showNotification('Failed to load submissions.', true);
            }
        }
    });

    function renderAssessmentQuestions(questions) {
        takeAssessmentForm.innerHTML = ''; // Clear previous questions
        questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'take-assessment-question';
            questionDiv.innerHTML = `
                <p><strong>${index + 1}.</strong> ${q.text}</p>
                <ul class="options-list">
                    ${q.options.map((option, optIndex) => `
                        <li>
                            <input type="radio" id="q${index}-opt${optIndex}" name="q${index}" value="${String.fromCharCode(65 + optIndex)}">
                            <label for="q${index}-opt${optIndex}">${String.fromCharCode(65 + optIndex)}. ${option}</label>
                        </li>
                    `).join('')}
                </ul>
            `;
            takeAssessmentForm.appendChild(questionDiv);
        });
    }

    function renderSubmissions(submissions) {
        submissionsList.innerHTML = '';
        if (submissions.length === 0) {
            submissionsList.innerHTML = '<p>No submissions yet.</p>';
            return;
        }
        submissions.forEach(sub => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${sub.username}</strong> submitted on ${new Date(sub.submitted_at).toLocaleString()}
                <br>
                Score: ${sub.score}/${sub.total_questions}
            `;
            // Add more detailed view of answers if needed
            submissionsList.appendChild(li);
        });
    }

    function startAssessmentTimer() {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }

        const updateTimer = () => {
            const now = new Date();
            const timeLeft = assessmentEndTime - now;

            if (timeLeft <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = 'Time\'s up!';
                assessmentTimerDisplay.classList.remove('active', 'warning');
                assessmentTimerDisplay.classList.add('critical');
                showNotification('Time\'s up! Your assessment has been automatically submitted.', true);
                submitAnswers(true); // Auto-submit
                return;
            }

            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            const hours = Math.floor((timeLeft / (1000 * 60 * 60)));

            const formatTime = (time) => time < 10 ? `0${time}` : time;
            assessmentTimerDisplay.textContent = `Time Left: ${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
            assessmentTimerDisplay.classList.add('active');
            if (timeLeft < 5 * 60 * 1000) { // 5 minutes warning
                assessmentTimerDisplay.classList.add('warning');
            }
        };

        assessmentTimerInterval = setInterval(updateTimer, 1000);
        updateTimer(); // Initial call to display immediately
    }

    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', () => submitAnswers(false));
    }

    async function submitAnswers(isAutoSubmit) {
        if (!currentAssessmentToTake) return;

        const answers = {};
        let totalAnswered = 0;
        const totalQuestions = currentAssessmentToTake.questions.length;

        // Get all questions from the form
        document.querySelectorAll('.take-assessment-question').forEach((qDiv, index) => {
            const selectedOption = qDiv.querySelector(`input[name="q${index}"]:checked`);
            if (selectedOption) {
                answers[index] = selectedOption.value;
                totalAnswered++;
            }
        });

        // Prompt user for confirmation if not auto-submitting
        if (!isAutoSubmit) {
            const confirmation = confirm(`You have answered ${totalAnswered} out of ${totalQuestions} questions. Are you sure you want to submit?`);
            if (!confirmation) {
                return;
            }
        }

        try {
            const response = await fetch('/api/assessments/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: currentAssessmentToTake.id,
                    answers: answers,
                    classroomId: currentClassroom.id
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                takeAssessmentContainer.classList.add('hidden');
                assessmentListContainer.classList.remove('hidden');
                loadAssessments();
                if (assessmentTimerInterval) {
                    clearInterval(assessmentTimerInterval);
                }
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error submitting answers:', error);
            showNotification('An error occurred while submitting your answers.', true);
        }
    }

    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            takeAssessmentContainer.classList.add('hidden');
            assessmentListContainer.classList.remove('hidden');
            if (assessmentTimerInterval) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
            }
        });
    }

    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            viewSubmissionsContainer.classList.add('hidden');
            assessmentListContainer.classList.remove('hidden');
        });
    }

    if (assessmentSearchInput) {
        assessmentSearchInput.addEventListener('input', loadAssessments);
    }

    // New Broadcast Listeners
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }

    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }


    // Function to handle share link generation and copy
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            if (currentClassroom) {
                shareLinkInput.value = `${window.location.origin}/classroom/${currentClassroom.id}`;
                shareLinkDisplay.classList.remove('hidden');
                shareLinkInput.select();
                document.execCommand('copy');
                showNotification("Share link copied to clipboard!");
            }
        });
    }


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
    checkLoginStatus();
});
