document.addEventListener('DOMContentLoaded', () => {
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
    const shareLinkDisplay = document.getElementById('share-link-display');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessages = document.getElementById('chat-messages');
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
    const broadcastTypeRadios = document.querySelectorAll('input[name="broadcastType"]');
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastRoleMessage = document.getElementById('broadcast-role-message');
    const libraryFileInput = document.getElementById('library-file-input');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryRoleMessage = document.getElementById('library-role-message');
    const libraryFilesList = document.getElementById('library-files-list');
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionTextarea = document.getElementById('assessment-description');
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentCreationMessage = document.getElementById('assessment-creation-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentListDiv = document.getElementById('assessment-list');
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
    const notificationsContainer = document.getElementById('notifications-container');
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentAssessmentToTake = null;
    let localStream;
    const peerConnections = {};
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' },
        ]
    };
    let whiteboardCtx;
    let isDrawing = false;
    let startX, startY;
    let lastX, lastY;
    let currentColor = colorPicker ? colorPicker.value : '#FFF800';
    let currentBrushSize = brushSizeSlider ? parseInt(brushSizeSlider.value) : 5;
    let currentTool = 'pen';
    let snapshot;
    let currentStrokePoints = [];
    let whiteboardPages = [[]];
    let currentPageIndex = 0;
    const undoStack = [];
    const redoStack = [];
    const MAX_HISTORY_STEPS = 50;
    function showNotification(message, isError = false) {
        if (notificationsContainer) {
            notificationsContainer.textContent = message;
            notificationsContainer.className = isError ? 'error-notification' : 'success-notification';
            notificationsContainer.classList.add('show');
            setTimeout(() => {
                notificationsContainer.classList.remove('show');
                notificationsContainer.textContent = '';
            }, 5000);
        }
    }
    function displayMessage(element, message, isError) {
        element.textContent = message;
        element.className = isError ? 'error' : 'success';
    }
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
    function updateNavActiveState(activeButton) {
        [navDashboard, navClassroom, navSettings, navChat, navWhiteboard, navLibrary, navAssessments].forEach(btn => {
            if (btn) btn.classList.remove('active-nav');
        });
        if (activeButton) {
            activeButton.classList.add('active-nav');
        }
    }
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
    function getDisplayName(username, role) {
        return role === 'admin' ? `${username} (Admin)` : username;
    }
    function checkLoginStatus() {
        if (currentUser) {
            showSection(dashboardSection);
            currentUsernameDisplay.textContent = getDisplayName(currentUser.username, currentUser.role);
            classroomIdDisplay.textContent = currentClassroom ? currentClassroom.id : 'N/A';
            loadAvailableClassrooms();
            updateNavActiveState(navDashboard);
            updateUIBasedOnRole();
            const pathParts = window.location.pathname.split('/');
            if (pathParts[1] === 'classroom' && pathParts.length > 2) {
                const idFromUrl = pathParts[2];
                fetch(`/api/classrooms`)
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
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ classroomId: id })
                            });
                            const result = await response.json();
                            if (response.ok) {
                                showNotification(result.message);
                                loadAvailableClassrooms();
                                enterClassroom(id, name);
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
        setupChatControls();
        if (currentUser && currentUser.role === 'admin') {
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
            broadcastTypeRadios.forEach(radio => radio.parentElement.classList.remove('hidden'));
        } else {
            startBroadcastBtn.classList.add('hidden');
            endBroadcastBtn.classList.add('hidden');
            broadcastTypeRadios.forEach(radio => radio.parentElement.classList.add('hidden'));
        }
        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';
        loadAssessments();
        loadLibraryFiles();
        fetchWhiteboardHistory();
    }
    function cleanupClassroomResources() {
        if (socket && currentClassroom && currentClassroom.id) {
            socket.emit('leave', { 'classroomId': currentClassroom.id });
            socket.disconnect();
            socket = null;
        } else if (socket) {
            socket.disconnect();
            socket = null;
        }
        endBroadcast();
        if (whiteboardCtx && whiteboardCanvas) {
            whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
            whiteboardCtx.fillStyle = '#000000';
            whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        whiteboardPages = [[]];
        currentPageIndex = 0;
        undoStack.length = 0;
        redoStack.length = 0;
        updateUndoRedoButtons();
        updateWhiteboardPageDisplay();
        if (chatMessages) chatMessages.innerHTML = '';
        if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        currentClassroom = null;
        localStorage.removeItem('currentClassroom');
    }
    function initializeSocketIO() {
        if (socket) {
            socket.disconnect();
        }
        socket = io();
        socket.on('connect', () => {
            console.log('[Socket.IO] Connected. SID:', socket.id);
            if (currentClassroom && currentClassroom.id) {
                socket.emit('join', { 'classroomId': currentClassroom.id, 'role': currentUser.role });
                showNotification("Connected to classroom: " + currentClassroom.name);
            } else {
                console.error('[Socket.IO] Cannot join classroom: currentClassroom.id is undefined.');
                showNotification("Error: Could not join classroom.", true);
            }
        });
        socket.on('disconnect', () => {
            console.log('[Socket.IO] Disconnected');
            showNotification("Disconnected from classroom.", true);
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
            showNotification(`Admin Action: ${data.message}`);
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
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        socket.on('chat_history', (history) => {
            chatMessages.innerHTML = '';
            history.forEach(msg => {
                const messageElement = document.createElement('div');
                const senderDisplayName = getDisplayName(msg.username, msg.role);
                const date = new Date(msg.timestamp);
                const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                messageElement.textContent = `${senderDisplayName} (${formattedTime}): ${msg.message}`;
                chatMessages.appendChild(messageElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        socket.on('user_joined', (data) => {
            console.log(`[Socket.IO] User joined: ${data.username} (${data.sid})`);
            const statusMessage = document.createElement('div');
            const joinedDisplayName = getDisplayName(data.username, data.role);
            statusMessage.textContent = `${joinedDisplayName} has joined the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            if (currentUser && currentUser.role === 'admin' && localStream && localStream.active && data.sid !== socket.id) {
                console.log(`[WebRTC] Admin (${socket.id}) broadcasting. Creating offer for new peer: ${data.sid}`);
                createPeerConnection(data.sid, true);
            }
        });
        socket.on('user_left', (data) => {
            console.log(`[Socket.IO] User left: ${data.username} (${data.sid})`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has left the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
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
            const applyDrawingProperties = (tool, color, width) => {
                whiteboardCtx.strokeStyle = color;
                whiteboardCtx.lineWidth = width;
                whiteboardCtx.fillStyle = color;
                if (tool === 'eraser') {
                    whiteboardCtx.globalCompositeOperation = 'destination-out';
                } else {
                    whiteboardCtx.globalCompositeOperation = 'source-over';
                }
            };
            if (data.action === 'draw') {
                const drawingItem = data.data;
                const pageIndex = data.pageIndex;
                if (!whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                whiteboardPages[pageIndex].push(drawingItem);
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.save();
                    applyDrawingProperties(drawingItem.tool, drawingItem.color, drawingItem.width);
                    drawWhiteboardItem(drawingItem);
                    whiteboardCtx.restore();
                }
            } else if (data.action === 'clear') {
                const pageIndex = data.pageIndex;
                if (whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    whiteboardCtx.fillStyle = '#000000';
                    whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
            } else if (data.action === 'history' && data.history) {
                whiteboardPages = data.history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages = [[]];
                }
                currentPageIndex = 0;
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
                showNotification(`Whiteboard page changed to ${newPageIndex + 1}`);
            }
        });
        socket.on('webrtc_offer', async (data) => {
            if (data.sender_id === socket.id) return;
            console.log(`[WebRTC] Received WebRTC Offer from: ${data.sender_id} to ${socket.id}`);
            const peerId = data.sender_id;
            if (!peerConnections[peerId]) {
                createPeerConnection(peerId, false);
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
        });
    }
    async function startBroadcast() {
        if (!currentClassroom || !currentClassroom.id || !socket || !currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can start a broadcast in a classroom.", true);
            return;
        }
        if (localStream && localStream.active) {
            showNotification("Broadcast already active. Stopping it first.", true);
            endBroadcast();
            setTimeout(() => startBroadcast(), 500);
            return;
        }
        const selectedType = document.querySelector('input[name="broadcastType"]:checked').value;
        const constraints = {
            video: selectedType === 'video_audio',
            audio: true
        };
        try {
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            localVideo.srcObject = localStream;
            startBroadcastBtn.disabled = true;
            endBroadcastBtn.disabled = false;
            showNotification(`Broadcast started: ${selectedType === 'video_audio' ? 'Video & Audio' : 'Audio Only'}`);
            socket.emit('admin_action_update', {
                classroomId: currentClassroom.id,
                message: `Admin ${currentUser.username} started a ${selectedType === 'video_audio' ? 'video and audio' : 'audio only'} broadcast.`
            });
        } catch (err) {
            console.error('[WebRTC] Error accessing media devices:', err);
            showNotification(`Could not start broadcast. Error: ${err.message}. Please ensure camera and microphone access are granted.`, true);
            localStream = null;
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
        }
    }
    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            localVideo.srcObject = null;
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
        showNotification('Broadcast ended.');
        startBroadcastBtn.disabled = false;
        endBroadcastBtn.disabled = true;
        socket.emit('admin_action_update', {
            classroomId: currentClassroom.id,
            message: `Admin ${currentUser.username} ended the broadcast.`
        });
    }
    async function createPeerConnection(peerId, isCaller) {
        if (peerConnections[peerId]) {
            console.log(`[WebRTC] Peer connection to ${peerId} already exists.`);
            return;
        }
        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;
        console.log(`[WebRTC] Created RTCPeerConnection for peer: ${peerId}. Is caller: ${isCaller}`);
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
                remoteVideo.controls = false;
                remoteVideoContainer.appendChild(remoteVideo);
                console.log(`[WebRTC] Created remote video element for: ${peerId}`);
            }
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            } else {
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
            }
        }
    }
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
             console.warn("[Whiteboard] Canvas element not found. Whiteboard controls not set up.");
             return;
        }
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        if (!whiteboardCtx) {
            console.error("[Whiteboard] 2D context failed to initialize. Whiteboard will not function.");
            return;
        }
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.fillStyle = currentColor;
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        whiteboardCanvas.addEventListener('mousedown', handleMouseDown);
        whiteboardCanvas.addEventListener('mousemove', handleMouseMove);
        whiteboardCanvas.addEventListener('mouseup', handleMouseUp);
        whiteboardCanvas.addEventListener('mouseout', handleMouseUp);
        whiteboardCanvas.addEventListener('touchstart', handleMouseDown, { passive: false });
        whiteboardCanvas.addEventListener('touchmove', handleMouseMove, { passive: false });
        whiteboardCanvas.addEventListener('touchend', handleMouseUp);
        whiteboardCanvas.addEventListener('touchcancel', handleMouseUp);
        toolButtons.forEach(button => {
            button.addEventListener('click', () => selectTool(button.dataset.tool));
        });
        if (colorPicker) colorPicker.addEventListener('input', updateColor);
        if (brushSizeSlider) brushSizeSlider.addEventListener('input', updateBrushSize);
        if (undoButton) undoButton.addEventListener('click', undo);
        if (redoButton) redoButton.addEventListener('click', redo);
        if (clearButton) clearButton.addEventListener('click', () => clearCanvas(true));
        if (saveButton) saveButton.addEventListener('click', saveImage);
        if (prevWhiteboardPageBtn) prevWhiteboardPageBtn.addEventListener('click', goToPreviousWhiteboardPage);
        if (nextWhiteboardPageBtn) nextWhiteboardPageBtn.addEventListener('click', goToNextWhiteboardPage);
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        updateUndoRedoButtons();
    }
    function resizeCanvas() {
        const container = whiteboardCanvas.parentElement;
        const aspectRatio = 1200 / 800;
        let newWidth = container.clientWidth - 40;
        let newHeight = newWidth / aspectRatio;
        if (newHeight > window.innerHeight * 0.9) {
            newHeight = window.innerHeight * 0.9;
            newWidth = newHeight * aspectRatio;
        }
        whiteboardCanvas.width = Math.max(newWidth, 300);
        whiteboardCanvas.height = Math.max(newHeight, 700);
        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineWidth = currentBrushSize;
        whiteboardCtx.strokeStyle = currentColor;
        whiteboardCtx.fillStyle = currentColor;
        renderCurrentWhiteboardPage();
    }
    function handleMouseDown(e) {
        if (currentUser.role !== 'admin') return;
        isDrawing = true;
        const coords = getCoords(e);
        startX = coords.x;
        startY = coords.y;
        lastX = coords.x;
        lastY = coords.y;
        if (currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'text') {
            snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
        if (currentTool === 'pen' || currentTool === 'eraser') {
            currentStrokePoints = [{ x: startX, y: startY }];
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(startX, startY);
        } else if (currentTool === 'text') {
            const textInput = prompt("Enter text:");
            if (textInput !== null && textInput.trim() !== '') {
                whiteboardCtx.save();
                whiteboardCtx.font = `${currentBrushSize * 2}px Inter, sans-serif`;
                whiteboardCtx.fillStyle = currentColor;
                whiteboardCtx.fillText(textInput, startX, startY);
                whiteboardCtx.restore();
                saveState();
                const textData = {
                    startX: startX,
                    startY: startY,
                    endX: startX,
                    endY: startY,
                    text: textInput,
                    color: currentColor,
                    width: currentBrushSize,
                    tool: 'text',
                    pageIndex: currentPageIndex
                };
                socket.emit('whiteboard_data', { action: 'draw', classroomId: currentClassroom.id, data: textData });
                whiteboardPages[currentPageIndex].push({ action: 'draw', data: textData });
            }
            isDrawing = false;
        }
    }
    function handleMouseMove(e) {
        if (!isDrawing || currentUser.role !== 'admin' || currentTool === 'text') return;
        e.preventDefault();
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
            whiteboardCtx.quadraticCurveTo(lastX, lastY, (currentX + lastX) / 2, (currentY + lastY) / 2);
            whiteboardCtx.stroke();
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo((currentX + lastX) / 2, (currentY + lastY) / 2);
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: currentClassroom.id,
                    data: {
                        prevX: lastX,
                        prevY: lastY,
                        currX: currentX,
                        currY: currentY,
                        color: currentColor,
                        width: currentBrushSize,
                        tool: currentTool,
                        pageIndex: currentPageIndex
                    }
                });
            }
            lastX = currentX;
            lastY = currentY;
        } else {
            if (snapshot) {
                whiteboardCtx.putImageData(snapshot, 0, 0);
            } else {
                renderCurrentWhiteboardPage();
            }
            drawWhiteboardItem({ tool: currentTool, startX, startY, endX: currentX, endY: currentY, color: currentColor, width: currentBrushSize });
        }
        whiteboardCtx.restore();
    }
    function handleMouseUp(e) {
        if (!isDrawing || currentUser.role !== 'admin') return;
        isDrawing = false;
        if (currentTool === 'pen' || currentTool === 'eraser') {
            whiteboardCtx.lineTo(lastX, lastY);
            whiteboardCtx.stroke();
            whiteboardCtx.closePath();
            const strokeData = {
                points: currentStrokePoints,
                color: currentColor,
                width: currentBrushSize,
                tool: currentTool
            };
            socket.emit('whiteboard_data', {
                action: 'draw',
                classroomId: currentClassroom.id,
                data: strokeData,
                pageIndex: currentPageIndex
            });
            whiteboardPages[currentPageIndex].push({ action: 'draw', data: strokeData });
            currentStrokePoints = [];
        } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            const finalCoords = getCoords(e);
            const currentX = finalCoords.x;
            const currentY = finalCoords.y;
            renderCurrentWhiteboardPage();
            whiteboardCtx.save();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;
            const shapeData = { startX, startY, endX: currentX, endY: currentY, color: currentColor, width: currentBrushSize, tool: currentTool };
            drawWhiteboardItem(shapeData);
            whiteboardCtx.restore();
            socket.emit('whiteboard_data', { action: 'draw', classroomId: currentClassroom.id, data: shapeData, pageIndex: currentPageIndex });
            whiteboardPages[currentPageIndex].push({ action: 'draw', data: shapeData });
        }
        if (whiteboardCtx.globalCompositeOperation === 'destination-out') {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }
        saveState();
    }
    function drawWhiteboardItem(commandData) {
        const { tool, startX, startY, endX, endY, text, points, color, width } = commandData;
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
                if (points && points.length > 1) {
                    whiteboardCtx.beginPath();
                    whiteboardCtx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length - 1; i++) {
                        const p0 = points[i - 1];
                        const p1 = points[i];
                        const p2 = points[i + 1];
                        const controlX = (p0.x + p1.x) / 2;
                        const controlY = (p0.y + p1.y) / 2;
                        const endX_segment = (p1.x + p2.x) / 2;
                        const endY_segment = (p1.y + p2.y) / 2;
                        whiteboardCtx.quadraticCurveTo(p1.x, p1.y, endX_segment, endY_segment);
                    }
                    whiteboardCtx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                    whiteboardCtx.stroke();
                    whiteboardCtx.closePath();
                }
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
        }
    }
});
