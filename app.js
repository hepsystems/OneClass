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
     * @param {string} sectionId - The ID of the section to show.
     */
    function showSection(sectionId) {
        [authSection, dashboardSection, classroomSection, settingsSection].forEach(section => {
            if (section) {
                section.classList.add('hidden');
                section.classList.remove('active');
            }
        });
        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.classList.add('active');
        }
    }

    /**
     * Shows a specific sub-section within the classroom and hides others.
     * @param {string} subSectionId - The ID of the sub-section to show.
     */
    function showClassroomSubSection(subSectionId) {
        [chatSection, whiteboardArea, librarySection, assessmentsSection].forEach(section => {
            if (section) {
                section.classList.add('hidden');
                section.classList.remove('active');
            }
        });
        const subSectionToShow = document.getElementById(subSectionId);
        if (subSectionToShow) {
            subSectionToShow.classList.remove('hidden');
            subSectionToShow.classList.add('active');
        }
    }

    // --- Authentication and User Management ---
    
    /**
     * Updates the UI based on the current login status.
     */
    const updateUI = () => {
        if (currentUser) {
            // User is logged in
            showSection('dashboard-section');
            if (currentUsernameDisplay) {
                currentUsernameDisplay.textContent = currentUser.username;
            }
            if (classroomList) {
                loadUserClassrooms();
            }
            if (currentUser.role === 'admin') {
                document.querySelectorAll('[data-admin-only]').forEach(el => el.classList.remove('hidden'));
            } else {
                document.querySelectorAll('[data-admin-only]').forEach(el => el.classList.add('hidden'));
            }

            // Check if a classroom is saved in localStorage
            if (currentClassroom && currentClassroom.id) {
                showClassroomSection(currentClassroom.id, currentClassroom.name, true);
            }
            
        } else {
            // User is not logged in
            showSection('auth-section');
            showLoginForm();
        }
    };

    const checkLoginStatus = async () => {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            if (data.user) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                currentUser = null;
                localStorage.removeItem('currentUser');
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            currentUser = null;
            localStorage.removeItem('currentUser');
        }
        updateUI();
    };


    const showLoginForm = () => {
        loginContainer.classList.remove('hidden');
        registerContainer.classList.add('hidden');
    };

    const showRegisterForm = () => {
        registerContainer.classList.remove('hidden');
        loginContainer.classList.add('hidden');
    };
    
    const handleLogin = async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;

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
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUI();
                authMessage.textContent = ''; // Clear message on success
            } else {
                displayMessage(authMessage, data.error, true);
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage(authMessage, 'An error occurred during login. Please try again.', true);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const username = registerUsernameInput.value;
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        const role = registerRoleSelect.value;
        
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
                displayMessage(authMessage, data.message + '. You can now log in.', false);
                showLoginForm();
            } else {
                displayMessage(authMessage, data.error, true);
            }
        } catch (error) {
            console.error('Error:', error);
            displayMessage(authMessage, 'An error occurred during registration. Please try again.', true);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            currentUser = null;
            currentClassroom = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentClassroom');
            showSection('auth-section');
            showLoginForm();
            // Disconnect from socket
            if (socket) {
                socket.disconnect();
            }
        } catch (error) {
            console.error('Error during logout:', error);
            showNotification('Logout failed. Please try again.', true);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const newUsername = settingsUsernameInput.value;

        try {
            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername })
            });
            const data = await response.json();
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUI();
                showNotification('Profile updated successfully!', false);
            } else {
                showNotification(data.error, true);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('An error occurred. Please try again.', true);
        }
    };
    
    // --- Classroom Management ---
    const handleCreateClassroom = async () => {
        const name = newClassroomNameInput.value;
        if (!name) {
            displayMessage(classroomMessage, 'Please enter a classroom name.', true);
            return;
        }

        try {
            const response = await fetch('/api/classrooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (response.ok) {
                displayMessage(classroomMessage, `Classroom "${data.classroom.name}" created! Share code: ${data.classroom.code}`, false);
                newClassroomNameInput.value = '';
                loadUserClassrooms();
                showSection('dashboard-section'); // Redirect to dashboard to show the new class
            } else {
                displayMessage(classroomMessage, data.error, true);
            }
        } catch (error) {
            console.error('Error creating classroom:', error);
            displayMessage(classroomMessage, 'An error occurred. Please try again.', true);
        }
    };

    const loadUserClassrooms = async () => {
        if (!currentUser) return;
        try {
            const response = await fetch('/api/classrooms/user_classrooms');
            const data = await response.json();
            if (response.ok) {
                renderClassrooms(data.classrooms);
            } else {
                showNotification(data.error, true);
            }
        } catch (error) {
            console.error('Error loading user classrooms:', error);
            showNotification('Failed to load your classrooms.', true);
        }
    };

    const renderClassrooms = (classrooms) => {
        if (!classroomList) return;
        classroomList.innerHTML = '';
        if (classrooms.length === 0) {
            classroomList.innerHTML = '<p>You are not a member of any classrooms yet.</p>';
            return;
        }

        const filteredClassrooms = classrooms.filter(c => 
            c.name.toLowerCase().includes(classroomSearchInput.value.toLowerCase()) || 
            c.code.toLowerCase().includes(classroomSearchInput.value.toLowerCase())
        );

        filteredClassrooms.forEach(classroom => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="classroom-info">
                    <strong>${classroom.name}</strong> 
                    <span class="classroom-code">(${classroom.code})</span>
                    <span class="classroom-role">${classroom.admin_id === currentUser.id ? '(Admin)' : '(Member)'}</span>
                </div>
                <div class="classroom-actions">
                    <button class="join-btn btn-primary" data-classroom-id="${classroom.id}">Join</button>
                    ${classroom.admin_id === currentUser.id ? 
                        `<button class="share-btn btn-secondary" data-class-code="${classroom.code}">Share</button>` : ''}
                </div>
            `;
            li.querySelector('.join-btn').addEventListener('click', (e) => showClassroomSection(e.target.dataset.classroomId, classroom.name));
            const shareBtn = li.querySelector('.share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', (e) => {
                    const shareUrl = `${window.location.origin}/classroom/${classroom.id}`;
                    shareLinkInput.value = shareUrl;
                    shareLinkDisplay.classList.remove('hidden');
                    // Copy to clipboard
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        showNotification('Share link copied to clipboard!', false);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                        showNotification('Failed to copy link. Please copy it manually.', true);
                    });
                });
            }
            classroomList.appendChild(li);
        });
    };
    
    const showClassroomSection = async (classroomId, className, isReconnect = false) => {
        if (!currentUser) {
            showNotification('You must be logged in to join a classroom.', true);
            return;
        }
        
        try {
            const response = await fetch(`/api/classrooms/${classroomId}`);
            const data = await response.json();

            if (!response.ok) {
                 showNotification(data.error || 'Failed to join classroom.', true);
                 return;
            }

            // Successfully joined/verified classroom membership
            currentClassroom = { id: classroomId, name: className };
            localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom));

            classNameValue.textContent = className;
            classCodeSpan.textContent = data.classroom.code;
            showSection('classroom-section');
            showClassroomSubSection('chat-section'); // Default to chat
            
            // Re-initialize socket connection
            if (socket) {
                socket.disconnect();
            }
            setupSocketConnection(classroomId);

            // Load initial content
            loadChatMessages(classroomId);
            loadLibraryFiles(classroomId);
            loadAssessments(classroomId);
            updateVideoRoleUI();

            // Notify user of connection
            if (!isReconnect) {
                showNotification(`Joined "${className}"!`, false);
            }

        } catch (error) {
            console.error('Error joining classroom:', error);
            showNotification('An error occurred while joining the classroom.', true);
        }
    };
    
    // --- Socket.IO and Messaging ---

    const setupSocketConnection = (classroomId) => {
        // Ensure a single socket connection
        if (socket) {
            socket.disconnect();
        }
        
        socket = io({
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('join_classroom', { classroomId: classroomId });
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        socket.on('new_chat_message', (data) => {
            appendChatMessage(data);
        });
        
        socket.on('user_joined', (data) => {
            showNotification(`${data.username} has joined the classroom.`);
            // Initiates WebRTC signaling for new user
            if (currentUser.role === 'admin' && data.user_sid !== socket.id) {
                startWebRTC(data.user_sid, true);
            }
        });
        
        socket.on('user_left', (data) => {
            showNotification(`${data.username} has left the classroom.`);
        });

        socket.on('library_file_uploaded', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(`New file uploaded by admin: ${data.file.name}`);
                loadLibraryFiles(data.classroomId); // Reload the file list
            }
        });

        socket.on('assessment_created', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(`New assessment created by admin: ${data.title}`);
                loadAssessments(data.classroomId); // Reload the assessment list
            }
        });
        
        socket.on('assessment_submitted', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(`A student has submitted an assessment!`);
            }
        });
        
        socket.on('admin_action_update', (data) => {
            if (data.classroomId === currentClassroom.id) {
                showNotification(data.message);
            }
        });

        // WebRTC Signaling Events
        socket.on('signal', (data) => {
            if (data.classroomId === currentClassroom.id) {
                handleSignal(data.sender_id, data.signal_data);
            }
        });

        socket.on('webrtc_ice_candidate', (data) => {
            if (data.sender_id && data.candidate) {
                handleIceCandidate(data.sender_id, data.candidate);
            }
        });
        
        socket.on('webrtc_peer_disconnected', (data) => {
            if (data.peer_id) {
                handlePeerDisconnected(data.peer_id);
            }
        });
    };

    const loadChatMessages = async (classroomId) => {
        if (!chatMessages) return;
        try {
            const response = await fetch(`/api/chat/${classroomId}`);
            const data = await response.json();
            if (response.ok) {
                chatMessages.innerHTML = '';
                data.messages.forEach(msg => appendChatMessage(msg));
            } else {
                console.error('Failed to load chat messages:', data.error);
            }
        } catch (error) {
            console.error('Error loading chat messages:', error);
        }
    };

    const appendChatMessage = (data) => {
        if (!chatMessages) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message-item');
        messageElement.innerHTML = `<span class="chat-username">${data.username}:</span> <span class="chat-text">${data.message}</span>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the bottom
    };
    
    // --- Whiteboard Functionality ---

    const setupWhiteboard = async (classroomId) => {
        if (!whiteboardCanvas) return;
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeWhiteboardCanvas();
        
        window.addEventListener('resize', resizeWhiteboardCanvas);

        // Load existing whiteboard data from server
        try {
            const response = await fetch(`/api/whiteboard/${classroomId}`);
            const data = await response.json();
            if (response.ok && data.whiteboard && data.whiteboard.pages) {
                whiteboardPages = data.whiteboard.pages;
                currentPageIndex = 0;
                renderWhiteboardPage();
                showWhiteboardRoleMessage();
            }
        } catch (error) {
            console.error('Error loading whiteboard data:', error);
        }

        // Add event listeners for drawing
        whiteboardCanvas.addEventListener('mousedown', startDrawing);
        whiteboardCanvas.addEventListener('mousemove', draw);
        whiteboardCanvas.addEventListener('mouseup', stopDrawing);
        whiteboardCanvas.addEventListener('mouseleave', stopDrawing);

        // Touch events for mobile
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

        // Tool and UI listeners
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;
            });
        });
        if (colorPicker) {
            colorPicker.addEventListener('change', (e) => currentColor = e.target.value);
        }
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('change', (e) => currentBrushSize = parseInt(e.target.value));
        }

        // Action buttons
        if (undoButton) {
            undoButton.addEventListener('click', undoDrawing);
        }
        if (redoButton) {
            redoButton.addEventListener('click', redoDrawing);
        }
        if (clearButton) {
            clearButton.addEventListener('click', clearWhiteboard);
        }
        if (saveButton) {
            saveButton.addEventListener('click', saveWhiteboardAsImage);
        }

        if (prevWhiteboardPageBtn) {
            prevWhiteboardPageBtn.addEventListener('click', prevWhiteboardPage);
        }
        if (nextWhiteboardPageBtn) {
            nextWhiteboardPageBtn.addEventListener('click', nextWhiteboardPage);
        }

        // Socket listener for new drawing data
        socket.on('new_drawing_data', (data) => {
            if (data.pageIndex === currentPageIndex) {
                applyDrawingCommand(data.drawingData);
            }
        });
        
        // Socket listener for full state sync (e.g., when a user joins)
        socket.on('whiteboard_state_sync', (data) => {
            if (data.whiteboard && data.whiteboard.pages) {
                whiteboardPages = data.whiteboard.pages;
                currentPageIndex = 0; // Reset to the first page
                renderWhiteboardPage();
            }
        });

        // Socket listener for page change from other clients
        socket.on('whiteboard_page_changed', (data) => {
            currentPageIndex = data.pageIndex;
            renderWhiteboardPage();
        });
    };

    const resizeWhiteboardCanvas = () => {
        if (!whiteboardCanvas) return;
        // Adjust canvas size to fit the container
        const whiteboardContainer = whiteboardCanvas.parentElement;
        const imageData = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCanvas.width = whiteboardContainer.clientWidth;
        whiteboardCanvas.height = whiteboardContainer.clientHeight;
        whiteboardCtx.putImageData(imageData, 0, 0);
        renderWhiteboardPage(); // Re-render the current page to the new size
    };

    const showWhiteboardRoleMessage = () => {
        if (whiteboardRoleMessage) {
            if (currentUser.role === 'admin') {
                whiteboardRoleMessage.textContent = "You are the admin. Your drawings are broadcast to all users.";
                whiteboardRoleMessage.classList.remove('user-view-subtle');
                whiteboardRoleMessage.classList.add('admin-feature-highlight');
            } else {
                whiteboardRoleMessage.textContent = "You are a student. You can draw on your own whiteboard, but your drawings are not broadcast.";
                whiteboardRoleMessage.classList.remove('admin-feature-highlight');
                whiteboardRoleMessage.classList.add('user-view-subtle');
            }
        }
    };

    const startDrawing = (e) => {
        isDrawing = true;
        const { x, y } = getMousePos(e);
        startX = x;
        startY = y;
        lastX = x; // Initialize lastX and lastY for smooth drawing
        lastY = y;
        currentStrokePoints = [{ x, y }]; // Start a new stroke
        
        // Save the canvas state before drawing
        snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const { x, y } = getMousePos(e);
        const command = {
            tool: currentTool,
            color: currentColor,
            size: currentBrushSize,
            x1: lastX,
            y1: lastY,
            x2: x,
            y2: y
        };

        applyDrawingCommand(command);
        lastX = x;
        lastY = y;
        currentStrokePoints.push({ x, y });

        // Broadcast drawing data if user is an admin
        if (currentUser && currentUser.role === 'admin') {
            socket.emit('drawing_data', {
                classroomId: currentClassroom.id,
                drawingData: command,
                pageIndex: currentPageIndex
            });
        }
    };

    const stopDrawing = (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        if (currentStrokePoints.length > 1) {
             const command = {
                tool: currentTool,
                color: currentColor,
                size: currentBrushSize,
                points: currentStrokePoints
            };
            whiteboardPages[currentPageIndex].push(command);
            undoStack.push(command);
            redoStack.length = 0; // Clear redo stack on new action
            enforceHistoryLimit();
        }
        currentStrokePoints = [];
    };

    const applyDrawingCommand = (command) => {
        whiteboardCtx.beginPath();
        whiteboardCtx.strokeStyle = command.color;
        whiteboardCtx.lineWidth = command.size;
        whiteboardCtx.lineCap = 'round';

        if (command.tool === 'pen' || command.tool === 'eraser') {
            if (command.tool === 'eraser') {
                whiteboardCtx.strokeStyle = 'white'; // Use whiteboard background color
            }
            whiteboardCtx.moveTo(command.x1, command.y1);
            whiteboardCtx.lineTo(command.x2, command.y2);
            whiteboardCtx.stroke();
        }
    };
    
    const undoDrawing = () => {
        if (undoStack.length > 0) {
            const lastCommand = undoStack.pop();
            redoStack.push(lastCommand);
            whiteboardPages[currentPageIndex].pop();
            renderWhiteboardPage();
            // TODO: Signal to other admins to undo
        }
    };

    const redoDrawing = () => {
        if (redoStack.length > 0) {
            const lastUndoCommand = redoStack.pop();
            undoStack.push(lastUndoCommand);
            whiteboardPages[currentPageIndex].push(lastUndoCommand);
            applyDrawingCommand(lastUndoCommand);
            // TODO: Signal to other admins to redo
        }
    };

    const clearWhiteboard = () => {
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardPages[currentPageIndex] = [];
        undoStack.length = 0;
        redoStack.length = 0;
    };

    const renderWhiteboardPage = () => {
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        const currentPageDrawings = whiteboardPages[currentPageIndex];
        if (currentPageDrawings) {
            currentPageDrawings.forEach(cmd => applyDrawingCommand(cmd));
        }
        updatePageDisplay();
    };

    const updatePageDisplay = () => {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1} of ${whiteboardPages.length}`;
        }
    };

    const enforceHistoryLimit = () => {
        if (whiteboardPages[currentPageIndex].length > MAX_HISTORY_STEPS) {
            whiteboardPages[currentPageIndex].shift(); // Remove the oldest command
        }
    };

    const prevWhiteboardPage = () => {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderWhiteboardPage();
            // Broadcast the page change
            if (currentUser.role === 'admin') {
                socket.emit('whiteboard_page_change', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex
                });
            }
        }
    };

    const nextWhiteboardPage = () => {
        // If we are at the last page, create a new one
        if (currentPageIndex === whiteboardPages.length - 1) {
            whiteboardPages.push([]);
        }
        currentPageIndex++;
        renderWhiteboardPage();
        // Broadcast the page change
        if (currentUser.role === 'admin') {
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex
            });
        }
    };

    const saveWhiteboardAsImage = () => {
        const image = whiteboardCanvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `whiteboard-page-${currentPageIndex + 1}.png`;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const getMousePos = (e) => {
        const rect = whiteboardCanvas.getBoundingClientRect();
        return {
            x: (e.clientX || e.touches[0].clientX) - rect.left,
            y: (e.clientY || e.touches[0].clientY) - rect.top
        };
    };

    // --- Library Functions ---

    const loadLibraryFiles = async (classroomId, searchQuery = '') => {
        if (!libraryFilesList) return;
        try {
            const response = await fetch(`/api/library/${classroomId}`);
            const data = await response.json();
            if (response.ok) {
                const filteredFiles = data.files.filter(file => 
                    file.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                renderLibraryFiles(filteredFiles);
            }
        } catch (error) {
            console.error('Error loading library files:', error);
        }
    };

    const renderLibraryFiles = (files) => {
        if (!libraryFilesList) return;
        libraryFilesList.innerHTML = '';
        if (files.length === 0) {
            libraryFilesList.innerHTML = '<p>No files have been uploaded yet.</p>';
            return;
        }

        files.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <i class="fas fa-file"></i>
                    <a href="${file.url}" target="_blank">${file.name}</a>
                </span>
                <span class="file-meta">
                    Uploaded by ${file.uploaded_by} on ${new Date(file.uploaded_at).toLocaleDateString()}
                </span>
            `;
            libraryFilesList.appendChild(li);
        });
    };

    const handleUploadLibraryFiles = async () => {
        if (!libraryFileInput || libraryFileInput.files.length === 0) {
            showNotification('Please select a file to upload.', true);
            return;
        }

        const formData = new FormData();
        formData.append('file', libraryFileInput.files[0]);

        try {
            const response = await fetch(`/api/library/${currentClassroom.id}/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('File uploaded successfully!', false);
                libraryFileInput.value = ''; // Clear the input
                loadLibraryFiles(currentClassroom.id); // Reload the list
            } else {
                showNotification(data.error, true);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            showNotification('An error occurred during upload. Please try again.', true);
        }
    };

    const updateLibraryRoleMessage = () => {
        if (libraryRoleMessage) {
            if (currentUser.role === 'admin') {
                libraryRoleMessage.textContent = "You are the admin. You can upload and manage files for this classroom.";
                libraryRoleMessage.classList.remove('user-view-subtle');
                libraryRoleMessage.classList.add('admin-feature-highlight');
                if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.classList.remove('hidden');
            } else {
                libraryRoleMessage.textContent = "You are a student. You can view and download files from the library.";
                libraryRoleMessage.classList.remove('admin-feature-highlight');
                libraryRoleMessage.classList.add('user-view-subtle');
                if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.classList.add('hidden');
            }
        }
    };

    // --- Assessments Functions ---

    const loadAssessments = async (classroomId, searchQuery = '') => {
        if (!assessmentListDiv) return;
        try {
            const response = await fetch(`/api/assessments/${classroomId}`);
            const data = await response.json();
            if (response.ok) {
                const filteredAssessments = data.assessments.filter(assessment => 
                    assessment.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
                renderAssessments(filteredAssessments);
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
        }
    };

    const renderAssessments = (assessments) => {
        if (!assessmentListDiv) return;
        assessmentListDiv.innerHTML = '';
        if (assessments.length === 0) {
            assessmentListDiv.innerHTML = '<p>No assessments available.</p>';
            return;
        }
        
        assessments.forEach(assessment => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="assessment-item">
                    <span>
                        <strong>${assessment.title}</strong>
                        <br><small>Created by: ${assessment.created_by}</small>
                        <br><small>Scheduled: ${assessment.scheduled_at ? new Date(assessment.scheduled_at).toLocaleString() : 'N/A'}</small>
                        <br><small>Duration: ${assessment.duration_minutes ? assessment.duration_minutes + ' mins' : 'N/A'}</small>
                    </span>
                    <div class="assessment-actions">
                        <button class="btn-primary take-assessment-btn" data-assessment-id="${assessment.id}">Take Assessment</button>
                        ${currentUser.role === 'admin' ? 
                            `<button class="btn-info view-submissions-btn" data-assessment-id="${assessment.id}">View Submissions</button>` : ''}
                    </div>
                </div>
            `;
            li.querySelector('.take-assessment-btn').addEventListener('click', (e) => {
                currentAssessmentToTake = assessments.find(a => a.id === e.target.dataset.assessmentId);
                showAssessmentTakingSection(currentAssessmentToTake);
            });
            const viewSubmissionsBtn = li.querySelector('.view-submissions-btn');
            if (viewSubmissionsBtn) {
                viewSubmissionsBtn.addEventListener('click', (e) => {
                    viewSubmissions(e.target.dataset.assessmentId);
                });
            }
            assessmentListDiv.appendChild(li);
        });
    };

    const addQuestionField = () => {
        if (!questionsContainer) return;

        const questionIndex = questionsContainer.children.length;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-block');
        questionDiv.innerHTML = `
            <hr>
            <h4>Question ${questionIndex + 1}</h4>
            <div class="form-group">
                <label for="question-type-${questionIndex}">Question Type:</label>
                <select id="question-type-${questionIndex}" class="question-type-select">
                    <option value="text">Text Answer</option>
                    <option value="mcq">Multiple Choice</option>
                </select>
            </div>
            <div class="form-group">
                <label for="question-text-${questionIndex}">Question Text:</label>
                <textarea id="question-text-${questionIndex}" class="question-text-input" rows="3" required></textarea>
            </div>
            <div class="mcq-options hidden" id="mcq-options-${questionIndex}">
                <label>Options (Check correct answer):</label>
                <div><input type="radio" name="correct-option-${questionIndex}" value="0" required> <input type="text" placeholder="Option A" required></div>
                <div><input type="radio" name="correct-option-${questionIndex}" value="1"> <input type="text" placeholder="Option B" required></div>
                <div><input type="radio" name="correct-option-${questionIndex}" value="2"> <input type="text" placeholder="Option C" required></div>
                <div><input type="radio" name="correct-option-${questionIndex}" value="3"> <input type="text" placeholder="Option D" required></div>
            </div>
        `;
        questionsContainer.appendChild(questionDiv);
        
        const typeSelect = questionDiv.querySelector(`#question-type-${questionIndex}`);
        const mcqOptionsDiv = questionDiv.querySelector(`#mcq-options-${questionIndex}`);

        typeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
            }
        });
    };

    const handleCreateAssessment = async (e) => {
        e.preventDefault();
        const questions = [];
        const questionBlocks = document.querySelectorAll('.question-block');
        let isValid = true;

        questionBlocks.forEach(block => {
            const type = block.querySelector('.question-type-select').value;
            const text = block.querySelector('.question-text-input').value;
            let question = { type, text };

            if (type === 'mcq') {
                const options = [];
                const optionInputs = block.querySelectorAll('.mcq-options input[type="text"]');
                const correctOption = block.querySelector('.mcq-options input[type="radio"]:checked');

                optionInputs.forEach(input => options.push(input.value));
                
                if (!correctOption) {
                    showNotification('Please select a correct answer for all multiple-choice questions.', true);
                    isValid = false;
                    return;
                }
                const correctAnswerIndex = parseInt(correctOption.value);
                
                question.options = options;
                question.correctAnswer = options[correctAnswerIndex];
            }
            questions.push(question);
        });

        if (!isValid) return;

        const assessmentData = {
            title: assessmentTitleInput.value,
            description: assessmentDescriptionTextarea.value,
            questions,
            scheduled_at: assessmentScheduledAtInput.value,
            duration_minutes: assessmentDurationMinutesInput.value
        };

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentData)
            });
            const data = await response.json();
            if (response.ok) {
                displayMessage(assessmentCreationMessage, 'Assessment created successfully!', false);
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = '';
                addQuestionField();
                showNotification('Assessment created and shared with classroom!', false);
                loadAssessments(currentClassroom.id);
            } else {
                displayMessage(assessmentCreationMessage, data.error, true);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            displayMessage(assessmentCreationMessage, 'An error occurred. Please try again.', true);
        }
    };

    const showAssessmentTakingSection = async (assessment) => {
        if (!assessment) return;
        
        showClassroomSubSection('take-assessment-container');
        takeAssessmentTitle.textContent = assessment.title;
        takeAssessmentDescription.textContent = assessment.description;
        takeAssessmentForm.innerHTML = '';
        assessmentSubmissionMessage.textContent = '';
        
        // Start the timer
        if (assessmentTimerInterval) clearInterval(assessmentTimerInterval);
        assessmentEndTime = new Date(Date.now() + assessment.duration_minutes * 60 * 1000);
        assessmentTimerInterval = setInterval(updateAssessmentTimer, 1000);
        
        try {
            const response = await fetch(`/api/assessments/questions/${assessment.id}`);
            const data = await response.json();
            if (response.ok) {
                data.questions.forEach(q => {
                    const questionDiv = document.createElement('div');
                    questionDiv.classList.add('take-assessment-question');
                    questionDiv.innerHTML = `
                        <h4>${q.text}</h4>
                        <div data-question-id="${q.id}">
                            ${q.type === 'mcq' ? 
                                q.options.map((option, index) => `
                                    <label>
                                        <input type="radio" name="q-${q.id}" value="${option}" required>
                                        ${option}
                                    </label><br>
                                `).join('') : 
                                `<textarea name="q-${q.id}" rows="3" required></textarea>`
                            }
                        </div>
                    `;
                    takeAssessmentForm.appendChild(questionDiv);
                });
            } else {
                showNotification(data.error, true);
            }
        } catch (error) {
            console.error('Error loading questions:', error);
            showNotification('Failed to load assessment questions.', true);
        }
    };

    const updateAssessmentTimer = () => {
        const now = new Date();
        const timeLeft = assessmentEndTime - now;
        
        if (timeLeft <= 0) {
            clearInterval(assessmentTimerInterval);
            assessmentTimerDisplay.textContent = "Time's Up!";
            submitAnswers(); // Auto-submit when time runs out
            return;
        }

        const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        
        assessmentTimerDisplay.textContent = `Time Left: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const submitAnswers = async () => {
        const answers = [];
        const questionDivs = takeAssessmentForm.querySelectorAll('.take-assessment-question');
        questionDivs.forEach(div => {
            const questionId = div.querySelector('div[data-question-id]').dataset.questionId;
            const input = div.querySelector(`[name="q-${questionId}"]`);
            let answer;

            if (input.type === 'radio') {
                answer = div.querySelector(`[name="q-${questionId}"]:checked`)?.value;
            } else {
                answer = input.value;
            }
            answers.push({ question_id: questionId, answer: answer });
        });

        try {
            const response = await fetch('/api/assessments/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment_id: currentAssessmentToTake.id,
                    classroomId: currentClassroom.id,
                    answers
                })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('Assessment submitted successfully!', false);
                showClassroomSubSection('assessments-section');
                loadAssessments(currentClassroom.id);
            } else {
                showNotification(data.error, true);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            showNotification('An error occurred during submission. Please try again.', true);
        }
    };

    const viewSubmissions = async (assessmentId) => {
        showClassroomSubSection('view-submissions-container');
        submissionsAssessmentTitle.textContent = `Submissions for Assessment ID: ${assessmentId}`;
        submissionsList.innerHTML = 'Loading submissions...';

        try {
            const response = await fetch(`/api/assessments/submissions/${assessmentId}`);
            const data = await response.json();
            if (response.ok) {
                renderSubmissions(data.submissions);
            } else {
                showNotification(data.error, true);
                submissionsList.innerHTML = `<p class="error">${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
            submissionsList.innerHTML = `<p class="error">An error occurred while fetching submissions.</p>`;
        }
    };

    const renderSubmissions = (submissions) => {
        if (!submissionsList) return;
        submissionsList.innerHTML = '';
        if (submissions.length === 0) {
            submissionsList.innerHTML = '<p>No submissions have been made yet.</p>';
            return;
        }

        submissions.forEach(submission => {
            const submissionDiv = document.createElement('div');
            submissionDiv.classList.add('submission-item');
            submissionDiv.innerHTML = `
                <h4>Submission by ${submission.username}</h4>
                <p>Submitted at: ${new Date(submission.submitted_at).toLocaleString()}</p>
                <h5>Answers:</h5>
                <ul>
                    ${submission.answers.map(ans => `
                        <li>
                            <strong>Question ID:</strong> ${ans.question_id}
                            <br><strong>Answer:</strong> ${ans.answer}
                        </li>
                    `).join('')}
                </ul>
                <hr>
            `;
            submissionsList.appendChild(submissionDiv);
        });
    };

    // --- WebRTC (Video Broadcast) ---
    const updateVideoRoleUI = () => {
        if (broadcastRoleMessage) {
            if (currentUser.role === 'admin') {
                broadcastRoleMessage.textContent = "You are the admin. You can start a broadcast that all members will see.";
                broadcastRoleMessage.classList.remove('user-view-subtle');
                broadcastRoleMessage.classList.add('admin-feature-highlight');
                if (startBroadcastBtn) startBroadcastBtn.classList.remove('hidden');
            } else {
                broadcastRoleMessage.textContent = "You are a student. You will automatically receive the admin's broadcast when it starts.";
                broadcastRoleMessage.classList.remove('admin-feature-highlight');
                broadcastRoleMessage.classList.add('user-view-subtle');
                if (startBroadcastBtn) startBroadcastBtn.classList.add('hidden');
            }
        }
        if (endBroadcastBtn) {
            endBroadcastBtn.classList.add('hidden');
        }
    };

    const startBroadcast = async () => {
        if (!currentClassroom || currentUser.role !== 'admin') return;
        try {
            const broadcastType = document.querySelector('input[name="broadcastType"]:checked')?.value || 'video-only';
            localStream = await navigator.mediaDevices.getUserMedia({
                video: broadcastType.includes('video'),
                audio: true,
            });

            if (broadcastType === 'screen-and-video') {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                // Combine audio from webcam and video from screen
                screenStream.getTracks().forEach(track => localStream.addTrack(track));
            }

            localVideo.srcObject = localStream;
            localVideoContainer.classList.remove('hidden'); // Show the local video container

            // Find all connected peers in the room
            const response = await fetch(`/api/classrooms/${currentClassroom.id}`);
            const data = await response.json();
            if (response.ok) {
                const members = data.classroom.members;
                members.forEach(member => {
                    if (member.id !== currentUser.id) {
                        // Start a WebRTC connection with each member
                        startWebRTC(member.id);
                    }
                });
            }

            // Signal to all other members that a broadcast has started
            socket.emit('start_broadcast', { classroomId: currentClassroom.id, broadcastType });
            startBroadcastBtn.classList.add('hidden');
            endBroadcastBtn.classList.remove('hidden');
            
            showNotification("Broadcast started!", false);
        } catch (error) {
            console.error('Error starting broadcast:', error);
            showNotification('Failed to start broadcast. Please check your camera/mic permissions.', true);
        }
    };

    const endBroadcast = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        // Close all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                handlePeerDisconnected(peerId);
            }
        }

        // Hide local video
        localVideoContainer.classList.add('hidden');

        // Signal to all other members that the broadcast has ended
        socket.emit('end_broadcast', { classroomId: currentClassroom.id });
        startBroadcastBtn.classList.remove('hidden');
        endBroadcastBtn.classList.add('hidden');
        
        showNotification("Broadcast ended.", false);
    };

    const startWebRTC = (peerId, isInitiator = false) => {
        const peerConnection = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = peerConnection;

        // Add local stream tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to the other peer via the signaling server
                socket.emit('webrtc_ice_candidate', {
                    recipient_id: peerId,
                    candidate: event.candidate,
                    classroomId: currentClassroom.id
                });
            }
        };

        if (isInitiator) {
            // Create an offer and send it to the other peer
            peerConnection.onnegotiationneeded = async () => {
                try {
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    socket.emit('signal', {
                        recipient_id: peerId,
                        signal_data: peerConnection.localDescription,
                        classroomId: currentClassroom.id
                    });
                } catch (error) {
                    console.error('Error creating offer:', error);
                }
            };
        } else {
            // When a remote stream is received, display it
            peerConnection.ontrack = (event) => {
                if (remoteVideoContainer) {
                    const video = document.createElement('video');
                    video.id = `remote-video-${peerId}`;
                    video.srcObject = event.streams[0];
                    video.autoplay = true;
                    video.playsInline = true;
                    video.controls = true; // For demonstration, show controls
                    remoteVideoContainer.appendChild(video);
                }
            };
        }
    };

    const handleSignal = async (senderId, signalData) => {
        let peerConnection = peerConnections[senderId];
        if (!peerConnection) {
            // If we don't have a peer connection yet, create one
            peerConnection = new RTCPeerConnection(iceServers);
            peerConnections[senderId] = peerConnection;

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('webrtc_ice_candidate', {
                        recipient_id: senderId,
                        candidate: event.candidate,
                        classroomId: currentClassroom.id
                    });
                }
            };

            peerConnection.ontrack = (event) => {
                if (remoteVideoContainer) {
                    const video = document.createElement('video');
                    video.id = `remote-video-${senderId}`;
                    video.srcObject = event.streams[0];
                    video.autoplay = true;
                    video.playsInline = true;
                    video.controls = true;
                    remoteVideoContainer.appendChild(video);
                }
            };
        }

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));

            if (signalData.type === 'offer') {
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('signal', {
                    recipient_id: senderId,
                    signal_data: peerConnection.localDescription,
                    classroomId: currentClassroom.id
                });
            }
        } catch (error) {
            console.error('Error handling signal:', error);
        }
    };

    const handleIceCandidate = (senderId, candidate) => {
        const peerConnection = peerConnections[senderId];
        if (peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error('Error adding received ice candidate', e));
        }
    };

    const handlePeerDisconnected = (peerId) => {
        if (peerConnections[peerId]) {
            peerConnections[peerId].close();
            delete peerConnections[peerId];
        }
        const videoEl = document.getElementById(`remote-video-${peerId}`);
        if (videoEl) {
            videoEl.parentElement.removeChild(videoEl);
        }
    };


    // --- Event Listeners ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', showRegisterForm);
    }
    if (showLoginLink) {
        showLoginLink.addEventListener('click', showLoginForm);
    }
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (navDashboard) {
        navDashboard.addEventListener('click', () => showSection('dashboard-section'));
    }
    if (navClassroom) {
        navClassroom.addEventListener('click', () => {
            if (currentClassroom && currentClassroom.id) {
                // If already in a classroom, show the classroom section
                showSection('classroom-section');
            } else {
                // Otherwise, show the dashboard to join one
                showSection('dashboard-section');
            }
        });
    }
    if (navSettings) {
        navSettings.addEventListener('click', () => {
            showSection('settings-section');
            if (currentUser) {
                settingsUsernameInput.value = currentUser.username;
                settingsEmailInput.value = currentUser.email;
            }
        });
    }

    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', handleCreateClassroom);
    }
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            showSection('dashboard-section');
            currentClassroom = null;
            localStorage.removeItem('currentClassroom');
            if (socket) {
                socket.emit('leave_classroom', { classroomId: currentClassroom.id });
                socket.disconnect();
            }
        });
    }
    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => showSection('dashboard-section'));
    }
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', handleUpdateProfile);
    }

    if (navChat) {
        navChat.addEventListener('click', () => showClassroomSubSection('chat-section'));
    }
    if (navWhiteboard) {
        navWhiteboard.addEventListener('click', () => {
            showClassroomSubSection('whiteboard-area');
            setupWhiteboard(currentClassroom.id);
        });
    }
    if (navLibrary) {
        navLibrary.addEventListener('click', () => {
            showClassroomSubSection('library-section');
            updateLibraryRoleMessage();
            loadLibraryFiles(currentClassroom.id);
        });
    }
    if (navAssessments) {
        navAssessments.addEventListener('click', () => {
            showClassroomSubSection('assessments-section');
            loadAssessments(currentClassroom.id);
        });
    }
    
    // Classroom list search
    if (classroomSearchInput) {
        classroomSearchInput.addEventListener('input', loadUserClassrooms);
    }

    // Chat functionality
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', () => {
            const message = chatInput.value;
            if (message && currentClassroom) {
                socket.emit('chat_message', { classroomId: currentClassroom.id, message });
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

    // Library search
    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', (e) => loadLibraryFiles(currentClassroom.id, e.target.value));
    }
    
    // Library file upload
    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', handleUploadLibraryFiles);
    }
    
    // Assessment creation
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', addQuestionField);
        addQuestionField(); // Add the first question field on page load
    }
    if (assessmentCreationForm) {
        assessmentCreationForm.addEventListener('submit', handleCreateAssessment);
    }
    // Assessment list search
    if (assessmentSearchInput) {
        assessmentSearchInput.addEventListener('input', (e) => loadAssessments(currentClassroom.id, e.target.value));
    }
    
    // Assessment submission
    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', submitAnswers);
    }
    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            showClassroomSubSection('assessments-section');
            if (assessmentTimerInterval) clearInterval(assessmentTimerInterval);
        });
    }
    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            showClassroomSubSection('assessments-section');
        });
    }

    // Broadcast listeners
    if (startBroadcastBtn) {
        startBroadcastBtn.addEventListener('click', startBroadcast);
    }
    if (endBroadcastBtn) {
        endBroadcastBtn.addEventListener('click', endBroadcast);
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
