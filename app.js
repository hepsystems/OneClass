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
    let currentColor = colorPicker ? colorPicker.value : '#FFF800';
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

        // app.js (Excerpt from socket.on('whiteboard_data', ...))

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
        whiteboardCanvas.addEventListener('mouseout', handleMouseUp);

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
        whiteboardCanvas.height = Math.max(newHeight, 700); // Minimum height

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
        if (currentUser.role !== 'admin') return;
        isDrawing = true;
        const coords = getCoords(e);
        startX = coords.x;
        startY = coords.y;
        lastX = coords.x;
        lastY = coords.y; // Initialize lastY as well

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
                whiteboardCtx.font = `${currentBrushSize * 2}px Inter, sans-serif`;
                whiteboardCtx.fillStyle = currentColor;
                whiteboardCtx.fillText(textInput, startX, startY);
                whiteboardCtx.restore();

                saveState(); // Save the state after drawing text
                const textData = {
                    startX: startX,
                    startY: startY,
                    endX: startX, // For text, endX/Y are same as start
                    endY: startY,
                    text: textInput,
                    color: currentColor,
                    width: currentBrushSize,
                    tool: 'text',
                    pageIndex: currentPageIndex
                };
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroom.id,
                    data: textData
                });
                // Add to local page data
                whiteboardPages[currentPageIndex].push({ action: 'draw', data: textData });
            }
            isDrawing = false; // Text drawing is a single click action
        }
    }

    /**
     * Handles the movement during a drawing action (mousemove or touchmove).
     * Includes stroke smoothing and line interpolation for pen/eraser.
     */
    function handleMouseMove(e) {
        if (!isDrawing || currentUser.role !== 'admin' || currentTool === 'text') return;
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
            // using the last point as the control point for a smoother curve.
            whiteboardCtx.quadraticCurveTo(lastX, lastY, (currentX + lastX) / 2, (currentY + lastY) / 2);
            whiteboardCtx.stroke();
            
            // Move to the midpoint for the start of the next segment
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo((currentX + lastX) / 2, (currentY + lastY) / 2);

            lastX = currentX;
            lastY = currentY;
            
        } else {
            // For shapes, restore snapshot and redraw preview
            if (snapshot) {
                whiteboardCtx.putImageData(snapshot, 0, 0);
            } else {
                // Fallback if snapshot is somehow missing (shouldn't happen)
                renderCurrentWhiteboardPage();
            }
            drawWhiteboardItem({ tool: currentTool, startX, startY, endX: currentX, endY: currentY, color: currentColor, width: currentBrushSize });
        }
        whiteboardCtx.restore();
    }

    /**
     * Handles the end of a drawing action (mouseup or touchend).
     */
    function handleMouseUp(e) {
        if (!isDrawing || currentUser.role !== 'admin') return;
        isDrawing = false;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            // Finish the last segment of the stroke
            whiteboardCtx.lineTo(lastX, lastY); // Ensure the last point is drawn
            whiteboardCtx.stroke();
            whiteboardCtx.closePath(); // Close the current path for pen/eraser

            // Emit the complete stroke data
            const strokeData = {
                points: currentStrokePoints, // Array of all points in the stroke
                color: currentColor,
                width: currentBrushSize,
                tool: currentTool,
                pageIndex: currentPageIndex
            };
            socket.emit('whiteboard_data', {
                action: 'draw',
                classroomId: currentClassroom.id,
                data: strokeData
            });
            // Add to local page data
            whiteboardPages[currentPageIndex].push({ action: 'draw', data: strokeData });
            currentStrokePoints = []; // Clear points for the next stroke

        } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            // For shapes, draw the final shape and emit data
            const finalCoords = getCoords(e);
            const currentX = finalCoords.x;
            const currentY = finalCoords.y;

            // Redraw the entire page to ensure the final shape is persisted correctly
            renderCurrentWhiteboardPage(); // Clear and redraw existing commands
            
            whiteboardCtx.save();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            const shapeData = {
                startX, startY, endX: currentX, endY: currentY,
                color: currentColor, width: currentBrushSize, tool: currentTool
            };
            drawWhiteboardItem(shapeData); // Draw the final shape
            whiteboardCtx.restore();

            socket.emit('whiteboard_data', {
                action: 'draw',
                classroomId: currentClassroom.id,
                data: { ...shapeData, pageIndex: currentPageIndex }
            });
            // Add to local page data
            whiteboardPages[currentPageIndex].push({ action: 'draw', data: shapeData });
        }

        if (whiteboardCtx.globalCompositeOperation === 'destination-out') {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }
        saveState(); // Save the canvas state for undo/redo after each completed action
    }

    /**
     * Draws a specific whiteboard item (line, rectangle, circle, text, or smoothed pen/eraser stroke).
     * @param {object} commandData - The data object for the drawing command.
     * @param {string} commandData.tool - The drawing tool.
     * @param {number} [commandData.startX] - Start X coordinate (for shapes/text).
     * @param {number} [commandData.startY] - Start Y coordinate (for shapes/text).
     * @param {number} [commandData.endX] - End X coordinate (for shapes).
     * @param {number} [commandData.endY] - End Y coordinate (for shapes).
     * @param {string} [commandData.text] - Text content for the 'text' tool.
     * @param {Array<object>} [commandData.points] - Array of {x, y} points for 'pen'/'eraser' strokes.
     * @param {string} commandData.color - Stroke/fill color.
     * @param {number} commandData.width - Stroke width.
     */
    function drawWhiteboardItem(commandData) {
        const { tool, startX, startY, endX, endY, text, points, color, width } = commandData;

        // Apply properties before drawing
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = width;
        whiteboardCtx.fillStyle = color;

        if (tool === 'eraser') {
            whiteboardCtx.globalCompositeOperation = 'destination-out';
        } else {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }

        switch (tool) {
            case 'pen':
            case 'eraser':
                // Re-render smoothed stroke from points
                if (points && points.length > 1) {
                    whiteboardCtx.beginPath();
                    whiteboardCtx.moveTo(points[0].x, points[0].y);

                    for (let i = 1; i < points.length - 1; i++) {
                        const p0 = points[i - 1];
                        const p1 = points[i];
                        const p2 = points[i + 1];

                        // Calculate control point for quadratic bezier curve
                        // Simple midpoint average for smoothing
                        const controlX = (p0.x + p1.x) / 2;
                        const controlY = (p0.y + p1.y) / 2;
                        const endX_segment = (p1.x + p2.x) / 2;
                        const endY_segment = (p1.y + p2.y) / 2;

                        whiteboardCtx.quadraticCurveTo(p1.x, p1.y, endX_segment, endY_segment);
                    }
                    // Draw the last segment
                    whiteboardCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                    whiteboardCtx.stroke();
                    whiteboardCtx.closePath();
                }
                break;
            case 'line':
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(startX, startY);
                whiteboardCtx.lineTo(endX, endY);
                whiteboardCtx.stroke();
                whiteboardCtx.closePath();
                break;
            case 'rectangle':
                whiteboardCtx.beginPath();
                whiteboardCtx.rect(startX, startY, endX - startX, endY - startY);
                whiteboardCtx.stroke();
                whiteboardCtx.closePath();
                break;
            case 'circle':
                // For circles, startX, startY is center, endX, endY defines radius
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(startX, startY, radius, 0, Math.PI * 2);
                whiteboardCtx.stroke();
                whiteboardCtx.closePath();
                break;
            case 'text':
                whiteboardCtx.font = `${width * 2}px Inter, sans-serif`; // Use 'width' as brush size for text scaling
                whiteboardCtx.fillText(text, startX, startY);
                break;
        }
    }

    /**
     * Gets mouse/touch coordinates relative to the canvas.
     * @param {MouseEvent|TouchEvent} e - The event object.
     * @returns {object} An object with x and y coordinates.
     */
    function getCoords(e) {
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
     * Changes the active drawing tool.
     * @param {string} tool - The tool to activate.
     */
    function selectTool(tool) {
        currentTool = tool;
        toolButtons.forEach(button => {
            if (button.dataset.tool === tool) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        // Reset globalCompositeOperation when changing from eraser
        if (whiteboardCtx.globalCompositeOperation === 'destination-out' && tool !== 'eraser') {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }
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
                        role: currentUser.role
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
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            if (libraryFilesList) libraryFilesList.innerHTML = '<p>Select a classroom to view library files.</p>';
            return;
        }

        try {
            const response = await fetch(`/api/library-files/${currentClassroom.id}`);
            const files = await response.json();
            if (libraryFilesList) libraryFilesList.innerHTML = '';

            if (files.length === 0) {
                if (libraryFilesList) libraryFilesList.innerHTML = '<p>No files in this library yet.</p>';
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
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can create assessments.", true);
            return;
        }
        if (!currentClassroom || !currentClassroom.id) {
            showNotification("Please select a classroom first.", true);
            return;
        }

        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionTextarea.value.trim();
        const questions = [];

        if (!title) {
            displayMessage(assessmentCreationMessage, 'Please enter an assessment title.', true);
            return;
        }

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
                    options: options.length > 0 ? options : undefined, // Only include if options exist
                    correct_answer: correctAnswer || undefined // Only include if correct answer exists
                });
            }
        });

        if (questions.length === 0) {
            displayMessage(assessmentCreationMessage, 'Please add at least one question.', true);
            return;
        }

        try {
            const response = await fetch('/api/assessments', {
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
                displayMessage(assessmentCreationMessage, result.message, false);
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = ''; // Clear questions
                questionCounter = 0; // Reset counter
                addQuestionField(); // Add one empty question field back
                loadAssessments(); // Reload the list of assessments
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
            const assessments = await response.json();
            assessmentListDiv.innerHTML = '';

            if (assessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments available in this classroom.</p>';
            } else {
                assessments.forEach(assessment => {
                    const assessmentItem = document.createElement('div');
                    assessmentItem.classList.add('assessment-item');
                    assessmentItem.innerHTML = `
                        <div>
                            <h4>${assessment.title}</h4>
                            <p>${assessment.description || 'No description'}</p>
                            <p>Created by: ${getDisplayName(assessment.creator_username, assessment.creator_role || 'user')} on ${new Date(assessment.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            ${currentUser.role === 'admin' ?
                                `<button class="view-submissions-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>
                                <button class="delete-assessment-btn" data-assessment-id="${assessment.id}">Delete</button>` :
                                `<button class="take-assessment-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}" data-assessment-description="${assessment.description}">Take Assessment</button>`
                            }
                        </div>
                    `;
                    assessmentListDiv.appendChild(assessmentItem);
                });

                document.querySelectorAll('.take-assessment-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        const assessmentTitle = e.target.dataset.assessmentTitle;
                        const assessmentDescription = e.target.dataset.assessmentDescription;
                        takeAssessment(assessmentId, assessmentTitle, assessmentDescription);
                    });
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
        currentAssessmentToTake = { id: assessmentId, title: title, description: description };

        assessmentListContainer.classList.add('hidden');
        assessmentCreationForm.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden');
        takeAssessmentContainer.classList.add('user-view-subtle');
        viewSubmissionsContainer.classList.add('hidden');

        takeAssessmentTitle.textContent = title;
        takeAssessmentDescription.textContent = description;
        takeAssessmentForm.innerHTML = '';
        assessmentSubmissionMessage.textContent = '';

        try {
            const response = await fetch(`/api/assessments/${assessmentId}`); // Fetch full assessment details including questions
            const assessment = await response.json();
            currentAssessmentToTake = assessment; // Update with full object

            if (!assessment.questions || assessment.questions.length === 0) {
                takeAssessmentForm.innerHTML = '<p>No questions found for this assessment.</p>';
                submitAnswersBtn.disabled = true;
                return;
            }
            submitAnswersBtn.disabled = false;

            assessment.questions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('question-display');
                questionDiv.dataset.questionId = question.id;
                questionDiv.innerHTML = `<label>Question ${index + 1}: ${question.question_text || question.text}</label>`; // Handle both field names

                if (question.question_type === 'text' || question.type === 'text') {
                    const textarea = document.createElement('textarea');
                    textarea.name = `question_${question.id}`;
                    textarea.placeholder = 'Your answer here...';
                    textarea.rows = 3;
                    questionDiv.appendChild(textarea);
                } else if ((question.question_type === 'mcq' || question.type === 'mcq') && question.options) {
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
            takeAssessmentForm.innerHTML = '<p>Failed to load questions.</p>';
            submitAnswersBtn.disabled = true;
            showNotification('Failed to load assessment questions.', true);
        }
    }

    /**
     * Submits the user's answers for an assessment.
     */
    async function submitAnswers() {
        if (!currentAssessmentToTake || !currentClassroom || !currentClassroom.id) {
            showNotification('No assessment selected for submission.', true);
            return;
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
                question_text: questionData.question_text || questionData.text, // Use existing text or new 'text' field
                question_type: questionData.question_type || questionData.type, // Use existing type or new 'type' field
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
                    answers: answers
                })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(assessmentSubmissionMessage, `Assessment submitted! Your score: ${result.score}/${result.total_questions}`, false);
                submitAnswersBtn.disabled = true;
                showNotification(`Assessment submitted! Score: ${result.score}/${result.total_questions}`);
                setTimeout(() => {
                    loadAssessments();
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
                `;
                
                submission.answers.forEach(answer => {
                    const answerPair = document.createElement('div');
                    answerPair.classList.add('question-answer-pair');
                    answerPair.innerHTML = `
                        <p><strong>Q:</strong> ${answer.question_text}</p>
                        <p><strong>Your Answer:</strong> ${answer.user_answer || 'N/A'}</p>
                    `;
                    if (answer.is_correct !== undefined && answer.is_correct !== null) {
                        answerPair.innerHTML += `<p><strong>Correct:</strong> ${answer.is_correct ? 'Yes' : 'No'} (Expected: ${answer.correct_answer || 'N/A'})</p>`;
                        answerPair.style.backgroundColor = answer.is_correct ? '#e6ffe6' : '#ffe6e6';
                    } else if (answer.correct_answer) {
                        answerPair.innerHTML += `<p><strong>Expected Answer:</strong> ${answer.correct_answer}</p>`;
                    }
                    submissionItem.appendChild(answerPair);
                });
                submissionsList.appendChild(submissionItem);
            });

        } catch (error) {
            console.error('Error loading submissions:', error);
            submissionsList.innerHTML = '<p>Failed to load submissions.</p>';
            showNotification('Failed to load submissions.', true);
        }
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

    // Assessment Controls
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestionField);
    if (submitAssessmentBtn) submitAssessmentBtn.addEventListener('click', submitAssessment);
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', submitAnswers);
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




