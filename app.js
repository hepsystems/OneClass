document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const app = document.getElementById('app');
    const authSection = document.getElementById('auth-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');

    const dashboardSection = document.getElementById('dashboard-section');
    const classroomIdDisplay = document.getElementById('classroom-id-display');
    const navClassroom = document.getElementById('nav-classroom');
    const navSettings = document.getElementById('nav-settings');
    const logoutBtn = document.getElementById('logout-btn');

    const classroomSection = document.getElementById('classroom-section');
    const showWhiteboardBtn = document.getElementById('show-whiteboard');
    const showLibraryBtn = document.getElementById('show-library');
    const showAssessmentBtn = document.getElementById('show-assessment');
    const backToDashboardBtn = document.getElementById('back-to-dashboard');

    const whiteboardArea = document.getElementById('whiteboard-area');
    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const whiteboardCtx = whiteboardCanvas.getContext('2d');
    const toolDrawBtn = document.getElementById('tool-draw');
    const toolTextBtn = document.getElementById('tool-text');
    const toolShapeBtn = document.getElementById('tool-shape');
    const whiteboardColorInput = document.getElementById('whiteboard-color');
    const clearWhiteboardBtn = document.getElementById('clear-whiteboard');
    const nextPageBtn = document.getElementById('next-page');
    const prevPageBtn = document.getElementById('prev-page');

    const libraryArea = document.getElementById('library-area');
    const libraryUploadFile = document.getElementById('library-upload-file');
    const libraryUploadBtn = document.getElementById('library-upload-btn');
    const libraryFileList = document.getElementById('library-file-list');

    const assessmentArea = document.getElementById('assessment-area');
    const createAssessmentForm = document.getElementById('create-assessment-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionInput = document.getElementById('assessment-description');
    const assessmentList = document.getElementById('assessment-list');

    const chatBox = document.getElementById('chat-box');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');

    const videoBroadcast = document.getElementById('video-broadcast');
    const localVideo = document.getElementById('local-video');
    const remoteVideo = document.getElementById('remote-video');
    const startBroadcastBtn = document.getElementById('start-broadcast');
    const joinBroadcastBtn = document.getElementById('join-broadcast');

    const settingsSection = document.getElementById('settings-section');
    const updateProfileForm = document.getElementById('update-profile-form');
    const settingsUsernameInput = document.getElementById('settings-username');
    const settingsEmailInput = document.getElementById('settings-email');
    const backToDashboardFromSettingsBtn = document.getElementById('back-to-dashboard-from-settings');

    // --- Global Variables / State Management ---
    let currentUser = null; // Stores logged-in user data
    let currentClassroomId = null; // Stores the unique ID for the current classroom
    let whiteboardPages = [[]]; // Array of arrays, each sub-array is a page of drawing data
    let currentPageIndex = 0;
    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    let whiteboardTool = 'draw'; // 'draw', 'text', 'shape'

    let chatWebSocket = null;
    let broadcastPeerConnection = null;
    let localStream = null;

    // --- Utility Functions ---
    function showSection(sectionElement) {
        document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden'));
        sectionElement.classList.remove('hidden');
        sectionElement.classList.add('active');
    }

    function showClassroomFeature(featureElement) {
        document.querySelectorAll('.classroom-feature').forEach(feature => {
            feature.classList.remove('active-feature');
            feature.classList.add('hidden-feature');
        });
        featureElement.classList.remove('hidden-feature');
        featureElement.classList.add('active-feature');
    }

    function displayMessage(element, message, isError = false) {
        element.textContent = message;
        element.style.color = isError ? 'red' : 'green';
    }

    // --- Authentication Logic ---
    async function handleAuth(event, endpoint) {
        event.preventDefault();
        const form = event.target;
        const email = form.querySelector('input[type="email"]').value;
        const password = form.querySelector('input[type="password"]').value;
        let username = '';
        let role = 'user';

        if (form.id === 'register-form') {
            username = form.querySelector('#register-username').value;
            role = form.querySelector('#register-role').value;
        }

        const data = form.id === 'register-form' ? { username, email, password, role } : { email, password };

        try {
            const response = await fetch(`/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (response.ok) {
                displayMessage(authMessage, result.message);
                currentUser = result.user; // Assuming backend returns user data on successful login/registration
                if (endpoint === 'login') {
                    // Generate a unique classroom ID upon successful user login
                    currentClassroomId = `classroom-${Math.random().toString(36).substring(2, 11)}`;
                    classroomIdDisplay.textContent = currentClassroomId;
                    showSection(dashboardSection);
                }
            } else {
                displayMessage(authMessage, result.error, true);
            }
        } catch (error) {
            console.error('Error during authentication:', error);
            displayMessage(authMessage, 'An error occurred. Please try again.', true);
        }
    }

    loginForm.addEventListener('submit', (e) => handleAuth(e, 'login'));
    registerForm.addEventListener('submit', (e) => handleAuth(e, 'register'));

    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        currentClassroomId = null;
        displayMessage(authMessage, 'Logged out successfully.', false);
        showSection(authSection);
    });

    // --- Navigation ---
    navClassroom.addEventListener('click', () => {
        if (currentUser) {
            showSection(classroomSection);
            showClassroomFeature(whiteboardArea); // Default to whiteboard
            initializeWhiteboard(); // Ensure whiteboard is ready
        } else {
            displayMessage(authMessage, 'Please log in to access the classroom.', true);
            showSection(authSection);
        }
    });

    navSettings.addEventListener('click', () => {
        if (currentUser) {
            showSection(settingsSection);
            settingsUsernameInput.value = currentUser.username || '';
            settingsEmailInput.value = currentUser.email || '';
        } else {
            displayMessage(authMessage, 'Please log in to access settings.', true);
            showSection(authSection);
        }
    });

    backToDashboardBtn.addEventListener('click', () => showSection(dashboardSection));
    backToDashboardFromSettingsBtn.addEventListener('click', () => showSection(dashboardSection));

    // --- Classroom Feature Switching ---
    showWhiteboardBtn.addEventListener('click', () => showClassroomFeature(whiteboardArea));
    showLibraryBtn.addEventListener('click', () => showClassroomFeature(libraryArea));
    showAssessmentBtn.addEventListener('click', () => showClassroomFeature(assessmentArea));

    // --- Whiteboard Functionality ---
    function initializeWhiteboard() {
        const dpr = window.devicePixelRatio || 1;
        const rect = whiteboardCanvas.getBoundingClientRect();
        whiteboardCanvas.width = rect.width * dpr;
        whiteboardCanvas.height = rect.height * dpr;
        whiteboardCtx.scale(dpr, dpr);

        whiteboardCtx.lineJoin = 'round';
        whiteboardCtx.lineCap = 'round';
        whiteboardCtx.lineWidth = 3;
        whiteboardCtx.strokeStyle = whiteboardColorInput.value;

        drawPage();
    }

    function drawPage() {
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#fff'; // White background
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        whiteboardPages[currentPageIndex].forEach(item => {
            whiteboardCtx.strokeStyle = item.color;
            whiteboardCtx.lineWidth = item.lineWidth;
            if (item.type === 'line') {
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.x1, item.y1);
                whiteboardCtx.lineTo(item.x2, item.y2);
                whiteboardCtx.stroke();
            } else if (item.type === 'text') {
                whiteboardCtx.font = item.font;
                whiteboardCtx.fillText(item.text, item.x, item.y);
            }
            // Add shape drawing logic here if needed
        });
    }

    whiteboardCanvas.addEventListener('mousedown', (e) => {
        drawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    whiteboardCanvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const currentX = e.offsetX;
        const currentY = e.offsetY;

        if (whiteboardTool === 'draw') {
            const data = {
                type: 'line',
                x1: lastX, y1: lastY,
                x2: currentX, y2: currentY,
                color: whiteboardColorInput.value,
                lineWidth: whiteboardCtx.lineWidth
            };
            whiteboardPages[currentPageIndex].push(data);
            drawPage(); // Redraw the entire page to reflect changes
            // Send whiteboard data over WebSocket
            if (chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
                chatWebSocket.send(JSON.stringify({ type: 'whiteboard-data', classroomId: currentClassroomId, data }));
            }
        }
        [lastX, lastY] = [currentX, currentY];
    });

    whiteboardCanvas.addEventListener('mouseup', () => drawing = false);
    whiteboardCanvas.addEventListener('mouseout', () => drawing = false);

    toolDrawBtn.addEventListener('click', () => whiteboardTool = 'draw');
    toolTextBtn.addEventListener('click', () => {
        whiteboardTool = 'text';
        const text = prompt('Enter text:');
        if (text) {
            whiteboardCanvas.addEventListener('click', function addText(e) {
                const x = e.offsetX;
                const y = e.offsetY;
                const data = {
                    type: 'text',
                    text: text,
                    x: x, y: y,
                    font: '20px Arial',
                    color: whiteboardColorInput.value
                };
                whiteboardPages[currentPageIndex].push(data);
                drawPage();
                if (chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
                    chatWebSocket.send(JSON.stringify({ type: 'whiteboard-data', classroomId: currentClassroomId, data }));
                }
                whiteboardCanvas.removeEventListener('click', addText); // Remove listener after adding text
            }, { once: true });
        }
    });
    toolShapeBtn.addEventListener('click', () => whiteboardTool = 'shape'); // Implement shape drawing logic here

    whiteboardColorInput.addEventListener('change', (e) => {
        whiteboardCtx.strokeStyle = e.target.value;
    });

    clearWhiteboardBtn.addEventListener('click', () => {
        whiteboardPages[currentPageIndex] = [];
        drawPage();
        if (chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
            chatWebSocket.send(JSON.stringify({ type: 'whiteboard-clear', classroomId: currentClassroomId, page: currentPageIndex }));
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPageIndex < whiteboardPages.length - 1) {
            currentPageIndex++;
        } else {
            whiteboardPages.push([]); // Add a new blank page
            currentPageIndex = whiteboardPages.length - 1;
        }
        drawPage();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPageIndex > 0) {
            currentPageIndex--;
        }
        drawPage();
    });

    // Handle window resize for canvas responsiveness
    window.addEventListener('resize', initializeWhiteboard);

    // --- Library Management ---
    libraryUploadBtn.addEventListener('click', async () => {
        const files = libraryUploadFile.files;
        if (files.length === 0) {
            alert('Please select files to upload.');
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('classroomId', currentClassroomId); // Attach classroom ID

        try {
            const response = await fetch('/api/upload-library-files', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                fetchLibraryFiles(); // Refresh file list
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('An error occurred during file upload.');
        }
    });

    async function fetchLibraryFiles() {
        if (!currentClassroomId) return;
        try {
            const response = await fetch(`/api/library-files/${currentClassroomId}`);
            const files = await response.json();
            libraryFileList.innerHTML = ''; // Clear existing list
            if (files.length > 0) {
                files.forEach(file => {
                    const li = document.createElement('li');
                    li.innerHTML = `${file.filename} <a href="${file.url}" target="_blank">Download</a>`;
                    libraryFileList.appendChild(li);
                });
            } else {
                libraryFileList.innerHTML = '<li>No files in library.</li>';
            }
        } catch (error) {
            console.error('Error fetching library files:', error);
            libraryFileList.innerHTML = '<li>Error loading files.</li>';
        }
    }

    // --- Assessment Preparation ---
    createAssessmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = assessmentTitleInput.value;
        const description = assessmentDescriptionInput.value;

        try {
            const response = await fetch('/api/create-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ classroomId: currentClassroomId, title, description, creator: currentUser.username })
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                createAssessmentForm.reset();
                fetchAssessments(); // Refresh assessment list
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            alert('An error occurred during assessment creation.');
        }
    });

    async function fetchAssessments() {
        if (!currentClassroomId) return;
        try {
            const response = await fetch(`/api/assessments/${currentClassroomId}`);
            const assessments = await response.json();
            assessmentList.innerHTML = ''; // Clear existing list
            if (assessments.length > 0) {
                assessments.forEach(assessment => {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <h4>${assessment.title}</h4>
                        <p>${assessment.description}</p>
                        <small>Created by: ${assessment.creator}</small>
                    `;
                    assessmentList.appendChild(div);
                });
            } else {
                assessmentList.innerHTML = '<p>No assessments created yet.</p>';
            }
        } catch (error) {
            console.error('Error fetching assessments:', error);
            assessmentList.innerHTML = '<p>Error loading assessments.</p>';
        }
    }

    // --- Chat Functionality (WebSocket) ---
    function connectChatWebSocket() {
        if (chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
            return; // Already connected
        }
        chatWebSocket = new WebSocket(`ws://${location.host}/ws/chat?classroomId=${currentClassroomId}&username=${currentUser.username}`);

        chatWebSocket.onopen = () => {
            console.log('Chat WebSocket connected');
            displayMessage(authMessage, 'Chat connected!', false);
        };

        chatWebSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat-message') {
                const p = document.createElement('p');
                p.textContent = `${data.username}: ${data.message}`;
                chatMessages.appendChild(p);
                chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
            } else if (data.type === 'whiteboard-data') {
                if (data.classroomId === currentClassroomId && data.page === currentPageIndex) {
                    whiteboardPages[currentPageIndex].push(data.data);
                    drawPage();
                }
            } else if (data.type === 'whiteboard-clear') {
                if (data.classroomId === currentClassroomId && data.page === currentPageIndex) {
                    whiteboardPages[currentPageIndex] = [];
                    drawPage();
                }
            } else if (data.type === 'ping') {
                // Ignore ping, just for keeping connection alive
            }
            // Add other real-time updates here (e.g., library file notifications, assessment updates)
        };

        chatWebSocket.onclose = () => {
            console.log('Chat WebSocket closed');
            displayMessage(authMessage, 'Chat disconnected. Attempting to reconnect...', true);
            setTimeout(connectChatWebSocket, 3000); // Attempt to reconnect after 3 seconds
        };

        chatWebSocket.onerror = (error) => {
            console.error('Chat WebSocket error:', error);
            displayMessage(authMessage, 'Chat connection error. See console.', true);
        };
    }

    sendChatBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message && chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
            chatWebSocket.send(JSON.stringify({ type: 'chat-message', classroomId: currentClassroomId, message: message }));
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatBtn.click();
        }
    });

    // --- Live Broadcast and Video Transmission (WebRTC + WebSocket Signaling) ---
    // This is a simplified example. A full WebRTC implementation is complex.
    // It involves STUN/TURN servers for NAT traversal.
    // For local testing, it might work without them.

    async function startLocalStream() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Could not access camera/microphone. Please ensure permissions are granted.');
        }
    }

    async function createPeerConnection() {
        broadcastPeerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' } // Google's public STUN server
            ]
        });

        localStream.getTracks().forEach(track => broadcastPeerConnection.addTrack(track, localStream));

        broadcastPeerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Send ICE candidate to remote peer via WebSocket
                if (chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
                    chatWebSocket.send(JSON.stringify({ type: 'webrtc-candidate', classroomId: currentClassroomId, candidate: event.candidate }));
                }
            }
        };

        broadcastPeerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };

        broadcastPeerConnection.onnegotiationneeded = async () => {
            try {
                const offer = await broadcastPeerConnection.createOffer();
                await broadcastPeerConnection.setLocalDescription(offer);
                // Send offer to remote peer via WebSocket
                if (chatWebSocket && chatWebSocket.readyState === WebSocket.OPEN) {
                    chatWebSocket.send(JSON.stringify({ type: 'webrtc-offer', classroomId: currentClassroomId, offer: broadcastPeerConnection.localDescription }));
                }
            } catch (error) {
                console.error('Error creating offer:', error);
            }
        };
    }

    startBroadcastBtn.addEventListener('click', async () => {
        await startLocalStream();
        await createPeerConnection();
        // The offer creation will be triggered by onnegotiationneeded
    });

    joinBroadcastBtn.addEventListener('click', async () => {
        await startLocalStream();
        await createPeerConnection();
        // For joining, we expect to receive an offer from the broadcaster
    });

    // WebSocket message handler for WebRTC signaling
    // This part should be integrated into the existing chatWebSocket.onmessage
    // (example of how the server would send and client would receive)
    // You'd add these inside your existing `chatWebSocket.onmessage` listener:
    /*
    if (data.type === 'webrtc-offer') {
        if (data.classroomId === currentClassroomId && !broadcastPeerConnection.currentRemoteDescription) {
            await broadcastPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await broadcastPeerConnection.createAnswer();
            await broadcastPeerConnection.setLocalDescription(answer);
            chatWebSocket.send(JSON.stringify({ type: 'webrtc-answer', classroomId: currentClassroomId, answer: broadcastPeerConnection.localDescription }));
        }
    } else if (data.type === 'webrtc-answer') {
        if (data.classroomId === currentClassroomId) {
            await broadcastPeerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    } else if (data.type === 'webrtc-candidate') {
        if (data.classroomId === currentClassroomId) {
            await broadcastPeerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    }
    */

    // --- Settings Update ---
    updateProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = settingsUsernameInput.value;
        // Email is disabled, so we won't send it unless it's editable
        // You might add password change here too

        try {
            const response = await fetch('/api/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}` // Assuming you get a token on login
                },
                body: JSON.stringify({ username: username, userId: currentUser.id }) // Send user ID for identification
            });
            const result = await response.json();
            if (response.ok) {
                displayMessage(authMessage, result.message, false); // Use general message area for now
                currentUser.username = username; // Update local user object
            } else {
                displayMessage(authMessage, result.error, true);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            displayMessage(authMessage, 'An error occurred during profile update.', true);
        }
    });

    // --- Initial Load ---
    // You might want to check for an existing session (e.g., from localStorage)
    // and automatically log in or navigate to dashboard if a token exists.
    // For this consolidated example, we start at the auth screen.

    // Initialize whiteboard once the DOM is ready and potentially when navigating to classroom
    // Call it here to set up canvas dimensions, etc., even if hidden initially.
    initializeWhiteboard();
});
