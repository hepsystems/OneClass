// app.js (Complete Rewrite with Hamburger Menu, Whiteboard Pages, Notifications, and Selective Broadcast)

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
    const ctx = whiteboardCanvas.getContext('2d');
    const toolbar = document.querySelector('.toolbar'); // Now inside the sidebar
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
    let currentClassroomId = null;
    let currentUserRole = null;
    let currentUsername = null;
    let localStream; // For video broadcast
    const peerConnections = {}; // Store RTCPeerConnection objects
    let currentWhiteboardPage = 0; // 0-indexed for current page
    let whiteboardPages = [[]]; // Array of arrays, each sub-array is a page of drawings
    let drawingHistory = []; // Stores drawing actions for undo/redo for current page
    let historyPointer = -1; // Pointer for undo/redo
    let isDrawing = false;
    let currentTool = 'pen';
    let lastX = 0;
    let lastY = 0;
    let currentAssessmentToTake = null;

    // --- Utility Functions ---

    function showSection(sectionToShow) {
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('hidden');
        });
        sectionToShow.classList.remove('hidden');
    }

    function showClassroomSubSection(sectionToShow) {
        document.querySelectorAll('.classroom-sub-section').forEach(subSection => {
            subSection.classList.add('hidden');
        });
        sectionToShow.classList.remove('hidden');
    }

    function showNotification(message, type = 'info', duration = 3000) {
        const notificationDiv = document.createElement('div');
        notificationDiv.classList.add('notification-message');
        notificationDiv.textContent = message;

        // Add type-specific classes if needed (e.g., 'success', 'error')
        if (type === 'success') {
            notificationDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.7)';
        } else if (type === 'error') {
            notificationDiv.style.backgroundColor = 'rgba(220, 53, 69, 0.7)';
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


    function updateAdminOnlyElements(role) {
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            if (role === 'admin') {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
        document.querySelectorAll('[data-user-only]').forEach(el => {
            if (role === 'user') {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // Specific handling for whiteboard role message
        if (whiteboardRoleMessage) {
            if (role === 'user') {
                whiteboardRoleMessage.textContent = "You are a user. Only admins can draw on the whiteboard.";
                whiteboardRoleMessage.classList.remove('hidden');
            } else {
                whiteboardRoleMessage.classList.add('hidden');
            }
        }
        // Specific handling for broadcast role message
        if (broadcastRoleMessage) {
            if (role === 'user') {
                broadcastRoleMessage.textContent = "You can view broadcasts. Only admins can start/stop broadcasts.";
                broadcastRoleMessage.classList.remove('hidden');
            } else {
                broadcastRoleMessage.classList.add('hidden');
            }
        }
        // Specific handling for library role message
        if (libraryRoleMessage) {
            if (role === 'user') {
                libraryRoleMessage.textContent = "You can download files. Only admins can upload files.";
                libraryRoleMessage.classList.remove('hidden');
            } else {
                libraryRoleMessage.classList.add('hidden');
            }
        }
    }


    // --- Authentication Functions ---

    async function checkLoginStatus() {
        const response = await fetch('/@me');
        if (response.ok) {
            const data = await response.json();
            currentUserRole = data.role;
            currentUsername = data.username;
            currentUsernameDisplay.textContent = currentUsername;
            updateAdminOnlyElements(currentUserRole);
            showSection(dashboardSection);
            loadClassrooms();
            initSocketIO(); // Initialize socket after successful login
        } else {
            showSection(authSection);
        }
    }

    async function handleAuth(event, endpoint) {
        event.preventDefault();
        const form = event.target;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;
        const username = form.querySelector('#register-username') ? form.querySelector('#register-username').value : null;
        const role = form.querySelector('#register-role') ? form.querySelector('#register-role').value : 'user';

        const payload = { email, password };
        if (username) payload.username = username;
        if (role) payload.role = role;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        authMessage.textContent = data.message;

        if (response.ok) {
            showNotification(data.message, 'success');
            setTimeout(() => {
                authMessage.textContent = '';
                checkLoginStatus(); // Re-check status to navigate to dashboard
            }, 1000);
        } else {
            showNotification(data.message, 'error');
        }
    }

    // --- Dashboard Functions ---

    async function loadClassrooms() {
        const response = await fetch('/classrooms');
        if (response.ok) {
            const classrooms = await response.json();
            classroomList.innerHTML = '';
            if (classrooms.length === 0) {
                classroomList.innerHTML = '<li>No classrooms available.</li>';
                return;
            }
            classrooms.forEach(classroom => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${classroom.name} (Code: ${classroom.code})</span>
                    <button data-id="${classroom._id}">Join</button>
                `;
                classroomList.appendChild(li);
            });
        } else {
            classroomList.innerHTML = '<li>Failed to load classrooms.</li>';
            showNotification('Failed to load classrooms.', 'error');
        }
    }

    async function createClassroom() {
        const name = newClassroomNameInput.value.trim();
        if (!name) {
            showNotification('Classroom name cannot be empty.', 'error');
            return;
        }

        const response = await fetch('/classrooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        const data = await response.json();
        classroomMessage.textContent = data.message;
        if (response.ok) {
            showNotification(data.message, 'success');
            newClassroomNameInput.value = '';
            loadClassrooms();
        } else {
            showNotification(data.message, 'error');
        }
    }

    async function joinClassroom(classroomId) {
        const response = await fetch(`/classrooms/${classroomId}/join`, { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
            currentClassroomId = classroomId;
            classNameValue.textContent = data.classroom_name;
            classCodeDisplay.textContent = data.classroom_code;
            showSection(classroomSection);
            showClassroomSubSection(whiteboardArea); // Default to whiteboard
            navWhiteboard.classList.add('active-nav');
            socket.emit('join_classroom', { classroomId: currentClassroomId });
            showNotification(`Joined classroom: ${data.classroom_name}`, 'success');
            resetWhiteboard(); // Clear and prepare whiteboard for new classroom
            loadChatHistory();
            loadLibraryFiles();
            loadAssessments();
            checkUserRoleInClassroom(); // Check permissions specifically for this classroom
        } else {
            showNotification(data.message, 'error');
        }
    }

    async function leaveClassroom() {
        if (!currentClassroomId) return;
        socket.emit('leave_classroom', { classroomId: currentClassroomId });
        currentClassroomId = null;
        if (localStream) {
            endBroadcast(); // End broadcast if active
        }
        // Clean up remote videos
        remoteVideoContainer.innerHTML = '';
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
            }
        }
        showSection(dashboardSection);
        showNotification('Left classroom.', 'info');
        loadClassrooms(); // Refresh classroom list
    }

    async function checkUserRoleInClassroom() {
        // This is mainly for UI updates. The server always verifies permissions.
        // If the user's role changed (e.g., admin made them a user), this should reflect.
        const response = await fetch('/@me');
        if (response.ok) {
            const data = await response.json();
            currentUserRole = data.role; // Update global role variable
            updateAdminOnlyElements(currentUserRole);
        }
    }

    // --- Settings Functions ---
    async function updateProfile(event) {
        event.preventDefault();
        const newUsername = settingsUsernameInput.value.trim();
        if (!newUsername) {
            showNotification("Username cannot be empty.", 'error');
            return;
        }

        const response = await fetch('/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername })
        });
        const data = await response.json();
        if (response.ok) {
            currentUsername = newUsername; // Update global variable
            currentUsernameDisplay.textContent = currentUsername; // Update dashboard
            showNotification(data.message, 'success');
        } else {
            showNotification(data.message, 'error');
        }
    }

    async function loadUserProfile() {
        const response = await fetch('/@me');
        if (response.ok) {
            const data = await response.json();
            settingsUsernameInput.value = data.username;
            settingsEmailInput.value = data.email;
        } else {
            showNotification('Failed to load user profile.', 'error');
            // Redirect to auth if session expired
            showSection(authSection);
        }
    }

    // --- Socket.IO Initialization & Handlers ---

    function initSocketIO() {
        if (socket && socket.connected) {
            return; // Already initialized and connected
        }
        socket = io();

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server');
            if (currentClassroomId) {
                // Re-join classroom on reconnect
                socket.emit('join_classroom', { classroomId: currentClassroomId });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
            showNotification('Disconnected from server. Reconnecting...', 'error', 5000);
        });

        socket.on('error', (data) => {
            console.error('Socket error:', data.message);
            showNotification(`Socket Error: ${data.message}`, 'error');
        });

        socket.on('classroom_updated', (data) => {
            console.log('Classroom updated:', data);
            showNotification(data.message, 'info');
            loadClassrooms(); // Refresh list to see changes
        });

        socket.on('classroom_member_update', (data) => {
            console.log('Member update:', data.message);
            showNotification(data.message, 'info');
        });

        // Whiteboard Socket Events
        socket.on('drawing', (data) => {
            if (data.classroomId === currentClassroomId) {
                if (data.page === currentWhiteboardPage) {
                    draw(data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.tool, data.isNewPath, data.textData);
                }
                // Store on the correct page regardless of current view
                if (!whiteboardPages[data.page]) {
                    whiteboardPages[data.page] = [];
                }
                whiteboardPages[data.page].push(data);
            }
        });

        socket.on('clear_whiteboard', (data) => {
            if (data.classroomId === currentClassroomId) {
                ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                whiteboardPages[currentWhiteboardPage] = []; // Clear current page history
                drawingHistory = []; // Reset undo/redo for current page
                historyPointer = -1;
                showNotification(`Whiteboard page ${currentWhiteboardPage + 1} cleared by ${data.username}`, 'info');
            }
        });

        socket.on('whiteboard_state', (data) => {
            if (data.classroomId === currentClassroomId) {
                whiteboardPages = data.pages;
                // Ensure current page exists, if not, default to 0
                if (!whiteboardPages[currentWhiteboardPage]) {
                    currentWhiteboardPage = 0;
                    if (!whiteboardPages[currentWhiteboardPage]) {
                        whiteboardPages[currentWhiteboardPage] = []; // Ensure it's an empty array
                    }
                }
                redrawWhiteboard();
                showNotification('Whiteboard state synchronized.', 'info');
            }
        });

        socket.on('new_whiteboard_page_added', (data) => {
            if (data.classroomId === currentClassroomId) {
                whiteboardPages = data.pages;
                showNotification(`New whiteboard page added by ${data.username}. Total pages: ${whiteboardPages.length}`, 'info');
                updateWhiteboardPageDisplay();
            }
        });

        socket.on('whiteboard_page_removed', (data) => {
            if (data.classroomId === currentClassroomId) {
                whiteboardPages = data.pages;
                showNotification(`Whiteboard page removed by ${data.username}. Total pages: ${whiteboardPages.length}`, 'info');
                if (currentWhiteboardPage >= whiteboardPages.length && whiteboardPages.length > 0) {
                    currentWhiteboardPage = whiteboardPages.length - 1; // Go to last page if current was removed
                } else if (whiteboardPages.length === 0) {
                    currentWhiteboardPage = 0;
                    whiteboardPages = [[]]; // Start with an empty page
                }
                redrawWhiteboard();
                updateWhiteboardPageDisplay();
            }
        });


        // Chat Socket Events
        socket.on('receive_message', (data) => {
            if (data.classroomId === currentClassroomId) {
                appendChatMessage(data.username, data.message, data.timestamp);
            }
        });

        // Library Socket Events
        socket.on('file_uploaded', (data) => {
            if (data.classroomId === currentClassroomId) {
                showNotification(`New file uploaded: ${data.filename} by ${data.username}`, 'info');
                loadLibraryFiles(); // Refresh list
            }
        });

        socket.on('file_deleted', (data) => {
            if (data.classroomId === currentClassroomId) {
                showNotification(`File deleted: ${data.filename} by ${data.username}`, 'info');
                loadLibraryFiles(); // Refresh list
            }
        });

        // Assessment Socket Events
        socket.on('assessment_created', (data) => {
            if (data.classroomId === currentClassroomId) {
                showNotification(`New assessment created: "${data.title}" by ${data.username}`, 'success');
                loadAssessments();
            }
        });

        socket.on('assessment_submission', (data) => {
            if (data.classroomId === currentClassroomId) {
                showNotification(`New submission for "${data.assessment_title}" from ${data.username}`, 'info');
                // Admins might want to refresh submission view if they are on it
                if (viewSubmissionsContainer.classList.contains('active') && submissionsAssessmentTitle.textContent.includes(data.assessment_title)) {
                    viewSubmissions(data.assessment_id, data.assessment_title); // Refresh current view
                }
            }
        });

        socket.on('assessment_deleted', (data) => {
            if (data.classroomId === currentClassroomId) {
                showNotification(`Assessment "${data.title}" deleted by ${data.username}`, 'info');
                loadAssessments();
            }
        });

        // WebRTC Socket Events
        socket.on('webrtc_offer', async (data) => {
            const { offer, sender_id } = data;
            console.log('WEBRTC: Received offer from', sender_id);
            if (sender_id === socket.id) return; // Don't process our own offers

            const peer = createPeerConnection(sender_id);
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('webrtc_answer', {
                recipient_id: sender_id,
                answer: answer,
                classroomId: currentClassroomId
            });
        });

        socket.on('webrtc_answer', async (data) => {
            const { answer, sender_id } = data;
            console.log('WEBRTC: Received answer from', sender_id);
            if (sender_id === socket.id) return;
            const peer = peerConnections[sender_id];
            if (peer) {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            const { candidate, sender_id } = data;
            console.log('WEBRTC: Received ICE candidate from', sender_id);
            if (sender_id === socket.id) return;
            const peer = peerConnections[sender_id];
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding received ICE candidate:', e);
                }
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            const { peer_id } = data;
            console.log('WEBRTC: Peer disconnected:', peer_id);
            if (peerConnections[peer_id]) {
                peerConnections[peer_id].close();
                delete peerConnections[peer_id];
            }
            const remoteVideo = document.getElementById(`remote-video-${peer_id}`);
            if (remoteVideo) {
                remoteVideo.parentElement.remove(); // Remove the div wrapping the video
            }
            showNotification(`${peer_id} left the broadcast.`, 'info');
        });

        socket.on('admin_action_update', (data) => {
            if (data.classroomId === currentClassroomId) {
                showNotification(`Admin action: ${data.message}`, 'info');
            }
        });
    }

    // --- Whiteboard Functions ---

    function setupWhiteboardControls() {
        if (currentUserRole === 'user') {
            whiteboardCanvas.removeEventListener('mousedown', startDrawing);
            whiteboardCanvas.removeEventListener('mousemove', draw);
            whiteboardCanvas.removeEventListener('mouseup', stopDrawing);
            whiteboardCanvas.removeEventListener('mouseout', stopDrawing);
            toolbar.classList.add('hidden'); // Hide toolbar for users
            return;
        } else {
            toolbar.classList.remove('hidden'); // Show toolbar for admins
            whiteboardCanvas.addEventListener('mousedown', startDrawing);
            whiteboardCanvas.addEventListener('mousemove', draw);
            whiteboardCanvas.addEventListener('mouseup', stopDrawing);
            whiteboardCanvas.addEventListener('mouseout', stopDrawing);
        }

        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                toolButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTool = button.dataset.tool;
            });
        });

        colorPicker.addEventListener('change', () => {
            ctx.strokeStyle = colorPicker.value;
            ctx.fillStyle = colorPicker.value;
        });
        brushSizeInput.addEventListener('change', () => {
            ctx.lineWidth = brushSizeInput.value;
        });

        undoButton.addEventListener('click', undo);
        redoButton.addEventListener('click', redo);
        clearButton.addEventListener('click', clearWhiteboard);
        saveButton.addEventListener('click', saveWhiteboard);

        // Ensure initial settings for canvas context
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = colorPicker.value;
        ctx.fillStyle = colorPicker.value;
        ctx.lineWidth = brushSizeInput.value;
    }

    // Function to scale canvas for high-DPI displays
    function setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = whiteboardCanvas.getBoundingClientRect();
        whiteboardCanvas.width = rect.width * dpr;
        whiteboardCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        // Ensure styles match the scaled canvas
        whiteboardCanvas.style.width = rect.width + 'px';
        whiteboardCanvas.style.height = rect.height + 'px';
        redrawWhiteboard(); // Redraw content after scaling
    }

    function startDrawing(e) {
        if (currentUserRole !== 'admin') return;
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        drawingHistory = whiteboardPages[currentWhiteboardPage].slice(0, historyPointer + 1); // Trim history
        historyPointer = drawingHistory.length; // Set pointer to end
        drawingHistory.push({
            tool: currentTool,
            color: ctx.strokeStyle,
            size: ctx.lineWidth,
            isNewPath: true, // Mark start of a new path
            points: [],
            textData: null
        });
        if (currentTool === 'text') {
            // Prompt for text immediately
            const text = prompt("Enter text:");
            if (text) {
                const textSize = parseInt(ctx.lineWidth) + 10; // Make text larger than brush size
                drawingHistory[historyPointer].textData = { text: text, x: lastX, y: lastY, font: `${textSize}px Arial` };
                draw(lastX, lastY, lastX, lastY, ctx.strokeStyle, textSize, 'text', true, { text: text, x: lastX, y: lastY, font: `${textSize}px Arial` });
                socket.emit('drawing', {
                    classroomId: currentClassroomId,
                    x0: lastX, y0: lastY, x1: lastX, y1: lastY,
                    color: ctx.strokeStyle, size: textSize, tool: 'text',
                    isNewPath: true, textData: { text: text, x: lastX, y: lastY, font: `${textSize}px Arial` },
                    page: currentWhiteboardPage
                });
            }
            isDrawing = false; // Text is a single click action
        }
    }

    function draw(x0, y0, x1, y1, color, size, tool, isNewPath, textData = null) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = size;

        if (tool === 'pen' || tool === 'eraser') {
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        } else if (tool === 'line') {
            if (isNewPath) { // Only draw static shape on first point
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.stroke();
            }
        } else if (tool === 'rectangle') {
            if (isNewPath) {
                ctx.beginPath();
                ctx.rect(x0, y0, x1 - x0, y1 - y0);
                ctx.stroke();
            }
        } else if (tool === 'circle') {
            if (isNewPath) {
                const radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
                ctx.beginPath();
                ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
                ctx.stroke();
            }
        } else if (tool === 'text' && textData) {
            ctx.font = textData.font;
            ctx.fillText(textData.text, textData.x, textData.y);
        }
        ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
    }

    function drawingMove(e) {
        if (!isDrawing || currentUserRole !== 'admin') return;

        let x1 = e.offsetX;
        let y1 = e.offsetY;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            socket.emit('drawing', {
                classroomId: currentClassroomId,
                x0: lastX, y0: lastY, x1: x1, y1: y1,
                color: ctx.strokeStyle, size: ctx.lineWidth, tool: currentTool,
                isNewPath: false,
                page: currentWhiteboardPage
            });
            // Also store for local undo/redo
            drawingHistory[historyPointer].points.push({ x0: lastX, y0: lastY, x1: x1, y1: y1 });
            draw(lastX, lastY, x1, y1, ctx.strokeStyle, ctx.lineWidth, currentTool, false);
        } else {
            // For shape tools, redraw the whole page to show interactive resizing
            redrawWhiteboard(); // Clear and redraw
            draw(lastX, lastY, x1, y1, ctx.strokeStyle, ctx.lineWidth, currentTool, true);
        }
        [lastX, lastY] = [x1, y1];
    }


    function stopDrawing(e) {
        if (!isDrawing || currentUserRole !== 'admin') return;
        isDrawing = false;

        if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            let x1 = e.offsetX;
            let y1 = e.offsetY;
            socket.emit('drawing', {
                classroomId: currentClassroomId,
                x0: lastX, y0: lastY, x1: x1, y1: y1,
                color: ctx.strokeStyle, size: ctx.lineWidth, tool: currentTool,
                isNewPath: true, // Mark as complete shape
                page: currentWhiteboardPage
            });
            // Store for local undo/redo
            drawingHistory[historyPointer].x0 = lastX;
            drawingHistory[historyPointer].y0 = lastY;
            drawingHistory[historyPointer].x1 = x1;
            drawingHistory[historyPointer].y1 = y1;
            redrawWhiteboard(); // Redraw entire canvas with the final shape
        }
        whiteboardPages[currentWhiteboardPage] = drawingHistory; // Update stored page history
    }

    function redrawWhiteboard() {
        ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        const currentPageDrawings = whiteboardPages[currentWhiteboardPage];
        if (currentPageDrawings) {
            currentPageDrawings.forEach(data => {
                draw(data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.tool, data.isNewPath, data.textData);
            });
        }
        drawingHistory = whiteboardPages[currentWhiteboardPage].slice(); // Sync local history
        historyPointer = drawingHistory.length - 1;
        updateWhiteboardPageDisplay();
    }

    function undo() {
        if (historyPointer > -1) {
            historyPointer--;
            redrawFromHistory();
        }
    }

    function redo() {
        if (historyPointer < drawingHistory.length - 1) {
            historyPointer++;
            redrawFromHistory();
        }
    }

    function redrawFromHistory() {
        ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        for (let i = 0; i <= historyPointer; i++) {
            const data = drawingHistory[i];
            draw(data.x0, data.y0, data.x1, data.y1, data.color, data.size, data.tool, data.isNewPath, data.textData);
        }
        // Update the server's state for the current page only
        socket.emit('update_whiteboard_page_state', {
            classroomId: currentClassroomId,
            page: currentWhiteboardPage,
            state: drawingHistory.slice(0, historyPointer + 1)
        });
    }

    function clearWhiteboard() {
        if (confirm('Are you sure you want to clear the current whiteboard page?')) {
            socket.emit('clear_whiteboard', { classroomId: currentClassroomId, page: currentWhiteboardPage });
        }
    }

    function saveWhiteboard() {
        const image = whiteboardCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `whiteboard_page_${currentWhiteboardPage + 1}_${new Date().toISOString()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('Whiteboard page saved!', 'success');
    }

    function resetWhiteboard() {
        whiteboardPages = [[]]; // Start with one empty page
        currentWhiteboardPage = 0;
        drawingHistory = [];
        historyPointer = -1;
        redrawWhiteboard();
        updateWhiteboardPageDisplay();
    }

    function updateWhiteboardPageDisplay() {
        whiteboardPageDisplay.textContent = `Page ${currentWhiteboardPage + 1}/${whiteboardPages.length}`;
    }

    function navigateWhiteboardPage(direction) {
        let newPage = currentWhiteboardPage + direction;
        if (newPage < 0) {
            newPage = 0; // Prevent going below page 1
            showNotification('Already on the first page.', 'info');
        } else if (newPage >= whiteboardPages.length) {
            if (currentUserRole === 'admin') {
                // If admin, create a new page
                whiteboardPages.push([]);
                newPage = whiteboardPages.length - 1;
                socket.emit('add_whiteboard_page', { classroomId: currentClassroomId, page: newPage });
                showNotification(`New whiteboard page ${newPage + 1} created!`, 'success');
            } else {
                newPage = whiteboardPages.length - 1; // Stay on last page for users
                showNotification('Already on the last page. Only admins can add new pages.', 'info');
            }
        }
        currentWhiteboardPage = newPage;
        redrawWhiteboard();
    }


    // --- Chat Functions ---

    async function loadChatHistory() {
        const response = await fetch(`/classrooms/${currentClassroomId}/chat-history`);
        if (response.ok) {
            const chatHistory = await response.json();
            chatMessages.innerHTML = ''; // Clear existing messages
            chatHistory.forEach(msg => {
                appendChatMessage(msg.username, msg.message, msg.timestamp);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        } else {
            showNotification('Failed to load chat history.', 'error');
        }
    }

    function appendChatMessage(username, message, timestamp) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message');
        const date = new Date(timestamp);
        msgDiv.innerHTML = `<strong>${username}</strong> (${date.toLocaleTimeString()}): ${message}`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
    }

    function sendChatMessage() {
        const message = chatInput.value.trim();
        if (message && currentClassroomId) {
            socket.emit('send_message', { classroomId: currentClassroomId, message: message });
            chatInput.value = ''; // Clear input
        }
    }

    // --- Library Functions ---

    async function loadLibraryFiles() {
        const response = await fetch(`/classrooms/${currentClassroomId}/library`);
        if (response.ok) {
            const files = await response.json();
            libraryFilesList.innerHTML = '';
            if (files.length === 0) {
                libraryFilesList.innerHTML = '<p>No files in library.</p>';
                return;
            }
            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.classList.add('library-file-item');
                fileItem.innerHTML = `
                    <span>${file.filename} (Uploaded by: ${file.uploader})</span>
                    <a href="/uploads/${file.filepath}" target="_blank" download="${file.filename}">Download</a>
                    ${currentUserRole === 'admin' ? `<button class="delete-file-btn" data-file-id="${file._id}">Delete</button>` : ''}
                `;
                libraryFilesList.appendChild(fileItem);
            });

            document.querySelectorAll('.delete-file-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteLibraryFile(e.target.dataset.fileId));
            });
        } else {
            showNotification('Failed to load library files.', 'error');
        }
    }

    async function uploadLibraryFiles() {
        if (libraryFileInput.files.length === 0) {
            showNotification('Please select files to upload.', 'error');
            return;
        }

        const formData = new FormData();
        for (const file of libraryFileInput.files) {
            formData.append('files', file);
        }

        const response = await fetch(`/classrooms/${currentClassroomId}/library/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message, 'success');
            libraryFileInput.value = ''; // Clear input
            loadLibraryFiles();
        } else {
            showNotification(data.message, 'error');
        }
    }

    async function deleteLibraryFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        const response = await fetch(`/classrooms/${currentClassroomId}/library/${fileId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message, 'success');
            loadLibraryFiles();
        } else {
            showNotification(data.message, 'error');
        }
    }

    // --- Assessments Functions ---

    function addQuestionField() {
        const questionCount = questionsContainer.querySelectorAll('.question-item').length + 1;
        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item');
        questionItem.innerHTML = `
            <label>Question ${questionCount}:</label>
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
        questionsContainer.appendChild(questionItem);

        // Add event listener for question type change
        questionItem.querySelector('.question-type').addEventListener('change', (e) => {
            const mcqOptionsDiv = e.target.nextElementSibling;
            if (e.target.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
            }
        });

        // Add event listener for remove button
        questionItem.querySelector('.remove-question-btn').addEventListener('click', () => {
            questionItem.remove();
            // Re-label questions
            questionsContainer.querySelectorAll('.question-item').forEach((item, index) => {
                item.querySelector('label').textContent = `Question ${index + 1}:`;
            });
        });
    }

    async function submitAssessment(event) {
        event.preventDefault();
        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionInput.value.trim();
        if (!title) {
            showNotification('Assessment title is required.', 'error');
            return;
        }

        const questions = [];
        let isValid = true;
        questionsContainer.querySelectorAll('.question-item').forEach(item => {
            const text = item.querySelector('.question-text').value.trim();
            const type = item.querySelector('.question-type').value;
            if (!text) {
                isValid = false;
                showNotification('All question texts must be filled.', 'error');
                return;
            }
            const question = { text, type };
            if (type === 'mcq') {
                const options = Array.from(item.querySelectorAll('.mcq-option')).map(opt => opt.value.trim());
                const correctAnswer = item.querySelector('.mcq-correct-answer').value.trim();
                if (options.some(opt => !opt) || !correctAnswer) {
                    isValid = false;
                    showNotification('All MCQ options and correct answer must be filled.', 'error');
                    return;
                }
                question.options = options;
                question.correct_answer = correctAnswer;
            }
            questions.push(question);
        });

        if (!isValid) return;

        if (questions.length === 0) {
            showNotification('Please add at least one question.', 'error');
            return;
        }

        const response = await fetch(`/classrooms/${currentClassroomId}/assessments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, questions })
        });

        const data = await response.json();
        assessmentCreationMessage.textContent = data.message;
        if (response.ok) {
            showNotification(data.message, 'success');
            assessmentTitleInput.value = '';
            assessmentDescriptionInput.value = '';
            questionsContainer.innerHTML = ''; // Clear questions
            addQuestionField(); // Add one default question field back
            loadAssessments();
        } else {
            showNotification(data.message, 'error');
        }
    }

    async function loadAssessments() {
        const response = await fetch(`/classrooms/${currentClassroomId}/assessments`);
        if (response.ok) {
            const assessments = await response.json();
            assessmentList.innerHTML = '';
            if (assessments.length === 0) {
                assessmentList.innerHTML = '<p>No assessments available.</p>';
                return;
            }
            assessments.forEach(assessment => {
                const assessmentDiv = document.createElement('div');
                assessmentDiv.innerHTML = `
                    <span>${assessment.title}</span>
                    <div>
                        <button class="view-assessment-btn" data-id="${assessment._id}" data-title="${assessment.title}">View</button>
                        ${currentUserRole === 'admin' ? `<button class="delete-assessment-btn" data-id="${assessment._id}" data-title="${assessment.title}">Delete</button>` : ''}
                    </div>
                `;
                assessmentList.appendChild(assessmentDiv);
            });

            document.querySelectorAll('.view-assessment-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const assessmentId = e.target.dataset.id;
                    const assessmentTitle = e.target.dataset.title;
                    if (currentUserRole === 'admin') {
                        viewSubmissions(assessmentId, assessmentTitle);
                    } else {
                        takeAssessment(assessmentId, assessmentTitle);
                    }
                });
            });

            document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteAssessment(e.target.dataset.id, e.target.dataset.title));
            });
            showClassroomSubSection(assessmentsSection); // Ensure assessments are visible
            assessmentListContainer.classList.remove('hidden');
            takeAssessmentContainer.classList.add('hidden');
            viewSubmissionsContainer.classList.add('hidden');
        } else {
            showNotification('Failed to load assessments.', 'error');
        }
    }

    async function takeAssessment(assessmentId, title) {
        currentAssessmentToTake = assessmentId;
        const response = await fetch(`/classrooms/${currentClassroomId}/assessments/${assessmentId}`);
        if (response.ok) {
            const assessment = await response.json();
            takeAssessmentTitle.textContent = assessment.title;
            takeAssessmentDescription.textContent = assessment.description;
            takeAssessmentForm.innerHTML = ''; // Clear previous questions
            assessment.questions.forEach((q, index) => {
                const qDiv = document.createElement('div');
                qDiv.classList.add('assessment-question');
                qDiv.innerHTML = `<p><strong>${index + 1}. ${q.text}</strong></p>`;
                if (q.type === 'text') {
                    qDiv.innerHTML += `<textarea name="q${index}" rows="3" placeholder="Your answer"></textarea>`;
                } else if (q.type === 'mcq') {
                    q.options.forEach((opt, optIndex) => {
                        const optionId = `q${index}_opt${optIndex}`;
                        qDiv.innerHTML += `
                            <input type="radio" id="${optionId}" name="q${index}" value="${String.fromCharCode(65 + optIndex)}">
                            <label for="${optionId}">${String.fromCharCode(65 + optIndex)}. ${opt}</label><br>
                        `;
                    });
                }
                takeAssessmentForm.appendChild(qDiv);
            });
            assessmentListContainer.classList.add('hidden');
            takeAssessmentContainer.classList.remove('hidden');
        } else {
            showNotification('Failed to load assessment.', 'error');
        }
    }

    async function submitAnswers(event) {
        event.preventDefault();
        const answers = {};
        takeAssessmentForm.querySelectorAll('.assessment-question').forEach((qDiv, index) => {
            const questionName = `q${index}`;
            const textarea = qDiv.querySelector(`textarea[name="${questionName}"]`);
            if (textarea) {
                answers[questionName] = textarea.value.trim();
            } else {
                const selectedRadio = qDiv.querySelector(`input[name="${questionName}"]:checked`);
                if (selectedRadio) {
                    answers[questionName] = selectedRadio.value;
                } else {
                    answers[questionName] = ''; // No answer selected for MCQ
                }
            }
        });

        const response = await fetch(`/classrooms/${currentClassroomId}/assessments/${currentAssessmentToTake}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers })
        });

        const data = await response.json();
        assessmentSubmissionMessage.textContent = data.message;
        if (response.ok) {
            assessmentSubmissionMessage.classList.remove('error');
            assessmentSubmissionMessage.classList.add('success');
            showNotification(data.message, 'success');
            // Optionally hide form or redirect
            setTimeout(() => {
                assessmentSubmissionMessage.textContent = '';
                loadAssessments(); // Go back to assessment list
            }, 2000);
        } else {
            assessmentSubmissionMessage.classList.remove('success');
            assessmentSubmissionMessage.classList.add('error');
            showNotification(data.message, 'error');
        }
    }

    async function viewSubmissions(assessmentId, title) {
        submissionsAssessmentTitle.textContent = `Submissions for: ${title}`;
        const response = await fetch(`/classrooms/${currentClassroomId}/assessments/${assessmentId}/submissions`);
        if (response.ok) {
            const submissions = await response.json();
            submissionsList.innerHTML = '';
            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions yet.</p>';
                return;
            }
            submissions.forEach(submission => {
                const submissionDiv = document.createElement('div');
                submissionDiv.classList.add('submission-item');
                let answersHtml = '';
                for (const qKey in submission.answers) {
                    answersHtml += `<p><strong>${qKey.replace('q', 'Question ')}:</strong> ${submission.answers[qKey]}</p>`;
                }
                submissionDiv.innerHTML = `
                    <p><strong>Submitted by:</strong> ${submission.username}</p>
                    <p><strong>Submitted At:</strong> ${new Date(submission.timestamp).toLocaleString()}</p>
                    <div class="submission-answers">${answersHtml}</div>
                `;
                submissionsList.appendChild(submissionDiv);
            });
            assessmentListContainer.classList.add('hidden');
            viewSubmissionsContainer.classList.remove('hidden');
        } else {
            showNotification('Failed to load submissions.', 'error');
        }
    }

    async function deleteAssessment(assessmentId, title) {
        if (!confirm(`Are you sure you want to delete the assessment "${title}"?`)) return;

        const response = await fetch(`/classrooms/${currentClassroomId}/assessments/${assessmentId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message, 'success');
            loadAssessments();
        } else {
            showNotification(data.message, 'error');
        }
    }


    // --- WebRTC Functions ---

    function createPeerConnection(peerId) {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        });

        peerConnections[peerId] = peer;

        // Add local stream to peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => peer.addTrack(track, localStream));
        }

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', {
                    recipient_id: peerId,
                    candidate: event.candidate,
                    classroomId: currentClassroomId
                });
            }
        };

        peer.ontrack = (event) => {
            const [remoteStream] = event.streams;
            console.log('WEBRTC: Received remote stream from', peerId, remoteStream);
            addRemoteVideo(peerId, remoteStream);
        };

        peer.onconnectionstatechange = (event) => {
            console.log(`Connection state with ${peerId}: ${peer.connectionState}`);
            if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed' || peer.connectionState === 'closed') {
                showNotification(`Peer ${peerId} connection lost.`, 'warning');
                removeRemoteVideo(peerId);
                delete peerConnections[peerId];
            }
        };

        return peer;
    }

    async function startBroadcast() {
        if (!currentClassroomId) {
            showNotification('Please join a classroom first.', 'error');
            return;
        }
        if (currentUserRole !== 'admin') {
            showNotification('Only admins can start a broadcast.', 'error');
            return;
        }

        const broadcastType = document.querySelector('input[name="broadcastType"]:checked').value;
        const mediaConstraints = {
            video: broadcastType === 'video_audio',
            audio: true
        };

        try {
            localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            localVideo.srcObject = localStream;
            localVideo.style.display = 'block'; // Show local video preview

            // Start broadcasting to existing peers and new peers
            socket.emit('start_broadcast', { classroomId: currentClassroomId, broadcast_type: broadcastType });
            showNotification(`Broadcast started as ${broadcastType.replace('_', ' ')}.`, 'success');
            startBroadcastBtn.disabled = true;
            endBroadcastBtn.disabled = false;
        } catch (error) {
            console.error('Error starting broadcast:', error);
            showNotification('Failed to start broadcast. Please check camera/mic permissions.', 'error');
        }
    }

    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        localVideo.srcObject = null;
        localVideo.style.display = 'none'; // Hide local video preview

        // Close all peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                removeRemoteVideo(peerId); // Remove all remote videos
            }
        }
        socket.emit('end_broadcast', { classroomId: currentClassroomId });
        showNotification('Broadcast ended.', 'info');
        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;
    }

    function addRemoteVideo(peerId, stream) {
        let videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
        if (!videoWrapper) {
            videoWrapper = document.createElement('div');
            videoWrapper.id = `video-wrapper-${peerId}`;
            videoWrapper.classList.add('remote-video-wrapper');
            videoWrapper.innerHTML = `
                <video id="remote-video-${peerId}" autoplay playsinline></video>
                <p class="video-label">Peer: ${peerId.substring(0, 5)}...</p>
            `;
            remoteVideoContainer.appendChild(videoWrapper);
        }
        const remoteVideo = videoWrapper.querySelector(`#remote-video-${peerId}`);
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
        }
    }

    function removeRemoteVideo(peerId) {
        const videoWrapper = document.getElementById(`video-wrapper-${peerId}`);
        if (videoWrapper) {
            videoWrapper.remove();
        }
    }


    // --- Event Listeners ---

    // Auth
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        authMessage.textContent = '';
    });
    loginForm.addEventListener('submit', (e) => handleAuth(e, '/login'));
    registerForm.addEventListener('submit', (e) => handleAuth(e, '/register'));

    // Main Navigation
    navDashboard.addEventListener('click', () => {
        if (dashboardSection.classList.contains('hidden')) { // Prevent re-loading if already on dashboard
            showSection(dashboardSection);
            navDashboard.classList.add('active-nav');
            navClassroom.classList.remove('active-nav');
            navSettings.classList.remove('active-nav');
            leaveClassroom(); // Ensure leaving if in classroom
        }
    });
    navClassroom.addEventListener('click', () => {
        // This button acts as a re-entry point if user leaves classroom
        // and wants to go back to the *last joined* classroom or classroom selection.
        // For now, it will just show the dashboard's classroom selection.
        showNotification('Please select or join a classroom from the dashboard.', 'info');
        showSection(dashboardSection);
        navDashboard.classList.add('active-nav');
        navClassroom.classList.remove('active-nav');
        navSettings.classList.remove('active-nav');
        // This needs more sophisticated logic if we want to "resume" a classroom
    });
    navSettings.addEventListener('click', () => {
        showSection(settingsSection);
        navSettings.classList.add('active-nav');
        navDashboard.classList.remove('active-nav');
        navClassroom.classList.remove('active-nav');
        loadUserProfile();
    });
    logoutBtn.addEventListener('click', async () => {
        await fetch('/logout', { method: 'POST' });
        showNotification('Logged out successfully.', 'success');
        currentClassroomId = null; // Clear classroom on logout
        currentUserRole = null;
        currentUsername = null;
        if (socket) socket.disconnect(); // Disconnect socket
        showSection(authSection);
        // Clear all session-related UI elements
        classroomIdDisplay.textContent = 'N/A';
        currentUsernameDisplay.textContent = '';
        logoutBtn.classList.remove('active'); // No longer logged in
    });


    // Dashboard
    createClassroomBtn.addEventListener('click', createClassroom);
    classroomList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.id) {
            joinClassroom(e.target.dataset.id);
        }
    });

    // Classroom - Main Navigation (Sidebar Toggle)
    hamburgerMenuBtn.addEventListener('click', () => {
        classroomSidebar.classList.toggle('hidden');
    });

    closeSidebarBtn.addEventListener('click', () => {
        classroomSidebar.classList.add('hidden');
    });

    // Sidebar Navigation within Classroom
    backToDashboardBtn.addEventListener('click', () => {
        classroomSidebar.classList.add('hidden'); // Hide sidebar when leaving classroom
        leaveClassroom();
    });

    navWhiteboard.addEventListener('click', () => {
        showClassroomSubSection(whiteboardArea);
        navWhiteboard.classList.add('active-nav');
        navChat.classList.remove('active-nav');
        navLibrary.classList.remove('active-nav');
        navAssessments.classList.remove('active-nav');
        classroomSidebar.classList.remove('hidden'); // Keep sidebar open if it was for controls
        setupWhiteboardControls(); // Ensure controls are correctly set up based on role
        setupCanvas(); // Re-initialize canvas drawing context on view
        redrawWhiteboard(); // Redraw current page
    });
    navChat.addEventListener('click', () => {
        showClassroomSubSection(chatSection);
        navChat.classList.add('active-nav');
        navWhiteboard.classList.remove('active-nav');
        navLibrary.classList.remove('active-nav');
        navAssessments.classList.remove('active-nav');
        classroomSidebar.classList.add('hidden'); // Hide sidebar for chat
        loadChatHistory();
    });
    navLibrary.addEventListener('click', () => {
        showClassroomSubSection(librarySection);
        navLibrary.classList.add('active-nav');
        navWhiteboard.classList.remove('active-nav');
        navChat.classList.remove('active-nav');
        navAssessments.classList.remove('active-nav');
        classroomSidebar.classList.add('hidden'); // Hide sidebar for library
        loadLibraryFiles();
    });
    navAssessments.addEventListener('click', () => {
        showClassroomSubSection(assessmentsSection);
        navAssessments.classList.add('active-nav');
        navWhiteboard.classList.remove('active-nav');
        navChat.classList.remove('active-nav');
        navLibrary.classList.remove('active-nav');
        classroomSidebar.classList.add('hidden'); // Hide sidebar for assessments
        addQuestionField(); // Ensure at least one question field is present
        loadAssessments();
    });

    // Whiteboard Controls
    whiteboardCanvas.addEventListener('mousedown', startDrawing);
    whiteboardCanvas.addEventListener('mousemove', drawingMove);
    whiteboardCanvas.addEventListener('mouseup', stopDrawing);
    whiteboardCanvas.addEventListener('mouseout', stopDrawing);
    window.addEventListener('resize', setupCanvas); // Recalculate canvas size on resize

    // Whiteboard Page Navigation
    prevWhiteboardPageBtn.addEventListener('click', () => navigateWhiteboardPage(-1));
    nextWhiteboardPageBtn.addEventListener('click', () => navigateWhiteboardPage(1));

    // Share link functionality
    if (shareLinkInput) {
        shareLinkInput.value = window.location.origin + "/join/" + currentClassroomId; // Example, needs actual class ID
    }
    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            showNotification('Share link copied to clipboard!', 'success');
        });
    }

    // Broadcast Controls
    if (startBroadcastBtn) startBroadcastBtn.addEventListener('click', startBroadcast);
    if (endBroadcastBtn) endBroadcastBtn.addEventListener('click', endBroadcast);
    broadcastTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (localStream && localStream.active) {
                showNotification("Broadcast type changed. Restarting broadcast...", 'info');
                endBroadcast();
                setTimeout(() => startBroadcast(), 500);
            }
        });
    });


    // Chat Controls
    sendChatButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // Library Controls
    if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.addEventListener('click', uploadLibraryFiles);

    // Assessment Controls
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', addQuestionField);
    if (submitAssessmentBtn) submitAssessmentBtn.addEventListener('click', submitAssessment);
    if (submitAnswersBtn) submitAnswersBtn.addEventListener('click', submitAnswers);
    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => {
        currentAssessmentToTake = null;
        loadAssessments(); // Go back to assessment list
    });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
        loadAssessments(); // Go back to assessment list
    });


    // Settings Controls
    updateProfileForm.addEventListener('submit', updateProfile);
    backToDashboardFromSettingsBtn.addEventListener('click', () => {
        showSection(dashboardSection);
        navDashboard.classList.add('active-nav');
        navSettings.classList.remove('active-nav');
    });


    // Initial Load
    checkLoginStatus();
    setupCanvas(); // Initial canvas setup
});
