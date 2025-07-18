// app.js (Complete Rewrite with Hamburger Menu, Whiteboard Pages, Notifications, and Selective Broadcast)

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Starting app initialization.");

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
    const classCodeDisplay = document.getElementById('class-code');
    const backToDashboardBtn = document.getElementById('back-to-dashboard');

    // Hamburger Menu Elements
    const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
    const classroomSidebar = document.getElementById('classroom-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    // Sidebar Navigation Buttons
    const navWhiteboard = document.getElementById('nav-whiteboard');
    const navChat = document.getElementById('nav-chat');
    const navLibrary = document.getElementById('nav-library');
    const navAssessments = document.getElementById('nav-assessments');

    // Classroom Sub-Sections
    const whiteboardArea = document.getElementById('whiteboard-area');
    const chatSection = document.getElementById('chat-section');
    const librarySection = document.getElementById('library-section');
    const assessmentsSection = document.getElementById('assessments-section');

    // Whiteboard Elements
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const whiteboardRoleMessage = document.getElementById('whiteboard-role-message');
    const whiteboardCtx = whiteboardCanvas ? whiteboardCanvas.getContext('2d') : null; // Initialize context safely
    const whiteboardToolsContainer = document.getElementById('whiteboard-tools-container'); // Toolbar now within sidebar
    const colorPicker = document.getElementById('colorPicker');
    const brushSizeInput = document.getElementById('brushSize');
    const toolButtons = document.querySelectorAll('.tool-button');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const clearButton = document.getElementById('clearButton');
    const saveButton = document.getElementById('saveButton');
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');
    const shareWhiteboardBtn = document.getElementById('share-whiteboard-btn'); // New share button in sidebar

    // Whiteboard Page Navigation
    const prevWhiteboardPageBtn = document.getElementById('prev-whiteboard-page-btn');
    const nextWhiteboardPageBtn = document.getElementById('next-whiteboard-page-btn');
    const whiteboardPageDisplay = document.getElementById('whiteboard-page-display');

    // Video Broadcast Elements
    const videoBroadcastSection = document.getElementById('video-broadcast-section'); // Now inside the sidebar
    const broadcastRoleMessage = document.getElementById('broadcast-role-message');
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastTypeRadios = document.querySelectorAll('input[name="broadcastType"]');


    // Chat Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatButton = document.getElementById('send-chat-button');

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryRoleMessage = document.getElementById('library-role-message');
    const libraryFilesList = document.getElementById('library-files-list');

    // Assessment Elements
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionInput = document.getElementById('assessment-description');
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentList = document.getElementById('assessment-list');
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

    // Settings Elements
    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email');
    const updateProfileForm = document.getElementById('update-profile-form');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');


    // Notifications container (now specifically within whiteboard-area in HTML)
    const notificationsContainer = document.getElementById('notifications-container');


    // --- Global Variables ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null; // Stores {id, name, code}
    let localStream; // For video broadcast
    const peerConnections = {}; // Store RTCPeerConnection objects
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
        ]
    };

    let isDrawing = false;
    let currentTool = 'pen';
    let lastX = 0;
    let lastY = 0;
    let currentBrushSize = brushSizeInput ? parseInt(brushSizeInput.value) : 5;
    let currentColor = colorPicker ? colorPicker.value : '#000000';

    let whiteboardPages = [[]]; // Array of arrays, each sub-array is a page of drawing commands
    let currentPageIndex = 0;
    const undoStack = []; // For local undo/redo of single actions on current page
    const redoStack = [];
    const MAX_HISTORY_STEPS = 50;


    // --- Utility Functions ---

    /**
     * Displays a temporary notification message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - 'info', 'success', or 'error'.
     * @param {number} duration - How long the notification should be visible in ms.
     */
    function showNotification(message, type = 'info', duration = 3000) {
        console.log(`[Notification] Showing: ${message} (${type})`);
        if (!notificationsContainer) {
            console.warn("Notifications container not found. Cannot display notification.");
            return;
        }
        const notificationDiv = document.createElement('div');
        notificationDiv.classList.add('notification-message');
        notificationDiv.textContent = message;

        // Apply type-specific styles
        if (type === 'success') {
            notificationDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.7)';
        } else if (type === 'error') {
            notificationDiv.style.backgroundColor = 'rgba(220, 53, 69, 0.7)';
        } else { // info or default
            notificationDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        }

        notificationsContainer.prepend(notificationDiv); // Add to top

        // Animate in
        setTimeout(() => notificationDiv.classList.add('show'), 10);

        // Animate out and remove
        setTimeout(() => {
            notificationDiv.classList.remove('show');
            notificationDiv.addEventListener('transitionend', () => notificationDiv.remove());
        }, duration);
    }

    /**
     * Helper to display form-specific messages.
     * @param {HTMLElement} element - The paragraph element to display the message in.
     * @param {string} message - The message text.
     * @param {boolean} isError - True for error, false for success.
     */
    function displayMessage(element, message, isError) {
        if (element) {
            element.textContent = message;
            element.className = isError ? 'error' : 'success';
            console.log(`[UI Message] ${element.id}: ${message} (Error: ${isError})`);
        } else {
            console.warn(`Attempted to display message to null element: ${message}`);
        }
    }

    /**
     * Shows a specific main section of the app and hides others.
     * @param {HTMLElement} sectionToShow - The DOM element of the section to show.
     */
    function showSection(sectionToShow) {
        console.log(`[Navigation] Attempting to show section: ${sectionToShow ? sectionToShow.id : 'null'}`);
        const allSections = [authSection, dashboardSection, classroomSection, settingsSection];
        allSections.forEach(section => {
            if (section) {
                section.classList.remove('active');
                section.classList.add('hidden'); // Ensure it's hidden first
                section.style.display = 'none'; // Force hide
            }
        });

        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.classList.add('active');
            sectionToShow.style.display = 'block'; // Or 'flex', 'grid' depending on its internal display
            console.log(`[Navigation] Successfully set ${sectionToShow.id} to active.`);
        } else {
            console.error("[Navigation] showSection called with a null sectionToShow.");
        }
    }

    /**
     * Shows a specific sub-section within the classroom and hides others.
     * @param {HTMLElement} subSectionToShow - The DOM element of the sub-section to show.
     */
    function showClassroomSubSection(subSectionToShow) {
        console.log(`[Classroom Nav] Showing sub-section: ${subSectionToShow ? subSectionToShow.id : 'null'}`);
        const allSubSections = [whiteboardArea, chatSection, librarySection, assessmentsSection];
        allSubSections.forEach(subSection => {
            if (subSection) {
                subSection.classList.remove('active');
                subSection.classList.add('hidden');
            }
        });
        if (subSectionToShow) {
            subSectionToShow.classList.remove('hidden');
            subSectionToShow.classList.add('active');
            console.log(`[Classroom Nav] Successfully set ${subSectionToShow.id} to active.`);
        } else {
            console.error("[Classroom Nav] showClassroomSubSection called with a null subSectionToShow.");
        }
    }

    /**
     * Updates UI elements based on the current user's role (admin/user).
     * Elements with `data-admin-only` are shown only for admins.
     * Elements with `data-user-only` are shown only for regular users.
     */
    function updateUIBasedOnRole() {
        console.log("[UI Update] Updating UI based on role. Current user:", currentUser ? currentUser.role : 'none');
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

        // Hide/show toolbar based on admin role
        if (whiteboardToolsContainer) { // Changed from 'toolbar' to 'whiteboardToolsContainer'
            whiteboardToolsContainer.classList.toggle('hidden', !isAdmin);
        }
        // Hide/show video broadcast controls based on admin role
        if (videoBroadcastSection) {
            videoBroadcastSection.classList.toggle('hidden', !isAdmin);
        }

        // Disable/enable broadcast buttons for admin
        if (startBroadcastBtn) startBroadcastBtn.disabled = !isAdmin;
        if (endBroadcastBtn) endBroadcastBtn.disabled = !isAdmin || !localStream; // Only enabled if admin AND stream exists
    }

    /**
     * Returns the display name of a user, appending "(Admin)" if the role is admin.
     * @param {string} username - The user's username.
     * @param {string} role - The user's role ('user' or 'admin').
     * @returns {string} The formatted display name.
     */
    function getDisplayName(username, role) {
        return role === 'admin' ? `${username} (Admin)` : username : username;
    }


    // --- Authentication Functions ---

    /**
     * Checks the current login status from localStorage and updates the UI.
     * Handles direct classroom link access.
     */
    async function checkLoginStatus() {
        console.log("checkLoginStatus called. Checking localStorage for user...");
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                console.log("Stored user found:", currentUser.username, "Role:", currentUser.role);

                // Verify session with backend
                const response = await fetch('/api/@me');
                if (response.ok) {
                    const data = await response.json();
                    // Update currentUser with fresh data from server (e.g., if role changed)
                    currentUser = { ...currentUser, ...data };
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    console.log("Session verified with backend. Current user updated:", currentUser);

                    if (currentUsernameDisplay) currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                    updateUIBasedOnRole();
                    showSection(dashboardSection); // This is the key line for navigation
                    loadAvailableClassrooms();
                    initializeSocketIO(); // Initialize socket after successful login

                    // Handle direct classroom link access (e.g., /classroom/<id>)
                    const pathParts = window.location.pathname.split('/');
                    if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                        const idFromUrl = pathParts[2];
                        // Fetch all classrooms to find the one by ID
                        const classroomsResponse = await fetch(`/api/classrooms`);
                        if (classroomsResponse.ok) {
                            const classrooms = await classroomsResponse.json();
                            const matched = classrooms.find(cls => cls.id === idFromUrl);
                            if (matched) {
                                enterClassroom(matched.id, matched.name, matched.code);
                            } else {
                                localStorage.removeItem('currentClassroom');
                                currentClassroom = null;
                                showNotification("Classroom not found or not joined yet.", 'error');
                                showSection(dashboardSection);
                                loadAvailableClassrooms();
                            }
                        } else {
                            throw new Error("Failed to fetch classrooms for URL check.");
                        }
                    }
                } else {
                    // Session expired or invalid, force re-login
                    console.log("Session invalid or expired (backend response not OK). Forcing re-login.");
                    localStorage.removeItem('currentUser');
                    currentUser = null;
                    showSection(authSection);
                    showNotification("Your session has expired. Please log in again.", 'error');
                }
            } catch (err) {
                console.error("Error during session verification:", err);
                localStorage.removeItem('currentUser');
                currentUser = null;
                showSection(authSection);
                showNotification("Error verifying session. Please log in again.", 'error');
            }
        } else {
            console.log("No stored user found in localStorage. Showing auth section.");
            showSection(authSection);
            document.querySelectorAll('[data-admin-only], [data-user-only]').forEach(el => {
                el.classList.add('hidden');
            });
        }
    }

    /**
     * Handles user login or registration.
     * @param {Event} event - The form submission event.
     * @param {string} endpoint - The API endpoint ('/api/login' or '/api/register').
     */
    async function handleAuth(event, endpoint) {
        event.preventDefault();
        console.log(`handleAuth called for endpoint: ${endpoint}`);
        const form = event.target;
        const email = form.querySelector('input[type="email"])').value;
        const password = form.querySelector('input[type="password"])').value;
        const usernameInput = form.querySelector('#register-username');
        const roleSelect = form.querySelector('#register-role');

        const payload = { email, password };
        if (usernameInput) payload.username = usernameInput.value;
        if (roleSelect) payload.role = roleSelect.value;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (response.ok) {
                if (endpoint === '/api/login') {
                    currentUser = result.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    displayMessage(authMessage, result.message, false);
                    showNotification(result.message, 'success');
                    console.log("Login successful. User data saved to localStorage. Calling checkLoginStatus in 1 second...");
                    setTimeout(() => {
                        authMessage.textContent = ''; // Clear message after delay
                        checkLoginStatus(); // Re-check status to navigate to dashboard
                    }, 1000); // Small delay to show notification and allow DOM to settle
                } else { // Registration
                    displayMessage(authMessage, result.message + " Please log in.", false);
                    showNotification(result.message, 'success');
                    form.reset();
                    if (loginContainer) loginContainer.classList.remove('hidden');
                    if (registerContainer) registerContainer.classList.add('hidden');
                    console.log("Registration successful. Redirecting to login form.");
                }
            } else {
                displayMessage(authMessage, result.error, true);
                showNotification(result.error, 'error');
                console.error("Authentication failed:", result.error);
            }
        } catch (error) {
            console.error('Error during authentication fetch:', error);
            displayMessage(authMessage, 'An error occurred during authentication.', true);
            showNotification('An error occurred during authentication.', 'error');
        }
    }

    // --- Dashboard Functions ---

    /**
     * Loads all available classrooms and displays them, categorized by user's participation.
     */
    async function loadAvailableClassrooms() {
        console.log("loadAvailableClassrooms called.");
        if (!currentUser || !currentUser.id) {
            if (classroomList) classroomList.innerHTML = '<li>Please log in to see available classrooms.</li>';
            console.log("loadAvailableClassrooms: No current user, skipping fetch.");
            return;
        }
        console.log("loadAvailableClassrooms: Fetching classrooms for user:", currentUser.username);
        try {
            const response = await fetch('/api/classrooms');
            const classrooms = await response.json();
            if (classroomList) classroomList.innerHTML = '';

            if (classrooms.length === 0) {
                if (classroomList) classroomList.innerHTML = '<li>No classrooms found. Create one or wait for an admin to create one!</li>';
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
                    if (classroomList) classroomList.appendChild(h3);
                    userJoinedClassrooms.forEach(classroom => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span>${classroom.name} (ID: ${classroom.id})</span>
                            <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" data-classroom-code="${classroom.code}" class="go-to-classroom-btn">Enter Classroom</button>
                        `;
                        if (classroomList) classroomList.appendChild(li);
                    });
                }

                if (otherClassrooms.length > 0) {
                    const h3 = document.createElement('h3');
                    h3.textContent = 'Available Classrooms to Join';
                    if (classroomList) classroomList.appendChild(h3);
                    otherClassrooms.forEach(classroom => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span>${classroom.name} (ID: ${classroom.id})</span>
                            <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" data-classroom-code="${classroom.code}" class="join-classroom-btn">Join Classroom</button>
                        `;
                        if (classroomList) classroomList.appendChild(li);
                    });
                }

                if (userJoinedClassrooms.length === 0 && otherClassrooms.length === 0) {
                    if (classroomList) classroomList.innerHTML = '<li>No classrooms found. Create one or wait for an admin to create one!</li>';
                }

                document.querySelectorAll('.go-to-classroom-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.dataset.classroomId;
                        const name = e.target.dataset.classroomName;
                        const code = e.target.dataset.classroomCode;
                        enterClassroom(id, name, code);
                    });
                });

                document.querySelectorAll('.join-classroom-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const id = e.target.dataset.classroomId;
                        const name = e.target.dataset.classroomName;
                        const code = e.target.dataset.classroomCode;
                        try {
                            const response = await fetch('/api/join-classroom', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ classroomId: id })
                            });
                            const result = await response.json();
                            if (response.ok) {
                                showNotification(result.message, 'success');
                                loadAvailableClassrooms(); // Reload list to update status
                                enterClassroom(id, name, code); // Immediately enter after joining
                            } else {
                                showNotification(result.error, 'error');
                            }
                        } catch (error) {
                            console.error('Error joining classroom:', error);
                            showNotification('An error occurred during joining.', 'error');
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
            if (classroomList) classroomList.innerHTML = '<li>Failed to load classrooms.</li>';
            showNotification('Failed to load classrooms.', 'error');
        }
    }

    // --- Classroom Functions ---

    /**
     * Enters a specific classroom, updates UI, initializes Socket.IO, and loads content.
     * @param {string} id - The ID of the classroom.
     * @param {string} name - The name of the classroom.
     * @param {string} code - The code of the classroom.
     */
    function enterClassroom(id, name, code) {
        console.log("Entering classroom:", name, id);
        currentClassroom = { id: id, name: name, code: code };
        localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom));
        if (classroomIdDisplay) classroomIdDisplay.textContent = id;
        if (classNameValue) classNameValue.textContent = name;
        if (classCodeDisplay) classCodeDisplay.textContent = code;

        showSection(classroomSection);
        showClassroomSubSection(whiteboardArea); // Default to whiteboard view
        if (navWhiteboard) {
            navWhiteboard.classList.add('active-nav'); // Highlight whiteboard nav
            navChat.classList.remove('active-nav');
            navLibrary.classList.remove('active-nav');
            navAssessments.classList.remove('active-nav');
        }
        updateUIBasedOnRole();

        initializeSocketIO(); // Ensure socket is initialized and joined to classroom
        setupWhiteboardControls(); // Setup controls for whiteboard
        setupChatControls(); // Ensure chat controls are also set up

        // Reset broadcast buttons state based on role
        if (currentUser && currentUser.role === 'admin') {
            if (startBroadcastBtn) startBroadcastBtn.disabled = false;
            if (endBroadcastBtn) endBroadcastBtn.disabled = true;
        } else {
            if (startBroadcastBtn) startBroadcastBtn.disabled = true;
            if (endBroadcastBtn) endBroadcastBtn.disabled = true;
        }

        if (shareLinkDisplay) shareLinkDisplay.classList.add('hidden');
        if (shareLinkInput) shareLinkInput.value = '';

        loadAssessments();
        loadLibraryFiles();
        fetchWhiteboardHistory(); // Load whiteboard history for the current page
        loadChatHistory(); // Load chat history for the classroom
    }

    /**
     * Cleans up classroom-related resources when leaving a classroom.
     */
    function cleanupClassroomResources() {
        console.log("Cleaning up classroom resources.");
        if (socket && socket.connected) {
            if (currentClassroom && currentClassroom.id) {
                socket.emit('leave', { 'classroomId': currentClassroom.id });
            }
            socket.disconnect();
            socket = null;
        } else if (socket) { // If socket exists but not connected, still try to null it
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
        if (socket && socket.connected) {
            console.log("[Socket.IO] Already connected, skipping re-initialization.");
            return;
        }
        console.log("[Socket.IO] Initializing Socket.IO connection.");
        socket = io();

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected. SID:', socket.id);
            if (currentClassroom && currentClassroom.id && currentUser) {
                socket.emit('join', { 'classroomId': currentClassroom.id, 'role': currentUser.role, 'username': currentUser.username });
                showNotification("Connected to classroom: " + currentClassroom.name, 'success');
            } else {
                console.warn('[Socket.IO] Cannot join classroom: currentClassroom or currentUser is undefined after connect. Not emitting join.');
                showNotification("Error: Could not join classroom on connect.", 'error');
            }
        });

        socket.on('disconnect', () => {
            console.log('[Socket.IO] Disconnected');
            showNotification("Disconnected from classroom.", 'error');
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
            showNotification(`Admin Action: ${data.message}`, 'info');
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
            if (chatMessages) {
                chatMessages.appendChild(messageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });

        socket.on('chat_history', (history) => {
            if (chatMessages) chatMessages.innerHTML = '';
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                const senderDisplayName = getDisplayName(msg.username, msg.role);
                const date = new Date(msg.timestamp);
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                messageElement.textContent = `${senderDisplayName} (${formattedTime}): ${msg.message}`;
                if (chatMessages) chatMessages.appendChild(messageElement);
            });
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        socket.on('user_joined', (data) => {
            console.log(`[Socket.IO] User joined: ${data.username} (${data.sid})`);
            const statusMessage = document.createElement('div');
            const joinedDisplayName = getDisplayName(data.username, data.role);
            statusMessage.textContent = `${joinedDisplayName} has joined the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            if (chatMessages) {
                chatMessages.appendChild(statusMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            showNotification(`${joinedDisplayName} joined.`, 'info');

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
            if (chatMessages) {
                chatMessages.appendChild(statusMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            showNotification(`${data.username} left.`, 'info');

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

            if (data.action === 'draw') {
                const { pageIndex } = data.data;
                // Ensure page exists locally
                if (!whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                whiteboardPages[pageIndex].push(data); // Push the entire data object for re-rendering

                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.save();
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
                showNotification(`Whiteboard page changed to ${newPageIndex + 1}`, 'info');
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
                showNotification('WebRTC Error: Failed to handle offer.', 'error');
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
                    showNotification('WebRTC Error: Failed to handle answer.', 'error');
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
                        showNotification('WebRTC Error: Failed to add ICE candidate.', 'error');
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
            showNotification(`Peer ${data.peer_id.substring(0, 5)}... disconnected.`, 'info');
        });
    }

    // --- WebRTC Functions ---

    /**
     * Starts the video/audio broadcast based on admin's selection.
     */
    async function startBroadcast() {
        if (!currentClassroom || !currentClassroom.id || !socket || !currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can start a broadcast in a classroom.", 'error');
            return;
        }

        if (localStream && localStream.active) {
            showNotification("Broadcast already active. Stopping it first.", 'info');
            endBroadcast();
            setTimeout(() => startBroadcast(), 500); // Restart after a short delay
            return;
        }

        const selectedType = document.querySelector('input[name="broadcastType"]:checked');
        const constraints = {
            video: selectedType && selectedType.value === 'video_audio',
            audio: true // Audio is always true for both options
        };

        try {
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (localVideo) {
                localVideo.srcObject = localStream;
                localVideo.classList.remove('hidden'); // Show local video preview
            }
            if (startBroadcastBtn) startBroadcastBtn.disabled = true;
            if (endBroadcastBtn) endBroadcastBtn.disabled = false;
            showNotification(`Broadcast started: ${selectedType && selectedType.value === 'video_audio' ? 'Video & Audio' : 'Audio Only'}`, 'success');

            // Notify others in the room that admin has started broadcasting
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Admin ${currentUser.username} started a ${selectedType && selectedType.value === 'video_audio' ? 'video and audio' : 'audio only'} broadcast.`
            });

        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);
            showNotification(`Could not start broadcast. Error: ${err.message}. Please ensure camera and microphone access are granted.`, 'error');
            localStream = null;
            if (localVideo) localVideo.classList.add('hidden'); // Hide local video
            if (startBroadcastBtn) startBroadcastBtn.disabled = false;
            if (endBroadcastBtn) endBroadcastBtn.disabled = true;
        }
    }

    /**
     * Ends the active video/audio broadcast.
     */
    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            if (localVideo) localVideo.srcObject = null;
            if (localVideo) localVideo.classList.add('hidden'); // Hide local video
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

        showNotification('Broadcast ended.', 'info');
        if (startBroadcastBtn) startBroadcastBtn.disabled = false;
        if (endBroadcastBtn) endBroadcastBtn.disabled = true;

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
                if (remoteVideoContainer) remoteVideoContainer.appendChild(remoteVideo);
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
                showNotification('WebRTC Error: Failed to create offer.', 'error');
            }
        }
    }

    // --- Whiteboard Functions ---

    /**
     * Sets up the whiteboard canvas and its controls.
     */
    function setupWhiteboardControls() {
        console.log("setupWhiteboardControls called.");
        if (!whiteboardCanvas || !whiteboardCtx) {
             console.warn("[Whiteboard] Canvas element or context not found. Whiteboard controls not set up.");
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

        // Event Listeners for Drawing (only if admin)
        if (currentUser && currentUser.role === 'admin') {
            whiteboardCanvas.addEventListener('mousedown', handleMouseDown);
            whiteboardCanvas.addEventListener('mousemove', handleMouseMove);
            whiteboardCanvas.addEventListener('mouseup', handleMouseUp);
            whiteboardCanvas.addEventListener('mouseout', handleMouseUp);

            // Touch/Stylus Optimization: Use passive: false for touchmove to allow preventDefault
            whiteboardCanvas.addEventListener('touchstart', handleMouseDown, { passive: false });
            whiteboardCanvas.addEventListener('touchmove', handleMouseMove, { passive: false });
            whiteboardCanvas.addEventListener('touchend', handleMouseUp);
            whiteboardCanvas.addEventListener('touchcancel', handleMouseUp);
        } else {
            // Remove listeners if not admin
            whiteboardCanvas.removeEventListener('mousedown', handleMouseDown);
            whiteboardCanvas.removeEventListener('mousemove', handleMouseMove);
            whiteboardCanvas.removeEventListener('mouseup', handleMouseUp);
            whiteboardCanvas.removeEventListener('mouseout', handleMouseUp);
            whiteboardCanvas.removeEventListener('touchstart', handleMouseDown);
            whiteboardCanvas.removeEventListener('touchmove', handleMouseMove);
            whiteboardCanvas.removeEventListener('touchend', handleMouseUp);
            whiteboardCanvas.removeEventListener('touchcancel', handleMouseUp);
        }

        // Tool selection (only if elements exist)
        if (toolButtons) {
            toolButtons.forEach(button => {
                button.addEventListener('click', () => selectTool(button.dataset.tool));
            });
        }

        // Color and Size (only if elements exist)
        if (colorPicker) colorPicker.addEventListener('input', updateColor);
        if (brushSizeInput) brushSizeInput.addEventListener('input', updateBrushSize);

        // Actions (only if elements exist)
        if (undoButton) undoButton.addEventListener('click', undo);
        if (redoButton) redoButton.addEventListener('click', redo);
        if (clearButton) clearButton.addEventListener('click', () => clearCanvas(true));
        if (saveButton) saveButton.addEventListener('click', saveImage);

        // Page Navigation (only if elements exist)
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
        console.log("resizeCanvas called.");
        if (!whiteboardCanvas || !whiteboardCtx) return;

        const container = whiteboardCanvas.parentElement;
        if (!container) {
            console.warn("Canvas parent container not found for resizing.");
            return;
        }
        
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
        if (!currentUser || currentUser.role !== 'admin' || !whiteboardCtx) return;
        isDrawing = true;
        const coords = getCoords(e);
        const startX = coords.x;
        const startY = coords.y;
        lastX = coords.x;
        lastY = coords.y; // Initialize lastY as well

        // Save snapshot for temporary drawing of shapes
        if (currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'text') {
            snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }

        if (currentTool === 'pen' || currentTool === 'eraser') {
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
                if (socket && currentClassroom && currentClassroom.id) {
                    socket.emit('whiteboard_data', {
                        action: 'draw',
                        classroomId: currentClassroom.id,
                        data: textData
                    });
                }
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
        if (!isDrawing || !currentUser || currentUser.role !== 'admin' || currentTool === 'text' || !whiteboardCtx) return;
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

            whiteboardCtx.lineTo(currentX, currentY);
            whiteboardCtx.stroke();
            
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
            drawWhiteboardItem({ tool: currentTool, startX: lastX, startY: lastY, endX: currentX, endY: currentY, color: currentColor, width: currentBrushSize });
        }
        whiteboardCtx.restore();
    }

    /**
     * Handles the end of a drawing action (mouseup or touchend).
     */
    function handleMouseUp(e) {
        if (!isDrawing || !currentUser || currentUser.role !== 'admin' || !whiteboardCtx) return;
        isDrawing = false;

        const finalCoords = getCoords(e);
        const currentX = finalCoords.x;
        const currentY = finalCoords.y;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            whiteboardCtx.closePath(); // Close the current path for pen/eraser
            // Emit the complete stroke data
            const strokeData = {
                startX: lastX, // Use lastX, lastY as the start of the last segment
                startY: lastY,
                endX: currentX,
                endY: currentY,
                color: currentColor,
                width: currentBrushSize,
                tool: currentTool,
                pageIndex: currentPageIndex
            };
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroom.id,
                    data: strokeData
                });
            }
            // Add to local page data
            whiteboardPages[currentPageIndex].push({ action: 'draw', data: strokeData });

        } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            // For shapes, draw the final shape and emit data
            // Redraw the entire page to ensure the final shape is persisted correctly
            renderCurrentWhiteboardPage(); // Clear and redraw existing commands
            
            whiteboardCtx.save();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            const shapeData = {
                startX: lastX, startY: lastY, endX: currentX, endY: currentY,
                color: currentColor, width: currentBrushSize, tool: currentTool
            };
            drawWhiteboardItem(shapeData); // Draw the final shape
            whiteboardCtx.restore();

            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroom.id,
                    data: { ...shapeData, pageIndex: currentPageIndex }
                });
            }
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
     * @param {string} commandData.color - Stroke/fill color.
     * @param {number} commandData.width - Stroke width.
     */
    function drawWhiteboardItem(commandData) {
        if (!whiteboardCtx) return;
        const { tool, startX, startY, endX, endY, text, color, width } = commandData;

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
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(startX, startY);
                whiteboardCtx.lineTo(endX, endY);
                whiteboardCtx.stroke();
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
        if (!whiteboardCanvas) return { x: 0, y: 0 };
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
        if (toolButtons) {
            toolButtons.forEach(button => {
                if (button.dataset.tool === tool) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
        // Reset globalCompositeOperation when changing from eraser
        if (whiteboardCtx && whiteboardCtx.globalCompositeOperation === 'destination-out' && tool !== 'eraser') {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }
    }

    /**
     * Updates the drawing color.
     */
    function updateColor() {
        if (colorPicker && whiteboardCtx) {
            currentColor = colorPicker.value;
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.fillStyle = currentColor;
        }
    }

    /**
     * Updates the brush/stroke size.
     */
    function updateBrushSize() {
        if (brushSizeInput && whiteboardCtx) {
            currentBrushSize = parseInt(brushSizeInput.value);
            whiteboardCtx.lineWidth = currentBrushSize;
        }
    }

    /**
     * Clears the current whiteboard page and emits the clear event.
     * @param {boolean} [emitEvent=true] - Whether to emit the clear event to the server.
     */
    function clearCanvas(emitEvent = true) {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can clear the whiteboard.", 'error');
            return;
        }
        if (!whiteboardCtx || !whiteboardCanvas) return;

        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        
        whiteboardPages[currentPageIndex] = []; // Clear local data for current page
        saveState(); // Save the cleared state

        if (emitEvent && socket && currentClassroom && currentClassroom.id) {
            socket.emit('whiteboard_data', { action: 'clear', classroomId: currentClassroom.id, data: { pageIndex: currentPageIndex } });
        }
        showNotification(`Whiteboard page ${currentPageIndex + 1} cleared.`, 'info');
    }

    /**
     * Saves the current canvas content as a PNG image.
     */
    function saveImage() {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can save the whiteboard image.", 'error');
            return;
        }
        if (!whiteboardCanvas) return;
        const dataURL = whiteboardCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `whiteboard-page-${currentPageIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification(`Whiteboard page ${currentPageIndex + 1} saved as image.`, 'success');
    }

    /**
     * Saves the current canvas state to the undo stack.
     * Clears the redo stack when a new state is saved.
     */
    function saveState() {
        if (!whiteboardCanvas) return;
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
        if (!whiteboardCtx || !whiteboardCanvas) return;
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
            if (whiteboardCtx && whiteboardCanvas) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardCtx.fillStyle = '#000000';
                whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
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
            showNotification("Whiteboard history loaded.", 'info');
        } catch (error) {
            console.error("Error fetching whiteboard history:", error);
            whiteboardPages = [[]];
            currentPageIndex = 0;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            showNotification("Failed to load whiteboard history.", 'error');
        }
    }

    /**
     * Renders the drawing commands for the current page onto the canvas.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx || !whiteboardCanvas) return;
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
            nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1 && (!currentUser || currentUser.role !== 'admin');
        }
    }

    /**
     * Navigates to the next whiteboard page. Creates a new page if at the end (admin only).
     */
    function goToNextWhiteboardPage() {
        if (!currentUser) {
            showNotification("Please log in to navigate whiteboard pages.", 'error');
            return;
        }

        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else if (currentUser.role === 'admin') {
            whiteboardPages.push([]); // Add a new empty page
            currentPageIndex = whiteboardPages.length - 1;
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('whiteboard_page_change', {
                    classroomId: currentClassroom.id,
                    newPageIndex: currentPageIndex,
                    action: 'add_page'
                });
            }
        } else {
            showNotification("No next page available.", 'info');
            return;
        }
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        if (socket && currentClassroom && currentClassroom.id) {
            socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
        }
        showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`, 'info');
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    function goToPreviousWhiteboardPage() {
        if (!currentUser) {
            showNotification("Please log in to navigate whiteboard pages.", 'error');
            return;
        }

        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
            }
            showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`, 'info');
        } else {
            showNotification("Already on the first page.", 'info');
        }
    }


    // --- Chat Functions ---

    /**
     * Sets up chat message sending controls.
     */
    function setupChatControls() {
        if (sendChatButton) {
            sendChatButton.addEventListener('click', () => {
                const message = chatInput.value.trim();
                if (message && socket && currentClassroom && currentClassroom.id && currentUser) {
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
                    sendChatButton.click();
                }
            });
        }
    }

    async function loadChatHistory() {
        if (!currentClassroom || !currentClassroom.id) {
            console.warn("Cannot load chat history: No current classroom.");
            return;
        }
        try {
            const response = await fetch(`/api/chat-history/${currentClassroom.id}`);
            if (response.ok) {
                const chatHistory = await response.json();
                if (chatMessages) chatMessages.innerHTML = ''; // Clear existing messages
                chatHistory.forEach(msg => {
                    const messageElement = document.createElement('div');
                    const senderDisplayName = getDisplayName(msg.username, msg.role);
                    const date = new Date(msg.timestamp);
                    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    messageElement.textContent = `${senderDisplayName} (${formattedTime}): ${msg.message}`;
                    if (chatMessages) chatMessages.appendChild(messageElement);
                });
                if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
            } else {
                showNotification('Failed to load chat history.', 'error');
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
            showNotification('Failed to load chat history.', 'error');
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
                            showNotification("Click again to confirm delete.", 'info', 3000);
                            e.target.dataset.confirmDelete = 'true';
                            setTimeout(() => { delete e.target.dataset.confirmDelete; }, 3000);
                            
                            if (e.detail === 2 && e.target.dataset.confirmDelete === 'true') {
                                try {
                                    const response = await fetch(`/api/library-files/${fileId}`, {
                                        method: 'DELETE'
                                    });
                                    const result = await response.json();
                                    if (response.ok) {
                                        showNotification(result.message, 'success');
                                        loadLibraryFiles();
                                    } else {
                                        showNotification(`Error deleting file: ${result.error}`, 'error');
                                    }
                                } catch (error) {
                                    console.error('Error deleting file:', error);
                                    showNotification('Error deleting file.', 'error');
                                }
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            if (libraryFilesList) libraryFilesList.innerHTML = '<p>Failed to load library files.</p>';
            showNotification('Failed to load library files.', 'error');
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
            <button type="button" class="remove-question-btn">Remove</button>
        `;
        if (questionsContainer) questionsContainer.appendChild(questionItem);

        const questionTypeSelect = questionItem.querySelector('.question-type');
        const mcqOptionsDiv = questionItem.querySelector('.mcq-options');
        const removeQuestionBtn = questionItem.querySelector('.remove-question-btn');

        if (questionTypeSelect) {
            questionTypeSelect.addEventListener('change', (e) => {
                if (e.target.value === 'mcq') {
                    mcqOptionsDiv.classList.remove('hidden');
                } else {
                    mcqOptionsDiv.classList.add('hidden');
                }
            });
        }
        if (removeQuestionBtn) {
            removeQuestionBtn.addEventListener('click', () => {
                questionItem.remove();
                // Re-index questions after removal
                questionsContainer.querySelectorAll('.question-item label').forEach((label, idx) => {
                    label.textContent = `Question ${idx + 1}:`;
                });
                questionCounter = questionsContainer.querySelectorAll('.question-item').length;
            });
        }
    }

    /**
     * Submits a new assessment created by an admin.
     */
    async function submitAssessment() {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can create assessments.", 'error');
            return;
        }
        if (!currentClassroom || !currentClassroom.id) {
            showNotification("Please select a classroom first.", 'error');
            return;
        }

        const title = assessmentTitleInput ? assessmentTitleInput.value.trim() : '';
        const description = assessmentDescriptionInput ? assessmentDescriptionInput.value.trim() : '';
        const questions = [];

        if (!title) {
            displayMessage(assessmentCreationMessage, 'Please enter an assessment title.', true);
            return;
        }

        const questionItems = questionsContainer ? questionsContainer.querySelectorAll('.question-item') : [];
        let isValid = true;
        questionItems.forEach((item, index) => {
            const questionText = item.querySelector('.question-text') ? item.querySelector('.question-text').value.trim() : '';
            const questionType = item.querySelector('.question-type') ? item.querySelector('.question-type').value : '';
            let options = [];
            let correctAnswer = '';

            if (!questionText) {
                isValid = false;
                displayMessage(assessmentCreationMessage, `Question ${index + 1} text cannot be empty.`, true);
                return;
            }

            if (questionType === 'mcq') {
                item.querySelectorAll('.mcq-option').forEach(input => {
                    if (input.value.trim() !== '') {
                        options.push(input.value.trim());
                    }
                });
                correctAnswer = item.querySelector('.mcq-correct-answer') ? item.querySelector('.mcq-correct-answer').value.trim() : '';

                if (options.length === 0 || !correctAnswer) {
                    isValid = false;
                    displayMessage(assessmentCreationMessage, `MCQ Question ${index + 1} must have options and a correct answer.`, true);
                    return;
                }
            }

            questions.push({
                id: `q${index + 1}-${Date.now()}`, // Simple unique ID for now
                question_text: questionText,
                question_type: questionType,
                options: options.length > 0 ? options : undefined, // Only include if options exist
                correct_answer: correctAnswer || undefined // Only include if correct answer exists
            });
        });

        if (!isValid) return; // Stop if any validation failed

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
                if (assessmentCreationForm) assessmentCreationForm.reset();
                if (questionsContainer) questionsContainer.innerHTML = ''; // Clear questions
                questionCounter = 0; // Reset counter
                addQuestionField(); // Add one empty question field back
                loadAssessments(); // Reload the list of assessments
                showNotification("Assessment created successfully!", 'success');
            } else {
                displayMessage(assessmentCreationMessage, result.error, true);
                showNotification(`Error creating assessment: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            displayMessage(assessmentCreationMessage, 'An error occurred during submission.', true);
            showNotification('An error occurred during assessment creation.', 'error');
        }
    }

    /**
     * Loads and displays available assessments for the current classroom.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            if (assessmentList) assessmentList.innerHTML = '<p>Select a classroom to view assessments.</p>';
            return;
        }

        if (takeAssessmentContainer) takeAssessmentContainer.classList.add('hidden');
        if (viewSubmissionsContainer) viewSubmissionsContainer.classList.add('hidden');
        if (assessmentListContainer) assessmentListContainer.classList.remove('hidden');

        if (currentUser && currentUser.role === 'admin') {
            if (assessmentCreationForm) {
                assessmentCreationForm.classList.remove('hidden');
                assessmentCreationForm.classList.add('admin-feature-highlight');
                if (questionsContainer && questionsContainer.children.length === 0) {
                    addQuestionField();
                }
            }
        } else {
            if (assessmentCreationForm) {
                assessmentCreationForm.classList.add('hidden');
                assessmentCreationForm.classList.remove('admin-feature-highlight');
            }
        }

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            const assessments = await response.json();
            if (assessmentList) assessmentList.innerHTML = '';

            if (assessments.length === 0) {
                if (assessmentList) assessmentList.innerHTML = '<p>No assessments available in this classroom.</p>';
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
                            ${currentUser && currentUser.role === 'admin' ?
                                `<button class="view-submissions-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>
                                <button class="delete-assessment-btn" data-assessment-id="${assessment.id}">Delete</button>` :
                                `<button class="take-assessment-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}" data-assessment-description="${assessment.description}">Take Assessment</button>`
                            }
                        </div>
                    `;
                    if (assessmentList) assessmentList.appendChild(assessmentItem);
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
                        showNotification("Click again to confirm delete.", 'info', 3000);
                        e.target.dataset.confirmDelete = 'true';
                        setTimeout(() => {
                            delete e.target.dataset.confirmDelete;
                        }, 3000);

                        if (e.detail === 2 && e.target.dataset.confirmDelete === 'true') {
                            try {
                                const response = await fetch(`/api/assessments/${assessmentId}`, { method: 'DELETE' });
                                const result = await response.json();
                                if (response.ok) {
                                    showNotification(result.message, 'success');
                                    loadAssessments();
                                } else {
                                    showNotification(`Error deleting assessment: ${result.error}`, 'error');
                                }
                            } catch (error) {
                                console.error('Error deleting assessment:', error);
                                showNotification('An error occurred during deletion.', 'error');
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            if (assessmentList) assessmentList.innerHTML = '<p>Failed to load assessments.</p>';
            showNotification('Failed to load assessments.', 'error');
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

        if (assessmentListContainer) assessmentListContainer.classList.add('hidden');
        if (assessmentCreationForm) assessmentCreationForm.classList.add('hidden');
        if (takeAssessmentContainer) {
            takeAssessmentContainer.classList.remove('hidden');
            takeAssessmentContainer.classList.add('user-view-subtle');
        }
        if (viewSubmissionsContainer) viewSubmissionsContainer.classList.add('hidden');

        if (takeAssessmentTitle) takeAssessmentTitle.textContent = title;
        if (takeAssessmentDescription) takeAssessmentDescription.textContent = description;
        if (takeAssessmentForm) takeAssessmentForm.innerHTML = '';
        if (assessmentSubmissionMessage) assessmentSubmissionMessage.textContent = '';

        try {
            const response = await fetch(`/api/assessments/${assessmentId}`); // Fetch full assessment details including questions
            const assessment = await response.json();
            currentAssessmentToTake = assessment; // Update with full object

            if (!assessment.questions || assessment.questions.length === 0) {
                if (takeAssessmentForm) takeAssessmentForm.innerHTML = '<p>No questions found for this assessment.</p>';
                if (submitAnswersBtn) submitAnswersBtn.disabled = true;
                return;
            }
            if (submitAnswersBtn) submitAnswersBtn.disabled = false;

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
                if (takeAssessmentForm) takeAssessmentForm.appendChild(questionDiv);
            });
        } catch (error) {
            console.error('Error loading assessment questions:', error);
            if (takeAssessmentForm) takeAssessmentForm.innerHTML = '<p>Failed to load questions.</p>';
            if (submitAnswersBtn) submitAnswersBtn.disabled = true;
            showNotification('Failed to load assessment questions.', 'error');
        }
    }

    /**
     * Submits the user's answers for an assessment.
     */
    async function submitAnswers() {
        if (!currentAssessmentToTake || !currentClassroom || !currentClassroom.id || !currentUser) {
            showNotification('No assessment selected for submission or user not logged in.', 'error');
            return;
        }

        const answers = [];
        const questionDivs = takeAssessmentForm ? takeAssessmentForm.querySelectorAll('.question-display') : [];

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
                    answers: answers,
                    userId: currentUser.id,
                    username: currentUser.username,
                    student_role: currentUser.role // Store student's role at time of submission
                })
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(assessmentSubmissionMessage, `Assessment submitted! Your score: ${result.score}/${result.total_questions}`, false);
                if (submitAnswersBtn) submitAnswersBtn.disabled = true;
                showNotification(`Assessment submitted! Score: ${result.score}/${result.total_questions}`, 'success');
                setTimeout(() => {
                    loadAssessments();
                }, 2000);
            } else {
                displayMessage(assessmentSubmissionMessage, result.error, true);
                showNotification(`Error submitting assessment: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            displayMessage(assessmentSubmissionMessage, 'An error occurred during submission.', true);
            showNotification('An error occurred during assessment submission.', 'error');
        }
    }

    /**
     * Views submissions for a specific assessment (admin only).
     * @param {string} assessmentId - The ID of the assessment.
     * @param {string} title - The title of the assessment.
     */
    async function viewSubmissions(assessmentId, title) {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can view submissions.", 'error');
            return;
        }
        if (submissionsAssessmentTitle) submissionsAssessmentTitle.textContent = `Submissions for: ${title}`;
        if (submissionsList) submissionsList.innerHTML = 'Loading submissions...';
        if (assessmentListContainer) assessmentListContainer.classList.add('hidden');
        if (viewSubmissionsContainer) {
            viewSubmissionsContainer.classList.remove('hidden');
            viewSubmissionsContainer.classList.add('admin-feature-highlight');
        }

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            const submissions = await response.json();

            if (submissionsList) submissionsList.innerHTML = '';
            if (submissions.length === 0) {
                if (submissionsList) submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
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
                if (submissionsList) submissionsList.appendChild(submissionItem);
            });

        } catch (error) {
            console.error('Error loading submissions:', error);
            if (submissionsList) submissionsList.innerHTML = '<p>Failed to load submissions.</p>';
            showNotification('Failed to load submissions.', 'error');
        }
    }


    // --- Event Listeners ---

    // Auth Section
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); console.log("Show Register Link clicked."); if (loginContainer) loginContainer.classList.add('hidden'); if (registerContainer) registerContainer.classList.remove('hidden'); if (authMessage) authMessage.textContent = ''; });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); console.log("Show Login Link clicked."); if (registerContainer) registerContainer.classList.add('hidden'); if (loginContainer) loginContainer.classList.remove('hidden'); if (authMessage) authMessage.textContent = ''; });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleAuth(e, '/api/login'));
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => handleAuth(e, '/api/register'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log("Logout button clicked.");
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentClassroom');
                    currentUser = null;
                    currentClassroom = null;
                    cleanupClassroomResources(); // Clean up all classroom-related state
                    showSection(authSection);
                    showNotification("Logged out successfully.", 'success');
                    console.log("Logout successful. Redirecting to auth section.");
                } else {
                    showNotification('Failed to logout.', 'error');
                    console.error("Logout failed (server response not OK).");
                }
            } catch (error) {
                console.error('Error during logout fetch:', error);
                showNotification('An error occurred during logout.', 'error');
            }
        });
    }

    // Dashboard Section
    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            console.log("Create Classroom button clicked.");
            const classroomName = newClassroomNameInput ? newClassroomNameInput.value.trim() : '';
            if (!classroomName) {
                displayMessage(classroomMessage, 'Please enter a classroom name.', true);
                return;
            }
            if (!currentUser || currentUser.role !== 'admin') {
                displayMessage(classroomMessage, 'Only administrators can create classrooms.', true);
                return;
            }
            try {
                const response = await fetch('/api/classrooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: classroomName }) });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(classroomMessage, result.message, false);
                    if (newClassroomNameInput) newClassroomNameInput.value = '';
                    loadAvailableClassrooms();
                    showNotification("Classroom created!", 'success');
                    console.log("Classroom created successfully.");
                } else {
                    displayMessage(classroomMessage, result.error, true);
                    showNotification(result.error, 'error');
                    console.error("Classroom creation failed:", result.error);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred.', true);
                showNotification('An error occurred during classroom creation.', 'error');
            }
        });
    }

    // Main Navigation
    if (navDashboard) navDashboard.addEventListener('click', () => { console.log("Nav Dashboard clicked."); showSection(dashboardSection); if (navDashboard) navDashboard.classList.add('active-nav'); if (navClassroom) navClassroom.classList.remove('active-nav'); if (navSettings) navSettings.classList.remove('active-nav'); loadAvailableClassrooms(); updateUIBasedOnRole(); cleanupClassroomResources(); });
    if (navClassroom) navClassroom.addEventListener('click', () => { console.log("Nav Classroom clicked."); if (currentClassroom && currentClassroom.id) { enterClassroom(currentClassroom.id, currentClassroom.name, currentClassroom.code); } else { showNotification('Please create or join a classroom first!', 'error'); } });
    if (navSettings) navSettings.addEventListener('click', () => { console.log("Nav Settings clicked."); showSection(settingsSection); if (navSettings) navSettings.classList.add('active-nav'); if (navDashboard) navDashboard.classList.remove('active-nav'); if (navClassroom) navClassroom.classList.remove('active-nav'); if (currentUser) { if (settingsUsernameInput) settingsUsernameInput.value = currentUser.username; if (settingsEmailInput) settingsEmailInput.value = currentUser.email; } cleanupClassroomResources(); });
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => { console.log("Back to Dashboard button clicked."); showSection(dashboardSection); if (navDashboard) navDashboard.classList.add('active-nav'); if (navClassroom) navClassroom.classList.remove('active-nav'); if (navSettings) navSettings.classList.remove('active-nav'); loadAvailableClassrooms(); updateUIBasedOnRole(); cleanupClassroomResources(); });
    if (backToDashboardFromSettingsBtn) backToDashboardFromSettingsBtn.addEventListener('click', () => { console.log("Back to Dashboard from Settings button clicked."); showSection(dashboardSection); if (navDashboard) navDashboard.classList.add('active-nav'); if (navSettings) navSettings.classList.remove('active-nav'); loadAvailableClassrooms(); updateUIBasedOnRole(); });

    // Classroom - Hamburger Menu Toggle
    if (hamburgerMenuBtn) {
        hamburgerMenuBtn.addEventListener('click', () => {
            console.log("Hamburger menu button clicked.");
            if (classroomSidebar) classroomSidebar.classList.toggle('active'); // Use toggle for consistent behavior
        });
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            console.log("Close sidebar button clicked.");
            if (classroomSidebar) classroomSidebar.classList.remove('active');
        });
    }

    // Classroom Sub-section Navigation (within sidebar)
    if (navChat) navChat.addEventListener('click', () => { console.log("Nav Chat clicked."); showClassroomSubSection(chatSection); if (navChat) navChat.classList.add('active-nav'); if (navWhiteboard) navWhiteboard.classList.remove('active-nav'); if (navLibrary) navLibrary.classList.remove('active-nav'); if (navAssessments) navAssessments.classList.remove('active-nav'); loadChatHistory(); });
    if (navWhiteboard) navWhiteboard.addEventListener('click', () => { console.log("Nav Whiteboard clicked."); showClassroomSubSection(whiteboardArea); if (navWhiteboard) navWhiteboard.classList.add('active-nav'); if (navChat) navChat.classList.remove('active-nav'); if (navLibrary) navLibrary.classList.remove('active-nav'); if (navAssessments) navAssessments.classList.remove('active-nav'); setupWhiteboardControls(); renderCurrentWhiteboardPage(); });
    if (navLibrary) navLibrary.addEventListener('click', () => { console.log("Nav Library clicked."); showClassroomSubSection(librarySection); if (navLibrary) navLibrary.classList.add('active-nav'); if (navWhiteboard) navWhiteboard.classList.remove('active-nav'); if (navChat) navChat.classList.remove('active-nav'); if (navAssessments) navAssessments.classList.remove('active-nav'); loadLibraryFiles(); });
    if (navAssessments) navAssessments.addEventListener('click', () => { console.log("Nav Assessments clicked."); showClassroomSubSection(assessmentsSection); if (navAssessments) navAssessments.classList.add('active-nav'); if (navWhiteboard) navWhiteboard.classList.remove('active-nav'); if (navChat) navChat.classList.remove('active-nav'); if (navLibrary) navLibrary.classList.remove('active-nav'); loadAssessments(); });


    // Settings Section
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Update Profile form submitted.");
            const username = settingsUsernameInput ? settingsUsernameInput.value.trim() : '';
            if (!username) { showNotification('Username cannot be empty.', 'error'); return; }
            try {
                const response = await fetch('/api/update-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username }) });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message, 'success');
                    if (currentUser) {
                        currentUser.username = username;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        if (currentUsernameDisplay) currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
                    }
                    console.log("Profile updated successfully.");
                } else {
                    showNotification('Error updating profile: ' + (result.error || 'Unknown error'), 'error');
                    console.error("Profile update failed:", result.error);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('An error occurred during profile update.', 'error');
            }
        });
    }

    // Share Link
    if (shareWhiteboardBtn) {
        shareWhiteboardBtn.addEventListener('click', async () => {
            console.log("Share Whiteboard button clicked.");
            const classroomId = currentClassroom ? currentClassroom.id : null;
            if (classroomId) {
                try {
                    const response = await fetch(`/api/generate-share-link/${classroomId}`);
                    const data = await response.json();
                    if (response.ok) {
                        if (shareLinkInput) shareLinkInput.value = data.share_link;
                        if (shareLinkDisplay) shareLinkDisplay.classList.remove('hidden');
                        if (shareLinkInput) shareLinkInput.select(); // Select the text for easy copying
                        showNotification("Share link generated. Click 'Copy Link' to copy.", 'info');
                        console.log("Share link generated:", data.share_link);
                    } else {
                        showNotification('Error generating share link: ' + (data.error || 'Unknown error'), 'error');
                        console.error("Share link generation failed:", data.error);
                    }
                } catch (error) {
                    console.error('Error generating share link:', error);
                    showNotification('An error occurred while generating the share link.', 'error');
                }
            } else {
                showNotification('Please create or join a classroom first to get a shareable link.', 'error');
            }
        });
    }
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            console.log("Copy Share Link button clicked.");
            if (shareLinkInput) {
                shareLinkInput.select();
                document.execCommand('copy');
                showNotification('Link copied to clipboard!', 'success');
            }
        });
    }

    // Broadcast Controls
    if (startBroadcastBtn) startBroadcastBtn.addEventListener('click', startBroadcast);
    if (endBroadcastBtn) endBroadcastBtn.addEventListener('click', endBroadcast);
    broadcastTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            console.log("Broadcast type changed.");
            // If broadcast is active and type changes, restart it
            if (localStream && localStream.active) {
                showNotification("Broadcast type changed. Restarting broadcast...", 'info');
                endBroadcast();
                setTimeout(() => startBroadcast(), 500); // Small delay for cleanup
            }
        });
    });

    // Assessment Controls
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestionField);
    if (submitAssessmentBtn) submitAssessmentBtn.addEventListener('click', submitAssessment);
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', submitAnswers);
    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => { console.log("Back to Assessment List button clicked."); currentAssessmentToTake = null; loadAssessments(); });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => { console.log("Back to Assessment List from Submissions button clicked."); loadAssessments(); });

    // Initial Load
    console.log("Calling checkLoginStatus on initial load.");
    checkLoginStatus();
    if (whiteboardCanvas) resizeCanvas(); // Initial canvas setup
});
