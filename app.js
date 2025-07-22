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
                socket.emit('webrtc_answer', { classroomId: currentClassroom.id, recipient_id: peerId, answer: peerConnections[peerId].localDescription });
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
                message: `Admin ${currentUser.username} started a ${selectedType === 'video_audio' ? 'video' : 'audio only'} broadcast.`
            });

            // Iterate over all connected users (except self) and create peer connections
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/users`);
            const { users } = await response.json();
            users.forEach(user => {
                if (user.socket_id && user.socket_id !== socket.id) {
                    console.log(`[WebRTC] Admin: Creating peer connection for existing user ${user.username} (${user.socket_id})`);
                    createPeerConnection(user.socket_id, true); // true indicates caller (initiating offer)
                }
            });

        } catch (error) {
            console.error('[WebRTC] Error starting broadcast:', error);
            showNotification('Failed to start broadcast. Check camera/mic permissions.', true);
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
        }
        if (localVideo) {
            localVideo.srcObject = null;
        }
        // Close all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                socket.emit('webrtc_peer_disconnected', { classroomId: currentClassroom.id, peer_id: peerId });
            }
        }
        // Clear remote videos
        if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';

        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;
        if (currentUser && currentUser.role === 'admin') {
            showNotification("Broadcast ended.");
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Admin ${currentUser.username} ended the broadcast.`
            });
        }
    }

    /**
     * Creates a new RTCPeerConnection for a given peer.
     * @param {string} peerId - The socket ID of the remote peer.
     * @param {boolean} isCaller - True if this peer is initiating the call (creating the offer).
     */
    async function createPeerConnection(peerId, isCaller) {
        if (!currentClassroom || !currentClassroom.id || !socket) {
            console.error("Cannot create peer connection: Missing classroom info or socket.");
            return;
        }

        if (peerConnections[peerId]) {
            console.warn(`[WebRTC] Peer connection to ${peerId} already exists. Closing old one.`);
            peerConnections[peerId].close();
            const oldVideo = document.getElementById(`remote-video-${peerId}`);
            if (oldVideo) oldVideo.remove();
            delete peerConnections[peerId];
        }

        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;
        console.log(`[WebRTC] Created new RTCPeerConnection for peer: ${peerId}. Is caller: ${isCaller}`);

        // Add local stream tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
                console.log(`[WebRTC] Added local track (${track.kind}) to PC for ${peerId}`);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC] Sending ICE candidate to ${peerId}`);
                socket.emit('webrtc_ice_candidate', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    candidate: event.candidate
                });
            }
        };

        // Handle remote streams
        pc.ontrack = (event) => {
            console.log(`[WebRTC] Remote track received from ${peerId}:`, event.track);
            let remoteVideo = document.getElementById(`remote-video-${peerId}`);
            if (!remoteVideo) {
                remoteVideo = document.createElement('video');
                remoteVideo.id = `remote-video-${peerId}`;
                remoteVideo.autoplay = true;
                remoteVideo.controls = true; // For debugging
                remoteVideo.className = 'remote-video';
                remoteVideoContainer.appendChild(remoteVideo);
                console.log(`[WebRTC] Created video element for ${peerId}`);
            }

            // Assign the stream to the video element
            // Use event.streams[0] or create a new MediaStream for the track
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            } else {
                // Fallback for older browsers or specific scenarios
                let newStream = new MediaStream();
                newStream.addTrack(event.track);
                remoteVideo.srcObject = newStream;
            }
            console.log(`[WebRTC] Assigned remote stream to video element for ${peerId}`);
        };

        // Handle peer connection state changes (for debugging)
        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] PC state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                console.log(`[WebRTC] Peer ${peerId} connection state: ${pc.connectionState}. Cleaning up.`);
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
                const videoElement = document.getElementById(`remote-video-${peerId}`);
                if (videoElement) {
                    videoElement.remove();
                }
                // Optional: Notify server about disconnection if it wasn't already handled by 'user_left'
                // socket.emit('webrtc_peer_disconnected', { classroomId: currentClassroom.id, peer_id: peerId });
            }
        };


        if (isCaller) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log(`[WebRTC] Sending WebRTC Offer to: ${peerId} from ${socket.id}`);
                socket.emit('webrtc_offer', { classroomId: currentClassroom.id, recipient_id: peerId, offer: pc.localDescription });
            } catch (error) {
                console.error('[WebRTC] Error creating or sending offer:', error);
            }
        }
    }

    // --- Chat Functions ---

    /**
     * Sets up event listeners for chat functionality.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.onclick = () => {
                const message = chatInput.value.trim();
                if (message && currentClassroom && socket) {
                    socket.emit('message', {
                        classroomId: currentClassroom.id,
                        message: message
                    });
                    chatInput.value = '';
                }
            };
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessageBtn.click();
                }
            });
        }
    }

    // --- Whiteboard Functions ---

    /**
     * Initializes the whiteboard canvas context and sets up event listeners.
     */
    function setupWhiteboardControls() {
        if (whiteboardCanvas) {
            whiteboardCtx = whiteboardCanvas.getContext('2d');
            // Set canvas size to fill its container
            whiteboardCanvas.width = whiteboardCanvas.offsetWidth;
            whiteboardCanvas.height = whiteboardCanvas.offsetHeight;

            // Fill with black background
            whiteboardCtx.fillStyle = '#000000';
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

            // Set initial drawing properties
            whiteboardCtx.lineJoin = 'round';
            whiteboardCtx.lineCap = 'round';

            // Event Listeners for Drawing
            whiteboardCanvas.addEventListener('mousedown', startDrawing);
            whiteboardCanvas.addEventListener('mousemove', draw);
            whiteboardCanvas.addEventListener('mouseup', stopDrawing);
            whiteboardCanvas.addEventListener('mouseout', stopDrawing); // Stop drawing if mouse leaves canvas
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
                    console.log('Current tool:', currentTool);
                });
            });

            // Color picker
            if (colorPicker) {
                colorPicker.addEventListener('input', (e) => {
                    currentColor = e.target.value;
                    if (currentTool === 'pen') {
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

            // Undo/Redo/Clear/Save buttons
            if (undoButton) undoButton.addEventListener('click', undoWhiteboardAction);
            if (redoButton) redoButton.addEventListener('click', redoWhiteboardAction);
            if (clearButton) clearButton.addEventListener('click', clearWhiteboard);
            if (saveButton) saveButton.addEventListener('click', saveWhiteboard);

            // Whiteboard page navigation
            if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', goToPrevPage);
            if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', goToNextPage);

            updateUndoRedoButtons(); // Initial state
            updateWhiteboardPageDisplay(); // Initial display
        }
    }

    /**
     * Starts a drawing action on the whiteboard.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function startDrawing(e) {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can draw on the whiteboard.", true);
            return;
        }

        isDrawing = true;
        const { x, y } = getCanvasCoordinates(e);
        startX = x;
        startY = y;
        lastX = x;
        lastY = y;
        currentStrokePoints = [{ x, y }]; // Start new stroke
        whiteboardCtx.beginPath(); // Start a new path for pen/eraser
        whiteboardCtx.moveTo(startX, startY);

        // Save canvas state before drawing a shape (for live preview)
        if (currentTool !== 'pen' && currentTool !== 'eraser') {
            snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
    }

    /**
     * Handles drawing actions on the whiteboard.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function draw(e) {
        if (!isDrawing) return;

        const { x, y } = getCanvasCoordinates(e);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            whiteboardCtx.strokeStyle = currentTool === 'eraser' ? '#000000' : currentColor; // Eraser draws black
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';

            // Draw line segment
            whiteboardCtx.lineTo(x, y);
            whiteboardCtx.stroke();
            whiteboardCtx.moveTo(x, y); // Move to current point for next segment

            currentStrokePoints.push({ x, y }); // Add point to current stroke
            
            // Emit drawing data immediately for smooth real-time drawing
            if (socket && currentClassroom) {
                socket.emit('whiteboard_draw', {
                    classroomId: currentClassroom.id,
                    data: {
                        type: 'line',
                        points: [{x: lastX, y: lastY}, {x, y}], // Only send current segment
                        tool: currentTool,
                        color: currentColor, // Send original color even for eraser, client will convert
                        width: currentBrushSize
                    },
                    pageIndex: currentPageIndex
                });
            }
            lastX = x;
            lastY = y;

        } else if (currentTool === 'rectangle') {
            redrawWhiteboard(snapshot); // Restore previous state
            drawRectangle(startX, startY, x, y, currentColor, currentBrushSize);
        } else if (currentTool === 'circle') {
            redrawWhiteboard(snapshot); // Restore previous state
            drawCircle(startX, startY, x, y, currentColor, currentBrushSize);
        } else if (currentTool === 'line') {
            redrawWhiteboard(snapshot); // Restore previous state
            drawLine(startX, startY, x, y, currentColor, currentBrushSize);
        }
    }

    /**
     * Ends a drawing action on the whiteboard.
     */
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        whiteboardCtx.closePath(); // Close the current path

        if (currentTool === 'pen' || currentTool === 'eraser') {
            // A full stroke is complete, add it to history
            const drawingItem = {
                type: 'stroke', // Changed from 'line' to 'stroke' for full path
                points: [...currentStrokePoints], // Save all points for the stroke
                tool: currentTool,
                color: currentColor,
                width: currentBrushSize
            };
            addDrawingToHistory(drawingItem);
            // This full stroke will be re-drawn from history when needed, no need to emit it again here
            // The segments were already emitted during drawing
        } else {
            // For shapes (rectangle, circle, line), emit the final shape data
            const { x, y } = getCanvasCoordinates(event); // Use the last event that triggered draw()
            const drawingItem = {
                type: currentTool,
                startX, startY, endX: x, endY: y,
                color: currentColor,
                width: currentBrushSize
            };
            addDrawingToHistory(drawingItem);
            if (socket && currentClassroom) {
                socket.emit('whiteboard_draw', {
                    classroomId: currentClassroom.id,
                    data: drawingItem,
                    pageIndex: currentPageIndex
                });
            }
        }
        currentStrokePoints = []; // Reset points for next stroke
        snapshot = null; // Clear snapshot
        updateUndoRedoButtons();
    }

    /**
     * Gets coordinates relative to the canvas.
     * @param {MouseEvent|TouchEvent} e - The event object.
     * @returns {{x: number, y: number}} The x and y coordinates.
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
     * Applies drawing properties (color, width, composite operation) to the context.
     * This function is crucial for drawing historical items correctly.
     * @param {string} tool - The tool used ('pen', 'eraser', 'rectangle', etc.).
     * @param {string} color - The color string.
     * @param {number} width - The line width.
     */
    function applyDrawingProperties(tool, color, width) {
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = width;
        whiteboardCtx.fillStyle = color; // For filled shapes, if implemented
        if (tool === 'eraser') {
            whiteboardCtx.globalCompositeOperation = 'destination-out';
        } else {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }
    }

    /**
     * Draws a single whiteboard item onto the canvas.
     * This function should handle all types of drawing items.
     * @param {object} item - The drawing item object.
     */
    function drawWhiteboardItem(item) {
        whiteboardCtx.save(); // Save current state before applying item-specific properties
        applyDrawingProperties(item.tool || item.type, item.color, item.width);

        if (item.type === 'line' || item.type === 'stroke') {
            // Handle both single line segments (older 'line' type) and full strokes (newer 'stroke' type)
            if (item.points && item.points.length > 0) {
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.points[0].x, item.points[0].y);
                for (let i = 1; i < item.points.length; i++) {
                    whiteboardCtx.lineTo(item.points[i].x, item.points[i].y);
                }
                whiteboardCtx.stroke();
            } else if (item.startX !== undefined) { // Fallback for older single line segment
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.startX, item.startY);
                whiteboardCtx.lineTo(item.endX, item.endY);
                whiteboardCtx.stroke();
            }
        } else if (item.type === 'rectangle') {
            drawRectangle(item.startX, item.startY, item.endX, item.endY, item.color, item.width);
        } else if (item.type === 'circle') {
            drawCircle(item.startX, item.startY, item.endX, item.endY, item.color, item.width);
        } else if (item.type === 'text') {
            // Implement text drawing if needed
        }
        whiteboardCtx.restore(); // Restore state
    }

    /**
     * Draws a rectangle on the canvas.
     * @param {number} x1 - Start X.
     * @param {number} y1 - Start Y.
     * @param {number} x2 - End X.
     * @param {number} y2 - End Y.
     * @param {string} color - Stroke color.
     * @param {number} width - Line width.
     */
    function drawRectangle(x1, y1, x2, y2, color, width) {
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = width;
        whiteboardCtx.globalCompositeOperation = 'source-over'; // Rectangles are never 'eraser'
        whiteboardCtx.beginPath();
        whiteboardCtx.rect(x1, y1, x2 - x1, y2 - y1);
        whiteboardCtx.stroke();
    }

    /**
     * Draws a circle on the canvas.
     * @param {number} x1 - Center X (or start X for defining radius).
     * @param {number} y1 - Center Y (or start Y for defining radius).
     * @param {number} x2 - End X for radius calculation.
     * @param {number} y2 - End Y for radius calculation.
     * @param {string} color - Stroke color.
     * @param {number} width - Line width.
     */
    function drawCircle(x1, y1, x2, y2, color, width) {
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = width;
        whiteboardCtx.globalCompositeOperation = 'source-over';
        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        whiteboardCtx.beginPath();
        whiteboardCtx.arc(x1, y1, radius, 0, 2 * Math.PI);
        whiteboardCtx.stroke();
    }

    /**
     * Draws a line segment on the canvas.
     * @param {number} x1 - Start X.
     * @param {number} y1 - Start Y.
     * @param {number} x2 - End X.
     * @param {number} y2 - End Y.
     * @param {string} color - Stroke color.
     * @param {number} width - Line width.
     */
    function drawLine(x1, y1, x2, y2, color, width) {
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = width;
        whiteboardCtx.globalCompositeOperation = 'source-over';
        whiteboardCtx.beginPath();
        whiteboardCtx.moveTo(x1, y1);
        whiteboardCtx.lineTo(x2, y2);
        whiteboardCtx.stroke();
    }

    /**
     * Redraws the entire whiteboard based on the current page's history.
     * This is used for undo/redo, page changes, or loading history.
     * @param {ImageData} [imageData] - Optional imageData to restore a snapshot.
     */
    function redrawWhiteboard(imageData = null) {
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        if (imageData) {
            whiteboardCtx.putImageData(imageData, 0, 0);
        } else {
            // Redraw all items on the current page
            if (whiteboardPages[currentPageIndex]) {
                whiteboardPages[currentPageIndex].forEach(item => {
                    drawWhiteboardItem(item);
                });
            }
        }
    }

    /**
     * Adds a drawing action to the history stack and emits it to the server.
     * @param {object} drawingItem - The object representing the drawing action.
     */
    function addDrawingToHistory(drawingItem) {
        if (!whiteboardPages[currentPageIndex]) {
            whiteboardPages[currentPageIndex] = [];
        }
        // Clear redo stack when a new action is performed
        redoStack.length = 0;
        // Add to undo stack
        undoStack.push(JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex]))); // Save current state before adding new item

        whiteboardPages[currentPageIndex].push(drawingItem);

        // Keep history stack within limits
        if (undoStack.length > MAX_HISTORY_STEPS) {
            undoStack.shift(); // Remove oldest state
        }

        // Only emit if it's a full drawing item (shapes or completed strokes)
        // Line segments are emitted in `draw` for real-time.
        // For 'stroke' type, the individual points were already emitted.
        // For shapes, emit the full shape.
        if (socket && currentClassroom && drawingItem.type !== 'line') { // Exclude 'line' type as it's sent segment-by-segment
            socket.emit('whiteboard_draw', {
                classroomId: currentClassroom.id,
                data: drawingItem,
                pageIndex: currentPageIndex
            });
        }
    }

    /**
     * Undoes the last drawing action on the current page.
     */
    function undoWhiteboardAction() {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can undo on the whiteboard.", true);
            return;
        }

        if (undoStack.length > 0) {
            const lastState = undoStack.pop();
            redoStack.push(JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex]))); // Save current state to redo stack
            whiteboardPages[currentPageIndex] = lastState;
            renderCurrentWhiteboardPage();
            updateUndoRedoButtons();
            
            // This is a local undo. To reflect on others' whiteboards,
            // we'd need to emit a 'whiteboard_undo' event that tells the server
            // to re-send the updated history for the current page.
            // For now, let's just re-fetch history, which is simpler to ensure consistency.
            fetchWhiteboardHistory(); 
        } else {
            showNotification("Nothing to undo.", false);
        }
    }

    /**
     * Redoes the last undone drawing action on the current page.
     */
    function redoWhiteboardAction() {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can redo on the whiteboard.", true);
            return;
        }

        if (redoStack.length > 0) {
            const nextState = redoStack.pop();
            undoStack.push(JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex]))); // Save current state to undo stack
            whiteboardPages[currentPageIndex] = nextState;
            renderCurrentWhiteboardPage();
            updateUndoRedoButtons();

            // Similar to undo, re-fetch history to sync with server
            fetchWhiteboardHistory();
        } else {
            showNotification("Nothing to redo.", false);
        }
    }

    /**
     * Clears the current whiteboard page.
     */
    function clearWhiteboard() {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can clear the whiteboard.", true);
            return;
        }

        if (confirm("Are you sure you want to clear the current whiteboard page? This cannot be undone locally.")) {
            // Save current state to undo stack before clearing
            undoStack.push(JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex])));
            redoStack.length = 0; // Clear redo stack on clear

            whiteboardPages[currentPageIndex] = []; // Clear local page history
            renderCurrentWhiteboardPage(); // Redraw empty canvas
            updateUndoRedoButtons();

            if (socket && currentClassroom) {
                socket.emit('whiteboard_clear', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex
                });
            }
            showNotification("Whiteboard page cleared.");
        }
    }

    /**
     * Updates the enabled/disabled state of undo/redo buttons.
     */
    function updateUndoRedoButtons() {
        if (undoButton) undoButton.disabled = undoStack.length === 0 || currentUser.role !== 'admin';
        if (redoButton) redoButton.disabled = redoStack.length === 0 || currentUser.role !== 'admin';
    }

    /**
     * Saves the current whiteboard page as an image.
     */
    function saveWhiteboard() {
        if (!whiteboardCanvas) return;
        const link = document.createElement('a');
        link.download = `whiteboard-page-${currentPageIndex + 1}.png`;
        link.href = whiteboardCanvas.toDataURL('image/png');
        link.click();
        showNotification("Whiteboard saved as image.");
    }

    /**
     * Fetches the whiteboard history for the current classroom from the server.
     */
    async function fetchWhiteboardHistory() {
        if (!currentClassroom || !currentClassroom.id || !socket) {
            console.warn("Cannot fetch whiteboard history: Not in a classroom or socket not initialized.");
            return;
        }
        try {
            const response = await fetch(`/api/whiteboard_history/${currentClassroom.id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn("Whiteboard history not found for this classroom, starting fresh.");
                    whiteboardPages = [[]]; // Start with an empty first page
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                const history = await response.json();
                whiteboardPages = history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [[]]; // Ensure at least one page exists
                }
            }
            currentPageIndex = Math.min(currentPageIndex, whiteboardPages.length - 1); // Adjust index if too high
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            updateUndoRedoButtons();
            console.log('[Whiteboard] History fetched and rendered.');
        } catch (error) {
            console.error('[Whiteboard] Error fetching history:', error);
            showNotification('Failed to load whiteboard history.', true);
            // Fallback to empty whiteboard if history fetch fails
            whiteboardPages = [[]];
            currentPageIndex = 0;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            updateUndoRedoButtons();
        }
    }

    /**
     * Renders the drawing commands for the current page onto the canvas.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx || !whiteboardCanvas) {
            console.warn('[Whiteboard] Canvas context not ready for rendering.');
            return;
        }

        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black background
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const pageCommands = whiteboardPages[currentPageIndex];
        if (pageCommands) {
            pageCommands.forEach(item => {
                drawWhiteboardItem(item);
            });
        }
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    function goToPrevPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
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
    function goToNextPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
        } else {
            // If at the last page, create a new one
            whiteboardPages.push([]);
            currentPageIndex++;
            renderCurrentWhiteboardPage(); // Render blank new page
            updateWhiteboardPageDisplay();
            showNotification(`New whiteboard page created (${currentPageIndex + 1}).`);
        }
        if (socket && currentClassroom) {
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: currentPageIndex
            });
            // When navigating to a new page, also ensure history is saved on server
            // A full history sync might be needed or a specific 'add_page' event.
            // For now, relying on the 'whiteboard_draw' event to implicitly save page data.
        }
    }

    /**
     * Updates the whiteboard page number display.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} / ${whiteboardPages.length}`;
        }
    }

    // --- Library Functions ---

    /**
     * Loads and displays files from the classroom library.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) return;

        try {
            const response = await fetch(`/api/library/${currentClassroom.id}`);
            const files = await response.json();

            if (libraryFilesList) {
                libraryFilesList.innerHTML = ''; // Clear existing list
                if (files.length === 0) {
                    libraryFilesList.innerHTML = '<li>No files in library.</li>';
                } else {
                    files.forEach(file => {
                        const li = document.createElement('li');
                        li.className = 'library-file-item';
                        li.innerHTML = `
                            <span>${file.filename} (${(file.size / 1024).toFixed(2)} KB)</span>
                            <div class="file-actions">
                                <a href="/uploads/${file.filename}" target="_blank" class="download-btn" title="Download"><i class="fas fa-download"></i></a>
                                ${currentUser && currentUser.role === 'admin' ?
                                `<button class="delete-file-btn" data-filename="${file.filename}" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
                            </div>
                        `;
                        libraryFilesList.appendChild(li);
                    });

                    // Add event listeners for delete buttons
                    if (currentUser && currentUser.role === 'admin') {
                        document.querySelectorAll('.delete-file-btn').forEach(button => {
                            button.addEventListener('click', async (e) => {
                                const filenameToDelete = e.currentTarget.dataset.filename;
                                if (confirm(`Are you sure you want to delete "${filenameToDelete}"?`)) {
                                    try {
                                        const response = await fetch(`/api/library/${currentClassroom.id}/${filenameToDelete}`, {
                                            method: 'DELETE',
                                            headers: { 'Content-Type': 'application/json' }
                                        });
                                        const result = await response.json();
                                        if (response.ok) {
                                            showNotification(result.message);
                                            loadLibraryFiles(); // Reload list
                                            socket.emit('admin_action_update', {
                                                classroomId: currentClassroom.id,
                                                message: `Admin ${currentUser.username} deleted file "${filenameToDelete}" from library.`
                                            });
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
                    }
                }
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            if (libraryFilesList) {
                libraryFilesList.innerHTML = '<li>Failed to load library files.</li>';
            }
        }
    }


    // --- Assessment Functions ---

    /**
     * Loads assessments for the current classroom and displays them based on user role.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            if (assessmentListDiv) assessmentListDiv.innerHTML = '<li>Please enter a classroom to view assessments.</li>';
            return;
        }

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            const assessments = await response.json();

            showClassroomSubSection(assessmentsSection); // Ensure assessment section is visible
            assessmentListContainer.classList.remove('hidden');
            takeAssessmentContainer.classList.add('hidden');
            viewSubmissionsContainer.classList.add('hidden');

            if (assessmentListDiv) {
                assessmentListDiv.innerHTML = ''; // Clear previous list

                if (assessments.length === 0) {
                    assessmentListDiv.innerHTML = '<li>No assessments available in this classroom.</li>';
                } else {
                    assessments.forEach(assessment => {
                        const assessmentItem = document.createElement('div');
                        assessmentItem.className = 'assessment-item';
                        let actionsHtml = '';

                        // Admin actions
                        if (currentUser && currentUser.role === 'admin') {
                            actionsHtml += `
                                <button class="view-submissions-btn" data-assessment-id="${assessment._id}">View Submissions</button>
                                <button class="delete-assessment-btn" data-assessment-id="${assessment._id}">Delete</button>
                            `;
                        }
                        // User actions
                        if (currentUser && currentUser.role === 'user') {
                            // Check if user has already submitted
                            const hasSubmitted = assessment.submissions.some(sub => sub.userId === currentUser.id);
                            if (hasSubmitted) {
                                actionsHtml += `<span class="submitted-badge">Submitted</span>
                                                <button class="view-my-submission-btn" data-assessment-id="${assessment._id}">View My Submission</button>
                                                `;
                            } else {
                                actionsHtml += `<button class="take-assessment-btn" data-assessment-id="${assessment._id}">Take Assessment</button>`;
                            }
                        }

                        assessmentItem.innerHTML = `
                            <h4>${assessment.title}</h4>
                            <p>${assessment.description}</p>
                            <div class="assessment-actions">${actionsHtml}</div>
                        `;
                        assessmentListDiv.appendChild(assessmentItem);
                    });

                    // Attach event listeners for dynamic buttons
                    document.querySelectorAll('.take-assessment-btn').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const assessmentId = e.target.dataset.assessmentId;
                            currentAssessmentToTake = assessments.find(a => a._id === assessmentId);
                            if (currentAssessmentToTake) {
                                renderTakeAssessmentPage(currentAssessmentToTake);
                            }
                        });
                    });

                    document.querySelectorAll('.view-my-submission-btn').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const assessmentId = e.target.dataset.assessmentId;
                            const assessment = assessments.find(a => a._id === assessmentId);
                            if (assessment) {
                                const mySubmission = assessment.submissions.find(sub => sub.userId === currentUser.id);
                                if (mySubmission) {
                                    renderMySubmissionView(assessment, mySubmission);
                                } else {
                                    showNotification("Your submission not found.", true);
                                }
                            }
                        });
                    });

                    document.querySelectorAll('.view-submissions-btn').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const assessmentId = e.target.dataset.assessmentId;
                            const assessment = assessments.find(a => a._id === assessmentId);
                            if (assessment) {
                                renderSubmissionsView(assessment);
                            }
                        });
                    });

                    document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const assessmentId = e.target.dataset.assessmentId;
                            if (confirm('Are you sure you want to delete this assessment?')) {
                                try {
                                    const response = await fetch(`/api/assessments/${currentClassroom.id}/${assessmentId}`, {
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
                                    showNotification('An error occurred while deleting the assessment.', true);
                                }
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            if (assessmentListDiv) assessmentListDiv.innerHTML = '<li>Failed to load assessments.</li>';
            showNotification('Failed to load assessments.', true);
        }
    }

    /**
     * Renders the page for taking an assessment.
     * @param {object} assessment - The assessment object.
     */
    function renderTakeAssessmentPage(assessment) {
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden');
        viewSubmissionsContainer.classList.add('hidden');

        takeAssessmentTitle.textContent = assessment.title;
        takeAssessmentDescription.textContent = assessment.description;
        takeAssessmentForm.innerHTML = ''; // Clear previous questions

        assessment.questions.forEach((q, qIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'assessment-question';
            questionDiv.innerHTML = `<p>${qIndex + 1}. ${q.questionText}</p>`;

            if (q.type === 'multiple-choice') {
                q.options.forEach((option, oIndex) => {
                    const optionId = `q${qIndex}-o${oIndex}`;
                    questionDiv.innerHTML += `
                        <input type="radio" id="${optionId}" name="question-${qIndex}" value="${option}" required>
                        <label for="${optionId}">${option}</label><br>
                    `;
                });
            } else if (q.type === 'short-answer') {
                questionDiv.innerHTML += `
                    <textarea name="question-${qIndex}" rows="3" placeholder="Your answer..." required></textarea>
                `;
            }
            takeAssessmentForm.appendChild(questionDiv);
        });

        assessmentSubmissionMessage.textContent = '';
    }

    /**
     * Renders the view for a user's own submission.
     * @param {object} assessment - The assessment object.
     * @param {object} submission - The user's submission object.
     */
    function renderMySubmissionView(assessment, submission) {
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden'); // Re-use the take assessment container for display
        viewSubmissionsContainer.classList.add('hidden');

        takeAssessmentTitle.textContent = `${assessment.title} - Your Submission`;
        takeAssessmentDescription.textContent = `Score: ${submission.score}/${assessment.questions.length}`;
        
        takeAssessmentForm.innerHTML = ''; // Clear previous content

        assessment.questions.forEach((q, qIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'assessment-question';
            questionDiv.innerHTML = `<p>${qIndex + 1}. ${q.questionText}</p>`;

            const userAnswer = submission.answers[qIndex]?.answer || 'No answer provided.';
            const isCorrect = submission.answers[qIndex]?.isCorrect;
            const correctAnswer = q.correctAnswer;

            let answerHtml = `<p>Your Answer: <span class="${isCorrect ? 'correct-answer-text' : 'incorrect-answer-text'}">${userAnswer}</span></p>`;
            if (!isCorrect) {
                answerHtml += `<p>Correct Answer: <span class="correct-answer-text">${correctAnswer}</span></p>`;
            }
            
            questionDiv.innerHTML += answerHtml;
            takeAssessmentForm.appendChild(questionDiv);
        });

        // Hide submit button and show back button
        if (submitAnswersBtn) submitAnswersBtn.classList.add('hidden');
        if (backToAssessmentListBtn) backToAssessmentListBtn.classList.remove('hidden');
        assessmentSubmissionMessage.textContent = '';
    }

    /**
     * Renders the view for all submissions for an assessment (admin only).
     * @param {object} assessment - The assessment object.
     */
    function renderSubmissionsView(assessment) {
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.remove('hidden');

        submissionsAssessmentTitle.textContent = `${assessment.title} - All Submissions`;
        submissionsList.innerHTML = ''; // Clear previous submissions

        if (assessment.submissions && assessment.submissions.length > 0) {
            assessment.submissions.forEach(sub => {
                const submissionDiv = document.createElement('div');
                submissionDiv.className = 'submission-item';
                
                const submittedBy = sub.username || 'Unknown User'; // Get username from submission
                submissionDiv.innerHTML = `
                    <h5>Submission by: ${submittedBy}</h5>
                    <p>Score: ${sub.score}/${assessment.questions.length}</p>
                `;

                sub.answers.forEach((ans, ansIndex) => {
                    const question = assessment.questions[ansIndex];
                    if (question) {
                        const qDiv = document.createElement('div');
                        qDiv.className = 'submission-question-detail';
                        const isCorrect = ans.isCorrect;
                        qDiv.innerHTML = `
                            <p>${ansIndex + 1}. Question: ${question.questionText}</p>
                            <p>User Answer: <span class="${isCorrect ? 'correct-answer-text' : 'incorrect-answer-text'}">${ans.answer}</span></p>
                            <p>Correct Answer: <span class="correct-answer-text">${question.correctAnswer}</span></p>
                        `;
                        submissionDiv.appendChild(qDiv);
                    }
                });
                submissionsList.appendChild(submissionDiv);
            });
        } else {
            submissionsList.innerHTML = '<p>No submissions yet for this assessment.</p>';
        }
    }


    // --- Event Listeners ---

    // Auth
    if (showRegisterLink) showRegisterLink.addEventListener('click', () => {
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });

    if (showLoginLink) showLoginLink.addEventListener('click', () => {
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });

    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
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

    if (registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(authMessage, result.message + " You can now log in.", false);
                // Optionally switch to login form
                showLoginLink.click();
            } else {
                displayMessage(authMessage, result.error, true);
            }
        } catch (error) {
            console.error('Register error:', error);
            displayMessage(authMessage, 'An error occurred during registration.', true);
        }
    });

    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            const result = await response.json();
            if (response.ok) {
                currentUser = null;
                localStorage.removeItem('currentUser');
                cleanupClassroomResources(); // Clean up socket, WebRTC, whiteboard state
                showNotification(result.message);
                checkLoginStatus(); // Show auth section
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('An error occurred during logout.', true);
        }
    });

    // Dashboard
    if (createClassroomBtn) createClassroomBtn.addEventListener('click', async () => {
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
                    loadAvailableClassrooms(); // Reload classroom list
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Create classroom error:', error);
                displayMessage(classroomMessage, 'An error occurred while creating classroom.', true);
            }
        } else {
            displayMessage(classroomMessage, 'Classroom name cannot be empty.', true);
        }
    });

    // Navigation
    if (navDashboard) navDashboard.addEventListener('click', () => {
        cleanupClassroomResources();
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadAvailableClassrooms();
    });

    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => {
        cleanupClassroomResources();
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadAvailableClassrooms();
    });

    if (navSettings) navSettings.addEventListener('click', async () => {
        showSection(settingsSection);
        updateNavActiveState(navSettings);
        if (currentUser) {
            settingsUsernameInput.value = currentUser.username;
            settingsEmailInput.value = currentUser.email; // Email is disabled for editing
        }
    });

    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadAvailableClassrooms();
    });

    if (updateProfileForm) updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = settingsUsernameInput.value.trim();
        if (!username) {
            showNotification('Username cannot be empty.', true);
            return;
        }

        try {
            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const result = await response.json();
            if (response.ok) {
                currentUser.username = username; // Update local user object
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role); // Update dashboard display
                showNotification(result.message);
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Update profile error:', error);
            showNotification('An error occurred while updating profile.', true);
        }
    });

    // Classroom Sub-navigation
    if (navChat) navChat.addEventListener('click', () => {
        showClassroomSubSection(chatSection);
        updateNavActiveState(navChat);
    });
    if (navWhiteboard) navWhiteboard.addEventListener('click', () => {
        showClassroomSubSection(whiteboardArea);
        updateNavActiveState(navWhiteboard);
        // Ensure whiteboard is correctly initialized/rendered on display
        if (whiteboardCanvas && !whiteboardCtx) {
            setupWhiteboardControls();
            fetchWhiteboardHistory(); // Load if not already
        } else {
            renderCurrentWhiteboardPage(); // Just re-render if already set up
        }
    });
    if (navLibrary) navLibrary.addEventListener('click', () => {
        showClassroomSubSection(librarySection);
        updateNavActiveState(navLibrary);
        loadLibraryFiles();
    });
    if (navAssessments) navAssessments.addEventListener('click', () => {
        showClassroomSubSection(assessmentsSection);
        updateNavActiveState(navAssessments);
        loadAssessments(); // Reloads assessment list and manages sub-containers
    });

    // Share link functionality
    if (copyShareLinkBtn) copyShareLinkBtn.addEventListener('click', () => {
        if (shareLinkInput) {
            shareLinkInput.select();
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            showNotification('Classroom link copied to clipboard!');
        }
    });

    // Video Broadcast Controls
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }
    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }

    // Library file upload
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification("Only administrators can upload files to the library.", true);
                return;
            }
            if (!currentClassroom || !currentClassroom.id) {
                showNotification("Please enter a classroom first.", true);
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
                const response = await fetch(`/api/library/${currentClassroom.id}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    libraryFileInput.value = ''; // Clear file input
                    loadLibraryFiles(); // Reload file list
                    socket.emit('admin_action_update', {
                        classroomId: currentClassroom.id,
                        message: `Admin ${currentUser.username} uploaded new files to library.`
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

    // Assessment creation form submission
    if (assessmentCreationForm) assessmentCreationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionTextarea.value.trim();
        const questions = [];

        document.querySelectorAll('.assessment-question-group').forEach(qGroup => {
            const questionText = qGroup.querySelector('.question-text-input').value.trim();
            const questionType = qGroup.querySelector('.question-type-select').value;
            let questionData = { questionText, type: questionType };

            if (questionType === 'multiple-choice') {
                const options = [];
                qGroup.querySelectorAll('.mc-option-input').forEach(input => {
                    if (input.value.trim() !== '') {
                        options.push(input.value.trim());
                    }
                });
                const correctAnswer = qGroup.querySelector('.mc-correct-answer-select').value;
                questionData = { ...questionData, options, correctAnswer };
            } else if (questionType === 'short-answer') {
                const correctAnswer = qGroup.querySelector('.sa-correct-answer-input').value.trim();
                questionData = { ...questionData, correctAnswer };
            }
            questions.push(questionData);
        });

        if (!title || questions.length === 0 || questions.some(q => !q.questionText || !q.correctAnswer || (q.type === 'multiple-choice' && q.options.length < 2))) {
            displayMessage(assessmentCreationMessage, 'Please fill in all assessment details and add at least one question with options/answer.', true);
            return;
        }

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, questions })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(assessmentCreationMessage, result.message, false);
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = ''; // Clear questions
                loadAssessments(); // Reload assessments list
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `Admin ${currentUser.username} created a new assessment: "${title}".`
                });
            } else {
                displayMessage(assessmentCreationMessage, result.error, true);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            displayMessage(assessmentCreationMessage, 'An error occurred while creating the assessment.', true);
        }
    });

    // Add question button for assessment creation
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', () => {
        const questionIndex = questionsContainer.children.length;
        const questionGroup = document.createElement('div');
        questionGroup.className = 'assessment-question-group';
        questionGroup.innerHTML = `
            <h5>Question ${questionIndex + 1}</h5>
            <input type="text" class="question-text-input" placeholder="Question text" required>
            <select class="question-type-select">
                <option value="multiple-choice">Multiple Choice</option>
                <option value="short-answer">Short Answer</option>
            </select>
            <div class="multiple-choice-options">
                <input type="text" class="mc-option-input" placeholder="Option 1" required>
                <input type="text" class="mc-option-input" placeholder="Option 2" required>
                <button type="button" class="add-option-btn">Add Option</button>
                <br>
                Correct Answer:
                <select class="mc-correct-answer-select" required>
                    <option value="">Select Correct Option</option>
                </select>
            </div>
            <div class="short-answer-correct hidden">
                Correct Answer: <input type="text" class="sa-correct-answer-input" placeholder="Correct answer" required>
            </div>
            <button type="button" class="remove-question-btn">Remove Question</button>
        `;
        questionsContainer.appendChild(questionGroup);

        // Event listeners for new elements
        const typeSelect = questionGroup.querySelector('.question-type-select');
        const mcOptionsDiv = questionGroup.querySelector('.multiple-choice-options');
        const saCorrectDiv = questionGroup.querySelector('.short-answer-correct');
        const addOptionBtn = questionGroup.querySelector('.add-option-btn');
        const mcOptionInputs = questionGroup.querySelectorAll('.mc-option-input');
        const mcCorrectAnswerSelect = questionGroup.querySelector('.mc-correct-answer-select');

        // Update correct answer options when MC options change
        const updateMcCorrectOptions = () => {
            mcCorrectAnswerSelect.innerHTML = '<option value="">Select Correct Option</option>';
            questionGroup.querySelectorAll('.mc-option-input').forEach(input => {
                if (input.value.trim() !== '') {
                    const option = document.createElement('option');
                    option.value = input.value.trim();
                    option.textContent = input.value.trim();
                    mcCorrectAnswerSelect.appendChild(option);
                }
            });
        };

        mcOptionInputs.forEach(input => input.addEventListener('input', updateMcCorrectOptions));

        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'multiple-choice') {
                mcOptionsDiv.classList.remove('hidden');
                saCorrectDiv.classList.add('hidden');
            } else {
                mcOptionsDiv.classList.add('hidden');
                saCorrectDiv.classList.remove('hidden');
            }
        });

        addOptionBtn.addEventListener('click', () => {
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.className = 'mc-option-input';
            newInput.placeholder = `Option ${mcOptionsDiv.querySelectorAll('.mc-option-input').length + 1}`;
            newInput.required = true;
            newInput.addEventListener('input', updateMcCorrectOptions); // Add event listener for new input
            mcOptionsDiv.insertBefore(newInput, addOptionBtn);
        });

        questionGroup.querySelector('.remove-question-btn').addEventListener('click', () => {
            questionGroup.remove();
        });

        // Initial update for correct answer options (for the pre-filled inputs)
        updateMcCorrectOptions();
    });

    // Submit answers for assessment
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', async () => {
        if (!currentAssessmentToTake || !currentUser || !currentClassroom) {
            showNotification('No assessment selected or user/classroom not defined.', true);
            return;
        }

        const answers = [];
        let allQuestionsAnswered = true;

        currentAssessmentToTake.questions.forEach((q, qIndex) => {
            let userAnswer = '';
            let isCorrect = false;

            if (q.type === 'multiple-choice') {
                const selectedOption = document.querySelector(`input[name="question-${qIndex}"]:checked`);
                if (selectedOption) {
                    userAnswer = selectedOption.value;
                    isCorrect = userAnswer === q.correctAnswer;
                } else {
                    allQuestionsAnswered = false;
                }
            } else if (q.type === 'short-answer') {
                const textarea = document.querySelector(`textarea[name="question-${qIndex}"]`);
                if (textarea) {
                    userAnswer = textarea.value.trim();
                    isCorrect = userAnswer.toLowerCase() === q.correctAnswer.toLowerCase(); // Case-insensitive for short answer
                } else {
                    allQuestionsAnswered = false;
                }
            }
            answers.push({ questionId: q.questionId, answer: userAnswer, isCorrect: isCorrect });
        });

        if (!allQuestionsAnswered) {
            displayMessage(assessmentSubmissionMessage, 'Please answer all questions before submitting.', true);
            return;
        }

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}/${currentAssessmentToTake._id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(assessmentSubmissionMessage, result.message + ` Your score: ${result.score}/${result.totalQuestions}`, false);
                // Optionally show their submission after submission
                setTimeout(() => {
                    loadAssessments(); // Go back to assessment list to show "Submitted" status
                }, 2000);
                socket.emit('admin_action_update', {
                    classroomId: currentClassroom.id,
                    message: `User ${currentUser.username} submitted an assessment: "${currentAssessmentToTake.title}".`
                });
            } else {
                displayMessage(assessmentSubmissionMessage, result.error, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            displayMessage(assessmentSubmissionMessage, 'An error occurred while submitting the assessment.', true);
        }
    });

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
