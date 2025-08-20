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
    const classroomTitle = document.getElementById('classroom-title');
    const classroomHeader = document.getElementById('classroom-header');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    const copyClassroomIdBtn = document.getElementById('copy-classroom-id-btn');
    const classIdSpan = document.getElementById('class-id');
    const classIdDisplay = document.getElementById('classroom-id-display');

    const adminSection = document.getElementById('admin-section');
    const studentSection = document.getElementById('student-section');
    const profileSection = document.getElementById('profile-section');
    const settingsSection = document.getElementById('settings-section');
    const fileUploadForm = document.getElementById('file-upload-form');
    const fileUploadInput = document.getElementById('file-upload-input');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const libraryFileList = document.getElementById('library-file-list');
    const deleteLibraryFileBtn = document.getElementById('delete-library-file-btn');

    const videoGrid = document.getElementById('video-grid');
    const localVideo = document.getElementById('local-video');
    const localVideoContainer = document.getElementById('local-video-container');

    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessagesContainer = document.getElementById('chat-messages-container');

    const whiteboardContainer = document.getElementById('whiteboard-container');
    const canvas = document.getElementById('whiteboard-canvas');
    const ctx = canvas.getContext('2d');
    const clearCanvasBtn = document.getElementById('clear-canvas-btn');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');
    const pageNumberDisplay = document.getElementById('page-number-display');

    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsContainer = document.getElementById('questions-container');
    const createAssessmentBtn = document.getElementById('create-assessment-btn');
    const assessmentListSection = document.getElementById('assessment-list-section');
    const assessmentsList = document.getElementById('assessments-list');
    const assessmentDetailsSection = document.getElementById('assessment-details-section');
    const assessmentTitleDisplay = document.getElementById('assessment-title');
    const assessmentDescriptionDisplay = document.getElementById('assessment-description');
    const assessmentScheduledAtDisplay = document.getElementById('assessment-scheduled-at');
    const assessmentDurationDisplay = document.getElementById('assessment-duration');
    const assessmentQuestionsContainer = document.getElementById('assessment-questions-container');
    const assessmentTakeForm = document.getElementById('assessment-take-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');

    const viewSubmissionsContainer = document.getElementById('view-submissions-container');
    const submissionsAssessmentTitle = document.getElementById('submissions-assessment-title');
    const submissionsList = document.getElementById('submissions-list');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');

    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email');
    const updateProfileForm = document.getElementById('update-profile-form');
    const notificationContainer = document.getElementById('notification-container');


    // --- State Variables ---
    let currentClassroomId = null;
    let currentUserId = null;
    let currentUsername = null;
    let currentUserRole = null;
    let currentWhiteboardPage = 1;

    // We'll store peer connections here. Key is peer_id, value is RTCPeerConnection object
    let peerConnections = {}; 
    const socket = io();

    // --- Helper Functions ---

    /** Displays a message in a specific element. */
    const displayMessage = (element, message, isError) => {
        element.textContent = message;
        element.style.color = isError ? "red" : "green";
        element.style.display = "block";
        setTimeout(() => {
            element.style.display = "none";
        }, 5000);
    };

    /** Shows a specific section and hides all others. */
    const showSection = (sectionId) => {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.remove('hidden');
            activeSection.classList.add('active');
            window.scrollTo(0, 0); // Scroll to top
        }
    };
    
    // Function to generate a random ID
    const generateId = () => Math.random().toString(36).substring(2, 9);
    
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <p>${message}</p>
            <span class="close-btn">&times;</span>
        `;
        notificationContainer.appendChild(notification);
        notification.querySelector('.close-btn').addEventListener('click', () => {
            notification.remove();
        });
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 8000);
    };
    
    // --- SocketIO Event Handlers ---
    
    socket.on('connect', () => {
        console.log('Connected to server via SocketIO. SID:', socket.id);
        // We'll join a classroom room after login
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server.');
        // Cleanup peer connections
        for (const peerId in peerConnections) {
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                removeVideoElement(peerId);
            }
        }
    });

    socket.on('user_joined', (data) => {
        const { userId, username, role } = data;
        console.log(`${username} joined the classroom.`);
        showNotification(`${username} joined the classroom.`);
        // initiate call with new peer
        initiateCall(data.sid);
    });

    socket.on('user_left', (data) => {
        const { userId, username } = data;
        console.log(`${username} left the classroom.`);
        showNotification(`${username} left the classroom.`);
        // Clean up video element and peer connection for the user who left
        if (peerConnections[userId]) {
            peerConnections[userId].close();
            delete peerConnections[userId];
        }
        removeVideoElement(userId);
    });

    socket.on('receive_chat_message', (data) => {
        const { username, text, timestamp, role } = data;
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message-item');
        if (role === 'admin') {
            messageElement.classList.add('admin-message');
        }
        messageElement.innerHTML = `
            <span class="message-username">${username}</span>
            <span class="message-text">${text}</span>
            <span class="message-timestamp">${new Date(timestamp).toLocaleTimeString()}</span>
        `;
        chatMessagesContainer.appendChild(messageElement);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });

    socket.on('whiteboard_draw_receive', (data) => {
        const { pageNumber, drawingData } = data;
        // Only draw if we are on the correct page
        if (pageNumber === currentWhiteboardPage) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = drawingData;
        }
    });

    socket.on('load_whiteboard_drawings', (data) => {
        const { pageNumber, drawings } = data;
        if (pageNumber === currentWhiteboardPage) {
            // Clear canvas first
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Then load all drawings for this page
            drawings.forEach(drawingData => {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                };
                img.src = drawingData;
            });
        }
    });

    socket.on('admin_action_update', (data) => {
        const { message } = data;
        showNotification(message, 'info');
    });

    socket.on('assessment_started', (data) => {
        const { title } = data;
        showNotification(`A new assessment '${title}' has started!`, 'success');
    });


    // --- WebRTC Signaling Handlers ---

    socket.on('webrtc_offer', async (data) => {
        const { offer, sender_id } = data;
        if (!peerConnections[sender_id]) {
            await createPeerConnection(sender_id);
        }
        await peerConnections[sender_id].setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnections[sender_id].createAnswer();
        await peerConnections[sender_id].setLocalDescription(answer);
        socket.emit('webrtc_answer', {
            recipient_id: sender_id,
            answer: peerConnections[sender_id].localDescription,
            classroomId: currentClassroomId
        });
        console.log(`WEBRTC: Answer sent to ${sender_id}`);
    });

    socket.on('webrtc_answer', async (data) => {
        const { answer, sender_id } = data;
        await peerConnections[sender_id].setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`WEBRTC: Answer received from ${sender_id}`);
    });

    socket.on('webrtc_ice_candidate', async (data) => {
        const { candidate, sender_id } = data;
        try {
            if (peerConnections[sender_id]) {
                await peerConnections[sender_id].addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`WEBRTC: ICE Candidate added for ${sender_id}`);
            }
        } catch (e) {
            console.error('Error adding received ICE candidate', e);
        }
    });

    socket.on('webrtc_peer_disconnected', (data) => {
        const { peer_id } = data;
        console.log(`WEBRTC: Peer ${peer_id} disconnected.`);
        if (peerConnections[peer_id]) {
            peerConnections[peer_id].close();
            delete peerConnections[peer_id];
        }
        removeVideoElement(peer_id);
    });

    // --- WebRTC Functions ---

    // A map to store local stream per peer
    let localStream = null;
    let localStreamActive = false;
    let audioTrack = null;
    let videoTrack = null;

    const startLocalStream = async () => {
        if (localStreamActive) return;

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
            localStreamActive = true;
            console.log('Local stream started.');

            // Get the tracks for later use
            audioTrack = localStream.getAudioTracks()[0];
            videoTrack = localStream.getVideoTracks()[0];

        } catch (err) {
            console.error('Error starting local stream:', err);
            showNotification('Could not access camera/microphone. Please check permissions.', 'danger');
        }
    };

    const stopLocalStream = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
            localStream = null;
            localStreamActive = false;
            console.log('Local stream stopped.');
        }
        // Signal to all peers that we've disconnected
        socket.emit('webrtc_peer_disconnected', {
            classroomId: currentClassroomId,
            peer_id: socket.id
        });
    };

    // Pause/Play functions
    const toggleLocalVideo = (shouldPlay) => {
        if (videoTrack) {
            videoTrack.enabled = shouldPlay;
            console.log(`Local video ${shouldPlay ? 'resumed' : 'paused'}.`);
        }
    };

    const toggleLocalAudio = (shouldPlay) => {
        if (audioTrack) {
            audioTrack.enabled = shouldPlay;
            console.log(`Local audio ${shouldPlay ? 'resumed' : 'paused'}.`);
        }
    };


    const createPeerConnection = async (peerId) => {
        console.log(`Creating peer connection for: ${peerId}`);
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        });

        // Add local tracks to the connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle remote stream when it's received
        pc.ontrack = (event) => {
            console.log(`Track received from peer ${peerId}`);
            const remoteStream = event.streams[0];
            const existingVideo = document.getElementById(`video-${peerId}`);
            if (existingVideo) {
                existingVideo.srcObject = remoteStream;
            } else {
                addVideoElement(peerId, remoteStream);
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log(`Sending ICE candidate to ${peerId}`);
                socket.emit('webrtc_ice_candidate', {
                    recipient_id: peerId,
                    candidate: event.candidate,
                    classroomId: currentClassroomId
                });
            }
        };

        // Handle connection state changes for logging
        pc.onconnectionstatechange = () => {
            console.log(`Peer ${peerId} connection state: ${pc.connectionState}`);
            if (pc.connectionstate === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                removeVideoElement(peerId);
                delete peerConnections[peerId];
                console.log(`Peer ${peerId} connection closed. Cleaned up.`);
            }
        };

        peerConnections[peerId] = pc;
        return pc;
    };

    const initiateCall = async (peerId) => {
        if (!localStream) {
            console.log("Local stream not started. Cannot initiate call.");
            return;
        }
        if (!peerConnections[peerId]) {
            await createPeerConnection(peerId);
        }

        const pc = peerConnections[peerId];
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_offer', {
            recipient_id: peerId,
            offer: pc.localDescription,
            classroomId: currentClassroomId
        });
        console.log(`WEBRTC: Offer sent to ${peerId}`);
    };

    const addVideoElement = (id, stream) => {
        const videoContainer = document.createElement('div');
        videoContainer.classList.add('video-container');
        videoContainer.id = `container-${id}`;
        
        const video = document.createElement('video');
        video.id = `video-${id}`;
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = (id === 'local'); // Mute local video
        
        const usernameTag = document.createElement('div');
        usernameTag.classList.add('username-tag');
        usernameTag.textContent = id === 'local' ? currentUsername : 'Peer';
        
        videoContainer.appendChild(video);
        videoContainer.appendChild(usernameTag);
        videoGrid.appendChild(videoContainer);
        
        initializeZoomableVideo(video, videoContainer);
    };

    const removeVideoElement = (id) => {
        const videoContainer = document.getElementById(`container-${id}`);
        if (videoContainer) {
            videoContainer.remove();
        }
    };

    // --- Authentication and UI State Management ---

    const checkLoginStatus = async () => {
        try {
            const res = await fetch("/api/@me");
            if (res.ok) {
                const user = await res.json();
                handleLoginSuccess(user);
            } else {
                handleLogout();
            }
        } catch (err) {
            console.error("Failed to check login status:", err);
            handleLogout();
        }
    };

    const handleLoginSuccess = (user) => {
        currentUserId = user.id;
        currentUsername = user.username;
        currentUserRole = user.role;
        currentUsernameDisplay.textContent = `Welcome, ${user.username}!`;
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        
        // Show/hide admin-only elements
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.style.display = currentUserRole === 'admin' ? '' : 'none';
        });

        loadClassrooms(); // Load classrooms for the user
    };

    const handleLogout = () => {
        currentUserId = null;
        currentUsername = null;
        currentUserRole = null;
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        classroomSection.classList.add('hidden');
        showSection('auth-section'); // Go back to auth screen
        // Clean up video stream if active
        stopLocalStream();
    };

    // --- Event Listeners ---
    
    // Auth screen toggling
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        authMessage.style.display = 'none';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.remove('hidden');
        registerContainer.classList.add('hidden');
        authMessage.style.display = 'none';
    });

    // ----------------------------------------
    // NEW BLOCK: Registration Form Submission
    // ----------------------------------------
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                displayMessage(authMessage, "Registered successfully! You can now log in.", false);
                // Optionally, clear form and show login form
                registerForm.reset();
                loginContainer.classList.remove('hidden');
                registerContainer.classList.add('hidden');
            } else {
                displayMessage(authMessage, data.error || "Registration failed", true);
            }
        } catch (err) {
            console.error("Registration error:", err);
            displayMessage(authMessage, "Server error", true);
        }
    });

    // ----------------------------------------
    // END NEW BLOCK
    // ----------------------------------------

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                handleLoginSuccess(data.user);
            } else {
                displayMessage(authMessage, data.error || "Login failed", true);
            }
        } catch (err) {
            console.error("Login error:", err);
            displayMessage(authMessage, "Server error", true);
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
            handleLogout();
        } catch (err) {
            console.error("Logout error:", err);
            // Even on error, assume logged out for UI purposes
            handleLogout();
        }
    });

    // --- Dashboard and Classroom Management ---

    const loadClassrooms = async () => {
        if (!currentUserId) return;
        try {
            const res = await fetch("/api/classrooms");
            if (res.ok) {
                const classrooms = await res.json();
                classroomList.innerHTML = '';
                if (classrooms.length > 0) {
                    classrooms.forEach(classroom => {
                        const li = document.createElement('li');
                        li.className = 'classroom-item';
                        li.innerHTML = `
                            <span>${classroom.name}</span>
                            <button class="join-btn" data-id="${classroom.id}">Join</button>
                            ${currentUserRole === 'admin' ? `<button class="delete-btn" data-id="${classroom.id}">Delete</button>` : ''}
                        `;
                        classroomList.appendChild(li);
                    });
                } else {
                    classroomList.innerHTML = '<p>No classrooms created yet. Create one as an admin!</p>';
                }
            } else {
                console.error("Failed to fetch classrooms.");
            }
        } catch (err) {
            console.error("Error fetching classrooms:", err);
        }
    };

    classroomList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('join-btn')) {
            const classroomId = e.target.dataset.id;
            joinClassroom(classroomId);
        } else if (e.target.classList.contains('delete-btn')) {
            const classroomId = e.target.dataset.id;
            if (confirm("Are you sure you want to delete this classroom and all its data?")) {
                await deleteClassroom(classroomId);
            }
        }
    });

    createClassroomBtn.addEventListener('click', async () => {
        const classroomName = newClassroomNameInput.value.trim();
        if (!classroomName) {
            alert("Please enter a classroom name.");
            return;
        }

        try {
            const res = await fetch("/api/classrooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classroomName })
            });
            if (res.ok) {
                showNotification("Classroom created successfully!", "success");
                newClassroomNameInput.value = '';
                loadClassrooms();
            } else {
                const data = await res.json();
                showNotification(data.error || "Failed to create classroom.", "danger");
            }
        } catch (err) {
            console.error("Error creating classroom:", err);
            showNotification("Server error while creating classroom.", "danger");
        }
    });

    const deleteClassroom = async (classroomId) => {
        try {
            const res = await fetch(`/api/classrooms/${classroomId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showNotification("Classroom deleted successfully.", "success");
                loadClassrooms();
            } else {
                const data = await res.json();
                showNotification(data.error || "Failed to delete classroom.", "danger");
            }
        } catch (err) {
            console.error("Error deleting classroom:", err);
            showNotification("Server error while deleting classroom.", "danger");
        }
    };
    
    // --- File Library Functions ---
    const loadLibraryFiles = async (classroomId) => {
        try {
            const res = await fetch(`/api/library-files/${classroomId}`);
            if (res.ok) {
                const files = await res.json();
                libraryFileList.innerHTML = '';
                if (files.length > 0) {
                    files.forEach(file => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <a href="${file.url}" target="_blank">${file.original_filename || file.filename}</a>
                            ${currentUserRole === 'admin' ? `<button class="delete-file-btn" data-id="${file.id}">Delete</button>` : ''}
                        `;
                        libraryFileList.appendChild(li);
                    });
                } else {
                    libraryFileList.innerHTML = '<li>No files in the library.</li>';
                }
            } else {
                console.error("Failed to fetch library files.");
            }
        } catch (err) {
            console.error("Error fetching library files:", err);
        }
    };

    fileUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        const files = fileUploadInput.files;

        if (files.length === 0) {
            alert("Please select files to upload.");
            return;
        }
        
        formData.append('classroomId', currentClassroomId);
        for (const file of files) {
            formData.append('files', file);
        }

        try {
            const res = await fetch("/api/upload-library-files", {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                showNotification("Files uploaded successfully!", "success");
                fileUploadInput.value = ''; // Clear the input
                loadLibraryFiles(currentClassroomId); // Reload file list
            } else {
                const data = await res.json();
                showNotification(data.error || "File upload failed.", "danger");
            }
        } catch (err) {
            console.error("Error uploading files:", err);
            showNotification("Server error during file upload.", "danger");
        }
    });

    libraryFileList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-file-btn')) {
            const fileId = e.target.dataset.id;
            if (confirm("Are you sure you want to delete this file?")) {
                try {
                    const res = await fetch(`/api/library-files/${fileId}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) {
                        showNotification("File deleted successfully.", "success");
                        loadLibraryFiles(currentClassroomId); // Reload file list
                    } else {
                        const data = await res.json();
                        showNotification(data.error || "Failed to delete file.", "danger");
                    }
                } catch (err) {
                    console.error("Error deleting file:", err);
                    showNotification("Server error while deleting file.", "danger");
                }
            }
        }
    });

    // --- Assessment Functions ---
    const loadAssessments = async () => {
        try {
            const res = await fetch(`/api/assessments/${currentClassroomId}`);
            if (res.ok) {
                const assessments = await res.json();
                assessmentsList.innerHTML = '';
                if (assessments.length > 0) {
                    assessments.forEach(assessment => {
                        const li = document.createElement('li');
                        li.className = 'assessment-item';
                        const isStudent = currentUserRole === 'user';
                        const scheduledTime = new Date(assessment.scheduled_at);
                        const currentTime = new Date();
                        const isActive = currentTime >= scheduledTime && currentTime < new Date(scheduledTime.getTime() + assessment.duration_minutes * 60000);
                        const statusText = isActive ? 'Active' : (currentTime < scheduledTime ? 'Upcoming' : 'Expired');
                        const statusClass = isActive ? 'status-active' : (currentTime < scheduledTime ? 'status-upcoming' : 'status-expired');
                        
                        // Show "Take Assessment" button only if user is a student and assessment is active
                        const takeButton = isStudent && isActive ?
                            `<button class="take-assessment-btn btn-success" data-id="${assessment.id}">Take Assessment</button>` : '';

                        // Show "View Submissions" button only if user is an admin
                        const submissionsButton = currentUserRole === 'admin' ? 
                            `<button class="view-submissions-btn btn-secondary" data-id="${assessment.id}">View Submissions</button>` : '';

                        li.innerHTML = `
                            <h4>${assessment.title}</h4>
                            <p>${assessment.description || 'No description'}</p>
                            <div class="assessment-meta">
                                <span><i class="fa-solid fa-clock"></i> ${new Date(assessment.scheduled_at).toLocaleString()}</span>
                                <span><i class="fa-solid fa-hourglass-half"></i> ${assessment.duration_minutes} mins</span>
                                <span class="assessment-status ${statusClass}">${statusText}</span>
                            </div>
                            <div class="assessment-actions">
                                ${takeButton}
                                ${submissionsButton}
                            </div>
                        `;
                        assessmentsList.appendChild(li);
                    });
                } else {
                    assessmentsList.innerHTML = '<p>No assessments have been created for this classroom.</p>';
                }
            } else {
                console.error("Failed to fetch assessments.");
            }
        } catch (err) {
            console.error("Error fetching assessments:", err);
        }
    };
    
    // Admin section: Add new question fields dynamically
    addQuestionBtn.addEventListener('click', () => {
        addQuestionField();
    });

    function addQuestionField() {
        const questionCount = questionsContainer.querySelectorAll('.assessment-question-block').length + 1;
        const questionBlock = document.createElement('div');
        questionBlock.className = 'assessment-question-block';
        questionBlock.innerHTML = `
            <h5>Question ${questionCount}</h5>
            <label for="q${questionCount}-text">Question Text:</label>
            <input type="text" id="q${questionCount}-text" name="question_text" required>
            <label for="q${questionCount}-type">Question Type:</label>
            <select id="q${questionCount}-type" name="question_type">
                <option value="mcq">Multiple Choice</option>
                <option value="short_answer">Short Answer</option>
            </select>
            <div class="mcq-options" data-q-type="mcq">
                <label>Options (comma-separated):</label>
                <input type="text" name="options" placeholder="Option A, Option B, Option C" required>
                <label>Correct Answer:</label>
                <input type="text" name="correct_answer" placeholder="e.g., Option B" required>
            </div>
        `;
        questionsContainer.appendChild(questionBlock);
    }
    
    // Admin section: Submit new assessment
    assessmentCreationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('assessment-title-input').value;
        const description = document.getElementById('assessment-description-input').value;
        const scheduled_at = document.getElementById('assessment-scheduled-at-input').value;
        const duration_minutes = document.getElementById('assessment-duration-input').value;

        const questions = [];
        const questionBlocks = questionsContainer.querySelectorAll('.assessment-question-block');
        questionBlocks.forEach(block => {
            const question_type = block.querySelector('select[name="question_type"]').value;
            const question_text = block.querySelector('input[name="question_text"]').value;
            const question_data = {
                question_text,
                question_type
            };

            if (question_type === 'mcq') {
                const options = block.querySelector('input[name="options"]').value.split(',').map(s => s.trim());
                const correct_answer = block.querySelector('input[name="correct_answer"]').value;
                question_data.options = options;
                question_data.correct_answer = correct_answer;
            }
            questions.push(question_data);
        });

        if (!title || !scheduled_at || !duration_minutes || questions.length === 0) {
            showNotification('Please fill in all assessment details and add at least one question.', 'danger');
            return;
        }
        
        try {
            const res = await fetch("/api/assessments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    classroomId: currentClassroomId,
                    title,
                    description,
                    scheduled_at,
                    duration_minutes: parseInt(duration_minutes),
                    questions
                })
            });
            if (res.ok) {
                showNotification("Assessment created successfully!", "success");
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = '';
                loadAssessments(); // Refresh the list
                showSection('assessment-list-section');
            } else {
                const data = await res.json();
                showNotification(data.error || "Failed to create assessment.", "danger");
            }
        } catch (err) {
            console.error("Error creating assessment:", err);
            showNotification("Server error while creating assessment.", "danger");
        }
    });

    // Student section: Handle taking an assessment
    assessmentsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('take-assessment-btn')) {
            const assessmentId = e.target.dataset.id;
            try {
                const res = await fetch(`/api/assessments/${assessmentId}`);
                if (res.ok) {
                    const assessment = await res.json();
                    
                    // Populate assessment details
                    assessmentTitleDisplay.textContent = assessment.title;
                    assessmentDescriptionDisplay.textContent = assessment.description;
                    assessmentScheduledAtDisplay.textContent = new Date(assessment.scheduled_at).toLocaleString();
                    assessmentDurationDisplay.textContent = `${assessment.duration_minutes} minutes`;
                    
                    // Clear previous questions
                    assessmentQuestionsContainer.innerHTML = '';
                    
                    // Populate questions and form fields
                    assessment.questions.forEach((q, index) => {
                        const questionBlock = document.createElement('div');
                        questionBlock.className = 'take-assessment-question';
                        questionBlock.dataset.questionId = q.id;
                        
                        let questionHtml = `<p><strong>${index + 1}. ${q.question_text}</strong></p>`;
                        
                        if (q.question_type === 'mcq') {
                            questionHtml += '<div class="mcq-options">';
                            q.options.forEach(option => {
                                // Sanitized IDs for radio buttons
                                const safeOptionId = `${q.id}-${option.replace(/[^a-zA-Z0-9]/g, '')}`;
                                questionHtml += `
                                    <div>
                                        <input type="radio" id="${safeOptionId}" name="q-${q.id}" value="${option}" required>
                                        <label for="${safeOptionId}">${option}</label>
                                    </div>
                                `;
                            });
                            questionHtml += '</div>';
                        } else if (q.question_type === 'short_answer') {
                            questionHtml += `<textarea name="q-${q.id}" placeholder="Your answer" required></textarea>`;
                        }
                        
                        questionBlock.innerHTML = questionHtml;
                        assessmentQuestionsContainer.appendChild(questionBlock);
                    });
                    
                    // Show the assessment details section
                    showSection('assessment-details-section');

                } else {
                    const data = await res.json();
                    showNotification(data.error || "Failed to load assessment details.", "danger");
                }
            } catch (err) {
                console.error("Error loading assessment details:", err);
                showNotification("Server error loading assessment details.", "danger");
            }
        } else if (e.target.classList.contains('view-submissions-btn')) {
            const assessmentId = e.target.dataset.id;
            viewSubmissions(assessmentId);
        }
    });
    
    submitAnswersBtn.addEventListener('click', async () => {
        const assessmentId = document.querySelector('#assessment-details-section .btn-success').dataset.id;
        const answers = [];
        
        const questionBlocks = document.querySelectorAll('.take-assessment-question');
        questionBlocks.forEach(block => {
            const questionId = block.dataset.questionId;
            let user_answer = null;
            
            const radio = block.querySelector(`input[name="q-${questionId}"]:checked`);
            if (radio) {
                user_answer = radio.value;
            } else {
                const textarea = block.querySelector(`textarea[name="q-${questionId}"]`);
                if (textarea) {
                    user_answer = textarea.value;
                }
            }
            
            answers.push({
                question_id: questionId,
                user_answer: user_answer
            });
        });
        
        try {
            const res = await fetch(`/api/assessments/${assessmentId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessmentId: assessmentId,
                    classroomId: currentClassroomId,
                    answers: answers
                })
            });
            const data = await res.json();
            if (res.ok) {
                displayMessage(assessmentSubmissionMessage, `Submission successful! Your score is ${data.score}/${data.total_questions}.`, false);
                // Hide submit button to prevent double-submission
                submitAnswersBtn.classList.add('hidden'); 
            } else {
                displayMessage(assessmentSubmissionMessage, data.error || 'Submission failed.', true);
            }
        } catch (err) {
            console.error("Submission error:", err);
            displayMessage(assessmentSubmissionMessage, "Server error during submission.", true);
        }
    });

    backToAssessmentListBtn.addEventListener('click', () => {
        showSection('assessment-list-section');
        // Reset state
        submitAnswersBtn.classList.remove('hidden');
    });

    const viewSubmissions = async (assessmentId) => {
        try {
            const res = await fetch(`/api/assessments/${assessmentId}/submissions`);
            if (res.ok) {
                const submissions = await res.json();
                submissionsList.innerHTML = '';
                if (submissions.length > 0) {
                    const assessment = await (await fetch(`/api/assessments/${assessmentId}`)).json();
                    submissionsAssessmentTitle.textContent = `Submissions for: ${assessment.title}`;
                    
                    submissions.forEach(submission => {
                        const submissionItem = document.createElement('div');
                        submissionItem.className = 'submission-item';
                        const scoreText = submission.score !== undefined ? `${submission.score}/${submission.total_questions}` : 'Not graded';
                        
                        submissionItem.innerHTML = `
                            <h4>Student: ${submission.student_username}</h4>
                            <p>Submitted: ${new Date(submission.submitted_at).toLocaleString()}</p>
                            <p>Score: ${scoreText}</p>
                            <button class="view-submission-details-btn btn-info" data-id="${submission.id}">View Details</button>
                        `;
                        submissionsList.appendChild(submissionItem);
                    });
                    showSection('view-submissions-container');
                } else {
                    submissionsList.innerHTML = '<p>No submissions yet.</p>';
                    submissionsAssessmentTitle.textContent = 'No Submissions';
                    showSection('view-submissions-container');
                }
            } else {
                const data = await res.json();
                showNotification(data.error || "Failed to fetch submissions.", "danger");
            }
        } catch (err) {
            console.error("Error fetching submissions:", err);
            showNotification("Server error fetching submissions.", "danger");
        }
    };

    submissionsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('view-submission-details-btn')) {
            const submissionId = e.target.dataset.id;
            try {
                const res = await fetch(`/api/submissions/${submissionId}`);
                if (res.ok) {
                    const submission = await res.json();
                    // Display details in a modal or a new section
                    alert(`Submission by: ${submission.student_username}\nScore: ${submission.score}/${submission.total_questions}\n\nAnswers:\n${submission.answers.map(a => `${a.question_text}: ${a.user_answer}`).join('\n')}`);
                } else {
                    const data = await res.json();
                    showNotification(data.error || "Failed to fetch submission details.", "danger");
                }
            } catch (err) {
                console.error("Error fetching submission details:", err);
                showNotification("Server error fetching submission details.", "danger");
            }
        }
    });

    backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
        showSection('assessment-list-section');
    });

    // --- Navigation Handlers ---

    const handleNavigation = (e) => {
        if (e.target.id === 'nav-dashboard') {
            showSection('dashboard-section');
            if (currentClassroomId) {
                // Leave the classroom room in case the user was in one
                socket.emit('leave_classroom', { classroomId: currentClassroomId });
                currentClassroomId = null;
                // Cleanup video elements on leaving classroom
                document.querySelectorAll('#video-grid .video-container').forEach(el => el.remove());
                stopLocalStream();
            }
        } else if (e.target.id === 'nav-classrooms') { // A potential nav for classrooms
            showSection('dashboard-section');
        } else if (e.target.id === 'nav-settings') {
            showSection('settings-section');
            loadUserSettings();
        }
    };

    navDashboard.addEventListener('click', handleNavigation);
    navSettings.addEventListener('click', handleNavigation);

    // This listener handles the "Back to Dashboard" button in the classroom view
    backToDashboardBtn.addEventListener('click', () => {
        if (currentClassroomId) {
            socket.emit('leave_classroom', { classroomId: currentClassroomId });
            currentClassroomId = null;
            // Cleanup video elements on leaving classroom
            document.querySelectorAll('#video-grid .video-container').forEach(el => el.remove());
            stopLocalStream();
        }
        showSection('dashboard-section');
    });

    // --- Classroom Join Function ---
    const joinClassroom = async (classroomId) => {
        currentClassroomId = classroomId;
        showSection('classroom-section');
        classroomHeader.style.display = 'flex';
        
        try {
            const res = await fetch(`/api/classrooms/${classroomId}`);
            if (res.ok) {
                const classroom = await res.json();
                classroomTitle.textContent = classroom.name;
                classIdSpan.textContent = classroom.id;
            } else {
                console.error("Failed to fetch classroom details.");
                classroomTitle.textContent = "Unknown Classroom";
                classIdSpan.textContent = classroomId;
            }
        } catch (err) {
            console.error("Error fetching classroom details:", err);
            classroomTitle.textContent = "Unknown Classroom";
            classIdSpan.textContent = classroomId;
        }

        // Join the Socket.IO room for this classroom
        socket.emit('join_classroom', { classroomId: currentClassroomId, userId: currentUserId });
        
        // Start live streaming
        await startLocalStream();
        addVideoElement('local', localStream);

        // Load chat messages and library files
        loadChatMessages(currentClassroomId);
        loadLibraryFiles(currentClassroomId);
        loadAssessments();
    };

    // --- Live Stream Controls (Buttons) ---
    const toggleVideoBtn = document.getElementById('toggle-video-btn');
    const toggleAudioBtn = document.getElementById('toggle-audio-btn');

    if (toggleVideoBtn) {
        toggleVideoBtn.addEventListener('click', () => {
            const isVideoOn = toggleVideoBtn.classList.contains('active');
            toggleVideoBtn.classList.toggle('active');
            if (isVideoOn) {
                toggleVideoBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
                toggleLocalVideo(false);
            } else {
                toggleVideoBtn.innerHTML = '<i class="fas fa-video"></i>';
                toggleLocalVideo(true);
            }
        });
    }

    if (toggleAudioBtn) {
        toggleAudioBtn.addEventListener('click', () => {
            const isAudioOn = toggleAudioBtn.classList.contains('active');
            toggleAudioBtn.classList.toggle('active');
            if (isAudioOn) {
                toggleAudioBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                toggleLocalAudio(false);
            } else {
                toggleAudioBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                toggleLocalAudio(true);
            }
        });
    }

    // --- Chat Functions ---
    const loadChatMessages = async (classroomId) => {
        try {
            const res = await fetch(`/api/chat-messages/${classroomId}`);
            if (res.ok) {
                const messages = await res.json();
                chatMessagesContainer.innerHTML = '';
                messages.forEach(msg => {
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('chat-message-item');
                    if (msg.role === 'admin') {
                        messageElement.classList.add('admin-message');
                    }
                    messageElement.innerHTML = `
                        <span class="message-username">${msg.username}</span>
                        <span class="message-text">${msg.text}</span>
                        <span class="message-timestamp">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                    `;
                    chatMessagesContainer.appendChild(messageElement);
                });
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            }
        } catch (err) {
            console.error("Failed to load chat messages:", err);
        }
    };
    
    sendMessageBtn.addEventListener('click', () => {
        const message = chatInput.value;
        if (message.trim()) {
            socket.emit('send_chat_message', {
                classroomId: currentClassroomId,
                message: message
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

    // --- Whiteboard Functions ---
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    function draw(e) {
        if (!isDrawing) return;
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        
        // Save the drawing as a data URL and send to the server
        const drawingData = canvas.toDataURL();
        socket.emit('whiteboard_draw', {
            classroomId: currentClassroomId,
            pageNumber: currentWhiteboardPage,
            drawingData: drawingData
        });
        
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }
    
    clearCanvasBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Maybe emit a clear event to other clients
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentWhiteboardPage > 1) {
            currentWhiteboardPage--;
            pageNumberDisplay.textContent = currentWhiteboardPage;
            // Fetch and load drawings for the new page
            socket.emit('get_whiteboard_drawings', { classroomId: currentClassroomId, pageNumber: currentWhiteboardPage });
        }
    });

    nextPageBtn.addEventListener('click', () => {
        currentWhiteboardPage++;
        pageNumberDisplay.textContent = currentWhiteboardPage;
        // Fetch and load drawings for the new page
        socket.emit('get_whiteboard_drawings', { classroomId: currentClassroomId, pageNumber: currentWhiteboardPage });
    });

    // --- Settings / Profile Update ---
    
    const loadUserSettings = async () => {
        try {
            const res = await fetch('/api/@me');
            if (res.ok) {
                const user = await res.json();
                settingsUsernameInput.value = user.username;
                settingsEmailInput.value = user.email;
            } else {
                console.error("Failed to load user settings.");
            }
        } catch (err) {
            console.error("Error loading user settings:", err);
        }
    };
    
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newUsername = settingsUsernameInput.value;
        try {
            const res = await fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername })
            });
            if (res.ok) {
                showNotification('Profile updated successfully!', 'success');
                // Also update the displayed username on the dashboard
                currentUsernameDisplay.textContent = `Welcome, ${newUsername}!`;
            } else {
                const data = await res.json();
                showNotification(data.error || 'Failed to update profile.', 'danger');
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            showNotification('Server error while updating profile.', 'danger');
        }
    });
    
    document.getElementById('back-to-dashboard-from-settings').addEventListener('click', () => {
        showSection('dashboard-section');
    });

    // --- Miscellaneous Functions ---

    // Function to add a video zoom effect on click
    const initializeZoomableVideo = (videoElement, containerElement) => {
        videoElement.addEventListener('click', () => {
            containerElement.classList.toggle('zoomed');
            videoGrid.classList.toggle('is-zoomed');
        });
    };

    // Initial check for login status when the page loads
    // We'll call this at the end to ensure all functions are defined
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
