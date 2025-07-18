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
    const classroomList = document.getElementById('classroom-list');

    const classroomSection = document.getElementById('classroom-section');
    const classroomNameHeader = document.getElementById('classroom-name-header');
    const whiteboardArea = document.getElementById('whiteboard-area');
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const ctx = whiteboardCanvas.getContext('2d');

    const chatSection = document.getElementById('chat-section');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatButton = document.getElementById('send-chat-button');

    const librarySection = document.getElementById('library-section');
    const fileInput = document.getElementById('file-input');
    const uploadFileBtn = document.getElementById('upload-file-btn');
    const libraryFilesList = document.getElementById('library-files-list');

    const assessmentSection = document.getElementById('assessment-section');
    const createAssessmentBtn = document.getElementById('create-assessment-btn');
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsContainer = document.getElementById('questions-container');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentList = document.getElementById('assessment-list');
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentForm = document.getElementById('take-assessment-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');
    const viewSubmissionsContainer = document.getElementById('view-submissions-container');
    const submissionsList = document.getElementById('submissions-list');
    const viewSubmissionAssessmentTitle = document.getElementById('view-submission-assessment-title');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');

    const settingsSection = document.getElementById('settings-section');
    const usernameSettingsInput = document.getElementById('username-settings');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingsMessage = document.getElementById('settings-message');

    const notificationsContainer = document.getElementById('notifications-container');

    // Whiteboard Tools
    const toolButtons = document.querySelectorAll('.tool-button');
    const colorPicker = document.getElementById('color-picker');
    const brushSizeSlider = document.getElementById('brush-size-slider');
    const clearBoardBtn = document.getElementById('clear-board-btn');
    const eraserBtn = document.getElementById('eraser-btn');
    const downloadBoardBtn = document.getElementById('download-board-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const addPageBtn = document.getElementById('add-page-btn');
    const whiteboardPageDisplay = document.getElementById('whiteboard-page-display');

    // Video Broadcast
    const startBroadcastBtn = document.getElementById('start-broadcast-btn');
    const endBroadcastBtn = document.getElementById('end-broadcast-btn');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastTypeRadios = document.querySelectorAll('input[name="broadcast-type"]');

    // Hamburger Menu & Sidebar
    const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
    const sidebar = document.getElementById('classroom-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');

    // --- State Variables ---
    let currentView = 'auth'; // 'auth', 'dashboard', 'classroom', 'settings'
    let currentClassroomId = null;
    let currentUser = null; // { id, username, role }
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = '#000000';
    let brushSize = 5;
    let isErasing = false;
    let whiteboardPages = [new Image()]; // Array to hold canvas states as Images
    let currentPage = 0;
    let mediaRecorder;
    let recordedChunks = [];
    let localStream; // User's media stream for broadcast
    let peerConnections = {}; // Stores RTCPeerConnection objects for each user
    let currentAssessmentToTake = null;

    // --- WebSocket ---
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('Connected to WebSocket server');
        if (currentUser && currentClassroomId) {
            socket.emit('join-classroom', { classroomId: currentClassroomId, userId: currentUser.id, username: currentUser.username, role: currentUser.role });
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
    });

    // --- Authentication Functions ---
    function showView(view) {
        currentView = view;
        app.querySelectorAll('section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${view}-section`).classList.add('active');

        // Update nav button active state
        document.querySelectorAll('.main-nav button').forEach(button => {
            button.classList.remove('active-nav');
        });
        if (view === 'dashboard') {
            navDashboard.classList.add('active-nav');
        } else if (view === 'classroom') {
            navClassroom.classList.add('active-nav');
        } else if (view === 'settings') {
            navSettings.classList.add('active-nav');
        }

        // Hide sidebar when navigating away from classroom
        if (view !== 'classroom') {
            sidebar.classList.remove('active');
        }
    }

    function showAuthContainer(container) {
        loginContainer.classList.remove('active');
        registerContainer.classList.remove('active');
        container.classList.add('active');
        authMessage.textContent = ''; // Clear previous messages
    }

    async function handleAuth(endpoint, formData) {
        try {
            const response = await fetch(`/api/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            authMessage.textContent = data.message;
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                showNotification(`Welcome, ${currentUser.username}!`);
                checkLoginStatus(); // Re-check to update UI and fetch classrooms
            } else {
                authMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Auth error:', error);
            authMessage.textContent = 'An error occurred. Please try again.';
            authMessage.style.color = 'red';
        }
    }

    async function checkLoginStatus() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (token && user) {
            try {
                const response = await fetch('/api/auth/verify', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    currentUser = user; // Set current user from local storage
                    currentUsernameDisplay.textContent = currentUser.username;
                    showView('dashboard');
                    loadClassrooms();
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    currentUser = null;
                    showView('auth');
                    showAuthContainer(loginContainer);
                }
            } catch (error) {
                console.error('Verification error:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                currentUser = null;
                showView('auth');
                showAuthContainer(loginContainer);
            }
        } else {
            currentUser = null;
            showView('auth');
            showAuthContainer(loginContainer);
        }
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        currentClassroomId = null;
        showView('auth');
        showAuthContainer(loginContainer);
        showNotification('Logged out successfully.');

        // Clean up WebRTC connections if any
        for (const peerId in peerConnections) {
            peerConnections[peerId].close();
            delete peerConnections[peerId];
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        localVideo.srcObject = null;
        remoteVideoContainer.innerHTML = '';
    }

    // --- Classroom Management Functions ---
    async function createClassroom(name) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/classrooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(`Classroom "${data.name}" created! ID: ${data.id}`);
                loadClassrooms();
            } else {
                showNotification(`Error creating classroom: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Create classroom error:', error);
            showNotification('Error creating classroom.', 'error');
        }
    }

    async function loadClassrooms() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/classrooms', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                classroomList.innerHTML = '';
                if (data.classrooms.length === 0) {
                    classroomList.innerHTML = '<p>No classrooms created yet. Create one above!</p>';
                    return;
                }
                data.classrooms.forEach(classroom => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <span>${classroom.name} (ID: ${classroom.id})</span>
                        <div>
                            ${currentUser.role === 'admin' ? `<button data-classroom-id="${classroom.id}" class="view-submissions-btn">View Submissions</button>` : ''}
                            <button data-classroom-id="${classroom.id}" class="join-classroom-btn">Join</button>
                        </div>
                    `;
                    classroomList.appendChild(listItem);
                });
                document.querySelectorAll('.join-classroom-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        joinClassroom(e.target.dataset.classroomId);
                    });
                });
                document.querySelectorAll('.view-submissions-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        showView('assessment');
                        loadSubmissionsForAdmin(e.target.dataset.classroomId);
                    });
                });
            } else {
                showNotification(`Error loading classrooms: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Load classrooms error:', error);
            showNotification('Error loading classrooms.', 'error');
        }
    }

    async function joinClassroom(classroomId) {
        currentClassroomId = classroomId;
        classroomNameHeader.textContent = `Classroom: ${classroomId}`;
        classroomIdDisplay.textContent = classroomId;
        showView('classroom');
        setupWhiteboard();
        loadChatMessages();
        loadLibraryFiles();
        loadAssessments();

        // Join WebSocket room
        socket.emit('join-classroom', { classroomId, userId: currentUser.id, username: currentUser.username, role: currentUser.role });
        showNotification(`Joined classroom ${classroomId}`);
    }

    // --- Whiteboard Functions ---
    function setupWhiteboard() {
        whiteboardCanvas.width = whiteboardArea.clientWidth;
        whiteboardCanvas.height = whiteboardArea.clientHeight;

        // Load the current page content if it exists
        drawPage(currentPage);

        whiteboardCanvas.addEventListener('mousedown', startDrawing);
        whiteboardCanvas.addEventListener('mouseup', endDrawing);
        whiteboardCanvas.addEventListener('mousemove', draw);
        whiteboardCanvas.addEventListener('mouseleave', endDrawing); // Stop drawing if mouse leaves canvas
    }

    function startDrawing(e) {
        if (currentUser.role !== 'admin') return; // Only admin can draw
        drawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function endDrawing() {
        if (currentUser.role !== 'admin') return; // Only admin can draw
        drawing = false;
        ctx.beginPath(); // Reset path to prevent lines connecting across separate strokes
        saveCanvasState(); // Save state after each stroke
    }

    function draw(e) {
        if (!drawing || currentUser.role !== 'admin') return; // Only admin can draw

        ctx.strokeStyle = isErasing ? '#FFFFFF' : currentColor; // White for eraser
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();

        // Emit drawing data to other users
        socket.emit('drawing', {
            x1: lastX,
            y1: lastY,
            x2: e.offsetX,
            y2: e.offsetY,
            color: currentColor,
            size: brushSize,
            erasing: isErasing,
            page: currentPage,
            classroomId: currentClassroomId
        });

        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    // Event Listeners for Whiteboard Tools
    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            toolButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            isErasing = false; // Deactivate eraser when a tool is selected
            if (button.id === 'eraser-btn') {
                isErasing = true;
            }
        });
    });

    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
        isErasing = false; // Deactivate eraser when color changes
        document.getElementById('brush-tool-btn').classList.add('active'); // Reactivate brush tool visually
        eraserBtn.classList.remove('active');
    });

    brushSizeSlider.addEventListener('input', (e) => {
        brushSize = e.target.value;
    });

    clearBoardBtn.addEventListener('click', () => {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can clear the board.', 'error');
            return;
        }
        ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardPages[currentPage] = new Image(); // Clear current page state
        socket.emit('clear-board', { classroomId: currentClassroomId, page: currentPage });
        showNotification('Whiteboard cleared!');
    });

    eraserBtn.addEventListener('click', () => {
        isErasing = true;
    });

    downloadBoardBtn.addEventListener('click', () => {
        const dataURL = whiteboardCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `whiteboard-page-${currentPage + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('Whiteboard downloaded!');
    });

    addPageBtn.addEventListener('click', () => {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can add pages.', 'error');
            return;
        }
        saveCanvasState(); // Save current page before adding new
        currentPage++;
        if (!whiteboardPages[currentPage]) {
            whiteboardPages[currentPage] = new Image(); // Create a new empty image for the new page
        }
        ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height); // Clear canvas for new page
        drawPage(currentPage); // Draw new (empty or existing) page
        updatePageDisplay();
        socket.emit('add-page', { classroomId: currentClassroomId, newTotalPages: whiteboardPages.length, newPageIndex: currentPage });
        showNotification(`Added new page. Now on page ${currentPage + 1}`);
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            saveCanvasState(); // Save current page before changing
            currentPage--;
            ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height); // Clear canvas
            drawPage(currentPage); // Draw previous page
            updatePageDisplay();
            socket.emit('change-page', { classroomId: currentClassroomId, newPageIndex: currentPage });
            showNotification(`Mapsd to page ${currentPage + 1}`);
        } else {
            showNotification('Already on the first page.', 'info');
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < whiteboardPages.length - 1) {
            saveCanvasState(); // Save current page before changing
            currentPage++;
            ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height); // Clear canvas
            drawPage(currentPage); // Draw next page
            updatePageDisplay();
            socket.emit('change-page', { classroomId: currentClassroomId, newPageIndex: currentPage });
            showNotification(`Mapsd to page ${currentPage + 1}`);
        } else {
            showNotification('Already on the last page. Add a new one!', 'info');
        }
    });

    function saveCanvasState() {
        whiteboardPages[currentPage].src = whiteboardCanvas.toDataURL();
    }

    function drawPage(pageIndex) {
        // Ensure the page exists and has content
        if (whiteboardPages[pageIndex] && whiteboardPages[pageIndex].src) {
            // Wait for the image to load before drawing
            whiteboardPages[pageIndex].onload = () => {
                ctx.drawImage(whiteboardPages[pageIndex], 0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            };
            // If image is already loaded (e.g., from a previous drawPage call), onload might not fire.
            // Check if it's already complete and draw immediately.
            if (whiteboardPages[pageIndex].complete) {
                ctx.drawImage(whiteboardPages[pageIndex], 0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            }
        } else {
            // If page is empty or new, ensure canvas is clear
            ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        updatePageDisplay();
    }

    function updatePageDisplay() {
        whiteboardPageDisplay.textContent = `Page ${currentPage + 1} / ${whiteboardPages.length}`;
    }

    // Handle incoming drawing data
    socket.on('drawing', (data) => {
        if (data.classroomId === currentClassroomId && data.page === currentPage) {
            ctx.strokeStyle = data.erasing ? '#FFFFFF' : data.color;
            ctx.lineWidth = data.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(data.x1, data.y1);
            ctx.lineTo(data.x2, data.y2);
            ctx.stroke();
        }
    });

    // Handle incoming clear board command
    socket.on('clear-board', (data) => {
        if (data.classroomId === currentClassroomId && data.page === currentPage) {
            ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardPages[currentPage] = new Image(); // Clear current page state for other users too
        }
    });

    // Handle page changes from other users
    socket.on('change-page', (data) => {
        if (data.classroomId === currentClassroomId) {
            // Ensure local whiteboardPages array is sufficiently large
            while (whiteboardPages.length <= data.newPageIndex) {
                whiteboardPages.push(new Image()); // Add empty pages if needed
            }
            currentPage = data.newPageIndex;
            ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            drawPage(currentPage);
            updatePageDisplay();
            showNotification(`Admin navigated to page ${currentPage + 1}`);
        }
    });

    // Handle new page additions from other users
    socket.on('add-page', (data) => {
        if (data.classroomId === currentClassroomId) {
            // Ensure local whiteboardPages array is updated with the correct total count
            while (whiteboardPages.length < data.newTotalPages) {
                whiteboardPages.push(new Image()); // Add empty pages if needed
            }
            // If the admin added a page and switched to it, also switch locally
            if (data.newPageIndex === whiteboardPages.length - 1) { // Check if new page is the last one
                currentPage = data.newPageIndex;
                ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                drawPage(currentPage);
            }
            updatePageDisplay();
            showNotification(`Admin added a new whiteboard page.`, 'info');
        }
    });

    // --- Chat Functions ---
    async function loadChatMessages() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                chatMessages.innerHTML = '';
                data.messages.forEach(msg => {
                    displayMessage(msg.username, msg.message, msg.timestamp);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
            } else {
                showNotification(`Error loading chat: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Load chat error:', error);
            showNotification('Error loading chat messages.', 'error');
        }
    }

    function displayMessage(username, message, timestamp) {
        const msgElement = document.createElement('div');
        const date = new Date(timestamp);
        msgElement.innerHTML = `<strong>${username}</strong> (${date.toLocaleTimeString()}): ${message}`;
        chatMessages.appendChild(msgElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    }

    sendChatButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            socket.emit('chat-message', {
                classroomId: currentClassroomId,
                username: currentUser.username,
                message: message,
                timestamp: new Date().toISOString()
            });
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatButton.click();
        }
    });

    socket.on('chat-message', (data) => {
        if (data.classroomId === currentClassroomId) {
            displayMessage(data.username, data.message, data.timestamp);
        }
    });

    // --- Library Functions ---
    async function loadLibraryFiles() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/files`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                libraryFilesList.innerHTML = '';
                if (data.files.length === 0) {
                    libraryFilesList.innerHTML = '<p>No files uploaded yet.</p>';
                    return;
                }
                data.files.forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.innerHTML = `
                        <span><a href="${file.url}" target="_blank">${file.filename}</a> (Uploaded by: ${file.uploadedBy})</span>
                        ${currentUser.role === 'admin' ? `<button data-file-id="${file.id}" class="delete-file-btn">Delete</button>` : ''}
                    `;
                    libraryFilesList.appendChild(fileItem);
                });
                document.querySelectorAll('.delete-file-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        deleteFile(e.target.dataset.fileId);
                    });
                });
            } else {
                showNotification(`Error loading library files: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Load library error:', error);
            showNotification('Error loading library files.', 'error');
        }
    }

    uploadFileBtn.addEventListener('click', async () => {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can upload files.', 'error');
            return;
        }

        const file = fileInput.files[0];
        if (!file) {
            showNotification('Please select a file to upload.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('classroomId', currentClassroomId);
        formData.append('uploadedBy', currentUser.username);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('File uploaded successfully!');
                fileInput.value = ''; // Clear input
                loadLibraryFiles();
            } else {
                showNotification(`Error uploading file: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Error uploading file.', 'error');
        }
    });

    async function deleteFile(fileId) {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can delete files.', 'error');
            return;
        }
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/files/${fileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('File deleted successfully!');
                loadLibraryFiles();
            } else {
                showNotification(`Error deleting file: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Delete file error:', error);
            showNotification('Error deleting file.', 'error');
        }
    }

    // --- Assessment Functions ---
    createAssessmentBtn.addEventListener('click', () => {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can create assessments.', 'error');
            return;
        }
        assessmentCreationForm.classList.add('active');
        assessmentList.classList.remove('active');
        takeAssessmentContainer.classList.remove('active');
        viewSubmissionsContainer.classList.remove('active');
        questionsContainer.innerHTML = ''; // Clear previous questions
        assessmentTitleInput.value = '';
    });

    addQuestionBtn.addEventListener('click', () => {
        const questionIndex = questionsContainer.children.length;
        const questionItem = document.createElement('div');
        questionItem.classList.add('question-item');
        questionItem.innerHTML = `
            <h4>Question ${questionIndex + 1}</h4>
            <label for="question-type-${questionIndex}">Question Type:</label>
            <select id="question-type-${questionIndex}" class="question-type-select">
                <option value="text">Text Input</option>
                <option value="mcq">Multiple Choice</option>
            </select>
            <input type="text" placeholder="Question Text" class="question-text-input" required>
            <div class="mcq-options hidden">
                <input type="text" placeholder="Option 1" class="mcq-option">
                <input type="text" placeholder="Option 2" class="mcq-option">
                <input type="text" placeholder="Option 3" class="mcq-option">
                <input type="text" placeholder="Option 4" class="mcq-option">
                <label>Correct Option (1-4 for MCQ):</label>
                <input type="number" min="1" max="4" class="mcq-correct-option">
            </div>
        `;
        questionsContainer.appendChild(questionItem);

        // Add event listener for question type change
        questionItem.querySelector(`.question-type-select`).addEventListener('change', (e) => {
            const mcqOptionsDiv = e.target.closest('.question-item').querySelector('.mcq-options');
            if (e.target.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
            }
        });
    });

    submitAssessmentBtn.addEventListener('click', async () => {
        const title = assessmentTitleInput.value.trim();
        if (!title) {
            showNotification('Assessment title cannot be empty.', 'error');
            return;
        }

        const questions = [];
        questionsContainer.querySelectorAll('.question-item').forEach(qItem => {
            const type = qItem.querySelector('.question-type-select').value;
            const text = qItem.querySelector('.question-text-input').value.trim();
            if (!text) {
                showNotification('All question texts must be filled.', 'error');
                return;
            }

            let question = { type, text };

            if (type === 'mcq') {
                const options = Array.from(qItem.querySelectorAll('.mcq-option')).map(opt => opt.value.trim());
                const correctOption = qItem.querySelector('.mcq-correct-option').value;
                if (options.some(opt => !opt) || !correctOption) {
                    showNotification('All MCQ options and correct answer must be filled.', 'error');
                    return;
                }
                question.options = options;
                question.correctOption = parseInt(correctOption);
            }
            questions.push(question);
        });

        if (questions.length === 0) {
            showNotification('Please add at least one question.', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/assessments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, questions })
            });
            const data = await response.json();
            if (response.ok) {
                showNotification('Assessment created successfully!');
                assessmentCreationForm.classList.remove('active');
                loadAssessments();
            } else {
                showNotification(`Error creating assessment: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Create assessment error:', error);
            showNotification('Error creating assessment.', 'error');
        }
    });

    async function loadAssessments() {
        showHideAssessmentContainers('list');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/assessments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                assessmentList.innerHTML = '';
                if (data.assessments.length === 0) {
                    assessmentList.innerHTML = '<p>No assessments available yet.</p>';
                    return;
                }
                data.assessments.forEach(assessment => {
                    const listItem = document.createElement('div');
                    listItem.innerHTML = `
                        <span>${assessment.title}</span>
                        ${currentUser.role === 'student' ? `<button data-assessment-id="${assessment.id}" class="take-assessment-btn">Take Assessment</button>` : ''}
                        ${currentUser.role === 'admin' ? `<button data-assessment-id="${assessment.id}" class="view-submissions-btn-admin">View Submissions</button>` : ''}
                    `;
                    assessmentList.appendChild(listItem);
                });
                document.querySelectorAll('.take-assessment-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        takeAssessment(e.target.dataset.assessmentId);
                    });
                });
                document.querySelectorAll('.view-submissions-btn-admin').forEach(button => {
                    button.addEventListener('click', (e) => {
                        loadSubmissionsForAdmin(e.target.dataset.assessmentId);
                    });
                });
            } else {
                showNotification(`Error loading assessments: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Load assessments error:', error);
            showNotification('Error loading assessments.', 'error');
        }
    }

    async function takeAssessment(assessmentId) {
        showHideAssessmentContainers('take');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/assessments/${assessmentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                currentAssessmentToTake = data.assessment;
                takeAssessmentTitle.textContent = currentAssessmentToTake.title;
                takeAssessmentForm.innerHTML = ''; // Clear previous questions

                currentAssessmentToTake.questions.forEach((q, index) => {
                    const questionDiv = document.createElement('div');
                    questionDiv.classList.add('question-item');
                    questionDiv.innerHTML = `<h4>${index + 1}. ${q.text}</h4>`;

                    if (q.type === 'text') {
                        questionDiv.innerHTML += `<textarea name="answer-${index}" rows="3" placeholder="Your answer" required></textarea>`;
                    } else if (q.type === 'mcq') {
                        q.options.forEach((option, optIndex) => {
                            questionDiv.innerHTML += `
                                <label>
                                    <input type="radio" name="answer-${index}" value="${optIndex}" required>
                                    ${option}
                                </label><br>
                            `;
                        });
                    }
                    takeAssessmentForm.appendChild(questionDiv);
                });
            } else {
                showNotification(`Error loading assessment: ${data.message}`, 'error');
                showHideAssessmentContainers('list'); // Go back to list
            }
        } catch (error) {
            console.error('Take assessment error:', error);
            showNotification('Error loading assessment for taking.', 'error');
            showHideAssessmentContainers('list');
        }
    }

    submitAnswersBtn.addEventListener('click', async () => {
        const answers = [];
        let allAnswered = true;
        takeAssessmentForm.querySelectorAll('.question-item').forEach((qItem, index) => {
            const questionType = currentAssessmentToTake.questions[index].type;
            let answer = null;

            if (questionType === 'text') {
                const textarea = qItem.querySelector(`textarea[name="answer-${index}"]`);
                answer = textarea ? textarea.value.trim() : '';
            } else if (questionType === 'mcq') {
                const selectedRadio = qItem.querySelector(`input[name="answer-${index}"]:checked`);
                answer = selectedRadio ? selectedRadio.value : null;
            }

            if (answer === null || answer === '') { // Check for empty string for text and null for radio
                allAnswered = false;
            }
            answers.push({ questionIndex: index, answer: answer });
        });

        if (!allAnswered) {
            showNotification('Please answer all questions before submitting.', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: currentUser.id, username: currentUser.username, answers })
            });
            const data = await response.json();
            if (response.ok) {
                assessmentSubmissionMessage.textContent = 'Assessment submitted successfully!';
                assessmentSubmissionMessage.classList.remove('error');
                assessmentSubmissionMessage.classList.add('success');
                showNotification('Assessment submitted successfully!');
                // Automatically go back to assessment list after a short delay
                setTimeout(() => {
                    showHideAssessmentContainers('list');
                    assessmentSubmissionMessage.textContent = ''; // Clear message
                }, 2000);
            } else {
                assessmentSubmissionMessage.textContent = `Error submitting assessment: ${data.message}`;
                assessmentSubmissionMessage.classList.remove('success');
                assessmentSubmissionMessage.classList.add('error');
                showNotification(`Error submitting assessment: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Submit answers error:', error);
            assessmentSubmissionMessage.textContent = 'An error occurred during submission.';
            assessmentSubmissionMessage.classList.remove('success');
            assessmentSubmissionMessage.classList.add('error');
            showNotification('An error occurred during submission.', 'error');
        }
    });

    async function loadSubmissionsForAdmin(assessmentId) {
        showHideAssessmentContainers('submissions');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroomId}/assessments/${assessmentId}/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                const assessment = await fetch(`/api/classrooms/${currentClassroomId}/assessments/${assessmentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => res.json()).then(d => d.assessment);

                viewSubmissionAssessmentTitle.textContent = `Submissions for: ${assessment.title}`;
                submissionsList.innerHTML = '';
                if (data.submissions.length === 0) {
                    submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
                    return;
                }
                data.submissions.forEach(submission => {
                    const submissionItem = document.createElement('div');
                    submissionItem.classList.add('submission-item');
                    let submissionHtml = `
                        <h4>Submitted by: ${submission.username} (Score: ${submission.score !== undefined ? submission.score : 'N/A'})</h4>
                        <p>Submitted On: ${new Date(submission.timestamp).toLocaleString()}</p>
                        <h5>Answers:</h5>
                    `;
                    submission.answers.forEach((answerData, qIndex) => {
                        const question = assessment.questions[answerData.questionIndex];
                        submissionHtml += `<p><strong>Q${answerData.questionIndex + 1}: ${question.text}</strong><br>`;
                        if (question.type === 'mcq') {
                            const studentAnswer = question.options[answerData.answer];
                            const correctAnswer = question.options[question.correctOption];
                            const isCorrect = (answerData.answer == question.correctOption) ? ' (Correct)' : ' (Incorrect)';
                            submissionHtml += `Your Answer: ${studentAnswer} ${isCorrect}<br>`;
                            submissionHtml += `Correct Answer: ${correctAnswer}</p>`;
                        } else {
                            submissionHtml += `Your Answer: ${answerData.answer || 'No Answer'}</p>`;
                        }
                    });
                    submissionItem.innerHTML = submissionHtml;
                    submissionsList.appendChild(submissionItem);
                });
            } else {
                showNotification(`Error loading submissions: ${data.message}`, 'error');
                showHideAssessmentContainers('list');
            }
        } catch (error) {
            console.error('Load submissions error:', error);
            showNotification('Error loading submissions.', 'error');
            showHideAssessmentContainers('list');
        }
    }

    function showHideAssessmentContainers(mode) {
        assessmentCreationForm.classList.remove('active');
        assessmentList.classList.remove('active');
        takeAssessmentContainer.classList.remove('active');
        viewSubmissionsContainer.classList.remove('active');

        if (mode === 'create') {
            assessmentCreationForm.classList.add('active');
        } else if (mode === 'list') {
            assessmentList.classList.add('active');
        } else if (mode === 'take') {
            takeAssessmentContainer.classList.add('active');
        } else if (mode === 'submissions') {
            viewSubmissionsContainer.classList.add('active');
        }
    }

    // --- Settings Functions ---
    async function saveSettings() {
        const newUsername = usernameSettingsInput.value.trim();
        if (!newUsername) {
            settingsMessage.textContent = 'Username cannot be empty.';
            settingsMessage.style.color = 'red';
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/update-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: currentUser.id, newUsername })
            });
            const data = await response.json();
            if (response.ok) {
                currentUser.username = newUsername; // Update local user object
                localStorage.setItem('user', JSON.stringify(currentUser));
                currentUsernameDisplay.textContent = currentUser.username;
                settingsMessage.textContent = 'Username updated successfully!';
                settingsMessage.style.color = 'green';
                showNotification('Username updated!');
            } else {
                settingsMessage.textContent = `Error: ${data.message}`;
                settingsMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Update username error:', error);
            settingsMessage.textContent = 'An error occurred while updating username.';
            settingsMessage.style.color = 'red';
        }
    }

    // --- Notifications ---
    function showNotification(message, type = 'success') { // 'success', 'error', 'info', 'warning'
        const notification = document.createElement('div');
        notification.classList.add('notification-message');
        notification.textContent = message;

        // Apply type-specific styling if needed (e.g., using different background colors)
        if (type === 'error') {
            notification.style.backgroundColor = 'rgba(220, 53, 69, 0.8)'; // Red
        } else if (type === 'info') {
            notification.style.backgroundColor = 'rgba(23, 162, 184, 0.8)'; // Blue
        } else if (type === 'warning') {
            notification.style.backgroundColor = 'rgba(255, 193, 7, 0.8)'; // Yellow/Orange
        } else {
            notification.style.backgroundColor = 'rgba(40, 167, 69, 0.8)'; // Green (default for success)
        }

        notificationsContainer.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10); // Small delay for reflow

        // Animate out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            }, { once: true });
        }, 5000); // Notification visible for 5 seconds
    }

    // --- WebRTC (Video Broadcast) ---
    async function startBroadcast() {
        if (currentUser.role !== 'admin') {
            showNotification('Only admins can start a broadcast.', 'error');
            return;
        }

        // Check selected broadcast type
        const broadcastType = document.querySelector('input[name="broadcast-type"]:checked').value;
        const mediaConstraints = { video: true, audio: true };

        // Conditional media constraints based on broadcast type
        if (broadcastType === 'audio-only') {
            mediaConstraints.video = false;
        } else if (broadcastType === 'screen-share') {
            try {
                localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                // Replace video track with screen share if already broadcasting camera
                if (localVideo.srcObject && localVideo.srcObject.getVideoTracks().length > 0) {
                    const videoTrack = localStream.getVideoTracks()[0];
                    localVideo.srcObject.getTracks().forEach(track => track.stop()); // Stop existing tracks
                    localVideo.srcObject = new MediaStream([videoTrack, ...localStream.getAudioTracks()]);
                } else {
                    localVideo.srcObject = localStream;
                }
                showNotification('Screen sharing started.');
                socket.emit('start-broadcast', { classroomId: currentClassroomId, userId: currentUser.id, username: currentUser.username });
                return; // Exit as screen share is handled
            } catch (err) {
                console.error('Error starting screen share:', err);
                showNotification('Could not start screen share. Please allow permission.', 'error');
                return;
            }
        }

        // Default camera/audio broadcast
        try {
            localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            localVideo.srcObject = localStream;
            showNotification('Broadcast started!');
            socket.emit('start-broadcast', { classroomId: currentClassroomId, userId: currentUser.id, username: currentUser.username });
        } catch (err) {
            console.error('Error accessing media devices:', err);
            showNotification('Could not start broadcast. Please check camera/mic permissions.', 'error');
        }
    }

    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            localVideo.srcObject = null;
        }
        for (const peerId in peerConnections) {
            peerConnections[peerId].close();
            delete peerConnections[peerId];
        }
        remoteVideoContainer.innerHTML = ''; // Clear all remote videos
        socket.emit('end-broadcast', { classroomId: currentClassroomId, userId: currentUser.id });
        showNotification('Broadcast ended.');
    }

    // WebRTC signaling - Admin initiates, students respond
    socket.on('start-broadcast', async (data) => {
        if (data.classroomId !== currentClassroomId) return;
        if (currentUser.role === 'student' || data.userId === currentUser.id) { // Students and the admin's own client
            showNotification(`Admin ${data.username} started a broadcast.`);
            if (data.userId !== currentUser.id) { // If it's a broadcast from another admin (shouldn't happen in single admin setup, but for robustness) or the actual admin
                // Student's perspective: prepare to receive broadcast
                await createPeerConnection(data.userId, true); // true indicates receiving
            }
        }
    });

    socket.on('end-broadcast', (data) => {
        if (data.classroomId !== currentClassroomId) return;
        showNotification(`Admin ${data.username} ended the broadcast.`);
        if (peerConnections[data.userId]) {
            peerConnections[data.userId].close();
            delete peerConnections[data.userId];
            // Remove the specific remote video element
            const remoteVideo = document.getElementById(`remote-video-${data.userId}`);
            if (remoteVideo) remoteVideo.remove();
        }
    });

    async function createPeerConnection(peerId, isReceiving = false) {
        if (peerConnections[peerId]) return; // Already connected

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        });
        peerConnections[peerId] = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-signal', {
                    classroomId: currentClassroomId,
                    senderId: currentUser.id,
                    receiverId: peerId,
                    signal: { candidate: event.candidate }
                });
            }
        };

        if (isReceiving) {
            // Student receiving broadcast
            pc.ontrack = (event) => {
                const remoteVideo = document.getElementById(`remote-video-${peerId}`);
                if (remoteVideo) {
                    remoteVideo.srcObject = event.streams[0];
                } else {
                    const newRemoteVideo = document.createElement('video');
                    newRemoteVideo.id = `remote-video-${peerId}`;
                    newRemoteVideo.autoplay = true;
                    newRemoteVideo.playsInline = true;
                    newRemoteVideo.srcObject = event.streams[0];
                    remoteVideoContainer.appendChild(newRemoteVideo);
                }
            };
        } else {
            // Admin sending broadcast
            if (localStream) {
                localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
            }
        }
        return pc;
    }

    socket.on('webrtc-signal', async (data) => {
        if (data.classroomId !== currentClassroomId || data.receiverId !== currentUser.id) return;

        let pc = peerConnections[data.senderId];
        if (!pc) {
            // Create PC if it doesn't exist, this happens when a new peer connects
            pc = await createPeerConnection(data.senderId, currentUser.role === 'student'); // Students receive, admin sends
        }

        if (data.signal.offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-signal', {
                classroomId: currentClassroomId,
                senderId: currentUser.id,
                receiverId: data.senderId,
                signal: { answer: pc.localDescription }
            });
        } else if (data.signal.answer) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal.answer));
        } else if (data.signal.candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
            } catch (e) {
                console.error('Error adding received ICE candidate:', e);
            }
        }
    });

    // Admin-specific: When a new user joins, if broadcast is active, send offer
    socket.on('user-joined-classroom', async (data) => {
        if (data.classroomId !== currentClassroomId) return;
        showNotification(`${data.username} joined the classroom.`);

        if (currentUser.role === 'admin' && localStream) { // If admin and broadcasting
            showNotification(`Establishing broadcast with ${data.username}...`);
            const pc = await createPeerConnection(data.userId, false); // Admin initiates connection, isSending = true
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc-signal', {
                classroomId: currentClassroomId,
                senderId: currentUser.id,
                receiverId: data.userId,
                signal: { offer: pc.localDescription }
            });
        }
    });

    socket.on('user-left-classroom', (data) => {
        if (data.classroomId !== currentClassroomId) return;
        showNotification(`${data.username} left the classroom.`);
        if (peerConnections[data.userId]) {
            peerConnections[data.userId].close();
            delete peerConnections[data.userId];
            const remoteVideo = document.getElementById(`remote-video-${data.userId}`);
            if (remoteVideo) remoteVideo.remove();
        }
    });

    // --- Event Listeners ---
    // Auth
    showRegisterLink.addEventListener('click', () => showAuthContainer(registerContainer));
    showLoginLink.addEventListener('click', () => showAuthContainer(loginContainer));

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        handleAuth('login', { email, password });
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const role = e.target.role.value;
        handleAuth('register', { username, email, password, role });
    });

    // Dashboard
    navDashboard.addEventListener('click', () => {
        showView('dashboard');
        loadClassrooms();
    });
    navClassroom.addEventListener('click', () => {
        if (currentClassroomId) {
            showView('classroom');
            // Re-setup if necessary, though it should retain state
        } else {
            showNotification('Please join a classroom first!', 'warning');
        }
    });
    navSettings.addEventListener('click', () => {
        showView('settings');
        if (currentUser) {
            usernameSettingsInput.value = currentUser.username;
        }
    });
    logoutBtn.addEventListener('click', logout);

    createClassroomBtn.addEventListener('click', () => {
        const name = newClassroomNameInput.value.trim();
        if (name) {
            createClassroom(name);
            newClassroomNameInput.value = '';
        } else {
            showNotification('Classroom name cannot be empty.', 'warning');
        }
    });

    // Settings
    saveSettingsBtn.addEventListener('click', saveSettings);

    // Hamburger Menu & Sidebar
    if (hamburgerMenuBtn && sidebar) {
        hamburgerMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
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

    // Initial Load
    checkLoginStatus();
});
