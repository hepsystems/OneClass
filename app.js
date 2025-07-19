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
    const assessmentDurationInput = document.getElementById('assessment-duration-minutes'); // NEW
    const assessmentStartTimeInput = document.getElementById('assessment-start-time');     // NEW
    const assessmentEndTimeInput = document.getElementById('assessment-end-time');         // NEW
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentListDiv = document.getElementById('assessment-list');
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const assessmentTimerDisplay = document.getElementById('assessment-timer-display'); // NEW
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
    let assessmentTimerInterval; // NEW: To store the timer interval ID

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
    let currentColor = colorPicker ? colorPicker.value : '#000000'; // Default to black
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

    /**
     * Formats a UTC date string into a more readable local date/time string.
     * @param {string} utcDateString - The date string in UTC format.
     * @returns {string} Formatted local date/time string, or 'Invalid Date' if parsing fails.
     */
    function formatLocalDateTime(utcDateString) {
        try {
            const date = new Date(utcDateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            return date.toLocaleString();
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid Date';
        }
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
            broadcastTypeRadios.forEach(radio => radio.parentElement.classList.add('hidden')); // Hide radios for non-admins
        }
        stopLocalStream(); // Stop any active local streams before entering a new classroom
    }

    // --- Socket.IO and WebRTC Setup ---
    function initializeSocketIO() {
        if (socket) {
            socket.disconnect(); // Disconnect existing socket if switching classrooms
            console.log("Disconnected existing socket.");
        }

        socket = io({
            query: {
                userId: currentUser.id,
                username: currentUser.username,
                classroomId: currentClassroom.id,
                role: currentUser.role // Send role to socket
            },
            withCredentials: true
        });

        console.log(`Attempting to connect socket for user ${currentUser.username} in classroom ${currentClassroom.name} (${currentClassroom.id}) with role ${currentUser.role}`);

        socket.on('connect', () => {
            console.log('Socket.IO connected. SID:', socket.id);
            socket.emit('join', { classroomId: currentClassroom.id, userId: currentUser.id, username: currentUser.username, role: currentUser.role });
            // Request initial whiteboard state upon joining
            socket.emit('request_initial_whiteboard_state', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
            socket.emit('request_initial_chat_messages', { classroomId: currentClassroom.id });
            loadLibraryFiles(); // Load library files on classroom entry
            loadAssessments(); // Load assessments on classroom entry
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket.IO disconnected:', reason);
            // Clean up WebRTC connections
            for (const peerId in peerConnections) {
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                    document.getElementById(`remote-video-${peerId}`)?.remove();
                }
            }
            if (assessmentTimerInterval) { // Clear timer on disconnect
                clearInterval(assessmentTimerInterval);
                assessmentTimerDisplay.classList.add('hidden');
            }
        });

        socket.on('join_acknowledgement', (data) => {
            console.log('Join Acknowledged:', data.message);
            if (data.participants) {
                console.log('Current participants:', data.participants);
                // No explicit participant list display, but useful for debugging
            }
        });

        socket.on('user_joined', (data) => {
            showNotification(`${getDisplayName(data.username, data.role)} joined the classroom.`);
            console.log('User joined:', data.username, data.sid);
        });

        socket.on('user_left', (data) => {
            showNotification(`${getDisplayName(data.username, data.role)} left the classroom.`, true);
            console.log('User left:', data.username, data.sid);
            // Clean up remote video if user leaves
            document.getElementById(`remote-video-${data.userId}`)?.remove();
            if (peerConnections[data.userId]) {
                peerConnections[data.userId].close();
                delete peerConnections[data.userId];
            }
        });

        // --- Chat Events ---
        socket.on('receive_message', (message) => {
            displayChatMessage(message);
        });

        socket.on('initial_chat_messages', (messages) => {
            chatMessages.innerHTML = ''; // Clear previous messages
            messages.forEach(displayChatMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        });

        // --- Whiteboard Events ---
        socket.on('whiteboard_data', (data) => {
            if (data.classroomId === currentClassroom.id && data.pageIndex === currentPageIndex) {
                // Ensure drawing is from another user or a broadcast of current user's action
                // To avoid drawing local actions twice:
                // Only process if it's not our own broadcasted action.
                // For simplicity, we'll draw all incoming data. More complex logic needed to filter own events.
                const userIsAdmin = currentUser && currentUser.role === 'admin';
                if (!userIsAdmin && data.command.tool !== 'clear') { // Non-admins only receive, not draw
                    drawCommand(data.command);
                } else if (userIsAdmin) { // Admins draw all, but careful not to re-draw own.
                    // A more robust solution would involve comparing socket.id or a unique request ID
                    // For now, assume drawing all incoming is okay, potential for slight redundancy
                    drawCommand(data.command);
                }
            }
        });

        socket.on('initial_whiteboard_state', (data) => {
            if (data.classroomId === currentClassroom.id && data.pageIndex === currentPageIndex) {
                console.log("Received initial whiteboard state for page:", data.pageIndex, "Commands:", data.commands.length);
                whiteboardPages[currentPageIndex] = data.commands;
                redrawWhiteboard();
            }
        });

        socket.on('whiteboard_page_change_broadcast', (data) => {
            if (data.classroomId === currentClassroom.id) {
                currentPageIndex = data.newPageIndex;
                whiteboardPageDisplay.textContent = `${currentPageIndex + 1} / ${whiteboardPages.length}`;
                redrawWhiteboard();
                socket.emit('request_initial_whiteboard_state', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
            }
        });

        socket.on('whiteboard_page_added_broadcast', (data) => {
            if (data.classroomId === currentClassroom.id) {
                whiteboardPages.push([]); // Add a new empty page
                whiteboardPageDisplay.textContent = `${currentPageIndex + 1} / ${whiteboardPages.length}`;
                showNotification(`New whiteboard page added by ${getDisplayName(data.username, data.role)}.`);
            }
        });

        // --- WebRTC Signaling ---
        socket.on('webrtc_offer', async (data) => {
            console.log('WEBRTC: Received offer from', data.sender_id);
            if (data.sender_id === currentUser.id) return; // Don't process own offer

            const peerId = data.sender_id;
            const pc = createPeerConnection(peerId);
            peerConnections[peerId] = pc;

            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

            // Add local stream if available
            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc_answer', {
                recipient_id: peerId,
                answer: answer,
                classroomId: currentClassroom.id
            });
        });

        socket.on('webrtc_answer', async (data) => {
            console.log('WEBRTC: Received answer from', data.sender_id);
            if (data.sender_id === currentUser.id) return; // Don't process own answer

            const peerId = data.sender_id;
            const pc = peerConnections[peerId];
            if (pc && pc.signalingState !== 'closed') {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (e) {
                    console.error('Error setting remote description from answer:', e);
                }
            }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            console.log('WEBRTC: Received ICE candidate from', data.sender_id);
            if (data.sender_id === currentUser.id) return; // Don't process own candidate

            const peerId = data.sender_id;
            const pc = peerConnections[peerId];
            if (pc && data.candidate && pc.signalingState !== 'closed') {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding received ICE candidate:', e);
                }
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            console.log('WEBRTC: Peer disconnected signal received for', data.peer_id);
            const peerId = data.peer_id;
            document.getElementById(`remote-video-${peerId}`)?.remove();
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
            }
        });

        // Admin Action Updates
        socket.on('admin_action_update', (data) => {
            showNotification(data.message, false); // Admin actions are typically informational
        });
    }

    // --- WebRTC Helper Functions ---

    function createPeerConnection(peerId) {
        const pc = new RTCPeerConnection(iceServers);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', {
                    recipient_id: peerId,
                    candidate: event.candidate,
                    classroomId: currentClassroom.id
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('WEBRTC: Received remote track from', peerId);
            const remoteVideo = document.getElementById(`remote-video-${peerId}`);
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
            } else {
                const newRemoteVideo = document.createElement('video');
                newRemoteVideo.id = `remote-video-${peerId}`;
                newRemoteVideo.autoplay = true;
                newRemoteVideo.playsInline = true; // For iOS compatibility
                newRemoteVideo.srcObject = event.streams[0];
                newRemoteVideo.classList.add('remote-video-stream');
                remoteVideoContainer.appendChild(newRemoteVideo);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Peer connection to ${peerId} state: ${pc.connectionState}`);
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`ICE connection state to ${peerId}: ${pc.iceConnectionState}`);
        };

        return pc;
    }

    async function startLocalStream(streamType = 'webcam') {
        try {
            stopLocalStream(); // Stop any existing stream first

            if (streamType === 'webcam') {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } else if (streamType === 'screen') {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            }

            localVideo.srcObject = localStream;
            localVideo.classList.remove('hidden'); // Show local video

            // Inform existing peers about the new stream or start new connections
            socket.emit('start_webrtc_broadcast', { classroomId: currentClassroom.id });

        } catch (error) {
            console.error('Error starting local stream:', error);
            showNotification('Could not start video broadcast. Check camera/screen permissions.', true);
            endBroadcastBtn.disabled = true;
            startBroadcastBtn.disabled = false;
        }
    }

    function stopLocalStream() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        localVideo.srcObject = null;
        localVideo.classList.add('hidden'); // Hide local video
        // Signal peers to disconnect
        socket.emit('end_webrtc_broadcast', { classroomId: currentClassroom.id });

        // Close all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                document.getElementById(`remote-video-${peerId}`)?.remove();
            }
        }
    }


    // --- Event Listeners for Authentication ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    checkLoginStatus();
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during login:', error);
                displayMessage(authMessage, 'An error occurred. Please try again.', true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerUsernameInput.value;
            const email = registerEmailInput.value;
            const password = registerPasswordInput.value;
            const role = registerRoleSelect.value;

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role })
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    displayMessage(authMessage, 'Registration successful! You can now log in.', false);
                    loginContainer.classList.remove('hidden');
                    registerContainer.classList.add('hidden');
                    registerForm.reset();
                    loginForm.reset();
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                displayMessage(authMessage, 'An error occurred. Please try again.', true);
            }
        });
    }

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear previous messages
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear previous messages
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    currentUser = null;
                    currentClassroom = null;
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentClassroom');
                    showSection(authSection);
                    // Disconnect socket on logout
                    if (socket) {
                        socket.disconnect();
                    }
                    stopLocalStream(); // Stop any active broadcast
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Error during logout:', error);
                showNotification('An error occurred during logout.', true);
            }
        });
    }

    // --- Dashboard Event Listeners ---
    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            const classroomName = newClassroomNameInput.value.trim();
            if (!classroomName) {
                displayMessage(classroomMessage, 'Classroom name cannot be empty.', true);
                return;
            }

            try {
                const response = await fetch('/api/classrooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: classroomName })
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    displayMessage(classroomMessage, `Classroom "${result.classroom.name}" created! ID: ${result.classroom.id}`, false);
                    newClassroomNameInput.value = '';
                    loadAvailableClassrooms(); // Refresh the list
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred while creating classroom.', true);
            }
        });
    }

    // --- Classroom Navigation & Controls ---
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        localStorage.removeItem('currentClassroom');
        currentClassroom = null;
        if (socket) {
            socket.emit('leave', { classroomId: classroomIdDisplay.textContent, userId: currentUser.id });
            socket.disconnect(); // Disconnect socket when leaving classroom
        }
        stopLocalStream(); // Stop any active broadcast
        if (assessmentTimerInterval) { // Clear timer when leaving classroom
            clearInterval(assessmentTimerInterval);
            assessmentTimerDisplay.classList.add('hidden');
        }
        loadAvailableClassrooms(); // Refresh classroom list on dashboard
    });

    if (navChat) navChat.addEventListener('click', () => { showClassroomSubSection(chatSection); updateNavActiveState(navChat); });
    if (navWhiteboard) navWhiteboard.addEventListener('click', () => {
        showClassroomSubSection(whiteboardArea);
        updateNavActiveState(navWhiteboard);
        if (whiteboardCtx) redrawWhiteboard(); // Redraw to ensure canvas is correct size/state
    });
    if (navLibrary) navLibrary.addEventListener('click', () => { showClassroomSubSection(librarySection); updateNavActiveState(navLibrary); loadLibraryFiles(); });
    if (navAssessments) navAssessments.addEventListener('click', () => { showClassroomSubSection(assessmentsSection); updateNavActiveState(navAssessments); loadAssessments(); });

    if (shareLinkBtn) {
        shareLinkBtn.addEventListener('click', () => {
            const shareUrl = `${window.location.origin}/classroom/${currentClassroom.id}`;
            shareLinkInput.value = shareUrl;
            shareLinkDisplay.classList.toggle('hidden');
        });
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', async () => {
            if (shareLinkInput) {
                try {
                    await navigator.clipboard.writeText(shareLinkInput.value);
                    showNotification('Share link copied to clipboard!');
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showNotification('Failed to copy link.', true);
                }
            }
        });
    }

    // --- Chat Functions and Event Listeners ---
    function displayChatMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        if (message.sender_id === currentUser.id) {
            messageElement.classList.add('my-message');
        } else {
            messageElement.classList.add('other-message');
        }

        const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageElement.innerHTML = `
            <span class="sender-info">${getDisplayName(message.username, message.role)} <span class="timestamp">${timestamp}</span></span>
            <p>${message.content}</p>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to latest message
    }

    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.onclick = () => {
                const content = chatInput.value.trim();
                if (content && socket && currentClassroom) {
                    const message = {
                        classroomId: currentClassroom.id,
                        sender_id: currentUser.id,
                        username: currentUser.username,
                        role: currentUser.role, // Include role in message
                        content: content,
                        timestamp: new Date().toISOString()
                    };
                    socket.emit('send_message', message);
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


    // --- Whiteboard Functions and Event Listeners ---
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) return;

        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);

        if (currentUser && currentUser.role === 'admin') {
            whiteboardCanvas.addEventListener('mousedown', startDrawing);
            whiteboardCanvas.addEventListener('mousemove', draw);
            whiteboardCanvas.addEventListener('mouseup', stopDrawing);
            whiteboardCanvas.addEventListener('mouseout', stopDrawing); // Stop drawing if mouse leaves canvas

            toolButtons.forEach(button => {
                button.addEventListener('click', () => {
                    toolButtons.forEach(btn => btn.classList.remove('active-tool'));
                    button.classList.add('active-tool');
                    currentTool = button.dataset.tool;
                    // Reset stroke points when changing tool (important for pen/eraser)
                    currentStrokePoints = [];
                });
            });

            if (colorPicker) colorPicker.addEventListener('change', (e) => currentColor = e.target.value);
            if (brushSizeSlider) brushSizeSlider.addEventListener('input', (e) => currentBrushSize = parseInt(e.target.value));
            if (undoButton) undoButton.addEventListener('click', undoLastAction);
            if (redoButton) redoButton.addEventListener('click', redoLastAction);
            if (clearButton) clearButton.addEventListener('click', clearWhiteboard);
            if (saveButton) saveButton.addEventListener('click', saveWhiteboard);
            if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', goToPrevWhiteboardPage);
            if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', goToNextWhiteboardPage);
            if (addWhiteboardPageBtn) addWhiteboardPageBtn.addEventListener('click', addWhiteboardPage);

        } else {
            // Disable drawing for non-admins
            whiteboardCanvas.removeEventListener('mousedown', startDrawing);
            whiteboardCanvas.removeEventListener('mousemove', draw);
            whiteboardCanvas.removeEventListener('mouseup', stopDrawing);
            whiteboardCanvas.removeEventListener('mouseout', stopDrawing);
            // Hide controls that modify the whiteboard
            document.querySelectorAll('.whiteboard-controls .tool-group').forEach(group => group.classList.add('hidden'));
            if (colorPicker) colorPicker.classList.add('hidden');
            if (brushSizeSlider) brushSizeSlider.classList.add('hidden');
            if (undoButton) undoButton.classList.add('hidden');
            if (redoButton) redoButton.classList.add('hidden');
            if (clearButton) clearButton.classList.add('hidden');
            if (saveButton) saveButton.classList.add('hidden');
        }
        redrawWhiteboard(); // Initial draw when setting up controls
        whiteboardPageDisplay.textContent = `${currentPageIndex + 1} / ${whiteboardPages.length}`;
    }

    function resizeCanvas() {
        if (!whiteboardCanvas || !whiteboardCanvas.parentElement) return;
        const parent = whiteboardCanvas.parentElement;
        // Set canvas dimensions to be slightly smaller than its parent, accounting for controls/padding
        whiteboardCanvas.width = parent.clientWidth * 0.95;
        whiteboardCanvas.height = window.innerHeight * 0.7; // Or dynamic based on available space
        redrawWhiteboard();
    }

    function startDrawing(e) {
        if (currentUser && currentUser.role !== 'admin') return;
        isDrawing = true;
        const { offsetX, offsetY } = getCanvasCoordinates(e);
        startX = offsetX;
        startY = offsetY;
        lastX = offsetX;
        lastY = offsetY;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            currentStrokePoints = [{ x: lastX, y: lastY, color: currentColor, size: currentBrushSize, tool: currentTool }];
        }
        snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    }

    function draw(e) {
        if (!isDrawing) return;
        if (currentUser && currentUser.role !== 'admin') return;

        const { offsetX, offsetY } = getCanvasCoordinates(e);

        // Restore snapshot for tools that draw shapes
        if (currentTool !== 'pen' && currentTool !== 'eraser') {
            whiteboardCtx.putImageData(snapshot, 0, 0);
        }

        whiteboardCtx.beginPath();
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';

        if (currentTool === 'pen') {
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.moveTo(lastX, lastY);
            whiteboardCtx.lineTo(offsetX, offsetY);
            whiteboardCtx.stroke();
            lastX = offsetX;
            lastY = offsetY;
            currentStrokePoints.push({ x: offsetX, y: offsetY, color: currentColor, size: currentBrushSize, tool: currentTool });
        } else if (currentTool === 'eraser') {
            whiteboardCtx.strokeStyle = whiteboardCtx.fillStyle; // Use background color
            whiteboardCtx.moveTo(lastX, lastY);
            whiteboardCtx.lineTo(offsetX, offsetY);
            whiteboardCtx.stroke();
            lastX = offsetX;
            lastY = offsetY;
            currentStrokePoints.push({ x: offsetX, y: offsetY, color: whiteboardCtx.fillStyle, size: currentBrushSize, tool: currentTool });
        } else if (currentTool === 'line') {
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.moveTo(startX, startY);
            whiteboardCtx.lineTo(offsetX, offsetY);
            whiteboardCtx.stroke();
        } else if (currentTool === 'rectangle') {
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.strokeRect(startX, startY, offsetX - startX, offsetY - startY);
        } else if (currentTool === 'circle') {
            whiteboardCtx.strokeStyle = currentColor;
            const radius = Math.sqrt(Math.pow(offsetX - startX, 2) + Math.pow(offsetY - startY, 2)) / 2;
            const centerX = startX + (offsetX - startX) / 2;
            const centerY = startY + (offsetY - startY) / 2;
            whiteboardCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            whiteboardCtx.stroke();
        }
    }

    function stopDrawing(e) {
        if (!isDrawing) return;
        isDrawing = false;

        const { offsetX, offsetY } = getCanvasCoordinates(e);

        let command;
        if (currentTool === 'pen' || currentTool === 'eraser') {
            // For pen and eraser, the command is the whole stroke
            command = {
                tool: currentTool,
                points: currentStrokePoints,
                finalX: offsetX, // Store final point for consistency
                finalY: offsetY
            };
        } else {
            // For shapes, the command is defined by start and end points
            command = {
                tool: currentTool,
                startX: startX,
                startY: startY,
                endX: offsetX,
                endY: offsetY,
                color: currentColor,
                size: currentBrushSize
            };
        }

        // Push the command to history
        whiteboardPages[currentPageIndex].push(command);
        // Clear redo stack on new action
        redoStack.length = 0;
        // Limit undo stack size
        if (undoStack.length >= MAX_HISTORY_STEPS) {
            undoStack.shift(); // Remove oldest
        }
        undoStack.push(command); // Add the latest command to undo stack

        socket.emit('whiteboard_drawing', {
            classroomId: currentClassroom.id,
            pageIndex: currentPageIndex,
            command: command
        });

        // Redraw to ensure the final shape is properly rendered after releasing mouse
        // This is important for shapes, as draw() only draws a preview
        redrawWhiteboard();
        currentStrokePoints = []; // Clear for next stroke
    }

    function getCanvasCoordinates(event) {
        const rect = whiteboardCanvas.getBoundingClientRect();
        // Calculate offsets relative to the canvas
        const scaleX = whiteboardCanvas.width / rect.width;
        const scaleY = whiteboardCanvas.height / rect.height;
        return {
            offsetX: (event.clientX - rect.left) * scaleX,
            offsetY: (event.clientY - rect.top) * scaleY
        };
    }


    function drawCommand(command) {
        whiteboardCtx.beginPath();
        whiteboardCtx.lineWidth = command.size;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.strokeStyle = command.color; // Default for shapes

        if (command.tool === 'pen' || command.tool === 'eraser') {
            // For strokes, iterate through points
            if (command.points && command.points.length > 1) {
                whiteboardCtx.strokeStyle = command.points[0].color; // Use the color of the first point for the stroke
                whiteboardCtx.lineWidth = command.points[0].size;
                whiteboardCtx.moveTo(command.points[0].x, command.points[0].y);
                for (let i = 1; i < command.points.length; i++) {
                    whiteboardCtx.lineTo(command.points[i].x, command.points[i].y);
                }
                whiteboardCtx.stroke();
            }
        } else if (command.tool === 'line') {
            whiteboardCtx.moveTo(command.startX, command.startY);
            whiteboardCtx.lineTo(command.endX, command.endY);
            whiteboardCtx.stroke();
        } else if (command.tool === 'rectangle') {
            whiteboardCtx.strokeRect(command.startX, command.startY, command.endX - command.startX, command.endY - command.startY);
        } else if (command.tool === 'circle') {
            const radius = Math.sqrt(Math.pow(command.endX - command.startX, 2) + Math.pow(command.endY - command.startY, 2)) / 2;
            const centerX = command.startX + (command.endX - command.startX) / 2;
            const centerY = command.startY + (command.endY - command.startY) / 2;
            whiteboardCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            whiteboardCtx.stroke();
        }
    }

    function redrawWhiteboard() {
        if (!whiteboardCtx) return;
        // Clear canvas
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        // Set background to white (or desired background color from CSS if any)
        whiteboardCtx.fillStyle = '#FFFFFF';
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        // Draw all commands for the current page
        const currentPageCommands = whiteboardPages[currentPageIndex];
        if (currentPageCommands) {
            currentPageCommands.forEach(command => drawCommand(command));
        }
    }

    function undoLastAction() {
        if (undoStack.length > 0) {
            const lastCommand = undoStack.pop();
            redoStack.push(lastCommand); // Add to redo stack
            // Remove the last command from the current page's history
            whiteboardPages[currentPageIndex].pop();
            redrawWhiteboard();
            // TODO: Signal undo to others via socket
            socket.emit('whiteboard_undo', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
        } else {
            showNotification('Nothing to undo.');
        }
    }

    function redoLastAction() {
        if (redoStack.length > 0) {
            const commandToRedo = redoStack.pop();
            undoStack.push(commandToRedo); // Add back to undo stack
            whiteboardPages[currentPageIndex].push(commandToRedo); // Add back to current page history
            drawCommand(commandToRedo); // Redraw the specific command
            // TODO: Signal redo to others via socket
            socket.emit('whiteboard_redo', { classroomId: currentClassroom.id, pageIndex: currentPageIndex, command: commandToRedo });
        } else {
            showNotification('Nothing to redo.');
        }
    }

    function clearWhiteboard() {
        if (confirm('Are you sure you want to clear the entire whiteboard page? This cannot be undone.')) {
            whiteboardPages[currentPageIndex] = []; // Clear current page's commands
            undoStack.length = 0; // Clear local undo history for the page
            redoStack.length = 0;
            redrawWhiteboard();
            socket.emit('whiteboard_clear', { classroomId: currentClassroom.id, pageIndex: currentPageIndex });
            showNotification('Whiteboard cleared!');
        }
    }

    function saveWhiteboard() {
        if (whiteboardCanvas) {
            const dataURL = whiteboardCanvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `whiteboard-page-${currentPageIndex + 1}-${currentClassroom.name}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showNotification('Whiteboard image saved!');
        }
    }

    function goToPrevWhiteboardPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            whiteboardPageDisplay.textContent = `${currentPageIndex + 1} / ${whiteboardPages.length}`;
            redrawWhiteboard();
            socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
        } else {
            showNotification('You are on the first page.');
        }
    }

    function goToNextWhiteboardPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
            whiteboardPageDisplay.textContent = `${currentPageIndex + 1} / ${whiteboardPages.length}`;
            redrawWhiteboard();
            socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
        } else {
            showNotification('No more pages. Add a new page.', false);
        }
    }

    function addWhiteboardPage() {
        whiteboardPages.push([]);
        currentPageIndex = whiteboardPages.length - 1; // Go to the new page
        whiteboardPageDisplay.textContent = `${currentPageIndex + 1} / ${whiteboardPages.length}`;
        redrawWhiteboard();
        socket.emit('whiteboard_page_added', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
        showNotification('New whiteboard page added!');
    }

    // --- Video Broadcast Event Listeners ---
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', async () => {
            const selectedType = document.querySelector('input[name="broadcastType"]:checked').value;
            await startLocalStream(selectedType);
            startBroadcastBtn.disabled = true;
            endBroadcastBtn.disabled = false;
            socket.emit('admin_action', { classroomId: currentClassroom.id, message: `${getDisplayName(currentUser.username, currentUser.role)} has started a video broadcast.` });
        });
    }

    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', () => {
            stopLocalStream();
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
            socket.emit('admin_action', { classroomId: currentClassroom.id, message: `${getDisplayName(currentUser.username, currentUser.role)} has ended the video broadcast.` });
        });
    }

    // --- Library Functions ---
    async function loadLibraryFiles() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/library-files/classroom/${currentClassroom.id}`);
            const files = await response.json();
            libraryFilesList.innerHTML = ''; // Clear existing list

            if (files.length === 0) {
                libraryFilesList.innerHTML = '<li>No files in the library.</li>';
                return;
            }

            files.forEach(file => {
                const li = document.createElement('li');
                const downloadLink = document.createElement('a');
                downloadLink.href = `/uploads/${file.filename}`;
                downloadLink.textContent = file.original_filename;
                downloadLink.target = '_blank';
                downloadLink.title = `Uploaded by ${getDisplayName(file.uploaded_by_username, file.uploaded_by_role)} on ${formatLocalDateTime(file.uploaded_at)}`;

                li.appendChild(downloadLink);

                if (currentUser && currentUser.role === 'admin') {
                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('delete-file-btn');
                    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteButton.title = 'Delete File';
                    deleteButton.onclick = async () => {
                        if (confirm(`Are you sure you want to delete "${file.original_filename}"?`)) {
                            await deleteLibraryFile(file.id);
                        }
                    };
                    li.appendChild(deleteButton);
                }
                libraryFilesList.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading library files:', error);
            showNotification('Failed to load library files.', true);
        }
    }

    async function deleteLibraryFile(fileId) {
        try {
            const response = await fetch(`/api/library-files/${fileId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                loadLibraryFiles(); // Refresh list
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error deleting library file:', error);
            showNotification('An error occurred during file deletion.', true);
        }
    }

    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification('Please select files to upload.', true);
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
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
                    libraryFileInput.value = ''; // Clear input
                    loadLibraryFiles(); // Refresh list
                } else {
                    showNotification(result.error, true);
                }
            } catch (error) {
                console.error('Error uploading files:', error);
                showNotification('An error occurred during file upload.', true);
            }
        });
    }


    // --- Assessment Functions ---
    let questionCounter = 0;

    function addQuestionField() {
        questionCounter++;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-item');
        questionDiv.dataset.questionId = questionCounter;
        questionDiv.innerHTML = `
            <h5>Question ${questionCounter}</h5>
            <input type="text" class="question-text" placeholder="Question Text" required>
            <select class="question-type">
                <option value="mcq">Multiple Choice</option>
                <option value="short_answer">Short Answer</option>
            </select>
            <div class="mcq-options hidden">
                <input type="text" class="mcq-option" placeholder="Option A" data-option-id="0">
                <input type="text" class="mcq-option" placeholder="Option B" data-option-id="1">
                <input type="text" class="mcq-option" placeholder="Option C" data-option-id="2">
                <input type="text" class="mcq-option" placeholder="Option D" data-option-id="3">
                <input type="number" class="mcq-correct-answer" placeholder="Correct Option Index (0-3)">
            </div>
            <textarea class="short-answer-correct-answer hidden" placeholder="Correct Answer (for short answer)"></textarea>
            <button type="button" class="remove-question-btn">Remove</button>
        `;
        questionsContainer.appendChild(questionDiv);

        // Event listeners for the new question field
        const typeSelect = questionDiv.querySelector('.question-type');
        const mcqOptionsDiv = questionDiv.querySelector('.mcq-options');
        const shortAnswerCorrectAnswerTextarea = questionDiv.querySelector('.short-answer-correct-answer');
        const removeButton = questionDiv.querySelector('.remove-question-btn');

        typeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
                shortAnswerCorrectAnswerTextarea.classList.add('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
                shortAnswerCorrectAnswerTextarea.classList.remove('hidden');
            }
        });

        removeButton.addEventListener('click', () => {
            questionDiv.remove();
            // Re-label questions if needed (optional, but good for UX)
            updateQuestionLabels();
        });
    }

    function updateQuestionLabels() {
        document.querySelectorAll('.question-item h5').forEach((h5, index) => {
            h5.textContent = `Question ${index + 1}`;
        });
    }

    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestionField);

    if (assessmentCreationForm) {
        assessmentCreationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionTextarea.value.trim();
            const duration = assessmentDurationInput.value ? parseInt(assessmentDurationInput.value) : null; // NEW
            const startTime = assessmentStartTimeInput.value ? new Date(assessmentStartTimeInput.value).toISOString() : null; // NEW
            const endTime = assessmentEndTimeInput.value ? new Date(assessmentEndTimeInput.value).toISOString() : null;     // NEW

            if (!title || !description) {
                displayMessage(assessmentCreationMessage, 'Title and description are required.', true);
                return;
            }

            const questions = [];
            document.querySelectorAll('.question-item').forEach(qDiv => {
                const questionText = qDiv.querySelector('.question-text').value.trim();
                const questionType = qDiv.querySelector('.question-type').value;
                let questionData = { text: questionText, type: questionType };

                if (questionType === 'mcq') {
                    const options = Array.from(qDiv.querySelectorAll('.mcq-option')).map(opt => opt.value.trim());
                    const correctAnswerIndex = parseInt(qDiv.querySelector('.mcq-correct-answer').value);
                    if (options.some(opt => !opt) || isNaN(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
                         showNotification('Please fill all MCQ options and provide a valid correct answer index (0-3).', true);
                         throw new Error("Invalid MCQ data"); // Stop submission
                    }
                    questionData.options = options;
                    questionData.correct_answer = correctAnswerIndex; // Store index for MCQs
                } else if (questionType === 'short_answer') {
                    const correctAnswer = qDiv.querySelector('.short-answer-correct-answer').value.trim();
                    if (!correctAnswer) {
                        showNotification('Please provide a correct answer for short answer questions.', true);
                        throw new Error("Invalid Short Answer data"); // Stop submission
                    }
                    questionData.correct_answer = correctAnswer;
                }
                questions.push(questionData);
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
                        duration,   // NEW
                        start_time: startTime, // NEW
                        end_time: endTime,     // NEW
                        questions
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    displayMessage(assessmentCreationMessage, 'Assessment created successfully!', false);
                    assessmentCreationForm.reset();
                    questionsContainer.innerHTML = ''; // Clear questions
                    questionCounter = 0;
                    loadAssessments(); // Refresh list
                } else {
                    displayMessage(assessmentCreationMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating assessment:', error);
                displayMessage(assessmentCreationMessage, 'An error occurred while creating the assessment.', true);
            }
        });
    }

    async function loadAssessments() {
        if (!currentClassroom) {
            assessmentListDiv.innerHTML = '<li>Please enter a classroom to view assessments.</li>';
            return;
        }
        try {
            const response = await fetch(`/api/assessments/classroom/${currentClassroom.id}`);
            const assessments = await response.json();
            renderAssessments(assessments);
        } catch (error) {
            console.error('Error loading assessments:', error);
            showNotification('Failed to load assessments.', true);
            assessmentListDiv.innerHTML = '<li>Failed to load assessments.</li>';
        }
    }

    function renderAssessments(assessments) {
        assessmentListDiv.innerHTML = '';
        if (assessments.length === 0) {
            assessmentListDiv.innerHTML = '<li>No assessments available in this classroom.</li>';
            return;
        }

        const now = new Date(); // Current client time for scheduling checks

        assessments.forEach(assessment => {
            const li = document.createElement('li');
            li.classList.add('assessment-item');

            const startTime = assessment.start_time ? new Date(assessment.start_time) : null;
            const endTime = assessment.end_time ? new Date(assessment.end_time) : null;

            let statusText = '';
            let canTake = true;
            let showTimer = false;

            if (startTime && now < startTime) {
                statusText = ` (Starts: ${formatLocalDateTime(assessment.start_time)})`;
                canTake = false;
            } else if (endTime && now > endTime) {
                statusText = ` (Expired: ${formatLocalDateTime(assessment.end_time)})`;
                canTake = false;
            } else if (startTime && endTime) {
                statusText = ` (Active: ${formatLocalDateTime(assessment.start_time)} - ${formatLocalDateTime(assessment.end_time)})`;
                showTimer = true; // Timer might be relevant if an end time is set
            } else if (assessment.duration) {
                statusText = ` (Duration: ${assessment.duration} minutes)`;
                showTimer = true; // Timer relevant if duration is set
            } else {
                statusText = ' (Available)';
            }


            li.innerHTML = `
                <div>
                    <strong>${assessment.title}</strong>
                    <p>${assessment.description}</p>
                    <small>Created by: ${getDisplayName(assessment.creator_username, assessment.creator_role)} on ${formatLocalDateTime(assessment.created_at)}</small>
                    <p class="assessment-status">${statusText}</p>
                </div>
                <div>
                    <button data-assessment-id="${assessment.id}" class="take-assessment-btn" ${canTake ? '' : 'disabled'}>Take Assessment</button>
                    ${currentUser && currentUser.role === 'admin' ?
                        `<button data-assessment-id="${assessment.id}" class="view-submissions-btn">View Submissions</button>
                         <button data-assessment-id="${assessment.id}" class="delete-assessment-btn"><i class="fas fa-trash"></i></button>`
                        : ''}
                </div>
            `;
            assessmentListDiv.appendChild(li);
        });

        document.querySelectorAll('.take-assessment-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assessmentId = e.target.dataset.assessmentId;
                takeAssessment(assessmentId);
            });
        });

        document.querySelectorAll('.view-submissions-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assessmentId = e.target.dataset.assessmentId;
                viewAssessmentSubmissions(assessmentId);
            });
        });

        document.querySelectorAll('.delete-assessment-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const assessmentId = e.target.dataset.assessmentId;
                if (confirm('Are you sure you want to delete this assessment and all its submissions?')) {
                    await deleteAssessment(assessmentId);
                }
            });
        });
    }

    async function takeAssessment(assessmentId) {
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            const assessment = await response.json();

            if (!response.ok) {
                showNotification(assessment.error || 'Failed to load assessment.', true);
                return;
            }

            currentAssessmentToTake = assessment;
            takeAssessmentTitle.textContent = assessment.title;
            takeAssessmentDescription.textContent = assessment.description;
            takeAssessmentForm.innerHTML = ''; // Clear previous questions

            // Check scheduling again, server-side validation is also needed
            const now = new Date();
            const startTime = assessment.start_time ? new Date(assessment.start_time) : null;
            const endTime = assessment.end_time ? new Date(assessment.end_time) : null;

            if (startTime && now < startTime) {
                showNotification(`This assessment starts on ${formatLocalDateTime(assessment.start_time)}.`, true);
                submitAnswersBtn.disabled = true;
                return; // Prevent taking if not started
            }
            if (endTime && now > endTime) {
                showNotification(`This assessment expired on ${formatLocalDateTime(assessment.end_time)}.`, true);
                submitAnswersBtn.disabled = true;
                return; // Prevent taking if expired
            }

            // Render questions
            if (assessment.questions && assessment.questions.length > 0) {
                assessment.questions.forEach((q, index) => {
                    const questionDiv = document.createElement('div');
                    questionDiv.classList.add('take-assessment-question-item');
                    questionDiv.innerHTML = `
                        <p><strong>${index + 1}. ${q.text}</strong></p>
                    `;
                    if (q.type === 'mcq') {
                        q.options.forEach((option, optIndex) => {
                            const optionId = `q${q.id_in_assessment}-${optIndex}`;
                            questionDiv.innerHTML += `
                                <input type="radio" id="${optionId}" name="q${q.id_in_assessment}" value="${optIndex}">
                                <label for="${optionId}">${String.fromCharCode(65 + optIndex)}. ${option}</label><br>
                            `;
                        });
                    } else if (q.type === 'short_answer') {
                        questionDiv.innerHTML += `
                            <textarea name="q${q.id_in_assessment}" placeholder="Your answer"></textarea>
                        `;
                    }
                    takeAssessmentForm.appendChild(questionDiv);
                });
            } else {
                takeAssessmentForm.innerHTML = '<p>No questions found for this assessment.</p>';
                submitAnswersBtn.disabled = true;
            }

            submitAnswersBtn.disabled = false; // Enable submit button

            // Handle Timer
            if (assessment.duration) {
                let timeLeft = assessment.duration * 60; // Convert minutes to seconds
                assessmentTimerDisplay.classList.remove('hidden');
                submitAnswersBtn.disabled = false; // Enable submit button if timer is active

                if (assessmentTimerInterval) {
                    clearInterval(assessmentTimerInterval); // Clear any existing timer
                }

                assessmentTimerInterval = setInterval(() => {
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    assessmentTimerDisplay.textContent = `Time Left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                    if (timeLeft <= 0) {
                        clearInterval(assessmentTimerInterval);
                        showNotification('Time is up! Your assessment has been submitted automatically.', true);
                        submitAnswers(); // Automatically submit
                        submitAnswersBtn.disabled = true;
                    }
                    timeLeft--;
                }, 1000);
            } else {
                assessmentTimerDisplay.classList.add('hidden'); // Hide timer if no duration
                if (assessmentTimerInterval) {
                    clearInterval(assessmentTimerInterval);
                }
            }


            showSection(assessmentsSection);
            assessmentListContainer.classList.add('hidden');
            takeAssessmentContainer.classList.remove('hidden');
            viewSubmissionsContainer.classList.add('hidden');

        } catch (error) {
            console.error('Error taking assessment:', error);
            showNotification('An error occurred while loading the assessment.', true);
        }
    }

    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', submitAnswers);
    }

    async function submitAnswers() {
        if (!currentAssessmentToTake || !currentUser || !currentClassroom) {
            showNotification('Error: Assessment data or user/classroom information missing.', true);
            return;
        }

        const answers = [];
        let allAnswered = true; // Track if all questions are answered

        currentAssessmentToTake.questions.forEach(q => {
            let userAnswer = null;
            if (q.type === 'mcq') {
                const selectedOption = takeAssessmentForm.querySelector(`input[name="q${q.id_in_assessment}"]:checked`);
                if (selectedOption) {
                    userAnswer = parseInt(selectedOption.value);
                } else {
                    allAnswered = false; // MCQ not answered
                }
            } else if (q.type === 'short_answer') {
                const textarea = takeAssessmentForm.querySelector(`textarea[name="q${q.id_in_assessment}"]`);
                if (textarea && textarea.value.trim() !== '') {
                    userAnswer = textarea.value.trim();
                } else {
                    allAnswered = false; // Short answer not answered
                }
            }
            answers.push({
                question_id: q.id, // The actual MongoDB _id for the question
                question_text: q.text,
                question_type: q.type,
                user_answer: userAnswer
            });
        });

        if (!allAnswered && !confirm('You have not answered all questions. Do you want to submit anyway?')) {
            return;
        }

        try {
            const response = await fetch(`/api/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classroomId: currentClassroom.id,
                    user_id: currentUser.id,
                    username: currentUser.username,
                    answers: answers
                })
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                displayMessage(assessmentSubmissionMessage, 'Assessment submitted successfully!', false);
                submitAnswersBtn.disabled = true; // Prevent multiple submissions
                if (assessmentTimerInterval) {
                    clearInterval(assessmentTimerInterval); // Stop timer on manual submission
                }
                // Optionally show score here if returned by backend
            } else {
                showNotification(result.error, true);
                displayMessage(assessmentSubmissionMessage, result.error, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            showNotification('An error occurred while submitting the assessment.', true);
            displayMessage(assessmentSubmissionMessage, 'An error occurred during submission.', true);
        }
    }

    async function viewAssessmentSubmissions(assessmentId) {
        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            const submissions = await response.json();

            if (!response.ok) {
                showNotification(submissions.error || 'Failed to load submissions.', true);
                return;
            }

            const assessmentResponse = await fetch(`/api/assessments/${assessmentId}`);
            const assessment = await assessmentResponse.json();
            submissionsAssessmentTitle.textContent = `Submissions for: ${assessment.title}`;
            submissionsList.innerHTML = '';

            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
                showNotification('No submissions found.', false);
                // Optionally hide submission list or button
            } else {
                submissions.forEach(submission => {
                    const submissionDiv = document.createElement('div');
                    submissionDiv.classList.add('submission-item');
                    const submittedAt = new Date(submission.submitted_at).toLocaleString();
                    submissionDiv.innerHTML = `
                        <h4>Submission by: ${submission.username}</h4>
                        <p>Submitted On: ${submittedAt}</p>
                        <p>Score: ${submission.score !== undefined ? submission.score : 'N/A'}/${assessment.questions.length}</p>
                        <div class="submission-answers">
                            <h5>Answers:</h5>
                            ${submission.answers.map((answer, index) => {
                                const question = assessment.questions.find(q => q.id === answer.question_id);
                                if (!question) return ''; // Should not happen
                                let correctness = '';
                                if (answer.is_correct !== undefined) {
                                    correctness = answer.is_correct ? '<span class="correct-answer-status">✅ Correct</span>' : '<span class="incorrect-answer-status">❌ Incorrect</span>';
                                }
                                return `
                                    <div class="submitted-question">
                                        <p><strong>${index + 1}. ${question.text}</strong> ${correctness}</p>
                                        <p>Your Answer: ${answer.user_answer}</p>
                                        <p>Correct Answer: ${question.correct_answer}</p>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                    submissionsList.appendChild(submissionDiv);
                });
                showNotification(`Loaded ${submissions.length} submissions.`);
            }

            showSection(assessmentsSection);
            assessmentListContainer.classList.add('hidden');
            takeAssessmentContainer.classList.add('hidden');
            viewSubmissionsContainer.classList.remove('hidden');

        } catch (error) {
            console.error('Error viewing submissions:', error);
            showNotification('An error occurred while loading submissions.', true);
        }
    }

    async function deleteAssessment(assessmentId) {
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
                showNotification(result.message);
                loadAssessments(); // Refresh list
            } else {
                showNotification(result.error, true);
            }
        } catch (error) {
            console.error('Error deleting assessment:', error);
            showNotification('An error occurred during assessment deletion.', true);
        }
    }


    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => { currentAssessmentToTake = null; loadAssessments(); showSection(assessmentsSection); assessmentListContainer.classList.remove('hidden'); takeAssessmentContainer.classList.add('hidden'); assessmentSubmissionMessage.textContent = ''; if (assessmentTimerInterval) clearInterval(assessmentTimerInterval); assessmentTimerDisplay.classList.add('hidden'); submitAnswersBtn.disabled = false; });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => { loadAssessments(); showSection(assessmentsSection); assessmentListContainer.classList.remove('hidden'); viewSubmissionsContainer.classList.add('hidden'); });

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
