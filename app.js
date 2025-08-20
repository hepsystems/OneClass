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
            // NOTE: data.sender_id is expected to be available
            const isSelf = currentUser && data.sender_id === currentUser.id;

            // Apply different styles based on who sent the message
            if (isSelf) {
                messageElement.classList.add('sent-message');
            } else {
                messageElement.classList.add('received-message');
            }

            const usernameSpan = document.createElement('span');
            usernameSpan.classList.add('chat-username');
            usernameSpan.textContent = getDisplayName(data.username, data.role);
            usernameSpan.style.color = getUsernameColor(data.username); // Apply a consistent color

            const messageSpan = document.createElement('span');
            messageSpan.classList.add('chat-message-text');
            messageSpan.textContent = data.message;

            messageElement.appendChild(usernameSpan);
            messageElement.appendChild(messageSpan);
            chatMessages.appendChild(messageElement);

            // Auto-scroll to the bottom of the chat window
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('new_assessment_available', (data) => {
            showNotification(`A new assessment "${data.title}" is now available!`, false);
            loadAssessments(); // Refresh the list
        });

        socket.on('assessment_scheduled', (data) => {
            showNotification(`Assessment "${data.title}" has been scheduled for ${new Date(data.scheduledAt).toLocaleString()}.`, false);
            loadAssessments();
        });

        socket.on('assessment_start_countdown', (data) => {
            showNotification(`Assessment "${data.title}" is starting in ${data.timeLeft / 1000} seconds!`, false);
        });

        socket.on('assessment_started', (data) => {
            showNotification(`Assessment "${data.title}" has officially started!`, false);
            // This could trigger a UI change to show the 'Take Assessment' button
            loadAssessments();
        });

        socket.on('assessment_ended', (data) => {
            showNotification(`Assessment "${data.title}" has ended.`, true);
            loadAssessments();
        });

        socket.on('file_uploaded', (data) => {
            console.log('File uploaded:', data.filename);
            showNotification(`New file "${data.filename}" added to the library.`);
            loadLibraryFiles();
        });

        // WebRTC signaling handlers
        socket.on('webrtc_offer', async (data) => {
            console.log('WEBRTC: Received offer from', data.sender_id);
            // Create a new peer connection for the offering peer
            const peerId = data.sender_id;
            const peer = createPeerConnection(peerId, true);
            await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('webrtc_answer', {
                'answer': answer,
                'recipient_id': peerId,
                'classroomId': currentClassroom.id
            });
        });

        socket.on('webrtc_answer', (data) => {
            console.log('WEBRTC: Received answer from', data.sender_id);
            const peer = peerConnections[data.sender_id];
            if (peer) {
                peer.setRemoteDescription(new RTCSessionDescription(data.answer));
            } else {
                console.error('WEBRTC: Peer connection not found for answer:', data.sender_id);
            }
        });

        socket.on('webrtc_ice_candidate', (data) => {
            console.log('WEBRTC: Received ICE candidate from', data.sender_id);
            const peer = peerConnections[data.sender_id];
            if (peer) {
                const candidate = new RTCIceCandidate(data.candidate);
                peer.addIceCandidate(candidate).catch(e => console.error('Error adding received ICE candidate', e));
            } else {
                console.error('WEBRTC: Peer connection not found for ICE candidate:', data.sender_id);
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            console.log('WEBRTC: Peer disconnected:', data.peer_id);
            const videoElement = document.getElementById(`video-${data.peer_id}`);
            if (videoElement) {
                videoElement.parentElement.remove(); // Remove the entire container
            }
            if (peerConnections[data.peer_id]) {
                peerConnections[data.peer_id].close();
                delete peerConnections[data.peer_id];
            }
        });

        socket.on('whiteboard_update', (data) => {
            console.log('Received whiteboard update:', data);
            if (!whiteboardCtx) {
                console.error('Whiteboard canvas context not found.');
                return;
            }
            if (data.pageIndex !== currentPageIndex) {
                return; // Ignore updates for other pages unless we explicitly switch to them
            }
            // Add the new command to our local history for this page
            whiteboardPages[currentPageIndex].push(data.command);
            // Redraw the canvas with the new state
            redrawWhiteboard(whiteboardPages[currentPageIndex]);
        });

        socket.on('new_whiteboard_page', (data) => {
            console.log('New page created:', data.pageIndex);
            if (data.pageIndex === whiteboardPages.length) {
                whiteboardPages.push([]); // Add a new empty page
                showNotification(`Admin created a new whiteboard page.`);
            }
            // If the user is on the last page, automatically switch to the new one
            if (currentPageIndex === data.pageIndex - 1) {
                currentPageIndex = data.pageIndex;
                updateWhiteboardPageDisplay();
                redrawWhiteboard(whiteboardPages[currentPageIndex]);
            }
        });

        socket.on('whiteboard_page_change_from_admin', (data) => {
            console.log('Admin switched page:', data.pageIndex);
            if (data.pageIndex < whiteboardPages.length) {
                currentPageIndex = data.pageIndex;
                updateWhiteboardPageDisplay();
                redrawWhiteboard(whiteboardPages[currentPageIndex]);
                showNotification(`Admin switched to whiteboard page ${currentPageIndex + 1}.`);
            }
        });

        socket.on('whiteboard_history', (data) => {
            console.log('Received full whiteboard history:', data);
            whiteboardPages = data.history;
            currentPageIndex = Math.min(currentPageIndex, whiteboardPages.length - 1);
            if (whiteboardPages.length === 0) {
                whiteboardPages = [[]];
                currentPageIndex = 0;
            }
            updateWhiteboardPageDisplay();
            redrawWhiteboard(whiteboardPages[currentPageIndex]);
        });
    }

    // --- WebRTC Functions ---

    /**
     * Starts the video broadcast for the admin.
     * @param {string} broadcastType - 'all' or 'classroom'.
     */
    async function startBroadcast(broadcastType) {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can start a broadcast.', true);
            return;
        }
        if (!currentClassroom || !currentClassroom.id) {
            showNotification('You must be in a classroom to start a broadcast.', true);
            return;
        }

        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            localVideo.srcObject = localStream;
            localVideo.style.display = 'block';
            startBroadcastBtn.disabled = true;
            endBroadcastBtn.disabled = false;
            showNotification("Broadcast started.");

            // Signal to the server that an admin is broadcasting
            socket.emit('webrtc_broadcast_started', {
                'classroomId': currentClassroom.id,
                'broadcastType': broadcastType
            });
            console.log(`WEBRTC: Broadcast started with type: ${broadcastType}`);

            // Set up a listener for new peers joining
            socket.on('webrtc_new_peer', async (data) => {
                if (data.peer_id === currentUser.id) return; // Don't connect to self
                console.log('WEBRTC: New peer joining:', data.peer_id);
                // Create a new peer connection and send an offer
                const peer = createPeerConnection(data.peer_id);
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socket.emit('webrtc_offer', {
                    'offer': offer,
                    'recipient_id': data.peer_id,
                    'classroomId': currentClassroom.id
                });
            });

        } catch (err) {
            console.error('Error starting broadcast:', err);
            showNotification('Could not start broadcast. Check camera/mic permissions.', true);
        }
    }

    /**
     * Stops the video broadcast.
     */
    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
            localVideo.style.display = 'none';
        }
        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;
        showNotification("Broadcast ended.");

        // Disconnect all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
            }
        }
        // Signal to the server that the broadcast has ended
        if (socket && currentClassroom && currentClassroom.id) {
            socket.emit('webrtc_broadcast_ended', {
                'classroomId': currentClassroom.id
            });
        }
    }

    /**
     * Creates a new WebRTC peer connection.
     * @param {string} peerId - The ID of the peer to connect to.
     * @param {boolean} isInitiator - Is this peer initiating the connection?
     * @returns {RTCPeerConnection} The new peer connection object.
     */
    function createPeerConnection(peerId, isInitiator = false) {
        if (peerConnections[peerId]) {
            console.warn('WEBRTC: Peer connection already exists for', peerId);
            return peerConnections[peerId];
        }
        const peer = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = peer;

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('WEBRTC: Sending ICE candidate to', peerId);
                socket.emit('webrtc_ice_candidate', {
                    'candidate': event.candidate,
                    'recipient_id': peerId,
                    'classroomId': currentClassroom.id
                });
            }
        };

        // For receiving the remote stream
        peer.ontrack = (event) => {
            console.log('WEBRTC: Received remote stream from peer:', peerId);
            const remoteVideo = document.getElementById(`video-${peerId}`);
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
            } else {
                // If video element doesn't exist, create it
                const videoWrapper = document.createElement('div');
                videoWrapper.className = 'remote-video-wrapper';
                videoWrapper.id = `video-wrapper-${peerId}`;

                const newVideo = document.createElement('video');
                newVideo.id = `video-${peerId}`;
                newVideo.srcObject = event.streams[0];
                newVideo.autoplay = true;
                newVideo.playsInline = true;

                const usernameLabel = document.createElement('div');
                usernameLabel.className = 'video-username-label';
                usernameLabel.textContent = peerId; // Placeholder

                videoWrapper.appendChild(newVideo);
                videoWrapper.appendChild(usernameLabel);
                remoteVideoContainer.appendChild(videoWrapper);
            }
        };

        // Add local stream if available and this is the broadcast initiator
        if (localStream && isInitiator) {
            localStream.getTracks().forEach(track => {
                peer.addTrack(track, localStream);
            });
        }
        return peer;
    }


    // --- Whiteboard Functions ---

    /**
     * Sets up the canvas and event listeners for the whiteboard.
     */
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) return;
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeWhiteboardCanvas();
        window.addEventListener('resize', resizeWhiteboardCanvas);

        whiteboardCanvas.addEventListener('mousedown', startDrawing);
        whiteboardCanvas.addEventListener('mouseup', endDrawing);
        whiteboardCanvas.addEventListener('mousemove', draw);
        whiteboardCanvas.addEventListener('mouseleave', endDrawing);

        // Touch events for mobile
        whiteboardCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            startDrawing({
                offsetX: touch.clientX,
                offsetY: touch.clientY
            });
        });

        whiteboardCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            endDrawing();
        });

        whiteboardCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            draw({
                offsetX: touch.clientX,
                offsetY: touch.clientY
            });
        });

        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                currentTool = button.dataset.tool;
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });

        colorPicker.addEventListener('input', (e) => currentColor = e.target.value);
        brushSizeSlider.addEventListener('input', (e) => currentBrushSize = e.target.value);
        undoButton.addEventListener('click', undoAction);
        redoButton.addEventListener('click', redoAction);
        clearButton.addEventListener('click', clearWhiteboard);
        saveButton.addEventListener('click', saveWhiteboard);
        prevWhiteboardPageBtn.addEventListener('click', () => switchWhiteboardPage(-1));
        nextWhiteboardPageBtn.addEventListener('click', () => switchWhiteboardPage(1));
        updateWhiteboardPageDisplay();
    }

    /**
     * Resizes the whiteboard canvas to fit its container.
     */
    function resizeWhiteboardCanvas() {
        if (whiteboardCanvas) {
            const container = whiteboardCanvas.parentElement;
            whiteboardCanvas.width = container.clientWidth;
            whiteboardCanvas.height = container.clientHeight;
            // Redraw the current page after resizing
            redrawWhiteboard(whiteboardPages[currentPageIndex]);
        }
    }

    /**
     * Starts a drawing action.
     * @param {Event} e - The mouse or touch event.
     */
    function startDrawing(e) {
        if (currentUser.role !== 'admin') return; // Only admins can draw
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        currentStrokePoints = [
            [lastX, lastY]
        ];
        if (currentTool === 'pen' || currentTool === 'eraser') {
            // No snapshot needed for continuous tools
        } else {
            // Take a snapshot of the canvas for shapes
            snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
    }

    /**
     * Ends a drawing action.
     */
    function endDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        // The drawing command is now complete. Record it.
        const command = {
            tool: currentTool,
            color: currentColor,
            size: currentBrushSize,
            points: currentStrokePoints,
            snapshot: snapshot // Only relevant for shapes, will be null for others
        };

        // Add to history and emit to others
        whiteboardPages[currentPageIndex].push(command);
        emitWhiteboardUpdate(command);
        // Clear redo stack on new action
        redoStack.length = 0;
        updateUndoRedoButtons();
    }

    /**
     * Draws on the canvas.
     * @param {Event} e - The mouse or touch event.
     */
    function draw(e) {
        if (!isDrawing) return;
        if (currentUser.role !== 'admin') return;

        const [x, y] = [e.offsetX, e.offsetY];
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';

        if (currentTool === 'pen') {
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(lastX, lastY);
            whiteboardCtx.lineTo(x, y);
            whiteboardCtx.stroke();
            [lastX, lastY] = [x, y];
            currentStrokePoints.push([x, y]);

        } else if (currentTool === 'eraser') {
            whiteboardCtx.strokeStyle = 'white';
            whiteboardCtx.lineWidth = currentBrushSize + 10; // Make eraser slightly bigger
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(lastX, lastY);
            whiteboardCtx.lineTo(x, y);
            whiteboardCtx.stroke();
            [lastX, lastY] = [x, y];
            currentStrokePoints.push([x, y]);
        } else if (currentTool === 'square') {
            redrawCanvasFromSnapshot();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = 2;
            whiteboardCtx.strokeRect(currentStrokePoints[0][0], currentStrokePoints[0][1], x - currentStrokePoints[0][0], y - currentStrokePoints[0][1]);
        } else if (currentTool === 'circle') {
            redrawCanvasFromSnapshot();
            const startX = currentStrokePoints[0][0];
            const startY = currentStrokePoints[0][1];
            const radiusX = Math.abs(x - startX);
            const radiusY = Math.abs(y - startY);
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = 2;
            whiteboardCtx.beginPath();
            whiteboardCtx.ellipse(startX, startY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            whiteboardCtx.stroke();
        } else if (currentTool === 'line') {
            redrawCanvasFromSnapshot();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(currentStrokePoints[0][0], currentStrokePoints[0][1]);
            whiteboardCtx.lineTo(x, y);
            whiteboardCtx.stroke();
        }
    }

    /**
     * Redraws the canvas from a stored snapshot.
     */
    function redrawCanvasFromSnapshot() {
        if (snapshot) {
            whiteboardCtx.putImageData(snapshot, 0, 0);
        } else {
            // Fallback: clear and redraw everything from the last full state
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            // This is not efficient for large histories, but a good fallback
            redrawWhiteboard(whiteboardPages[currentPageIndex]);
        }
    }


    /**
     * Redraws the entire whiteboard based on the drawing commands for the current page.
     * @param {Array} commands - An array of drawing command objects.
     */
    function redrawWhiteboard(commands) {
        if (!whiteboardCtx || !whiteboardCanvas) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        commands.forEach(cmd => {
            whiteboardCtx.strokeStyle = cmd.color || 'black';
            whiteboardCtx.lineWidth = cmd.size || 5;

            if (cmd.tool === 'pen' || cmd.tool === 'eraser') {
                whiteboardCtx.beginPath();
                // Ensure there are at least two points to draw a line
                if (cmd.points && cmd.points.length > 1) {
                    whiteboardCtx.moveTo(cmd.points[0][0], cmd.points[0][1]);
                    for (let i = 1; i < cmd.points.length; i++) {
                        whiteboardCtx.lineTo(cmd.points[i][0], cmd.points[i][1]);
                    }
                    whiteboardCtx.stroke();
                }
            } else if (cmd.tool === 'square' && cmd.points && cmd.points.length > 1) {
                const startX = cmd.points[0][0];
                const startY = cmd.points[0][1];
                const endX = cmd.points[cmd.points.length - 1][0];
                const endY = cmd.points[cmd.points.length - 1][1];
                whiteboardCtx.strokeStyle = cmd.color;
                whiteboardCtx.lineWidth = cmd.size;
                whiteboardCtx.strokeRect(startX, startY, endX - startX, endY - startY);
            } else if (cmd.tool === 'circle' && cmd.points && cmd.points.length > 1) {
                const startX = cmd.points[0][0];
                const startY = cmd.points[0][1];
                const endX = cmd.points[cmd.points.length - 1][0];
                const endY = cmd.points[cmd.points.length - 1][1];
                const radiusX = Math.abs(endX - startX) / 2;
                const radiusY = Math.abs(endY - startY) / 2;
                const centerX = startX + radiusX;
                const centerY = startY + radiusY;
                whiteboardCtx.strokeStyle = cmd.color;
                whiteboardCtx.lineWidth = cmd.size;
                whiteboardCtx.beginPath();
                whiteboardCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
                whiteboardCtx.stroke();
            } else if (cmd.tool === 'line' && cmd.points && cmd.points.length > 1) {
                const startX = cmd.points[0][0];
                const startY = cmd.points[0][1];
                const endX = cmd.points[cmd.points.length - 1][0];
                const endY = cmd.points[cmd.points.length - 1][1];
                whiteboardCtx.strokeStyle = cmd.color;
                whiteboardCtx.lineWidth = cmd.size;
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(startX, startY);
                whiteboardCtx.lineTo(endX, endY);
                whiteboardCtx.stroke();
            }
        });
    }


    /**
     * Emits a whiteboard update to the server.
     * @param {Object} command - The drawing command object.
     */
    function emitWhiteboardUpdate(command) {
        if (socket && currentClassroom) {
            socket.emit('whiteboard_update', {
                command: command,
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex
            });
        }
    }

    /**
     * Fetches the full whiteboard history from the server.
     */
    function fetchWhiteboardHistory() {
        if (socket && currentClassroom) {
            socket.emit('request_whiteboard_history', {
                classroomId: currentClassroom.id
            });
        }
    }

    /**
     * Switches to a different whiteboard page.
     * @param {number} direction - 1 for next page, -1 for previous.
     */
    function switchWhiteboardPage(direction) {
        let newPageIndex = currentPageIndex + direction;
        if (newPageIndex >= 0 && newPageIndex < whiteboardPages.length) {
            currentPageIndex = newPageIndex;
            updateWhiteboardPageDisplay();
            redrawWhiteboard(whiteboardPages[currentPageIndex]);
            // Notify server of page change (only for admins to broadcast)
            if (currentUser.role === 'admin') {
                socket.emit('whiteboard_page_change', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex
                });
            }
        }
    }

    /**
     * Updates the UI to show the current page number.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
        }
        // Enable/disable navigation buttons
        prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
        nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1;
    }


    /**
     * Undoes the last drawing action on the current page.
     */
    function undoAction() {
        if (whiteboardPages[currentPageIndex].length > 0) {
            const lastCommand = whiteboardPages[currentPageIndex].pop();
            redoStack.push(lastCommand);
            redrawWhiteboard(whiteboardPages[currentPageIndex]);
            updateUndoRedoButtons();
            // TODO: Signal server to undo
        }
    }

    /**
     * Redoes the last undone drawing action.
     */
    function redoAction() {
        if (redoStack.length > 0) {
            const lastUndone = redoStack.pop();
            whiteboardPages[currentPageIndex].push(lastUndone);
            redrawWhiteboard(whiteboardPages[currentPageIndex]);
            updateUndoRedoButtons();
            // TODO: Signal server to redo
        }
    }

    /**
     * Updates the disabled state of undo/redo buttons.
     */
    function updateUndoRedoButtons() {
        if (undoButton) undoButton.disabled = whiteboardPages[currentPageIndex].length === 0;
        if (redoButton) redoButton.disabled = redoStack.length === 0;
    }

    /**
     * Clears the whiteboard canvas.
     */
    function clearWhiteboard() {
        if (confirm('Are you sure you want to clear the whiteboard? This cannot be undone.')) {
            whiteboardPages[currentPageIndex] = [];
            redrawWhiteboard([]); // Clear the canvas
            updateUndoRedoButtons();
            // TODO: Signal server to clear
        }
    }

    /**
     * Saves the current whiteboard page as an image.
     */
    function saveWhiteboard() {
        if (whiteboardCanvas) {
            const image = whiteboardCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `whiteboard-page-${currentPageIndex + 1}.png`;
            link.href = image;
            link.click();
            showNotification('Whiteboard saved as image.');
        }
    }


    // --- Chat Functions ---

    /**
     * Sets up event listeners for the chat functionality.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }

    /**
     * Sends a chat message via Socket.IO.
     */
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && socket && currentClassroom) {
            const messageData = {
                message: message,
                classroomId: currentClassroom.id
            };
            socket.emit('message', messageData);
            chatInput.value = '';
        }
    }

    /**
     * Generates a consistent color for a given username.
     * @param {string} username - The username to generate a color for.
     * @returns {string} A CSS color string (e.g., '#AABBCC').
     */
    function getUsernameColor(username) {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const color = `hsl(${hash % 360}, 70%, 50%)`;
        return color;
    }


    // --- Library Functions ---

    /**
     * Loads and displays the list of files in the classroom library.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classroom-library/${currentClassroom.id}`);
            if (!response.ok) {
                throw new Error('Failed to load library files.');
            }
            const files = await response.json();
            libraryFilesList.innerHTML = '';
            const searchTerm = librarySearchInput.value.toLowerCase();

            const filteredFiles = files.filter(file => file.filename.toLowerCase().includes(searchTerm));

            if (filteredFiles.length === 0) {
                libraryFilesList.innerHTML = '<p>No files found.</p>';
                return;
            }

            filteredFiles.forEach(file => {
                const li = document.createElement('li');
                li.className = 'library-file-item';
                const fileIcon = getFileIcon(file.filename);
                li.innerHTML = `
                    <div class="file-info">
                        <i class="fas ${fileIcon}"></i>
                        <span class="file-name">${file.filename}</span>
                    </div>
                    <div class="file-actions">
                        <a href="/api/download-file/${file.id}" class="btn-info" target="_blank" download><i class="fas fa-download"></i> Download</a>
                    </div>
                `;
                libraryFilesList.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading library files:', error);
            showNotification('Failed to load classroom library.', true);
        }
    }

    /**
     * Determines the appropriate FontAwesome icon for a given filename.
     * @param {string} filename - The name of the file.
     * @returns {string} A FontAwesome icon class.
     */
    function getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf':
                return 'fa-file-pdf';
            case 'doc':
            case 'docx':
                return 'fa-file-word';
            case 'xls':
            case 'xlsx':
                return 'fa-file-excel';
            case 'ppt':
            case 'pptx':
                return 'fa-file-powerpoint';
            case 'zip':
            case 'rar':
                return 'fa-file-archive';
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return 'fa-file-image';
            case 'mp4':
            case 'mov':
            case 'avi':
                return 'fa-file-video';
            case 'mp3':
            case 'wav':
                return 'fa-file-audio';
            default:
                return 'fa-file';
        }
    }

    // --- Assessments Functions ---

    /**
     * Loads and displays the list of assessments for the current classroom.
     */
    async function loadAssessments() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`);
            if (!response.ok) throw new Error('Failed to load assessments.');
            const assessments = await response.json();

            // Filter by search term
            const searchTerm = assessmentSearchInput.value.toLowerCase();
            const filteredAssessments = assessments.filter(assessment =>
                assessment.title.toLowerCase().includes(searchTerm) ||
                assessment.description.toLowerCase().includes(searchTerm)
            );

            assessmentListDiv.innerHTML = '';
            if (filteredAssessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments found.</p>';
            } else {
                filteredAssessments.forEach(assessment => {
                    const assessmentElement = document.createElement('div');
                    assessmentElement.className = 'assessment-item';
                    const isUpcoming = new Date(assessment.scheduledAt) > new Date();
                    const hasEnded = new Date(assessment.endTime) < new Date();
                    const isLive = !isUpcoming && !hasEnded;

                    let statusText = '';
                    let statusClass = '';
                    if (isUpcoming) {
                        statusText = `Scheduled for: ${new Date(assessment.scheduledAt).toLocaleString()}`;
                        statusClass = 'status-upcoming';
                    } else if (hasEnded) {
                        statusText = 'Status: Ended';
                        statusClass = 'status-ended';
                    } else if (isLive) {
                        statusText = 'Status: Live';
                        statusClass = 'status-live';
                    }

                    assessmentElement.innerHTML = `
                        <h4>${assessment.title}</h4>
                        <p>${assessment.description}</p>
                        <p class="assessment-status ${statusClass}">${statusText}</p>
                        <button class="btn-primary" onclick="showAssessmentDetails('${assessment.id}')">View Details</button>
                    `;
                    assessmentListDiv.appendChild(assessmentElement);
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            showNotification('Failed to load assessments.', true);
        }
    }

    /**
     * Displays the details of a specific assessment and the option to take it.
     * @param {string} assessmentId - The ID of the assessment to display.
     */
    async function showAssessmentDetails(assessmentId) {
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            if (!response.ok) throw new Error('Failed to load assessment details.');
            const assessment = await response.json();
            currentAssessmentToTake = assessment;

            takeAssessmentTitle.textContent = assessment.title;
            takeAssessmentDescription.textContent = assessment.description;

            // Clear previous questions and populate new ones
            takeAssessmentForm.innerHTML = '';
            assessment.questions.forEach((question, qIndex) => {
                const qDiv = document.createElement('div');
                qDiv.className = 'question';
                qDiv.innerHTML = `<p class="question-text">${qIndex + 1}. ${question.questionText}</p>`;
                if (question.type === 'multiple-choice' && question.options) {
                    question.options.forEach((option, oIndex) => {
                        qDiv.innerHTML += `
                            <label class="mcq-option">
                                <input type="radio" name="question-${qIndex}" value="${oIndex}" required>
                                <span>${option}</span>
                            </label>
                        `;
                    });
                } else if (question.type === 'short-answer') {
                    qDiv.innerHTML += `<textarea name="question-${qIndex}" placeholder="Your answer" required></textarea>`;
                }
                takeAssessmentForm.appendChild(qDiv);
            });

            showClassroomSubSection(takeAssessmentContainer);
            startAssessmentTimer(assessment);

        } catch (error) {
            console.error('Error showing assessment:', error);
            showNotification('Failed to load assessment details.', true);
        }
    }

    /**
     * Starts the countdown timer for an assessment.
     * @param {Object} assessment - The assessment object with scheduledAt and durationMinutes.
     */
    function startAssessmentTimer(assessment) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
        }

        const scheduledTime = new Date(assessment.scheduledAt);
        const durationMs = assessment.durationMinutes * 60 * 1000;
        assessmentEndTime = new Date(scheduledTime.getTime() + durationMs);

        assessmentTimerInterval = setInterval(() => {
            const now = new Date();
            const timeLeftMs = assessmentEndTime.getTime() - now.getTime();

            if (timeLeftMs <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = 'Time\'s Up!';
                submitAnswersBtn.disabled = true;
                showNotification("Time for the assessment has run out. Your answers have been submitted.", true);
                submitAssessmentAnswers();
                return;
            }

            const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

            const timerString = `Time Left: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            assessmentTimerDisplay.textContent = timerString;

            // Update timer display style based on time left
            if (timeLeftMs < 60 * 1000) { // Less than 1 minute
                assessmentTimerDisplay.classList.add('critical');
                assessmentTimerDisplay.classList.remove('warning', 'active');
            } else if (timeLeftMs < 5 * 60 * 1000) { // Less than 5 minutes
                assessmentTimerDisplay.classList.add('warning');
                assessmentTimerDisplay.classList.remove('critical', 'active');
            } else {
                assessmentTimerDisplay.classList.add('active');
                assessmentTimerDisplay.classList.remove('warning', 'critical');
            }
        }, 1000);
    }

    /**
     * Submits the user's answers for an assessment.
     */
    async function submitAssessmentAnswers() {
        if (!currentAssessmentToTake || !currentUser) {
            showNotification('Error: No assessment or user information found.', true);
            return;
        }

        // Prevent multiple submissions
        submitAnswersBtn.disabled = true;

        const answers = [];
        const formData = new FormData(takeAssessmentForm);
        currentAssessmentToTake.questions.forEach((question, qIndex) => {
            const questionName = `question-${qIndex}`;
            let answer = null;
            if (question.type === 'multiple-choice') {
                const selectedOptionIndex = formData.get(questionName);
                if (selectedOptionIndex !== null) {
                    answer = question.options[parseInt(selectedOptionIndex)];
                }
            } else if (question.type === 'short-answer') {
                answer = formData.get(questionName);
            }
            answers.push({
                questionId: question.id,
                answer: answer
            });
        });

        try {
            const response = await fetch(`/api/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    answers: answers
                })
            });

            const result = await response.json();
            if (response.ok) {
                showNotification('Assessment submitted successfully!', false);
                backToAssessmentListBtn.click(); // Go back to the list
            } else {
                showNotification(result.error, true);
                submitAnswersBtn.disabled = false; // Re-enable button on error
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            showNotification('An error occurred while submitting the assessment.', true);
            submitAnswersBtn.disabled = false; // Re-enable button on error
        }
    }


    /**
     * Toggles the display of assessment submission details for a specific assessment.
     * @param {string} assessmentId - The ID of the assessment.
     */
    async function showAssessmentSubmissions(assessmentId) {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can view submissions.', true);
            return;
        }
        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            if (!response.ok) throw new Error('Failed to load submissions.');
            const submissions = await response.json();

            submissionsList.innerHTML = '';
            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions yet.</p>';
            } else {
                submissions.forEach(submission => {
                    const submissionDiv = document.createElement('div');
                    submissionDiv.className = 'submission-item';
                    const score = submission.score !== null ? `${submission.score} / ${submission.maxScore}` : 'N/A';
                    submissionDiv.innerHTML = `
                        <h4>Submission by: ${submission.username}</h4>
                        <p>Score: ${score}</p>
                        <p>Submitted At: ${new Date(submission.timestamp).toLocaleString()}</p>
                        <button class="btn-secondary" onclick="viewSingleSubmission('${submission.id}')">View Details</button>
                    `;
                    submissionsList.appendChild(submissionDiv);
                });
            }

            // You might want to get the assessment title to display
            const assessmentTitleResponse = await fetch(`/api/assessments/${assessmentId}`);
            const assessment = await assessmentTitleResponse.json();
            submissionsAssessmentTitle.textContent = `Submissions for: ${assessment.title}`;

            showClassroomSubSection(viewSubmissionsContainer);
        } catch (error) {
            console.error('Error loading submissions:', error);
            showNotification('Failed to load submissions.', true);
        }
    }

    /**
     * Displays the details of a single submission.
     * @param {string} submissionId - The ID of the submission.
     */
    async function viewSingleSubmission(submissionId) {
        // Implement a function to fetch and display a single submission's answers
        // This is a more detailed view of the submitted answers
        try {
            const response = await fetch(`/api/submissions/${submissionId}`);
            if (!response.ok) throw new Error('Failed to load submission details.');
            const submission = await response.json();
            console.log(submission);
            // This is a placeholder. You would build a detailed UI here.
            showNotification(`Viewing details for submission by ${submission.username}.`, false);
        } catch (error) {
            console.error('Error loading single submission:', error);
            showNotification('Failed to load submission details.', true);
        }
    }


    // --- Event Listeners ---

    // Authentication Form Listeners
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

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.elements['login-email'].value;
            const password = e.target.elements['login-password'].value;
            authMessage.textContent = 'Logging in...';

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
                    loginForm.reset();
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Login error:', error);
                displayMessage(authMessage, 'An error occurred. Please try again.', true);
            }
        });
    }

    // Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.elements['register-username'].value;
            const email = e.target.elements['register-email'].value;
            const password = e.target.elements['register-password'].value;
            authMessage.textContent = 'Registering...';

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const result = await response.json();

                if (response.ok) {
                    showNotification(result.message);
                    loginContainer.classList.remove('hidden');
                    registerContainer.classList.add('hidden');
                    displayMessage(authMessage, result.message, false);
                    registerForm.reset();
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Registration error:', error);
                displayMessage(authMessage, 'An error occurred. Please try again.', true);
            }
        });
    }

    // Dashboard and Navigation
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                const result = await response.json();
                if (response.ok) {
                    localStorage.removeItem('currentUser');
                    currentUser = null;
                    cleanupClassroomResources();
                    showNotification(result.message);
                    checkLoginStatus(); // Switch back to auth section
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
                    showNotification(result.message);
                    newClassroomNameInput.value = '';
                    loadAvailableClassrooms(); // Reload the list
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Create classroom error:', error);
                displayMessage(classroomMessage, 'An error occurred.', true);
            }
        });
    }

    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadAvailableClassrooms);
    }

    // Classroom Navigation
    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            cleanupClassroomResources();
            loadAvailableClassrooms(); // Reload the list
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

    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            cleanupClassroomResources();
            loadAvailableClassrooms();
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

    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            // Don't need to cleanup classroom resources, as we are still logged in.
        });
    }

    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
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
                    showNotification('Profile updated successfully!');
                    currentUser = { ...currentUser,
                        username: username
                    };
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Update profile error:', error);
                showNotification('An error occurred while updating your profile.', true);
            }
        });
    }

    // Share Link
    if (shareLinkInput) {
        shareLinkInput.addEventListener('click', () => shareLinkInput.select());
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            showNotification('Classroom link copied to clipboard!');
        });
    }

    // Broadcast Controls
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', () => {
            const broadcastType = document.querySelector('input[name="broadcastType"]:checked').value;
            startBroadcast(broadcastType);
        });
    }

    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
    }

    // Library Controls
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
                const response = await fetch('/api/upload-library-files', {
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
                console.error('Error uploading files:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }

    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }

    // Assessment Controls
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addQuestionToForm();
        });
    }

    if (submitAssessmentBtn) {
        submitAssessmentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            createAssessment();
        });
    }

    if (assessmentSearchInput) {
        assessmentSearchInput.addEventListener('input', loadAssessments);
    }

    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', (e) => {
            e.preventDefault();
            submitAssessmentAnswers();
        });
    }

    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            loadAssessments();
        });
    }

    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentsSection);
            loadAssessments();
        });
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
