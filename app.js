// app.js (Complete Rewrite with Enhanced Whiteboard Persistence, Draggable Text, and all features)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    // Top-level application containers
    const app = document.getElementById('app');

    // Authentication Section Elements
    const authSection = document.getElementById('auth-section');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message'); // Message display for auth actions
    const showRegisterLink = document.getElementById('show-register-link');
    const showLoginLink = document.getElementById('show-login-link');

    // Dashboard Section Elements
    const dashboardSection = document.getElementById('dashboard-section');
    const classroomIdDisplay = document.getElementById('classroom-id-display'); // Displays current classroom ID
    const currentUsernameDisplay = document.getElementById('current-username-display'); // Displays logged-in username
    const navDashboard = document.getElementById('nav-dashboard');
    const navClassroom = document.getElementById('nav-classroom');
    const navSettings = document.getElementById('nav-settings');
    const logoutBtn = document.getElementById('logout-btn');

    // Classroom Creation Elements (within Dashboard)
    const createClassroomSection = document.getElementById('create-classroom-section'); // Admin-only section
    const newClassroomNameInput = document.getElementById('new-classroom-name');
    const createClassroomBtn = document.getElementById('create-classroom-btn');
    const classroomMessage = document.getElementById('classroom-message'); // Message display for classroom actions
    const classroomList = document.getElementById('classroom-list'); // List of available/joined classrooms
    const classroomSearchInput = document.getElementById('classroom-search-input'); // Search input for classrooms

    // Main Classroom Section Elements
    const classroomSection = document.getElementById('classroom-section');
    const classNameValue = document.getElementById('class-name-value'); // Displays the name of the active classroom
    const classCodeSpan = document.getElementById('class-code'); // Displays the ID/Code of the active classroom
    const backToDashboardBtn = document.getElementById('back-to-dashboard'); // Button to navigate back
    // Classroom Sub-navigation Buttons
    const navChat = document.getElementById('nav-chat');
    const navWhiteboard = document.getElementById('nav-whiteboard');
    const navLibrary = document.getElementById('nav-library');
    const navAssessments = document.getElementById('nav-assessments');

    // Classroom Sub-section Content Areas
    const chatSection = document.getElementById('chat-section');
    const whiteboardArea = document.getElementById('whiteboard-area');
    const librarySection = document.getElementById('library-section');
    const assessmentsSection = document.getElementById('assessments-section');

    // Settings Section Elements
    const settingsSection = document.getElementById('settings-section');
    const updateProfileForm = document.getElementById('update-profile-form');
    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');

    // Share Link Elements (for classrooms)
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn'); // Note: This might be integrated with generation now.

    // Chat Functionality Elements
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessages = document.getElementById('chat-messages'); // Container for chat messages

    // Whiteboard Elements
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const toolButtons = document.querySelectorAll('.tool-button'); // Buttons for selecting drawing tools
    const colorPicker = document.getElementById('colorPicker');
    const brushSizeSlider = document.getElementById('brushSize');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const clearButton = document.getElementById('clearButton');
    const saveButton = document.getElementById('saveButton');
    const whiteboardRoleMessage = document.getElementById('whiteboard-role-message'); // Admin/User specific message
    const prevWhiteboardPageBtn = document.getElementById('prev-whiteboard-page-btn');
    const nextWhiteboardPageBtn = document.getElementById('next-whiteboard-page-btn');
    const whiteboardPageDisplay = document.getElementById('whiteboard-page-display'); // Displays current page number
    const shareWhiteboardBtn = document.getElementById('share-whiteboard-btn'); // Button to generate share link for whiteboard
    const textToolButton = document.getElementById('textTool'); // Button for text tool

    // Video Broadcast Elements
    const broadcastTypeRadios = document.querySelectorAll('input[name="broadcastType"]'); // Radio buttons for broadcast type
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video'); // Local video stream display
    const localVideoContainer = document.getElementById('local-video-container'); // Wrapper for local video (for zoom)
    const remoteVideoContainer = document.getElementById('remote-video-container'); // Container for remote video streams
    const broadcastRoleMessage = document.getElementById('broadcast-role-message'); // Admin/User specific message

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input'); // File input for uploading to library
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryRoleMessage = document.getElementById('library-role-message'); // Admin/User specific message
    const libraryFilesList = document.getElementById('library-files-list'); // List of files in the library
    const librarySearchInput = document.getElementById('library-search-input'); // Search input for library files

    // Assessment Elements
    const assessmentCreationForm = document.getElementById('assessment-creation-form'); // Form for creating new assessments
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionTextarea = document.getElementById('assessment-description');
    const assessmentScheduledAtInput = document.getElementById('assessment-scheduled-at'); // Date/time input for scheduling
    const assessmentDurationMinutesInput = document.getElementById('assessment-duration-minutes'); // Duration input
    const questionsContainer = document.getElementById('questions-container'); // Container for assessment questions
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message'); // Message display for assessment creation
    const assessmentListContainer = document.getElementById('assessment-list-container'); // Container for listing assessments
    const assessmentListDiv = document.getElementById('assessment-list'); // Div to display the list of assessments
    const assessmentSearchInput = document.getElementById('assessment-search-input'); // Search input for assessments
    const takeAssessmentContainer = document.getElementById('take-assessment-container'); // Container for taking an assessment
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const assessmentTimerDisplay = document.getElementById('assessment-timer'); // Timer display for active assessments
    const takeAssessmentForm = document.getElementById('take-assessment-form'); // Form for submitting assessment answers
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message'); // Message display for submission
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn'); // Button to go back to assessment list
    const viewSubmissionsContainer = document.getElementById('view-submissions-container'); // Container for viewing submissions (admin only)
    const submissionsAssessmentTitle = document.getElementById('submissions-assessment-title');
    const submissionsList = document.getElementById('submissions-list'); // List of submissions
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn'); // Button to go back to assessment list

    // Global Notification Container
    const notificationsContainer = document.getElementById('notifications-container');


    // --- Global Variables ---
    let socket; // Socket.IO client instance
    // Current user and classroom data, initialized from localStorage for persistence
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentAssessmentToTake = null; // Stores the assessment object currently being taken
    let assessmentTimerInterval = null; // Interval ID for the assessment countdown timer
    let assessmentEndTime = null; // The exact Date object when the assessment should end

    // WebRTC Variables for video/audio broadcasting
    let localStream; // Local media stream (camera/mic)
    const peerConnections = {}; // Stores RTCPeerConnection objects, keyed by peerId
    const iceServers = { // STUN/TURN servers for NAT traversal
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
        ]
    };

    // Video Zoom State Management
    // Map: videoElement.id -> { currentScale: 1, isZoomed: false, offsetX: 0, offsetY: 0 }
    const videoZoomStates = new Map();

    // Whiteboard Global Variables (integrated from whiteboard.js for comprehensive control)
    let whiteboardCtx; // 2D rendering context of the whiteboard canvas
    let currentTool = 'pen'; // Currently selected drawing tool
    let isDrawing = false; // Flag to indicate if drawing is in progress
    let startX, startY; // Coordinates for drawing actions
    let temporaryShapeData = null; // Stores data for the shape being currently drawn for live preview
    
    // `whiteboardPages` stores an array of arrays, where each inner array is a page's drawing history
    let whiteboardPages = [[]]; // Initialize with one empty page, each page is an array of drawing commands
    let currentPageIndex = 0; // Index of the currently active whiteboard page
    let currentColor = '#FFFFFF'; // Default drawing color (white)
    let currentBrushSize = 5; // Default brush size in pixels
    const MAX_HISTORY_STEPS = 10; // Maximum number of undo/redo states to store per page
    let undoStack = []; // Stores deep copies of whiteboardPages[currentPageIndex] for undo functionality
    let redoStack = []; // Stores deep copies of whiteboardPages[currentPageIndex] for redo functionality
    
    // Text Tool specific variables
    let activeTextInput = null; // Reference to the currently active textarea for text input
    let isDraggingText = false; // Flag for dragging existing text
    let draggedTextItemIndex = -1; // Index of the text item being dragged in whiteboardPages
    let dragStartOffsetX = 0; // Offset from mouse to text item's x
    let dragStartOffsetY = 0; // Offset from mouse to text item's y

    let questionCounter = 0; // To keep track of questions in the assessment creation form


    // --- Utility Functions ---

    /**
     * Displays a temporary notification message to the user at the top of the screen.
     * The notification will automatically hide after 5 seconds.
     * @param {string} message - The text message to display.
     * @param {boolean} isError - True if the message indicates an error (red background), false for success/info (green background).
     */
    function showNotification(message, isError = false) {
        // Ensure the notification container exists before attempting to use it
        if (notificationsContainer) {
            notificationsContainer.textContent = message;
            // Apply appropriate styling based on whether it's an error or success message
            notificationsContainer.className = isError ? 'error-notification' : 'success-notification';
            notificationsContainer.classList.add('show'); // Make the notification visible
            // Hide the notification after a set duration (5 seconds)
            setTimeout(() => {
                notificationsContainer.classList.remove('show');
                notificationsContainer.textContent = ''; // Clear text after hiding
            }, 5000); // Notification duration
        }
    }

    /**
     * Helper function to display form-specific messages (e.g., login/register errors).
     * @param {HTMLElement} element - The DOM element (e.g., a paragraph) to display the message in.
     * @param {string} message - The message text to set.
     * @param {boolean} isError - True for an error message (red text), false for a success message (green text).
     */
    function displayMessage(element, message, isError) {
        if (element) {
            element.textContent = message;
            element.className = isError ? 'error' : 'success'; // Apply CSS classes for styling
        }
    }

    /**
     * Controls the visibility of major application sections (Auth, Dashboard, Classroom, Settings).
     * Hides all main sections and then shows the specified section.
     * @param {HTMLElement} sectionToShow - The DOM element of the section to make visible.
     */
    function showSection(sectionToShow) {
        // List of all main sections to ensure only one is active at a time
        [authSection, dashboardSection, classroomSection, settingsSection].forEach(section => {
            if (section) {
                section.classList.add('hidden'); // Hide the section
                section.classList.remove('active'); // Remove active class
            }
        });
        // Make the target section visible and active
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.classList.add('active');
            console.log(`[UI] Showing section: ${sectionToShow.id}`); // Debugging log
        } else {
            console.warn('[UI] Attempted to show a null section.');
        }
    }

    /**
     * Controls the visibility of sub-sections within the classroom (Whiteboard, Chat, Library, Assessments).
     * Hides all classroom sub-sections and then shows the specified one.
     * @param {HTMLElement} subSectionToShow - The DOM element of the sub-section to make visible.
     */
    function showClassroomSubSection(subSectionToShow) {
        // List of all classroom sub-sections
        [whiteboardArea, chatSection, librarySection, assessmentsSection].forEach(subSection => {
            if (subSection) {
                subSection.classList.add('hidden');
                subSection.classList.remove('active');
            }
        });
        // Make the target sub-section visible and active
        if (subSectionToShow) {
            subSectionToShow.classList.remove('hidden');
            subSectionToShow.classList.add('active');
            console.log(`[UI] Showing classroom sub-section: ${subSectionToShow.id}`); // Debugging log
        } else {
            console.warn('[UI] Attempted to show a null classroom sub-section.');
        }
    }

    /**
     * Updates the 'active' visual state of navigation buttons in the sidebar.
     * Removes 'active-nav' class from all, then adds it to the specified button.
     * @param {HTMLElement} activeButton - The DOM element of the navigation button to highlight.
     */
    function updateNavActiveState(activeButton) {
        // List of all navigation buttons
        [navDashboard, navClassroom, navSettings, navChat, navWhiteboard, navLibrary, navAssessments].forEach(btn => {
            if (btn) btn.classList.remove('active-nav'); // Deactivate all
        });
        if (activeButton) {
            activeButton.classList.add('active-nav'); // Activate the specified button
        }
    }

    /**
     * Adjusts the visibility and behavior of UI elements based on the current user's role.
     * Elements with `data-admin-only` are shown only for administrators.
     * Elements with `data-user-only` are shown only for regular users.
     * Also updates specific role-based messages for whiteboard, broadcast, and library.
     */
    function updateUIBasedOnRole() {
        // Determine if the current user is an admin or a regular user
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isUser = currentUser && currentUser.role === 'user';

        // Toggle visibility for admin-only elements
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
            el.classList.toggle('admin-feature-highlight', isAdmin); // Optional highlight for admin features
        });

        // Toggle visibility for user-only elements (less common, but good to have)
        document.querySelectorAll('[data-user-only]').forEach(el => {
            el.classList.toggle('hidden', !isUser);
            el.classList.toggle('user-view-subtle', isUser); // Optional subtle styling for user view
        });

        // Update whiteboard role message and drawing capability
        if (whiteboardRoleMessage) {
            whiteboardRoleMessage.classList.toggle('hidden', isAdmin); // Hide message if admin
            whiteboardRoleMessage.textContent = isAdmin ? '' : 'Only administrators can draw on the whiteboard. Your view is read-only.';
        }
        if (whiteboardCanvas) {
            // Disable pointer events on canvas for non-admins to prevent interaction
            whiteboardCanvas.style.pointerEvents = isAdmin ? 'auto' : 'none';
            // Also explicitly disable the temporary text input area if it exists
            if(activeTextInput) activeTextInput.disabled = !isAdmin;
        }
        // Disable whiteboard tool buttons for non-admins
        toolButtons.forEach(button => {
            button.disabled = !isAdmin;
        });
        if (colorPicker) colorPicker.disabled = !isAdmin;
        if (brushSizeSlider) brushSizeSlider.disabled = !isAdmin;
        if (undoButton) undoButton.disabled = !isAdmin || undoStack.length <= 1;
        if (redoButton) redoButton.disabled = !isAdmin || redoStack.length === 0;
        if (clearButton) clearButton.disabled = !isAdmin;
        if (saveButton) saveButton.disabled = !isAdmin; // Allow save for non-admin if desired, but here restricted

        // Update broadcast role message and controls visibility
        if (broadcastRoleMessage) {
            broadcastRoleMessage.classList.toggle('hidden', isAdmin);
            broadcastRoleMessage.textContent = isAdmin ? '' : 'Only administrators can start a video broadcast.';
        }
        // Hide/show broadcast buttons for non-admins
        if (startBroadcastBtn) startBroadcastBtn.classList.toggle('hidden', !isAdmin);
        if (endBroadcastBtn) endBroadcastBtn.classList.toggle('hidden', !isAdmin);
        broadcastTypeRadios.forEach(radio => {
            if (radio.parentElement) radio.parentElement.classList.toggle('hidden', !isAdmin);
        });


        // Update library role message and upload capability
        if (libraryRoleMessage) {
            libraryRoleMessage.classList.toggle('hidden', isAdmin);
            libraryRoleMessage.textContent = isAdmin ? '' : 'Only administrators can upload files to the library.';
        }
        if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.classList.toggle('hidden', !isAdmin);
        if (libraryFileInput) libraryFileInput.classList.toggle('hidden', !isAdmin);
    }

    /**
     * Returns a formatted display name for a user, appending "(Admin)" if the role is 'admin'.
     * @param {string} username - The user's original username.
     * @param {string} role - The user's role ('user' or 'admin').
     * @returns {string} The formatted display name (e.g., "JohnDoe (Admin)").
     */
    function getDisplayName(username, role) {
        return role === 'admin' ? `${username} (Admin)` : username;
    }


    // --- Authentication Functions ---

    /**
     * Checks the current login status from `localStorage` and `sessionStorage`.
     * Updates the UI accordingly, displaying either the authentication section or the dashboard.
     * Also handles direct access to classroom links if a user is already logged in.
     */
    function checkLoginStatus() {
        console.log('[Auth] Checking login status...');
        // Retrieve currentUser from localStorage (persists across sessions)
        currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        // Retrieve currentClassroom from localStorage (persists across sessions)
        currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;

        if (currentUser && currentUser.id) { // User is logged in
            console.log(`[Auth] User ${currentUser.username} (${currentUser.id}) is logged in. Role: ${currentUser.role}`);
            showSection(dashboardSection); // Display the main dashboard
            if (currentUsernameDisplay) currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
            if (classroomIdDisplay) classroomIdDisplay.textContent = currentClassroom ? currentClassroom.id : 'N/A';
            loadAvailableClassrooms(); // Load classrooms relevant to the user
            updateNavActiveState(navDashboard); // Highlight dashboard navigation
            updateUIBasedOnRole(); // Adjust UI elements based on the user's role

            // Handle potential direct access to a classroom URL (e.g., /classroom/123)
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                const idFromUrl = pathParts[2];
                console.log(`[Auth] Attempting to enter classroom from URL: ${idFromUrl}`);
                // Fetch all classrooms to verify the ID and get classroom details
                fetch(`/api/classrooms`)
                    .then(res => {
                        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                        return res.json();
                    })
                    .then(classrooms => {
                        const matched = classrooms.find(cls => cls.id === idFromUrl);
                        if (matched) {
                            console.log(`[Auth] Found classroom from URL: ${matched.name}`);
                            enterClassroom(matched.id, matched.name); // Enter the classroom
                        } else {
                            // If classroom not found or user not authorized, clear stored classroom and go to dashboard
                            console.warn(`[Auth] Classroom ${idFromUrl} from URL not found or unauthorized.`);
                            localStorage.removeItem('currentClassroom');
                            currentClassroom = null;
                            showNotification("Classroom not found or you are not authorized to join it.", true);
                            showSection(dashboardSection);
                            loadAvailableClassrooms();
                        }
                    })
                    .catch(err => {
                        console.error("[Auth] Error fetching classroom details from URL:", err);
                        showNotification("Could not load classroom from URL. Please try again.", true);
                        showSection(dashboardSection);
                        loadAvailableClassrooms();
                    });
            }
        } else { // User is not logged in
            console.log('[Auth] No user logged in. Displaying authentication section.');
            showSection(authSection); // Display the login/register section
            // Hide all role-specific elements as no user is logged in
            document.querySelectorAll('[data-admin-only], [data-user-only]').forEach(el => {
                el.classList.add('hidden');
            });
        }
    }

    // --- Dashboard Functions ---

    /**
     * Loads all available classrooms from the backend and displays them in the dashboard.
     * Classrooms are categorized into "Your Classrooms" (created by or joined by the user)
     * and "Available Classrooms to Join." Includes search functionality.
     */
    async function loadAvailableClassrooms() {
        if (!currentUser || !currentUser.id) {
            if (classroomList) classroomList.innerHTML = '<li>Please log in to see available classrooms.</li>';
            console.warn('[Dashboard] Cannot load classrooms: No current user.');
            return;
        }
        try {
            const response = await fetch('/api/classrooms');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            let classrooms = await response.json();

            // Apply search filter if a search term is provided
            const searchTerm = classroomSearchInput.value.toLowerCase();
            if (searchTerm) {
                classrooms = classrooms.filter(cls =>
                    cls.name.toLowerCase().includes(searchTerm) ||
                    cls.id.toLowerCase().includes(searchTerm)
                );
            }

            if (classroomList) classroomList.innerHTML = ''; // Clear existing list

            if (classrooms.length === 0) {
                if (classroomList) classroomList.innerHTML = '<li>No classrooms found matching your search.</li>';
                return;
            }

            // Separate classrooms into joined/created by user and others
            const userJoinedClassrooms = classrooms.filter(cls =>
                cls.creator_id === currentUser.id || (cls.participants && cls.participants.includes(currentUser.id))
            );
            const otherClassrooms = classrooms.filter(cls =>
                cls.creator_id !== currentUser.id && (!cls.participants || !cls.participants.includes(currentUser.id))
            );

            // Display "Your Classrooms" section
            if (userJoinedClassrooms.length > 0) {
                const h3 = document.createElement('h3');
                h3.textContent = 'Your Classrooms';
                if (classroomList) classroomList.appendChild(h3);
                userJoinedClassrooms.forEach(classroom => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${classroom.name} (ID: ${classroom.id})</span>
                        <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" class="go-to-classroom-btn btn-primary">Enter Classroom</button>
                    `;
                    if (classroomList) classroomList.appendChild(li);
                });
            }

            // Display "Available Classrooms to Join" section
            if (otherClassrooms.length > 0) {
                const h3 = document.createElement('h3');
                h3.textContent = 'Available Classrooms to Join';
                if (classroomList) classroomList.appendChild(h3);
                otherClassrooms.forEach(classroom => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${classroom.name} (ID: ${classroom.id})</span>
                        <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" class="join-classroom-btn btn-secondary">Join Classroom</button>
                    `;
                    if (classroomList) classroomList.appendChild(li);
                });
            }

            // Fallback message if no classrooms are found at all
            if (userJoinedClassrooms.length === 0 && otherClassrooms.length === 0 && classroomList) {
                classroomList.innerHTML = '<li>No classrooms found. Create one or wait for an admin to create one!</li>';
            }

            // Attach event listeners for "Enter Classroom" buttons
            document.querySelectorAll('.go-to-classroom-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = e.target.dataset.classroomId;
                    const name = e.target.dataset.classroomName;
                    enterClassroom(id, name);
                });
            });

            // Attach event listeners for "Join Classroom" buttons
            document.querySelectorAll('.join-classroom-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const id = e.target.dataset.classroomId;
                    const name = e.target.dataset.classroomName;
                    try {
                        const response = await fetch(`/api/classrooms/${id}/join`, { // CORRECTED URL
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({}) // Empty body is fine as ID is in URL
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
                        showNotification('An error occurred during joining the classroom.', true);
                    }
                });
            });
        } catch (error) {
            console.error('Error loading classrooms:', error);
            if (classroomList) classroomList.innerHTML = '<li>Failed to load classrooms. Please try again later.</li>';
            showNotification('Failed to load classrooms.', true);
        }
    }

    // --- Classroom Functions ---

    /**
     * Enters a specific classroom: updates global state, UI, initializes Socket.IO,
     * and loads relevant classroom content (whiteboard, chat, library, assessments).
     * @param {string} id - The unique ID of the classroom.
     * @param {string} name - The display name of the classroom.
     */
    function enterClassroom(id, name) {
        console.log(`[Classroom] Entering classroom: ${name} (ID: ${id})`);
        currentClassroom = { id: id, name: name };
        localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom)); // Persist classroom info

        // Update UI elements in the classroom section
        if (classroomIdDisplay) classroomIdDisplay.textContent = id;
        if (classNameValue) classNameValue.textContent = name;
        if (classCodeSpan) classCodeSpan.textContent = id;

        showSection(classroomSection); // Show the main classroom section
        showClassroomSubSection(whiteboardArea); // Default to whiteboard sub-section
        updateNavActiveState(navWhiteboard); // Highlight whiteboard nav button
        updateUIBasedOnRole(); // Adjust UI based on user role within the classroom

        initializeSocketIO(); // Establish Socket.IO connection for real-time updates
        setupWhiteboardControls(); // Prepare whiteboard canvas and tools
        setupChatControls(); // Prepare chat input and send button

        // Reset broadcast buttons state and visibility based on user role
        if (currentUser && currentUser.role === 'admin') {
            if (startBroadcastBtn) startBroadcastBtn.disabled = false;
            if (endBroadcastBtn) endBroadcastBtn.disabled = true;
            broadcastTypeRadios.forEach(radio => {
                if (radio.parentElement) radio.parentElement.classList.remove('hidden');
            });
        } else {
            if (startBroadcastBtn) startBroadcastBtn.classList.add('hidden');
            if (endBroadcastBtn) endBroadcastBtn.classList.add('hidden');
            broadcastTypeRadios.forEach(radio => {
                if (radio.parentElement) radio.parentElement.classList.add('hidden');
            });
        }

        // Hide share link by default when entering a classroom
        if (shareLinkDisplay) shareLinkDisplay.classList.add('hidden');
        if (shareLinkInput) shareLinkInput.value = '';

        loadAssessments(); // Load available assessments
        loadLibraryFiles(); // Load library files

        // Whiteboard history fetching is now triggered after socket 'connect' and 'join' events
    }

    /**
     * Cleans up all classroom-related resources and state when leaving a classroom.
     * This includes disconnecting Socket.IO, ending broadcasts, clearing whiteboard,
     * chat, and assessment timers.
     */
    function cleanupClassroomResources() {
        console.log('[Classroom] Cleaning up classroom resources...');
        // Disconnect Socket.IO if connected
        if (socket) {
            if (currentClassroom && currentClassroom.id) {
                socket.emit('leave', { 'classroomId': currentClassroom.id }); // Notify server user is leaving
            }
            socket.disconnect();
            socket = null;
            console.log('[Classroom] Socket.IO disconnected.');
        }

        endBroadcast(); // Ensure all WebRTC broadcasts and connections are terminated

        // Remove any active text input element
        if (activeTextInput) {
            activeTextInput.remove();
            activeTextInput = null;
        }

        // Clear whiteboard state and canvas
        if (whiteboardCtx && whiteboardCanvas) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000'; // Fill with black background
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        whiteboardPages = [[]]; // Reset whiteboard to one empty page
        currentPageIndex = 0;
        undoStack = []; // Clear undo stack
        redoStack = []; // Clear redo stack
        updateUndoRedoButtons(); // Update button states
        updateWhiteboardPageDisplay(); // Reset page display

        // Clear chat messages and remote video displays
        if (chatMessages) chatMessages.innerHTML = '';
        if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';

        // Clear stored classroom info
        currentClassroom = null;
        localStorage.removeItem('currentClassroom');
        console.log('[Classroom] Current classroom data cleared.');

        // Clear any active assessment timer
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
            console.log('[Classroom] Assessment timer cleared.');
        }
        if (assessmentTimerDisplay) {
            assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        }
    }

    // --- Socket.IO Initialization and Handlers ---

    /**
     * Initializes the Socket.IO connection and sets up all event listeners for real-time communication.
     * This function ensures that previous connections are properly closed before a new one is established.
     */
    function initializeSocketIO() {
        if (socket && socket.connected) {
            console.warn('[Socket.IO] Existing socket connection found. Disconnecting before re-initializing.');
            socket.disconnect(); // Disconnect any existing socket
        }

        socket = io(); // Initialize a new Socket.IO client instance

        // Event listener for successful connection
        socket.on('connect', () => {
            console.log('[Socket.IO] Connected. Session ID (SID):', socket.id);
            // Attempt to join the classroom if `currentClassroom` is set
            if (currentClassroom && currentClassroom.id && currentUser && currentUser.role) {
                console.log(`[Socket.IO] Emitting 'join' event for classroom ${currentClassroom.id}`);
                socket.emit('join', {
                    'classroomId': currentClassroom.id,
                    'role': currentUser.role,
                    'username': currentUser.username, // Include username for server logs/peer display
                    'userId': currentUser.id // Include userId for server identification
                });
                showNotification(`Connected to classroom: ${currentClassroom.name}`);

                // IMPORTANT: Fetch whiteboard history *after* ensuring the user has joined the room.
                // A small delay gives the server time to process the 'join' event.
                setTimeout(() => {
                    if (socket.connected && currentClassroom && currentClassroom.id) {
                        fetchWhiteboardHistory();
                        console.log('[Socket.IO] Requested whiteboard history after join.');
                    } else {
                        console.error('[Socket.IO] Socket not connected or classroom not set after delay. Cannot fetch history.');
                    }
                }, 500); // 500ms delay

            } else {
                console.error('[Socket.IO] Cannot join classroom: currentClassroom or currentUser is undefined or missing required properties.');
                showNotification("Error: Could not join classroom. Please try re-entering the classroom.", true);
            }
        });

        // Event listener for disconnection
        socket.on('disconnect', (reason) => {
            console.log(`[Socket.IO] Disconnected. Reason: ${reason}`);
            showNotification("Disconnected from classroom. " + (reason === 'io server disconnect' ? 'Admin ended session.' : ''), true);
            // Clean up WebRTC peer connections and remote videos upon disconnect
            for (const peerId in peerConnections) {
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
            }
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        });

        // General status updates from the server
        socket.on('status', (data) => {
            console.log('[Socket.IO] Server Status:', data.message);
        });

        // Event for admin actions that affect other users (e.g., library updates, assessment changes)
        socket.on('admin_action_update', (data) => {
            console.log('[Admin Action] Received:', data.message);
            showNotification(`Admin Action: ${data.message}`);
            if (data.message.includes('library')) {
                loadLibraryFiles(); // Reload library if files were updated
            }
            if (data.message.includes('assessment')) {
                loadAssessments(); // Reload assessments to reflect changes
            }
        });

        // Event for receiving new chat messages
        socket.on('message', (data) => {
            console.log('Received chat message:', data);
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message-item');

            // Apply specific CSS classes based on sender and role
            if (currentUser && data.userId === currentUser.id) { // Use data.userId for comparison
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

            messageElement.innerHTML = `<span class="chat-sender-name">${senderDisplayName}</span> <span class="chat-timestamp">(${formattedDateTime}):</span> ${data.message}`;
            if (chatMessages) chatMessages.appendChild(messageElement);
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to latest message
        });

        // Event for receiving chat history on joining a classroom
        socket.on('chat_history', (history) => {
            console.log('Received chat history:', history);
            if (chatMessages) chatMessages.innerHTML = ''; // Clear previous messages
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('chat-message-item');

                if (currentUser && msg.userId === currentUser.id) { // Use msg.userId for comparison
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

                messageElement.innerHTML = `<span class="chat-sender-name">${senderDisplayName}</span> <span class="chat-timestamp">(${formattedDateTime}):</span> ${msg.message}`;
                if (chatMessages) chatMessages.appendChild(messageElement);
            });
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        });

        // Event when a user joins the classroom
        socket.on('user_joined', (data) => {
            console.log(`[Socket.IO] User joined: ${data.username} (${data.sid})`);
            const statusMessage = document.createElement('div');
            const joinedDisplayName = getDisplayName(data.username, data.role);
            statusMessage.textContent = `${joinedDisplayName} has joined the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            if (chatMessages) chatMessages.appendChild(statusMessage);
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

            // If the current user is an admin and broadcasting, create a WebRTC offer for the new participant
            if (currentUser && currentUser.role === 'admin' && localStream && localStream.active && data.sid !== socket.id) {
                console.log(`[WebRTC] Admin (${socket.id}) broadcasting. Creating offer for new peer: ${data.sid}`);
                createPeerConnection(data.sid, true, data.username); // 'true' indicates this peer initiates the offer
            }
        });

        // Event when a user leaves the classroom
        socket.on('user_left', (data) => {
            console.log(`[Socket.IO] User left: ${data.username} (${data.sid})`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has left the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            if (chatMessages) chatMessages.appendChild(statusMessage);
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

            const peerId = data.sid;
            // Close WebRTC connection and remove video element for the departed peer
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
            }
        });

        // Whiteboard data synchronization event
        socket.on('whiteboard_data', (data) => {
            if (!whiteboardCtx) {
                console.warn('[Whiteboard] Cannot draw: whiteboardCtx is null when receiving whiteboard data. This might happen if whiteboard is not active.');
                showNotification('Whiteboard rendering error. Please try navigating to the whiteboard again.', true);
                return;
            }

            // Validate incoming whiteboard data structure
            if (!data || typeof data.action === 'undefined' || typeof data.pageIndex === 'undefined') {
                console.error('[Whiteboard] Received malformed whiteboard data, missing action or pageIndex:', data);
                return;
            }

            const { action, pageIndex } = data;

            if (action === 'draw') {
                const drawingItem = data.data;
                if (!drawingItem || typeof drawingItem.type === 'undefined') {
                    console.error('[Whiteboard] Received invalid drawing item, missing type:', drawingItem);
                    return;
                }

                // Ensure the target page exists locally; create if it's a new page
                while (whiteboardPages.length <= pageIndex) {
                    whiteboardPages.push([]);
                }
                whiteboardPages[pageIndex].push(drawingItem); // Store the drawing command

                // Only render if it's the currently active page
                if (pageIndex === currentPageIndex) {
                    renderCurrentWhiteboardPage(); // Re-render the entire page to include the new item
                }
            } else if (action === 'clear') {
                // Clear local data for the specified page
                if (whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                    showNotification(`Whiteboard page ${pageIndex + 1} cleared by admin.`);
                }
                // If it's the current page, clear the canvas visually and redraw
                if (pageIndex === currentPageIndex) {
                    renderCurrentWhiteboardPage(); // Re-render effectively clears and sets background
                }
            } else if (action === 'history' && Array.isArray(data.history)) {
                // Initial load of whiteboard history for all pages
                console.log('[Whiteboard] Received whiteboard history from server:', data.history);
                whiteboardPages = data.history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [[]]; // Ensure at least one page
                }
                currentPageIndex = 0; // Reset to the first page on history load
                renderCurrentWhiteboardPage(); // Render the first page
                updateWhiteboardPageDisplay(); // Update page display and buttons
                pushToUndoStack(); // Save initial loaded history to undo stack
                showNotification('Whiteboard history loaded.');
            }
        });

        // Whiteboard page change synchronization event
        socket.on('whiteboard_page_change', (data) => {
            // Validate incoming page index
            const { newPageIndex } = data;
            if (typeof newPageIndex !== 'number' || newPageIndex < 0) {
                console.error('[Whiteboard] Received invalid newPageIndex for page change:', newPageIndex);
                return;
            }

            // Handle creation of new pages if `newPageIndex` is beyond current `whiteboardPages.length`
            while (whiteboardPages.length <= newPageIndex) {
                whiteboardPages.push([]); // Add new empty pages until `newPageIndex` is valid
                console.log(`[Whiteboard] Auto-created new local whiteboard page: ${whiteboardPages.length}`);
            }

            // Update local page index and re-render
            currentPageIndex = newPageIndex;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            showNotification(`Whiteboard page changed to ${newPageIndex + 1}`);
            // Also push to undo stack for the new page
            pushToUndoStack();
        });

        // WebRTC signaling: Offer (from initiating peer, usually admin broadcaster)
        socket.on('webrtc_offer', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore offers from self
            console.log(`[WebRTC] Received WebRTC Offer from: ${data.sender_id} to ${socket.id}`);

            const peerId = data.sender_id;
            const peerUsername = data.username || `Peer ${peerId.substring(0, 4)}`; // Use username from data or generate placeholder
            // Create a new peer connection if one doesn't exist for this peer
            if (!peerConnections[peerId]) {
                createPeerConnection(peerId, false, peerUsername); // 'false' indicates this peer is the receiver
            }

            try {
                // Set the received offer as the remote description
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.offer));
                // Create an answer to the offer
                const answer = await peerConnections[peerId].createAnswer();
                // Set the created answer as the local description
                await peerConnections[peerId].setLocalDescription(answer);
                // Send the answer back to the offering peer
                socket.emit('webrtc_answer', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    answer: peerConnections[peerId].localDescription
                });
                console.log(`[WebRTC] Sent WebRTC Answer to: ${peerId} from ${socket.id}`);
            } catch (error) {
                console.error('[WebRTC] Error handling WebRTC offer:', error);
                showNotification(`WebRTC error with ${peerUsername}: ${error.message}`, true);
            }
        });

        // WebRTC signaling: Answer (from receiving peer)
        socket.on('webrtc_answer', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore answers from self
            console.log(`[WebRTC] Received WebRTC Answer from: ${data.sender_id} to ${socket.id}`);
            const peerId = data.sender_id;
            // If the peer connection exists, set the received answer as its remote description
            if (peerConnections[peerId]) {
                try {
                    await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (error) {
                    console.error('[WebRTC] Error handling WebRTC answer:', error);
                    showNotification(`WebRTC error with ${peerId}: ${error.message}`, true);
                }
            }
        });

        // WebRTC signaling: ICE Candidate (network information exchange)
        socket.on('webrtc_ice_candidate', async (data) => {
            if (data.sender_id === socket.id) return; // Ignore candidates from self
            console.log(`[WebRTC] Received ICE Candidate from: ${data.sender_id} to ${socket.id}`);
            const peerId = data.sender_id;
            // If the peer connection exists and candidate data is present, add it
            if (peerConnections[peerId] && data.candidate) {
                try {
                    await peerConnections[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (error) {
                    // Filter out common 'wrong state' errors that can occur during ICE candidate exchange
                    if (!error.message.includes('wrong state') && !error.message.includes('remote answer sdp')) {
                        console.error('[WebRTC] Error adding ICE candidate:', error);
                        showNotification(`WebRTC ICE error with ${peerId}: ${error.message}`, true);
                    }
                }
            }
        });

        // WebRTC peer disconnected signal from server
        socket.on('webrtc_peer_disconnected', (data) => {
            console.log(`[WebRTC] Peer disconnected signal received for: ${data.peer_id}`);
            const peerId = data.peer_id;
            // Close peer connection and remove video element
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
                showNotification(`User ${peerId.substring(0, 4)} disconnected from broadcast.`);
            }
        });

        // New Socket.IO event: Assessment has started (server-side push)
        socket.on('assessment_started', (data) => {
            console.log('[Assessment] Received assessment_started event:', data);
            // Only act if the user is currently viewing or has set this assessment to take
            if (currentAssessmentToTake && currentAssessmentToTake.id === data.assessmentId) {
                showNotification(`Assessment "${data.title}" has started!`);
                startAssessmentTimer(new Date(data.endTime)); // Start the client-side countdown
            }
        });

        // New Socket.IO event: A submission has been marked (server-side push)
        socket.on('submission_marked', (data) => {
            console.log('[Assessment] Received submission_marked event:', data);
            // Notify the specific student whose submission was marked
            if (currentUser && currentUser.id === data.studentId) {
                showNotification(`Your assessment "${data.assessmentTitle}" has been marked!`);
                // In a full application, you might also trigger fetching their marked submission details here
            }
            // If an admin is viewing submissions, they might want to refresh the list
            if (currentUser && currentUser.role === 'admin' && viewSubmissionsContainer && !viewSubmissionsContainer.classList.contains('hidden')) {
                // Assuming submissionsAssessmentTitle has the current assessment ID in a dataset or similar
                // For simplicity, just refresh if admin is on submission page
                const currentAssessmentId = submissionsAssessmentTitle.dataset.assessmentId;
                if (currentAssessmentId === data.assessmentId) {
                    viewSubmissions(currentAssessmentId, data.assessmentTitle);
                }
            }
        });
    }

    // --- WebRTC Functions ---

    // A CORRECTED startBroadcast function that initiates connections to all existing peers.
async function startBroadcast() {
    // [YOUR EXISTING CODE IS FINE HERE - Pre-flight checks and media constraints]
    // ...

    try {
        // Request user's media devices (camera and/or microphone)
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (localVideo) localVideo.srcObject = localStream;

        if (startBroadcastBtn) startBroadcastBtn.disabled = true;
        if (endBroadcastBtn) endBroadcastBtn.disabled = false;

        showNotification(`Broadcast started: ${broadcastMode === 'video_audio' ? 'Video & Audio' : 'Audio Only'}`);
        console.log(`[WebRTC] Admin ${currentUser.username} started a ${broadcastMode} broadcast.`);

        // --- NEW CODE START ---
        // Crucial step: Request the server to get a list of all current peers
        // This makes sure the broadcaster can connect to users already in the room.
        socket.emit('get_all_peers', { classroomId: currentClassroom.id });

    } catch (err) {
        console.error('[WebRTC] Error accessing media devices:', err);
        showNotification(`Could not start broadcast. Error: ${err.message}. Please ensure camera and microphone access are granted.`, true);
        localStream = null;
        if (startBroadcastBtn) startBroadcastBtn.disabled = false;
        if (endBroadcastBtn) endBroadcastBtn.disabled = true;
    }
}

        const selectedType = document.querySelector('input[name="broadcastType"]:checked');
        const broadcastMode = selectedType ? selectedType.value : 'audio_only'; // Default to audio if nothing selected

        // Define media constraints based on selected broadcast type
        const constraints = {
            video: broadcastMode === 'video_audio' ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 15 } // Optimize for lower bandwidth
            } : false, // No video for 'audio_only'
            audio: true // Audio is always enabled
        };

        try {
            // Request user's media devices (camera and/or microphone)
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (localVideo) localVideo.srcObject = localStream; // Display local stream in the UI

            if (startBroadcastBtn) startBroadcastBtn.disabled = true; // Disable start button
            if (endBroadcastBtn) endBroadcastBtn.disabled = false; // Enable end button

            showNotification(`Broadcast started: ${broadcastMode === 'video_audio' ? 'Video & Audio' : 'Audio Only'}`);
            console.log(`[WebRTC] Admin ${currentUser.username} started a ${broadcastMode} broadcast.`);

            // Notify all other users in the classroom that a broadcast has started
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Admin ${currentUser.username} started a ${broadcastMode === 'video_audio' ? 'video and audio' : 'audio only'} broadcast.`
            });

            // At this point, the admin also needs to initiate WebRTC offers to all *existing* peers
            // in the room. The `user_joined` event handles new participants, but existing ones need a direct offer.
            // A more robust solution would involve the server sending a list of active SIDs
            // to the admin upon starting a broadcast, and the admin iterating through them to create offers.
            // For this current implementation, we assume `user_joined` will cover new connections.
            // If the server does not send a list of existing peers, a refresh by other users might be needed to get the stream.

        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);
            showNotification(`Could not start broadcast. Error: ${err.message}. Please ensure camera and microphone access are granted.`, true);
            localStream = null; // Reset stream
            if (startBroadcastBtn) startBroadcastBtn.disabled = false; // Re-enable start button
            if (endBroadcastBtn) endBroadcastBtn.disabled = true; // Disable end button
        }
    }

    /**
     * Ends the active video/audio broadcast.
     * Stops local media tracks, closes all peer connections, and notifies other users.
     */
    function endBroadcast() {
        console.log('[WebRTC] Ending broadcast...');
        // Stop all tracks in the local media stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            if (localVideo) localVideo.srcObject = null; // Clear local video display
            console.log('[WebRTC] Local media stream stopped.');
        }

        // Iterate through all active peer connections and close them
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                // Inform the server and remote peer that this connection is closing
                if (socket && socket.connected) {
                    socket.emit('webrtc_peer_disconnected', { classroomId: currentClassroom.id, peer_id: peerId });
                }
                peerConnections[peerId].close(); // Close the RTCPeerConnection
                delete peerConnections[peerId]; // Remove from our map
                // Remove the corresponding remote video element from the UI
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
                console.log(`[WebRTC] Closed peer connection and removed video for ${peerId}`);
            }
        }

        showNotification('Broadcast ended.');
        if (startBroadcastBtn) startBroadcastBtn.disabled = false; // Re-enable start button
        if (endBroadcastBtn) endBroadcastBtn.disabled = true; // Disable end button

        // Notify all other users in the classroom that the broadcast has ended
        if (socket && socket.connected) {
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Admin ${currentUser.username} ended the broadcast.`
            });
        }
    }

    /**
     * Creates and configures a new RTCPeerConnection for a given remote peer.
     * Sets up event handlers for tracks, ICE candidates, and connection state changes.
     * Initiates the WebRTC offer/answer process.
     * @param {string} peerId - The Socket.IO ID of the remote peer.
     * @param {boolean} isCaller - True if this peer is initiating the connection (sending an offer).
     * @param {string} peerUsername - The username of the remote peer, used for UI display.
     */
    async function createPeerConnection(peerId, isCaller, peerUsername) {
        if (peerConnections[peerId]) {
            console.warn(`[WebRTC] Peer connection to ${peerId} already exists. Skipping creation.`);
            return;
        }

        // Create a new RTCPeerConnection instance using provided ICE servers
        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc; // Store the peer connection in our global map
        console.log(`[WebRTC] Created RTCPeerConnection for peer: ${peerId}. Is caller: ${isCaller}`);

        // If this peer is the caller (e.g., admin broadcasting), add local tracks to the peer connection
        if (isCaller && localStream) {
            localStream.getTracks().forEach(track => {
                try {
                    pc.addTrack(track, localStream);
                    console.log(`[WebRTC] Added local track (${track.kind}) to peer ${peerId}`);
                } catch (e) {
                    console.error(`[WebRTC] Error adding local track ${track.kind} to peer ${peerId}:`, e);
                }
            });
        } else if (!isCaller) {
            console.log(`[WebRTC] This peer (${socket.id}) is a receiver. Not adding local tracks to ${peerId}.`);
        }

        // Event handler for when a remote track is received from the peer
        pc.ontrack = (event) => {
            console.log(`[WebRTC] Remote track (${event.track.kind}) received from: ${peerId}`);
            let videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
            let remoteVideo = document.getElementById(`remote-video-${peerId}`);

            // Create video elements if they don't already exist for this peer
            if (!videoWrapper) {
                videoWrapper = document.createElement('div');
                videoWrapper.className = 'remote-video-wrapper';
                videoWrapper.id = `video-wrapper-${peerId}`;

                remoteVideo = document.createElement('video');
                remoteVideo.id = `remote-video-${peerId}`;
                remoteVideo.autoplay = true; // Start playing automatically
                remoteVideo.playsInline = true; // Important for iOS
                remoteVideo.controls = false; // Hide default video controls

                const usernameDisplay = document.createElement('p');
                usernameDisplay.className = 'remote-username';
                usernameDisplay.textContent = peerUsername; // Display the remote peer's username

                const videoOverlay = document.createElement('div');
                videoOverlay.className = 'video-overlay';
                videoOverlay.textContent = 'Click to zoom'; // Text for zoom instruction

                videoWrapper.appendChild(remoteVideo);
                videoWrapper.appendChild(usernameDisplay);
                videoWrapper.appendChild(videoOverlay); // Add the overlay
                if (remoteVideoContainer) remoteVideoContainer.appendChild(videoWrapper); // Add to the remote video container

                console.log(`[WebRTC] Created remote video elements for: ${peerId}`);
                initializeZoomableVideo(remoteVideo, videoWrapper); // Initialize zoom for the new remote video
            }

            // Assign the remote stream to the video element
            if (remoteVideo && event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            } else if (remoteVideo) {
                // Fallback: create a new MediaStream and add the track to it
                const newStream = new MediaStream();
                newStream.addTrack(event.track);
                remoteVideo.srcObject = newStream;
            }
        };

        // Event handler for when ICE candidates are generated locally
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`[WebRTC] Sending ICE Candidate from ${socket.id} to: ${peerId}`);
                socket.emit('webrtc_ice_candidate', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    candidate: event.candidate // Send the generated ICE candidate
                });
            }
        };

        // Event handler for changes in the peer connection's state
        pc.onconnectionstatechange = () => {
            console.log(`[WebRTC] Connection state with ${peerId}: ${pc.connectionState}`);
            // Clean up if the connection becomes disconnected, failed, or closed
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                console.log(`[WebRTC] Peer ${peerId} connection ${pc.connectionState}. Cleaning up.`);
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
                const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
                if (videoWrapper) {
                    videoWrapper.remove();
                }
                showNotification(`WebRTC connection with ${peerUsername} ${pc.connectionState}.`, true);
            }
        };

        // If this peer is the caller, initiate the WebRTC offer
        if (isCaller) {
            try {
                const offer = await pc.createOffer(); // Create an SDP offer
                await pc.setLocalDescription(offer); // Set local description
                console.log(`[WebRTC] Sending WebRTC Offer from ${socket.id} to: ${peerId}`);
                socket.emit('webrtc_offer', {
                    classroomId: currentClassroom.id,
                    recipient_id: peerId,
                    offer: pc.localDescription,
                    username: currentUser.username // Send current user's username with the offer
                });
            } catch (error) {
                console.error('[WebRTC] Error creating WebRTC offer:', error);
                showNotification(`Failed to create broadcast offer: ${error.message}`, true);
            }
        }
    }

    // --- Video Zoom Functions ---

    /**
     * Initializes zoom and pan functionality for a given video element within its container.
     * Allows users to click to toggle zoom, and drag to pan when zoomed.
     * @param {HTMLVideoElement} videoElement - The actual `<video>` DOM element to make zoomable.
     * @param {HTMLElement} containerElement - The wrapper `div` containing the video element.
     */
    function initializeZoomableVideo(videoElement, containerElement) {
        if (!videoElement || !containerElement) {
            console.warn('[Video Zoom] Missing video or container element for zoom initialization.');
            return;
        }

        // Ensure the video element has a unique ID for state management
        if (!videoElement.id) {
            videoElement.id = `video-${Math.random().toString(36).substring(2, 9)}`;
        }

        // Initialize the zoom state for this specific video element
        videoZoomStates.set(videoElement.id, {
            currentScale: 1, // Current zoom level (1 = no zoom)
            isZoomed: false, // Flag to indicate if currently zoomed
            offsetX: 0, // Horizontal pan offset
            offsetY: 0 // Vertical pan offset
        });

        const minZoom = 1.0; // Minimum zoom level
        const defaultZoom = 2.0; // Default zoom level when clicking to zoom in

        let isDragging = false; // Flag for drag-to-pan
        let startX, startY; // Starting coordinates for drag

        /**
         * Applies the current scale and offset transformations to the video element.
         * Also updates the container's class and video's cursor style.
         * @param {string} vidId - The ID of the video element.
         */
        function applyTransform(vidId) {
            const state = videoZoomStates.get(vidId);
            if (!state) return;

            // Apply CSS transform for scaling and translation
            videoElement.style.transform = `scale(${state.currentScale}) translate(${state.offsetX}px, ${state.offsetY}px)`;
            videoElement.style.transformOrigin = 'center center'; // Ensures zooming/panning is from the center

            // Update cursor and container class based on zoom state
            if (state.isZoomed) {
                containerElement.classList.add('video-zoomed');
                videoElement.style.cursor = isDragging ? 'grabbing' : 'grab';
            } else {
                containerElement.classList.remove('video-zoomed');
                videoElement.style.cursor = 'zoom-in'; // Default cursor when not zoomed
                // Reset transform when not zoomed to avoid artifacts
                videoElement.style.transform = 'none';
            }
        }

        // --- Mouse Down / Touch Start for Dragging (Panning) ---
        containerElement.addEventListener('mousedown', (e) => {
            const state = videoZoomStates.get(videoElement.id);
            // Only enable dragging if zoomed and left mouse button is pressed
            if (state && state.isZoomed && e.button === 0) {
                isDragging = true;
                // Calculate start position relative to the video's current transform
                startX = e.clientX - state.offsetX;
                startY = e.clientY - state.offsetY;
                videoElement.style.cursor = 'grabbing'; // Indicate active dragging
                containerElement.classList.add('dragging'); // Add class for visual feedback
                e.preventDefault(); // Prevent default browser drag behavior
            }
        });

        // --- Mouse Move / Touch Move for Dragging (Panning) ---
        containerElement.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            // Calculate new offsets based on mouse movement
            state.offsetX = e.clientX - startX;
            state.offsetY = e.clientY - startY;

            applyTransform(videoElement.id); // Apply the new transform
        });

        // --- Mouse Up / Touch End to Stop Dragging ---
        // Listen on `document` to ensure drag stops even if mouse leaves container
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                const state = videoZoomStates.get(videoElement.id);
                if (state && state.isZoomed) {
                    videoElement.style.cursor = 'grab'; // Restore grab cursor
                }
                containerElement.classList.remove('dragging'); // Remove dragging class
            }
        });

        // --- Click/Tap to Toggle Zoom ---
        containerElement.addEventListener('click', (e) => {
            // Only toggle zoom if not dragging (to distinguish click from drag-end)
            if (isDragging) return;

            const state = videoZoomStates.get(videoElement.id);
            if (!state) return;

            if (state.isZoomed) {
                // If zoomed, reset to original size (zoom out)
                state.currentScale = minZoom;
                state.isZoomed = false;
                state.offsetX = 0; // Reset pan offsets
                state.offsetY = 0;
            } else {
                // If not zoomed, zoom in to default level
                state.currentScale = defaultZoom;
                state.isZoomed = true;
            }
            applyTransform(videoElement.id); // Apply the new zoom state
        });
    }

    // --- Whiteboard Functions ---

    /**
     * Initializes the whiteboard canvas context and attaches all necessary
     * event listeners for drawing, tool selection, and page navigation.
     */
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
            console.error("[Whiteboard] Whiteboard canvas element not found. Cannot set up controls.");
            return;
        }
        if (!whiteboardCtx) { // Ensure context is only created once
            whiteboardCtx = whiteboardCanvas.getContext('2d');
            console.log('[Whiteboard] Whiteboard 2D context initialized.');
        }

        // Set initial canvas drawing styles (these will be overridden by item-specific styles when drawing)
        whiteboardCtx.lineJoin = 'round'; // Smooth line joins
        whiteboardCtx.lineCap = 'round'; // Rounded line caps
        // Current brush size and color are handled per item by drawWhiteboardItem
        whiteboardCtx.globalCompositeOperation = 'source-over'; // Default blending mode

        // Resize canvas to fit its container initially and on window resize
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // --- Drawing Event Listeners (Mouse & Touch) ---
        // These listeners are global to the canvas and will be conditionally handled based on the current tool.
        whiteboardCanvas.addEventListener('mousedown', handleDrawingStart);
        whiteboardCanvas.addEventListener('mousemove', handleDrawingMove);
        whiteboardCanvas.addEventListener('mouseup', handleDrawingEnd);
        whiteboardCanvas.addEventListener('mouseout', handleDrawingEnd); // End drawing if mouse leaves canvas

        // Passive false for touch events to allow `e.preventDefault()` for preventing scrolling
        whiteboardCanvas.addEventListener('touchstart', handleDrawingStart, { passive: false });
        whiteboardCanvas.addEventListener('touchmove', handleDrawingMove, { passive: false });
        whiteboardCanvas.addEventListener('touchend', handleDrawingEnd);
        whiteboardCanvas.addEventListener('touchcancel', handleDrawingEnd); // Handle cancelled touches

        // --- UI Control Event Listeners ---
        // Tool selection buttons
        toolButtons.forEach(button => {
            button.addEventListener('click', (e) => selectTool(e.currentTarget.dataset.tool));
        });

        // Color picker and brush size slider
        if (colorPicker) colorPicker.addEventListener('input', updateColor);
        if (brushSizeSlider) brushSizeSlider.addEventListener('input', updateBrushSize);

        // Undo, Redo, Clear, Save buttons
        if (undoButton) undoButton.addEventListener('click', undo);
        if (redoButton) redoButton.addEventListener('click', redo);
        if (clearButton) clearButton.addEventListener('click', () => clearCanvas(true)); // Pass true to emit event
        if (saveButton) saveButton.addEventListener('click', saveImage);

        // Whiteboard page navigation
        if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', goToPreviousWhiteboardPage);
        if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', goToNextWhiteboardPage);

        // Initial render and UI updates for whiteboard
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        updateUndoRedoButtons();
        selectTool(currentTool); // Ensure initial tool is highlighted
        updateUIBasedOnRole(); // Apply role-based disablement/enablement
    }

    /**
     * Resizes the whiteboard canvas to fit its parent container,
     * maintaining a reasonable aspect ratio and redrawing content.
     */
    function resizeCanvas() {
        if (!whiteboardCanvas || !whiteboardCanvas.parentElement) {
            console.warn('[Whiteboard] Cannot resize canvas: element or parent not found.');
            return;
        }

        const container = whiteboardCanvas.parentElement;
        const aspectRatio = 16 / 9; // Common aspect ratio (e.g., 1200x675)
        let newWidth = container.clientWidth;
        let newHeight = newWidth / aspectRatio;

        // Ensure the canvas doesn't exceed a certain percentage of window height
        const maxHeight = window.innerHeight * 0.75; // Example: 75% of viewport height
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }

        // Apply new dimensions directly to the canvas element
        whiteboardCanvas.width = newWidth;
        whiteboardCanvas.height = newHeight;

        // Reapply CSS styles that might be reset (like background color)
        whiteboardCanvas.style.backgroundColor = '#000000'; // Ensure background is black

        console.log(`[Whiteboard] Canvas resized to: ${whiteboardCanvas.width}x${whiteboardCanvas.height}`);

        // Reapply context settings after resize, as resizing clears them
        if (whiteboardCtx) {
            whiteboardCtx.lineJoin = 'round';
            whiteboardCtx.lineCap = 'round';
            // Current brush size and color are set by drawWhiteboardItem for each item, not globally here.
            whiteboardCtx.globalCompositeOperation = 'source-over'; // Reset blending mode
        }

        renderCurrentWhiteboardPage(); // Redraw all content on the current page after resize
    }

    /**
     * Handles the `mousedown` or `touchstart` event on the canvas.
     * Initializes drawing state, captures start coordinates, and manages tool-specific behaviors.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function handleDrawingStart(e) {
        if (currentUser.role !== 'admin') {
            showNotification('Only administrators can draw on the whiteboard.', true);
            return;
        }
        e.preventDefault(); // Prevent default touch actions like scrolling

        const coords = getCanvasCoords(e);
        startX = coords.x;
        startY = coords.y;

        // Commit any active text input if a new drawing action starts.
        if (activeTextInput) {
            commitText(e); // Commit existing text before starting new action.
        }

        if (currentTool === 'text') {
            // Check if clicking on existing text for dragging
            const textItem = findTextItemAtCoords(coords.x, coords.y);
            if (textItem) {
                isDraggingText = true;
                draggedTextItemIndex = whiteboardPages[currentPageIndex].indexOf(textItem);
                dragStartOffsetX = coords.x - textItem.x;
                dragStartOffsetY = coords.y - textItem.y;
                console.log(`[Text Tool] Started dragging text item at index ${draggedTextItemIndex}. Initial click offset: (${dragStartOffsetX}, ${dragStartOffsetY})`);
                return; // Don't start drawing a new text box, just drag.
            } else {
                // If not clicking on existing text, create a new text input
                createTextInput(coords.x, coords.y);
                return; // Text input created, no further drawing actions for now.
            }
        }

        // For drawing tools (pen, eraser, shapes)
        isDrawing = true; // Set drawing flag
        currentStrokePoints = []; // Reset for new stroke
        temporaryShapeData = null; // Reset for new shape

        // Store initial point for pen/eraser
        if (currentTool === 'pen' || currentTool === 'eraser') {
            currentStrokePoints.push({ x: startX, y: startY, width: currentBrushSize });
        }
        console.log(`[Whiteboard] Drawing started with tool '${currentTool}' at (${startX}, ${startY}).`);
    }

    /**
     * Handles the `mousemove` or `touchmove` event on the canvas.
     * Continuously draws, updates shape previews, or drags text based on the current tool.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function handleDrawingMove(e) {
        if (!isDrawing && !isDraggingText) return; // Only proceed if an action is active
        if (currentUser.role !== 'admin') return; // Only admins can draw/drag
        e.preventDefault(); // Prevent default browser behavior (e.g., scrolling)

        const coords = getCanvasCoords(e);
        const currentX = coords.x;
        const currentY = coords.y;

        if (isDraggingText) {
            if (draggedTextItemIndex === -1 || !whiteboardPages[currentPageIndex][draggedTextItemIndex]) {
                console.warn('[Text Tool] Attempted to drag text but item not found or index invalid.');
                isDraggingText = false;
                draggedTextItemIndex = -1;
                return;
            }
            // Update the text item's position
            const textItem = whiteboardPages[currentPageIndex][draggedTextItemIndex];
            textItem.x = currentX - dragStartOffsetX;
            textItem.y = currentY - dragStartOffsetY;
            renderCurrentWhiteboardPage(); // Redraw the page to show text in new position
            return;
        }

        // Handle drawing tools (pen, eraser, shapes)
        if (currentTool === 'pen' || currentTool === 'eraser') {
            const lastPoint = currentStrokePoints[currentStrokePoints.length - 1];
            // Only add if moved a significant distance or is the first point after startX,startY
            if (!lastPoint || (Math.abs(currentX - lastPoint.x) > 1 || Math.abs(currentY - lastPoint.y) > 1)) {
                 currentStrokePoints.push({ x: currentX, y: currentY, width: currentBrushSize });

                // Render the entire page to show the continuous stroke, including previous items.
                // This approach ensures shapes underneath are not temporarily erased.
                renderCurrentWhiteboardPage();

                // Draw the very last segment directly for smoother real-time feedback.
                // This segment will be covered by the next full render, but gives immediate visual.
                whiteboardCtx.save();
                // Eraser should draw black color, not make transparent.
                whiteboardCtx.globalCompositeOperation = 'source-over';
                whiteboardCtx.strokeStyle = (currentTool === 'eraser') ? '#000000' : currentColor; // Eraser draws black
                whiteboardCtx.lineWidth = currentBrushSize;
                whiteboardCtx.beginPath();
                if(lastPoint) { // Only draw segment if there's a previous point
                    whiteboardCtx.moveTo(lastPoint.x, lastPoint.y);
                    whiteboardCtx.lineTo(currentX, currentY);
                    whiteboardCtx.stroke();
                } else { // Draw a dot if it's the very first point of the stroke
                    whiteboardCtx.arc(currentX, currentY, currentBrushSize / 2, 0, Math.PI * 2);
                    whiteboardCtx.fill();
                }
                whiteboardCtx.restore();

                // Emit small segments of the stroke for real-time sync with other users
                // This is a trade-off: sending all points constantly is too much, segments help.
                if (currentStrokePoints.length % 5 === 0) {
                     const tempStroke = {
                        type: currentTool,
                        points: currentStrokePoints.slice(-5), // Send only the last few points
                        color: (currentTool === 'eraser') ? '#000000' : currentColor, // Eraser draws black
                        size: currentBrushSize
                    };
                    emitWhiteboardData('draw', tempStroke);
                }
            }

        } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            // For shapes, update the temporaryShapeData and re-render the entire page.
            // This re-render includes all previous items + the current shape preview.
            temporaryShapeData = buildShapeData(currentTool, startX, startY, currentX, currentY);
            renderCurrentWhiteboardPage(); // Render all existing items first
            drawWhiteboardItem(temporaryShapeData); // Then draw the temporary shape on top
        }
    }

    /**
     * Handles the `mouseup`, `mouseout`, `touchend`, or `touchcancel` event on the canvas.
     * Finalizes the drawing action, adds the complete drawing to the page's history,
     * emits the complete drawing data, and saves state for undo/redo.
     * @param {MouseEvent|TouchEvent} e - The event object.
     */
    function handleDrawingEnd(e) {
        if (!isDrawing && !isDraggingText) return; // Only proceed if an action was active
        if (currentUser.role !== 'admin') return; // Only admins can draw/drag
        e.preventDefault();

        // Handle text dragging end
        if (isDraggingText) {
            isDraggingText = false;
            if (draggedTextItemIndex !== -1) {
                // Emit update for dragged text and push to undo stack
                const textItem = whiteboardPages[currentPageIndex][draggedTextItemIndex];
                // Only emit if the position actually changed to avoid unnecessary network traffic/history pushes
                const originalTextItem = undoStack[undoStack.length - 1][draggedTextItemIndex]; // Assuming last undo state holds original
                if (originalTextItem && (originalTextItem.x !== textItem.x || originalTextItem.y !== textItem.y)) {
                    emitWhiteboardData('draw', textItem); // Re-emit the updated text item
                    pushToUndoStack();
                    console.log(`[Text Tool] Finished dragging text item. New position: (${textItem.x}, ${textItem.y})`);
                } else {
                    console.log('[Text Tool] Text drag ended, but position did not change. No emission or undo push.');
                }
            }
            draggedTextItemIndex = -1;
            return;
        }

        // Handle drawing tools (pen, eraser, shapes)
        isDrawing = false; // Stop drawing
        if (currentTool === 'pen' || currentTool === 'eraser') {
            // If it was just a click (single point) or a very short drag
            if (currentStrokePoints.length <= 1) {
                const p = currentStrokePoints[0] || { x: startX, y: startY };
                const dotData = {
                    type: currentTool,
                    points: [{ x: p.x, y: p.y, width: currentBrushSize }],
                    color: (currentTool === 'eraser') ? '#000000' : currentColor, // Eraser draws black
                    size: currentBrushSize
                };
                whiteboardPages[currentPageIndex].push(dotData); // Add to local history
                emitWhiteboardData('draw', dotData); // Emit to others
                console.log(`[Whiteboard] Emitted dot data: (${p.x}, ${p.y}) for tool '${currentTool}'`);
            } else if (currentStrokePoints.length > 1) {
                // Finalize and emit the complete stroke
                const strokeData = {
                    type: currentTool,
                    points: currentStrokePoints,
                    color: (currentTool === 'eraser') ? '#000000' : currentColor, // Eraser draws black
                    size: currentBrushSize
                };
                whiteboardPages[currentPageIndex].push(strokeData); // Add to local history
                emitWhiteboardData('draw', strokeData); // Emit to others
                console.log(`[Whiteboard] Emitted stroke data with ${currentStrokePoints.length} points for tool '${currentTool}'`);
            }
            currentStrokePoints = []; // Reset points for next stroke
        } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            const coords = getCanvasCoords(e);
            const shapeData = buildShapeData(currentTool, startX, startY, coords.x, coords.y);
            
            // Only add if the shape has a meaningful size (e.g., not a tiny dot)
            const minSizeThreshold = 2; // Pixels
            let isMeaningful = true;
            if (currentTool === 'line') {
                isMeaningful = Math.abs(shapeData.startX - shapeData.endX) > minSizeThreshold || Math.abs(shapeData.startY - shapeData.endY) > minSizeThreshold;
            } else if (currentTool === 'rectangle') {
                isMeaningful = shapeData.width > minSizeThreshold && shapeData.height > minSizeThreshold;
            } else if (currentTool === 'circle') {
                isMeaningful = shapeData.radius > minSizeThreshold;
            }

            if (isMeaningful) {
                whiteboardPages[currentPageIndex].push(shapeData); // Add to local history
                emitWhiteboardData('draw', shapeData); // Emit to others
                console.log(`[Whiteboard] Emitted shape data for tool '${currentTool}':`, shapeData);
            } else {
                console.log(`[Whiteboard] Skipping tiny shape for tool '${currentTool}':`, shapeData);
            }
            
            temporaryShapeData = null; // Clear temporary shape data
        }
        
        // After any drawing ends (or text drag ends), re-render the entire page to ensure consistent state
        renderCurrentWhiteboardPage();
        
        // Only push to undo stack if an actual modification happened (not just a drag preview)
        pushToUndoStack(); 
        console.log(`[Whiteboard] Drawing ended with tool '${currentTool}'.`);
    }

    /**
     * Helper function to find a text item at given canvas coordinates.
     * @param {number} x - X coordinate on canvas.
     * @param {number} y - Y coordinate on canvas.
     * @returns {object|null} The text item object if found, otherwise null.
     */
    function findTextItemAtCoords(x, y) {
        const currentPageCommands = whiteboardPages[currentPageIndex];
        if (!currentPageCommands) return null;

        // Iterate through text items in reverse to pick the topmost (most recently drawn)
        for (let i = currentPageCommands.length - 1; i >= 0; i--) {
            const item = currentPageCommands[i];
            if (item.type === 'text' && item.x && item.y && item.text) {
                // For text, 'y' is the baseline. We need to approximate its bounding box.
                // Measure the text width on the canvas context (need to set font first).
                whiteboardCtx.save();
                whiteboardCtx.font = `${item.size}px Inter, sans-serif`;
                const textWidth = whiteboardCtx.measureText(item.text).width;
                const textHeight = item.size || currentBrushSize * 2; // Approximate height of the font

                // Adjust y-coordinate to be the top of the text box for comparison
                const textTopY = item.y - textHeight;
                whiteboardCtx.restore();

                // Give a little padding for easier click/touch
                const padding = 5;
                if (x >= (item.x - padding) && x <= (item.x + textWidth + padding) &&
                    y >= (textTopY - padding) && y <= (item.y + padding)) {
                    console.log(`[Text Tool] Found text item at (${item.x}, ${item.y}) with text: "${item.text}"`);
                    return item;
                }
            }
        }
        return null;
    }


    /**
     * Helper function to construct shape data object for emission and storage.
     * @param {string} tool - The shape tool ('line', 'rectangle', 'circle').
     * @param {number} sx - Start X coordinate.
     * @param {number} sy - Start Y coordinate.
     * @param {number} ex - End X coordinate.
     * @param {number} ey - End Y coordinate.
     * @returns {object} The shape data object.
     */
    function buildShapeData(tool, sx, sy, ex, ey) {
        const baseData = { type: tool, color: currentColor, size: currentBrushSize };
        switch (tool) {
            case 'line':
                console.log(`[buildShapeData] Line from (${sx}, ${sy}) to (${ex}, ${ey})`);
                return { ...baseData, startX: sx, startY: sy, endX: ex, endY: ey };
            case 'rectangle':
                // Normalize width/height to be positive for consistent rendering
                const rectX = Math.min(sx, ex);
                const rectY = Math.min(sy, ey);
                const width = Math.abs(ex - sx);
                const height = Math.abs(ey - sy);
                console.log(`[buildShapeData] Rect at (${rectX}, ${rectY}) with dimensions (${width}, ${height})`);
                return { ...baseData, startX: rectX, startY: rectY, width: width, height: height };
            case 'circle':
                // Calculate center and radius based on defining a bounding box by start/end points
                const centerX = (sx + ex) / 2;
                const centerY = (sy + ey) / 2;
                // Radius is half the distance from start to end (diagonal of bounding box)
                const radius = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) / 2;
                console.log(`[buildShapeData] Circle at center (${centerX}, ${centerY}) with radius ${radius}`);
                return { ...baseData, centerX: centerX, centerY: centerY, radius: radius };
            default:
                return baseData;
        }
    }


    /**
     * Draws a single whiteboard item (stroke, shape, or text) onto the canvas.
     * This function applies styling, draws the item, and then restores the context.
     * @param {object} item - Object containing drawing command details (type, coordinates, style, etc.).
     */
    function drawWhiteboardItem(item) {
        if (!whiteboardCtx || !item || typeof item.type === 'undefined') {
            console.warn('[Whiteboard] Attempted to draw invalid whiteboard item:', item);
            return;
        }

        whiteboardCtx.save(); // Save the current canvas context state before applying item-specific styles

        // Apply shared styles from the drawing item, falling back to current global tool settings
        whiteboardCtx.strokeStyle = item.color || currentColor;
        whiteboardCtx.lineWidth = item.size || currentBrushSize;
        whiteboardCtx.fillStyle = item.color || currentColor;
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';

        // Set globalCompositeOperation based on item type
        // Eraser now draws with background color (black)
        whiteboardCtx.globalCompositeOperation = 'source-over'; // Default for all, including eraser

        if (item.type === 'eraser') {
            whiteboardCtx.strokeStyle = '#000000'; // Eraser draws black
            whiteboardCtx.fillStyle = '#000000'; // Also for filled shapes if eraser was misused
        }


        switch (item.type) {
            case 'pen':
            case 'eraser':
                if (!item.points || item.points.length === 0) break;

                // Draw a dot if it's a single point (click)
                if (item.points.length === 1) {
                    const p = item.points[0];
                    whiteboardCtx.beginPath();
                    whiteboardCtx.arc(p.x, p.y, (p.width || item.size) / 2, 0, Math.PI * 2);
                    whiteboardCtx.fill();
                    break;
                }

                // Draw continuous strokes using quadratic curves for smoother lines
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.points[0].x, item.points[0].y);
                for (let i = 1; i < item.points.length - 1; i++) {
                    const p1 = item.points[i];
                    const p2 = item.points[i + 1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    whiteboardCtx.lineWidth = p1.width || item.size; // Use dynamic width from point if available
                    whiteboardCtx.quadraticCurveTo(p1.x, p1.y, midX, midY);
                }
                // Draw the last segment to ensure the end of the stroke is included
                const lastPoint = item.points[item.points.length - 1];
                const secondLastPoint = item.points[item.points.length - 2];
                if (secondLastPoint && lastPoint) {
                    whiteboardCtx.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);
                } else if (lastPoint) { // Case for a stroke with only 2 points
                     whiteboardCtx.lineTo(lastPoint.x, lastPoint.y);
                }
                whiteboardCtx.stroke();
                break;

            case 'line':
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.startX, item.startY);
                whiteboardCtx.lineTo(item.endX, item.endY);
                whiteboardCtx.stroke();
                break;

            case 'rectangle':
                whiteboardCtx.beginPath();
                // Stroke rectangles by default. Could add an 'item.fill' property if filled shapes are needed.
                whiteboardCtx.strokeRect(item.startX, item.startY, item.width, item.height);
                break;

            case 'circle':
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(item.centerX, item.centerY, item.radius, 0, Math.PI * 2);
                // Stroke circles by default. Could add an 'item.fill' property if filled shapes are needed.
                whiteboardCtx.stroke();
                break;

            case 'text':
                // Set font style and draw text
                // Adjust font size dynamically if canvas is resized.
                const scaledFontSize = item.size; // No dynamic scaling for now, use original size
                whiteboardCtx.font = `${scaledFontSize}px Inter, sans-serif`;
                // Split text by newlines and draw each line
                const lines = item.text.split('\n');
                lines.forEach((line, i) => {
                    whiteboardCtx.fillText(line, item.x, item.y + i * scaledFontSize * 1.2); // 1.2 for line spacing
                });
                break;
        }
        whiteboardCtx.restore(); // Restore the canvas context to its previous state
    }

    /**
     * Gets mouse or touch coordinates relative to the canvas.
     * Handles both `MouseEvent` and `TouchEvent` objects.
     * @param {MouseEvent|TouchEvent} e - The event object.
     * @returns {{x: number, y: number}} An object with x and y coordinates.
     */
    function getCanvasCoords(e) {
        if (!whiteboardCanvas) return { x: 0, y: 0 };
        const rect = whiteboardCanvas.getBoundingClientRect();
        let clientX, clientY;

        // Differentiate between mouse and touch events
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calculate coordinates relative to the canvas
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    /**
     * Selects the active drawing tool and updates UI.
     * @param {string} tool - The tool to select ('pen', 'eraser', 'line', 'rectangle', 'circle', 'text').
     */
    function selectTool(tool) {
        currentTool = tool;
        // Update active class on tool buttons
        toolButtons.forEach(button => {
            if (button.dataset.tool === tool) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // If switching away from text tool, commit any active text
        if (activeTextInput && tool !== 'text') {
            commitText(null); // Commit and remove the textarea
        }
        // Set appropriate cursor based on the selected tool
        if (currentTool === 'text') {
            whiteboardCanvas.style.cursor = 'text';
        } else {
            whiteboardCanvas.style.cursor = 'crosshair'; // Default for drawing tools
        }
        
        showNotification(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected.`);
        console.log(`[Whiteboard] Tool selected: ${tool}.`);
    }

    /**
     * Updates the current drawing color from the color picker.
     */
    function updateColor() {
        if (colorPicker) {
            currentColor = colorPicker.value;
            console.log(`[Whiteboard] Color updated to: ${currentColor}`);
        }
    }

    /**
     * Updates the current brush/stroke size from the slider.
     */
    function updateBrushSize() {
        if (brushSizeSlider) {
            currentBrushSize = parseInt(brushSizeSlider.value, 10);
            console.log(`[Whiteboard] Brush size updated to: ${currentBrushSize}`);
        }
    }

    /**
     * Creates and places a temporary textarea element on the canvas for text input.
     * @param {number} x - X coordinate for placement.
     * @param {number} y - Y coordinate for placement.
     */
    function createTextInput(x, y) {
        if (activeTextInput) { // Commit any existing text before creating a new one
            commitText(null);
        }

        activeTextInput = document.createElement('textarea');
        activeTextInput.classList.add('whiteboard-text-input');
        // Position the textarea absolutely over the canvas
        // We add whiteboardCanvas.offsetLeft/Top to convert canvas-relative coords to document-relative coords for textarea
        activeTextInput.style.position = 'absolute';
        activeTextInput.style.left = `${x + whiteboardCanvas.offsetLeft}px`;
        activeTextInput.style.top = `${y + whiteboardCanvas.offsetTop}px`;
        activeTextInput.style.font = `${currentBrushSize * 2}px Inter, sans-serif`;
        activeTextInput.style.color = currentColor;
        activeTextInput.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Slightly visible background
        activeTextInput.style.border = '1px dashed #fff';
        activeTextInput.style.resize = 'none';
        activeTextInput.style.overflow = 'hidden';
        activeTextInput.style.padding = '2px';
        activeTextInput.style.zIndex = '10'; // Ensure it's above the canvas

        // Adjust dimensions dynamically
        activeTextInput.style.width = '200px'; // Initial width
        activeTextInput.style.height = `${currentBrushSize * 2 * 1.5}px`; // Initial height for one line
        activeTextInput.rows = 1;
        
        whiteboardArea.appendChild(activeTextInput); // Append to whiteboardArea, not canvas directly
        activeTextInput.focus();

        const adjustHeight = () => {
            activeTextInput.style.height = 'auto';
            activeTextInput.style.height = `${activeTextInput.scrollHeight}px`;
        };

        activeTextInput.addEventListener('input', adjustHeight);
        activeTextInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) { // Commit on Enter, allow Shift+Enter for new line
                event.preventDefault();
                commitText(event);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                removeTextInput();
                showNotification('Text input cancelled.');
            }
        });
        activeTextInput.addEventListener('blur', commitText); // Commit when textarea loses focus

        console.log(`[Text Tool] Created new text input at (${x}, ${y}).`);
        adjustHeight(); // Initial height adjustment
    }

    /**
     * Commits the text from the active textarea to the whiteboard as a drawing item.
     * @param {Event|null} event - The event that triggered the commit (e.g., blur, Enter key).
     */
    function commitText(event) {
        if (!activeTextInput || !activeTextInput.value.trim()) {
            removeTextInput(); // Just remove if empty
            return;
        }
        
        const text = activeTextInput.value.trim();
        const textX = parseInt(activeTextInput.style.left, 10) - whiteboardCanvas.offsetLeft;
        const textY = parseInt(activeTextInput.style.top, 10) - whiteboardCanvas.offsetTop;

        const textData = {
            type: 'text',
            text: text,
            x: textX,
            y: textY, // Y is the top of the textarea, `drawWhiteboardItem` adjusts for baseline
            color: currentColor,
            size: currentBrushSize * 2
        };

        whiteboardPages[currentPageIndex].push(textData);
        emitWhiteboardData('draw', textData);
        pushToUndoStack(); // Save state for undo

        removeTextInput(); // Remove the textarea after committing
        renderCurrentWhiteboardPage(); // Redraw the canvas to show the committed text.
        showNotification('Text added to whiteboard.');
        console.log(`[Text Tool] Committed text: '${text}' at (${textX}, ${textY}).`);
    }

    /**
     * Removes the active textarea element from the DOM.
     */
    function removeTextInput() {
        if (activeTextInput) {
            activeTextInput.remove();
            activeTextInput = null;
            console.log('[Text Tool] Removed active text input.');
        }
        // Restore cursor, considering if text tool is still selected or switched
        whiteboardCanvas.style.cursor = currentTool === 'text' ? 'text' : 'crosshair'; 
    }


    /**
     * Clears the current whiteboard page. Optionally emits a clear event to the server.
     * Only administrators are allowed to clear the canvas.
     * @param {boolean} [emitEvent=true] - Whether to emit the clear event to the Socket.IO server.
     */
    function clearCanvas(emitEvent = true) {
        if (currentUser.role !== 'admin') {
            showNotification("Only administrators can clear the whiteboard.", true);
            return;
        }
        // Use a custom modal or notification for confirmation instead of `confirm()`
        // For now, a simple confirm dialog for quick implementation.
        // In a production app, replace with a custom modal.
        if (!window.confirm(`Are you sure you want to clear page ${currentPageIndex + 1}? This cannot be undone by other users.`)) {
            return; // User cancelled
        }

        whiteboardPages[currentPageIndex] = []; // Clear local drawing data for the current page
        renderCurrentWhiteboardPage(); // Re-render to show an empty page
        pushToUndoStack(); // Push the cleared state to undo stack (so undo can restore previous state)
        
        if (emitEvent && socket && currentClassroom && currentClassroom.id) {
            emitWhiteboardData('clear', {}); // Emit clear event
            console.log(`[Whiteboard] Emitted 'clear' event for page ${currentPageIndex + 1}.`);
        }
        showNotification(`Whiteboard page ${currentPageIndex + 1} cleared.`);
    }

    /**
     * Saves the current whiteboard canvas content as a PNG image file.
     * Only administrators are allowed to save the image.
     */
    function saveImage() {
        if (currentUser.role !== 'admin') {
            showNotification("Only administrators can save the whiteboard image.", true);
            return;
        }
        if (!whiteboardCanvas) {
            console.warn('[Whiteboard] Canvas not found. Cannot save image.');
            showNotification('Whiteboard canvas not available to save.', true);
            return;
        }
        const dataURL = whiteboardCanvas.toDataURL('image/png'); // Get canvas content as data URL
        const a = document.createElement('a'); // Create a temporary anchor element
        a.href = dataURL;
        a.download = `whiteboard_page_${currentPageIndex + 1}_${Date.now()}.png`; // Suggested filename
        document.body.appendChild(a); // Append to body (required for Firefox)
        a.click(); // Programmatically click to trigger download
        document.body.removeChild(a); // Remove the temporary element
        showNotification('Whiteboard saved as an image.');
        console.log(`[Whiteboard] Page ${currentPageIndex + 1} saved as image.`);
    }

    /**
     * Saves a deep copy of the current page's drawing commands to the `undoStack`.
     * Clears the `redoStack` whenever a new state is pushed.
     */
    function pushToUndoStack() {
        // Deep copy the array of drawing commands for the current page
        // This ensures that the undo stack stores distinct states, not references
        const currentStateCopy = JSON.parse(JSON.stringify(whiteboardPages[currentPageIndex] || []));
        undoStack.push(currentStateCopy);
        if (undoStack.length > MAX_HISTORY_STEPS) {
            undoStack.shift(); // Remove the oldest state if stack size exceeds limit
        }
        redoStack = []; // Clear redo stack on any new action
        updateUndoRedoButtons(); // Update button enabled/disabled states
        console.log(`[Whiteboard] State saved for undo. Undo stack size: ${undoStack.length}`);
    }

    /**
     * Performs an undo operation: restores the previous whiteboard state for the current page.
     */
    function undo() {
        if (undoStack.length > 1) { // Need at least one state to revert *to* (the one before the last action)
            const lastState = undoStack.pop(); // Remove the current state from undo stack
            redoStack.push(lastState); // Push it to redo stack
            whiteboardPages[currentPageIndex] = JSON.parse(JSON.stringify(undoStack[undoStack.length - 1])); // Load the previous state (deep copy)
            renderCurrentWhiteboardPage(); // Redraw the canvas with the restored state
            updateUndoRedoButtons();
            showNotification("Undo action performed.");
            console.log(`[Whiteboard] Undo successful. Undo stack: ${undoStack.length}, Redo stack: ${redoStack.length}`);
        } else if (undoStack.length === 1) { // Special case: going back to the initial empty state
            const lastState = undoStack.pop();
            redoStack.push(lastState);
            whiteboardPages[currentPageIndex] = []; // Effectively clear the page
            renderCurrentWhiteboardPage();
            updateUndoRedoButtons();
            showNotification("Undo to empty page performed.");
            console.log(`[Whiteboard] Undo to empty. Undo stack: ${undoStack.length}, Redo stack: ${redoStack.length}`);
        } else {
            showNotification("Nothing to undo.", true);
            console.warn('[Whiteboard] Undo failed: Undo stack is empty.');
        }
    }

    /**
     * Performs a redo operation: reapplies the last undone whiteboard state for the current page.
     */
    function redo() {
        if (redoStack.length > 0) {
            const nextState = redoStack.pop(); // Get the last undone state from redo stack
            undoStack.push(JSON.parse(JSON.stringify(nextState))); // Push it back to undo stack (deep copy)
            whiteboardPages[currentPageIndex] = JSON.parse(JSON.stringify(nextState)); // Apply the state to the current page (deep copy)
            renderCurrentWhiteboardPage(); // Redraw the canvas
            updateUndoRedoButtons();
            showNotification("Redo action performed.");
            console.log(`[Whiteboard] Redo successful. Undo stack: ${undoStack.length}, Redo stack: ${redoStack.length}`);
        } else {
            showNotification("Nothing to redo.", true);
            console.warn('[Whiteboard] Redo failed: Redo stack is empty.');
        }
    }

    /**
     * Updates the `disabled` state of the undo and redo buttons based on stack contents.
     */
    function updateUndoRedoButtons() {
        // Disable if not admin, or if stack state doesn't allow (e.g., only initial empty state for undo)
        if (undoButton) undoButton.disabled = !currentUser || currentUser.role !== 'admin' || undoStack.length <= 1;
        if (redoButton) redoButton.disabled = !currentUser || currentUser.role !== 'admin' || redoStack.length === 0;
    }

    /**
     * Fetches whiteboard history for all pages from the server.
     * This is called on classroom entry after Socket.IO connection is established.
     */
    async function fetchWhiteboardHistory() {
        if (!currentClassroom || !currentClassroom.id) {
            console.warn("[Whiteboard] Cannot fetch whiteboard history: No current classroom ID available.");
            return;
        }
        if (!socket || !socket.connected) {
            console.warn("[Whiteboard] Cannot fetch whiteboard history: Socket.IO is not connected.");
            return;
        }

        try {
            console.log(`[Whiteboard] Requesting whiteboard history for classroom ${currentClassroom.id}...`);
            const response = await fetch(`/api/whiteboard-history/${currentClassroom.id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log("[Whiteboard] No whiteboard history found for this classroom. Starting with a fresh page.");
                    whiteboardPages = [[]]; // Initialize with one empty page
                    currentPageIndex = 0;
                    renderCurrentWhiteboardPage();
                    updateWhiteboardPageDisplay();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Server should return `data.history` as an array of page drawing commands
            whiteboardPages = data.history && Array.isArray(data.history) ? data.history : [[]];
            if (whiteboardPages.length === 0) {
                whiteboardPages = [[]]; // Ensure at least one page exists
            }
            currentPageIndex = 0; // Always reset to the first page when history is loaded
            renderCurrentWhiteboardPage(); // Render the content of the first page
            updateWhiteboardPageDisplay(); // Update the page indicator
            pushToUndoStack(); // Save this initial state to undo stack
            showNotification("Whiteboard history loaded successfully.");
            console.log(`[Whiteboard] Whiteboard history loaded. Total pages: ${whiteboardPages.length}`);
        } catch (error) {
            console.error("[Whiteboard] Error fetching whiteboard history:", error);
            whiteboardPages = [[]]; // Fallback to an empty whiteboard on error
            currentPageIndex = 0;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            showNotification("Failed to load whiteboard history.", true);
        }
    }

    /**
     * Renders all drawing commands for the `currentPageIndex` onto the canvas.
     * Clears the canvas and redraws all items for the current page.
     */
    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx || !whiteboardCanvas) {
            console.warn('[Whiteboard] Cannot render page: Context or canvas not available.');
            return;
        }
        // Clear the canvas and set the black background
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Ensure background is black
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        const currentPageCommands = whiteboardPages[currentPageIndex];
        if (currentPageCommands && currentPageCommands.length > 0) {
            currentPageCommands.forEach(command => {
                drawWhiteboardItem(command); // Redraw each item
            });
            // console.log(`[Whiteboard] Rendered page ${currentPageIndex + 1} with ${currentPageCommands.length} items.`);
        } else {
            // console.log(`[Whiteboard] Page ${currentPageIndex + 1} is empty.`);
        }

        // If a temporary shape is being drawn, draw it on top of everything else
        if (temporaryShapeData) {
            drawWhiteboardItem(temporaryShapeData);
        }

        updateWhiteboardPageDisplay(); // Update page indicator after rendering
    }

    /**
     * Updates the whiteboard page display (e.g., "Page 1/3") and
     * enables/disables the page navigation buttons.
     */
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1}/${whiteboardPages.length}`;
        }
        if (prevWhiteboardPageBtn) {
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0; // Disable if on the first page
        }
        if (nextWhiteboardPageBtn) {
            // Next button is disabled if at the last page AND not admin (cannot create new pages)
            nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1 && (!currentUser || currentUser.role !== 'admin');
            // Always enabled for admin to allow adding new pages
            if (currentUser && currentUser.role === 'admin') nextWhiteboardPageBtn.disabled = false;
        }
    }

    /**
     * Navigates to the next whiteboard page. If at the last page, an admin can create a new page.
     */
    function goToNextWhiteboardPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            // Move to the next existing page
            currentPageIndex++;
            showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`);
            console.log(`[Whiteboard] Navigated to page ${currentPageIndex + 1}`);
        } else if (currentUser && currentUser.role === 'admin') {
            // If at the last page and current user is an admin, create a new empty page
            whiteboardPages.push([]); // Add a new empty page to the array
            currentPageIndex = whiteboardPages.length - 1; // Update index to the new page
            showNotification(`New whiteboard page ${currentPageIndex + 1} created.`);
            console.log(`[Whiteboard] Admin created new page ${currentPageIndex + 1}`);
        } else {
            showNotification("No next page available. Only administrators can create new pages.", true);
            console.warn('[Whiteboard] Cannot go to next page: No next page exists and user is not admin.');
            return;
        }
        renderCurrentWhiteboardPage(); // Render the new current page
        updateWhiteboardPageDisplay(); // Update page indicator and buttons
        pushToUndoStack(); // Save the new page's empty state to undo stack
        // Emit page change event to synchronize with other users
        emitWhiteboardPageChange(currentPageIndex);
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    function goToPreviousWhiteboardPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--; // Decrement page index
            renderCurrentWhiteboardPage(); // Render the previous page
            updateWhiteboardPageDisplay(); // Update page indicator and buttons
            pushToUndoStack(); // Save the previous page's state to undo stack
            // Emit page change event to synchronize with other users
            emitWhiteboardPageChange(currentPageIndex);
            showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`);
            console.log(`[Whiteboard] Navigated to page ${currentPageIndex + 1}`);
        } else {
            showNotification("Already on the first page.", true);
            console.warn('[Whiteboard] Cannot go to previous page: Already on page 1.');
        }
    }

    /**
     * Emits a whiteboard page change event to the Socket.IO server.
     * @param {number} newPageIndex - The index of the page to switch to.
     */
    function emitWhiteboardPageChange(newPageIndex) {
        if (socket && socket.connected && currentClassroom && currentClassroom.id) {
            console.log(`[Whiteboard] Emitting whiteboard_page_change to index ${newPageIndex}`);
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: newPageIndex,
                userId: currentUser.id,
                username: currentUser.username
            });
        } else {
            console.warn('[Whiteboard] Socket not connected or classroom not set. Cannot emit page change.');
        }
    }

    /**
     * Emits whiteboard drawing/clear data to the Socket.IO server.
     * @param {string} action - The action type (e.g., 'draw', 'clear').
     * @param {object} data - The drawing-specific data (e.g., stroke points, shape properties).
     */
    function emitWhiteboardData(action, data) {
        if (socket && socket.connected && currentClassroom && currentClassroom.id) {
            const payload = {
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex, // Include the current page index
                action: action,
                data: data,
                userId: currentUser.id, // Sender's user ID
                username: currentUser.username, // Sender's username
                role: currentUser.role // Sender's role
            };
            socket.emit('whiteboard_data', payload);
            // console.log(`[Whiteboard] Emitted '${action}' event for page ${currentPageIndex}. Data:`, data); // Log for debugging
        } else {
            console.warn('[Whiteboard] Socket not connected or classroom not set. Cannot emit whiteboard data.');
        }
    }


    // --- Chat Functions ---

    /**
     * Sets up event listeners for the chat input and send button.
     */
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', sendMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent default newline behavior in input
                    sendMessage();
                }
            });
        }
    }

    /**
     * Sends a chat message to the server via Socket.IO.
     * Includes sender's details and the current classroom ID.
     */
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && socket && currentClassroom && currentClassroom.id && currentUser) {
            console.log('[Chat] Sending message:', message);
            socket.emit('message', {
                classroomId: currentClassroom.id,
                message: message,
                username: currentUser.username, // Sender's username
                role: currentUser.role, // Sender's role
                userId: currentUser.id // Sender's ID
            });
            chatInput.value = ''; // Clear the input field after sending
        } else {
            console.warn('[Chat] Cannot send message: Message empty, socket not connected, or classroom/user info missing.');
            showNotification('Could not send message. Please ensure you are in a classroom and logged in.', true);
        }
    }

    // --- Library Functions ---

    /**
     * Loads and displays files present in the current classroom's library.
     * Includes search functionality to filter files.
     */
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            if (libraryFilesList) libraryFilesList.innerHTML = '<p>Select a classroom to view library files.</p>';
            console.warn('[Library] Cannot load files: No current classroom.');
            return;
        }

        try {
            const response = await fetch(`/api/library-files/${currentClassroom.id}`);
            if (!response.ok) {
                // If 404, it might mean no files yet, not necessarily an error
                if (response.status === 404) {
                    console.log('[Library] No library files found for this classroom.');
                    if (libraryFilesList) libraryFilesList.innerHTML = '<p>No files in this library yet.</p>';
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            let files = await response.json();

            const searchTerm = librarySearchInput.value.toLowerCase();
            if (searchTerm) {
                files = files.filter(file =>
                    (file.original_filename && file.original_filename.toLowerCase().includes(searchTerm)) ||
                    (file.filename && file.filename.toLowerCase().includes(searchTerm))
                );
            }

            if (libraryFilesList) libraryFilesList.innerHTML = ''; // Clear existing list

            if (files.length === 0) {
                if (libraryFilesList) libraryFilesList.innerHTML = '<p>No files found matching your search.</p>';
            } else {
                files.forEach(file => {
                    const fileDiv = document.createElement('div');
                    fileDiv.classList.add('library-file-item');
                    fileDiv.innerHTML = `
                        <span><a href="${file.url}" target="_blank" rel="noopener noreferrer" class="library-file-link">${file.original_filename || file.filename}</a></span>
                        ${currentUser && currentUser.role === 'admin' ? `<button class="delete-file-btn btn-danger" data-file-id="${file.id}">Delete</button>` : ''}
                    `;
                    if (libraryFilesList) libraryFilesList.appendChild(fileDiv);
                });

                // Attach event listeners for delete buttons (admin only)
                if (currentUser && currentUser.role === 'admin') {
                    document.querySelectorAll('.delete-file-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const fileId = e.target.dataset.fileId;
                            // Implement a custom confirmation dialog here in a real app
                            if (window.confirm('Are you sure you want to delete this file? This action is permanent.')) {
                                try {
                                    const response = await fetch(`/api/library-files/${fileId}`, {
                                        method: 'DELETE'
                                    });
                                    const result = await response.json();
                                    if (response.ok) {
                                        showNotification(result.message);
                                        loadLibraryFiles(); // Reload the list after deletion
                                    } else {
                                        showNotification(`Error deleting file: ${result.error}`, true);
                                    }
                                } catch (error) {
                                    console.error('Error deleting library file:', error);
                                    showNotification('An error occurred during file deletion.', true);
                                }
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            if (libraryFilesList) libraryFilesList.innerHTML = '<p>Failed to load library files. Please try again.</p>';
            showNotification('Failed to load library files.', true);
        }
    }


    // --- Assessment Functions ---

    /**
     * Adds a new question input field block to the assessment creation form.
     * Increments `questionCounter` to provide unique IDs for questions.
     */
    function addQuestionField() {
        questionCounter++;
        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item');
        questionItem.dataset.questionIndex = questionCounter; // Store index for reference
        questionItem.innerHTML = `
            <label for="question-text-${questionCounter}">Question ${questionCounter}:</label>
            <input type="text" id="question-text-${questionCounter}" class="question-text" placeholder="Enter question text" required>
            
            <label for="question-type-${questionCounter}">Question Type:</label>
            <select id="question-type-${questionCounter}" class="question-type">
                <option value="text">Text Answer</option>
                <option value="mcq">Multiple Choice</option>
            </select>
            
            <div id="mcq-options-${questionCounter}" class="mcq-options hidden">
                <label>Options:</label>
                <input type="text" class="mcq-option" placeholder="Option A">
                <input type="text" class="mcq-option" placeholder="Option B">
                <input type="text" class="mcq-option" placeholder="Option C">
                <input type="text" class="mcq-option" placeholder="Option D">
                <label for="mcq-correct-${questionCounter}">Correct Option (e.g., A, B, C, D):</label>
                <input type="text" id="mcq-correct-${questionCounter}" class="mcq-correct-answer" placeholder="e.g., A, B, C, D">
            </div>
            <button type="button" class="remove-question-btn btn-danger">Remove Question</button>
        `;
        if (questionsContainer) questionsContainer.appendChild(questionItem);

        const questionTypeSelect = questionItem.querySelector('.question-type');
        const mcqOptionsDiv = questionItem.querySelector('.mcq-options');

        // Toggle MCQ options visibility based on question type selection
        questionTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
            }
        });

        // Add event listener to remove question button
        const removeButton = questionItem.querySelector('.remove-question-btn');
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                questionItem.remove();
                // Re-index remaining questions visually if desired (more complex)
                showNotification(`Question ${questionItem.dataset.questionIndex} removed.`);
            });
        }
        console.log(`[Assessment] Added question field #${questionCounter}.`);
    }

    /**
     * Submits a new assessment created by an administrator to the backend.
     * Performs client-side validation before submission.
     */
    async function submitAssessment() {
        // --- Security and Classroom Checks ---
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can create assessments.", true);
            return;
        }
        if (!currentClassroom || !currentClassroom.id) {
            showNotification("Please select a classroom first to create an assessment.", true);
            return;
        }

        // --- Retrieve Input Values ---
        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionTextarea.value.trim();
        const scheduledAtLocal = assessmentScheduledAtInput.value; // Local date/time string from input
        const durationMinutes = parseInt(assessmentDurationMinutesInput.value, 10);

        // --- Input Validation (Frontend) ---
        if (!title) {
            displayMessage(assessmentCreationMessage, 'Please enter an assessment title.', true);
            return;
        }
        if (!scheduledAtLocal) {
            displayMessage(assessmentCreationMessage, 'Please set a scheduled date and time.', true);
            return;
        }
        if (isNaN(durationMinutes) || durationMinutes <= 0) {
            displayMessage(assessmentCreationMessage, 'Please enter a valid duration in minutes (a positive number).', true);
            return;
        }

        // --- Date/Time Conversion to UTC (CRUCIAL FIX) ---
        let scheduledAtUTC = null;
        try {
            const localDate = new Date(scheduledAtLocal); // Interprets in user's local timezone
            if (isNaN(localDate.getTime())) { // Check for invalid date parsing
                throw new Error("Invalid scheduled date/time format.");
            }
            scheduledAtUTC = localDate.toISOString(); // Converts to UTC ISO 8601 string
            console.log(`[Assessment] Converted local time (${scheduledAtLocal}) to UTC: ${scheduledAtUTC}`);
        } catch (error) {
            console.error('[Assessment] Date conversion error:', error);
            displayMessage(assessmentCreationMessage, `Error converting scheduled time: ${error.message}. Please ensure the date/time is correctly entered.`, true);
            return;
        }
        // --- END OF DATE/TIME CONVERSION ---


        // --- Collect Questions ---
        const questions = [];
        const questionItems = questionsContainer.querySelectorAll('.question-item');
        if (questionItems.length === 0) {
            displayMessage(assessmentCreationMessage, 'Please add at least one question.', true);
            return;
        }

        questionItems.forEach((item, index) => {
            const questionText = item.querySelector('.question-text').value.trim();
            const questionType = item.querySelector('.question-type').value;
            let options = [];
            let correctAnswer = '';

            if (questionType === 'mcq') {
                item.querySelectorAll('.mcq-option').forEach(input => {
                    if (input.value.trim()) {
                        options.push(input.value.trim());
                    }
                });
                correctAnswer = item.querySelector('.mcq-correct-answer').value.trim();
            }

            if (questionText) {
                questions.push({
                    // Simple unique ID for now; backend might assign a better one
                    id: `q${index + 1}-${Date.now()}`,
                    question_text: questionText,
                    question_type: questionType,
                    options: options.length > 0 ? options : undefined, // Only include if options exist
                    correct_answer: correctAnswer || undefined // Only include if provided
                });
            }
        });

        if (questions.length === 0) {
            displayMessage(assessmentCreationMessage, 'No valid questions were added.', true);
            return;
        }

        // --- Prepare Payload and Submit to Backend ---
        const assessmentPayload = {
            classroomId: currentClassroom.id,
            title,
            description,
            scheduled_at: scheduledAtUTC, // Use the UTC converted time
            duration_minutes: durationMinutes,
            questions // Array of question objects
        };

        try {
            console.log('[Assessment] Submitting new assessment:', assessmentPayload);
            const response = await fetch('/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentPayload)
            });

            const result = await response.json();

            if (response.ok) {
                displayMessage(assessmentCreationMessage, result.message, false);
                if (assessmentCreationForm) assessmentCreationForm.reset(); // Clear form inputs
                if (questionsContainer) questionsContainer.innerHTML = ''; // Clear question fields
                questionCounter = 0; // Reset question counter
                addQuestionField(); // Add one empty question field back for convenience
                loadAssessments(); // Reload the list of assessments to show the new one
                showNotification("Assessment created successfully!");
            } else {
                displayMessage(assessmentCreationMessage, result.error, true);
                showNotification(`Error creating assessment: ${result.error}`, true);
                console.error('[Assessment] Server error creating assessment:', result.error);
            }
        } catch (error) {
            console.error('[Assessment] Error submitting assessment:', error);
            displayMessage(assessmentCreationMessage, 'An error occurred during assessment submission.', true);
            showNotification('An unexpected error occurred during assessment creation.', true);
        }
    }


    /**
     * Loads and displays all assessments for the current classroom.
     * Categorizes them by status (Upcoming, Active, Ended) and provides actions.
     * Also manages visibility of assessment creation form for admins.
     */
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            if (assessmentListDiv) assessmentListDiv.innerHTML = '<p>Select a classroom to view assessments.</p>';
            console.warn('[Assessments] Cannot load assessments: No current classroom.');
            return;
        }

        // Ensure correct sections are visible/hidden
        if (takeAssessmentContainer) takeAssessmentContainer.classList.add('hidden');
        if (viewSubmissionsContainer) viewSubmissionsContainer.classList.add('hidden');
        if (assessmentListContainer) assessmentListContainer.classList.remove('hidden');

        // Admin-specific UI for assessment creation
        if (currentUser && currentUser.role === 'admin') {
            if (assessmentCreationForm) {
                assessmentCreationForm.classList.remove('hidden');
                assessmentCreationForm.classList.add('admin-feature-highlight');
                if (questionsContainer && questionsContainer.children.length === 0) {
                    addQuestionField(); // Add an initial question field if none exist
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
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[Assessments] No assessments found for this classroom.');
                    if (assessmentListDiv) assessmentListDiv.innerHTML = '<p>No assessments available in this classroom yet.</p>';
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            let assessments = await response.json();

            const searchTerm = assessmentSearchInput.value.toLowerCase();
            if (searchTerm) {
                assessments = assessments.filter(assessment =>
                    assessment.title.toLowerCase().includes(searchTerm) ||
                    (assessment.description && assessment.description.toLowerCase().includes(searchTerm))
                );
            }

            if (assessmentListDiv) assessmentListDiv.innerHTML = ''; // Clear existing list

            if (assessments.length === 0) {
                if (assessmentListDiv) assessmentListDiv.innerHTML = '<p>No assessments matching your search criteria.</p>';
            } else {
                const now = new Date();
                assessments.forEach(assessment => {
                    // Defensive parsing and validation for scheduled_at and duration_minutes
                    const scheduledTime = new Date(assessment.scheduled_at);
                    const durationMinutes = parseInt(assessment.duration_minutes, 10);

                    let statusText = '';
                    let actionButton = '';
                    let isTakeable = false; // Flag to enable/disable Take Assessment button

                    // Check for invalid date/duration data
                    if (isNaN(scheduledTime.getTime()) || isNaN(durationMinutes) || durationMinutes <= 0) {
                        statusText = `<span class="assessment-status-invalid">(Invalid Schedule Data)</span>`;
                        actionButton = `<button class="take-assessment-btn btn-secondary" disabled>Invalid Schedule</button>`;
                        showNotification(`Assessment "${assessment.title}" has invalid scheduling data.`, true);
                    } else {
                        const endTime = new Date(scheduledTime.getTime() + durationMinutes * 60000);

                        if (now < scheduledTime) {
                            statusText = `<span class="assessment-status-upcoming">(Upcoming: ${scheduledTime.toLocaleString()})</span>`;
                            actionButton = `<button class="take-assessment-btn btn-secondary" disabled>Upcoming</button>`;
                        } else if (now >= scheduledTime && now <= endTime) {
                            statusText = `<span class="assessment-status-active">(Active - Ends: ${endTime.toLocaleTimeString()})</span>`;
                            isTakeable = true; // Assessment is active and can be taken
                            actionButton = `<button class="take-assessment-btn btn-primary" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}" data-assessment-description="${assessment.description}">Take Assessment</button>`;
                        } else {
                            statusText = `<span class="assessment-status-ended">(Ended: ${endTime.toLocaleString()})</span>`;
                            actionButton = `<button class="take-assessment-btn btn-secondary" disabled>Ended</button>`;
                        }
                    }

                    // If user has already submitted, disable the "Take Assessment" button
                    if (assessment.has_submitted) {
                        isTakeable = false;
                        actionButton = `<button class="take-assessment-btn btn-secondary" disabled>Submitted</button>`;
                    }


                    const assessmentItem = document.createElement('div');
                    assessmentItem.classList.add('assessment-item');
                    assessmentItem.innerHTML = `
                        <div>
                            <h4>${assessment.title} ${statusText}</h4>
                            <p>${assessment.description || 'No description provided.'}</p>
                            <p>Created by: ${getDisplayName(assessment.creator_username, assessment.creator_role || 'user')} on ${new Date(assessment.created_at).toLocaleDateString()}</p>
                        </div>
                        <div class="assessment-actions">
                            ${currentUser && currentUser.role === 'admin' ?
                                // Admin actions: View Submissions, Delete
                                `<button class="view-submissions-btn btn-info" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>
                                <button class="delete-assessment-btn btn-danger" data-assessment-id="${assessment.id}">Delete</button>` :
                                // User actions: Take Assessment (or disabled status)
                                actionButton
                            }
                        </div>
                    `;
                    if (assessmentListDiv) assessmentListDiv.appendChild(assessmentItem);
                });
            }

            // Attach event listeners for Take Assessment buttons
            document.querySelectorAll('.take-assessment-btn').forEach(button => {
                // Check 'isTakeable' flag and 'disabled' attribute to ensure button is truly clickable
                if (!button.disabled) { // Only add listener if button is active
                    button.addEventListener('click', (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        const assessmentTitle = e.target.dataset.assessmentTitle;
                        const assessmentDescription = e.target.dataset.assessmentDescription;
                        takeAssessment(assessmentId, assessmentTitle, assessmentDescription);
                    });
                }
            });

            // Attach event listeners for View Submissions buttons (admin only)
            document.querySelectorAll('.view-submissions-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const assessmentId = e.target.dataset.assessmentId;
                    const assessmentTitle = e.target.dataset.assessmentTitle;
                    viewSubmissions(assessmentId, assessmentTitle);
                });
            });

            // Attach event listeners for Delete Assessment buttons (admin only)
            document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const assessmentId = e.target.dataset.assessmentId;
                    // Custom confirmation (replace with modal in a real app)
                    if (window.confirm('Are you sure you want to delete this assessment? This will also delete all submissions.')) {
                        try {
                            const response = await fetch(`/api/assessments/${assessmentId}`, { method: 'DELETE' });
                            const result = await response.json();
                            if (response.ok) {
                                showNotification(result.message);
                                loadAssessments(); // Reload the list after deletion
                            } else {
                                showNotification(`Error deleting assessment: ${result.error}`, true);
                            }
                        } catch (error) {
                            console.error('Error deleting assessment:', error);
                            showNotification('An unexpected error occurred during deletion.', true);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error loading assessments:', error);
            if (assessmentListDiv) assessmentListDiv.innerHTML = '<p>Failed to load assessments. Please check your network connection.</p>';
            showNotification('Failed to load assessments.', true);
        }
        updateUIBasedOnRole(); // Ensure role-based UI is updated after loading
    }

    /**
     * Displays a specific assessment for the current user to take.
     * Fetches questions and initializes a countdown timer.
     * @param {string} assessmentId - The ID of the assessment to take.
     * @param {string} title - The title of the assessment.
     * @param {string} description - The description of the assessment.
     */
    async function takeAssessment(assessmentId, title, description) {
        console.log(`[Assessment] Preparing to take assessment: ${assessmentId}`);
        // Clear any previous timer and state
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
        }
        if (assessmentTimerDisplay) {
            assessmentTimerDisplay.textContent = 'Time Left: --:--:--';
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical', 'ended', 'upcoming');
        }

        // Adjust UI section visibility
        if (assessmentListContainer) assessmentListContainer.classList.add('hidden');
        if (assessmentCreationForm) assessmentCreationForm.classList.add('hidden');
        if (takeAssessmentContainer) {
            takeAssessmentContainer.classList.remove('hidden');
            takeAssessmentContainer.classList.add('user-view-subtle'); // Add subtle styling for user view
        }
        if (viewSubmissionsContainer) viewSubmissionsContainer.classList.add('hidden');

        // Update assessment details in the taking section
        if (takeAssessmentTitle) takeAssessmentTitle.textContent = title;
        if (takeAssessmentDescription) takeAssessmentDescription.textContent = description;
        if (takeAssessmentForm) takeAssessmentForm.innerHTML = ''; // Clear previous questions
        if (assessmentSubmissionMessage) assessmentSubmissionMessage.textContent = '';
        if (submitAnswersBtn) submitAnswersBtn.disabled = true; // Disable submission until questions are loaded and active

        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch assessment details. Status: ${response.status}`);
            }
            const assessment = await response.json();
            currentAssessmentToTake = assessment; // Store the full assessment object globally

            console.log("[Assessment] Fetched assessment details:", assessment);

            const now = new Date();
            const scheduledTime = new Date(assessment.scheduled_at);
            const durationMinutes = parseInt(assessment.duration_minutes, 10);

            // Validate scheduling data
            if (isNaN(scheduledTime.getTime()) || isNaN(durationMinutes) || durationMinutes <= 0) {
                console.error("[Assessment] Invalid scheduled_at or duration_minutes:", assessment.scheduled_at, assessment.duration_minutes);
                if (takeAssessmentForm) takeAssessmentForm.innerHTML = '<p class="error-message">Error: Assessment scheduling data is invalid. Please contact an administrator.</p>';
                if (assessmentTimerDisplay) assessmentTimerDisplay.textContent = 'Error: Invalid Time Data';
                if (assessmentTimerDisplay) assessmentTimerDisplay.classList.add('error');
                if (submitAnswersBtn) submitAnswersBtn.disabled = true;
                showNotification("Assessment time data is invalid. Please contact an administrator.", true);
                return;
            }

            assessmentEndTime = new Date(scheduledTime.getTime() + durationMinutes * 60 * 1000);

            // Check assessment status: Upcoming, Ended, or Active
            if (now < scheduledTime) {
                if (takeAssessmentForm) takeAssessmentForm.innerHTML = `<p>This assessment starts on: <strong>${scheduledTime.toLocaleString()}</strong></p>`;
                if (assessmentTimerDisplay) assessmentTimerDisplay.textContent = `Starts in: ${formatTime(scheduledTime.getTime() - now.getTime())}`;
                if (assessmentTimerDisplay) assessmentTimerDisplay.classList.add('upcoming');
                showNotification("This assessment has not started yet.", true);
                if (submitAnswersBtn) submitAnswersBtn.disabled = true;
                return;
            } else if (now > assessmentEndTime) {
                if (takeAssessmentForm) takeAssessmentForm.innerHTML = `<p>This assessment has already ended on: <strong>${assessmentEndTime.toLocaleString()}</strong></p>`;
                if (assessmentTimerDisplay) assessmentTimerDisplay.textContent = 'Assessment Ended';
                if (assessmentTimerDisplay) assessmentTimerDisplay.classList.add('ended');
                showNotification("This assessment has already ended.", true);
                if (submitAnswersBtn) submitAnswersBtn.disabled = true;
                return;
            }

            // If we reach here, the assessment is currently active
            if (submitAnswersBtn) submitAnswersBtn.disabled = false;
            startAssessmentTimer(assessmentEndTime); // Start the live countdown

            if (!assessment.questions || assessment.questions.length === 0) {
                if (takeAssessmentForm) takeAssessmentForm.innerHTML = '<p>No questions found for this assessment.</p>';
                if (submitAnswersBtn) submitAnswersBtn.disabled = true;
                showNotification('No questions available for this assessment.', true);
                return;
            }

            // Render questions dynamically
            assessment.questions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('question-display');
                questionDiv.dataset.questionId = question.id; // Store question ID for submission
                questionDiv.innerHTML = `<label class="question-label">Question ${index + 1}: ${question.question_text}</label>`;

                if (question.question_type === 'text') {
                    const textarea = document.createElement('textarea');
                    textarea.name = `question_${question.id}`;
                    textarea.placeholder = 'Your answer here...';
                    textarea.rows = 3;
                    textarea.classList.add('text-answer-input');
                    questionDiv.appendChild(textarea);
                } else if (question.question_type === 'mcq' && question.options && Array.isArray(question.options)) {
                    const optionsContainerDiv = document.createElement('div');
                    optionsContainerDiv.classList.add('mcq-options-display');
                    question.options.forEach((option, optIndex) => {
                        const optionId = `q${question.id}-opt${optIndex}`;
                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.name = `question_${question.id}`; // Group radios by question ID
                        radioInput.id = optionId;
                        radioInput.value = option;
                        radioInput.classList.add('mcq-option-radio');

                        const label = document.createElement('label');
                        label.htmlFor = optionId;
                        label.textContent = option;
                        label.classList.add('mcq-option-label');

                        optionsContainerDiv.appendChild(radioInput);
                        optionsContainerDiv.appendChild(label);
                        optionsContainerDiv.appendChild(document.createElement('br'));
                    });
                    questionDiv.appendChild(optionsContainerDiv);
                }
                if (takeAssessmentForm) takeAssessmentForm.appendChild(questionDiv);
            });
        } catch (error) {
            console.error('[Assessment] Error loading assessment questions:', error);
            if (takeAssessmentForm) takeAssessmentForm.innerHTML = '<p class="error-message">Failed to load questions. An unexpected error occurred.</p>';
            if (submitAnswersBtn) submitAnswersBtn.disabled = true;
            showNotification('Failed to load assessment questions.', true);
        }
    }

    /**
     * Starts the countdown timer for an assessment, updating the UI every second.
     * Automatically submits the assessment when time runs out.
     * @param {Date} endTime - The exact Date object when the assessment should end.
     */
    function startAssessmentTimer(endTime) {
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval); // Clear any existing timer
        }

        assessmentEndTime = endTime; // Store the official end time

        function updateTimer() {
            const now = new Date().getTime();
            const timeLeft = assessmentEndTime.getTime() - now;

            if (timeLeft <= 0) {
                clearInterval(assessmentTimerInterval); // Stop the timer
                if (assessmentTimerDisplay) {
                    assessmentTimerDisplay.textContent = 'Time Left: 00:00:00 - Automatically Submitted!';
                    assessmentTimerDisplay.classList.remove('warning', 'critical', 'active', 'upcoming');
                    assessmentTimerDisplay.classList.add('ended');
                }
                showNotification("Time's up! Your assessment has been automatically submitted.", false);
                submitAnswers(true); // Automatically submit the assessment
                // Disable all inputs to prevent further changes
                if (takeAssessmentForm) {
                    takeAssessmentForm.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
                }
                if (submitAnswersBtn) submitAnswersBtn.disabled = true;
                console.log('[Assessment] Assessment time elapsed. Auto-submitting.');
                return;
            }

            // Calculate hours, minutes, seconds remaining
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const displayTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (assessmentTimerDisplay) assessmentTimerDisplay.textContent = `Time Left: ${displayTime}`;

            // Add visual cues for low time remaining
            if (assessmentTimerDisplay) {
                assessmentTimerDisplay.classList.remove('warning', 'critical'); // Reset classes first
                if (timeLeft < 60 * 1000) { // Less than 1 minute
                    assessmentTimerDisplay.classList.add('critical');
                } else if (timeLeft < 5 * 60 * 1000) { // Less than 5 minutes
                    assessmentTimerDisplay.classList.add('warning');
                }
            }
        }

        updateTimer(); // Initial call to display immediately
        assessmentTimerInterval = setInterval(updateTimer, 1000); // Update every second
        if (assessmentTimerDisplay) assessmentTimerDisplay.classList.add('active'); // Indicate timer is running
        console.log('[Assessment] Assessment timer started.');
    }

    /**
     * Helper function to format milliseconds into a HH:MM:SS string.
     * @param {number} ms - The number of milliseconds.
     * @returns {string} Formatted time string, or '--:--:--' if invalid.
     */
    function formatTime(ms) {
        if (isNaN(ms) || ms < 0) {
            return '--:--:--';
        }
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }


    /**
     * Submits the user's collected answers for the current assessment to the backend.
     * Handles both manual and automatic (timer-based) submissions.
     * @param {boolean} [isAutoSubmit=false] - True if this is an automatic submission (e.g., time ran out).
     */
    async function submitAnswers(isAutoSubmit = false) {
        if (!currentAssessmentToTake || !currentClassroom || !currentClassroom.id || !currentUser || !currentUser.id) {
            console.warn('[Assessment] Cannot submit answers: Missing assessment, classroom, or user info.');
            showNotification('No active assessment or user information for submission.', true);
            return;
        }

        // Prevent double submission or submission after assessment ended
        if (submitAnswersBtn && submitAnswersBtn.disabled && !isAutoSubmit) {
            showNotification('Assessment already submitted or ended.', true);
            return;
        }

        // Stop the timer immediately upon submission
        if (assessmentTimerInterval) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerInterval = null;
        }
        if (assessmentTimerDisplay) {
            assessmentTimerDisplay.classList.remove('active', 'warning', 'critical');
        }

        const answers = [];
        const questionDivs = takeAssessmentForm.querySelectorAll('.question-display');

        questionDivs.forEach(qDiv => {
            const questionId = qDiv.dataset.questionId;
            let userAnswer = '';
            // Find the original question data from the stored assessment
            const questionData = currentAssessmentToTake.questions.find(q => q.id === questionId);
            if (!questionData) {
                console.warn(`[Assessment] Question data not found for ID: ${questionId}`);
                return; // Skip if question data is missing
            }

            const textarea = qDiv.querySelector('textarea');
            const radioInputs = qDiv.querySelectorAll('input[type="radio"]:checked');

            if (textarea) {
                userAnswer = textarea.value.trim();
            } else if (radioInputs.length > 0) {
                userAnswer = radioInputs[0].value; // For MCQ, get the value of the selected radio
            }

            answers.push({
                question_id: questionId,
                question_text: questionData.question_text,
                question_type: questionData.question_type,
                user_answer: userAnswer,
                // Include correct_answer from original assessment for server-side scoring
                correct_answer: questionData.correct_answer || null
            });
        });

        const submissionPayload = {
            assessmentId: currentAssessmentToTake.id,
            classroomId: currentClassroom.id,
            answers: answers,
            is_auto_submit: isAutoSubmit,
            student_id: currentUser.id,
            student_username: currentUser.username,
            student_role: currentUser.role
        };

        try {
            console.log('[Assessment] Submitting answers:', submissionPayload);
            const response = await fetch(`/api/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionPayload)
            });
            const result = await response.json();

            if (response.ok) {
                if (assessmentSubmissionMessage) {
                    assessmentSubmissionMessage.textContent = `Assessment submitted! Your score: ${result.score}/${result.total_questions}`;
                    assessmentSubmissionMessage.classList.remove('error');
                    assessmentSubmissionMessage.classList.add('success');
                }
                if (submitAnswersBtn) submitAnswersBtn.disabled = true; // Disable further submissions
                if (takeAssessmentForm) {
                    takeAssessmentForm.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true); // Disable form
                }
                showNotification(`Assessment submitted! Score: ${result.score}/${result.total_questions}`);
                console.log('[Assessment] Submission successful:', result);
                // After a short delay, return to the assessment list
                setTimeout(() => {
                    loadAssessments();
                }, 2000);
            } else {
                if (assessmentSubmissionMessage) {
                    assessmentSubmissionMessage.textContent = `Error submitting assessment: ${result.error}`;
                    assessmentSubmissionMessage.classList.remove('success');
                    assessmentSubmissionMessage.classList.add('error');
                }
                showNotification(`Error submitting assessment: ${result.error}`, true);
                console.error('[Assessment] Submission error from server:', result.error);
            }
        } catch (error) {
            console.error('[Assessment] An unexpected error occurred during submission:', error);
            if (assessmentSubmissionMessage) {
                assessmentSubmissionMessage.textContent = 'An unexpected error occurred during submission.';
                assessmentSubmissionMessage.classList.remove('success');
                assessmentSubmissionMessage.classList.add('error');
            }
            showNotification('An unexpected error occurred during assessment submission.', true);
        }
    }

    /**
     * Views all submissions for a specific assessment (admin-only functionality).
     * Displays a list of student submissions with scores and a "Mark Submission" button.
     * @param {string} assessmentId - The ID of the assessment whose submissions are to be viewed.
     * @param {string} title - The title of the assessment (for display).
     */
    async function viewSubmissions(assessmentId, title) {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can view submissions.", true);
            return;
        }

        if (submissionsAssessmentTitle) submissionsAssessmentTitle.textContent = `Submissions for: ${title}`;
        if (submissionsAssessmentTitle) submissionsAssessmentTitle.dataset.assessmentId = assessmentId; // Store for refreshing

        // Adjust UI section visibility
        if (assessmentListContainer) assessmentListContainer.classList.add('hidden');
        if (takeAssessmentContainer) takeAssessmentContainer.classList.add('hidden');
        if (viewSubmissionsContainer) {
            viewSubmissionsContainer.classList.remove('hidden');
            viewSubmissionsContainer.classList.add('admin-feature-highlight');
        }

        if (submissionsList) submissionsList.innerHTML = '<p>Loading submissions...</p>';
        console.log(`[Assessments] Loading submissions for assessment: ${assessmentId}`);

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            if (!response.ok) {
                if (response.status === 404) {
                    if (submissionsList) submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
                    return;
                }
                throw new Error(`Failed to load submissions. Status: ${response.status}`);
            }
            const submissions = await response.json();

            if (submissionsList) submissionsList.innerHTML = ''; // Clear loading message

            if (submissions.length === 0) {
                if (submissionsList) submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
                return;
            }

            submissions.forEach(submission => {
                const submissionItem = document.createElement('div');
                submissionItem.classList.add('submission-item');
                const studentDisplayName = getDisplayName(submission.student_username, submission.student_role || 'user');
                submissionItem.innerHTML = `
                    <h5>Submitted by: ${studentDisplayName} on ${new Date(submission.submitted_at).toLocaleString()}</h5>
                    <p>Score: ${submission.score}/${submission.total_questions}</p>
                    <button class="mark-submission-btn btn-info" data-submission-id="${submission.id}" data-assessment-id="${assessmentId}">Mark Submission</button>
                    <div id="marking-area-${submission.id}" class="marking-area hidden"></div>
                `;

                // Display each question and answer from the submission
                submission.answers.forEach((answer, index) => {
                    const answerPair = document.createElement('div');
                    answerPair.classList.add('question-answer-pair');
                    answerPair.innerHTML = `
                        <p><strong>Q${index + 1}:</strong> ${answer.question_text}</p>
                        <p><strong>User Answer:</strong> ${answer.user_answer || 'N/A'}</p>
                    `;
                    // Display correctness and expected answer if available
                    if (answer.is_correct !== undefined && answer.is_correct !== null) {
                        answerPair.innerHTML += `<p><strong>Correct:</strong> <span style="color: ${answer.is_correct ? 'green' : 'red'};">${answer.is_correct ? 'Yes' : 'No'}</span> (Expected: ${answer.correct_answer || 'N/A'})</p>`;
                        answerPair.style.backgroundColor = answer.is_correct ? '#e6ffe6' : '#ffe6e6'; // Subtle background color
                    } else if (answer.correct_answer) {
                        answerPair.innerHTML += `<p><strong>Expected Answer:</strong> ${answer.correct_answer}</p>`;
                    }
                    if (answer.admin_feedback) {
                        answerPair.innerHTML += `<p><strong>Admin Feedback:</strong> ${answer.admin_feedback}</p>`;
                    }
                    submissionItem.appendChild(answerPair);
                });
                if (submissionsList) submissionsList.appendChild(submissionItem);
            });

            // Attach event listeners for "Mark Submission" buttons
            document.querySelectorAll('.mark-submission-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const submissionId = e.target.dataset.submissionId;
                    const assessmentId = e.target.dataset.assessmentId;
                    markSubmission(submissionId, assessmentId);
                });
            });

        } catch (error) {
            console.error('Error loading submissions:', error);
            if (submissionsList) submissionsList.innerHTML = '<p>Failed to load submissions. Please try again.</p>';
            showNotification('Failed to load submissions.', true);
        }
    }

    /**
     * Displays a specific submission in a marking interface for an administrator.
     * Allows the admin to mark questions as correct/incorrect and add feedback.
     * @param {string} submissionId - The ID of the submission to mark.
     * @param {string} assessmentId - The ID of the parent assessment.
     */
    async function markSubmission(submissionId, assessmentId) {
        const markingArea = document.getElementById(`marking-area-${submissionId}`);
        if (!markingArea) {
            console.error(`[Assessment] Marking area not found for submission ID: ${submissionId}`);
            showNotification('Error: Marking interface not available.', true);
            return;
        }

        markingArea.classList.remove('hidden');
        markingArea.innerHTML = '<p>Loading submission for marking...</p>';
        console.log(`[Assessment] Loading submission ${submissionId} for marking.`);

        try {
            const response = await fetch(`/api/submissions/${submissionId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to load submission ${submissionId} for marking. Status: ${response.status}`);
            }
            const submission = await response.json();

            let markingHtml = `
                <h5>Marking Submission from ${getDisplayName(submission.student_username, submission.student_role || 'user')}</h5>
                <form id="marking-form-${submission.id}">
            `;

            // Render each question/answer with marking controls
            submission.answers.forEach((answer, index) => {
                markingHtml += `
                    <div class="marking-question-item">
                        <p><strong>Q${index + 1}:</strong> ${answer.question_text}</p>
                        <p><strong>User Answer:</strong> ${answer.user_answer || 'N/A'}</p>
                        ${answer.correct_answer ? `<p><strong>Expected:</strong> ${answer.correct_answer}</p>` : ''}
                        
                        <label>
                            <input type="checkbox" class="is-correct-checkbox" data-question-id="${answer.question_id}" ${answer.is_correct ? 'checked' : ''}> Mark as Correct
                        </label>
                        <textarea class="admin-feedback-comment" data-question-id="${answer.question_id}" placeholder="Add feedback comment (optional)" rows="2">${answer.admin_feedback || ''}</textarea>
                    </div>
                `;
            });

            markingHtml += `
                    <div class="marking-actions">
                        <button type="button" class="save-marks-btn btn-success" data-submission-id="${submission.id}" data-assessment-id="${assessmentId}">Save Marks</button>
                        <button type="button" class="cancel-marking-btn btn-secondary">Cancel</button>
                    </div>
                </form>
            `;
            markingArea.innerHTML = markingHtml;

            // Attach event listeners for the Save and Cancel buttons within the marking form
            markingArea.querySelector('.save-marks-btn').addEventListener('click', () => saveMarkedSubmission(submission.id, assessmentId));
            markingArea.querySelector('.cancel-marking-btn').addEventListener('click', () => {
                markingArea.classList.add('hidden'); // Hide the marking area on cancel
                showNotification('Marking cancelled.');
            });

        } catch (error) {
            console.error(`[Assessment] Error loading submission ${submissionId} for marking:`, error);
            if (markingArea) markingArea.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
            showNotification(`Error loading submission for marking: ${error.message}`, true);
        }
    }

    /**
     * Saves the marked submission data (correctness and feedback) to the backend.
     * @param {string} submissionId - The ID of the submission being marked.
     * @param {string} assessmentId - The ID of the parent assessment.
     */
    async function saveMarkedSubmission(submissionId, assessmentId) {
        const markingArea = document.getElementById(`marking-area-${submissionId}`);
        if (!markingArea) {
            console.error(`[Assessment] Marking area not found for submission ID: ${submissionId} during save.`);
            showNotification('Error: Marking interface not available to save.', true);
            return;
        }

        const updatedAnswers = [];
        // Collect updated correctness and feedback for each question
        markingArea.querySelectorAll('.marking-question-item').forEach(qItem => {
            const questionId = qItem.querySelector('.is-correct-checkbox').dataset.questionId;
            const isCorrect = qItem.querySelector('.is-correct-checkbox').checked;
            const adminFeedback = qItem.querySelector('.admin-feedback-comment').value.trim();

            updatedAnswers.push({
                question_id: questionId,
                is_correct: isCorrect,
                admin_feedback: adminFeedback || undefined // Only include if feedback is not empty
            });
        });

        try {
            console.log(`[Assessment] Saving marks for submission ${submissionId}:`, updatedAnswers);
            const response = await fetch(`/api/assessments/${assessmentId}/mark-submission/${submissionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updated_answers: updatedAnswers,
                    marker_id: currentUser.id, // Admin who marked
                    marker_username: currentUser.username
                })
            });
            const result = await response.json();

            if (response.ok) {
                showNotification(result.message);
                markingArea.classList.add('hidden'); // Hide marking area
                // Refresh the submissions list to reflect changes
                viewSubmissions(assessmentId, submissionsAssessmentTitle.textContent.replace('Submissions for: ', ''));
                console.log(`[Assessment] Marks saved for submission ${submissionId}.`);
            } else {
                showNotification(`Error saving marks: ${result.error}`, true);
                console.error('[Assessment] Server error saving marks:', result.error);
            }
        } catch (error) {
            console.error('[Assessment] An unexpected error occurred while saving marks:', error);
            showNotification('An unexpected error occurred while saving marks.', true);
        }
    }

    /**
     * Placeholder function to display feedback for a user's own submitted assessment.
     * In a full application, this would render in a dedicated UI section (e.g., "My Submissions").
     * @param {object} submission - The submission object containing answers and admin feedback.
     */
    function displaySubmissionFeedback(submission) {
        // This function is illustrative. In a real application, you'd likely
        // have a dedicated UI section for students to review their marked assessments.
        console.log("Displaying feedback for submission (conceptual):", submission);
        showNotification(`Feedback for your assessment "${submission.assessment_title}" is now available.`);

        // Example of how you might dynamically create a modal or inject into a div:
        // const feedbackModal = document.getElementById('student-feedback-modal');
        // if (feedbackModal) {
        //     let feedbackContent = `<h3>Feedback for: ${submission.assessment_title}</h3>`;
        //     feedbackContent += `<p>Your Score: ${submission.score}/${submission.total_questions}</p>`;
        //     submission.answers.forEach(answer => {
        //         feedbackContent += `<div class="feedback-item">`;
        //         feedbackContent += `<p><strong>Question:</strong> ${answer.question_text}</p>`;
        //         feedbackContent += `<p><strong>Your Answer:</strong> ${answer.user_answer || 'N/A'}</p>`;
        //         feedbackContent += `<p><strong>Correct:</strong> <span style="color: ${answer.is_correct ? 'green' : 'red'};">${answer.is_correct ? 'Yes' : 'No'}</span></p>`;
        //         if (answer.admin_feedback) {
        //             feedbackContent += `<p><strong>Admin Comment:</strong> ${answer.admin_feedback}</p>`;
        //         }
        //         feedbackContent += `</div>`;
        //     });
        //     feedbackModal.innerHTML = feedbackContent;
        //     feedbackModal.classList.remove('hidden'); // Show the modal
        // }
    }


    // --- Core Event Listeners and Initial Setup ---

    // --- Authentication Section Listeners ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginContainer) loginContainer.classList.add('hidden');
            if (registerContainer) registerContainer.classList.remove('hidden');
            if (authMessage) authMessage.textContent = ''; // Clear auth messages
            console.log('[Auth UI] Switched to Register view.');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerContainer) registerContainer.classList.add('hidden');
            if (loginContainer) loginContainer.classList.remove('hidden');
            if (authMessage) authMessage.textContent = ''; // Clear auth messages
            console.log('[Auth UI] Switched to Login view.');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission and page reload
            console.log('[Auth] Login form submitted.');
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            if (!email || !password) {
                displayMessage(authMessage, 'Please enter both email and password.', true);
                return;
            }

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();

                if (response.ok) {
                    currentUser = result.user; // Update global currentUser
                    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Persist user data
                    sessionStorage.setItem('user_id', currentUser.id); // Store user ID in sessionStorage
                    displayMessage(authMessage, result.message, false);
                    console.log('[Auth] Login successful. User:', currentUser.username);
                    checkLoginStatus(); // Transition to dashboard
                } else {
                    displayMessage(authMessage, result.error || 'Login failed. Please check your credentials.', true);
                    console.error('[Auth] Login failed:', result.error);
                }
            } catch (error) {
                console.error('Error during login:', error);
                displayMessage(authMessage, 'An error occurred during login. Please try again later.', true);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission and page reload
            console.log('[Auth] Register form submitted.');
            const username = document.getElementById('register-username').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value.trim();
            const role = document.getElementById('register-role').value; // 'user' or 'admin'

            if (!username || !email || !password) {
                displayMessage(authMessage, 'Please fill in all registration fields.', true);
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role })
                });
                const result = await response.json();

                if (response.ok) {
                    displayMessage(authMessage, result.message + " Please log in.", false);
                    if (registerForm) registerForm.reset(); // Clear form
                    if (loginContainer) loginContainer.classList.remove('hidden'); // Show login form
                    if (registerContainer) registerContainer.classList.add('hidden'); // Hide register form
                    console.log('[Auth] Registration successful. Redirecting to login.');
                } else {
                    displayMessage(authMessage, result.error || 'Registration failed.', true);
                    console.error('[Auth] Registration failed:', result.error);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                displayMessage(authMessage, 'An error occurred during registration. Please try again later.', true);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log('[Auth] Logout button clicked.');
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                const result = await response.json();
                if (response.ok) {
                    localStorage.removeItem('currentUser'); // Clear user from local storage
                    sessionStorage.removeItem('user_id'); // Clear user ID from session storage
                    currentUser = null; // Reset global user variable
                    cleanupClassroomResources(); // Clean up any active classroom state
                    showSection(authSection); // Go back to authentication section
                    showNotification("Logged out successfully.");
                    console.log('[Auth] Logout successful.');
                } else {
                    showNotification('Failed to logout. Please try again.', true);
                    console.error('[Auth] Logout failed:', result.error);
                }
            } catch (error) {
                console.error('Error during logout:', error);
                showNotification('An error occurred during logout. Please check your network.', true);
            }
        });
    }

    // --- Dashboard Section Listeners ---
    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            console.log('[Dashboard] Create classroom button clicked.');
            const classroomName = newClassroomNameInput.value.trim();
            if (!classroomName) {
                displayMessage(classroomMessage, 'Please enter a classroom name.', true);
                return;
            }
            if (!currentUser || currentUser.role !== 'admin') {
                displayMessage(classroomMessage, 'Only administrators can create classrooms.', true);
                showNotification('Permission denied: Only administrators can create classrooms.', true);
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
                    displayMessage(classroomMessage, result.message, false);
                    if (newClassroomNameInput) newClassroomNameInput.value = ''; // Clear input
                    loadAvailableClassrooms(); // Reload classroom list
                    showNotification(`Classroom "${classroomName}" created successfully!`);
                    console.log('[Dashboard] Classroom created:', result.id);
                } else {
                    displayMessage(classroomMessage, result.error, true);
                    showNotification(`Error creating classroom: ${result.error}`, true);
                    console.error('[Dashboard] Error creating classroom:', result.error);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred while creating the classroom.', true);
                showNotification('An unexpected error occurred during classroom creation.', true);
            }
        });
    }

    // Classroom Search Input Listener
    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadAvailableClassrooms);
        console.log('[Dashboard] Classroom search input listener attached.');
    }

    // --- Navigation Listeners ---
    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            console.log('[Nav] Navigating to Dashboard.');
            cleanupClassroomResources(); // Clean up any active classroom state
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadAvailableClassrooms();
            updateUIBasedOnRole();
        });
    }

    if (navClassroom) {
        navClassroom.addEventListener('click', () => {
            console.log('[Nav] Navigating to Classroom tab.');
            if (currentClassroom && currentClassroom.id && currentClassroom.name) {
                enterClassroom(currentClassroom.id, currentClassroom.name); // Re-enter the last active classroom
                showNotification(`Re-entering classroom: ${currentClassroom.name}`);
            } else {
                showNotification('Please create or join a classroom first!', true);
                console.warn('[Nav] Cannot enter classroom: No current classroom selected.');
            }
        });
    }

    if (navSettings) {
        navSettings.addEventListener('click', () => {
            console.log('[Nav] Navigating to Settings.');
            cleanupClassroomResources(); // Clean up any active classroom state
            showSection(settingsSection);
            updateNavActiveState(navSettings);
            if (currentUser) {
                if (settingsUsernameInput) settingsUsernameInput.value = currentUser.username;
                if (settingsEmailInput) settingsEmailInput.value = currentUser.email;
            }
        });
    }

    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            console.log('[Nav] Back to Dashboard button clicked.');
            cleanupClassroomResources(); // Clean up current classroom state
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadAvailableClassrooms();
            updateUIBasedOnRole();
        });
    }

    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => {
            console.log('[Nav] Back to Dashboard from Settings button clicked.');
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadAvailableClassrooms();
            updateUIBasedOnRole();
        });
    }

    // --- Classroom Sub-section Navigation Listeners ---
    if (navChat) {
        navChat.addEventListener('click', () => {
            console.log('[Nav] Navigating to Chat sub-section.');
            showClassroomSubSection(chatSection);
            updateNavActiveState(navChat);
            setupChatControls(); // Ensure chat controls are ready
        });
    }
    if (navWhiteboard) {
        navWhiteboard.addEventListener('click', () => {
            console.log('[Nav] Navigating to Whiteboard sub-section.');
            showClassroomSubSection(whiteboardArea);
            updateNavActiveState(navWhiteboard);
            setupWhiteboardControls(); // Ensure whiteboard controls are ready
            // Whiteboard history is fetched on socket connect, not here
        });
    }
    if (navLibrary) {
        navLibrary.addEventListener('click', () => {
            console.log('[Nav] Navigating to Library sub-section.');
            showClassroomSubSection(librarySection);
            updateNavActiveState(navLibrary);
            loadLibraryFiles(); // Load library files
        });
    }
    if (navAssessments) {
        navAssessments.addEventListener('click', () => {
            console.log('[Nav] Navigating to Assessments sub-section.');
            showClassroomSubSection(assessmentsSection);
            updateNavActiveState(navAssessments);
            loadAssessments(); // Load assessments
        });
    }

    // --- Settings Section Listeners ---
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[Settings] Update profile form submitted.');
            const username = settingsUsernameInput.value.trim();
            const email = settingsEmailInput.value.trim(); // Email is currently read-only in UI, but sent for consistency
            // Note: Password update would require a separate, secure flow (old_password, new_password)
            // For simplicity, this example only updates username.

            if (!username) {
                showNotification('Username cannot be empty.', true);
                return;
            }
            if (!email) {
                showNotification('Email cannot be empty.', true);
                return;
            }

            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST', // Or PUT, depending on API design
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, email: email }) // Assuming email is also part of profile
                });
                const result = await response.json();

                if (response.ok) {
                    showNotification(result.message);
                    currentUser.username = username; // Update global user object
                    currentUser.email = email; // Update global user object
                    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Persist updated data
                    if (currentUsernameDisplay) currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role); // Update dashboard header
                    console.log('[Settings] Profile updated successfully. New username:', currentUser.username);
                } else {
                    showNotification('Error updating profile: ' + (result.error || 'Unknown error'), true);
                    console.error('[Settings] Error updating profile:', result.error);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('An unexpected error occurred during profile update. Please check your network.', true);
            }
        });
    }

    // --- Share Link Functionality (on Whiteboard) ---
    if (shareWhiteboardBtn) {
        shareWhiteboardBtn.addEventListener('click', async () => {
            console.log('[Share] Share whiteboard button clicked.');
            const classroomId = currentClassroom ? currentClassroom.id : null;
            if (classroomId) {
                try {
                    // This API call might not be strictly necessary if the link is just a direct URL
                    // The backend could be used to track shared links or generate short URLs if needed
                    const response = await fetch(`/api/generate-share-link/${classroomId}`); // Assuming this endpoint exists for robustness
                    const data = await response.json();
                    if (response.ok) {
                        const shareLink = data.share_link || `${window.location.origin}/classroom/${classroomId}`; // Fallback
                        if (shareLinkInput) shareLinkInput.value = shareLink;
                        if (shareLinkDisplay) shareLinkDisplay.classList.remove('hidden');
                        if (shareLinkInput) {
                            shareLinkInput.select(); // Select the text for easy copying
                            document.execCommand('copy'); // Attempt to automatically copy to clipboard
                        }
                        showNotification("Share link generated and copied to clipboard!");
                        console.log('[Share] Share link generated:', shareLink);
                    } else {
                        // If backend link generation fails, still provide fallback direct URL
                        const shareLink = `${window.location.origin}/classroom/${classroomId}`;
                        if (shareLinkInput) shareLinkInput.value = shareLink;
                        if (shareLinkDisplay) shareLinkDisplay.classList.remove('hidden');
                        if (shareLinkInput) {
                            shareLinkInput.select();
                            document.execCommand('copy');
                        }
                        showNotification('Error generating share link from server, direct link copied instead!', true);
                        console.error('[Share] Error generating share link from server, using fallback:', data.error);
                    }
                } catch (error) {
                    // If any network error during fetch, provide fallback direct URL
                    const shareLink = `${window.location.origin}/classroom/${classroomId}`;
                    if (shareLinkInput) shareLinkInput.value = shareLink;
                    if (shareLinkDisplay) shareLinkDisplay.classList.remove('hidden');
                    if (shareLinkInput) {
                        shareLinkInput.select();
                        document.execCommand('copy');
                    }
                    console.error('Error generating share link:', error);
                    showNotification('An unexpected error occurred while generating the share link, direct link copied instead!', true);
                }
            } else {
                showNotification('Please create or join a classroom first to get a shareable link.', true);
                console.warn('[Share] Cannot generate share link: No active classroom.');
            }
        });
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            if (shareLinkInput) {
                shareLinkInput.select();
                document.execCommand('copy'); // Fallback for clipboard API if not supported or restricted
                showNotification('Link copied to clipboard!');
            }
        });
    }

    // --- Broadcast Controls Listeners ---
    if (startBroadcastBtn) startBroadcastBtn.addEventListener('click', startBroadcast);
    if (endBroadcastBtn) endBroadcastBtn.addEventListener('click', endBroadcast);
    broadcastTypeRadios.forEach(radio => {
        if (radio) {
            radio.addEventListener('change', () => {
                console.log('[Broadcast] Broadcast type changed:', radio.value);
                // If broadcast is currently active and the type changes, restart it
                if (localStream && localStream.active && currentUser && currentUser.role === 'admin') {
                    showNotification("Broadcast type changed. Restarting broadcast...");
                    endBroadcast(); // Stop current broadcast
                    setTimeout(() => startBroadcast(), 500); // Start new broadcast after a short delay
                }
            });
        }
    });

    // --- Library Search Input Listener ---
    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', loadLibraryFiles);
        console.log('[Library] Library search input listener attached.');
    }

    // --- Library File Upload Listener ---
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            console.log('[Library] Upload files button clicked.');
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification('Permission denied: Only administrators can upload files to the library.', true);
                return;
            }
            if (!currentClassroom || !currentClassroom.id) {
                showNotification('Please enter a classroom before uploading files.', true);
                return;
            }

            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification('Please select files to upload.', true);
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]); // Append each selected file
            }

            try {
                const response = await fetch(`/api/library-files/${currentClassroom.id}/upload`, {
                    method: 'POST',
                    body: formData // FormData automatically sets 'Content-Type': 'multipart/form-data'
                });
                const result = await response.json();

                if (response.ok) {
                    showNotification(result.message);
                    if (libraryFileInput) libraryFileInput.value = ''; // Clear file input
                    loadLibraryFiles(); // Reload the library list
                    console.log('[Library] Files uploaded successfully.');
                } else {
                    showNotification(`Error uploading files: ${result.error}`, true);
                    console.error('[Library] Error uploading files:', result.error);
                }
            } catch (error) {
                console.error('Error during file upload:', error);
                showNotification('An unexpected error occurred during file upload. Please check your network.', true);
            }
        });
    }

    // --- Assessment Creation and Submission Listeners ---
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestionField);
    if (submitAssessmentBtn) submitAssessmentBtn.addEventListener('click', submitAssessment);
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', () => submitAnswers(false)); // Manual submission
    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => {
        console.log('[Assessments] Back to assessment list clicked.');
        currentAssessmentToTake = null; // Clear active assessment
        loadAssessments(); // Reload the list
    });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
        console.log('[Assessments] Back to assessment list from submissions clicked.');
        loadAssessments(); // Reload the list
    });

    // Assessment Search Input Listener
    if (assessmentSearchInput) {
        assessmentSearchInput.addEventListener('input', loadAssessments);
        console.log('[Assessments] Assessment search input listener attached.');
    }

    // --- Initial Application Setup ---
    // Perform initial login status check when the DOM is fully loaded.
    checkLoginStatus();
    console.log('[App] Initial login status check completed.');

    // --- Sidebar Toggle Logic (Hamburger Menu) ---
    const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
    const sidebar = document.getElementById('classroom-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    if (hamburgerMenuBtn && sidebar && closeSidebarBtn) {
        hamburgerMenuBtn.addEventListener('click', () => {
            console.log('[Sidebar] Hamburger menu opened.');
            sidebar.classList.add('active');
            sidebar.classList.remove('hidden');
            document.body.classList.add('sidebar-open'); // Add class to body to prevent scroll
        });

        closeSidebarBtn.addEventListener('click', () => {
            console.log('[Sidebar] Sidebar closed via close button.');
            sidebar.classList.remove('active');
            sidebar.classList.add('hidden');
            document.body.classList.remove('sidebar-open'); // Remove class from body
        });

        // Close sidebar if clicking outside of it
        document.addEventListener('click', (e) => {
            if (
                sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !hamburgerMenuBtn.contains(e.target) &&
                !e.target.closest('.sidebar-trigger-ignore') // Add a class for elements that shouldn't close the sidebar
            ) {
                console.log('[Sidebar] Sidebar closed by clicking outside.');
                sidebar.classList.remove('active');
                sidebar.classList.add('hidden');
                document.body.classList.remove('sidebar-open');
            }
        });
        console.log('[App] Sidebar toggle listeners attached.');
    }

    // Initialize zoom for the local video feed once DOM is ready
    if (localVideo && localVideoContainer) {
        initializeZoomableVideo(localVideo, localVideoContainer);
        console.log('[App] Local video zoom initialized.');
    }
});
