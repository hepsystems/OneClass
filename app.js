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
    const showLoginLink = document = document.getElementById('show-login-link');

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
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastRoleMessage = document.getElementById('broadcast-role-message');

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryRoleMessage = document.getElementById('library-role-message');
    const libraryFilesList = document.getElementById('library-files-list'); // Ensure this element is referenced

    // Assessment Elements
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionTextarea = document.getElementById('assessment-description');
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentListDiv = document.getElementById('assessment-list');
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
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
    let currentColor = colorPicker ? colorPicker.value : '#FFFFFF';
    let currentBrushSize = brushSizeSlider ? parseInt(brushSizeSlider.value) : 5;
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
     */
    async function loadAvailableClassrooms() {
        if (!currentUser || !currentUser.id) {
            classroomList.innerHTML = '<li>Please log in to see available classrooms.</li>';
            return;
        }
        try {
            const response = await fetch('/api/classrooms');
            const classrooms = await response.json();
            classroomList.innerHTML = '';

            if (classrooms.length === 0) {
                classroomList.innerHTML = '<li>No classrooms found. Create one or wait for an admin to create one!</li>';
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
                loadAssessments();
            }
        });

        socket.on('message', (data) => {
            const messageElement = document.createElement('div');
            const senderDisplayName = getDisplayName(data.username, data.role);
            const date = new Date(data.timestamp);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            messageElement.textContent = `${senderDisplayName} (${formattedTime}): ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('chat_history', (history) => {
            chatMessages.innerHTML = '';
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                const senderDisplayName = getDisplayName(msg.username, msg.role);
                const date = new Date(msg.timestamp);
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                messageElement.textContent = `${senderDisplayName} (${formattedTime}): ${msg.message}`;
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
                createPeerConnection(data.sid, true); // true indicates caller (initiating offer)
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
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
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
                const { tool, color, width, pageIndex } = data.data;
                // Ensure page exists locally
                if (!whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                whiteboardPages[pageIndex].push(data); // Push the entire data object for re-rendering

                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.save();
                    applyDrawingProperties(tool, color, width);
                    // Pass the full data object to drawWhiteboardItem for proper re-rendering
                    drawWhiteboardItem(data.data);
                    whiteboardCtx.restore();
                }
            } else if (data.action === 'clear') {
                const { pageIndex } = data.data;
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
            if (!peerConnections[peerId]) {
                createPeerConnection(peerId, false); // false: this peer is the receiver
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
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
                }
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
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
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
     */
    async function createPeerConnection(peerId, isCaller) {
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
            let remoteVideo = document.getElementById(`remote-video-${peerId}`);
            if (!remoteVideo) {
                remoteVideo = document.createElement('video');
                remoteVideo.id = `remote-video-${peerId}`;
                remoteVideo.autoplay = true;
                remoteVideo.playsInline = true;
                remoteVideo.controls = false; // Hide controls for a cleaner look
                remoteVideoContainer.appendChild(remoteVideo);
                console.log(`[WebRTC] Created remote video element for: ${peerId}`);
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
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
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
                    offer: pc.localDescription
                });
            } catch (error) {
                console.error('[WebRTC] Error creating offer:', error);
            }
        }
    }

    // --- Whiteboard Functions ---

    /**
     * Sets up the whiteboard canvas and its controls.
     */
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
            console.warn("[Whiteboard] Canvas element not found. Whiteboard controls not set up.");
            return;
        }
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        if (!whiteboardCtx) {
            console.error("[Whiteboard] 2D context failed to initialize. Whiteboard will not function.");
            return;
        }

        // Set initial drawing properties for the context
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.fillStyle = currentColor; // For text

        resizeCanvas(); // Set initial size
        window.addEventListener('resize', resizeCanvas);

        // Event Listeners for Drawing
        whiteboardCanvas.addEventListener('mousedown', handleMouseDown);
        whiteboardCanvas.addEventListener('mousemove', handleMouseMove);
        whiteboardCanvas.addEventListener('mouseup', handleMouseUp);
        whiteboardCanvas.addEventListener('mouseout', handleMouseUp); // End drawing if mouse leaves canvas

        // Touch/Stylus Optimization: Use passive: false for touchmove to allow preventDefault
        whiteboardCanvas.addEventListener('touchstart', handleMouseDown, { passive: false });
        whiteboardCanvas.addEventListener('touchmove', handleMouseMove, { passive: false });
        whiteboardCanvas.addEventListener('touchend', handleMouseUp);
        whiteboardCanvas.addEventListener('touchcancel', handleMouseUp);

        // Tool selection
        toolButtons.forEach(button => {
            button.addEventListener('click', () => selectTool(button.dataset.tool));
        });

        // Color and Size
        if (colorPicker) colorPicker.addEventListener('input', updateColor);
        if (brushSizeSlider) brushSizeSlider.addEventListener('input', updateBrushSize);

        // Actions
        if (undoButton) undoButton.addEventListener('click', undo);
        if (redoButton) redoButton.addEventListener('click', redo);
        if (clearButton) clearButton.addEventListener('click', () => clearCanvas(true));
        if (saveButton) saveButton.addEventListener('click', saveImage);

        // Page Navigation
        if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', goToPreviousWhiteboardPage);
        if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', goToNextWhiteboardPage);

        // Initial render and page display update
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        updateUndoRedoButtons(); // Initialize undo/redo button states
    }

    /**
     * Adjusts the canvas dimensions to fit its parent container while maintaining aspect ratio.
     */
    function resizeCanvas() {
        const container = whiteboardCanvas.parentElement;
        const aspectRatio = 1200 / 800; // Original design aspect ratio

        let newWidth = container.clientWidth - 40; // Account for padding/margins
        let newHeight = newWidth / aspectRatio;

        // Ensure it doesn't exceed viewport height significantly
        if (newHeight > window.innerHeight * 0.9) {
            newHeight = window.innerHeight * 0.9;
            newWidth = newHeight * aspectRatio;
        }

        whiteboardCanvas.width = Math.max(newWidth, 300); // Minimum width
        whiteboardCanvas.height = Math.max(newHeight, 200); // Minimum height

        // Reapply styles as context state can be reset on dimension change
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.fillStyle = currentColor;

        renderCurrentWhiteboardPage(); // Re-render all commands to fit new size
    }

    /**
     * Handles the start of a drawing action (mousedown or touchstart).
     */
    function handleMouseDown(e) {
        if (!currentUser || currentUser.role !== 'admin') return; // Only admin can draw
        isDrawing = true;
        const coords = getCoords(e);
        startX = coords.x;
        startY = coords.y;
        lastX = coords.x; // Initialize lastX for pen/eraser
        lastY = coords.y; // Initialize lastY for pen/eraser

        // Save snapshot for temporary drawing of shapes
        if (currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'text') {
            snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }

        if (currentTool === 'pen' || currentTool === 'eraser') {
            currentStrokePoints = [{ x: startX, y: startY }]; // Start collecting points for the stroke
            whiteboardCtx.beginPath(); // Start a new path for pen/eraser
            whiteboardCtx.moveTo(startX, startY);
        } else if (currentTool === 'text') {
            const textInput = prompt("Enter text:");
            if (textInput !== null && textInput.trim() !== '') {
                whiteboardCtx.save();
                whiteboardCtx.font = `${currentBrushSize * 2}px Inter, sans-serif`; // Use currentBrushSize for font size
                whiteboardCtx.fillStyle = currentColor;
                whiteboardCtx.fillText(textInput, startX, startY);
                whiteboardCtx.restore();

                // Prepare and emit text data
                const textData = {
                    tool: 'text',
                    color: currentColor,
                    width: currentBrushSize,
                    data: {
                        text: textInput,
                        x: startX,
                        y: startY // Text position is top-left or baseline depending on textBaseline
                    },
                    pageIndex: currentPageIndex
                };
                
                if (socket && currentClassroom && currentUser.role === 'admin') {
                    socket.emit('whiteboard_draw', textData); // Emit text drawing
                }
                saveState(textData); // Save the state for undo/redo
            }
            isDrawing = false; // Text drawing is a single click action
        }
    }

    /**
     * Handles the movement during a drawing action (mousemove or touchmove).
     * Includes stroke smoothing and line interpolation for pen/eraser.
     */
    function handleMouseMove(e) {
        if (!isDrawing || !currentUser || currentUser.role !== 'admin' || currentTool === 'text') return; // Only admin can draw, no move for text tool
        e.preventDefault(); // Prevent scrolling on touch devices during drawing

        const coords = getCoords(e);
        const currentX = coords.x;
        const currentY = coords.y;

        whiteboardCtx.save();
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.lineWidth = currentBrushSize;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            if (currentTool === 'eraser') {
                whiteboardCtx.globalCompositeOperation = 'destination-out';
            } else {
                whiteboardCtx.globalCompositeOperation = 'source-over';
            }

            // Add current point to the stroke points array
            currentStrokePoints.push({ x: currentX, y: currentY });

            // Stroke Smoothing and Line Interpolation using Quadratic Bezier Curve
            // Draw a segment from the last point to the current point,
            // using the mid-point between last two points as control point.
            if (lastX && lastY) {
                const midX = (lastX + currentX) / 2;
                const midY = (lastY + currentY) / 2;
                whiteboardCtx.lineTo(midX, midY); // Draw a line to the mid-point
                whiteboardCtx.stroke();
                whiteboardCtx.beginPath(); // Start a new path from the mid-point
                whiteboardCtx.moveTo(midX, midY);
            }
            whiteboardCtx.lineTo(currentX, currentY); // Draw to the current point
            whiteboardCtx.stroke();

            lastX = currentX;
            lastY = currentY;

        } else if (currentTool !== 'text' && snapshot) { // For shapes
            whiteboardCtx.putImageData(snapshot, 0, 0); // Restore canvas to pre-drawing state
            drawShape(currentTool, startX, startY, currentX, currentY); // Draw the shape dynamically
        }
        whiteboardCtx.restore();
    }

    /**
     * Handles the end of a drawing action (mouseup or touchend).
     */
    function handleMouseUp(e) {
        if (!isDrawing || !currentUser || currentUser.role !== 'admin') {
            isDrawing = false; // Ensure drawing state is reset even if no admin
            return;
        }
        isDrawing = false; // Stop drawing

        const coords = getCoords(e);
        const endX = coords.x;
        const endY = coords.y;

        let drawingData = null; // Initialize drawingData

        if (currentTool === 'pen' || currentTool === 'eraser') {
            // For pen/eraser, ensure the last point is added
            if (currentStrokePoints.length > 0 && (currentStrokePoints[currentStrokePoints.length - 1].x !== endX || currentStrokePoints[currentStrokePoints.length - 1].y !== endY)) {
                currentStrokePoints.push({ x: endX, y: endY });
            } else if (currentStrokePoints.length === 0) { // Handle a single click/dot
                currentStrokePoints.push({ x: startX, y: startY });
                currentStrokePoints.push({ x: endX, y: endY }); // Ensure at least two points for a dot
            }
            drawingData = {
                tool: currentTool,
                color: currentColor,
                width: currentBrushSize,
                data: currentStrokePoints, // Array of points for the stroke
                pageIndex: currentPageIndex
            };
            currentStrokePoints = []; // Clear for next stroke

        } else if (currentTool === 'line') {
            drawingData = {
                tool: 'line',
                color: currentColor,
                width: currentBrushSize,
                data: { x1: startX, y1: startY, x2: endX, y2: endY },
                pageIndex: currentPageIndex
            };
            drawShape(currentTool, startX, startY, endX, endY); // Final draw of the shape

        } else if (currentTool === 'rectangle') {
            const x = Math.min(startX, endX);
            const y = Math.min(startY, endY);
            const width = Math.abs(endX - startX);
            const height = Math.abs(endY - startY);
            drawingData = {
                tool: 'rectangle',
                color: currentColor,
                width: currentBrushSize,
                data: { x, y, width, height },
                pageIndex: currentPageIndex
            };
            drawShape(currentTool, startX, startY, endX, endY); // Final draw of the shape

        } else if (currentTool === 'circle') {
            const centerX = (startX + endX) / 2;
            const centerY = (startY + endY) / 2;
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
            drawingData = {
                tool: 'circle',
                color: currentColor,
                width: currentBrushSize,
                data: { cx: centerX, cy: centerY, r: radius },
                pageIndex: currentPageIndex
            };
            drawShape(currentTool, startX, startY, endX, endY); // Final draw of the shape
        }

        // Emit drawing data if it's a valid drawing and user is admin
        if (drawingData && socket && currentClassroom && currentUser.role === 'admin') {
            console.log('Emitting whiteboard_draw:', drawingData);
            socket.emit('whiteboard_draw', drawingData);
            saveState(drawingData); // Save the state for undo/redo
        }
        
        snapshot = null; // Clear snapshot
    }

    /**
     * Helper to get mouse or touch coordinates relative to the canvas.
     */
    function getCoords(e) {
        const rect = whiteboardCanvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
             clientX = e.changedTouches[0].clientX;
             clientY = e.changedTouches[0].clientY;
        }else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    /**
     * Draws a shape on the whiteboard context.
     * This function is used for both live-drawing (during mousemove) and final drawing.
     */
    function drawShape(tool, x1, y1, x2, y2) {
        whiteboardCtx.beginPath();
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.fillStyle = currentColor; // For filled shapes/text

        if (tool === 'line') {
            whiteboardCtx.moveTo(x1, y1);
            whiteboardCtx.lineTo(x2, y2);
            whiteboardCtx.stroke();
        } else if (tool === 'rectangle') {
            const x = Math.min(x1, x2);
            const y = Math.min(y1, y2);
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);
            whiteboardCtx.strokeRect(x, y, width, height); // Outline only
            // If you want filled rectangles: whiteboardCtx.fillRect(x, y, width, height);
        } else if (tool === 'circle') {
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
            whiteboardCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            whiteboardCtx.stroke(); // Outline only
            // If you want filled circles: whiteboardCtx.fill();
        }
        // No beginPath/moveTo/lineTo for text here, as text is drawn directly
    }

    /**
     * Draws a single whiteboard item onto the canvas based on its data.
     * This function is used for rendering history and received real-time data.
     * @param {object} item - The drawing data item.
     */
    function drawWhiteboardItem(item) {
        if (!whiteboardCtx) {
            console.error("whiteboardCtx is not initialized.");
            return;
        }

        whiteboardCtx.save(); // Save context state before applying item-specific properties

        // Apply properties common to all tools first
        whiteboardCtx.strokeStyle = item.color;
        whiteboardCtx.lineWidth = item.width;
        whiteboardCtx.fillStyle = item.color; // Used for text or filled shapes

        // Handle eraser separately
        if (item.tool === 'eraser') {
            whiteboardCtx.globalCompositeOperation = 'destination-out';
        } else {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }

        if (item.tool === 'pen') {
            whiteboardCtx.beginPath();
            if (item.data && item.data.length > 0) {
                // Ensure at least two points for a line segment or more for a path
                whiteboardCtx.moveTo(item.data[0].x, item.data[0].y);
                for (let i = 1; i < item.data.length; i++) {
                    const midX = (item.data[i - 1].x + item.data[i].x) / 2;
                    const midY = (item.data[i - 1].y + item.data[i].y) / 2;
                    whiteboardCtx.lineTo(midX, midY);
                    whiteboardCtx.stroke();
                    whiteboardCtx.beginPath();
                    whiteboardCtx.moveTo(midX, midY);
                    whiteboardCtx.lineTo(item.data[i].x, item.data[i].y);
                }
                whiteboardCtx.stroke();
            }
        } else if (item.tool === 'eraser') {
            whiteboardCtx.beginPath();
            if (item.data && item.data.length > 0) {
                whiteboardCtx.moveTo(item.data[0].x, item.data[0].y);
                for (let i = 1; i < item.data.length; i++) {
                    const midX = (item.data[i - 1].x + item.data[i].x) / 2;
                    const midY = (item.data[i - 1].y + item.data[i].y) / 2;
                    whiteboardCtx.lineTo(midX, midY);
                    whiteboardCtx.stroke();
                    whiteboardCtx.beginPath();
                    whiteboardCtx.moveTo(midX, midY);
                    whiteboardCtx.lineTo(item.data[i].x, item.data[i].y);
                }
                whiteboardCtx.stroke();
            }
        } else if (item.tool === 'line') {
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(item.data.x1, item.data.y1);
            whiteboardCtx.lineTo(item.data.x2, item.data.y2);
            whiteboardCtx.stroke();
        } else if (item.tool === 'rectangle') {
            whiteboardCtx.beginPath();
            whiteboardCtx.strokeRect(item.data.x, item.data.y, item.data.width, item.data.height);
            // If filled: whiteboardCtx.fillRect(item.data.x, item.data.y, item.data.width, item.data.height);
        } else if (item.tool === 'circle') {
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(item.data.cx, item.data.cy, item.data.r, 0, 2 * Math.PI);
            whiteboardCtx.stroke();
            // If filled: whiteboardCtx.fill();
        } else if (item.tool === 'text') {
            whiteboardCtx.font = `${item.width * 2}px Inter, sans-serif`; // Use item.width for font size
            whiteboardCtx.fillStyle = item.color;
            whiteboardCtx.fillText(item.data.text, item.data.x, item.data.y);
        }

        whiteboardCtx.restore(); // Restore context state
    }

    /**
     * Clears the whiteboard canvas and optionally emits a clear event.
     * @param {boolean} emitEvent - True to emit a 'whiteboard_clear' event to the server.
     */
    function clearCanvas(emitEvent = false) {
        if (!whiteboardCtx) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        // Clear local page history
        if (whiteboardPages[currentPageIndex]) {
            whiteboardPages[currentPageIndex] = [];
        }

        if (emitEvent && socket && currentClassroom && currentUser && currentUser.role === 'admin') {
            socket.emit('whiteboard_clear', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
            showNotification(`Whiteboard page ${currentPageIndex + 1} cleared.`);
        }
        // Clear local undo/redo stacks for the current page
        undoStack.length = 0;
        redoStack.length = 0;
        updateUndoRedoButtons();
    }

    /**
     * Renders all drawing commands for the current whiteboard page.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx || !whiteboardCanvas) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black before re-rendering
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const currentPageData = whiteboardPages[currentPageIndex];
        if (currentPageData) {
            currentPageData.forEach(item => {
                if (item.action === 'draw') {
                    drawWhiteboardItem(item.data);
                } else if (item.action === 'clear') {
                    // This case should ideally not happen in page history, but good for robustness
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000';
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
            });
        }
    }

    /**
     * Fetches whiteboard history from the server.
     */
    async function fetchWhiteboardHistory() {
        if (!currentClassroom || !currentClassroom.id || !socket) return;
        try {
            const response = await fetch(`/api/whiteboard_history/${currentClassroom.id}`);
            if (response.ok) {
                const history = await response.json();
                whiteboardPages = history.pages || [[]]; // Ensure it's an array of arrays
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [[]]; // Always start with at least one page
                }
                currentPageIndex = 0; // Reset to the first page when loading history
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                undoStack.length = 0; // Clear local undo/redo when new history is loaded
                redoStack.length = 0;
                updateUndoRedoButtons();
                console.log('[Whiteboard] History loaded:', whiteboardPages);
            } else {
                console.error('[Whiteboard] Failed to fetch history:', response.statusText);
                showNotification('Failed to load whiteboard history.', true);
                whiteboardPages = [[]]; // Reset to a blank page on error
                currentPageIndex = 0;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
            }
        } catch (error) {
            console.error('[Whiteboard] Error fetching history:', error);
            showNotification('Error fetching whiteboard history.', true);
            whiteboardPages = [[]]; // Reset to a blank page on error
            currentPageIndex = 0;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
        }
    }

    /**
     * Saves the current drawing state to history for undo/redo.
     * @param {object} drawingCommand - The drawing command object.
     */
    function saveState(drawingCommand) {
        if (!whiteboardPages[currentPageIndex]) {
            whiteboardPages[currentPageIndex] = [];
        }
        whiteboardPages[currentPageIndex].push({ action: 'draw', data: drawingCommand });
        // Clear redo stack on new drawing
        redoStack.length = 0; 
        // Implement undoStack logic for individual actions if desired,
        // but for now, whiteboardPages[currentPageIndex] is the source of truth for rendering.
        // For accurate undo/redo, you'd push canvas snapshots or commands to a separate undoStack
        // specific to the *client's* local actions, and then use history to revert.
        // For simplicity, we'll assume `whiteboardPages` is also the undo source.
        // The `whiteboardPages` is updated when new data is received *or* locally drawn.
        // So, for undo, you'd remove the last item from `whiteboardPages[currentPageIndex]`.

        // Basic undo/redo by modifying the `whiteboardPages` array
        // (This is a simplified approach; a more robust undo would involve
        //  saving snapshots or deep copies of the page state.)
        if (whiteboardPages[currentPageIndex].length > MAX_HISTORY_STEPS) {
             // Keep only the latest MAX_HISTORY_STEPS
            whiteboardPages[currentPageIndex] = whiteboardPages[currentPageIndex].slice(-MAX_HISTORY_STEPS);
        }
        updateUndoRedoButtons();
    }


    /**
     * Undoes the last drawing action on the current page.
     */
    function undo() {
        if (whiteboardPages[currentPageIndex] && whiteboardPages[currentPageIndex].length > 0 && currentUser.role === 'admin') {
            const lastCommand = whiteboardPages[currentPageIndex].pop(); // Remove last command
            redoStack.push(lastCommand); // Add to redo stack
            renderCurrentWhiteboardPage(); // Re-render the page
            updateUndoRedoButtons();
            // Optionally, inform other clients about the undo, though history fetch will sync them eventually.
            // A dedicated 'whiteboard_undo' event could be implemented.
            showNotification(`Undo last drawing on page ${currentPageIndex + 1}.`);
        } else if (currentUser.role !== 'admin') {
            showNotification("Only administrators can undo drawing actions.", true);
        } else {
            showNotification("Nothing to undo on this page.", false);
        }
    }

    /**
     * Redoes the last undone drawing action on the current page.
     */
    function redo() {
        if (redoStack.length > 0 && currentUser.role === 'admin') {
            const commandToRedo = redoStack.pop(); // Get from redo stack
            whiteboardPages[currentPageIndex].push(commandToRedo); // Add back to current page
            renderCurrentWhiteboardPage(); // Re-render the page
            updateUndoRedoButtons();
            // Optionally, inform other clients about the redo.
            showNotification(`Redo drawing on page ${currentPageIndex + 1}.`);
        } else if (currentUser.role !== 'admin') {
            showNotification("Only administrators can redo drawing actions.", true);
        } else {
            showNotification("Nothing to redo on this page.", false);
        }
    }

    /**
     * Updates the enabled/disabled state of undo and redo buttons.
     */
    function updateUndoRedoButtons() {
        if (undoButton) {
            undoButton.disabled = !(currentUser && currentUser.role === 'admin' && whiteboardPages[currentPageIndex] && whiteboardPages[currentPageIndex].length > 0);
        }
        if (redoButton) {
            redoButton.disabled = !(currentUser && currentUser.role === 'admin' && redoStack.length > 0);
        }
        if (clearButton) {
            clearButton.disabled = !(currentUser && currentUser.role === 'admin');
        }
    }


    /**
     * Handles tool selection and updates active state.
     */
    function selectTool(tool) {
        currentTool = tool;
        toolButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tool-button[data-tool="${tool}"]`).classList.add('active');
        showNotification(`Tool selected: ${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
        // Adjust cursor style based on tool
        whiteboardCanvas.style.cursor = (tool === 'pen' || tool === 'eraser') ? 'crosshair' : 'default';

        // Enable/disable brush size slider based on tool
        if (brushSizeSlider) {
            brushSizeSlider.disabled = (tool === 'text'); // Text might use a different size mechanism
        }
    }

    /**
     * Updates the current drawing color.
     */
    function updateColor() {
        currentColor = colorPicker.value;
        showNotification(`Color changed to: ${currentColor}`);
    }

    /**
     * Updates the current brush size.
     */
    function updateBrushSize() {
        currentBrushSize = parseInt(brushSizeSlider.value);
        showNotification(`Brush size changed to: ${currentBrushSize}`);
    }

    /**
     * Saves the whiteboard content as an image.
     */
    function saveImage() {
        if (whiteboardCanvas) {
            const dataURL = whiteboardCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `whiteboard_page_${currentPageIndex + 1}_${currentClassroom ? currentClassroom.name : 'classroom'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showNotification("Whiteboard image saved!");
        }
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    function goToPreviousWhiteboardPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            updateUndoRedoButtons(); // Update buttons for new page
            // Notify server and other clients about page change
            if (socket && currentClassroom) {
                socket.emit('whiteboard_page_change', {
                    classroomId: currentClassroom.id,
                    newPageIndex: currentPageIndex
                });
            }
        } else {
            showNotification("Already on the first page.", false);
        }
    }

    /**
     * Navigates to the next whiteboard page, creating a new one if necessary.
     */
    function goToNextWhiteboardPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else {
            // Create a new page if we are at the last page
            if (currentUser.role === 'admin') {
                whiteboardPages.push([]);
                currentPageIndex++;
                showNotification(`New whiteboard page ${currentPageIndex + 1} created.`);
            } else {
                showNotification("Cannot create new pages as a regular user.", true);
                return; // Prevent non-admins from changing to non-existent pages
            }
        }
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        updateUndoRedoButtons(); // Update buttons for new page
        // Notify server and other clients about page change
        if (socket && currentClassroom) {
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: currentPageIndex
            });
        }
    }

    /**
     * Updates the display showing the current whiteboard page number.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
        }
        // Disable/enable page navigation buttons
        if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
        if (nextWhiteboardPageBtn) {
            // If admin, they can always go next (create new page)
            nextWhiteboardPageBtn.disabled = !(currentUser && currentUser.role === 'admin') && currentPageIndex === whiteboardPages.length - 1;
        }
    }


    // --- Chat Functions ---

    /**
     * Sets up event listeners for chat functionality.
     */
    function setupChatControls() {
        if (sendMessageBtn) sendMessageBtn.addEventListener('click', sendMessage);
        if (chatInput) chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    /**
     * Sends a chat message to the server.
     */
    function sendMessage() {
        if (!socket || !currentClassroom || !chatInput || !chatInput.value.trim()) return;
        socket.emit('message', {
            classroomId: currentClassroom.id,
            message: chatInput.value.trim()
        });
        chatInput.value = '';
    }

    // --- Library Functions ---

    /**
     * Loads and displays files in the library for the current classroom.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            if (libraryFilesList) libraryFilesList.innerHTML = '<li>Please enter a classroom to view library files.</li>';
            return;
        }
        if (!libraryFilesList) return; // Ensure element exists

        try {
            const response = await fetch(`/api/library_files/${currentClassroom.id}`);
            if (response.ok) {
                const files = await response.json();
                libraryFilesList.innerHTML = '';
                if (files.length === 0) {
                    libraryFilesList.innerHTML = '<li>No files in the library yet.</li>';
                } else {
                    files.forEach(file => {
                        const li = document.createElement('li');
                        li.className = 'library-file-item';
                        li.innerHTML = `
                            <span>${file.filename}</span>
                            <a href="${file.url}" target="_blank" download="${file.filename}" class="download-link">Download</a>
                        `;
                        libraryFilesList.appendChild(li);
                    });
                }
            } else {
                console.error('Failed to load library files:', response.statusText);
                libraryFilesList.innerHTML = '<li>Failed to load library files.</li>';
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            libraryFilesList.innerHTML = '<li>Error loading library files.</li>';
        }
    }

    // --- Assessment Functions ---

    /**
     * Loads and displays assessments for the current classroom.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            if (assessmentListDiv) assessmentListDiv.innerHTML = '<li>Please enter a classroom to view assessments.</li>';
            return;
        }
        if (!assessmentListDiv) return;

        showClassroomSubSection(assessmentsSection);
        assessmentCreationForm.classList.add('hidden');
        assessmentListContainer.classList.remove('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            if (response.ok) {
                const assessments = await response.json();
                assessmentListDiv.innerHTML = '';
                if (assessments.length === 0) {
                    assessmentListDiv.innerHTML = '<li>No assessments available yet.</li>';
                } else {
                    assessments.forEach(assessment => {
                        const li = document.createElement('li');
                        li.className = 'assessment-item';
                        const adminControls = (currentUser && currentUser.role === 'admin') ? `
                            <button class="view-submissions-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>
                            <button class="delete-assessment-btn" data-assessment-id="${assessment.id}">Delete</button>
                        ` : '';
                        const userControls = (currentUser && currentUser.role === 'user') ? `
                            <button class="take-assessment-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}" data-assessment-description="${assessment.description}">Take Assessment</button>
                        ` : '';
                        li.innerHTML = `
                            <div class="assessment-title">${assessment.title}</div>
                            <div class="assessment-description">${assessment.description}</div>
                            <div class="assessment-actions">
                                ${currentUser && currentUser.role === 'admin' ? adminControls : userControls}
                            </div>
                        `;
                        assessmentListDiv.appendChild(li);
                    });
                }

                document.querySelectorAll('.take-assessment-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.dataset.assessmentId;
                        const title = e.target.dataset.assessmentTitle;
                        const description = e.target.dataset.assessmentDescription;
                        takeAssessment(id, title, description);
                    });
                });

                document.querySelectorAll('.view-submissions-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.dataset.assessmentId;
                        const title = e.target.dataset.assessmentTitle;
                        viewAssessmentSubmissions(id, title);
                    });
                });

                document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        if (confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
                            try {
                                const response = await fetch(`/api/assessments/${assessmentId}`, { method: 'DELETE' });
                                const result = await response.json();
                                if (response.ok) {
                                    showNotification(result.message);
                                    loadAssessments(); // Reload list
                                    socket.emit('admin_action_update', {
                                        classroomId: currentClassroom.id,
                                        message: `An assessment was deleted.`
                                    });
                                } else {
                                    showNotification(result.error, true);
                                }
                            } catch (error) {
                                console.error('Error deleting assessment:', error);
                                showNotification('An error occurred during deletion.', true);
                            }
                        }
                    });
                });

            } else {
                console.error('Failed to load assessments:', response.statusText);
                assessmentListDiv.innerHTML = '<li>Failed to load assessments.</li>';
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            assessmentListDiv.innerHTML = '<li>Error loading assessments.</li>';
        }
    }

    /**
     * Displays the form to create a new assessment.
     */
    function showCreateAssessmentForm() {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can create assessments.", true);
            return;
        }
        assessmentCreationForm.classList.remove('hidden');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
        assessmentTitleInput.value = '';
        assessmentDescriptionTextarea.value = '';
        questionsContainer.innerHTML = '';
        addQuestion(); // Start with one question
    }

    /**
     * Adds a new question input block to the assessment creation form.
     */
    function addQuestion() {
        const questionIndex = questionsContainer.children.length;
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-block';
        questionDiv.innerHTML = `
            <h4>Question ${questionIndex + 1}</h4>
            <label for="question-text-${questionIndex}">Question Text:</label>
            <input type="text" id="question-text-${questionIndex}" name="questionText" required>
            <div class="options-container">
                <label>Options (check correct answer):</label>
                <div class="option-input-group">
                    <input type="checkbox" id="option-${questionIndex}-0-correct">
                    <input type="text" id="option-${questionIndex}-0-text" name="optionText" placeholder="Option A" required>
                </div>
                <div class="option-input-group">
                    <input type="checkbox" id="option-${questionIndex}-1-correct">
                    <input type="text" id="option-${questionIndex}-1-text" name="optionText" placeholder="Option B" required>
                </div>
                <div class="option-input-group">
                    <input type="checkbox" id="option-${questionIndex}-2-correct">
                    <input type="text" id="option-${questionIndex}-2-text" name="optionText" placeholder="Option C">
                </div>
                <div class="option-input-group">
                    <input type="checkbox" id="option-${questionIndex}-3-correct">
                    <input type="text" id="option-${questionIndex}-3-text" name="optionText" placeholder="Option D">
                </div>
            </div>
        `;
        questionsContainer.appendChild(questionDiv);
    }

    /**
     * Populates and displays the form to take an assessment.
     * @param {string} assessmentId - The ID of the assessment.
     * @param {string} title - The title of the assessment.
     * @param {string} description - The description of the assessment.
     */
    async function takeAssessment(assessmentId, title, description) {
        if (!currentUser || currentUser.role !== 'user') {
            showNotification("Only regular users can take assessments.", true);
            return;
        }

        currentAssessmentToTake = assessmentId;
        takeAssessmentTitle.textContent = title;
        takeAssessmentDescription.textContent = description;
        takeAssessmentForm.innerHTML = '';
        assessmentSubmissionMessage.textContent = ''; // Clear previous messages

        showClassroomSubSection(assessmentsSection);
        assessmentCreationForm.classList.add('hidden');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden');
        viewSubmissionsContainer.classList.add('hidden');

        try {
            const response = await fetch(`/api/assessment_details/${assessmentId}`);
            if (response.ok) {
                const assessment = await response.json();
                assessment.questions.forEach((question, qIndex) => {
                    const questionDiv = document.createElement('div');
                    questionDiv.className = 'assessment-question-block';
                    questionDiv.innerHTML = `<h4>${qIndex + 1}. ${question.question_text}</h4>`;

                    question.options.forEach((option, oIndex) => {
                        const optionInputGroup = document.createElement('div');
                        optionInputGroup.className = 'option-input-group';
                        optionInputGroup.innerHTML = `
                            <input type="radio" id="question-${qIndex}-option-${oIndex}" name="question-${qIndex}" value="${oIndex}" required>
                            <label for="question-${qIndex}-option-${oIndex}">${option.option_text}</label>
                        `;
                        questionDiv.appendChild(optionInputGroup);
                    });
                    takeAssessmentForm.appendChild(questionDiv);
                });
            } else {
                showNotification('Failed to load assessment details.', true);
                console.error('Failed to load assessment details:', response.statusText);
            }
        } catch (error) {
            showNotification('Error loading assessment details.', true);
            console.error('Error loading assessment details:', error);
        }
    }


    /**
     * Displays submissions for a given assessment.
     * @param {string} assessmentId - The ID of the assessment.
     * @param {string} title - The title of the assessment.
     */
    async function viewAssessmentSubmissions(assessmentId, title) {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can view assessment submissions.", true);
            return;
        }

        submissionsAssessmentTitle.textContent = title;
        submissionsList.innerHTML = ''; // Clear previous submissions

        showClassroomSubSection(assessmentsSection);
        assessmentCreationForm.classList.add('hidden');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/assessment_submissions/${assessmentId}`);
            if (response.ok) {
                const submissions = await response.json();
                if (submissions.length === 0) {
                    submissionsList.innerHTML = '<li>No submissions for this assessment yet.</li>';
                } else {
                    submissions.forEach(submission => {
                        const li = document.createElement('li');
                        li.className = 'submission-item';
                        let answersHtml = '';
                        submission.answers.forEach((answer, qIndex) => {
                            answersHtml += `<p><strong>Q${qIndex + 1}:</strong> ${answer.question_text}</p>`;
                            answersHtml += `<p>Your Answer: ${answer.submitted_option_text} (${answer.is_correct ? 'Correct' : 'Incorrect'})</p>`;
                        });
                        li.innerHTML = `
                            <div><strong>Submitted by:</strong> ${getDisplayName(submission.username, submission.user_role)}</div>
                            <div><strong>Score:</strong> ${submission.score} / ${submission.total_questions}</div>
                            <div class="submission-answers">${answersHtml}</div>
                        `;
                        submissionsList.appendChild(li);
                    });
                }
            } else {
                showNotification('Failed to load submissions.', true);
                console.error('Failed to load submissions:', response.statusText);
            }
        } catch (error) {
            showNotification('Error loading submissions.', true);
            console.error('Error loading submissions:', error);
        }
    }


    // --- Event Listeners and Initial Setup ---

    // Auth Section
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
                    showNotification(result.message);
                    checkLoginStatus(); // Update UI
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
                    showLoginLink.click(); // Switch to login form
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Register error:', error);
                displayMessage(authMessage, 'An error occurred during registration.', true);
            }
        });
    }

    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        authMessage.textContent = ''; // Clear messages
    });

    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        authMessage.textContent = ''; // Clear messages
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                const result = await response.json();
                if (response.ok) {
                    currentUser = null;
                    localStorage.removeItem('currentUser');
                    cleanupClassroomResources(); // Clean up socket and WebRTC
                    showNotification(result.message);
                    checkLoginStatus(); // Redirect to auth
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Logout error:', error);
                showNotification('An error occurred during logout.', true);
            }
        });
    }

    // Dashboard Actions
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
                    displayMessage(classroomMessage, result.message, false);
                    newClassroomNameInput.value = ''; // Clear input
                    loadAvailableClassrooms(); // Refresh list
                    showNotification("Classroom created: " + classroomName);
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Create classroom error:', error);
                displayMessage(classroomMessage, 'An error occurred during classroom creation.', true);
            }
        });
    }

    // Classroom Navigation
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => {
        cleanupClassroomResources();
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadAvailableClassrooms(); // Reload available classrooms
        window.history.pushState({}, '', '/'); // Update URL
    });

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
    });
    if (navAssessments) navAssessments.addEventListener('click', () => {
        showClassroomSubSection(assessmentsSection);
        updateNavActiveState(navAssessments);
        loadAssessments(); // Load assessments when navigating to this section
    });

    // Share Link Functionality
    if (classCodeSpan) {
        classCodeSpan.addEventListener('click', () => {
            if (shareLinkDisplay) {
                const currentShareLink = `${window.location.origin}/classroom/${currentClassroom.id}`;
                shareLinkInput.value = currentShareLink;
                shareLinkDisplay.classList.remove('hidden');
            }
        });
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            if (shareLinkInput) {
                shareLinkInput.select();
                shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
                navigator.clipboard.writeText(shareLinkInput.value)
                    .then(() => showNotification('Share link copied to clipboard!'))
                    .catch(err => console.error('Failed to copy link: ', err));
            }
        });
    }

    // Settings Section
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) {
                showNotification("No user logged in.", true);
                return;
            }
            const username = settingsUsernameInput.value.trim();
            const email = settingsEmailInput.value.trim();

            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email })
                });
                const result = await response.json();
                if (response.ok) {
                    currentUser.username = username; // Update local user object
                    currentUser.email = email;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    showNotification(result.message);
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role); // Update dashboard display
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Profile update error:', error);
                showNotification('An error occurred during profile update.', true);
            }
        });
    }

    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
    });

    // Video Broadcast Controls
    if (startBroadcastBtn) startBroadcastBtn.addEventListener('click', startBroadcast);
    if (endBroadcastBtn) endBroadcastBtn.addEventListener('click', endBroadcast);

    // Library Controls
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification("Only administrators can upload files to the library.", true);
                return;
            }
            if (!currentClassroom || !currentClassroom.id) {
                showNotification("Please enter a classroom to upload files.", true);
                return;
            }

            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification("Please select files to upload.", true);
                return;
            }

            const formData = new FormData();
            formData.append('classroomId', currentClassroom.id);
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            try {
                const response = await fetch('/api/upload_library_files', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    libraryFileInput.value = ''; // Clear input
                    loadLibraryFiles(); // Refresh list
                    socket.emit('admin_action_update', {
                        classroomId: currentClassroom.id,
                        message: `New files uploaded to the library.`
                    });
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('File upload error:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }


    // Assessment Creation & Submission
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestion);

    if (submitAssessmentBtn) {
        submitAssessmentBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification("Only administrators can create assessments.", true);
                return;
            }
            if (!currentClassroom || !currentClassroom.id) {
                showNotification("Please enter a classroom to create an assessment.", true);
                return;
            }

            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionTextarea.value.trim();
            const questions = [];

            document.querySelectorAll('.question-block').forEach((qBlock, qIndex) => {
                const questionText = qBlock.querySelector(`input[name="questionText"]`).value.trim();
                const options = [];
                let correctOptionFound = false;

                qBlock.querySelectorAll('.option-input-group').forEach((optGroup, oIndex) => {
                    const optionText = optGroup.querySelector(`input[id="option-${qIndex}-${oIndex}-text"]`).value.trim();
                    const isCorrect = optGroup.querySelector(`input[id="option-${qIndex}-${oIndex}-correct"]`).checked;

                    if (optionText) { // Only add if option text is not empty
                        options.push({ option_text: optionText, is_correct: isCorrect });
                        if (isCorrect) correctOptionFound = true;
                    }
                });

                if (questionText && options.length >= 2 && correctOptionFound) {
                    questions.push({
                        question_text: questionText,
                        options: options
                    });
                } else {
                    showNotification(`Question ${qIndex + 1} is incomplete or invalid. Each question needs text, at least two options, and at least one correct answer.`, true);
                    throw new Error('Incomplete assessment data'); // Stop submission
                }
            });

            if (!title || !description || questions.length === 0) {
                showNotification('Please fill in all assessment details and add at least one complete question.', true);
                return;
            }

            try {
                const response = await fetch('/api/create-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        classroomId: currentClassroom.id,
                        title,
                        description,
                        questions
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    assessmentCreationForm.reset();
                    questionsContainer.innerHTML = ''; // Clear questions
                    loadAssessments(); // Refresh list
                    socket.emit('admin_action_update', {
                        classroomId: currentClassroom.id,
                        message: `A new assessment "${title}" was created.`
                    });
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Assessment creation error:', error);
                showNotification('An error occurred during assessment creation.', true);
            }
        });
    }

    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!currentUser || currentUser.role !== 'user' || !currentAssessmentToTake) {
                showNotification("Cannot submit answers. Ensure you are a user and an assessment is selected.", true);
                return;
            }

            const answers = [];
            const formElements = takeAssessmentForm.elements;

            // Iterate through questions
            document.querySelectorAll('.assessment-question-block').forEach((qBlock, qIndex) => {
                const questionText = qBlock.querySelector('h4').textContent.replace(/^\d+\.\s*/, ''); // Extract text from heading
                const selectedOptionRadio = formElements[`question-${qIndex}`] ? formElements[`question-${qIndex}`].value : null;

                if (selectedOptionRadio === null) {
                    showNotification(`Please answer all questions before submitting.`, true);
                    throw new Error('Unanswered questions'); // Stop submission
                }

                const selectedOptionText = qBlock.querySelector(`label[for="question-${qIndex}-option-${selectedOptionRadio}"]`).textContent.trim();

                answers.push({
                    question_index: qIndex,
                    submitted_option_index: parseInt(selectedOptionRadio),
                    question_text: questionText,
                    submitted_option_text: selectedOptionText
                });
            });

            try {
                const response = await fetch('/api/submit-assessment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assessmentId: currentAssessmentToTake,
                        answers: answers,
                        classroomId: currentClassroom.id // Include classroom ID for server-side lookup if needed
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(`Assessment submitted! Score: ${result.score} / ${result.total_questions}`);
                    assessmentSubmissionMessage.textContent = `You scored ${result.score} out of ${result.total_questions}.`;
                    // Optionally, disable the form or navigate back
                    submitAnswersBtn.disabled = true;
                    // Auto-return to assessment list after a delay
                    setTimeout(() => {
                        loadAssessments();
                    }, 3000);
                    socket.emit('admin_action_update', {
                        classroomId: currentClassroom.id,
                        message: `An assessment was submitted by ${currentUser.username}.`
                    });
                } else {
                    showNotification(result.error, true);
                    assessmentSubmissionMessage.textContent = result.error;
                }
            } catch (error) {
                console.error('Assessment submission error:', error);
                showNotification('An error occurred during assessment submission.', true);
                assessmentSubmissionMessage.textContent = 'An error occurred during submission.';
            }
        });
    }

    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => { currentAssessmentToTake = null; loadAssessments(); });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => { loadAssessments(); });

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
});
