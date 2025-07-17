// app.js (Fixed whiteboardCtx issue and enabled admin drawing, added verbose logging for whiteboard)

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

    const createClassroomSection = document.getElementById('create-classroom-section'); // New: Admin-only section
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

    const chatSection = document.getElementById('chat-section');
    const whiteboardArea = document.getElementById('whiteboard-area');
    const librarySection = document.getElementById('library-section');
    const assessmentsSection = document.getElementById('assessments-section');

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

    // Chat functionality elements (moved from classroom.js)
    const chatInput = document.getElementById('chat-input');
    const sendMessageBtn = document.getElementById('send-chat-button');
    const chatMessages = document.getElementById('chat-messages');

    // Whiteboard Elements (moved from classroom.js)
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const penColorInput = document.getElementById('pen-color');
    const penWidthInput = document.getElementById('pen-width');
    const widthValueSpan = document.getElementById('width-value');
    const clearBoardBtn = document.getElementById('clear-whiteboard-btn');
    const whiteboardTools = document.getElementById('whiteboard-tools'); // New: for admin-only visibility
    const whiteboardRoleMessage = document.getElementById('whiteboard-role-message'); // New: for role-specific messages
    const prevWhiteboardPageBtn = document.getElementById('prev-whiteboard-page-btn'); // New
    const nextWhiteboardPageBtn = document.getElementById('next-whiteboard-page-btn'); // New
    const whiteboardPageDisplay = document.getElementById('whiteboard-page-display'); // New

    // Video Broadcast Elements (moved from classroom.js)
    const mediaTypeSelect = document.getElementById('media-type-select'); // New
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const endBroadcastBtn = document.getElementById('end-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideoContainer = document.getElementById('remote-video-container');
    const broadcastRoleMessage = document.getElementById('broadcast-role-message'); // New: for role-specific messages

    // Library Elements
    const libraryFileInput = document.getElementById('library-file-input'); // New: for admin-only visibility
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn'); // New: for admin-only visibility
    const libraryRoleMessage = document.getElementById('library-role-message'); // New: for role-specific messages

    // Assessment Elements (NEW)
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

    const notificationsContainer = document.getElementById('notifications-container'); // New

    // --- Global Variables (moved from classroom.js) ---
    let socket;
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let currentClassroom = JSON.parse(localStorage.getItem('currentClassroom')) || null;
    let currentAssessmentToTake = null; // Stores the assessment being taken by a student

    // WebRTC Variables
    let localStream;
    const peerConnections = {}; // Store RTCPeerConnection objects keyed by peerId (which is the remote socket.id)
    const iceServers = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' }, // Public STUN server
            // Add TURN servers if needed for more complex network scenarios
            // { 'urls': 'turn:your-turn-server.com:3478', 'username': 'user', 'credential': 'password' }
        ]
    };

    // --- Whiteboard Variables ---
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let penColor = '#FFFFFF'; // Default white
    let penWidth = 2; // Default width
    let whiteboardCtx; // Moved outside, will initialize later
    let whiteboardPages = [[]]; // Array of arrays, each sub-array is a page of drawing commands
    let currentPageIndex = 0;


    // --- Utility Functions ---
    function displayMessage(element, message, isError) {
        element.textContent = message;
        element.className = isError ? 'error' : 'success';
    }

    // New: Function to show notifications
    function showNotification(message, isError = false) {
        if (notificationsContainer) {
            notificationsContainer.textContent = message;
            notificationsContainer.className = isError ? 'error' : 'success'; // You might want distinct styles for notifications
            notificationsContainer.classList.add('show');
            setTimeout(() => {
                notificationsContainer.classList.remove('show');
                notificationsContainer.textContent = '';
            }, 5000); // Hide after 5 seconds
        }
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

    /**
     * Updates UI elements based on the current user's role.
     * Elements with `data-admin-only` are shown only for admins.
     * Elements with `data-user-only` are shown only for regular users.
     */
    function updateUIBasedOnRole() {
        const isAdmin = currentUser && currentUser.role === 'admin';
        const isUser = currentUser && currentUser.role === 'user';

        console.log(`[UI Update] Current User Role: ${currentUser ? currentUser.role : 'N/A'}`);

        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
            el.classList.toggle('admin-feature-highlight', isAdmin);
        });

        document.querySelectorAll('[data-user-only]').forEach(el => {
            el.classList.toggle('hidden', !isUser);
            el.classList.toggle('user-view-subtle', isUser);
        });

        // Specific messages for restricted features
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

        // --- Crucial Fix: Ensure pointer-events is correctly set here ---
        if (whiteboardCanvas) {
            whiteboardCanvas.style.pointerEvents = isAdmin ? 'auto' : 'none';
            console.log(`[UI Update] Whiteboard Canvas pointer-events set to: ${whiteboardCanvas.style.pointerEvents} (isAdmin: ${isAdmin})`);
        }
    }

    // Function to get the display name with role tag
    function getDisplayName(username, role) {
        return role === 'admin' ? `${username} (Admin)` : username;
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

        // Apply role-based UI immediately upon entering classroom
        updateUIBasedOnRole(); // This will handle whiteboard pointer-events

        // --- Direct calls to merged classroom functionality ---
        initializeSocketIO();
        setupWhiteboardControls(); // Ensure whiteboard controls are set up
        
        // Reset broadcast buttons state based on role
        if (currentUser && currentUser.role === 'admin') {
            if (startBroadcastBtn) startBroadcastBtn.disabled = false;
            if (endBroadcastBtn) endBroadcastBtn.disabled = true;
        } else {
            // Hide broadcast buttons for non-admins
            if (startBroadcastBtn) startBroadcastBtn.classList.add('hidden');
            if (endBroadcastBtn) endBroadcastBtn.classList.add('hidden');
        }


        // Hide share link display when entering a new classroom
        shareLinkDisplay.classList.add('hidden');
        shareLinkInput.value = '';

        // Load assessments when entering classroom
        loadAssessments();
        loadLibraryFiles(); // Load library files

        // Fetch and render whiteboard history for the current classroom
        fetchWhiteboardHistory();
    }

    // --- Socket.IO Initialization (merged from classroom.js) ---
    function initializeSocketIO() {
        if (socket) {
            socket.disconnect(); // Ensure previous connection is closed
        }
        socket = io(); // Connect to the Socket.IO server

        socket.on('connect', () => {
            console.log('[Socket.IO] Connected. SID:', socket.id);
            // FIX: Use currentClassroom.id
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
            // Clean up WebRTC peer connections on disconnect
            for (const peerId in peerConnections) {
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
            }
            // Also explicitly remove remote videos
            if (remoteVideoContainer) remoteVideoContainer.innerHTML = '';
        });

        socket.on('status', (data) => {
            console.log('[Socket.IO] Server Status:', data.message);
        });

        // New: Listen for admin action updates
        socket.on('admin_action_update', (data) => {
            console.log('[Admin Action] Received:', data.message);
            showNotification(`Admin Action: ${data.message}`);
        });


        socket.on('message', (data) => {
            console.log('[Chat] Received Message:', data);
            const messageElement = document.createElement('div');
            // Display username with (Admin) tag if applicable
            const senderDisplayName = getDisplayName(data.username, data.role);
            messageElement.textContent = `${senderDisplayName}: ${data.message}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
        });

        socket.on('user_joined', (data) => {
            console.log(`[Socket.IO] ${data.username} (${data.sid}) has joined the classroom.`);
            const statusMessage = document.createElement('div');
            // Display username with (Admin) tag if applicable
            const joinedDisplayName = getDisplayName(data.username, data.role);
            statusMessage.textContent = `${joinedDisplayName} has joined the classroom.`;
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom

            // If I am the admin broadcaster and have a local stream,
            // create an offer for the new participant's SID
            if (localStream && localStream.active && currentUser && currentUser.role === 'admin' && data.sid !== socket.id) {
                console.log(`[WebRTC] Admin broadcasting. Creating offer for new peer: ${data.sid}`);
                createPeerConnection(data.sid, true); // true indicates caller (initiating offer)
            }
        });

        socket.on('user_left', (data) => {
            console.log(`[Socket.IO] ${data.username} (${data.sid}) has left the classroom.`);
            const statusMessage = document.createElement('div');
            statusMessage.textContent = `${data.username} has left the classroom.`; // Role not available here, so no tag
            statusMessage.style.fontStyle = 'italic';
            chatMessages.appendChild(statusMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
            
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

        // --- Whiteboard Socket.IO Handlers ---
        socket.on('whiteboard_data', (data) => {
            console.log("[Whiteboard] Received whiteboard data:", data);
            if (data.action === 'draw') {
                const { prevX, prevY, currX, currY, color, width, pageIndex } = data.data || data; // Handle both direct data and nested 'data' from DB
                // Ensure the page exists before drawing
                if (!whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = [];
                }
                whiteboardPages[pageIndex].push({ prevX, prevY, currX, currY, color, width });
                // Only draw if it's the current page or if it's initial load
                if (pageIndex === currentPageIndex) {
                    draw(prevX, prevY, currX, currY, color, width);
                }
            } else if (data.action === 'clear') {
                const { pageIndex } = data.data || data;
                if (whiteboardPages[pageIndex]) {
                    whiteboardPages[pageIndex] = []; // Clear data for that specific page
                }
                if (pageIndex === currentPageIndex) {
                    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                }
            } else if (data.action === 'history') {
                whiteboardPages = data.history || [[]]; // Load full history
                currentPageIndex = 0; // Reset to first page
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
            }
        });

        // New: Handle whiteboard page change events
        socket.on('whiteboard_page_change', (data) => {
            const { newPageIndex } = data;
            if (newPageIndex >= 0 && newPageIndex < whiteboardPages.length) {
                currentPageIndex = newPageIndex;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
                showNotification(`Whiteboard page changed to ${newPageIndex + 1}`);
            }
        });

        // --- WebRTC Socket.IO Handlers (merged from classroom.js) ---
        socket.on('webrtc_offer', async (data) => {
            console.log('[WebRTC] Received offer from:', data.sender_id);
            const peerId = data.sender_id;
            const offer = data.offer;
            
            if (!peerConnections[peerId]) {
                await createPeerConnection(peerId, false); // false indicates not caller (receiving offer)
            }

            try {
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnections[peerId].createAnswer();
                await peerConnections[peerId].setLocalDescription(answer);
                socket.emit('webrtc_answer', {
                    recipient_id: peerId,
                    answer: answer,
                    sender_id: socket.id,
                    classroomId: currentClassroom.id
                });
                console.log('[WebRTC] Sent answer to:', peerId);
            } catch (error) {
                console.error('Error setting remote description or creating answer:', error);
            }
        });

        socket.on('webrtc_answer', async (data) => {
            console.log('[WebRTC] Received answer from:', data.sender_id);
            const peerId = data.sender_id;
            const answer = data.answer;

            try {
                if (peerConnections[peerId] && peerConnections[peerId].signalingState !== 'stable') {
                    await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('[WebRTC] Remote description set for:', peerId);
                }
            } catch (error) {
                console.error('Error setting remote description from answer:', error);
            }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            console.log('[WebRTC] Received ICE candidate from:', data.sender_id);
            const peerId = data.sender_id;
            const candidate = data.candidate;

            try {
                if (peerConnections[peerId]) {
                    await peerConnections[peerId].addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('[WebRTC] Added ICE candidate for:', peerId);
                }
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            console.log('[WebRTC] Peer disconnected:', data.peer_id);
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

    // --- WebRTC Functions (merged from classroom.js) ---
    async function startBroadcast() {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can start a broadcast.", true);
            return;
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }

        const mediaType = mediaTypeSelect.value; // Get selected media type
        const constraints = {
            video: mediaType === 'video', // Enable video if 'video' is selected
            audio: true // Always enable audio
        };

        try {
            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            localVideo.srcObject = localStream;
            startBroadcastBtn.disabled = true;
            endBroadcastBtn.disabled = false;
            console.log('[WebRTC] Local stream obtained:', localStream);

            // Announce to the classroom that the admin has started broadcasting
            socket.emit('admin_broadcast_started', {
                classroomId: currentClassroom.id,
                streamType: mediaType // Announce the type of stream
            });

            // For existing peers in the classroom, create offers
            // The 'user_joined' event handler already handles new users.
            // For existing users, they will receive the 'admin_broadcast_started'
            // and initiate their peer connection if they haven't already.
            // Alternatively, admin could iterate through known connected SIDs and send offers.
            // For simplicity, we'll rely on existing peers reacting to 'admin_broadcast_started'
            // or new peers handling via 'user_joined'.

        } catch (error) {
            console.error('Error accessing media devices:', error);
            showNotification(`Error accessing media: ${error.message}. Please ensure camera/microphone permissions are granted.`, true);
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
        }
    }

    function endBroadcast() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            localVideo.srcObject = null;
            startBroadcastBtn.disabled = false;
            endBroadcastBtn.disabled = true;
            console.log('[WebRTC] Broadcast ended.');
            
            // Send signal to all peers that the broadcast has ended
            socket.emit('admin_broadcast_ended', { classroomId: currentClassroom.id });

            // Close all peer connections and remove remote videos
            for (const peerId in peerConnections) {
                if (peerConnections[peerId]) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                }
            }
            remoteVideoContainer.innerHTML = '';
        }
    }

    async function createPeerConnection(peerId, isCaller) {
        if (peerConnections[peerId]) {
            console.log(`[WebRTC] Peer connection to ${peerId} already exists.`);
            return;
        }

        const pc = new RTCPeerConnection(iceServers);
        peerConnections[peerId] = pc;
        console.log(`[WebRTC] Created RTCPeerConnection for peer: ${peerId}. Is caller: ${isCaller}`);

        // Add local stream tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
                console.log(`[WebRTC] Added local track ${track.kind} to peer ${peerId}`);
            });
        } else {
            console.warn('[WebRTC] No local stream to add to peer connection.');
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', {
                    recipient_id: peerId,
                    candidate: event.candidate,
                    sender_id: socket.id,
                    classroomId: currentClassroom.id
                });
                console.log('[WebRTC] Sent ICE candidate to:', peerId);
            }
        };

        // Handle remote stream tracks
        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track:', event.track.kind, 'from', peerId);
            let remoteVideo = document.getElementById(`remote-video-${peerId}`);
            if (!remoteVideo) {
                remoteVideo = document.createElement('video');
                remoteVideo.id = `remote-video-${peerId}`;
                remoteVideo.autoplay = true;
                remoteVideo.playsinline = true;
                remoteVideo.controls = true; // For debugging
                remoteVideoContainer.appendChild(remoteVideo);
                console.log('[WebRTC] Created remote video element for:', peerId);
            }
            // Assign the stream to the video element
            // Use event.streams[0] to get the MediaStream
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            } else {
                // Fallback for older browsers or specific scenarios, though event.streams is preferred
                const newStream = new MediaStream();
                newStream.addTrack(event.track);
                remoteVideo.srcObject = newStream;
            }
        };

        // Handle signaling state changes
        pc.onsignalingstatechange = () => {
            console.log(`[WebRTC] Signaling state for ${peerId}:`, pc.signalingState);
        };

        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE connection state for ${peerId}:`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
                console.log(`[WebRTC] Peer ${peerId} ICE connection state is ${pc.iceConnectionState}. Cleaning up.`);
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
                socket.emit('webrtc_offer', {
                    recipient_id: peerId,
                    offer: offer,
                    sender_id: socket.id,
                    classroomId: currentClassroom.id
                });
                console.log('[WebRTC] Sent offer to:', peerId);
            } catch (error) {
                console.error('Error creating or setting offer:', error);
            }
        }
    }

    // --- Whiteboard Functions (merged from classroom.js) ---
    function setupWhiteboardControls() {
        if (!whiteboardCanvas) {
            console.error("Whiteboard canvas not found.");
            return;
        }
        whiteboardCtx = whiteboardCanvas.getContext('2d');
        resizeWhiteboard(); // Set initial size
        window.addEventListener('resize', resizeWhiteboard);

        penColorInput.addEventListener('change', (e) => {
            penColor = e.target.value;
        });

        penWidthInput.addEventListener('input', (e) => {
            penWidth = e.target.value;
            widthValueSpan.textContent = `${penWidth}px`;
        });

        // Event Listeners for Drawing
        whiteboardCanvas.addEventListener('mousedown', handleMouseDown);
        whiteboardCanvas.addEventListener('mousemove', handleMouseMove);
        whiteboardCanvas.addEventListener('mouseup', handleMouseUp);
        whiteboardCanvas.addEventListener('mouseout', handleMouseUp); // Stop drawing if mouse leaves canvas

        clearBoardBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the current whiteboard page? This cannot be undone.")) {
                whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                // Clear data for the current page and emit event
                whiteboardPages[currentPageIndex] = [];
                socket.emit('whiteboard_data', { action: 'clear', data: { pageIndex: currentPageIndex, classroomId: currentClassroom.id } });
                showNotification(`Whiteboard page ${currentPageIndex + 1} cleared.`);
            }
        });

        shareWhiteboardBtn.addEventListener('click', () => {
            if (currentClassroom && currentClassroom.id) {
                const shareLink = `${window.location.origin}/classroom/${currentClassroom.id}`;
                shareLinkInput.value = shareLink;
                shareLinkDisplay.classList.remove('hidden');
                shareLinkInput.select(); // Select the text for easy copying
            } else {
                showNotification("Please create or join a classroom first to get a share link.", true);
            }
        });

        copyShareLinkBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            showNotification("Share link copied to clipboard!");
        });

        prevWhiteboardPageBtn.addEventListener('click', goToPreviousWhiteboardPage);
        nextWhiteboardPageBtn.addEventListener('click', goToNextWhiteboardPage);
        
        // Initial render and page display update
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
    }

    function resizeWhiteboard() {
        // Store current image data
        const imageData = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        whiteboardCanvas.width = whiteboardCanvas.offsetWidth;
        whiteboardCanvas.height = whiteboardCanvas.offsetHeight;

        // Restore image data
        whiteboardCtx.putImageData(imageData, 0, 0);

        // Ensure drawing styles are reapplied after resize
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineJoin = 'round';

        // Redraw content of the current page after resize, as image data might scale poorly
        renderCurrentWhiteboardPage();
    }


    function handleMouseDown(e) {
        if (currentUser.role !== 'admin') {
            console.log("[Whiteboard] Non-admin user attempted to draw.");
            return;
        }
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        console.log(`[Whiteboard] Mouse Down at (${lastX}, ${lastY})`);
    }

    function handleMouseMove(e) {
        if (!isDrawing) return;
        if (currentUser.role !== 'admin') return; // Double check permission
        
        const [currX, currY] = [e.offsetX, e.offsetY];
        draw(lastX, lastY, currX, currY, penColor, penWidth);
        
        // Store drawing command for current page
        whiteboardPages[currentPageIndex].push({
            prevX: lastX, prevY: lastY,
            currX: currX, currY: currY,
            color: penColor, width: penWidth
        });

        // Emit drawing data to server
        socket.emit('whiteboard_data', {
            action: 'draw',
            data: {
                prevX: lastX, prevY: lastY,
                currX: currX, currY: currY,
                color: penColor, width: penWidth,
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex
            }
        });
        [lastX, lastY] = [currX, currY];
    }

    function handleMouseUp() {
        isDrawing = false;
        console.log("[Whiteboard] Mouse Up. Drawing ended.");
    }

    function draw(prevX, prevY, currX, currY, color, width) {
        if (!whiteboardCtx) {
            console.warn("Whiteboard context not initialized.");
            return;
        }
        whiteboardCtx.strokeStyle = color;
        whiteboardCtx.lineWidth = width;
        whiteboardCtx.beginPath();
        whiteboardCtx.moveTo(prevX, prevY);
        whiteboardCtx.lineTo(currX, currY);
        whiteboardCtx.stroke();
    }

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
                    whiteboardPages = [[]]; // Initialize with one empty page
                    currentPageIndex = 0;
                    renderCurrentWhiteboardPage();
                    updateWhiteboardPageDisplay();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            whiteboardPages = data.history || [[]]; // Load all pages
            if (whiteboardPages.length === 0) {
                whiteboardPages = [[]]; // Ensure at least one page
            }
            currentPageIndex = 0; // Always start on the first page when loading history
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            console.log("[Whiteboard] Fetched history:", whiteboardPages);
        } catch (error) {
            console.error("Error fetching whiteboard history:", error);
            whiteboardPages = [[]]; // Fallback to empty if fetch fails
            currentPageIndex = 0;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
        }
    }

    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx) return;
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height); // Clear current view

        const currentPage = whiteboardPages[currentPageIndex];
        if (currentPage) {
            currentPage.forEach(command => {
                draw(command.prevX, command.prevY, command.currX, command.currY, command.color, command.width);
            });
        }
        updateWhiteboardPageDisplay();
    }

    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1}/${whiteboardPages.length}`;
        }
        // Disable/enable navigation buttons
        if (prevWhiteboardPageBtn) {
            prevWhiteboardPageBtn.disabled = currentPageIndex === 0;
        }
        if (nextWhiteboardPageBtn) {
            nextWhiteboardPageBtn.disabled = currentPageIndex === whiteboardPages.length - 1;
        }
    }

    function goToNextWhiteboardPage() {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else {
            // If at the last page, create a new one
            whiteboardPages.push([]);
            currentPageIndex = whiteboardPages.length - 1;
            socket.emit('whiteboard_page_change', {
                classroomId: currentClassroom.id,
                newPageIndex: currentPageIndex,
                action: 'add_page' // Custom action for new page creation
            });
        }
        renderCurrentWhiteboardPage();
        updateWhiteboardPageDisplay();
        socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
        showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`);
    }

    function goToPreviousWhiteboardPage() {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            socket.emit('whiteboard_page_change', { classroomId: currentClassroom.id, newPageIndex: currentPageIndex });
            showNotification(`Moved to whiteboard page ${currentPageIndex + 1}`);
        }
    }


    // --- Chat Functions (moved from classroom.js) ---
    function setupChatControls() {
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                const message = chatInput.value.trim();
                if (message && socket && currentClassroom && currentUser) {
                    socket.emit('message', {
                        'classroomId': currentClassroom.id,
                        'message': message,
                        'username': currentUser.username,
                        'role': currentUser.role
                    });
                    chatInput.value = '';
                }
            });
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessageBtn.click();
                }
            });
        }
    }

    // --- Library Functions ---
    async function loadLibraryFiles() {
        if (!currentClassroom || !currentClassroom.id) {
            console.warn("Cannot load library files: No current classroom.");
            return;
        }
        try {
            const response = await fetch(`/api/library-files/${currentClassroom.id}`);
            const files = await response.json();
            const libraryFilesList = document.getElementById('library-files-list');
            libraryFilesList.innerHTML = ''; // Clear previous list

            if (files.length === 0) {
                libraryFilesList.innerHTML = '<p>No files uploaded yet.</p>';
            } else {
                files.forEach(file => {
                    const fileDiv = document.createElement('div');
                    fileDiv.innerHTML = `
                        <span><a href="${file.url}" target="_blank">${file.filename}</a></span>
                        ${currentUser && currentUser.role === 'admin' ? `<button class="delete-file-btn" data-file-id="${file.id}">Delete</button>` : ''}
                    `;
                    libraryFilesList.appendChild(fileDiv);
                });
                // Add event listeners for delete buttons (only for admins)
                if (currentUser && currentUser.role === 'admin') {
                    document.querySelectorAll('.delete-file-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const fileId = e.target.dataset.fileId;
                            if (confirm("Are you sure you want to delete this file?")) {
                                try {
                                    const response = await fetch(`/api/library-files/${fileId}`, {
                                        method: 'DELETE'
                                    });
                                    const result = await response.json();
                                    if (response.ok) {
                                        showNotification(result.message);
                                        loadLibraryFiles(); // Reload list
                                        socket.emit('admin_action_update', { classroomId: currentClassroom.id, message: `File '${file.filename}' deleted from library.` });
                                    } else {
                                        showNotification(`Error deleting file: ${result.error}`, true);
                                    }
                                } catch (error) {
                                    console.error('Error deleting file:', error);
                                    showNotification('Error deleting file.', true);
                                }
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading library files:', error);
            document.getElementById('library-files-list').innerHTML = '<p>Failed to load library files.</p>';
        }
    }

    if (uploadLibraryFilesBtn) {
        uploadLibraryFilesBtn.addEventListener('click', async () => {
            const files = libraryFileInput.files;
            if (files.length === 0) {
                showNotification("Please select files to upload.", true);
                return;
            }
            if (!currentClassroom || !currentClassroom.id) {
                showNotification("Please join a classroom before uploading files.", true);
                return;
            }

            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            formData.append('classroomId', currentClassroom.id);

            try {
                const response = await fetch('/api/upload-library-files', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok) {
                    showNotification(result.message);
                    libraryFileInput.value = ''; // Clear input
                    loadLibraryFiles(); // Reload list
                    socket.emit('admin_action_update', { classroomId: currentClassroom.id, message: `New file(s) uploaded to library.` });
                } else {
                    showNotification(`Error uploading files: ${result.error}`, true);
                }
            } catch (error) {
                console.error('Error uploading files:', error);
                showNotification('Error uploading files.', true);
            }
        });
    }


    // --- Assessment Functions ---
    async function loadAssessments() {
        if (!currentClassroom || !currentClassroom.id) {
            console.warn("Cannot load assessments: No current classroom.");
            return;
        }

        assessmentListDiv.innerHTML = 'Loading assessments...';
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.add('hidden');
        assessmentListContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/assessments/${currentClassroom.id}`);
            const assessments = await response.json();
            assessmentListDiv.innerHTML = ''; // Clear previous list

            if (assessments.length === 0) {
                assessmentListDiv.innerHTML = '<p>No assessments available yet.</p>';
            } else {
                assessments.forEach(assessment => {
                    const assessmentDiv = document.createElement('div');
                    assessmentDiv.innerHTML = `
                        <span><strong>${assessment.title}</strong> - ${assessment.description}</span>
                        <div>
                            ${currentUser && currentUser.role === 'user' ? `<button class="take-assessment-btn" data-assessment-id="${assessment.id}">Take Assessment</button>` : ''}
                            ${currentUser && currentUser.role === 'admin' ? `<button class="view-submissions-btn" data-assessment-id="${assessment.id}" data-assessment-title="${assessment.title}">View Submissions</button>` : ''}
                            ${currentUser && currentUser.role === 'admin' ? `<button class="delete-assessment-btn" data-assessment-id="${assessment.id}">Delete</button>` : ''}
                        </div>
                    `;
                    assessmentListDiv.appendChild(assessmentDiv);
                });

                document.querySelectorAll('.take-assessment-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        await displayAssessmentForTaking(assessmentId);
                    });
                });

                document.querySelectorAll('.view-submissions-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        const assessmentTitle = e.target.dataset.assessmentTitle;
                        await viewSubmissions(assessmentId, assessmentTitle);
                    });
                });

                document.querySelectorAll('.delete-assessment-btn').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const assessmentId = e.target.dataset.assessmentId;
                        if (confirm("Are you sure you want to delete this assessment? This will also delete all submissions.")) {
                            try {
                                const response = await fetch(`/api/assessments/${assessmentId}`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' }
                                });
                                const result = await response.json();
                                if (response.ok) {
                                    showNotification(result.message);
                                    loadAssessments(); // Reload the list
                                    socket.emit('admin_action_update', { classroomId: currentClassroom.id, message: `Assessment '${assessment.title}' deleted.` });
                                } else {
                                    showNotification(`Error deleting assessment: ${result.error}`, true);
                                }
                            } catch (error) {
                                console.error('Error deleting assessment:', error);
                                showNotification('Error deleting assessment.', true);
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            assessmentListDiv.innerHTML = '<p>Failed to load assessments.</p>';
        }
        updateUIBasedOnRole(); // Apply role-based visibility after content is loaded
    }

    // Function to add a new question input block
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
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
            `;
            questionsContainer.appendChild(questionItem);

            // Add event listener for the new question type select
            questionItem.querySelector('.question-type').addEventListener('change', function() {
                const mcqOptionsDiv = this.nextElementSibling;
                if (this.value === 'mcq') {
                    mcqOptionsDiv.classList.remove('hidden');
                } else {
                    mcqOptionsDiv.classList.add('hidden');
                }
            });
        });
    }

    if (submitAssessmentBtn) {
        submitAssessmentBtn.addEventListener('click', async () => {
            if (!currentClassroom || !currentClassroom.id) {
                showNotification("Please join a classroom before creating an assessment.", true);
                return;
            }

            const title = assessmentTitleInput.value.trim();
            const description = assessmentDescriptionTextarea.value.trim();

            if (!title) {
                showNotification("Assessment title is required.", true);
                return;
            }

            const questions = [];
            let allQuestionsValid = true;
            questionsContainer.querySelectorAll('.question-item').forEach((item, index) => {
                const questionText = item.querySelector('.question-text').value.trim();
                const questionType = item.querySelector('.question-type').value;
                
                if (!questionText) {
                    showNotification(`Question ${index + 1} text is required.`, true);
                    allQuestionsValid = false;
                    return;
                }

                const question = { text: questionText, type: questionType };
                if (questionType === 'mcq') {
                    const options = Array.from(item.querySelectorAll('.mcq-option')).map(input => input.value.trim());
                    const correctAnswer = item.querySelector('.mcq-correct-answer').value.trim();
                    
                    if (options.some(option => !option) || !correctAnswer) {
                        showNotification(`MCQ Question ${index + 1} requires all options and a correct answer.`, true);
                        allQuestionsValid = false;
                        return;
                    }
                    question.options = options;
                    question.correct_answer = correctAnswer;
                }
                questions.push(question);
            });

            if (!allQuestionsValid || questions.length === 0) {
                showNotification("Please add at least one valid question.", true);
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
                    assessmentTitleInput.value = '';
                    assessmentDescriptionTextarea.value = '';
                    questionsContainer.innerHTML = `
                        <div class="question-item">
                            <label>Question 1:</label>
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
                        </div>
                    `;
                    // Re-add event listener for the single initial question
                    questionsContainer.querySelector('.question-type').addEventListener('change', function() {
                        const mcqOptionsDiv = this.nextElementSibling;
                        if (this.value === 'mcq') {
                            mcqOptionsDiv.classList.remove('hidden');
                        } else {
                            mcqOptionsDiv.classList.add('hidden');
                        }
                    });
                    loadAssessments(); // Reload available assessments
                    socket.emit('admin_action_update', { classroomId: currentClassroom.id, message: `New assessment '${title}' created.` });
                } else {
                    displayMessage(assessmentCreationMessage, `Error: ${result.error}`, true);
                }
            } catch (error) {
                console.error('Error creating assessment:', error);
                displayMessage(assessmentCreationMessage, 'Error creating assessment.', true);
            }
        });
    }

    async function displayAssessmentForTaking(assessmentId) {
        if (!currentUser || currentUser.role !== 'user') {
            showNotification("Only students can take assessments.", true);
            return;
        }
        try {
            const response = await fetch(`/api/assessments/${assessmentId}`);
            if (!response.ok) throw new Error('Assessment not found');
            const assessment = await response.json();
            currentAssessmentToTake = assessment; // Store globally

            takeAssessmentTitle.textContent = assessment.title;
            takeAssessmentDescription.textContent = assessment.description;
            takeAssessmentForm.innerHTML = ''; // Clear previous questions
            assessmentSubmissionMessage.textContent = ''; // Clear previous messages

            assessment.questions.forEach((question, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('assessment-question-item');
                let questionHtml = `<p><strong>${index + 1}. ${question.text}</strong></p>`;

                if (question.type === 'text') {
                    questionHtml += `<textarea name="question_${question.id}" rows="3" placeholder="Your answer"></textarea>`;
                } else if (question.type === 'mcq') {
                    question.options.forEach((option, i) => {
                        const optionChar = String.fromCharCode(65 + i); // A, B, C, D
                        questionHtml += `
                            <input type="radio" id="q${question.id}_${optionChar}" name="question_${question.id}" value="${optionChar}">
                            <label for="q${question.id}_${optionChar}">${optionChar}. ${option}</label><br>
                        `;
                    });
                }
                questionDiv.innerHTML = questionHtml;
                takeAssessmentForm.appendChild(questionDiv);
            });

            assessmentListContainer.classList.add('hidden');
            takeAssessmentContainer.classList.remove('hidden');
            updateUIBasedOnRole(); // Re-apply visibility
        } catch (error) {
            console.error('Error displaying assessment:', error);
            showNotification('Error loading assessment.', true);
            takeAssessmentContainer.classList.add('hidden');
            assessmentListContainer.classList.remove('hidden');
        }
    }

    if (submitAnswersBtn) {
        submitAnswersBtn.addEventListener('click', async () => {
            if (!currentAssessmentToTake || !currentUser || !currentUser.id || !currentClassroom || !currentClassroom.id) {
                showNotification("Cannot submit answers: Assessment or user/classroom data missing.", true);
                return;
            }

            const answers = [];
            let allAnswersValid = true;

            currentAssessmentToTake.questions.forEach(question => {
                let userAnswer = null;
                if (question.type === 'text') {
                    const textarea = takeAssessmentForm.querySelector(`textarea[name="question_${question.id}"]`);
                    userAnswer = textarea ? textarea.value.trim() : '';
                } else if (question.type === 'mcq') {
                    const selectedOption = takeAssessmentForm.querySelector(`input[name="question_${question.id}"]:checked`);
                    userAnswer = selectedOption ? selectedOption.value : null;
                }
                
                if (userAnswer === null || userAnswer === '') {
                    // For MCQ, if no option is selected, consider it unanswered
                    // For text, if empty, it's also unanswered.
                    // This simple validation just checks if *something* was provided.
                    // More robust validation might be needed (e.g., minimum text length).
                }

                answers.push({
                    question_id: question.id,
                    question_text: question.text,
                    question_type: question.type,
                    user_answer: userAnswer,
                    correct_answer: question.correct_answer // Include correct answer for scoring
                });
            });

            if (!allAnswersValid) { // This check currently relies on the loop setting the flag
                showNotification("Please answer all questions before submitting.", true);
                return;
            }

            try {
                const response = await fetch(`/api/assessments/${currentAssessmentToTake.id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        username: currentUser.username,
                        classroomId: currentClassroom.id,
                        assessmentId: currentAssessmentToTake.id,
                        answers: answers
                    })
                });
                const result = await response.json();
                if (response.ok) {
                    displayMessage(assessmentSubmissionMessage, result.message, false);
                    // Optionally, show results here or navigate back
                    setTimeout(() => {
                        loadAssessments(); // Go back to the assessment list
                    }, 2000);
                    socket.emit('admin_action_update', { classroomId: currentClassroom.id, message: `${currentUser.username} submitted an assessment.` });
                } else {
                    displayMessage(assessmentSubmissionMessage, `Error: ${result.error}`, true);
                }
            } catch (error) {
                console.error('Error submitting answers:', error);
                displayMessage(assessmentSubmissionMessage, 'Error submitting answers.', true);
            }
        });
    }

    if (backToAssessmentListBtn) {
        backToAssessmentListBtn.addEventListener('click', () => {
            loadAssessments(); // Go back to the list of assessments
        });
    }

    async function viewSubmissions(assessmentId, assessmentTitle) {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification("Only administrators can view submissions.", true);
            return;
        }
        submissionsAssessmentTitle.textContent = `Submissions for: ${assessmentTitle}`;
        submissionsList.innerHTML = 'Loading submissions...';
        assessmentListContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`);
            if (!response.ok) throw new Error('Submissions not found');
            const submissions = await response.json();

            submissionsList.innerHTML = '';
            if (submissions.length === 0) {
                submissionsList.innerHTML = '<p>No submissions for this assessment yet.</p>';
                return;
            }

            submissions.forEach(submission => {
                const submissionItem = document.createElement('div');
                submissionItem.classList.add('submission-item');
                submissionItem.innerHTML = `
                    <h5>Submitted by: ${submission.username} on ${new Date(submission.submitted_at).toLocaleString()}</h5>
                `;
                // Add score if available
                if (submission.score !== undefined && submission.total_questions !== undefined) {
                    submissionItem.innerHTML += `<p>Score: ${submission.score}/${submission.total_questions}</p>`;
                }
                
                submission.answers.forEach(answer => {
                    const answerPair = document.createElement('div');
                    answerPair.classList.add('answer-pair');
                    answerPair.innerHTML = `
                        <p><strong>Q:</strong> ${answer.question_text}</p>
                        <p><strong>Your Answer:</strong> ${answer.user_answer || 'N/A'}</p>
                    `;
                    if (answer.is_correct !== undefined && answer.is_correct !== null) {
                        answerPair.innerHTML += `<p><strong>Correct:</strong> ${answer.is_correct ? 'Yes' : 'No'} (Expected: ${answer.correct_answer || 'N/A'})</p>`;
                        answerPair.style.backgroundColor = answer.is_correct ? '#e6ffe6' : '#ffe6e6'; // Light green for correct, light red for incorrect
                    } else if (answer.correct_answer) { // Show correct answer for text questions if available
                        answerPair.innerHTML += `<p><strong>Expected Answer:</strong> ${answer.correct_answer}</p>`;
                    }
                    submissionItem.appendChild(answerPair);
                });
                submissionsList.appendChild(submissionItem);
            });

        } catch (error) {
            console.error('Error loading submissions:', error);
            submissionsList.innerHTML = '<p>Failed to load submissions.</p>';
        }
    }

    if (backToAssessmentListFromSubmissionsBtn) {
        backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
            loadAssessments(); // Go back to the list of assessments
        });
    }

    // --- Initial Load ---
    checkLoginStatus(); // Initialize app state based on login status
});
