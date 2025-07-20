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
    const joinClassroomSection = document.getElementById('join-classroom-section');
    const joinClassroomCodeInput = document.getElementById('join-classroom-code');
    const joinClassroomBtn = document.getElementById('join-classroom-btn');
    const classroomListDiv = document.getElementById('classroom-list');

    const classroomSection = document.getElementById('classroom-section');
    const classNameValue = document.getElementById('class-name-value');
    const classCodeSpan = document.getElementById('class-code'); // For displaying the current class code
    const leaveClassroomBtn = document.getElementById('leave-classroom-btn');

    // Classroom Sub-Sections Navigation
    const navChat = document.getElementById('nav-chat');
    const navWhiteboard = document.getElementById('nav-whiteboard');
    const navParticipants = document.getElementById('nav-participants');
    const navLibrary = document.getElementById('nav-library');
    const navAssessments = document.getElementById('nav-assessments');

    const chatSection = document.getElementById('chat-section');
    const whiteboardSection = document.getElementById('whiteboard-section');
    const participantsSection = document.getElementById('participants-section');
    const librarySection = document.getElementById('library-section');
    const assessmentSection = document.getElementById('assessment-section');

    // Chat functionality elements
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessages = document.getElementById('chat-messages');

    // Whiteboard elements
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const whiteboardContext = whiteboardCanvas ? whiteboardCanvas.getContext('2d') : null;
    const colorPicker = document.getElementById('color-picker');
    const brushSize = document.getElementById('brush-size');
    const clearWhiteboardBtn = document.getElementById('clear-whiteboard-btn');
    const undoWhiteboardBtn = document.getElementById('undo-whiteboard-btn');
    const redoWhiteboardBtn = document.getElementById('redo-whiteboard-btn');
    const newPageBtn = document.getElementById('new-page-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const currentPageSpan = document.getElementById('current-page');
    const totalPagesSpan = document.getElementById('total-pages');
    const shareLinkBtn = document.getElementById('share-link-btn');
    const shareLinkModal = document.getElementById('share-link-modal');
    const closeShareLinkModal = document.getElementById('close-share-link-modal');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');

    // Participants elements
    const participantsList = document.getElementById('participants-list');

    // Library elements
    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryFilesList = document.getElementById('library-files-list');

    // Assessments elements
    const createAssessmentBtn = document.getElementById('create-assessment-btn');
    const assessmentListDiv = document.getElementById('assessment-list');
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const createAssessmentFormBtn = document.getElementById('create-assessment-form-btn');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionInput = document.getElementById('assessment-description');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsContainer = document.getElementById('questions-container');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const takeAssessmentForm = document.getElementById('take-assessment-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const viewSubmissionsContainer = document.getElementById('view-submissions-container');
    const submissionsAssessmentTitle = document.getElementById('submissions-assessment-title');
    const submissionsList = document.getElementById('submissions-list');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');


    // Settings elements
    const settingsSection = document.getElementById('settings-section');
    const updateProfileForm = document.getElementById('update-profile-form');
    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');


    // Global Variables
    let currentUser = null;
    let currentClassroom = null;
    let socket = null;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentPage = 1;
    let whiteboardHistory = {}; // Stores drawing history for each page
    let currentAssessmentToTake = null; // Stores the assessment being taken
    let currentAssessmentSubmissions = {}; // Stores submissions for an assessment

    // --- Utility Functions ---

    /**
     * Displays a notification message.
     * @param {string} message - The message to display.
     * @param {boolean} isError - True if it's an error message, false for success/info.
     */
    function showNotification(message, isError = false) {
        const notificationsContainer = document.getElementById('notifications-container');
        if (!notificationsContainer) {
            console.warn('Notifications container not found.');
            return;
        }

        const notificationDiv = document.createElement('div');
        notificationDiv.classList.add('notification-message');
        if (isError) {
            notificationDiv.classList.add('error-notification');
        }
        notificationDiv.textContent = message;
        notificationsContainer.prepend(notificationDiv); // Add to top

        // Remove after 5 seconds
        setTimeout(() => {
            notificationDiv.remove();
        }, 5000);
    }

    /**
     * Helper to display a message on the UI (e.g., auth messages).
     * @param {HTMLElement} element - The DOM element to display the message in.
     * @param {string} message - The message content.
     * @param {boolean} isError - Whether the message indicates an error.
     */
    function displayMessage(element, message, isError) {
        element.textContent = message;
        element.style.color = isError ? 'red' : 'green';
    }

    /**
     * Shows a specific section of the app and hides others.
     * @param {HTMLElement} sectionToShow - The section to make active.
     */
    function showSection(sectionToShow) {
        const sections = [authSection, dashboardSection, classroomSection, createClassroomSection, joinClassroomSection, settingsSection];
        sections.forEach(section => {
            if (section) { // Check if element exists
                if (section === sectionToShow) {
                    section.classList.add('active');
                    section.classList.remove('hidden');
                } else {
                    section.classList.remove('active');
                    section.classList.add('hidden');
                }
            }
        });
    }

    /**
     * Shows a specific sub-section within the classroom and hides others.
     * @param {HTMLElement} subSectionToShow - The sub-section to make active.
     */
    function showClassroomSubSection(subSectionToShow) {
        const subSections = [chatSection, whiteboardSection, participantsSection, librarySection, assessmentSection];
        subSections.forEach(subSection => {
            if (subSection) {
                if (subSection === subSectionToShow) {
                    subSection.classList.remove('hidden');
                } else {
                    subSection.classList.add('hidden');
                }
            }
        });
    }

    /**
     * Updates the active state of navigation buttons in the classroom sidebar.
     * @param {HTMLElement} activeNavButton - The navigation button to highlight.
     */
    function updateNavActiveState(activeNavButton) {
        const navButtons = [navChat, navWhiteboard, navParticipants, navLibrary, navAssessments, navDashboard, navClassroom, navSettings];
        navButtons.forEach(btn => {
            if (btn) {
                if (btn === activeNavButton) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    /**
     * Updates UI elements based on the current user's role.
     */
    function updateUIBasedOnRole() {
        if (!currentUser) return;

        const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
        adminOnlyElements.forEach(el => {
            if (currentUser.role === 'admin' || currentUser.role === 'teacher') {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    }

    /**
     * Formats username and role for display.
     * @param {string} username - The user's username.
     * @param {string} role - The user's role.
     * @returns {string} - Formatted display name.
     */
    function getDisplayName(username, role) {
        return `${username} (${role.charAt(0).toUpperCase() + role.slice(1)})`;
    }

    /**
     * Adds a chat message to the display.
     * @param {string} senderUsername - The username of the sender.
     * @param {string} messageContent - The content of the message.
     * @param {string} timestamp - ISO string of when the message was sent.
     * @param {boolean} isCurrentUser - True if the message is from the current user.
     */
    function addChatMessage(senderUsername, messageContent, timestamp, isCurrentUser) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        messageElement.classList.add(isCurrentUser ? 'my-message' : 'other-message');

        const senderSpan = document.createElement('span');
        senderSpan.classList.add('sender-name');
        senderSpan.textContent = senderUsername;

        const contentParagraph = document.createElement('p');
        contentParagraph.classList.add('message-content');
        contentParagraph.textContent = messageContent;

        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('message-timestamp');
        // Format timestamp nicely, e.g., "HH:MM AM/PM"
        const date = new Date(timestamp);
        timestampSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageElement.appendChild(senderSpan);
        messageElement.appendChild(contentParagraph);
        messageElement.appendChild(timestampSpan);
        chatMessages.appendChild(messageElement);

        // Auto-scroll to the latest message
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Authentication Functions ---

    /**
     * Handles user login.
     * @param {Event} e - The form submission event.
     */
    async function handleLogin(e) {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                currentUser = data.user;
                checkLoginStatus(); // Re-check status to update UI
            } else {
                displayMessage(authMessage, data.message, true);
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Login error:', error);
            displayMessage(authMessage, 'An error occurred during login.', true);
            showNotification('An error occurred during login.', true);
        }
    }

    /**
     * Handles user registration.
     * @param {Event} e - The form submission event.
     */
    async function handleRegister(e) {
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
                body: JSON.stringify({ username, email, password, role })
            });
            const data = await response.json();
            if (response.ok) {
                displayMessage(authMessage, data.message, false);
                showNotification(data.message);
                registerForm.reset();
                showLoginLink.click(); // Switch back to login
            } else {
                displayMessage(authMessage, data.message, true);
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Registration error:', error);
            displayMessage(authMessage, 'An error occurred during registration.', true);
            showNotification('An error occurred during registration.', true);
        }
    }

    /**
     * Checks the login status and updates the UI.
     */
    async function checkLoginStatus() {
        try {
            const response = await fetch('/api/check_auth');
            const data = await response.json();

            if (data.authenticated) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                showSection(dashboardSection);
                updateUIBasedOnRole();
                loadUserClassrooms();
                // Check if there's a stored classroom to rejoin
                const storedClassroom = localStorage.getItem('currentClassroom');
                if (storedClassroom) {
                    const { id, name } = JSON.parse(storedClassroom);
                    enterClassroom(id, name);
                } else {
                    updateNavActiveState(navDashboard);
                }
                connectSocket(); // Connect Socket.IO after authentication
            } else {
                currentUser = null;
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentClassroom');
                showSection(authSection);
                if (socket) {
                    socket.disconnect(); // Disconnect socket if not authenticated
                    socket = null;
                }
            }
        } catch (error) {
            console.error('Authentication check error:', error);
            currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentClassroom');
            showSection(authSection);
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        }
    }

    /**
     * Handles user logout.
     */
    async function handleLogout() {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message);
                currentUser = null;
                currentClassroom = null;
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentClassroom');
                if (socket) {
                    socket.disconnect(); // Disconnect socket on logout
                    socket = null;
                }
                showSection(authSection); // Go back to login screen
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('An error occurred during logout.', true);
        }
    }

    /**
     * Handles profile update.
     * @param {Event} e - The form submission event.
     */
    async function handleProfileUpdate(e) {
        e.preventDefault();
        const username = settingsUsernameInput.value.trim();

        if (!username) {
            showNotification("Username cannot be empty.", true);
            return;
        }

        try {
            const response = await fetch('/api/update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message);
                currentUser.username = username; // Update local user object
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showNotification('An error occurred during profile update.', true);
        }
    }


    // --- Dashboard Functions ---

    /**
     * Loads and displays classrooms the user is part of.
     */
    async function loadUserClassrooms() {
        try {
            const response = await fetch('/api/classrooms');
            const data = await response.json();
            if (response.ok) {
                displayClassrooms(data.classrooms);
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
            showNotification('Error loading classrooms.', true);
        }
    }

    /**
     * Renders classrooms in the dashboard.
     * @param {Array<Object>} classrooms - List of classroom objects.
     */
    function displayClassrooms(classrooms) {
        classroomListDiv.innerHTML = ''; // Clear existing
        if (classrooms.length === 0) {
            classroomListDiv.innerHTML = '<p>No classrooms found. Create or join one!</p>';
            return;
        }
        classrooms.forEach(classroom => {
            const div = document.createElement('div');
            div.classList.add('classroom-item');
            div.innerHTML = `
                <h4>${classroom.name}</h4>
                <p>Code: ${classroom.id}</p>
                <p>Created by: ${classroom.creator_username}</p>
                <button class="btn-primary" data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}">Join</button>
            `;
            classroomListDiv.appendChild(div);
        });

        // Add event listeners to join buttons
        classroomListDiv.querySelectorAll('.btn-primary').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.classroomId;
                const name = e.target.dataset.classroomName;
                enterClassroom(id, name);
            });
        });
    }

    /**
     * Creates a new classroom.
     * @param {Event} e - The form submission event.
     */
    async function handleCreateClassroom(e) {
        e.preventDefault();
        const classroomName = newClassroomNameInput.value.trim();
        if (!classroomName) {
            showNotification("Classroom name cannot be empty.", true);
            return;
        }

        try {
            const response = await fetch('/api/create_classroom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: classroomName })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message);
                newClassroomNameInput.value = '';
                showSection(dashboardSection); // Go back to dashboard
                loadUserClassrooms(); // Refresh classroom list
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error creating classroom:', error);
            showNotification('An error occurred creating the classroom.', true);
        }
    }

    /**
     * Joins an existing classroom.
     * @param {Event} e - The form submission event.
     */
    async function handleJoinClassroom(e) {
        e.preventDefault();
        const classroomCode = joinClassroomCodeInput.value.trim();
        if (!classroomCode) {
            showNotification("Classroom code cannot be empty.", true);
            return;
        }

        try {
            const response = await fetch('/api/join_classroom_api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ classroom_id: classroomCode })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message);
                joinClassroomCodeInput.value = '';
                showSection(dashboardSection); // Go back to dashboard
                loadUserClassrooms(); // Refresh classroom list
                // If successful, automatically enter the classroom
                enterClassroom(classroomCode, data.classroom_name || 'Joined Classroom');
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error joining classroom:', error);
            showNotification('An error occurred joining the classroom.', true);
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
        classCodeSpan.textContent = id; // Update class code display

        showSection(classroomSection);
        updateNavActiveState(navClassroom);
        updateUIBasedOnRole();
        showClassroomSubSection(chatSection); // Default to chat section
        updateNavActiveState(navChat); // Highlight chat nav button

        // Initialize Socket.IO connection if not already established
        if (!socket) {
            connectSocket();
        } else {
            // If socket already exists, ensure it joins the new room
            // Leave previous room if any (important if switching classrooms without full page reload)
            // Note: A simpler approach might be to just emit 'join_classroom' again,
            // the server can handle leaving the old room if the user's SID changes room.
            // For now, let's ensure the join is correctly handled.
            socket.emit('join_classroom', { classroomId: currentClassroom.id });
        }

        // Clear existing chat messages before loading new ones
        chatMessages.innerHTML = '';
        // NEW: Request historical messages when joining a classroom
        if (socket && socket.connected) {
            socket.emit('request_historical_messages', { classroomId: currentClassroom.id });
        } else {
            // If socket not connected yet, queue the request for when it connects
            // This ensures historical messages are fetched once connected.
            const onConnectHandler = () => {
                socket.emit('request_historical_messages', { classroomId: currentClassroom.id });
                socket.off('connect', onConnectHandler); // Remove handler after first successful connect
            };
            socket.on('connect', onConnectHandler);
        }

        // Reset whiteboard for new classroom
        whiteboardHistory = {};
        currentPage = 1;
        updatePageDisplay();
        clearWhiteboard();

        // Load participants
        loadParticipants();
        // Load library files
        loadLibraryFiles();
        // Load assessments
        loadAssessments();
    }


    /**
     * Leaves the current classroom.
     */
    function leaveClassroom() {
        if (currentClassroom && socket) {
            socket.emit('leave_classroom', { classroomId: currentClassroom.id });
        }
        currentClassroom = null;
        localStorage.removeItem('currentClassroom');
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadUserClassrooms(); // Refresh classroom list
        showNotification('You have left the classroom.');
        // Optionally disconnect socket fully if not needed elsewhere, or just leave the room.
        // For now, we'll keep the socket connected but ensure it leaves the room.
    }


    // --- Socket.IO Event Handlers ---

    function connectSocket() {
        // Use relative path for Socket.IO connection if serving from same domain
        socket = io({ transports: ['websocket', 'polling'] }); // Explicitly define transports

        socket.on('connect', () => {
            console.log('Socket.IO connected:', socket.id);
            if (currentClassroom) {
                socket.emit('join_classroom', { classroomId: currentClassroom.id });
                // Request historical messages immediately after joining the room
                socket.emit('request_historical_messages', { classroomId: currentClassroom.id });
            }
            if (currentUser) {
                socket.emit('register_user_socket', { userId: currentUser.id }); // Register user with socket ID
            }
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            showNotification('Disconnected from server.', true);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            showNotification('Could not connect to the server.', true);
        });

        // NEW: Listener for historical messages
        socket.on('historical_messages', (messages) => {
            console.log('Received historical messages:', messages);
            chatMessages.innerHTML = ''; // Clear current messages before adding historical ones
            messages.forEach(msg => {
                const isCurrentUserMessage = currentUser && currentUser.id === msg.sender_id;
                addChatMessage(msg.sender_username, msg.message_content, msg.timestamp, isCurrentUserMessage);
            });
        });

        // Listen for incoming chat messages
        socket.on('chat_message', (data) => {
            const { sender_username, message_content, timestamp, sender_id } = data;
            const isCurrentUserMessage = currentUser && currentUser.id === sender_id;
            addChatMessage(sender_username, message_content, timestamp, isCurrentUserMessage);
        });

        // Listen for user join/leave notifications
        socket.on('user_joined', (data) => {
            showNotification(`${data.username} has joined the classroom.`);
            loadParticipants(); // Refresh participant list
        });

        socket.on('user_left', (data) => {
            showNotification(`${data.username} has left the classroom.`, true);
            loadParticipants(); // Refresh participant list
        });

        socket.on('active_users_update', (data) => {
            updateParticipantsOnlineStatus(data.active_user_ids);
        });


        // Whiteboard Socket.IO Events
        socket.on('drawing', (data) => {
            if (data.classroomId === currentClassroom.id && data.page === currentPage) {
                const { x0, y0, x1, y1, color, size } = data;
                drawLine(x0, y0, x1, y1, color, size, false); // Draw, but don't save to history here
            }
        });

        socket.on('whiteboard_state', (data) => {
            if (data.classroomId === currentClassroom.id) {
                whiteboardHistory = data.history || {};
                currentPage = data.currentPage || 1;
                updatePageDisplay();
                redrawCanvas();
            }
        });

        socket.on('clear_whiteboard', (data) => {
            if (data.classroomId === currentClassroom.id && data.page === currentPage) {
                clearWhiteboard();
                if (data.full_clear) {
                    whiteboardHistory = {}; // Clear all history if full clear
                    currentPage = 1;
                    updatePageDisplay();
                } else if (whiteboardHistory[currentPage]) {
                    whiteboardHistory[currentPage] = []; // Clear current page's history
                }
            }
        });

        socket.on('new_whiteboard_page', (data) => {
            if (data.classroomId === currentClassroom.id) {
                // Ensure page exists in history if not already
                if (!whiteboardHistory[data.page]) {
                    whiteboardHistory[data.page] = [];
                }
                currentPage = data.page;
                updatePageDisplay();
                redrawCanvas();
                showNotification(`Moved to page ${currentPage}.`);
            }
        });

        socket.on('library_file_uploaded', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(`New file uploaded: ${data.file_name}`);
                loadLibraryFiles(); // Refresh list
            }
        });

        socket.on('library_file_deleted', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(`File deleted: ${data.file_name}`, true);
                loadLibraryFiles(); // Refresh list
            }
        });

        socket.on('new_assessment_created', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(`New assessment created: ${data.title}`);
                loadAssessments(); // Refresh list
            }
        });

        socket.on('assessment_submitted_notification', (data) => {
            if (data.classroomId === currentClassroom.id && currentUser.role === 'teacher') {
                showNotification(`${data.username} has submitted an assessment: ${data.assessment_title}`);
            }
        });

        socket.on('admin_action_update', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(`Admin: ${data.message}`, true);
            }
        });
    }

    // Existing chat message sending logic
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && currentClassroom) {
                socket.emit('chat_message', {
                    classroomId: currentClassroom.id,
                    message_content: message
                });
                // Immediately add message to UI for sender without waiting for server echo
                // This makes the chat feel more responsive
                addChatMessage(currentUser.username, message, new Date().toISOString(), true);
                chatInput.value = '';
            } else if (!currentClassroom) {
                showNotification("Please join a classroom to chat.", true);
            }
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageBtn.click();
            }
        });
    }


    // --- Whiteboard Functions ---

    function initializeWhiteboard() {
        if (!whiteboardCanvas || !whiteboardContext) return;

        // Set canvas size dynamically to fill container
        function resizeCanvas() {
            const container = whiteboardCanvas.parentElement;
            whiteboardCanvas.width = container.clientWidth;
            whiteboardCanvas.height = container.clientHeight;
            redrawCanvas(); // Redraw content after resize
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // Initial resize

        // Prevent scrolling on touch devices when drawing
        whiteboardCanvas.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
        whiteboardCanvas.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault();
        }, { passive: false });
        whiteboardCanvas.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
        }, { passive: false });


        let paths = whiteboardHistory[currentPage] || [];
        let pathIndex = paths.length - 1; // For undo/redo

        function getMousePos(e) {
            const rect = whiteboardCanvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        function getTouchPos(e) {
            const rect = whiteboardCanvas.getBoundingClientRect();
            const touch = e.touches[0];
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }

        function startDrawing(e) {
            isDrawing = true;
            let pos;
            if (e.touches) {
                pos = getTouchPos(e);
            } else {
                pos = getMousePos(e);
            }
            lastX = pos.x;
            lastY = pos.y;
        }

        function draw(e) {
            if (!isDrawing) return;
            let pos;
            if (e.touches) {
                pos = getTouchPos(e);
            } else {
                pos = getMousePos(e);
            }

            const color = colorPicker.value;
            const size = brushSize.value;

            drawLine(lastX, lastY, pos.x, pos.y, color, size, true); // Draw and save
            socket.emit('drawing', {
                classroomId: currentClassroom.id,
                page: currentPage,
                x0: lastX,
                y0: lastY,
                x1: pos.x,
                y1: pos.y,
                color: color,
                size: size
            });

            lastX = pos.x;
            lastY = pos.y;
        }

        function stopDrawing() {
            isDrawing = false;
        }

        function drawLine(x0, y0, x1, y1, color, size, saveToHistory = false) {
            if (!whiteboardContext) return;
            whiteboardContext.beginPath();
            whiteboardContext.moveTo(x0, y0);
            whiteboardContext.lineTo(x1, y1);
            whiteboardContext.strokeStyle = color;
            whiteboardContext.lineWidth = size;
            whiteboardContext.lineCap = 'round';
            whiteboardContext.stroke();

            if (saveToHistory) {
                if (!whiteboardHistory[currentPage]) {
                    whiteboardHistory[currentPage] = [];
                }
                // If we're drawing after an undo, clear redo history
                if (pathIndex < whiteboardHistory[currentPage].length - 1) {
                    whiteboardHistory[currentPage] = whiteboardHistory[currentPage].slice(0, pathIndex + 1);
                }
                whiteboardHistory[currentPage].push({ x0, y0, x1, y1, color, size });
                pathIndex = whiteboardHistory[currentPage].length - 1; // Update pathIndex
            }
        }

        function redrawCanvas() {
            if (!whiteboardContext) return;
            whiteboardContext.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            if (whiteboardHistory[currentPage]) {
                whiteboardHistory[currentPage].forEach(line => {
                    drawLine(line.x0, line.y0, line.x1, line.y1, line.color, line.size, false);
                });
            }
        }

        function clearWhiteboard(fullClear = false) {
            if (!whiteboardContext) return;
            whiteboardContext.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            if (fullClear) {
                whiteboardHistory = {};
                currentPage = 1;
            } else {
                whiteboardHistory[currentPage] = [];
            }
            pathIndex = -1; // Reset pathIndex after clearing
            updatePageDisplay();
            socket.emit('clear_whiteboard', {
                classroomId: currentClassroom.id,
                page: currentPage,
                full_clear: fullClear
            });
        }

        function undoDrawing() {
            if (!whiteboardHistory[currentPage] || whiteboardHistory[currentPage].length === 0) return;
            if (pathIndex >= 0) {
                pathIndex--;
                redrawCanvas();
                // We don't emit undo/redo over socket, just state updates.
                // The history is maintained client-side for immediate feedback.
                // Full whiteboard state sync might be needed on join or significant changes.
            }
        }

        function redoDrawing() {
            if (!whiteboardHistory[currentPage] || pathIndex >= whiteboardHistory[currentPage].length - 1) return;
            if (pathIndex < whiteboardHistory[currentPage].length - 1) {
                pathIndex++;
                redrawCanvas();
            }
        }

        function updatePageDisplay() {
            currentPageSpan.textContent = currentPage;
            totalPagesSpan.textContent = Object.keys(whiteboardHistory).length || 1;
        }

        function goToPage(pageNumber) {
            const maxPage = Object.keys(whiteboardHistory).length || 1;
            if (pageNumber < 1) pageNumber = 1;
            if (pageNumber > maxPage && pageNumber > currentPage) {
                // If going to a new page beyond current max, create it
                if (!whiteboardHistory[pageNumber]) {
                    whiteboardHistory[pageNumber] = [];
                }
            } else if (pageNumber > maxPage) {
                pageNumber = maxPage; // Cap at existing max if navigating backward/staying
            }

            if (currentPage !== pageNumber) {
                currentPage = pageNumber;
                pathIndex = (whiteboardHistory[currentPage]?.length || 0) - 1; // Reset pathIndex for new page
                updatePageDisplay();
                redrawCanvas();
                socket.emit('change_whiteboard_page', {
                    classroomId: currentClassroom.id,
                    page: currentPage,
                    history: whiteboardHistory // Send full history for synchronization
                });
            }
        }

        if (whiteboardCanvas) {
            whiteboardCanvas.addEventListener('mousedown', startDrawing);
            whiteboardCanvas.addEventListener('mouseup', stopDrawing);
            whiteboardCanvas.addEventListener('mouseout', stopDrawing);
            whiteboardCanvas.addEventListener('mousemove', draw);

            whiteboardCanvas.addEventListener('touchstart', startDrawing);
            whiteboardCanvas.addEventListener('touchend', stopDrawing);
            whiteboardCanvas.addEventListener('touchcancel', stopDrawing);
            whiteboardCanvas.addEventListener('touchmove', draw);
        }

        if (clearWhiteboardBtn) clearWhiteboardBtn.addEventListener('click', () => clearWhiteboard(true));
        if (undoWhiteboardBtn) undoWhiteboardBtn.addEventListener('click', undoDrawing);
        if (redoWhiteboardBtn) redoWhiteboardBtn.addEventListener('click', redoDrawing);

        if (newPageBtn) {
            newPageBtn.addEventListener('click', () => {
                const newPage = (Object.keys(whiteboardHistory).length || 0) + 1;
                goToPage(newPage);
            });
        }

        if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));

        if (shareLinkBtn) {
            shareLinkBtn.addEventListener('click', () => {
                if (currentClassroom) {
                    shareLinkInput.value = `${window.location.origin}/#classroom=${currentClassroom.id}`;
                    shareLinkModal.classList.remove('hidden');
                } else {
                    showNotification("Please join a classroom to get a share link.", true);
                }
            });
        }

        if (closeShareLinkModal) closeShareLinkModal.addEventListener('click', () => shareLinkModal.classList.add('hidden'));

        if (copyShareLinkBtn) {
            copyShareLinkBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(shareLinkInput.value);
                    showNotification("Classroom link copied to clipboard!");
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                    showNotification("Failed to copy link.", true);
                }
            });
        }

        // Initial setup
        updatePageDisplay();
        redrawCanvas();
    }


    // --- Participants Functions ---
    async function loadParticipants() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/participants`);
            const data = await response.json();
            if (response.ok) {
                displayParticipants(data.participants);
                if (socket && socket.connected) {
                    // Request active users from server after loading all participants
                    socket.emit('request_active_users', { classroomId: currentClassroom.id });
                }
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error loading participants:', error);
            showNotification('Error loading participants.', true);
        }
    }

    function displayParticipants(participants) {
        participantsList.innerHTML = ''; // Clear existing
        if (participants.length === 0) {
            participantsList.innerHTML = '<p>No participants yet.</p>';
            return;
        }
        participants.forEach(p => {
            const div = document.createElement('div');
            div.classList.add('participant-item');
            div.dataset.userId = p.id; // Store user ID for status updates
            div.innerHTML = `
                <span>${getDisplayName(p.username, p.role)}</span>
                <span class="status-indicator" title="Offline"></span>
                <div class="participant-actions">
                    ${currentUser.role === 'teacher' || currentUser.role === 'admin' ?
                    `<button class="btn-danger kick-btn" data-user-id="${p.id}" ${p.id === currentUser.id ? 'disabled' : ''}>Kick</button>` : ''
                }
                </div>
            `;
            participantsList.appendChild(div);
        });

        participantsList.querySelectorAll('.kick-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userIdToKick = e.target.dataset.userId;
                if (confirm(`Are you sure you want to kick ${userIdToKick}?`)) {
                    try {
                        const response = await fetch(`/api/classrooms/${currentClassroom.id}/kick_participant`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: userIdToKick })
                        });
                        const data = await response.json();
                        if (response.ok) {
                            showNotification(data.message);
                            loadParticipants(); // Refresh list
                            socket.emit('admin_action_update', { classroomId: currentClassroom.id, message: `User ${userIdToKick} has been kicked.` });
                        } else {
                            showNotification(data.message, true);
                        }
                    } catch (error) {
                        console.error('Error kicking user:', error);
                        showNotification('Error kicking user.', true);
                    }
                }
            });
        });
    }

    function updateParticipantsOnlineStatus(activeUserIds) {
        participantsList.querySelectorAll('.participant-item').forEach(item => {
            const userId = item.dataset.userId;
            const statusIndicator = item.querySelector('.status-indicator');
            if (statusIndicator) {
                if (activeUserIds.includes(userId)) {
                    statusIndicator.classList.add('online');
                    statusIndicator.title = 'Online';
                } else {
                    statusIndicator.classList.remove('online');
                    statusIndicator.title = 'Offline';
                }
            }
        });
    }


    // --- Library Functions ---

    async function handleUploadLibraryFiles(e) {
        e.preventDefault();
        if (!currentClassroom) {
            showNotification("Please join a classroom to upload files.", true);
            return;
        }

        const files = libraryFileInput.files;
        if (files.length === 0) {
            showNotification("Please select files to upload.", true);
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('classroomId', currentClassroom.id);

        try {
            const response = await fetch('/api/upload_library_files', {
                method: 'POST',
                body: formData // FormData sets Content-Type automatically
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message);
                libraryFileInput.value = ''; // Clear file input
                loadLibraryFiles(); // Refresh list
                socket.emit('library_file_uploaded_notify', { classroomId: currentClassroom.id, file_name: files[0]?.name || 'a file' });
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            showNotification('An error occurred during file upload.', true);
        }
    }

    async function loadLibraryFiles() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/files`);
            const data = await response.json();
            if (response.ok) {
                displayLibraryFiles(data.files);
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            showNotification('Error loading library files.', true);
        }
    }

    function displayLibraryFiles(files) {
        libraryFilesList.innerHTML = '';
        if (files.length === 0) {
            libraryFilesList.innerHTML = '<p>No files uploaded yet.</p>';
            return;
        }

        files.forEach(file => {
            const div = document.createElement('div');
            div.classList.add('library-file-item');
            div.innerHTML = `
                <h4>${file.original_name}</h4>
                <div class="file-actions">
                    <a href="/api/download_library_file/${file.id}" class="btn-primary" target="_blank">Download</a>
                    ${currentUser.role === 'teacher' || currentUser.role === 'admin' ?
                    `<button class="btn-danger delete-file-btn" data-file-id="${file.id}" data-file-name="${file.original_name}">Delete</button>` : ''
                }
                </div>
            `;
            libraryFilesList.appendChild(div);
        });

        libraryFilesList.querySelectorAll('.delete-file-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fileId = e.target.dataset.fileId;
                const fileName = e.target.dataset.fileName;
                if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
                    try {
                        const response = await fetch(`/api/delete_library_file/${fileId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ classroomId: currentClassroom.id })
                        });
                        const data = await response.json();
                        if (response.ok) {
                            showNotification(data.message);
                            loadLibraryFiles();
                            socket.emit('library_file_deleted_notify', { classroomId: currentClassroom.id, file_name: fileName });
                        } else {
                            showNotification(data.message, true);
                        }
                    } catch (error) {
                        console.error('Error deleting file:', error);
                        showNotification('Error deleting file.', true);
                    }
                }
            });
        });
    }

    // --- Assessments Functions ---

    async function loadAssessments() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`);
            const data = await response.json();
            if (response.ok) {
                displayAssessments(data.assessments);
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            showNotification('Error loading assessments.', true);
        }
    }

    function displayAssessments(assessments) {
        assessmentListDiv.innerHTML = '';
        if (assessments.length === 0) {
            assessmentListDiv.innerHTML = '<p>No assessments available. Teachers can create new ones.</p>';
            return;
        }

        assessments.forEach(assessment => {
            const div = document.createElement('div');
            div.classList.add('assessment-item');
            let actionsHtml = '';

            if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
                actionsHtml += `<button class="btn-info view-submissions-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>`;
                actionsHtml += `<button class="btn-danger delete-assessment-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">Delete</button>`;
            } else {
                actionsHtml += `<button class="btn-primary take-assessment-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">Take Assessment</button>`;
            }

            div.innerHTML = `
                <h4>${assessment.title}</h4>
                <p>${assessment.description}</p>
                <div class="assessment-actions">
                    ${actionsHtml}
                </div>
            `;
            assessmentListDiv.appendChild(div);
        });

        assessmentListDiv.querySelectorAll('.take-assessment-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assessmentId = e.target.dataset.assessmentId;
                const assessmentTitle = e.target.dataset.assessmentTitle;
                loadAssessmentToTake(assessmentId, assessmentTitle);
            });
        });

        assessmentListDiv.querySelectorAll('.view-submissions-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assessmentId = e.target.dataset.assessmentId;
                const assessmentTitle = e.target.dataset.assessmentTitle;
                loadSubmissionsForAssessment(assessmentId, assessmentTitle);
            });
        });

        assessmentListDiv.querySelectorAll('.delete-assessment-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const assessmentId = e.target.dataset.assessmentId;
                const assessmentTitle = e.target.dataset.assessmentTitle;
                if (confirm(`Are you sure you want to delete the assessment "${assessmentTitle}"?`)) {
                    try {
                        const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const data = await response.json();
                        if (response.ok) {
                            showNotification(data.message);
                            loadAssessments();
                        } else {
                            showNotification(data.message, true);
                        }
                    } catch (error) {
                        console.error('Error deleting assessment:', error);
                        showNotification('Error deleting assessment.', true);
                    }
                }
            });
        });
    }

    // Assessment Creation Logic
    function addQuestionField(questionType = 'mcq') {
        const questionIndex = questionsContainer.children.length;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-form-group');
        questionDiv.innerHTML = `
            <h4>Question ${questionIndex + 1}</h4>
            <label for="question-text-${questionIndex}">Question Text:</label>
            <input type="text" id="question-text-${questionIndex}" name="questions[${questionIndex}][text]" required>

            <label for="question-type-${questionIndex}">Question Type:</label>
            <select id="question-type-${questionIndex}" name="questions[${questionIndex}][type]">
                <option value="mcq" ${questionType === 'mcq' ? 'selected' : ''}>Multiple Choice</option>
                <option value="short_answer" ${questionType === 'short_answer' ? 'selected' : ''}>Short Answer</option>
            </select>

            <div class="mcq-options" style="${questionType === 'mcq' ? '' : 'display: none;'}">
                <label>Options (for MCQ):</label>
                <div class="mcq-option">
                    <input type="radio" name="questions[${questionIndex}][correct_answer]" value="0" id="q${questionIndex}-option0">
                    <input type="text" name="questions[${questionIndex}][options][]" placeholder="Option A" required>
                    <button type="button" class="btn-danger remove-option-btn" style="display:none;">X</button>
                </div>
                <div class="mcq-option">
                    <input type="radio" name="questions[${questionIndex}][correct_answer]" value="1" id="q${questionIndex}-option1">
                    <input type="text" name="questions[${questionIndex}][options][]" placeholder="Option B" required>
                    <button type="button" class="btn-danger remove-option-btn" style="display:none;">X</button>
                </div>
                <button type="button" class="btn-secondary add-option-btn">Add Option</button>
            </div>
            <div class="short-answer-correct" style="${questionType === 'short_answer' ? '' : 'display: none;'}">
                <label for="correct-answer-${questionIndex}">Correct Answer:</label>
                <input type="text" id="correct-answer-${questionIndex}" name="questions[${questionIndex}][correct_answer_short_answer]" placeholder="Enter correct answer">
            </div>
            <button type="button" class="btn-danger remove-question-btn">Remove Question</button>
        `;
        questionsContainer.appendChild(questionDiv);

        // Event listener for question type change
        questionDiv.querySelector(`#question-type-${questionIndex}`).addEventListener('change', (e) => {
            const selectedType = e.target.value;
            const mcqOptions = questionDiv.querySelector('.mcq-options');
            const shortAnswerCorrect = questionDiv.querySelector('.short-answer-correct');

            if (selectedType === 'mcq') {
                mcqOptions.style.display = 'block';
                shortAnswerCorrect.style.display = 'none';
                questionDiv.querySelector(`#correct-answer-${questionIndex}`).removeAttribute('required');
                questionDiv.querySelectorAll(`input[name="questions[${questionIndex}][options][]"]`).forEach(input => input.setAttribute('required', 'true'));
            } else {
                mcqOptions.style.display = 'none';
                shortAnswerCorrect.style.display = 'block';
                questionDiv.querySelector(`#correct-answer-${questionIndex}`).setAttribute('required', 'true');
                questionDiv.querySelectorAll(`input[name="questions[${questionIndex}][options][]"]`).forEach(input => input.removeAttribute('required'));
            }
        });

        // Event listener for adding MCQ options
        questionDiv.querySelector('.add-option-btn').addEventListener('click', (e) => {
            const optionsContainer = e.target.previousElementSibling.parentElement;
            const optionIndex = optionsContainer.querySelectorAll('.mcq-option').length;
            const newOptionDiv = document.createElement('div');
            newOptionDiv.classList.add('mcq-option');
            newOptionDiv.innerHTML = `
                <input type="radio" name="questions[${questionIndex}][correct_answer]" value="${optionIndex}" id="q${questionIndex}-option${optionIndex}">
                <input type="text" name="questions[${questionIndex}][options][]" placeholder="Option ${String.fromCharCode(65 + optionIndex)}" required>
                <button type="button" class="btn-danger remove-option-btn">X</button>
            `;
            optionsContainer.insertBefore(newOptionDiv, e.target);

            // Show remove buttons for options if there are more than 2
            optionsContainer.querySelectorAll('.remove-option-btn').forEach(btn => btn.style.display = (optionsContainer.querySelectorAll('.mcq-option').length > 2) ? '' : 'none');

            // Add listener for new remove option button
            newOptionDiv.querySelector('.remove-option-btn').addEventListener('click', (removeEvent) => {
                newOptionDiv.remove();
                // Re-index radio button values
                optionsContainer.querySelectorAll('.mcq-option').forEach((option, idx) => {
                    option.querySelector('input[type="radio"]').value = idx;
                    option.querySelector('input[type="radio"]').id = `q${questionIndex}-option${idx}`;
                    // Update placeholder
                    option.querySelector('input[type="text"]').placeholder = `Option ${String.fromCharCode(65 + idx)}`;
                });
                // Hide remove buttons if only 2 options left
                optionsContainer.querySelectorAll('.remove-option-btn').forEach(btn => btn.style.display = (optionsContainer.querySelectorAll('.mcq-option').length > 2) ? '' : 'none');
            });
        });

        // Event listener for removing question
        questionDiv.querySelector('.remove-question-btn').addEventListener('click', () => {
            questionDiv.remove();
            // Re-index remaining questions
            questionsContainer.querySelectorAll('.question-form-group').forEach((qDiv, idx) => {
                qDiv.querySelector('h4').textContent = `Question ${idx + 1}`;
                qDiv.querySelectorAll('[name^="questions["]').forEach(input => {
                    input.name = input.name.replace(/questions\[\d+\]/, `questions[${idx}]`);
                    if (input.id) {
                        input.id = input.id.replace(/q\d+-/, `q${idx}-`);
                    }
                });
            });
        });

        // Initial check for remove option buttons (hide if less than 3 options)
        const currentMcqOptions = questionDiv.querySelectorAll('.mcq-option');
        currentMcqOptions.forEach(optionDiv => {
            const removeBtn = optionDiv.querySelector('.remove-option-btn');
            if (removeBtn) {
                removeBtn.style.display = (currentMcqOptions.length > 2) ? '' : 'none';
            }
        });
    }

    // Function to collect assessment data from form
    function collectAssessmentData() {
        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionInput.value.trim();
        const questions = [];

        questionsContainer.querySelectorAll('.question-form-group').forEach((qDiv, index) => {
            const questionText = qDiv.querySelector(`input[name="questions[${index}][text]"]`).value.trim();
            const questionType = qDiv.querySelector(`select[name="questions[${index}][type]"]`).value;

            const question = {
                text: questionText,
                type: questionType,
            };

            if (questionType === 'mcq') {
                const options = [];
                qDiv.querySelectorAll(`input[name="questions[${index}][options][]"]`).forEach(input => {
                    options.push(input.value.trim());
                });
                const correctAnswerIndex = qDiv.querySelector(`input[name="questions[${index}][correct_answer]:checked"]`)?.value;

                if (options.length < 2) {
                    throw new Error(`Question ${index + 1}: Multiple choice questions require at least 2 options.`);
                }
                if (correctAnswerIndex === undefined || isNaN(parseInt(correctAnswerIndex))) {
                    throw new Error(`Question ${index + 1}: Please select a correct answer for the multiple-choice question.`);
                }

                question.options = options;
                question.correct_answer = parseInt(correctAnswerIndex);
            } else if (questionType === 'short_answer') {
                question.correct_answer = qDiv.querySelector(`input[name="questions[${index}][correct_answer_short_answer]"]`).value.trim();
                if (!question.correct_answer) {
                    throw new Error(`Question ${index + 1}: Short answer questions require a correct answer.`);
                }
            }
            questions.push(question);
        });

        if (!title || !description) {
            throw new Error("Assessment title and description cannot be empty.");
        }
        if (questions.length === 0) {
            throw new Error("An assessment must have at least one question.");
        }

        return { title, description, questions };
    }

    async function handleCreateAssessment(e) {
        e.preventDefault();
        if (!currentClassroom) {
            showNotification("Please join a classroom to create assessments.", true);
            return;
        }

        try {
            const assessmentData = collectAssessmentData(); // This function will throw if data is invalid

            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentData)
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message);
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = ''; // Clear questions
                loadAssessments(); // Refresh the list
                showClassroomSubSection(assessmentSection); // Go back to assessment list
                socket.emit('new_assessment_created_notify', { classroomId: currentClassroom.id, title: assessmentData.title });
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            showNotification(error.message || 'An error occurred creating the assessment.', true);
        }
    }

    // Take Assessment Logic
    async function loadAssessmentToTake(assessmentId, assessmentTitle) {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}`);
            const data = await response.json();
            if (response.ok) {
                currentAssessmentToTake = data.assessment;
                takeAssessmentTitle.textContent = currentAssessmentToTake.title;
                takeAssessmentDescription.textContent = currentAssessmentToTake.description;
                renderTakeAssessmentForm(currentAssessmentToTake.questions);
                showClassroomSubSection(takeAssessmentContainer);
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error loading assessment:', error);
            showNotification('Error loading assessment for taking.', true);
        }
    }

    function renderTakeAssessmentForm(questions) {
        takeAssessmentForm.innerHTML = '';
        assessmentSubmissionMessage.textContent = ''; // Clear previous submission message

        questions.forEach((question, qIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('take-question-group');
            questionDiv.innerHTML = `<p>${qIndex + 1}. ${question.text}</p>`;

            if (question.type === 'mcq') {
                question.options.forEach((option, oIndex) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.classList.add('mcq-option');
                    optionDiv.innerHTML = `
                        <input type="radio" name="answer-q${qIndex}" id="q${qIndex}-opt${oIndex}" value="${oIndex}" required>
                        <label for="q${qIndex}-opt${oIndex}">${String.fromCharCode(65 + oIndex)}. ${option}</label>
                    `;
                    questionDiv.appendChild(optionDiv);
                });
            } else if (question.type === 'short_answer') {
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `answer-q${qIndex}`;
                input.placeholder = "Your answer";
                input.required = true;
                questionDiv.appendChild(input);
            }
            takeAssessmentForm.appendChild(questionDiv);
        });
    }

    async function handleSubmitAssessment(e) {
        e.preventDefault();
        if (!currentClassroom || !currentAssessmentToTake) {
            showNotification("No assessment selected to submit.", true);
            return;
        }

        const answers = [];
        let allAnswered = true;

        currentAssessmentToTake.questions.forEach((question, qIndex) => {
            let userAnswer = null;
            if (question.type === 'mcq') {
                const selectedOption = takeAssessmentForm.querySelector(`input[name="answer-q${qIndex}"]:checked`);
                if (selectedOption) {
                    userAnswer = parseInt(selectedOption.value);
                } else {
                    allAnswered = false;
                }
            } else if (question.type === 'short_answer') {
                const input = takeAssessmentForm.querySelector(`input[name="answer-q${qIndex}"]`);
                if (input && input.value.trim() !== '') {
                    userAnswer = input.value.trim();
                } else {
                    allAnswered = false;
                }
            }
            answers.push(userAnswer);
        });

        if (!allAnswered) {
            showNotification("Please answer all questions before submitting.", true);
            return;
        }

        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });
            const data = await response.json();
            if (response.ok) {
                assessmentSubmissionMessage.textContent = `Submission successful! Your score: ${data.score}/${currentAssessmentToTake.questions.length}`;
                assessmentSubmissionMessage.style.color = 'green';
                showNotification('Assessment submitted successfully!');
                // Disable form after submission
                takeAssessmentForm.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
                submitAnswersBtn.disabled = true;

                // Notify teachers about the submission
                socket.emit('assessment_submitted_notify', {
                    classroomId: currentClassroom.id,
                    assessment_id: currentAssessmentToTake.id,
                    assessment_title: currentAssessmentToTake.title,
                    username: currentUser.username,
                    user_id: currentUser.id
                });

            } else {
                assessmentSubmissionMessage.textContent = data.message;
                assessmentSubmissionMessage.style.color = 'red';
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            assessmentSubmissionMessage.textContent = 'An error occurred during submission.';
            assessmentSubmissionMessage.style.color = 'red';
            showNotification('An error occurred during submission.', true);
        }
    }


    // View Submissions Logic
    async function loadSubmissionsForAssessment(assessmentId, assessmentTitle) {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}/submissions`);
            const data = await response.json();
            if (response.ok) {
                submissionsAssessmentTitle.textContent = `Submissions for: ${assessmentTitle}`;
                currentAssessmentSubmissions = data.submissions; // Store all submissions
                displaySubmissions(data.submissions, assessmentId);
                showClassroomSubSection(viewSubmissionsContainer);
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            showNotification('Error loading submissions.', true);
        }
    }

    function displaySubmissions(submissions, assessmentId) {
        submissionsList.innerHTML = '';
        if (submissions.length === 0) {
            submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
            return;
        }

        submissions.forEach(submission => {
            const submissionDate = new Date(submission.timestamp.$date).toLocaleString(); // Assuming timestamp is { "$date": "ISO_STRING" }
            const score = submission.score !== undefined ? `${submission.score}/${currentAssessmentToTake?.questions?.length || 'N/A'}` : 'N/A'; // Get total questions from currentAssessmentToTake or default

            const div = document.createElement('div');
            div.classList.add('submission-item');
            div.innerHTML = `
                <span>${submission.username} - Score: ${score} - Submitted: ${submissionDate}</span>
                <button class="btn-secondary view-submission-details-btn"
                        data-submission-id="${submission.id}"
                        data-assessment-id="${assessmentId}">
                    View Details
                </button>
            `;
            submissionsList.appendChild(div);
        });

        submissionsList.querySelectorAll('.view-submission-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const submissionId = e.target.dataset.submissionId;
                const assessmentId = e.target.dataset.assessmentId;
                // Find the submission in the `currentAssessmentSubmissions` data
                const submissionDetails = currentAssessmentSubmissions.find(s => s.id === submissionId);
                if (submissionDetails) {
                    // You can implement a modal or new section to display detailed answers
                    displaySubmissionDetailsModal(submissionDetails, assessmentId);
                } else {
                    showNotification("Submission details not found.", true);
                }
            });
        });
    }

    function displaySubmissionDetailsModal(submission, assessmentId) {
        // Fetch the original assessment questions to compare with answers
        fetch(`/api/classrooms/${currentClassroom.id}/assessments/${assessmentId}`)
            .then(response => response.json())
            .then(data => {
                if (data.assessment) {
                    const assessmentQuestions = data.assessment.questions;
                    const modal = document.createElement('div');
                    modal.classList.add('modal-backdrop'); // Add a backdrop for overlay
                    modal.innerHTML = `
                        <div class="modal-content">
                            <h3>Submission by ${submission.username}</h3>
                            <p>Score: ${submission.score}/${assessmentQuestions.length}</p>
                            <div class="submission-details-questions">
                                </div>
                            <button class="btn-primary close-modal-btn">Close</button>
                        </div>
                    `;

                    const detailsContainer = modal.querySelector('.submission-details-questions');
                    submission.answers.forEach((answer, index) => {
                        const question = assessmentQuestions[index];
                        if (!question) return;

                        const questionDetailDiv = document.createElement('div');
                        questionDetailDiv.classList.add('question-detail-item');

                        let answerDisplay = '';
                        let isCorrect = '';

                        if (question.type === 'mcq') {
                            const userAnswerText = question.options[answer];
                            const correctAnswerText = question.options[question.correct_answer];
                            answerDisplay = `Your Answer: ${userAnswerText || 'Not Answered'} (Option ${String.fromCharCode(65 + answer)})`;
                            isCorrect = (answer === question.correct_answer) ? '<span style="color: green;">&#10004; Correct</span>' : `<span style="color: red;">&#10006; Incorrect (Correct: ${correctAnswerText} - Option ${String.fromCharCode(65 + question.correct_answer)})</span>`;
                        } else if (question.type === 'short_answer') {
                            answerDisplay = `Your Answer: "${answer}"`;
                            // For short answer, assuming server already checked correctness or it's manual grading
                            // For simplicity, let's just display the correct answer for reference
                            isCorrect = `Correct Answer: "${question.correct_answer}"`;
                            // You might add server-side logic to determine if `answer` matches `question.correct_answer`
                            // For now, client-side only shows stored correct answer
                        }

                        questionDetailDiv.innerHTML = `
                            <p><strong>Question ${index + 1}:</strong> ${question.text}</p>
                            <p>${answerDisplay}</p>
                            <p>${isCorrect}</p>
                        `;
                        detailsContainer.appendChild(questionDetailDiv);
                    });

                    document.body.appendChild(modal);

                    modal.querySelector('.close-modal-btn').addEventListener('click', () => {
                        modal.remove();
                    });
                } else {
                    showNotification("Could not load assessment details for submission.", true);
                }
            })
            .catch(error => {
                console.error('Error fetching assessment for submission details:', error);
                showNotification('Error loading assessment details for submission.', true);
            });

        // Basic modal styling (add to style.css if not already present)
        const modalStyle = document.createElement('style');
        modalStyle.innerHTML = `
            .modal-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
            }
            .modal-content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                position: relative;
            }
            .modal-content h3 {
                margin-top: 0;
                color: var(--primary-color);
            }
            .submission-details-questions {
                margin-top: 15px;
                border-top: 1px solid var(--border-color);
                padding-top: 15px;
            }
            .question-detail-item {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px dashed var(--light-border-color);
            }
            .question-detail-item:last-child {
                border-bottom: none;
            }
            .close-modal-btn {
                margin-top: 20px;
                float: right;
            }
        `;
        document.head.appendChild(modalStyle);
    }


    // --- Event Listeners ---

    // Auth forms
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        authMessage.textContent = ''; // Clear message
    });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        authMessage.textContent = ''; // Clear message
    });

    // Dashboard navigation
    if (navDashboard) navDashboard.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadUserClassrooms();
    });
    if (navClassroom) navClassroom.addEventListener('click', () => {
        if (currentClassroom) {
            showSection(classroomSection);
            updateNavActiveState(navClassroom);
        } else {
            showNotification('Please join or create a classroom first.', true);
        }
    });
    if (navSettings) navSettings.addEventListener('click', () => {
        showSection(settingsSection);
        updateNavActiveState(navSettings);
        if (currentUser) {
            settingsUsernameInput.value = currentUser.username;
            settingsEmailInput.value = currentUser.email;
        }
    });
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Dashboard classroom actions
    if (document.getElementById('show-create-classroom')) {
        document.getElementById('show-create-classroom').addEventListener('click', () => {
            showSection(createClassroomSection);
        });
    }
    if (document.getElementById('show-join-classroom')) {
        document.getElementById('show-join-classroom').addEventListener('click', () => {
            showSection(joinClassroomSection);
        });
    }

    if (createClassroomBtn) createClassroomBtn.addEventListener('click', handleCreateClassroom);
    if (joinClassroomBtn) joinClassroomBtn.addEventListener('click', handleJoinClassroom);

    // Classroom sidebar navigation
    if (navChat) navChat.addEventListener('click', () => {
        showClassroomSubSection(chatSection);
        updateNavActiveState(navChat);
    });
    if (navWhiteboard) navWhiteboard.addEventListener('click', () => {
        showClassroomSubSection(whiteboardSection);
        updateNavActiveState(navWhiteboard);
        initializeWhiteboard(); // Ensure whiteboard is initialized when shown
    });
    if (navParticipants) navParticipants.addEventListener('click', () => {
        showClassroomSubSection(participantsSection);
        updateNavActiveState(navParticipants);
        loadParticipants();
    });
    if (navLibrary) navLibrary.addEventListener('click', () => {
        showClassroomSubSection(librarySection);
        updateNavActiveState(navLibrary);
        loadLibraryFiles();
    });
    if (navAssessments) navAssessments.addEventListener('click', () => {
        showClassroomSubSection(assessmentSection);
        updateNavActiveState(navAssessments);
        loadAssessments();
    });
    if (leaveClassroomBtn) leaveClassroomBtn.addEventListener('click', leaveClassroom);

    // Library file upload
    if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.addEventListener('click', handleUploadLibraryFiles);

    // Assessment creation buttons
    if (createAssessmentBtn) {
        createAssessmentBtn.addEventListener('click', () => {
            showClassroomSubSection(assessmentCreationForm);
            assessmentCreationForm.reset();
            questionsContainer.innerHTML = ''; // Clear any existing questions
            addQuestionField(); // Add first question by default
        });
    }
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', () => addQuestionField());
    if (createAssessmentFormBtn) createAssessmentFormBtn.addEventListener('click', handleCreateAssessment);
    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => {
        currentAssessmentToTake = null; // Clear assessment being taken
        loadAssessments(); // Reload and show list
    });
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', handleSubmitAssessment);
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
        loadAssessments(); // Reload and show list
    });

    // Settings
    if (updateProfileForm) updateProfileForm.addEventListener('submit', handleProfileUpdate);
    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadUserClassrooms();
    });


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
            // Check if sidebar is active and click is outside sidebar and hamburger button
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
