// app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const app = document.getElementById('app');
    const authSection = document.getElementById('auth-section');
    const loginContainer = document.getElementById('login-container'); // New container ID
    const registerContainer = document.getElementById('register-container'); // New container ID
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');
    const showRegisterLink = document.getElementById('show-register-link'); // New link ID
    const showLoginLink = document.getElementById('show-login-link'); // New link ID

    const dashboardSection = document.getElementById('dashboard-section');
    const classroomIdDisplay = document.getElementById('classroom-id-display');
    const currentUsernameDisplay = document.getElementById('current-username-display');
    const navDashboard = document.getElementById('nav-dashboard');
    const navClassroom = document.getElementById('nav-classroom');
    const navSettings = document.getElementById('nav-settings');
    const logoutBtn = document.getElementById('logout-btn');

    const newClassroomNameInput = document.getElementById('new-classroom-name');
    const createClassroomBtn = document.getElementById('create-classroom-btn');
    const classroomMessage = document.getElementById('classroom-message');
    const joinClassroomIdInput = document.getElementById('join-classroom-id');
    const joinClassroomBtn = document.getElementById('join-classroom-btn');
    const joinClassroomMessage = document.getElementById('join-classroom-message');
    const classroomList = document.getElementById('classroom-list');

    const classroomSection = document.getElementById('classroom-section');
    const classNameValue = document.getElementById('class-name-value'); // For displaying current classroom name
    const classCodeSpan = document.getElementById('class-code'); // For displaying current classroom ID
    const backToDashboardBtn = document.getElementById('back-to-dashboard');
    const navChat = document.getElementById('nav-chat');
    const navWhiteboard = document.getElementById('nav-whiteboard');
    const navLibrary = document.getElementById('nav-library');
    const navAssessments = document.getElementById('nav-assessments');
    // const navVideoBroadcast = document.getElementById('nav-video-broadcast'); // Removed, as video is merged into whiteboard

    const chatSection = document.getElementById('chat-section');
    const whiteboardArea = document.getElementById('whiteboard-area');
    const librarySection = document.getElementById('library-section');
    const assessmentsSection = document.getElementById('assessments-section');
    // const videoBroadcastSection = document.getElementById('video-broadcast-section'); // Removed

    const settingsSection = document.getElementById('settings-section');
    const updateProfileForm = document.getElementById('update-profile-form');
    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email'); // Disabled email field
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');

    // Share link elements
    const shareWhiteboardBtn = document.getElementById('share-whiteboard-btn');
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');


    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;


    // --- Utility Functions ---
    function displayMessage(element, message, isError) {
        element.textContent = message;
        element.className = isError ? 'error' : 'success';
    }

    function showSection(sectionToShow) {
        [authSection, dashboardSection, classroomSection, settingsSection].forEach(section => {
            if (section) { // Check if element exists
                section.classList.add('hidden');
                section.classList.remove('active');
            }
        });
        if (sectionToShow) {
            sectionToShow.classList.remove('hidden');
            sectionToShow.classList.add('active');
        }
    }

    function showClassroomSubSection(subSectionToShow) {
        [whiteboardArea, chatSection, librarySection, assessmentsSection].forEach(subSection => { // Removed videoBroadcastSection
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

    function updateNavActiveState(activeButton) {
        // Removed navVideoBroadcast from the list
        [navDashboard, navClassroom, navSettings, navChat, navWhiteboard, navLibrary, navAssessments].forEach(btn => {
            if (btn) btn.classList.remove('active-nav');
        });
        if (activeButton) {
            activeButton.classList.add('active-nav');
        }
    }

    async function loadUserClassrooms() {
        if (!currentUser || !currentUser.id) {
            console.warn("No current user to load classrooms for.");
            classroomList.innerHTML = '<li>Please log in to see your classrooms.</li>';
            return;
        }
        try {
            const response = await fetch('/api/classrooms');
            const classrooms = await response.json();
            classroomList.innerHTML = ''; // Clear previous list
            if (classrooms.length === 0) {
                classroomList.innerHTML = '<li>No classrooms found. Create one or join!</li>';
            } else {
                classrooms.forEach(classroom => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${classroom.name} (ID: ${classroom.id})</span>
                        <button data-classroom-id="${classroom.id}" data-classroom-name="${classroom.name}" class="go-to-classroom-btn">Go to Classroom</button>
                    `;
                    classroomList.appendChild(li);
                });

                document.querySelectorAll('.go-to-classroom-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.dataset.classroomId;
                        const name = e.target.dataset.classroomName;
                        enterClassroom(id, name);
                    });
                });
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
            classroomList.innerHTML = '<li>Failed to load classrooms.</li>';
        }
    }

    function enterClassroom(id, name) {
        currentClassroom = { id: id, name: name };
        localStorage.setItem('currentClassroom', JSON.stringify(currentClassroom));
        classroomIdDisplay.textContent = id; // Update dashboard display
        classNameValue.textContent = name; // Update classroom section display
        classCodeSpan.textContent = id; // Update classroom section display

        showSection(classroomSection);
        showClassroomSubSection(whiteboardArea); // Default to whiteboard
        updateNavActiveState(navWhiteboard); // Update active nav button

        // Notify classroom.js to join the Socket.IO room
        window.dispatchEvent(new CustomEvent('classroomEntered', { detail: { id: id, username: currentUser.username, userId: currentUser.id } }));

        // Hide share link display when entering a new classroom
        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';
    }

    function checkLoginStatus() {
        if (currentUser) {
            showSection(dashboardSection);
            currentUsernameDisplay.textContent = currentUser.username;
            classroomIdDisplay.textContent = currentClassroom ? currentClassroom.id : 'N/A';
            loadUserClassrooms();
            updateNavActiveState(navDashboard);
            // Handle direct classroom link access (e.g., /classroom/<id>)
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                const idFromUrl = pathParts[2];
                // You might need to fetch classroom name here if not already known
                // For simplicity, directly enter with ID
                enterClassroom(idFromUrl, `Classroom ${idFromUrl.substring(0, 8)}...`); // Placeholder name
            }
        } else {
            showSection(authSection);
        }
    }

    // --- Authentication Section (Login/Register Form Toggling) ---
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.classList.add('hidden');
            registerContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear messages
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.classList.add('hidden');
            loginContainer.classList.remove('hidden');
            authMessage.textContent = ''; // Clear messages
        });
    }

    // --- Event Listeners ---

    // Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

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
                    displayMessage(authMessage, result.message, false);
                    checkLoginStatus(); // Navigate to dashboard
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during login:', error);
                displayMessage(authMessage, 'An error occurred during login.', true);
            }
        });
    }

    // Register Form Submission
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const role = document.getElementById('register-role').value; // Get the selected role

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, role }) // Include role in the request
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(authMessage, result.message + " Please log in.", false);
                    registerForm.reset(); // Clear form
                    // Optionally switch to login form
                    loginContainer.classList.remove('hidden');
                    registerContainer.classList.add('hidden');
                } else {
                    displayMessage(authMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                displayMessage(authMessage, 'An error occurred during registration.', true);
            }
        });
    }

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentClassroom');
                    currentUser = null;
                    currentClassroom = null;
                    showSection(authSection);
                    // Notify classroom.js to leave the room
                    window.dispatchEvent(new CustomEvent('classroomLeft'));
                } else {
                    alert('Failed to logout.');
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }

    // Create Classroom Button
    if (createClassroomBtn) {
        createClassroomBtn.addEventListener('click', async () => {
            const classroomName = newClassroomNameInput.value;
            if (!classroomName) {
                displayMessage(classroomMessage, 'Please enter a classroom name.', true);
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
                    displayMessage(classroomMessage, result.message, false);
                    newClassroomNameInput.value = ''; // Clear input
                    loadUserClassrooms(); // Reload list
                } else {
                    displayMessage(classroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error creating classroom:', error);
                displayMessage(classroomMessage, 'An error occurred.', true);
            }
        });
    }

    // Join Classroom Button
    if (joinClassroomBtn) {
        joinClassroomBtn.addEventListener('click', async () => {
            const classroomId = joinClassroomIdInput.value;
            if (!classroomId) {
                displayMessage(joinClassroomMessage, 'Please enter a classroom ID.', true);
                return;
            }

            try {
                const response = await fetch('/api/join-classroom', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ classroomId: classroomId })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(joinClassroomMessage, result.message, false);
                    joinClassroomIdInput.value = ''; // Clear input
                    loadUserClassrooms(); // Reload list
                    // If successfully joined, automatically enter the classroom
                    if (result.classroom && result.classroom.id) {
                         enterClassroom(result.classroom.id, result.classroom.name);
                    }
                } else {
                    displayMessage(joinClassroomMessage, result.error, true);
                }
            } catch (error) {
                console.error('Error joining classroom:', error);
                displayMessage(joinClassroomMessage, 'An error occurred.', true);
            }
        });
    }

    // Dashboard Navigation
    if (navDashboard) {
        navDashboard.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadUserClassrooms();
            // Notify classroom.js to leave the room if currently in one
            window.dispatchEvent(new CustomEvent('classroomLeft'));
        });
    }

    // Nav to Classroom (from Dashboard)
    if (navClassroom) {
        navClassroom.addEventListener('click', () => {
            if (currentClassroom && currentClassroom.id) {
                enterClassroom(currentClassroom.id, currentClassroom.name);
            } else {
                alert('Please create or join a classroom first!');
            }
        });
    }

    // Nav to Settings
    if (navSettings) {
        navSettings.addEventListener('click', () => {
            showSection(settingsSection);
            updateNavActiveState(navSettings);
            if (currentUser) {
                settingsUsernameInput.value = currentUser.username;
                settingsEmailInput.value = currentUser.email;
            }
            // Notify classroom.js to leave the room if currently in one
            window.dispatchEvent(new CustomEvent('classroomLeft'));
        });
    }


    // Back to Dashboard from Classroom
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadUserClassrooms();
            // Notify classroom.js to leave the room
            window.dispatchEvent(new CustomEvent('classroomLeft'));
        });
    }

    // Back to Dashboard from Settings
    if (backToDashboardFromSettingsBtn) {
        backToDashboardFromSettingsBtn.addEventListener('click', () => {
            showSection(dashboardSection);
            updateNavActiveState(navDashboard);
            loadUserClassrooms();
        });
    }


    // Classroom Sub-section Navigation
    if (navChat) {
        navChat.addEventListener('click', () => { showClassroomSubSection(chatSection); updateNavActiveState(navChat); });
    }
    if (navWhiteboard) {
        navWhiteboard.addEventListener('click', () => { showClassroomSubSection(whiteboardArea); updateNavActiveState(navWhiteboard); });
    }
    if (navLibrary) {
        navLibrary.addEventListener('click', () => { showClassroomSubSection(librarySection); updateNavActiveState(navLibrary); });
    }
    if (navAssessments) {
        navAssessments.addEventListener('click', () => { showClassroomSubSection(assessmentsSection); updateNavActiveState(navAssessments); });
    }


    // Update Profile
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = settingsUsernameInput.value;

            if (!username) {
                alert('Username cannot be empty.');
                return;
            }

            try {
                const response = await fetch('/api/update-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username }) // userId is now fetched from session on backend
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    currentUser.username = username; // Update local user object
                    localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Update local storage
                    currentUsernameDisplay.textContent = currentUser.username; // Update dashboard display
                } else {
                    alert('Error updating profile: ' + (result.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('An error occurred during profile update.');
            }
        });
    }

    // --- Share Whiteboard/Classroom Link ---
    if (shareWhiteboardBtn) {
        shareWhiteboardBtn.addEventListener('click', async () => {
            // Get classroom ID from the display span or currentClassroom object
            const classroomId = currentClassroom ? currentClassroom.id : classroomIdDisplay.textContent;

            if (classroomId && classroomId !== 'N/A') {
                try {
                    const response = await fetch(`/api/generate-share-link/${classroomId}`);
                    const data = await response.json();
                    if (response.ok) {
                        shareLinkInput.value = data.share_link;
                        shareLinkDisplay.classList.remove('hidden'); // Show the link display
                    } else {
                        alert('Error generating share link: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Error generating share link:', error);
                    alert('An error occurred while generating the share link.');
                }
            } else {
                alert('Please create or join a classroom first to get a shareable link.');
            }
        });
    }

    if (copyShareLinkBtn) {
        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select(); // Select the text in the input field
            shareLinkInput.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy'); // Copy the text
            alert('Link copied to clipboard!');
        });
    }

    // --- Initial Load ---
    checkLoginStatus(); // Initialize app state based on login status
});
