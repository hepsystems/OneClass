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
    const joinClassroomIdInput = document.getElementById('join-classroom-id');
    const joinClassroomBtn = document.getElementById('join-classroom-btn');
    const backToDashboardFromCreateBtn = document.getElementById('back-to-dashboard-from-create-btn');
    const backToDashboardFromJoinBtn = document.getElementById('back-to-dashboard-from-join-btn');
    const createClassroomLink = document.getElementById('create-classroom-link');
    const joinClassroomLink = document.getElementById('join-classroom-link');
    const userClassroomsList = document.getElementById('user-classrooms-list');

    const classroomSection = document.getElementById('classroom-section');
    const classroomNameDisplay = document.getElementById('classroom-name-display');
    const classroomIdDetailDisplay = document.getElementById('classroom-id-detail-display');
    const classroomCodeDisplay = document.getElementById('classroom-code-display');
    const leaveClassroomBtn = document.getElementById('leave-classroom-btn');
    const classroomNavChat = document.getElementById('classroom-nav-chat');
    const classroomNavWhiteboard = document.getElementById('classroom-nav-whiteboard');
    const classroomNavMembers = document.getElementById('classroom-nav-members');
    const classroomNavResources = document.getElementById('classroom-nav-resources');
    const classroomNavAssessments = document.getElementById('classroom-nav-assessments');
    const chatTab = document.getElementById('chat-tab');
    const whiteboardTab = document.getElementById('whiteboard-tab');
    const membersTab = document.getElementById('members-tab');
    const resourcesTab = document.getElementById('resources-tab');
    const assessmentsTab = document.getElementById('assessments-tab');

    // Chat Elements
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendMessageBtn = document.getElementById('send-message-btn');

    // Whiteboard Elements
    const whiteboardContainer = document.getElementById('whiteboard-container');
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const ctx = whiteboardCanvas.getContext('2d');
    const clearWhiteboardBtn = document.getElementById('clear-whiteboard-btn');
    const colorPicker = document.getElementById('color-picker');
    const brushSize = document.getElementById('brush-size');
    const whiteboardPagesContainer = document.getElementById('whiteboard-pages');
    const addWhiteboardPageBtn = document.getElementById('add-whiteboard-page-btn');

    // Members Elements
    const membersList = document.getElementById('members-list');

    // Resources Elements
    const resourcesList = document.getElementById('resources-list');
    const resourceNameInput = document.getElementById('resource-name');
    const resourceFileInput = document.getElementById('resource-file');
    const uploadResourceBtn = document.getElementById('upload-resource-btn');

    // Assessments Elements
    const assessmentsList = document.getElementById('assessments-list');
    const createAssessmentBtn = document.getElementById('create-assessment-btn');
    const createAssessmentSection = document.getElementById('create-assessment-section');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionInput = document.getElementById('assessment-description');
    const assessmentDeadlineInput = document.getElementById('assessment-deadline');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsContainer = document.getElementById('questions-container');
    const saveAssessmentBtn = document.getElementById('save-assessment-btn');
    const backToAssessmentListFromCreateBtn = document.getElementById('back-to-assessment-list-from-create-btn');
    const viewAssessmentSection = document.getElementById('view-assessment-section');
    const viewAssessmentTitle = document.getElementById('view-assessment-title');
    const viewAssessmentDescription = document.getElementById('view-assessment-description');
    const viewAssessmentDeadline = document.getElementById('view-assessment-deadline');
    const viewAssessmentQuestionsContainer = document.getElementById('view-assessment-questions-container');
    const takeAssessmentBtn = document.getElementById('take-assessment-btn');
    const editAssessmentBtn = document.getElementById('edit-assessment-btn'); // For editing existing assessments
    const deleteAssessmentBtn = document.getElementById('delete-assessment-btn');
    const backToAssessmentListFromViewBtn = document.getElementById('back-to-assessment-list-from-view-btn');
    const takeAssessmentSection = document.getElementById('take-assessment-section');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentQuestionsContainer = document.getElementById('take-assessment-questions-container');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const backToViewAssessmentFromTakeBtn = document.getElementById('back-to-view-assessment-from-take-btn');
    const viewSubmissionsBtn = document.getElementById('view-submissions-btn');
    const submissionsSection = document.getElementById('submissions-section');
    const submissionsList = document.getElementById('submissions-list');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');


    // Settings Elements
    const settingsSection = document.getElementById('settings-section');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings-btn');
    const usernameSettingsInput = document.getElementById('username-settings-input');
    const emailSettingsInput = document.getElementById('email-settings-input');
    const passwordSettingsInput = document.getElementById('password-settings-input');
    const saveProfileSettingsBtn = document.getElementById('save-profile-settings-btn');
    const notificationSettingsToggle = document.getElementById('notification-settings-toggle');

    // Notification Elements
    const notificationsList = document.getElementById('notifications-list');
    const notificationCenterBtn = document.getElementById('notification-center-btn');
    const closeNotificationsBtn = document.getElementById('close-notifications-btn');
    const notificationCountSpan = document.getElementById('notification-count');
    const notificationCenter = document.getElementById('notification-center');

    // --- Global Variables ---
    let socket;
    let currentClassroomId = null;
    let currentUsername = null;
    let currentUser = null; // Store full user object
    let currentClassroomName = null;
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentWhiteboardPage = 0;
    let whiteboardPageData = []; // Stores image data for each page
    let currentAssessmentToView = null;
    let currentAssessmentToTake = null;

    // --- Utility Functions ---

    /**
     * Shows a specific section and hides others.
     * @param {HTMLElement} sectionToShow - The section element to display.
     */
    function showSection(sectionToShow) {
        [authSection, dashboardSection, createClassroomSection, joinClassroomSection, classroomSection,
            settingsSection, createAssessmentSection, viewAssessmentSection, takeAssessmentSection,
            submissionsSection
        ].forEach(section => {
            if (section) section.classList.add('hidden');
        });
        if (sectionToShow) sectionToShow.classList.remove('hidden');
    }

    /**
     * Updates the active state of navigation links.
     * @param {HTMLElement} activeNav - The navigation link to set as active.
     */
    function updateNavActiveState(activeNav) {
        [navDashboard, navClassroom, navSettings].forEach(nav => {
            if (nav) nav.classList.remove('active');
        });
        if (activeNav) activeNav.classList.add('active');
    }

    /**
     * Displays a temporary message to the user.
     * @param {HTMLElement} element - The element to display the message in.
     * @param {string} message - The message content.
     * @param {string} type - 'success' or 'error' for styling.
     */
    function displayMessage(element, message, type) {
        element.textContent = message;
        element.className = ''; // Clear previous classes
        element.classList.add('message', type);
        setTimeout(() => {
            element.textContent = '';
            element.classList.remove(type);
        }, 3000);
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

    /**
     * Adds a notification to the display.
     * @param {string} message - The notification message.
     * @param {string} type - Type of notification (e.g., 'new_message', 'new_resource').
     * @param {string} link - Optional link associated with the notification.
     */
    function addNotification(message, type, link = '#') {
        const notificationItem = document.createElement('li');
        notificationItem.classList.add('notification-item', type);
        notificationItem.innerHTML = `
            <span>${message}</span>
            <a href="${link}" class="notification-link ${link === '#' ? 'hidden' : ''}">View</a>
        `;
        notificationsList.prepend(notificationItem); // Add to the top

        // Update notification count
        const currentCount = parseInt(notificationCountSpan.textContent);
        notificationCountSpan.textContent = currentCount + 1;
        notificationCountSpan.classList.add('has-notifications');
    }

    function clearNotifications() {
        notificationsList.innerHTML = '';
        notificationCountSpan.textContent = '0';
        notificationCountSpan.classList.remove('has-notifications');
    }

    /**
     * Displays a specific tab within the classroom section.
     * @param {HTMLElement} tabToShow - The tab element to display.
     */
    function showClassroomTab(tabToShow) {
        [chatTab, whiteboardTab, membersTab, resourcesTab, assessmentsTab].forEach(tab => {
            if (tab) tab.classList.add('hidden');
        });
        if (tabToShow) tabToShow.classList.remove('hidden');

        [classroomNavChat, classroomNavWhiteboard, classroomNavMembers, classroomNavResources, classroomNavAssessments].forEach(nav => {
            if (nav) nav.classList.remove('active');
        });
        if (tabToShow === chatTab) classroomNavChat.classList.add('active');
        else if (tabToShow === whiteboardTab) classroomNavWhiteboard.classList.add('active');
        else if (tabToShow === membersTab) classroomNavMembers.classList.add('active');
        else if (tabToShow === resourcesTab) classroomNavResources.classList.add('active');
        else if (tabToShow === assessmentsTab) classroomNavAssessments.classList.add('active');
    }

    // --- Authentication ---

    async function handleAuth(event, endpoint, form, messageElement) {
        event.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (response.ok) {
                displayMessage(messageElement, result.message, 'success');
                if (endpoint === '/api/login') {
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user)); // Store user data
                    currentUser = result.user;
                    currentUsername = result.user.username; // Update global username
                    setupSocket();
                    loadUserClassrooms();
                    showSection(dashboardSection);
                    updateNavActiveState(navDashboard);
                    currentUsernameDisplay.textContent = currentUsername;
                    authMessage.textContent = ''; // Clear auth message after successful login
                } else {
                    // For registration, clear form and switch to login
                    form.reset();
                    showSection(loginContainer);
                    showLoginLink.click(); // Simulate click to show login
                }
            } else {
                displayMessage(messageElement, result.message, 'error');
            }
        } catch (error) {
            console.error('Auth error:', error);
            displayMessage(messageElement, 'An error occurred. Please try again.', 'error');
        }
    }

    function checkLoginStatus() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            currentUser = JSON.parse(user);
            currentUsername = currentUser.username;
            currentUsernameDisplay.textContent = currentUsername;
            setupSocket();
            loadUserClassrooms();
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
        } else {
            showSection(authSection);
            showSection(loginContainer);
        }
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        currentUser = null;
        currentUsername = null;
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        showSection(authSection);
        showSection(loginContainer);
        displayMessage(authMessage, 'You have been logged out.', 'success');
        authForm.reset(); // Clear any previous auth messages
    }

    // --- Socket.IO Setup ---
    function setupSocket() {
        if (socket) {
            socket.disconnect(); // Disconnect existing socket if any
        }
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found for socket connection.');
            return;
        }
        socket = io({
            auth: {
                token: token
            }
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.IO as:', currentUser.username);
            socket.emit('request_chat_history', currentClassroomId);
            socket.emit('request_whiteboard_state', currentClassroomId, currentWhiteboardPage);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO');
        });

        socket.on('error', (message) => {
            console.error('Socket error:', message);
            // Optionally display an error to the user
        });

        socket.on('classroom_joined', (data) => {
            console.log(`Joined classroom: ${data.classroomName}`);
            currentClassroomId = data.classroomId;
            currentClassroomName = data.classroomName;
            classroomNameDisplay.textContent = currentClassroomName;
            classroomIdDetailDisplay.textContent = currentClassroomId;
            classroomCodeDisplay.textContent = data.classroomCode; // Display the unique code
            showSection(classroomSection);
            showClassroomTab(chatTab); // Default to chat tab
            updateNavActiveState(navClassroom);
            chatMessages.innerHTML = ''; // Clear messages on joining new room
            whiteboardPageData = []; // Clear whiteboard pages
            currentWhiteboardPage = 0;
            addWhiteboardPage(true); // Add initial blank page
            socket.emit('request_chat_history', currentClassroomId);
            socket.emit('request_whiteboard_state', currentClassroomId, currentWhiteboardPage);
            socket.emit('request_members_list', currentClassroomId);
            socket.emit('request_resources_list', currentClassroomId);
            socket.emit('request_assessments_list', currentClassroomId);
        });

        socket.on('classroom_left', () => {
            console.log('Left classroom');
            currentClassroomId = null;
            currentClassroomName = null;
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadUserClassrooms();
            clearNotifications(); // Clear notifications related to a specific classroom
        });

        socket.on('classroom_list', (classrooms) => {
            userClassroomsList.innerHTML = '';
            if (classrooms.length === 0) {
                userClassroomsList.innerHTML = '<p>No classrooms joined yet. Create or join one!</p>';
                return;
            }
            classrooms.forEach(classroom => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${classroom.name} (ID: ${classroom.id}) - Code: ${classroom.code}</span>
                    <button class="join-btn" data-id="${classroom.id}" data-name="${classroom.name}" data-code="${classroom.code}">Open</button>
                    <button class="leave-btn" data-id="${classroom.id}">Leave</button>
                `;
                userClassroomsList.appendChild(li);
            });
        });

        socket.on('new_classroom', (classroom) => {
            console.log('New classroom created/joined:', classroom);
            loadUserClassrooms(); // Refresh the list
        });

        socket.on('message', (data) => {
            const isCurrentUser = data.userId === currentUser.id;
            addChatMessage(data.username, data.message, data.timestamp, isCurrentUser);
            if (!chatTab.classList.contains('active')) {
                addNotification(`New message in ${currentClassroomName}: ${data.username}: ${data.message}`, 'new_message');
            }
        });

        socket.on('chat_history', (history) => {
            chatMessages.innerHTML = ''; // Clear existing messages
            history.forEach(msg => {
                const isCurrentUser = msg.userId === currentUser.id;
                addChatMessage(msg.username, msg.message, msg.timestamp, isCurrentUser);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });


        // Whiteboard events
        socket.on('drawing', (data) => {
            if (data.page === currentWhiteboardPage) {
                drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
            }
        });

        socket.on('whiteboard_clear', (data) => {
            if (data.page === currentWhiteboardPage) {
                clearWhiteboard(false);
            }
        });

        socket.on('whiteboard_state', (data) => {
            whiteboardPageData = data.pages || [];
            currentWhiteboardPage = data.currentPage || 0;
            renderWhiteboardPages();
            if (whiteboardPageData[currentWhiteboardPage]) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    ctx.drawImage(img, 0, 0);
                };
                img.src = whiteboardPageData[currentWhiteboardPage];
            } else {
                clearWhiteboard(false);
            }
        });

        socket.on('new_whiteboard_page', (data) => {
            whiteboardPageData = data.pages;
            renderWhiteboardPages();
            if (data.newPageId === currentWhiteboardPage) {
                clearWhiteboard(false); // If it's the new current page, clear it
            }
        });

        socket.on('members_list', (members) => {
            membersList.innerHTML = '';
            if (members.length === 0) {
                membersList.innerHTML = '<p>No members in this classroom.</p>';
                return;
            }
            members.forEach(member => {
                const li = document.createElement('li');
                li.textContent = member.username + (member.id === currentUser.id ? ' (You)' : '');
                membersList.appendChild(li);
            });
        });

        socket.on('new_member', (data) => {
            addNotification(`${data.username} joined the classroom!`, 'new_member');
            socket.emit('request_members_list', currentClassroomId); // Refresh list
        });

        socket.on('member_left', (data) => {
            addNotification(`${data.username} left the classroom.`, 'member_left');
            socket.emit('request_members_list', currentClassroomId); // Refresh list
        });

        socket.on('resource_uploaded', (data) => {
            addNotification(`New resource uploaded: ${data.name}`, 'new_resource', data.url);
            socket.emit('request_resources_list', currentClassroomId);
        });

        socket.on('resources_list', (resources) => {
            resourcesList.innerHTML = '';
            if (resources.length === 0) {
                resourcesList.innerHTML = '<p>No resources uploaded yet.</p>';
                return;
            }
            resources.forEach(resource => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${resource.name}</span>
                    <a href="${resource.url}" target="_blank" download="${resource.name}">Download</a>
                `;
                resourcesList.appendChild(li);
            });
        });

        socket.on('assessment_created', (data) => {
            addNotification(`New assessment created: ${data.title}`, 'new_assessment');
            socket.emit('request_assessments_list', currentClassroomId);
        });

        socket.on('assessments_list', (assessments) => {
            assessmentsList.innerHTML = '';
            if (assessments.length === 0) {
                assessmentsList.innerHTML = '<p>No assessments created yet.</p>';
                return;
            }
            assessments.forEach(assessment => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${assessment.title} (Deadline: ${new Date(assessment.deadline).toLocaleDateString()})</span>
                    <button class="view-assessment-btn" data-id="${assessment.id}">View</button>
                `;
                assessmentsList.appendChild(li);
            });
        });

        socket.on('assessment_details', (assessment) => {
            currentAssessmentToView = assessment;
            viewAssessmentTitle.textContent = assessment.title;
            viewAssessmentDescription.textContent = assessment.description;
            viewAssessmentDeadline.textContent = `Deadline: ${new Date(assessment.deadline).toLocaleString()}`;
            viewAssessmentQuestionsContainer.innerHTML = '';
            assessment.questions.forEach((q, index) => {
                const qDiv = document.createElement('div');
                qDiv.classList.add('question-display');
                qDiv.innerHTML = `
                    <p><strong>${index + 1}. ${q.questionText}</strong></p>
                    ${q.options && q.options.length > 0 ?
                        `<ul>${q.options.map(opt => `<li>${opt}</li>`).join('')}</ul>` : ''
                    }
                `;
                viewAssessmentQuestionsContainer.appendChild(qDiv);
            });
            // Show/hide edit/delete/take buttons based on user role/ownership
            // For now, assume all can view and take. Edit/Delete would require a check for isInstructor or isCreator
            // For simplicity, let's assume if it's an instructor, they can edit/delete, otherwise only take.
            if (currentUser && currentUser.isInstructor) { // Example: assuming an 'isInstructor' flag
                editAssessmentBtn.classList.remove('hidden');
                deleteAssessmentBtn.classList.remove('hidden');
            } else {
                editAssessmentBtn.classList.add('hidden');
                deleteAssessmentBtn.classList.add('hidden');
            }

            // Check if user has already submitted this assessment
            fetch(`/api/assessments/${assessment.id}/submission_status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.submitted) {
                    takeAssessmentBtn.classList.add('hidden');
                    viewSubmissionsBtn.classList.remove('hidden');
                } else {
                    takeAssessmentBtn.classList.remove('hidden');
                    viewSubmissionsBtn.classList.add('hidden');
                }
            })
            .catch(error => console.error('Error fetching submission status:', error));


            showSection(viewAssessmentSection);
        });

        socket.on('assessment_deleted', (data) => {
            addNotification(`Assessment "${data.title}" deleted.`, 'info');
            loadAssessments(); // Refresh list
        });

        socket.on('assessment_submitted', (data) => {
            addNotification(`Your submission for "${data.title}" has been received.`, 'success');
            // After submission, refresh assessment list or navigate back
            loadAssessments();
        });

        socket.on('assessment_submissions_list', (submissions) => {
            submissionsList.innerHTML = '';
            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions yet.</p>';
                return;
            }
            submissions.forEach(submission => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${submission.username} - Score: ${submission.score !== null ? submission.score : 'Pending'} / ${submission.totalMarks}</span>
                    <button class="view-submission-details-btn" data-id="${submission.id}">View Details</button>
                `;
                submissionsList.appendChild(li);
            });
            showSection(submissionsSection);
        });

        // Universal notification listener
        socket.on('notification', (data) => {
            if (notificationSettingsToggle.checked) { // Check if notifications are enabled
                addNotification(data.message, data.type, data.link);
            }
        });
    }

    // --- Classroom Management ---

    async function loadUserClassrooms() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/classrooms', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (response.ok) {
                socket.emit('request_classroom_list', result);
            } else {
                console.error('Failed to load classrooms:', result.message);
                displayMessage(authMessage, result.message, 'error'); // Use authMessage for general errors
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
            displayMessage(authMessage, 'Failed to connect to server.', 'error');
        }
    }

    // --- Whiteboard Functions ---
    function initializeWhiteboard() {
        whiteboardCanvas.width = whiteboardContainer.clientWidth;
        whiteboardCanvas.height = whiteboardContainer.clientHeight;

        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorPicker.value;
    }

    function startDrawing(e) {
        drawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }

    function draw(e) {
        if (!drawing) return;
        const [x, y] = [e.offsetX, e.offsetY];
        drawLine(lastX, lastY, x, y, ctx.strokeStyle, ctx.lineWidth, true);
        [lastX, lastY] = [x, y];
    }

    function stopDrawing() {
        drawing = false;
        saveWhiteboardState();
    }

    function drawLine(x0, y0, x1, y1, color, size, emit) {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.stroke();
        ctx.closePath();

        if (emit && socket && currentClassroomId) {
            socket.emit('drawing', {
                x0,
                y0,
                x1,
                y1,
                color,
                size,
                classroomId: currentClassroomId,
                page: currentWhiteboardPage
            });
        }
    }

    function clearWhiteboard(emit) {
        ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        if (emit && socket && currentClassroomId) {
            socket.emit('clear_whiteboard', {
                classroomId: currentClassroomId,
                page: currentWhiteboardPage
            });
        }
        saveWhiteboardState();
    }

    function saveWhiteboardState() {
        whiteboardPageData[currentWhiteboardPage] = whiteboardCanvas.toDataURL();
        if (socket && currentClassroomId) {
            socket.emit('save_whiteboard_state', {
                classroomId: currentClassroomId,
                pages: whiteboardPageData,
                currentPage: currentWhiteboardPage
            });
        }
    }

    function addWhiteboardPage(initialLoad = false) {
        if (!initialLoad) {
            saveWhiteboardState(); // Save current page before adding a new one
        }

        const newPageId = whiteboardPageData.length;
        whiteboardPageData.push(''); // Add a blank page
        currentWhiteboardPage = newPageId;
        renderWhiteboardPages();
        clearWhiteboard(false); // Clear canvas for new page

        if (socket && currentClassroomId && !initialLoad) {
            socket.emit('add_whiteboard_page', {
                classroomId: currentClassroomId,
                pages: whiteboardPageData,
                newPageId: newPageId
            });
        }
    }

    function goToWhiteboardPage(pageId) {
        if (pageId < 0 || pageId >= whiteboardPageData.length) return;
        saveWhiteboardState(); // Save current page
        currentWhiteboardPage = pageId;
        renderWhiteboardPages();

        if (whiteboardPageData[currentWhiteboardPage]) {
            const img = new Image();
            img.onload = () => {
                ctx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                ctx.drawImage(img, 0, 0);
            };
            img.src = whiteboardPageData[currentWhiteboardPage];
        } else {
            clearWhiteboard(false);
        }
        if (socket && currentClassroomId) {
            socket.emit('request_whiteboard_state', currentClassroomId, currentWhiteboardPage);
        }
    }

    function renderWhiteboardPages() {
        whiteboardPagesContainer.innerHTML = '';
        whiteboardPageData.forEach((data, index) => {
            const pageButton = document.createElement('button');
            pageButton.classList.add('whiteboard-page-btn');
            if (index === currentWhiteboardPage) {
                pageButton.classList.add('active');
            }
            pageButton.textContent = `Page ${index + 1}`;
            pageButton.addEventListener('click', () => goToWhiteboardPage(index));
            whiteboardPagesContainer.appendChild(pageButton);
        });
    }

    // --- Assessment Functions ---

    function addQuestionField(question = {}) {
        const questionIndex = questionsContainer.children.length;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('assessment-question-item');
        questionDiv.innerHTML = `
            <label for="question-text-${questionIndex}">Question ${questionIndex + 1}:</label>
            <input type="text" id="question-text-${questionIndex}" class="question-text" placeholder="Enter question text" value="${question.questionText || ''}" required>

            <label for="question-type-${questionIndex}">Type:</label>
            <select id="question-type-${questionIndex}" class="question-type">
                <option value="text" ${question.type === 'text' ? 'selected' : ''}>Text Answer</option>
                <option value="single-choice" ${question.type === 'single-choice' ? 'selected' : ''}>Single Choice</option>
                <option value="multi-choice" ${question.type === 'multi-choice' ? 'selected' : ''}>Multiple Choice</option>
            </select>

            <div class="options-container ${question.type === 'text' || !question.type ? 'hidden' : ''}">
                <label>Options:</label>
                <div class="options-list">
                    ${question.options && question.options.length > 0 ? question.options.map((opt, optIdx) => `
                        <div class="option-item">
                            <input type="text" class="option-text" value="${opt}" placeholder="Option ${optIdx + 1}" required>
                            <input type="${question.type === 'single-choice' ? 'radio' : 'checkbox'}" name="correct-option-${questionIndex}" class="correct-option" ${question.correctAnswers && question.correctAnswers.includes(opt) ? 'checked' : ''}> Correct
                            <button type="button" class="remove-option-btn">Remove</button>
                        </div>
                    `).join('') : ''}
                </div>
                <button type="button" class="add-option-btn">Add Option</button>
            </div>
            <button type="button" class="remove-question-btn">Remove Question</button>
        `;
        questionsContainer.appendChild(questionDiv);

        const questionTypeSelect = questionDiv.querySelector('.question-type');
        const optionsContainer = questionDiv.querySelector('.options-container');
        const optionsList = questionDiv.querySelector('.options-list');
        const addOptionBtn = questionDiv.querySelector('.add-option-btn');
        const removeQuestionBtn = questionDiv.querySelector('.remove-question-btn');

        questionTypeSelect.addEventListener('change', () => {
            if (questionTypeSelect.value === 'text') {
                optionsContainer.classList.add('hidden');
            } else {
                optionsContainer.classList.remove('hidden');
                // Ensure correct radio/checkbox type is set
                optionsList.querySelectorAll('.correct-option').forEach(input => {
                    input.type = questionTypeSelect.value === 'single-choice' ? 'radio' : 'checkbox';
                });
            }
        });

        addOptionBtn.addEventListener('click', () => {
            addOptionField(optionsList, questionTypeSelect.value, questionIndex);
        });

        optionsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-option-btn')) {
                e.target.closest('.option-item').remove();
            }
        });

        removeQuestionBtn.addEventListener('click', () => {
            questionDiv.remove();
        });
    }

    function addOptionField(optionsList, questionType, questionIndex) {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('option-item');
        optionDiv.innerHTML = `
            <input type="text" class="option-text" placeholder="Option Text" required>
            <input type="${questionType === 'single-choice' ? 'radio' : 'checkbox'}" name="correct-option-${questionIndex}" class="correct-option"> Correct
            <button type="button" class="remove-option-btn">Remove</button>
        `;
        optionsList.appendChild(optionDiv);
    }

    function getAssessmentDataFromForm() {
        const questions = [];
        questionsContainer.querySelectorAll('.assessment-question-item').forEach(qDiv => {
            const questionText = qDiv.querySelector('.question-text').value;
            const questionType = qDiv.querySelector('.question-type').value;
            const options = [];
            const correctAnswers = [];

            if (questionType !== 'text') {
                qDiv.querySelectorAll('.option-item').forEach(optDiv => {
                    const optionText = optDiv.querySelector('.option-text').value;
                    options.push(optionText);
                    if (optDiv.querySelector('.correct-option').checked) {
                        correctAnswers.push(optionText);
                    }
                });
            }

            questions.push({
                questionText,
                type: questionType,
                options: options.length > 0 ? options : undefined,
                correctAnswers: correctAnswers.length > 0 ? correctAnswers : undefined,
            });
        });

        return {
            title: assessmentTitleInput.value,
            description: assessmentDescriptionInput.value,
            deadline: assessmentDeadlineInput.value,
            questions: questions,
            classroomId: currentClassroomId,
        };
    }

    async function loadAssessments() {
        if (!currentClassroomId) return;
        socket.emit('request_assessments_list', currentClassroomId);
        showClassroomTab(assessmentsTab);
    }

    function loadTakeAssessment(assessment) {
        currentAssessmentToTake = assessment;
        takeAssessmentTitle.textContent = assessment.title;
        takeAssessmentQuestionsContainer.innerHTML = '';

        assessment.questions.forEach((q, index) => {
            const qDiv = document.createElement('div');
            qDiv.classList.add('take-assessment-question-item');
            qDiv.innerHTML = `
                <p><strong>${index + 1}. ${q.questionText}</strong></p>
            `;

            if (q.type === 'text') {
                qDiv.innerHTML += `<textarea class="answer-text" rows="3" placeholder="Your answer"></textarea>`;
            } else if (q.type === 'single-choice') {
                q.options.forEach((opt, optIdx) => {
                    qDiv.innerHTML += `
                        <div>
                            <input type="radio" name="question-${index}" value="${opt}" id="q${index}-opt${optIdx}">
                            <label for="q${index}-opt${optIdx}">${opt}</label>
                        </div>
                    `;
                });
            } else if (q.type === 'multi-choice') {
                q.options.forEach((opt, optIdx) => {
                    qDiv.innerHTML += `
                        <div>
                            <input type="checkbox" name="question-${index}" value="${opt}" id="q${index}-opt${optIdx}">
                            <label for="q${index}-opt${optIdx}">${opt}</label>
                        </div>
                    `;
                });
            }
            takeAssessmentQuestionsContainer.appendChild(qDiv);
        });
        showSection(takeAssessmentSection);
    }

    async function submitAssessment() {
        if (!currentAssessmentToTake) return;

        const answers = [];
        takeAssessmentQuestionsContainer.querySelectorAll('.take-assessment-question-item').forEach((qDiv, index) => {
            const question = currentAssessmentToTake.questions[index];
            let answer;

            if (question.type === 'text') {
                answer = qDiv.querySelector('.answer-text').value;
            } else if (question.type === 'single-choice') {
                const selectedRadio = qDiv.querySelector(`input[name="question-${index}"]:checked`);
                answer = selectedRadio ? selectedRadio.value : null;
            } else if (question.type === 'multi-choice') {
                answer = Array.from(qDiv.querySelectorAll(`input[name="question-${index}"]:checked`)).map(input => input.value);
            }
            answers.push({ questionIndex: index, answer });
        });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/assessments/${currentAssessmentToTake.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers })
            });
            const result = await response.json();

            if (response.ok) {
                console.log('Assessment submitted successfully:', result.submission);
                socket.emit('assessment_submitted', {
                    classroomId: currentClassroomId,
                    title: currentAssessmentToTake.title,
                    submission: result.submission
                });
                showSection(viewAssessmentSection); // Go back to assessment view
                socket.emit('request_assessment_details', { assessmentId: currentAssessmentToTake.id, classroomId: currentClassroomId }); // Refresh view
            } else {
                console.error('Failed to submit assessment:', result.message);
                alert('Failed to submit assessment: ' + result.message);
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert('An error occurred while submitting the assessment.');
        }
    }


    // --- Event Listeners ---

    // Auth Section
    if (loginForm) loginForm.addEventListener('submit', (e) => handleAuth(e, '/api/login', loginForm, authMessage));
    if (registerForm) registerForm.addEventListener('submit', (e) => handleAuth(e, '/api/register', registerForm, authMessage));

    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(registerContainer);
        displayMessage(authMessage, '', ''); // Clear messages
    });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(loginContainer);
        displayMessage(authMessage, '', ''); // Clear messages
    });

    // Dashboard Navigation
    if (navDashboard) navDashboard.addEventListener('click', () => {
        showSection(dashboardSection);
        updateNavActiveState(navDashboard);
        loadUserClassrooms();
    });
    if (navClassroom) navClassroom.addEventListener('click', () => {
        if (currentClassroomId) {
            showSection(classroomSection);
            updateNavActiveState(navClassroom);
            showClassroomTab(chatTab); // Default to chat
        } else {
            alert('Please join or create a classroom first.');
        }
    });
    if (navSettings) navSettings.addEventListener('click', async () => {
        showSection(settingsSection);
        updateNavActiveState(navSettings);
        // Load current user settings
        if (currentUser) {
            usernameSettingsInput.value = currentUser.username || '';
            emailSettingsInput.value = currentUser.email || '';
            // Password will not be pre-filled for security
            // Notification toggle state
            const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
            notificationSettingsToggle.checked = notificationsEnabled;
        }
    });
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Create Classroom
    if (createClassroomLink) createClassroomLink.addEventListener('click', () => showSection(createClassroomSection));
    if (backToDashboardFromCreateBtn) backToDashboardFromCreateBtn.addEventListener('click', () => showSection(dashboardSection));
    if (createClassroomBtn) createClassroomBtn.addEventListener('click', async () => {
        const classroomName = newClassroomNameInput.value.trim();
        if (!classroomName) {
            alert('Please enter a classroom name.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/classrooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: classroomName
                })
            });
            const result = await response.json();
            if (response.ok) {
                alert(`Classroom "${result.name}" created! ID: ${result.id}, Code: ${result.code}`);
                socket.emit('join_classroom', {
                    classroomId: result.id,
                    classroomName: result.name,
                    classroomCode: result.code
                });
                newClassroomNameInput.value = '';
            } else {
                alert('Failed to create classroom: ' + result.message);
            }
        } catch (error) {
            console.error('Error creating classroom:', error);
            alert('An error occurred while creating the classroom.');
        }
    });

    // Join Classroom
    if (joinClassroomLink) joinClassroomLink.addEventListener('click', () => showSection(joinClassroomSection));
    if (backToDashboardFromJoinBtn) backToDashboardFromJoinBtn.addEventListener('click', () => showSection(dashboardSection));
    if (joinClassroomBtn) joinClassroomBtn.addEventListener('click', async () => {
        const classroomIdOrCode = joinClassroomIdInput.value.trim();
        if (!classroomIdOrCode) {
            alert('Please enter a Classroom ID or Code.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/classrooms/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    identifier: classroomIdOrCode
                }) // Can be ID or Code
            });
            const result = await response.json();
            if (response.ok) {
                alert(`Joined classroom: "${result.name}"`);
                socket.emit('join_classroom', {
                    classroomId: result.id,
                    classroomName: result.name,
                    classroomCode: result.code
                });
                joinClassroomIdInput.value = '';
            } else {
                alert('Failed to join classroom: ' + result.message);
            }
        } catch (error) {
            console.error('Error joining classroom:', error);
            alert('An error occurred while joining the classroom.');
        }
    });

    // Dynamic Classroom List Actions (Join/Leave)
    if (userClassroomsList) {
        userClassroomsList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('join-btn')) {
                const id = e.target.dataset.id;
                const name = e.target.dataset.name;
                const code = e.target.dataset.code;
                socket.emit('join_classroom', {
                    classroomId: id,
                    classroomName: name,
                    classroomCode: code
                });
            } else if (e.target.classList.contains('leave-btn')) {
                const id = e.target.dataset.id;
                if (confirm('Are you sure you want to leave this classroom?')) {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`/api/classrooms/${id}/leave`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const result = await response.json();
                        if (response.ok) {
                            alert(result.message);
                            if (currentClassroomId === id) {
                                socket.emit('leave_classroom', currentClassroomId); // Explicitly tell server you're leaving
                            }
                            loadUserClassrooms(); // Refresh the list
                        } else {
                            alert('Failed to leave classroom: ' + result.message);
                        }
                    } catch (error) {
                        console.error('Error leaving classroom:', error);
                        alert('An error occurred while leaving the classroom.');
                    }
                }
            }
        });
    }

    // Classroom Section Navigation
    if (leaveClassroomBtn) leaveClassroomBtn.addEventListener('click', () => {
        if (currentClassroomId && confirm('Are you sure you want to leave this classroom?')) {
            socket.emit('leave_classroom', currentClassroomId);
        }
    });

    if (classroomNavChat) classroomNavChat.addEventListener('click', () => showClassroomTab(chatTab));
    if (classroomNavWhiteboard) classroomNavWhiteboard.addEventListener('click', () => showClassroomTab(whiteboardTab));
    if (classroomNavMembers) classroomNavMembers.addEventListener('click', () => {
        showClassroomTab(membersTab);
        if (currentClassroomId) {
            socket.emit('request_members_list', currentClassroomId);
        }
    });
    if (classroomNavResources) classroomNavResources.addEventListener('click', () => {
        showClassroomTab(resourcesTab);
        if (currentClassroomId) {
            socket.emit('request_resources_list', currentClassroomId);
        }
    });
    if (classroomNavAssessments) classroomNavAssessments.addEventListener('click', () => {
        showClassroomTab(assessmentsTab);
        loadAssessments(); // Load assessments when tab is clicked
    });

    // Chat
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message && currentClassroomId) {
            socket.emit('send_message', {
                classroomId: currentClassroomId,
                message: message
            });
            messageInput.value = '';
        }
    });
    if (messageInput) messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageBtn.click();
        }
    });

    // Whiteboard
    if (whiteboardCanvas) {
        whiteboardCanvas.addEventListener('mousedown', startDrawing);
        whiteboardCanvas.addEventListener('mousemove', draw);
        whiteboardCanvas.addEventListener('mouseup', stopDrawing);
        whiteboardCanvas.addEventListener('mouseout', stopDrawing); // Stop drawing if mouse leaves canvas

        // Touch events for mobile
        whiteboardCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            const rect = whiteboardCanvas.getBoundingClientRect();
            startDrawing({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });
        whiteboardCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            const rect = whiteboardCanvas.getBoundingClientRect();
            draw({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });
        whiteboardCanvas.addEventListener('touchend', stopDrawing);
    }
    if (clearWhiteboardBtn) clearWhiteboardBtn.addEventListener('click', () => clearWhiteboard(true));
    if (colorPicker) colorPicker.addEventListener('change', (e) => ctx.strokeStyle = e.target.value);
    if (brushSize) brushSize.addEventListener('change', (e) => ctx.lineWidth = e.target.value);
    if (addWhiteboardPageBtn) addWhiteboardPageBtn.addEventListener('click', addWhiteboardPage);

    // Resources
    if (uploadResourceBtn) uploadResourceBtn.addEventListener('click', async () => {
        const name = resourceNameInput.value.trim();
        const file = resourceFileInput.files[0];

        if (!name || !file) {
            alert('Please provide a resource name and select a file.');
            return;
        }
        if (!currentClassroomId) {
            alert('Please join a classroom first.');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('file', file);
        formData.append('classroomId', currentClassroomId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/resources/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }, // No 'Content-Type' header when using FormData, browser sets it
                body: formData,
            });
            const result = await response.json();
            if (response.ok) {
                alert('Resource uploaded successfully!');
                resourceNameInput.value = '';
                resourceFileInput.value = '';
                // Socket.IO will handle updating the list via 'resource_uploaded' event
            } else {
                alert('Failed to upload resource: ' + result.message);
            }
        } catch (error) {
            console.error('Error uploading resource:', error);
            alert('An error occurred while uploading the resource.');
        }
    });

    // Assessments
    if (createAssessmentBtn) createAssessmentBtn.addEventListener('click', () => {
        showSection(createAssessmentSection);
        questionsContainer.innerHTML = ''; // Clear previous questions
        assessmentTitleInput.value = '';
        assessmentDescriptionInput.value = '';
        assessmentDeadlineInput.value = '';
        addQuestionField(); // Add first question by default
    });
    if (addQuestionBtn) addQuestionBtn.addEventListener('click', () => addQuestionField());
    if (saveAssessmentBtn) saveAssessmentBtn.addEventListener('click', async () => {
        const assessmentData = getAssessmentDataFromForm();

        if (!assessmentData.title || !assessmentData.deadline || assessmentData.questions.length === 0) {
            alert('Please fill in all assessment details and add at least one question.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/assessments/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(assessmentData),
            });
            const result = await response.json();
            if (response.ok) {
                alert('Assessment saved successfully!');
                socket.emit('assessment_created', {
                    classroomId: currentClassroomId,
                    title: assessmentData.title
                });
                loadAssessments();
            } else {
                alert('Failed to save assessment: ' + result.message);
            }
        } catch (error) {
            console.error('Error saving assessment:', error);
            alert('An error occurred while saving the assessment.');
        }
    });

    if (backToAssessmentListFromCreateBtn) backToAssessmentListFromCreateBtn.addEventListener('click', () => loadAssessments());
    if (backToAssessmentListFromViewBtn) backToAssessmentListFromViewBtn.addEventListener('click', () => loadAssessments());
    if (takeAssessmentBtn) takeAssessmentBtn.addEventListener('click', () => {
        if (currentAssessmentToView) {
            loadTakeAssessment(currentAssessmentToView);
        }
    });
    if (submitAssessmentBtn) submitAssessmentBtn.addEventListener('click', submitAssessment);
    if (backToViewAssessmentFromTakeBtn) backToViewAssessmentFromTakeBtn.addEventListener('click', () => {
        if (currentAssessmentToView) {
            socket.emit('request_assessment_details', { assessmentId: currentAssessmentToView.id, classroomId: currentClassroomId });
        }
    });
    if (deleteAssessmentBtn) deleteAssessmentBtn.addEventListener('click', async () => {
        if (currentAssessmentToView && confirm(`Are you sure you want to delete "${currentAssessmentToView.title}"?`)) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/assessments/${currentAssessmentToView.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const result = await response.json();
                if (response.ok) {
                    socket.emit('assessment_deleted', { classroomId: currentClassroomId, title: currentAssessmentToView.title });
                    loadAssessments();
                } else {
                    alert('Failed to delete assessment: ' + result.message);
                }
            } catch (error) {
                console.error('Error deleting assessment:', error);
                alert('An error occurred while deleting the assessment.');
            }
        }
    });
    // Event listener for viewing individual assessments from the list
    if (assessmentsList) {
        assessmentsList.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-assessment-btn')) {
                const assessmentId = e.target.dataset.id;
                if (currentClassroomId && assessmentId) {
                    socket.emit('request_assessment_details', {
                        assessmentId: assessmentId,
                        classroomId: currentClassroomId
                    });
                }
            }
        });
    }

    if (viewSubmissionsBtn) viewSubmissionsBtn.addEventListener('click', async () => {
        if (currentAssessmentToView && currentClassroomId) {
            socket.emit('request_assessment_submissions', {
                assessmentId: currentAssessmentToView.id,
                classroomId: currentClassroomId
            });
        }
    });

    if (submissionsList) {
        submissionsList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('view-submission-details-btn')) {
                const submissionId = e.target.dataset.id;
                // Implement logic to view individual submission details
                // This would likely involve another Socket.IO event or API call
                alert(`View details for submission ID: ${submissionId}`);
                // Example: socket.emit('request_submission_details', { submissionId: submissionId, classroomId: currentClassroomId });
            }
        });
    }

    // Settings
    if (saveProfileSettingsBtn) saveProfileSettingsBtn.addEventListener('click', async () => {
        const newUsername = usernameSettingsInput.value.trim();
        const newEmail = emailSettingsInput.value.trim();
        const newPassword = passwordSettingsInput.value;

        const updates = {};
        if (newUsername && newUsername !== currentUser.username) updates.username = newUsername;
        if (newEmail && newEmail !== currentUser.email) updates.email = newEmail;
        if (newPassword) updates.password = newPassword;

        if (Object.keys(updates).length === 0) {
            alert('No changes to save.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            const result = await response.json();
            if (response.ok) {
                alert('Profile updated successfully!');
                // Update local currentUser and display
                currentUser = { ...currentUser, ...updates
                };
                currentUsername = currentUser.username;
                currentUsernameDisplay.textContent = currentUsername;
                localStorage.setItem('user', JSON.stringify(currentUser));
                passwordSettingsInput.value = ''; // Clear password field
            } else {
                alert('Failed to update profile: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating profile.');
        }
    });

    if (notificationSettingsToggle) notificationSettingsToggle.addEventListener('change', (e) => {
        localStorage.setItem('notificationsEnabled', e.target.checked);
        alert(`Notifications ${e.target.checked ? 'enabled' : 'disabled'}.`);
    });

    // Notification Center
    if (notificationCenterBtn) notificationCenterBtn.addEventListener('click', () => {
        notificationCenter.classList.toggle('active');
        if (notificationCenter.classList.contains('active')) {
            notificationCountSpan.textContent = '0';
            notificationCountSpan.classList.remove('has-notifications');
        }
    });
    if (closeNotificationsBtn) closeNotificationsBtn.addEventListener('click', () => {
        notificationCenter.classList.remove('active');
    });

    // Initial setup calls
    initializeWhiteboard(); // Setup whiteboard canvas initially
    // addWhiteboardPage(true); // Add an initial blank whiteboard page on load, without emitting to server

    // ✅ Move this to the bottom after all elements are defined and listeners are set
    // It's important that DOMContentLoaded finishes before trying to check login status
    // to ensure all elements referenced are available.
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
