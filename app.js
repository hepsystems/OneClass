// app.js (Complete Rewrite with Bidirectional Video Conference and existing features)

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
    const classroomSearchInput = document.getElementById('classroom-search-input');

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

    const notificationsContainer = document.getElementById('notifications-container');


    // --- Global Variables ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentAssessmentToTake = null;
    let assessmentTimerInterval = null;
    let assessmentEndTime = null;

    // WebRTC Variables
    let localStream;
    let broadcastMode = 'one-way'; // Default mode
    const peerConnections = {};
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
        ]
    };

    // Whiteboard Variables
    let whiteboardCtx;
    let currentColor = colorPicker ? colorPicker.value : '#FF0000';
    let currentBrushSize = brushSizeSlider ? parseInt(brushSizeSlider.value) : 5;
    let currentTool = 'pen';
    let snapshot;

    // Whiteboard History (Multi-page)
    let whiteboardPages = [
        []
    ];
    let currentPageIndex = 0;
    const undoStack = [];
    const redoStack = [];
    const MAX_HISTORY_STEPS = 50;

    // Video Zoom States
    const videoZoomStates = new Map();


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
            }, 5000);
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

            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                const idFromUrl = pathParts[2];
                fetch(`/api/classrooms`)
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
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    classroomId: id
                                })
                            });
                            const result = await response.json();
                            if (response.ok) {
                                showNotification(result.message);
                                loadAvailableClassrooms();
                                enterClassroom(id, name);
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
        currentClassroom = {
            id: id,
            name: name
        };
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
        setupChatControls();

        if (currentUser && currentUser.role === 'admin') {
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
            broadcastTypeRadios.forEach(radio => radio.parentElement.classList.remove('hidden'));
        } else {
            startBroadcastBtn.classList.add('hidden');
            endBroadcastBtn.classList.add('hidden');
            broadcastTypeRadios.forEach(radio => radio.parentElement.classList.add('hidden'));
        }

        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';

        loadAssessments();
        loadLibraryFiles();
        fetchWhiteboardHistory();
    }

    /**
     * Cleans up classroom-related resources when leaving a classroom.
     */
    function cleanupClassroomResources() {
        if (socket && currentClassroom && currentClassroom.id) {
            socket.emit('leave', {
                'classroomId': currentClassroom.id
            });
            socket.disconnect();
            socket = null;
        } else if (socket) {
            socket.disconnect();
            socket = null;
        }
        endBroadcast();

        if (whiteboardCtx && whiteboardCanvas) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000';
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        whiteboardPages = [
            []
        ];
        currentPageIndex = 0;
        undoStack.length = 0;
        redoStack.length = 0;
        updateUndoRedoButtons();
        updateWhiteboardPageDisplay();

        if (chatMessages) chatMessages.innerHTML = '';
        if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';

        currentClassroom = null;
        localStorage.removeItem('currentClassroom');

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
            } else {
                console.error('[Socket.IO] Cannot join classroom: currentClassroom.id is undefined.');
                showNotification("Error: Could not join classroom.", true);
            }
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO] Disconnected');
            showNotification("Disconnected from classroom.", true);
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
            if (data.message.includes('library')) {
                loadLibraryFiles();
            }
            if (data.message.includes('assessment')) {
                loadAssessments();
            }
        });

        socket.on('message', (data) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message-item');

            const currentUserId = sessionStorage.getItem('user_id');
            if (data.user_id === currentUserId) {
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
            messageElement.innerHTML = `<span class="chat-sender-name">${senderDisplayName}</span> <span class="chat-timestamp">(${formattedDateTime}):</span> ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('chat_history', (history) => {
            chatMessages.innerHTML = '';
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('chat-message-item');

                const currentUserId = sessionStorage.getItem('user_id');
                if (msg.user_id === currentUserId) {
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

            if (localStream && localStream.active && data.sid !== socket.id) {
                // Determine if we need to initiate an offer based on the broadcast mode
                const isAdminAndBroadcastingOneWay = currentUser && currentUser.role === 'admin' && broadcastMode === 'one-way';
                const isBidirectionalConference = broadcastMode === 'bidirectional';

                if (isAdminAndBroadcastingOneWay || isBidirectionalConference) {
                    console.log(`[WebRTC] Initiating connection for new peer: ${data.sid} in mode: ${broadcastMode}`);
                    createPeerConnection(data.sid, true, data.username);
                }
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
                const drawingItem = data.data;
                const pageIndex = data.pageIndex;
                if (!whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                whiteboardPages[pageIndex].push(drawingItem);
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.save();
                    applyDrawingProperties(drawingItem.tool, drawingItem.color, drawingItem.width);
                    drawWhiteboardItem(drawingItem);
                    whiteboardCtx.restore();
                }
            } else if (data.action === 'clear') {
                const pageIndex = data.pageIndex;
                if (whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000';
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCtx.height);
                }
            } else if (data.action === 'history' && data.history) {
                whiteboardPages = data.history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [
                        []
                    ];
                }
                currentPageIndex = 0;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
            }
        });

        socket.on('whiteboard_page_change', (data) => {
            const {
                newPageIndex
            } = data;
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
            const peerUsername = data.username || `Peer ${peerId.substring(0, 4)}`;
            if (!peerConnections[peerId]) {
                createPeerConnection(peerId, false, peerUsername);
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
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        });

        socket.on('assessment_started', (data) => {
            if (currentAssessmentToTake && currentAssessmentToTake.id === data.assessmentId) {
                showNotification(`Assessment "${data.title}" has started!`);
                startAssessmentTimer(new Date(data.endTime));
            }
        });

        socket.on('submission_marked', (data) => {
            if (currentUser && currentUser.id === data.studentId) {
                showNotification(`Your assessment "${data.assessmentTitle}" has been marked!`);
            }
        });

        socket.on('file_deleted', (data) => {
            showNotification(`File "${data.fileName}" was deleted from the library.`);
            loadLibraryFiles();
        });

        socket.on('webrtc_mode_change', (data) => {
            broadcastMode = data.mode;
            showNotification(`Video mode changed to: ${broadcastMode}`);
            if (broadcastMode === 'one-way') {
                endBroadcast();
            }
        });
    }

    // --- WebRTC Functions (Updated for Bidirectional) ---

    /**
     * Creates a new RTCPeerConnection for a given peer.
     * @param {string} peerId - The socket ID of the remote peer.
     * @param {boolean} isCaller - True if this peer is initiating the call (creating the offer).
     * @param {string} peerUsername - The username of the remote peer.
     */
    function createPeerConnection(peerId, isCaller, peerUsername) {
        if (peerConnections[peerId]) {
            console.log(`[WebRTC] Peer connection for ${peerId} already exists. Returning.`);
            return;
        }

        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;
        console.log(`[WebRTC] Created new RTCPeerConnection for peer: ${peerId}`);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    candidate: event.candidate,
                    sender_id: socket.id
                });
            }
        };

        // Handle new remote streams
        pc.ontrack = (event) => {
            console.log(`[WebRTC] Received remote stream from peer: ${peerId}`);
            if (event.streams && event.streams[0]) {
                attachMediaStream(event.streams[0], peerId, peerUsername);
            }
        };

        // Add local tracks to the connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        if (isCaller) {
            // Create an offer if this peer is the caller
            pc.onnegotiationneeded = async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('webrtc_offer', {
                        classroomId: currentClassroom.id,
                        recipient_id: peerId,
                        offer: pc.localDescription,
                        username: currentUser.username,
                        sender_id: socket.id
                    });
                    console.log(`[WebRTC] Sent WebRTC Offer to: ${peerId} from ${socket.id}`);
                } catch (error) {
                    console.error('[WebRTC] Error creating or sending offer:', error);
                }
            };
        }
    }

    /**
     * Attaches a remote media stream to a new video element.
     * @param {MediaStream} stream - The remote media stream.
     * @param {string} peerId - The ID of the peer providing the stream.
     * @param {string} peerUsername - The username of the peer.
     */
    function attachMediaStream(stream, peerId, peerUsername) {
        if (!remoteVideoContainer) return;

        // Check if video for this peer already exists
        let videoElement = document.getElementById(`remote-video-${peerId}`);
        let videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
        if (!videoElement) {
            videoWrapper = document.createElement('div');
            videoWrapper.id = `video-wrapper-${peerId}`;
            videoWrapper.className = 'remote-video-wrapper';

            const usernameTag = document.createElement('span');
            usernameTag.className = 'video-username-tag';
            usernameTag.textContent = peerUsername;

            videoElement = document.createElement('video');
            videoElement.id = `remote-video-${peerId}`;
            videoElement.autoplay = true;
            videoElement.playsInline = true;

            videoWrapper.appendChild(videoElement);
            videoWrapper.appendChild(usernameTag);
            remoteVideoContainer.appendChild(videoWrapper);

            // Re-initialize the zoom functionality for the new video element
            initializeZoomableVideo(videoElement, videoWrapper);
        }

        // Check if the stream is already attached
        if (!videoElement.srcObject || videoElement.srcObject.id !== stream.id) {
            videoElement.srcObject = stream;
            console.log(`[WebRTC] Attached new stream to video element for peer: ${peerId}`);
        }
    }

    /**
     * Starts the one-way broadcast from the admin's device.
     */
    async function startOneWayBroadcast() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            localStream = stream;
            localVideo.srcObject = stream;
            localVideoContainer.classList.remove('hidden');

            // Signal other users to prepare for broadcast
            socket.emit('start_broadcast', {
                classroomId: currentClassroom.id
            });

            // Start peer connections for existing users
            await fetchConnectedUsersAndCreateOffers();

            showNotification("One-way broadcast started. Others can now view your stream.");
        } catch (error) {
            console.error('[WebRTC] Error starting broadcast:', error);
            showNotification('Error starting broadcast. Please check your camera/mic permissions.', true);
        }
    }

    /**
     * Starts the bidirectional conference mode.
     */
    async function startBidirectionalConference() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            localStream = stream;
            localVideo.srcObject = stream;
            localVideoContainer.classList.remove('hidden');

            // Signal mode change to all users
            socket.emit('change_webrtc_mode', {
                classroomId: currentClassroom.id,
                mode: 'bidirectional'
            });

            // Admin initiates connection with all other users
            await fetchConnectedUsersAndCreateOffers();

            showNotification("Bidirectional conference started. You can now see and be seen by other users.");

        } catch (error) {
            console.error('[WebRTC] Error starting conference:', error);
            showNotification('Error starting conference. Please check your camera/mic permissions.', true);
        }
    }

    /**
     * Fetches the list of connected users and creates a peer connection offer for each.
     */
    async function fetchConnectedUsersAndCreateOffers() {
        if (!currentClassroom || !socket) return;
        try {
            const response = await fetch(`/api/users-in-classroom/${currentClassroom.id}`);
            const {
                users
            } = await response.json();
            const otherUsers = users.filter(user => user.sid !== socket.id);
            for (const user of otherUsers) {
                console.log(`[WebRTC] Found user in room: ${user.sid} (${user.username}). Creating peer connection.`);
                createPeerConnection(user.sid, true, user.username);
            }
        } catch (error) {
            console.error('[WebRTC] Failed to fetch users for peer connections:', error);
        }
    }

    /**
     * Stops the local media stream and closes all peer connections.
     */
    function endBroadcast() {
        // Stop local stream tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        // Hide local video container and reset srcObject
        if (localVideo) {
            localVideo.srcObject = null;
            localVideoContainer.classList.add('hidden');
        }

        // Signal other users about the disconnection
        if (socket && currentClassroom) {
            socket.emit('end_broadcast', {
                classroomId: currentClassroom.id
            });
            socket.emit('change_webrtc_mode', {
                classroomId: currentClassroom.id,
                mode: 'one-way'
            });
        }

        // Close all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                // Also remove the corresponding video element
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        }

        showNotification("Video broadcast ended.");
        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;
    }


    // --- UI Listeners and Handlers ---

    // Auth forms
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            const result = await response.json();
            if (response.ok) {
                currentUser = result.user;
                sessionStorage.setItem('user_id', currentUser.id);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showNotification("Login successful!");
                checkLoginStatus();
            } else {
                displayMessage(authMessage, result.error, true);
            }
        } catch (error) {
            console.error('Login error:', error);
            displayMessage(authMessage, 'An error occurred during login.', true);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;
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
            if (response.ok) {
                displayMessage(authMessage, "Registration successful! You can now log in.", false);
                loginContainer.classList.remove('hidden');
                registerContainer.classList.add('hidden');
                document.getElementById('login-email').value = email;
            } else {
                displayMessage(authMessage, result.error, true);
            }
        } catch (error) {
            console.error('Registration error:', error);
            displayMessage(authMessage, 'An error occurred during registration.', true);
        }
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        currentClassroom = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentClassroom');
        sessionStorage.removeItem('user_id');
        cleanupClassroomResources();
        showNotification("You have been logged out.", false);
        checkLoginStatus();
    });

    // Dashboard
    createClassroomBtn.addEventListener('click', async () => {
        const classroomName = newClassroomNameInput.value.trim();
        if (!classroomName) {
            displayMessage(classroomMessage, "Classroom name cannot be empty.", true);
            return;
        }

        try {
            const response = await fetch('/api/create-classroom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: classroomName
                })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(classroomMessage, "Classroom created successfully!", false);
                newClassroomNameInput.value = '';
                loadAvailableClassrooms();
            } else {
                displayMessage(classroomMessage, result.error, true);
            }
        } catch (error) {
            console.error('Error creating classroom:', error);
            displayMessage(classroomMessage, "An error occurred.", true);
        }
    });

    classroomSearchInput.addEventListener('input', loadAvailableClassrooms);

    // Classroom Navigation
    backToDashboardBtn.addEventListener('click', () => {
        cleanupClassroomResources();
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadAvailableClassrooms();
    });

    navDashboard.addEventListener('click', () => {
        cleanupClassroomResources();
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadAvailableClassrooms();
    });

    navSettings.addEventListener('click', () => {
        showSection(settingsSection);
        updateNavActiveState(navSettings);
        if (currentUser) {
            settingsUsernameInput.value = currentUser.username;
            settingsEmailInput.value = currentUser.email;
        }
    });

    backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
    });

    navChat.addEventListener('click', () => {
        showClassroomSubSection(chatSection);
        updateNavActiveState(navChat);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    navWhiteboard.addEventListener('click', () => {
        showClassroomSubSection(whiteboardArea);
        updateNavActiveState(navWhiteboard);
        renderCurrentWhiteboardPage();
    });

    navLibrary.addEventListener('click', () => {
        showClassroomSubSection(librarySection);
        updateNavActiveState(navLibrary);
    });

    navAssessments.addEventListener('click', () => {
        showClassroomSubSection(assessmentsSection);
        updateNavActiveState(navAssessments);
        loadAssessments();
    });

    // Share Link
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select();
            shareLinkInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
            showNotification('Classroom link copied to clipboard!');
        });
    }

    // Chat
    sendMessageBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message && socket && currentClassroom) {
            socket.emit('message', {
                classroomId: currentClassroom.id,
                message: message
            });
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageBtn.click();
        }
    });

    // Whiteboard
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) return;

        const canvas = whiteboardCanvas;
        const ctx = canvas.getContext('2d');
        whiteboardCtx = ctx;

        // Set initial canvas size and background
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        whiteboardCtx.fillStyle = '#000000';
        whiteboardCtx.fillRect(0, 0, canvas.width, canvas.height);

        // Drawing state
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;
        let lastTimestamp = 0; // For rate limiting

        function recordDrawingItem(item) {
            whiteboardPages[currentPageIndex].push(item);
            if (socket) {
                socket.emit('whiteboard_data', {
                    classroomId: currentClassroom.id,
                    action: 'draw',
                    pageIndex: currentPageIndex,
                    data: item
                });
            }
            undoStack.push(item);
            redoStack.length = 0; // Clear redo stack on new action
            updateUndoRedoButtons();
            // Prune undo stack if it gets too large
            if (undoStack.length > MAX_HISTORY_STEPS) {
                undoStack.shift();
            }
        }

        function drawLine(x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        function drawRectangle(x1, y1, x2, y2) {
            ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
        }

        function drawCircle(x1, y1, x2, y2) {
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            ctx.beginPath();
            ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        // Mouse and touch event listeners
        canvas.addEventListener('mousedown', (e) => {
            if (currentUser.role !== 'admin') return;
            isDrawing = true;
            const {
                offsetX,
                offsetY
            } = e;
            [lastX, lastY] = [offsetX, offsetY];
            lastTimestamp = Date.now();
            if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
                snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDrawing || currentUser.role !== 'admin') return;

            const now = Date.now();
            if (now - lastTimestamp < 16) return; // Rate limit drawing to ~60fps

            const {
                offsetX,
                offsetY
            } = e;
            ctx.lineWidth = currentBrushSize;
            ctx.strokeStyle = currentColor;
            ctx.fillStyle = currentColor;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (currentTool === 'pen' || currentTool === 'eraser') {
                if (currentTool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                }
                drawLine(lastX, lastY, offsetX, offsetY);
                recordDrawingItem({
                    type: 'line',
                    tool: currentTool,
                    start: {
                        x: lastX,
                        y: lastY
                    },
                    end: {
                        x: offsetX,
                        y: offsetY
                    },
                    color: currentColor,
                    width: currentBrushSize,
                    pageIndex: currentPageIndex
                });
                [lastX, lastY] = [offsetX, offsetY];
            } else if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
                ctx.putImageData(snapshot, 0, 0);
                if (currentTool === 'rectangle') {
                    drawRectangle(lastX, lastY, offsetX, offsetY);
                } else if (currentTool === 'circle') {
                    drawCircle(lastX, lastY, offsetX, offsetY);
                } else if (currentTool === 'line') {
                    drawLine(lastX, lastY, offsetX, offsetY);
                }
            }
            lastTimestamp = now;
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!isDrawing || currentUser.role !== 'admin') return;
            isDrawing = false;
            const {
                offsetX,
                offsetY
            } = e;
            if (currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
                ctx.putImageData(snapshot, 0, 0); // Redraw the snapshot before the final shape
                let item = {
                    type: 'shape',
                    tool: currentTool,
                    start: {
                        x: lastX,
                        y: lastY
                    },
                    end: {
                        x: offsetX,
                        y: offsetY
                    },
                    color: currentColor,
                    width: currentBrushSize,
                    pageIndex: currentPageIndex
                };
                drawWhiteboardItem(item); // Draw the final shape
                recordDrawingItem(item); // Record to history and send to server
                snapshot = null;
            }
        });

        canvas.addEventListener('mouseout', () => {
            isDrawing = false;
        });

        // Tool button listeners
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentTool = button.dataset.tool;
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
        document.querySelector('.tool-button[data-tool="pen"]').click();

        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => currentColor = e.target.value);
        }
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', (e) => currentBrushSize = parseInt(e.target.value));
        }

        if (undoButton) {
            undoButton.addEventListener('click', () => {
                if (undoStack.length > 0) {
                    const lastAction = undoStack.pop();
                    redoStack.push(lastAction);
                    // Update the server's history by re-sending a full history of the current page
                    // This is inefficient but simple for a single user's actions
                    const pageHistory = whiteboardPages[currentPageIndex];
                    if (pageHistory.length > 0) {
                        pageHistory.pop();
                        // This logic assumes a single user is drawing at a time.
                        // A more robust solution would involve server-side action history management.
                    }
                    socket.emit('whiteboard_data', {
                        classroomId: currentClassroom.id,
                        action: 'history',
                        history: whiteboardPages
                    });
                    renderCurrentWhiteboardPage();
                    updateUndoRedoButtons();
                }
            });
        }

        if (redoButton) {
            redoButton.addEventListener('click', () => {
                if (redoStack.length > 0) {
                    const nextAction = redoStack.pop();
                    whiteboardPages[currentPageIndex].push(nextAction);
                    undoStack.push(nextAction);
                    socket.emit('whiteboard_data', {
                        classroomId: currentClassroom.id,
                        action: 'history',
                        history: whiteboardPages
                    });
                    renderCurrentWhiteboardPage();
                    updateUndoRedoButtons();
                }
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', () => {
                whiteboardCtx.clearRect(0, 0, canvas.width, canvas.height);
                whiteboardCtx.fillStyle = '#000000';
                whiteboardCtx.fillRect(0, 0, canvas.width, canvas.height);
                undoStack.length = 0;
                redoStack.length = 0;
                updateUndoRedoButtons();
                socket.emit('whiteboard_data', {
                    classroomId: currentClassroom.id,
                    action: 'clear',
                    pageIndex: currentPageIndex
                });
                whiteboardPages[currentPageIndex] = [];
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `whiteboard-page-${currentPageIndex + 1}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    }

    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx || !whiteboardCanvas) return;
        const pageContent = whiteboardPages[currentPageIndex];
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        pageContent.forEach(item => {
            whiteboardCtx.save();
            whiteboardCtx.strokeStyle = item.color;
            whiteboardCtx.lineWidth = item.width;
            whiteboardCtx.fillStyle = item.color;
            whiteboardCtx.lineCap = 'round';
            whiteboardCtx.lineJoin = 'round';
            if (item.tool === 'eraser') {
                whiteboardCtx.globalCompositeOperation = 'destination-out';
            } else {
                whiteboardCtx.globalCompositeOperation = 'source-over';
            }
            drawWhiteboardItem(item);
            whiteboardCtx.restore();
        });
        updateWhiteboardPageDisplay();
    }

    function drawWhiteboardItem(item) {
        if (item.type === 'line') {
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(item.start.x, item.start.y);
            whiteboardCtx.lineTo(item.end.x, item.end.y);
            whiteboardCtx.stroke();
        } else if (item.type === 'shape') {
            if (item.tool === 'rectangle') {
                whiteboardCtx.strokeRect(Math.min(item.start.x, item.end.x), Math.min(item.start.y, item.end.y), Math.abs(item.end.x - item.start.x), Math.abs(item.end.y - item.start.y));
            } else if (item.tool === 'circle') {
                const radius = Math.sqrt(Math.pow(item.end.x - item.start.x, 2) + Math.pow(item.end.y - item.start.y, 2));
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(item.start.x, item.start.y, radius, 0, 2 * Math.PI);
                whiteboardCtx.stroke();
            } else if (item.tool === 'line') {
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.start.x, item.start.y);
                whiteboardCtx.lineTo(item.end.x, item.end.y);
                whiteboardCtx.stroke();
            }
        }
    }

    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
            nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1;
        }
    }

    function updateUndoRedoButtons() {
        if (undoButton) {
            undoButton.disabled = undoStack.length === 0;
        }
        if (redoButton) {
            redoButton.disabled = redoStack.length === 0;
        }
    }

    if (prevWhiteboardPageBtn) {
        prevWhiteboardPageBtn.addEventListener('click', () => {
            if (currentPageIndex > 0) {
                currentPageIndex--;
                fetchWhiteboardHistory(currentPageIndex);
            }
        });
    }

    if (nextWhiteboardPageBtn) {
        nextWhiteboardPageBtn.addEventListener('click', () => {
            if (currentPageIndex < whiteboardPages.length - 1) {
                currentPageIndex++;
            } else {
                whiteboardPages.push([]); // Add a new page
                currentPageIndex = whiteboardPages.length - 1;
            }
            fetchWhiteboardHistory(currentPageIndex);
        });
    }

    // Fetches the entire whiteboard history from the server
    async function fetchWhiteboardHistory() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/whiteboard-history/${currentClassroom.id}`);
            const data = await response.json();
            if (response.ok) {
                whiteboardPages = data.history;
                if (!whiteboardPages || whiteboardPages.length === 0) {
                    whiteboardPages = [
                        []
                    ];
                }
                if (currentPageIndex >= whiteboardPages.length) {
                    currentPageIndex = whiteboardPages.length - 1;
                }
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                showNotification("Whiteboard history loaded.");
            } else {
                showNotification(data.error || "Failed to load whiteboard history.", true);
            }
        } catch (error) {
            console.error('Error fetching whiteboard history:', error);
            showNotification("Failed to load whiteboard history.", true);
        }
    }

    // Video Broadcast
    startBroadcastBtn.addEventListener('click', async () => {
        const selectedMode = document.querySelector('input[name="broadcastType"]:checked').value;
        if (selectedMode === 'one-way') {
            await startOneWayBroadcast();
        } else if (selectedMode === 'bidirectional') {
            await startBidirectionalConference();
        }
        startBroadcastBtn.disabled = true;
        endBroadcastBtn.disabled = false;
    });

    endBroadcastBtn.addEventListener('click', () => {
        endBroadcast();
        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;
    });

    // Library
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification('Please select files to upload.', true);
                return;
            }
            const formData = new FormData();
            for (const file of files) {
                formData.append('files', file);
            }
            formData.append('classroomId', currentClassroom.id);
            try {
                const response = await fetch('/api/upload-files', {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    libraryFileInput.value = '';
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

    async function loadLibraryFiles() {
        if (!currentClassroom) return;
        try {
            const searchTerm = librarySearchInput ? librarySearchInput.value.toLowerCase() : '';
            const response = await fetch(`/api/library/${currentClassroom.id}`);
            const files = await response.json();
            if (libraryFilesList) {
                libraryFilesList.innerHTML = '';
                const filteredFiles = files.filter(file => file.fileName.toLowerCase().includes(searchTerm));
                if (filteredFiles.length === 0) {
                    libraryFilesList.innerHTML = '<li>No files found.</li>';
                    return;
                }
                filteredFiles.forEach(file => {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `/api/download/${file.fileName}?classroomId=${currentClassroom.id}`;
                    link.textContent = file.fileName;
                    link.download = file.fileName;
                    li.appendChild(link);
                    if (currentUser && currentUser.role === 'admin') {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.classList.add('delete-btn');
                        deleteBtn.addEventListener('click', async () => {
                            if (confirm(`Are you sure you want to delete ${file.fileName}?`)) {
                                try {
                                    const deleteResponse = await fetch('/api/delete-file', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            classroomId: currentClassroom.id,
                                            fileName: file.fileName
                                        })
                                    });
                                    const deleteResult = await deleteResponse.json();
                                    if (deleteResponse.ok) {
                                        showNotification(deleteResult.message);
                                        loadLibraryFiles();
                                    } else {
                                        showNotification(deleteResult.error, true);
                                    }
                                } catch (error) {
                                    console.error('File deletion error:', error);
                                    showNotification('An error occurred during file deletion.', true);
                                }
                            }
                        });
                        li.appendChild(deleteBtn);
                    }
                    libraryFilesList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            if (libraryFilesList) libraryFilesList.innerHTML = '<li>Failed to load files.</li>';
        }
    }

    // Assessments
    function loadAssessments() {
        if (!currentClassroom) return;

        const assessmentSearchTerm = assessmentSearchInput.value.toLowerCase();

        fetch(`/api/assessments/${currentClassroom.id}`)
            .then(res => res.json())
            .then(assessments => {
                if (assessmentListDiv) {
                    assessmentListDiv.innerHTML = '';
                    const filteredAssessments = assessments.filter(a => a.title.toLowerCase().includes(assessmentSearchTerm));

                    if (filteredAssessments.length === 0) {
                        assessmentListDiv.innerHTML = '<p>No assessments found.</p>';
                        return;
                    }

                    filteredAssessments.forEach(assessment => {
                        const assessmentItem = document.createElement('div');
                        assessmentItem.classList.add('assessment-item');

                        const titleEl = document.createElement('h4');
                        titleEl.textContent = assessment.title;
                        assessmentItem.appendChild(titleEl);

                        const actionsDiv = document.createElement('div');
                        actionsDiv.classList.add('assessment-actions');

                        const takeBtn = document.createElement('button');
                        takeBtn.textContent = 'Take';
                        takeBtn.classList.add('btn-primary');
                        takeBtn.addEventListener('click', () => showTakeAssessmentForm(assessment));
                        actionsDiv.appendChild(takeBtn);

                        if (currentUser && currentUser.role === 'admin') {
                            const startBtn = document.createElement('button');
                            startBtn.textContent = 'Start';
                            startBtn.classList.add('btn-success');
                            startBtn.addEventListener('click', () => startAssessment(assessment));
                            actionsDiv.appendChild(startBtn);

                            const submissionsBtn = document.createElement('button');
                            submissionsBtn.textContent = 'Submissions';
                            submissionsBtn.classList.add('btn-secondary');
                            submissionsBtn.addEventListener('click', () => viewSubmissions(assessment));
                            actionsDiv.appendChild(submissionsBtn);
                        }

                        assessmentItem.appendChild(actionsDiv);
                        assessmentListDiv.appendChild(assessmentItem);
                    });
                }
            })
            .catch(err => {
                console.error('Error loading assessments:', err);
                if (assessmentListDiv) assessmentListDiv.innerHTML = '<p>Failed to load assessments.</p>';
            });
    }

    function showTakeAssessmentForm(assessment) {
        currentAssessmentToTake = assessment;
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden');
        takeAssessmentTitle.textContent = assessment.title;
        takeAssessmentDescription.textContent = assessment.description;

        takeAssessmentForm.innerHTML = '';
        assessment.questions.forEach((q, qIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('assessment-question');
            questionDiv.innerHTML = `<p><strong>${qIndex + 1}. ${q.question}</strong></p>`;
            if (q.type === 'multiple_choice') {
                q.options.forEach((option, oIndex) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.innerHTML = `
                        <input type="radio" id="q${qIndex}o${oIndex}" name="question_${qIndex}" value="${option}">
                        <label for="q${qIndex}o${oIndex}">${option}</label>
                    `;
                    questionDiv.appendChild(optionDiv);
                });
            } else if (q.type === 'short_answer') {
                const answerInput = document.createElement('textarea');
                answerInput.name = `question_${qIndex}`;
                answerInput.placeholder = 'Your answer here...';
                questionDiv.appendChild(answerInput);
            }
            takeAssessmentForm.appendChild(questionDiv);
        });

        // Check if the assessment is already in progress and resume the timer
        if (assessment.active && assessment.endTime) {
            startAssessmentTimer(new Date(assessment.endTime));
        } else {
            // Assessment hasn't started yet, display waiting message
            assessmentTimerDisplay.textContent = 'Waiting for admin to start assessment...';
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        }
    }

    function startAssessmentTimer(endTime) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }
        assessmentEndTime = endTime;
        assessmentTimerDisplay.classList.add('active');

        assessmentTimerInterval = setInterval(() => {
            const now = new Date();
            const timeLeft = assessmentEndTime - now;

            if (timeLeft <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = 'Time Left: 00:00:00';
                assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
                showNotification('Time is up! Submitting your answers...', true);
                submitAnswersBtn.click(); // Automatically submit
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const formattedTime = `Time Left: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            assessmentTimerDisplay.textContent = formattedTime;

            if (timeLeft < 5 * 60 * 1000) { // 5 minutes left
                assessmentTimerDisplay.classList.add('warning');
            }
            if (timeLeft < 1 * 60 * 1000) { // 1 minute left
                assessmentTimerDisplay.classList.add('critical');
            }
        }, 1000);
    }

    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', async () => {
            const answers = [];
            const formElements = takeAssessmentForm.elements;
            for (let i = 0; i < currentAssessmentToTake.questions.length; i++) {
                const question = currentAssessmentToTake.questions[i];
                let answer = null;
                if (question.type === 'multiple_choice') {
                    const selectedOption = takeAssessmentForm.querySelector(`input[name="question_${i}"]:checked`);
                    if (selectedOption) {
                        answer = selectedOption.value;
                    }
                } else if (question.type === 'short_answer') {
                    answer = takeAssessmentForm.querySelector(`textarea[name="question_${i}"]`).value;
                }
                answers.push(answer);
            }
            try {
                const response = await fetch('/api/submit-assessment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        assessmentId: currentAssessmentToTake.id,
                        classroomId: currentClassroom.id,
                        answers: answers
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(assessmentSubmissionMessage, "Assessment submitted successfully!", false);
                } else {
                    displayMessage(assessmentSubmissionMessage, result.error, true);
                }
            } catch (error) {
                console.error('Assessment submission error:', error);
                displayMessage(assessmentSubmissionMessage, 'An error occurred during submission.', true);
            }
        });
    }

    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            assessmentListContainer.classList.remove('hidden');
            takeAssessmentContainer.classList.add('hidden');
            currentAssessmentToTake = null;
            if (assessmentTimerInterval) {
                clearInterval(assessmentTimerInterval);
            }
            assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
            assessmentSubmissionMessage.textContent = '';
            loadAssessments();
        });
    }

    if (assessmentCreationForm) {
        assessmentCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = assessmentTitleInput.value;
            const description = assessmentDescriptionTextarea.value;
            const scheduledAt = assessmentScheduledAtInput.value;
            const duration = assessmentDurationMinutesInput.value;
            const questions = [];

            document.querySelectorAll('.question-block').forEach(qBlock => {
                const qType = qBlock.querySelector('select[name="question-type"]').value;
                const questionText = qBlock.querySelector('input[name="question-text"]').value;
                const question = {
                    type: qType,
                    question: questionText
                };
                if (qType === 'multiple_choice') {
                    question.options = Array.from(qBlock.querySelectorAll('input[name="option"]')).map(input => input.value);
                    question.correct_answer = qBlock.querySelector('input[name="correct-option"]:checked').value;
                } else if (qType === 'short_answer') {
                    question.correct_answer = qBlock.querySelector('input[name="correct-answer"]').value;
                }
                questions.push(question);
            });

            try {
                const response = await fetch('/api/create-assessment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        classroomId: currentClassroom.id,
                        title,
                        description,
                        scheduledAt,
                        duration: parseInt(duration),
                        questions
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(assessmentCreationMessage, 'Assessment created successfully!', false);
                    assessmentCreationForm.reset();
                    questionsContainer.innerHTML = '';
                    addQuestionBtn.click();
                    loadAssessments();
                } else {
                    displayMessage(assessmentCreationMessage, result.error, true);
                }
            } catch (error) {
                console.error('Assessment creation error:', error);
                displayMessage(assessmentCreationMessage, 'An error occurred during assessment creation.', true);
            }
        });
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const qCount = document.querySelectorAll('.question-block').length;
            const qBlock = document.createElement('div');
            qBlock.classList.add('question-block');
            qBlock.innerHTML = `
                <h4>Question ${qCount + 1}</h4>
                <label for="question-type-${qCount}">Question Type:</label>
                <select id="question-type-${qCount}" name="question-type">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                </select>
                <input type="text" name="question-text" placeholder="Enter question text" required>
                <div class="mc-options">
                    <label>Options:</label>
                    <input type="text" name="option" placeholder="Option A" required>
                    <input type="radio" name="correct-option" value="Option A" required> Correct
                    <input type="text" name="option" placeholder="Option B" required>
                    <input type="radio" name="correct-option" value="Option B"> Correct
                    <button type="button" class="add-option-btn">Add Option</button>
                </div>
                <div class="sa-answer hidden">
                    <label>Correct Answer:</label>
                    <input type="text" name="correct-answer" required>
                </div>
                <button type="button" class="remove-question-btn">Remove Question</button>
            `;
            questionsContainer.appendChild(qBlock);

            const typeSelect = qBlock.querySelector('select[name="question-type"]');
            typeSelect.addEventListener('change', () => {
                const mcOptions = qBlock.querySelector('.mc-options');
                const saAnswer = qBlock.querySelector('.sa-answer');
                if (typeSelect.value === 'multiple_choice') {
                    mcOptions.classList.remove('hidden');
                    saAnswer.classList.add('hidden');
                    // Mark inputs as required for selected type
                    mcOptions.querySelectorAll('input').forEach(input => input.required = true);
                    saAnswer.querySelectorAll('input, textarea').forEach(input => input.required = false);
                } else {
                    mcOptions.classList.add('hidden');
                    saAnswer.classList.remove('hidden');
                    mcOptions.querySelectorAll('input').forEach(input => input.required = false);
                    saAnswer.querySelectorAll('input, textarea').forEach(input => input.required = true);
                }
            });

            const addOptionBtn = qBlock.querySelector('.add-option-btn');
            addOptionBtn.addEventListener('click', () => {
                const optionCount = qBlock.querySelectorAll('input[name="option"]').length;
                const newOptionDiv = document.createElement('div');
                newOptionDiv.innerHTML = `
                    <input type="text" name="option" placeholder="Option ${String.fromCharCode(65 + optionCount)}" required>
                    <input type="radio" name="correct-option" value="Option ${String.fromCharCode(65 + optionCount)}"> Correct
                `;
                addOptionBtn.parentElement.insertBefore(newOptionDiv, addOptionBtn);
            });

            qBlock.querySelector('.remove-question-btn').addEventListener('click', () => {
                qBlock.remove();
            });
        });

        // Add the first question by default
        addQuestionBtn.click();
    }

    async function startAssessment(assessment) {
        try {
            const response = await fetch('/api/start-assessment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assessmentId: assessment.id,
                    classroomId: currentClassroom.id
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(`Assessment "${assessment.title}" started successfully!`);
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error starting assessment:', error);
            showNotification('An error occurred while starting the assessment.', true);
        }
    }

    async function viewSubmissions(assessment) {
        try {
            const response = await fetch(`/api/submissions/${currentClassroom.id}/${assessment.id}`);
            const submissions = await response.json();
            assessmentListContainer.classList.add('hidden');
            viewSubmissionsContainer.classList.remove('hidden');
            submissionsAssessmentTitle.textContent = `Submissions for "${assessment.title}"`;
            submissionsList.innerHTML = '';
            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions yet.</p>';
                return;
            }
            submissions.forEach(sub => {
                const subItem = document.createElement('div');
                subItem.classList.add('submission-item');
                subItem.innerHTML = `
                    <p><strong>Student:</strong> ${sub.studentName} (${sub.studentId})</p>
                    <p><strong>Submitted At:</strong> ${new Date(sub.submittedAt).toLocaleString()}</p>
                    <div class="submission-details">
                        </div>
                `;
                submissionsList.appendChild(subItem);
            });
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showNotification('Failed to load submissions.', true);
        }
    }

    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            assessmentListContainer.classList.remove('hidden');
            viewSubmissionsContainer.classList.add('hidden');
            loadAssessments();
        });
    }

    // Video Zoom Functionality
    function initializeZoomableVideo(videoElement, containerElement) {
        let isPinching = false;
        let startDistance = 0;
        let startScale = 1;
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let startOffsetX = 0;
        let startOffsetY = 0;

        // Initialize state for this video
        if (!videoZoomStates.has(videoElement.id)) {
            videoZoomStates.set(videoElement.id, {
                currentScale: 1,
                isZoomed: false,
                offsetX: 0,
                offsetY: 0
            });
        }

        const applyTransform = () => {
            const state = videoZoomStates.get(videoElement.id);
            videoElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX}px, ${state.offsetY}px)`;
        };

        const onTouchStart = (e) => {
            if (e.touches.length === 2) {
                isPinching = true;
                isDragging = false;
                startDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const state = videoZoomStates.get(videoElement.id);
                startScale = state.currentScale;
            } else if (e.touches.length === 1 && videoZoomStates.get(videoElement.id).isZoomed) {
                isDragging = true;
                isPinching = false;
                startX = e.touches[0].pageX;
                startY = e.touches[0].pageY;
                const state = videoZoomStates.get(videoElement.id);
                startOffsetX = state.offsetX;
                startOffsetY = state.offsetY;
            }
        };

        const onTouchMove = (e) => {
            e.preventDefault(); // Prevent default touch behavior (e.g., scrolling)

            if (isPinching && e.touches.length === 2) {
                const newDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const scale = startScale * (newDistance / startDistance);
                const state = videoZoomStates.get(videoElement.id);
                state.currentScale = Math.min(Math.max(1, scale), 3); // Limit zoom between 1x and 3x
                state.isZoomed = state.currentScale > 1;
                applyTransform();
            } else if (isDragging && e.touches.length === 1) {
                const state = videoZoomStates.get(videoElement.id);
                const dx = e.touches[0].pageX - startX;
                const dy = e.touches[0].pageY - startY;
                state.offsetX = startOffsetX + (dx / state.currentScale);
                state.offsetY = startOffsetY + (dy / state.currentScale);
                applyTransform();
            }
        };

        const onTouchEnd = () => {
            isPinching = false;
            isDragging = false;
        };

        containerElement.addEventListener('touchstart', onTouchStart);
        containerElement.addEventListener('touchmove', onTouchMove);
        containerElement.addEventListener('touchend', onTouchEnd);

        // Double-tap to reset zoom
        let lastTap = 0;
        containerElement.addEventListener('touchend', (e) => {
            const now = Date.now();
            const DBL_TAP_DELAY = 300;
            if (now - lastTap < DBL_TAP_DELAY) {
                const state = videoZoomStates.get(videoElement.id);
                state.currentScale = 1;
                state.isZoomed = false;
                state.offsetX = 0;
                state.offsetY = 0;
                applyTransform();
            }
            lastTap = now;
        });
    }

    checkLoginStatus();

    // Sidebar toggle logic
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
