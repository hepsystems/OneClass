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
                                headers: {
                                    'Content-Type': 'application/json'
                                },
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

    // Handle create classroom button click
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
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name: classroomName }),
                });

                const result = await response.json();
                if (response.ok) {
                    displayMessage(classroomMessage, result.message, false);
                    newClassroomNameInput.value = '';
                    loadAvailableClassrooms();
                    showSection(dashboardSection); // Go back to dashboard to see new class
                    enterClassroom(result.classroomId, classroomName); // Immediately enter new class
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred. Please try again.', true);
            }
        });
    }


    // --- Classroom Functions ---

    /**
     * Enters a specific classroom, updates UI, initializes Socket.IO, and loads content.
     * @param {string} id - The ID of the classroom.
     * @param {string} name - The name of the classroom.
     */
    function enterClassroom(id, name) {
        currentClassroom = { id, name };
        localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom));
        showSection(classroomSection);
        updateNavActiveState(navChat);
        showClassroomSubSection(chatSection); // Default to chat section
        classNameValue.textContent = name;
        classCodeSpan.textContent = id;
        document.title = `One Class - ${name}`;
        initializeSocket();
        loadChatHistory();
        loadLibraryFiles();
        loadAssessments();
        updateShareLink();
        updateUIBasedOnRole();
        stopBroadcast(); // Ensure any existing broadcast is stopped
    }

    /**
     * Updates the shareable link input field.
     */
    function updateShareLink() {
        if (currentClassroom) {
            const shareUrl = `${window.location.origin}/classroom/${currentClassroom.id}`;
            shareLinkInput.value = shareUrl;
        } else {
            shareLinkInput.value = '';
        }
    }

    /**
     * Copies the shareable link to the clipboard.
     */
    function copyShareLink() {
        if (shareLinkInput) {
            shareLinkInput.select();
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            showNotification('Link copied to clipboard!');
        }
    }

    // --- Socket.IO Functions ---

    /**
     * Initializes the Socket.IO connection and sets up listeners.
     */
    function initializeSocket() {
        if (socket) {
            socket.disconnect();
        }
        socket = io({
            auth: {
                token: currentUser ? currentUser.id : null // Pass user ID for authentication
            }
        });

        socket.on('connect', () => {
            console.log('Connected to server as:', socket.id);
            if (currentClassroom && currentUser) {
                socket.emit('join', {
                    classroomId: currentClassroom.id,
                    username: currentUser.username,
                    role: currentUser.role
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server.');
        });

        socket.on('status_message', (data) => {
            const messageEl = document.createElement('div');
            messageEl.textContent = data.message;
            messageEl.classList.add('system-message');
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('new_chat_message', (data) => {
            const messageEl = document.createElement('div');
            messageEl.classList.add('chat-message-item');
            messageEl.innerHTML = `<strong>${getDisplayName(data.username, data.role)}:</strong> ${data.message}`;
            chatMessages.appendChild(messageEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('whiteboard_state', (data) => {
            console.log('Received whiteboard state:', data);
            if (whiteboardCanvas) {
                whiteboardPages = data.pages;
                currentPageIndex = data.currentPageIndex;
                redrawWhiteboard();
                updateWhiteboardPageDisplay();
            }
        });

        socket.on('whiteboard_draw_command', (command) => {
            console.log('Received whiteboard command:', command);
            executeWhiteboardCommand(command, false); // Execute, but don't broadcast
        });

        socket.on('new_library_file', (data) => {
            console.log('Received new file data:', data);
            addFileToLibraryList(data.file);
            showNotification(`New file "${data.file.filename}" uploaded by ${data.username}!`);
        });

        socket.on('file_deleted_confirmation', (data) => {
            console.log('File deleted confirmation:', data);
            showNotification(`File "${data.filename}" has been deleted.`);
            // Re-load the list to ensure it's up to date
            loadLibraryFiles();
        });

        socket.on('new_assessment', (data) => {
            showNotification(`A new assessment, "${data.title}", has been created!`);
            loadAssessments();
        });

        socket.on('assessment_deleted_confirmation', (data) => {
            showNotification(`Assessment "${data.title}" has been deleted.`);
            loadAssessments();
        });

        socket.on('new_submission', (data) => {
            showNotification(`A new submission for "${data.title}" has been received!`);
        });

        // WebRTC Signaling
        socket.on('webrtc_peer_offer', async (data) => {
            console.log('WEBRTC: Received peer offer from', data.sender_id);
            const peerId = data.sender_id;
            await createPeerConnection(peerId, true);
            await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnections[peerId].createAnswer();
            await peerConnections[peerId].setLocalDescription(answer);
            socket.emit('webrtc_peer_answer', {
                recipient_id: peerId,
                answer: peerConnections[peerId].localDescription,
                classroomId: currentClassroom.id
            });
        });

        socket.on('webrtc_peer_answer', async (data) => {
            console.log('WEBRTC: Received peer answer from', data.sender_id);
            await peerConnections[data.sender_id].setRemoteDescription(new RTCSessionDescription(data.answer));
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            console.log('WEBRTC: Received ICE candidate from', data.sender_id);
            if (peerConnections[data.sender_id]) {
                try {
                    await peerConnections[data.sender_id].addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding received ICE candidate', e);
                }
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            console.log('WEBRTC: Peer disconnected:', data.peer_id);
            const remoteVideoEl = document.getElementById(`remote-video-${data.peer_id}`);
            if (remoteVideoEl) {
                remoteVideoEl.remove();
            }
            if (peerConnections[data.peer_id]) {
                peerConnections[data.peer_id].close();
                delete peerConnections[data.peer_id];
            }
        });

        socket.on('admin_action_update', (data) => {
            showNotification(`Admin Action: ${data.message}`, false);
        });

        socket.on('classroom_user_list', (users) => {
            console.log('Updated user list:', users);
            // This can be used to display a list of users in the future
        });
    }

    /**
     * Creates and initializes a new RTCPeerConnection.
     * @param {string} peerId - The ID of the peer to connect to.
     * @param {boolean} isOfferer - True if this client is the one creating the offer.
     */
    async function createPeerConnection(peerId, isOfferer) {
        if (peerConnections[peerId]) {
            console.log(`Peer connection to ${peerId} already exists.`);
            return;
        }

        console.log('Creating new peer connection for:', peerId);
        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate to peer:', peerId);
                socket.emit('webrtc_ice_candidate', {
                    recipient_id: peerId,
                    candidate: event.candidate,
                    classroomId: currentClassroom.id
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('Received remote stream from peer:', peerId);
            const remoteVideoEl = document.getElementById(`remote-video-${peerId}`);
            if (remoteVideoEl) {
                remoteVideoEl.srcObject = event.streams[0];
            } else {
                const newVideoEl = document.createElement('video');
                newVideoEl.id = `remote-video-${peerId}`;
                newVideoEl.srcObject = event.streams[0];
                newVideoEl.autoplay = true;
                newVideoEl.playsinline = true; // For iOS compatibility
                newVideoEl.muted = false;
                newVideoEl.setAttribute('data-peer-id', peerId);
                const videoWrapper = document.createElement('div');
                videoWrapper.className = 'remote-video-wrapper';
                videoWrapper.appendChild(newVideoEl);
                remoteVideoContainer.appendChild(videoWrapper);
                initializeZoomableVideo(newVideoEl, videoWrapper);
            }
        };

        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        if (isOfferer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('Sending peer offer to', peerId);
            socket.emit('webrtc_peer_offer', {
                recipient_id: peerId,
                offer: pc.localDescription,
                classroomId: currentClassroom.id
            });
        }
    }

    /**
     * Initializes zoom and pan functionality for a video element.
     * @param {HTMLVideoElement} videoElement The video element to make zoomable.
     * @param {HTMLElement} containerElement The container for the video.
     */
    function initializeZoomableVideo(videoElement, containerElement) {
        if (!videoElement || !containerElement) return;

        let scale = 1;
        let panned = false;
        let isPanned = false;
        let startX, startY, currentX = 0, currentY = 0;

        // Initialize state for the video
        if (!videoZoomStates.has(videoElement.id)) {
            videoZoomStates.set(videoElement.id, {
                currentScale: 1,
                isZoomed: false,
                offsetX: 0,
                offsetY: 0
            });
        }

        const state = videoZoomStates.get(videoElement.id);

        const updateTransform = () => {
            videoElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX}px, ${state.offsetY}px)`;
            videoElement.style.transformOrigin = '0 0';
        };

        containerElement.addEventListener('dblclick', () => {
            if (state.isZoomed) {
                // Zoom out
                state.currentScale = 1;
                state.offsetX = 0;
                state.offsetY = 0;
            } else {
                // Zoom in
                state.currentScale = 2; // Zoom factor
                // Calculate center point of the double-click relative to the video
                const videoRect = videoElement.getBoundingClientRect();
                const clickX = event.clientX - videoRect.left;
                const clickY = event.clientY - videoRect.top;
                // Offset video to center the clicked point
                state.offsetX = ((videoElement.offsetWidth / 2) - clickX) / state.currentScale;
                state.offsetY = ((videoElement.offsetHeight / 2) - clickY) / state.currentScale;
            }
            state.isZoomed = !state.isZoomed;
            updateTransform();
        });

        // Mouse down for panning
        containerElement.addEventListener('mousedown', (e) => {
            if (e.button === 0 && state.isZoomed) {
                isPanned = true;
                startX = e.clientX;
                startY = e.clientY;
                videoElement.style.cursor = 'grabbing';
            }
        });

        // Mouse move for panning
        containerElement.addEventListener('mousemove', (e) => {
            if (!isPanned) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            state.offsetX += dx / state.currentScale;
            state.offsetY += dy / state.currentScale;

            startX = e.clientX;
            startY = e.clientY;

            updateTransform();
        });

        // Mouse up to stop panning
        containerElement.addEventListener('mouseup', () => {
            if (isPanned) {
                isPanned = false;
                videoElement.style.cursor = 'grab';
            }
        });

        // Mouse leave to stop panning
        containerElement.addEventListener('mouseleave', () => {
            if (isPanned) {
                isPanned = false;
                videoElement.style.cursor = 'grab';
            }
        });
    }

    /**
     * Starts the video broadcast.
     */
    async function startBroadcast() {
        if (!currentClassroom || (currentUser && currentUser.role !== 'admin')) {
            showNotification('Only administrators can start a broadcast.', true);
            return;
        }

        // Get user media
        try {
            const broadcastType = document.querySelector('input[name="broadcastType"]:checked').value;
            let stream;
            if (broadcastType === 'video-audio') {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } else if (broadcastType === 'screen-share') {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            }

            localStream = stream;
            if (localVideo) {
                localVideo.srcObject = localStream;
                localVideo.classList.remove('hidden');
                localVideoContainer.classList.remove('hidden'); // Show the video container
            }
            startBroadcastBtn.classList.add('hidden');
            endBroadcastBtn.classList.remove('hidden');

            // Find all other peers in the room and create peer connections
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/users`);
            const users = await response.json();
            const otherUsers = users.filter(user => user.id !== currentUser.id);

            for (const user of otherUsers) {
                await createPeerConnection(user.id, true);
            }

            showNotification('Broadcast started!');
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Broadcast started by ${currentUser.username}.`
            });
        } catch (error) {
            console.error('Error starting broadcast:', error);
            showNotification('Failed to start broadcast. Please check your camera/mic permissions.', true);
        }
    }

    /**
     * Stops the video broadcast and closes peer connections.
     */
    function stopBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        for (const peerId in peerConnections) {
            peerConnections[peerId].close();
            socket.emit('webrtc_peer_disconnected', {
                classroomId: currentClassroom.id,
                peer_id: peerId
            });
            delete peerConnections[peerId];
        }

        if (localVideo) {
            localVideo.srcObject = null;
            localVideo.classList.add('hidden');
            localVideoContainer.classList.add('hidden');
        }
        startBroadcastBtn.classList.remove('hidden');
        endBroadcastBtn.classList.add('hidden');

        // Remove all remote videos
        remoteVideoContainer.innerHTML = '';

        showNotification('Broadcast stopped.');
        if (currentUser && currentUser.role === 'admin' && currentClassroom) {
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Broadcast stopped by ${currentUser.username}.`
            });
        }
    }

    // --- Whiteboard Functions ---

    /**
     * Initializes the whiteboard canvas context.
     */
    function initializeWhiteboard() {
        if (!whiteboardCanvas) {
            console.error("Whiteboard canvas element not found.");
            return;
        }
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.fillStyle = 'white';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        redrawWhiteboard();
    }

    /**
     * Redraws the whiteboard from the history array.
     */
    function redrawWhiteboard() {
        if (!whiteboardCtx) return;

        // Clear canvas
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = 'white';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const pageCommands = whiteboardPages[currentPageIndex];
        pageCommands.forEach(command => executeWhiteboardCommand(command, false));
    }

    /**
     * Executes a single drawing command on the canvas.
     * @param {object} command - The drawing command object.
     * @param {boolean} shouldBroadcast - True to emit the command to other clients.
     */
    function executeWhiteboardCommand(command, shouldBroadcast) {
        if (!whiteboardCtx) return;
        const { tool, color, size, startX, startY, endX, endY, points, text } = command;
        const isAdmin = currentUser && currentUser.role === 'admin';

        if (shouldBroadcast && isAdmin) {
            // Add to local history and then broadcast
            whiteboardPages[currentPageIndex].push(command);
            if (socket) {
                socket.emit('whiteboard_draw', {
                    classroomId: currentClassroom.id,
                    command: command,
                    page: currentPageIndex
                });
            }
        }

        whiteboardCtx.strokeStyle = color || currentColor;
        whiteboardCtx.lineWidth = size || currentBrushSize;

        switch (tool) {
            case 'pen':
            case 'eraser':
                whiteboardCtx.strokeStyle = tool === 'eraser' ? 'white' : color;
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(startX, startY);
                whiteboardCtx.lineTo(endX, endY);
                whiteboardCtx.stroke();
                break;
            case 'pen-stroke':
            case 'eraser-stroke':
                whiteboardCtx.strokeStyle = tool === 'eraser-stroke' ? 'white' : color;
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    whiteboardCtx.lineTo(points[i].x, points[i].y);
                }
                whiteboardCtx.stroke();
                break;
            case 'text':
                whiteboardCtx.fillStyle = color;
                whiteboardCtx.font = `${size}px sans-serif`;
                whiteboardCtx.fillText(text, startX, startY);
                break;
            case 'clear':
                whiteboardCtx.fillStyle = 'white';
                whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                break;
        }
    }

    /**
     * Saves the current whiteboard canvas content as an image.
     */
    function saveWhiteboard() {
        if (whiteboardCanvas) {
            const dataURL = whiteboardCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `whiteboard-${currentClassroom.id}-${new Date().toISOString()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification('Whiteboard saved as an image!');
        }
    }

    /**
     * Updates the page number display.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
        }
    }

    /**
     * Navigates to the next whiteboard page.
     */
    function nextWhiteboardPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else {
            // Create a new page if we are at the last page
            whiteboardPages.push([]);
            currentPageIndex++;
        }
        redrawWhiteboard();
        updateWhiteboardPageDisplay();
        showNotification(`Moved to page ${currentPageIndex + 1}.`);
        if (socket && currentUser.role === 'admin') {
            // Broadcast page change to everyone
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                page: currentPageIndex
            });
        }
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    function prevWhiteboardPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            redrawWhiteboard();
            updateWhiteboardPageDisplay();
            showNotification(`Moved to page ${currentPageIndex + 1}.`);
            if (socket && currentUser.role === 'admin') {
                // Broadcast page change
                socket.emit('whiteboard_page_change', {
                    classroomId: currentClassroom.id,
                    page: currentPageIndex
                });
            }
        }
    }

    /**
     * Event handler for drawing on the whiteboard.
     * @param {MouseEvent} e - The mouse event object.
     */
    function handleDrawing(e) {
        if (!isDrawing || !whiteboardCtx || currentUser.role !== 'admin') return;

        const rect = whiteboardCanvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        // For pen and eraser, draw a continuous line
        if (currentTool === 'pen' || currentTool === 'eraser') {
            // Record the command
            const command = {
                tool: currentTool,
                color: currentColor,
                size: currentBrushSize,
                startX: lastX,
                startY: lastY,
                endX: endX,
                endY: endY
            };
            executeWhiteboardCommand(command, true); // Execute and broadcast
            lastX = endX;
            lastY = endY;
        } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            // For shapes, temporary drawing on snapshot
            whiteboardCtx.putImageData(snapshot, 0, 0); // Restore canvas
            whiteboardCtx.beginPath();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            switch (currentTool) {
                case 'line':
                    whiteboardCtx.moveTo(startX, startY);
                    whiteboardCtx.lineTo(endX, endY);
                    break;
                case 'rectangle':
                    whiteboardCtx.rect(startX, startY, endX - startX, endY - startY);
                    break;
                case 'circle':
                    const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                    whiteboardCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
                    break;
            }
            whiteboardCtx.stroke();
        }
    }

    /**
     * Pushes a new command to the whiteboard history stack, handling size limits.
     * @param {object} command The command to add.
     */
    function pushToHistory(command) {
        if (whiteboardPages[currentPageIndex].length >= MAX_HISTORY_STEPS) {
            whiteboardPages[currentPageIndex].shift(); // Remove the oldest command
        }
        whiteboardPages[currentPageIndex].push(command);
        redoStack.length = 0; // Clear redo stack on new action
    }


    // --- Library Functions ---

    /**
     * Loads and displays the list of files in the classroom library.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !libraryFilesList) return;

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/files`);
            let files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            if (searchTerm) {
                files = files.filter(file => file.filename.toLowerCase().includes(searchTerm));
            }

            libraryFilesList.innerHTML = '';
            if (files.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No files have been uploaded yet.';
                libraryFilesList.appendChild(li);
                return;
            }

            files.forEach(file => {
                addFileToLibraryList(file);
            });

        } catch (error) {
            console.error('Error loading library files:', error);
            showNotification('Failed to load library files.', true);
        }
    }

    /**
     * Adds a single file entry to the library list.
     * @param {object} file - The file object with filename and url.
     */
    function addFileToLibraryList(file) {
        if (!libraryFilesList) return;
        const li = document.createElement('li');
        const filename = file.filename;
        const fileUrl = file.url;
        const isAdmin = currentUser.role === 'admin';
        const fileExtension = filename.split('.').pop().toLowerCase();
        let fileIconClass;

        if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExtension)) {
            fileIconClass = 'fa-file-image';
        } else if (['pdf'].includes(fileExtension)) {
            fileIconClass = 'fa-file-pdf';
        } else if (['doc', 'docx'].includes(fileExtension)) {
            fileIconClass = 'fa-file-word';
        } else if (['ppt', 'pptx'].includes(fileExtension)) {
            fileIconClass = 'fa-file-powerpoint';
        } else if (['xls', 'xlsx'].includes(fileExtension)) {
            fileIconClass = 'fa-file-excel';
        } else if (['zip', 'rar', '7z'].includes(fileExtension)) {
            fileIconClass = 'fa-file-archive';
        } else if (['mp4', 'webm', 'mov'].includes(fileExtension)) {
            fileIconClass = 'fa-file-video';
        } else if (['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            fileIconClass = 'fa-file-audio';
        } else if (['txt', 'js', 'py', 'html', 'css'].includes(fileExtension)) {
            fileIconClass = 'fa-file-code';
        } else {
            fileIconClass = 'fa-file';
        }

        li.innerHTML = `
            <a href="${fileUrl}" target="_blank" class="file-link">
                <i class="fas ${fileIconClass} file-icon"></i>
                <span>${filename}</span>
            </a>
            <span class="file-uploader">Uploaded by: ${file.uploader_name}</span>
            ${isAdmin ? `<button class="delete-file-btn" data-file-id="${file._id}">Delete</button>` : ''}
        `;

        // Add event listener for delete button
        const deleteButton = li.querySelector('.delete-file-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete "${filename}"?`)) {
                    try {
                        const response = await fetch(`/api/classrooms/${currentClassroom.id}/files/${file._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        const result = await response.json();
                        if (response.ok) {
                            showNotification(result.message);
                            li.remove(); // Remove from DOM
                            socket.emit('file_deleted', {
                                classroomId: currentClassroom.id,
                                filename: filename,
                                fileId: file._id
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
        }
        libraryFilesList.appendChild(li);
    }


    // --- Assessments Functions ---

    /**
     * Loads and displays the list of assessments for the current classroom.
     */
    async function loadAssessments() {
        if (!currentClassroom || !assessmentListDiv) return;

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`);
            let assessments = await response.json();

            const searchTerm = assessmentSearchInput.value.toLowerCase();
            if (searchTerm) {
                assessments = assessments.filter(assessment =>
                    assessment.title.toLowerCase().includes(searchTerm) ||
                    assessment.description.toLowerCase().includes(searchTerm)
                );
            }

            assessmentListDiv.innerHTML = '';

            if (assessments.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No assessments have been created yet.';
                assessmentListDiv.appendChild(li);
                return;
            }

            assessments.forEach(assessment => {
                const li = document.createElement('li');
                const isAdmin = currentUser.role === 'admin';
                li.innerHTML = `
                    <h4>${assessment.title}</h4>
                    <p><strong>Scheduled:</strong> ${new Date(assessment.scheduled_at).toLocaleString()}</p>
                    <p><strong>Duration:</strong> ${assessment.duration_minutes} minutes</p>
                    ${isAdmin
                        ? `<button class="view-submissions-btn btn-secondary" data-assessment-id="${assessment._id}">View Submissions</button>
                           <button class="delete-assessment-btn btn-danger" data-assessment-id="${assessment._id}">Delete</button>`
                        : `<button class="take-assessment-btn btn-primary" data-assessment-id="${assessment._id}">Take Assessment</button>`
                    }
                `;

                assessmentListDiv.appendChild(li);

                if (isAdmin) {
                    li.querySelector('.view-submissions-btn').addEventListener('click', () => {
                        viewSubmissions(assessment._id, assessment.title);
                    });
                    li.querySelector('.delete-assessment-btn').addEventListener('click', () => {
                        deleteAssessment(assessment._id, assessment.title);
                    });
                } else {
                    li.querySelector('.take-assessment-btn').addEventListener('click', () => {
                        takeAssessment(assessment._id);
                    });
                }
            });

        } catch (error) {
            console.error('Error loading assessments:', error);
            showNotification('Failed to load assessments.', true);
        }
    }

    /**
     * Displays a form to create a new assessment.
     */
    function showCreateAssessmentForm() {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can create assessments.', true);
            return;
        }
        assessmentCreationForm.classList.remove('hidden');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
    }

    /**
     * Adds a new question field to the assessment creation form.
     */
    function addQuestionField() {
        if (!questionsContainer) return;
        const questionCount = questionsContainer.querySelectorAll('.question-group').length + 1;
        const questionGroup = document.createElement('div');
        questionGroup.className = 'question-group';
        questionGroup.innerHTML = `
            <hr>
            <h5>Question ${questionCount}</h5>
            <label for="question-text-${questionCount}">Question Text:</label>
            <input type="text" id="question-text-${questionCount}" class="question-text" required>
            <label for="question-type-${questionCount}">Question Type:</label>
            <select id="question-type-${questionCount}" class="question-type">
                <option value="mcq">Multiple Choice</option>
                <option value="text">Short Answer</option>
            </select>
            <div class="mcq-options hidden" id="mcq-options-${questionCount}">
                <label>Options:</label>
                <div class="option-inputs">
                    <input type="text" class="mcq-option" placeholder="Option A" required>
                    <input type="text" class="mcq-option" placeholder="Option B" required>
                    <input type="text" class="mcq-option" placeholder="Option C" required>
                    <input type="text" class="mcq-option" placeholder="Option D" required>
                </div>
                <label>Correct Answer (A, B, C, D):</label>
                <input type="text" class="correct-answer" placeholder="e.g., A" required>
            </div>
            <button type="button" class="remove-question-btn btn-danger">Remove</button>
        `;
        questionsContainer.appendChild(questionGroup);

        // Add event listener to show/hide MCQ options
        const questionTypeSelect = questionGroup.querySelector('.question-type');
        questionTypeSelect.addEventListener('change', (e) => {
            const mcqOptions = questionGroup.querySelector('.mcq-options');
            if (e.target.value === 'mcq') {
                mcqOptions.classList.remove('hidden');
            } else {
                mcqOptions.classList.add('hidden');
            }
        });

        // Add event listener to remove button
        const removeButton = questionGroup.querySelector('.remove-question-btn');
        removeButton.addEventListener('click', () => {
            questionGroup.remove();
        });
    }

    /**
     * Submits the assessment creation form to the server.
     */
    async function submitAssessment(event) {
        event.preventDefault();
        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionTextarea.value.trim();
        const scheduledAt = assessmentScheduledAtInput.value;
        const duration = parseInt(assessmentDurationMinutesInput.value, 10);

        if (!title || !scheduledAt || isNaN(duration) || duration <= 0) {
            showNotification('Please fill in all assessment details correctly.', true);
            return;
        }

        const questions = [];
        questionsContainer.querySelectorAll('.question-group').forEach(qGroup => {
            const questionText = qGroup.querySelector('.question-text').value.trim();
            const questionType = qGroup.querySelector('.question-type').value;

            if (!questionText) return;

            let questionData = {
                text: questionText,
                type: questionType
            };

            if (questionType === 'mcq') {
                const options = Array.from(qGroup.querySelectorAll('.mcq-option')).map(input => input.value.trim());
                const correctAnswer = qGroup.querySelector('.correct-answer').value.trim().toUpperCase();
                if (options.some(opt => !opt) || !correctAnswer) {
                    showNotification('Please fill in all MCQ options and the correct answer.', true);
                    return;
                }
                questionData.options = options;
                questionData.correct_answer = correctAnswer;
            }
            questions.push(questionData);
        });

        if (questions.length === 0) {
            showNotification('Please add at least one question.', true);
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description,
                    scheduled_at: scheduledAt,
                    duration_minutes: duration,
                    questions
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification('Assessment created successfully!');
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = '';
                addQuestionField(); // Add back the first blank question
                loadAssessments(); // Refresh the list
                showClassroomSubSection(assessmentsSection);
                socket.emit('new_assessment_created', {
                    classroomId: currentClassroom.id,
                    title: title
                });
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            showNotification('An error occurred while creating the assessment.', true);
        }
    }


    /**
     * Deletes an assessment.
     * @param {string} assessmentId - The ID of the assessment to delete.
     * @param {string} title - The title of the assessment.
     */
    async function deleteAssessment(assessmentId, title) {
        if (!currentClassroom || currentUser.role !== 'admin') return;
        if (confirm(`Are you sure you want to delete the assessment "${title}"? This cannot be undone.`)) {
            try {
                const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    loadAssessments();
                    socket.emit('assessment_deleted', {
                        classroomId: currentClassroom.id,
                        title: title
                    });
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Error deleting assessment:', error);
                showNotification('An error occurred while deleting the assessment.', true);
            }
        }
    }

    /**
     * Displays a specific assessment for the user to take.
     * @param {string} assessmentId - The ID of the assessment.
     */
    async function takeAssessment(assessmentId) {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}`);
            const assessment = await response.json();
            if (response.ok) {
                currentAssessmentToTake = assessment;
                takeAssessmentTitle.textContent = assessment.title;
                takeAssessmentDescription.textContent = assessment.description;
                takeAssessmentForm.innerHTML = ''; // Clear previous questions

                assessment.questions.forEach((question, index) => {
                    const questionEl = document.createElement('div');
                    questionEl.className = 'take-question-group';
                    questionEl.innerHTML = `
                        <p><strong>Question ${index + 1}:</strong> ${question.text}</p>
                    `;
                    if (question.type === 'mcq') {
                        question.options.forEach((option, optIndex) => {
                            const optionId = `q${index}-opt${optIndex}`;
                            questionEl.innerHTML += `
                                <label for="${optionId}">
                                    <input type="radio" name="q${index}" id="${optionId}" value="${String.fromCharCode(65 + optIndex)}" required>
                                    ${String.fromCharCode(65 + optIndex)}. ${option}
                                </label><br>
                            `;
                        });
                    } else if (question.type === 'text') {
                        questionEl.innerHTML += `<textarea name="q${index}" rows="4" placeholder="Your answer..." required></textarea>`;
                    }
                    takeAssessmentForm.appendChild(questionEl);
                });

                showClassroomSubSection(assessmentsSection); // Stay in assessments section
                assessmentListContainer.classList.add('hidden');
                takeAssessmentContainer.classList.remove('hidden');
                viewSubmissionsContainer.classList.add('hidden');
                startAssessmentTimer(assessment.duration_minutes);
            } else {
                showNotification(assessment.error, true);
            }
        } catch (error) {
            console.error('Error taking assessment:', error);
            showNotification('Failed to load assessment details.', true);
        }
    }

    /**
     * Starts the countdown timer for an assessment.
     * @param {number} durationMinutes - The duration in minutes.
     */
    function startAssessmentTimer(durationMinutes) {
        clearInterval(assessmentTimerInterval);
        assessmentEndTime = new Date(new Date().getTime() + durationMinutes * 60000);

        assessmentTimerInterval = setInterval(() => {
            const now = new Date();
            const timeLeft = assessmentEndTime - now;
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            if (timeLeft <= 0) {
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.textContent = 'Time Up!';
                submitAssessmentAnswers(); // Automatically submit
            } else {
                assessmentTimerDisplay.textContent = `Time Left: ${minutes}m ${seconds}s`;
            }
        }, 1000);
    }

    /**
     * Submits the user's answers to the server.
     */
    async function submitAssessmentAnswers(event) {
        if (event) event.preventDefault();
        clearInterval(assessmentTimerInterval);

        const answers = {};
        const formElements = takeAssessmentForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && (element.type !== 'radio' || element.checked)) {
                answers[element.name] = element.value;
            }
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${currentAssessmentToTake._id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification('Assessment submitted successfully!');
                assessmentSubmissionMessage.textContent = 'Submission successful!';
                takeAssessmentForm.classList.add('hidden');
                submitAnswersBtn.classList.add('hidden');
                backToAssessmentListBtn.classList.remove('hidden');
                socket.emit('new_assessment_submission', {
                    classroomId: currentClassroom.id,
                    title: currentAssessmentToTake.title
                });
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            showNotification('An error occurred during submission.', true);
        }
    }

    /**
     * Displays a list of submissions for a given assessment.
     * @param {string} assessmentId The ID of the assessment.
     * @param {string} title The title of the assessment.
     */
    async function viewSubmissions(assessmentId, title) {
        if (!currentClassroom || currentUser.role !== 'admin') {
            showNotification('Only administrators can view submissions.', true);
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}/submissions`);
            const submissions = await response.json();
            if (response.ok) {
                submissionsAssessmentTitle.textContent = `Submissions for: ${title}`;
                submissionsList.innerHTML = '';

                if (submissions.length === 0) {
                    submissionsList.innerHTML = '<li>No submissions have been received yet.</li>';
                } else {
                    submissions.forEach(submission => {
                        const li = document.createElement('li');
                        const submittedAt = new Date(submission.submitted_at).toLocaleString();
                        li.innerHTML = `
                            <strong>User:</strong> ${submission.username}<br>
                            <strong>Submitted:</strong> ${submittedAt}<br>
                            <a href="#" class="view-submission-details" data-submission-id="${submission._id}">View Details</a>
                        `;
                        submissionsList.appendChild(li);
                    });
                }

                showClassroomSubSection(assessmentsSection);
                assessmentListContainer.classList.add('hidden');
                takeAssessmentContainer.classList.add('hidden');
                viewSubmissionsContainer.classList.remove('hidden');
            } else {
                showNotification(submissions.error, true);
            }
        } catch (error) {
            console.error('Error viewing submissions:', error);
            showNotification('Failed to load submissions.', true);
        }
    }

    /**
     * Views the full details of a specific submission.
     * (This function would need to be implemented fully on the backend and frontend)
     * @param {string} submissionId - The ID of the submission to view.
     */
    async function viewSubmissionDetails(submissionId) {
        // Implement logic to fetch and display detailed submission answers
        showNotification(`Viewing details for submission ${submissionId}. (Feature not fully implemented)`, false);
    }


    // --- Event Listeners ---

    // Auth forms
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.querySelector('#login-email').value;
            const password = e.target.querySelector('#login-password').value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    currentUser = result.user;
                    showNotification('Login successful!');
                    checkLoginStatus(); // Re-render UI
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
            const username = e.target.querySelector('#register-username').value;
            const email = e.target.querySelector('#register-email').value;
            const password = e.target.querySelector('#register-password').value;
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(authMessage, result.message, false);
                    registerForm.reset();
                    showSection(authSection);
                    loginContainer.classList.remove('hidden');
                    registerContainer.classList.add('hidden');
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Registration error:', error);
                displayMessage(authMessage, 'An error occurred during registration.', true);
            }
        });
    }

    if (showRegisterLink) showRegisterLink.addEventListener('click', () => {
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });

    if (showLoginLink) showLoginLink.addEventListener('click', () => {
        loginContainer.classList.remove('hidden');
        registerContainer.classList.add('hidden');
        authMessage.textContent = '';
    });


    // Navigation Buttons
    if (navDashboard) navDashboard.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        // Clean up from classroom view
        if (socket) socket.disconnect();
        localStorage.removeItem('currentClassroom');
        currentClassroom = null;
        stopBroadcast();
        document.title = 'One Class';
    });
    if (navClassroom) navClassroom.addEventListener('click', () => {
        if (currentClassroom) {
            showSection(classroomSection);
            updateNavActiveState(navChat); // Default to chat
            showClassroomSubSection(chatSection);
        } else {
            showNotification('Please enter a classroom first.', true);
        }
    });
    if (navSettings) navSettings.addEventListener('click', () => {
        showSection(settingsSection);
        updateNavActiveState(navSettings);
        if (currentUser) {
            if (settingsUsernameInput) settingsUsernameInput.value = currentUser.username;
            if (settingsEmailInput) settingsEmailInput.value = currentUser.email;
        }
    });
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        currentUser = null;
        currentClassroom = null;
        if (socket) socket.disconnect();
        showSection(authSection);
        showNotification('You have been logged out.');
        document.title = 'One Class';
    });

    // Sub-navigation in Classroom
    if (navChat) navChat.addEventListener('click', () => {
        updateNavActiveState(navChat);
        showClassroomSubSection(chatSection);
    });
    if (navWhiteboard) navWhiteboard.addEventListener('click', () => {
        updateNavActiveState(navWhiteboard);
        showClassroomSubSection(whiteboardArea);
        initializeWhiteboard();
        if (socket && currentClassroom) {
            socket.emit('request_whiteboard_state', {
                classroomId: currentClassroom.id
            });
        }
    });
    if (navLibrary) navLibrary.addEventListener('click', () => {
        updateNavActiveState(navLibrary);
        showClassroomSubSection(librarySection);
        loadLibraryFiles();
    });
    if (navAssessments) navAssessments.addEventListener('click', () => {
        updateNavActiveState(navAssessments);
        showClassroomSubSection(assessmentsSection);
        loadAssessments();
    });

    // Back to Dashboard buttons
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        localStorage.removeItem('currentClassroom');
        currentClassroom = null;
        if (socket) socket.disconnect();
        stopBroadcast();
        document.title = 'One Class';
    });
    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
    });

    // Chat
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && socket && currentClassroom && currentUser) {
                socket.emit('chat_message', {
                    classroomId: currentClassroom.id,
                    message: message,
                    username: currentUser.username,
                    role: currentUser.role
                });
                chatInput.value = '';
            }
        });
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessageBtn.click();
            }
        });
    }

    // Whiteboard
    if (whiteboardCanvas) {
        whiteboardCanvas.addEventListener('mousedown', (e) => {
            if (currentUser.role !== 'admin') return;
            isDrawing = true;
            const rect = whiteboardCanvas.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            lastX = startX;
            lastY = startY;
            currentStrokePoints = [{ x: startX, y: startY }];
            if (currentTool !== 'pen' && currentTool !== 'eraser') {
                snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
        });
        whiteboardCanvas.addEventListener('mousemove', handleDrawing);
        whiteboardCanvas.addEventListener('mouseup', () => {
            if (!isDrawing) return;
            isDrawing = false;
            if (currentTool === 'pen' || currentTool === 'eraser') {
                // End of a pen/eraser stroke, broadcast the full stroke
                const command = {
                    tool: currentTool === 'pen' ? 'pen-stroke' : 'eraser-stroke',
                    color: currentColor,
                    size: currentBrushSize,
                    points: currentStrokePoints
                };
                pushToHistory(command);
                if (socket) {
                    socket.emit('whiteboard_draw', {
                        classroomId: currentClassroom.id,
                        command: command
                    });
                }
            } else if (snapshot) {
                // For shapes, add the final shape to history and broadcast
                const rect = whiteboardCanvas.getBoundingClientRect();
                const endX = event.clientX - rect.left;
                const endY = event.clientY - rect.top;

                const command = {
                    tool: currentTool,
                    color: currentColor,
                    size: currentBrushSize,
                    startX: startX,
                    startY: startY,
                    endX: endX,
                    endY: endY
                };
                pushToHistory(command);
                if (socket) {
                    socket.emit('whiteboard_draw', {
                        classroomId: currentClassroom.id,
                        command: command
                    });
                }
            }
        });
        whiteboardCanvas.addEventListener('mouseout', () => {
            isDrawing = false;
        });
    }

    if (toolButtons) {
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;
            });
        });
    }
    if (colorPicker) colorPicker.addEventListener('change', (e) => currentColor = e.target.value);
    if (brushSizeSlider) brushSizeSlider.addEventListener('input', (e) => currentBrushSize = e.target.value);
    if (clearButton) clearButton.addEventListener('click', () => {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can clear the whiteboard.', true);
            return;
        }
        if (confirm('Are you sure you want to clear the whiteboard? This will affect all users.')) {
            const command = { tool: 'clear' };
            pushToHistory(command);
            if (socket) {
                socket.emit('whiteboard_draw', {
                    classroomId: currentClassroom.id,
                    command: command
                });
            }
        }
    });
    if (saveButton) saveButton.addEventListener('click', saveWhiteboard);
    if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', () => {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can change whiteboard pages.', true);
            return;
        }
        prevWhiteboardPage();
    });
    if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', () => {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can change whiteboard pages.', true);
            return;
        }
        nextWhiteboardPage();
    });

    // Undo/Redo - client-side only
    if (undoButton) undoButton.addEventListener('click', () => {
        if (whiteboardPages[currentPageIndex].length > 0) {
            const lastCommand = whiteboardPages[currentPageIndex].pop();
            redoStack.push(lastCommand);
            redrawWhiteboard();
        }
    });

    if (redoButton) redoButton.addEventListener('click', () => {
        if (redoStack.length > 0) {
            const redoCommand = redoStack.pop();
            whiteboardPages[currentPageIndex].push(redoCommand);
            redrawWhiteboard();
        }
    });

    // Video Broadcast
    if (startBroadcastBtn) startBroadcastBtn.addEventListener('click', startBroadcast);
    if (endBroadcastBtn) endBroadcastBtn.addEventListener('click', stopBroadcast);


    // Library
    if (copyShareLinkBtn) copyShareLinkBtn.addEventListener('click', copyShareLink);

    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            if (currentUser.role !== 'admin') {
                showNotification('Only administrators can upload files.', true);
                return;
            }
            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification('Please select files to upload.', true);
                return;
            }

            const formData = new FormData();
            for (const file of files) {
                formData.append('files', file);
            }

            try {
                const response = await fetch(`/api/classrooms/${currentClassroom.id}/files`, {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification('File(s) uploaded successfully!');
                    libraryFileInput.value = ''; // Clear the input
                    // No need to reload, the socket will handle updating the list
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }

    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
    }


    // Assessments
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestionField);
    if (assessmentCreationForm) assessmentCreationForm.addEventListener('submit', submitAssessment);
    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => {
        assessmentListContainer.classList.remove('hidden');
        takeAssessmentContainer.classList.add('hidden');
        assessmentSubmissionMessage.textContent = '';
        takeAssessmentForm.classList.remove('hidden');
        submitAnswersBtn.classList.remove('hidden');
        backToAssessmentListBtn.classList.add('hidden');
        loadAssessments(); // Reload the list
    });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
        assessmentListContainer.classList.remove('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
        loadAssessments();
    });
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', submitAssessmentAnswers);

    // Initial load
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
