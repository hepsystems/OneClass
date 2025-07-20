// app.js (Updated with Text Input Functionality, Fixed Login Flow, and Classroom Logic)

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const app = document.getElementById('app');
    const authSection = document.getElementById('auth-section');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmail = document.getElementById('login-email'); // Ensure this is defined
    const loginPassword = document.getElementById('login-password'); // Ensure this is defined
    const registerUsername = document.getElementById('register-username'); // Added for register form
    const registerEmail = document.getElementById('register-email'); // Added for register form
    const registerPassword = document.getElementById('register-password'); // Added for register form
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
    const joinClassroomInput = document.getElementById('join-classroom-input');
    const joinClassroomBtn = document.getElementById('join-classroom-btn');
    const classroomList = document.getElementById('classroom-list'); // This is likely for *all* discoverable classrooms
    const noClassroomsMessage = document.getElementById('no-classrooms-message');
    const userClassroomList = document.getElementById('user-classroom-list'); // This is likely for classrooms user *is in*

    const classroomSection = document.getElementById('classroom-section');
    const classroomNameDisplay = document.getElementById('classroom-name-display');
    const classroomIdDetailDisplay = document.getElementById('classroom-id-detail-display');
    const leaveClassroomBtn = document.getElementById('leave-classroom-btn');
    const currentClassroomMembersList = document.getElementById('current-classroom-members-list');
    const onlineMembersCount = document.getElementById('online-members-count');
    const classroomHeader = document.getElementById('classroom-header');
    const inviteLinkInput = document.getElementById('invite-link-input');
    const copyInviteLinkBtn = document.getElementById('copy-invite-link-btn');
    const inviteSection = document.getElementById('invite-section');

    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendChatButton = document.getElementById('send-chat-button');
    const chatStatus = document.getElementById('chat-status');

    const notificationsContainer = document.getElementById('notifications-container');

    const whiteboardCanvas = document.getElementById('whiteboard-canvas');
    const whiteboardCtx = whiteboardCanvas ? whiteboardCanvas.getContext('2d') : null; // Initialize only if canvas exists
    const whiteboardControls = document.getElementById('whiteboard-controls');
    const toolButtons = document.querySelectorAll('#whiteboard-tools button');
    const colorPicker = document.getElementById('color-picker');
    const brushSizeSlider = document.getElementById('brush-size-slider');
    const clearWhiteboardBtn = document.getElementById('clear-whiteboard-btn');
    const pageNavPrevBtn = document.getElementById('page-nav-prev-btn');
    const pageNavNextBtn = document.getElementById('page-nav-next-btn');
    const currentPageDisplay = document.getElementById('current-page-display');
    const whiteboardRoleMessage = document.getElementById('whiteboard-role-message');
    const whiteboardPageDisplay = document.getElementById('whiteboard-page-display');
    const whiteboardModeToggle = document.getElementById('whiteboard-mode-toggle');

    // NEW: Text Input Elements
    const whiteboardTextInput = document.getElementById('whiteboard-text-input');
    const whiteboardTextInputFontSize = document.getElementById('whiteboard-text-input-font-size');


    const uploadFileBtn = document.getElementById('upload-file-btn');
    const fileInput = document.getElementById('file-input');
    const uploadedFilesList = document.getElementById('uploaded-files-list');
    const libraryFilesList = document.getElementById('library-files-list');
    const filesSection = document.getElementById('files-section');
    const fileSharingMessage = document.getElementById('file-sharing-message');
    const uploadLibraryFilesBtn = document.getElementById('upload-library-files-btn');
    const libraryFileInput = document.getElementById('library-file-input');
    const shareLinkInput = document.getElementById('share-link-input');
    const copyShareLinkBtn = document.getElementById('copy-share-link-btn');

    const assessmentSection = document.getElementById('assessment-section');
    const createAssessmentBtn = document.getElementById('create-assessment-btn');
    const createAssessmentContainer = document.getElementById('create-assessment-container');
    const assessmentCreationForm = document.getElementById('assessment-creation-form');
    const assessmentTitleInput = document.getElementById('assessment-title');
    const assessmentDescriptionInput = document.getElementById('assessment-description');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const questionsContainer = document.getElementById('questions-container');
    const questionCounter = document.getElementById('question-counter');
    const submitAssessmentBtn = document.getElementById('submit-assessment-btn');
    const assessmentMessage = document.getElementById('assessment-message');
    const assessmentListContainer = document.getElementById('assessment-list-container');
    const assessmentList = document.getElementById('assessment-list');
    const backToAssessmentListBtn = document.getElementById('back-to-assessment-list-btn');
    const takeAssessmentContainer = document.getElementById('take-assessment-container');
    const takeAssessmentTitle = document.getElementById('take-assessment-title');
    const takeAssessmentDescription = document.getElementById('take-assessment-description');
    const takeAssessmentForm = document.getElementById('take-assessment-form');
    const submitAnswersBtn = document.getElementById('submit-answers-btn');
    const assessmentSubmissionMessage = document.getElementById('assessment-submission-message');
    const backToAssessmentListFromSubmissionsBtn = document.getElementById('back-to-assessment-list-from-submissions-btn');
    const viewSubmissionsContainer = document.getElementById('view-submissions-container');
    const submissionsAssessmentTitle = document.getElementById('submissions-assessment-title');
    const submissionsList = document.getElementById('submissions-list');


    // --- Global Variables ---
    let socket;
    let currentUser = null; // This will be fetched or set after login
    let currentClassroom = null;
    let currentTool = 'pen';
    let currentColor = '#FFFFFF'; // Default color (white for dark canvas)
    let currentBrushSize = 5;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let snapshot = null; // To store canvas state for shapes
    let currentStrokePoints = []; // For pen/eraser smoothing

    let whiteboardPages = [
        []
    ]; // Array of arrays, each inner array is a page of drawings
    let currentPageIndex = 0;

    let localPeerConnection; // For WebRTC
    let localStream; // For WebRTC
    let remoteStreams = {}; // {peerId: MediaStream}
    let peerConnections = {}; // {peerId: RTCPeerConnection}

    let currentAssessmentToTake = null;
    let questionCount = 0; // For assessment creation form


    // --- Utility Functions ---
    function showSection(sectionId) {
        document.querySelectorAll('section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.add('active');
        document.getElementById(sectionId).classList.remove('hidden');
    }

    function createNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.classList.add('notification-message', type);
        notification.textContent = message;
        notificationsContainer.prepend(notification); // Add to the beginning

        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    function getCoords(e) {
        const rect = whiteboardCanvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function applyDrawingProperties(ctx, tool, color, width) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.fillStyle = color; // For shapes like filled circles/rectangles

        if (tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.lineCap = 'round'; // Makes lines rounder
        ctx.lineJoin = 'round'; // Makes corners rounder
    }

    // --- Whiteboard Functions ---
    function initializeWhiteboard() {
        if (!whiteboardCanvas || !whiteboardCtx) {
            console.error('Whiteboard canvas or context not found.');
            return;
        }
        // Set canvas size dynamically or to a fixed size
        whiteboardCanvas.width = whiteboardCanvas.offsetWidth;
        whiteboardCanvas.height = whiteboardCanvas.offsetHeight;

        // Initial background fill (important for 'destination-out' eraser mode)
        whiteboardCtx.fillStyle = '#000000'; // Black background
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        // Render the current page content
        renderCurrentWhiteboardPage();
    }

    function renderCurrentWhiteboardPage() {
        if (!whiteboardCtx) return;

        // Clear canvas
        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        whiteboardCtx.fillStyle = '#000000'; // Re-fill with black
        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);

        // Draw all items for the current page
        const currentPage = whiteboardPages[currentPageIndex];
        if (currentPage) {
            currentPage.forEach(item => {
                whiteboardCtx.save();
                applyDrawingProperties(whiteboardCtx, item.data.tool, item.data.color || item.data.fontColor, item.data.width);
                drawWhiteboardItem(item.data); // Pass only the data part
                whiteboardCtx.restore();
            });
        }
    }


    function drawWhiteboardItem(item) {
        if (!whiteboardCtx) return;
        whiteboardCtx.save(); // Save context state before applying item-specific properties

        applyDrawingProperties(whiteboardCtx, item.tool, item.color || item.fontColor, item.width);

        if (item.tool === 'pen' || item.tool === 'eraser') {
            // This handles both historical full strokes and live segments
            if (item.points && Array.isArray(item.points)) {
                // For historical strokes (from handleMouseUp before fix or from server history of full strokes)
                whiteboardCtx.beginPath();
                if (item.points.length > 0) {
                    whiteboardCtx.moveTo(item.points[0].x, item.points[0].y);
                    for (let i = 1; i < item.points.length; i++) {
                        // Using quadraticCurveTo to match the smoothing logic if possible
                        // Or simplify to lineTo if smoothing isn't critical for playback
                        const midX = (item.points[i].x + item.points[i - 1].x) / 2;
                        const midY = (item.points[i].y + item.points[i - 1].y) / 2;
                        whiteboardCtx.quadraticCurveTo(item.points[i - 1].x, item.points[i - 1].y, midX, midY);
                    }
                    whiteboardCtx.lineTo(item.points[item.points.length - 1].x, item.points[item.points.length - 1].y); // Ensure last point is drawn
                }
                whiteboardCtx.stroke();
            } else if (item.prevX !== undefined && item.prevY !== undefined && item.currX !== undefined && item.currY !== undefined) {
                // This is for individual segments as emitted by the new handleMouseMove
                whiteboardCtx.beginPath();
                whiteboardCtx.moveTo(item.prevX, item.prevY);
                // Replicate smoothing logic or just draw a straight line segment
                // For simple segments, a straight line is fine, but quadraticCurveTo provides smoothing
                whiteboardCtx.quadraticCurveTo(item.prevX, item.prevY, (item.currX + item.prevX) / 2, (item.currY + item.prevY) / 2);
                whiteboardCtx.stroke();
            }
        } else if (item.tool === 'line') {
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(item.startX, item.startY);
            whiteboardCtx.lineTo(item.endX, item.endY);
            whiteboardCtx.stroke();
        } else if (item.tool === 'rectangle') {
            whiteboardCtx.beginPath();
            whiteboardCtx.rect(item.startX, item.startY, item.endX - item.startX, item.Y - item.startY);
            whiteboardCtx.stroke();
        } else if (item.tool === 'circle') {
            const radius = Math.sqrt(Math.pow(item.endX - item.startX, 2) + Math.pow(item.endY - item.startY, 2)) / 2;
            const centerX = item.startX + (item.endX - item.startX) / 2;
            const centerY = item.startY + (item.endY - item.startY) / 2;
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            whiteboardCtx.stroke();
        } else if (item.tool === 'text') {
            // NEW: Handle text drawing
            if (item.content) {
                whiteboardCtx.fillStyle = item.fontColor || '#FFFFFF'; // Default to white if no color
                whiteboardCtx.font = `${item.fontSize || '24px'} ${item.fontFamily || 'Arial'}`;
                whiteboardCtx.textBaseline = 'top'; // Position text from its top-left corner
                whiteboardCtx.fillText(item.content, item.x, item.y);
            }
        }
        whiteboardCtx.restore(); // Restore context state
    }


    /**
     * Handles the start of a drawing action (mousedown or touchstart).
     */
    function handleMouseDown(e) {
        if (currentTool === 'text' && currentUser && currentUser.role === 'admin') {
            const coords = getCoords(e);
            textInputX = coords.x;
            textInputY = coords.y;

            whiteboardTextInput.style.left = `${textInputX}px`;
            whiteboardTextInput.style.top = `${textInputY}px`;
            whiteboardTextInput.style.color = currentColor; // Set text input color
            whiteboardTextInput.style.fontSize = whiteboardTextInputFontSize.value + 'px';
            whiteboardTextInput.classList.remove('hidden');
            whiteboardTextInput.focus(); // Focus the input for typing
            return; // Prevent other drawing actions
        }

        if (!currentUser || currentUser.role !== 'admin') {
            createNotification("Only administrators can draw on the whiteboard.", "warning");
            return;
        }

        if (currentTool === 'text') return; // Text input is handled separately

        isDrawing = true;
        const coords = getCoords(e);
        startX = coords.x;
        startY = coords.y;
        lastX = startX;
        lastY = startY;

        whiteboardCtx.beginPath();
        whiteboardCtx.moveTo(startX, startY);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            currentStrokePoints = [{
                x: startX,
                y: startY
            }];
        } else {
            // Take a snapshot for shapes to draw a preview without affecting existing canvas content
            snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        }
    }

    /**
     * Handles the movement during a drawing action (mousemove or touchmove).
     * Includes stroke smoothing and line interpolation for pen/eraser.
     */
    function handleMouseMove(e) {
        if (!isDrawing || !currentUser || currentUser.role !== 'admin' || currentTool === 'text') return;
        e.preventDefault(); // Prevent scrolling on touch devices during drawing

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

            // Add current point to the stroke points array (for local history, though not emitted segment by segment)
            // currentStrokePoints.push({ x: currentX, y: currentY }); // This was for batching, can remove if only emitting segments

            // Stroke Smoothing and Line Interpolation using Quadratic Bezier Curve
            // Draw a segment from the last point to the current point,
            // using the last point as the control point for a smoother curve.
            whiteboardCtx.quadraticCurveTo(lastX, lastY, (currentX + lastX) / 2, (currentY + lastY) / 2);
            whiteboardCtx.stroke();

            // Move to the midpoint for the start of the next segment
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo((currentX + lastX) / 2, (currentY + lastY) / 2);

            // Emit this segment
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
                    },
                    pageIndex: currentPageIndex // Ensure pageIndex is also at top level for server
                });
            }

            lastX = currentX;
            lastY = currentY;

        } else {
            // For shapes, restore snapshot and redraw preview
            if (snapshot) {
                whiteboardCtx.putImageData(snapshot, 0, 0);
            } else {
                // Fallback if snapshot is somehow missing (shouldn't happen)
                renderCurrentWhiteboardPage();
            }
            drawWhiteboardItem({
                tool: currentTool,
                startX,
                startY,
                endX: currentX,
                endY: currentY,
                color: currentColor,
                width: currentBrushSize
            });
        }
        whiteboardCtx.restore();
    }

    /**
     * Handles the end of a drawing action (mouseup or touchend).
     */
    function handleMouseUp(e) {
        if (!isDrawing || !currentUser || currentUser.role !== 'admin') return;
        isDrawing = false;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            // Finish the last segment of the stroke (for local rendering consistency)
            whiteboardCtx.lineTo(lastX, lastY); // Ensure the last point is drawn
            whiteboardCtx.stroke();
            whiteboardCtx.closePath(); // Close the current path for pen/eraser

            // For pen/eraser, segments are already emitted in handleMouseMove.
            // We still need to save the final stroke to local history for undo/redo and page rendering.
            // If you want to save each segment locally too, you'd push them individually
            // to whiteboardPages[currentPageIndex]. Here we simplify by storing the path
            // to allow full stroke redraw from history.
            // You might need to manage `currentStrokePoints` more carefully if you combine
            // segment-by-segment rendering with full stroke history.
            // A simpler approach for history might be to re-render from server data when page loads.
            // For now, let's ensure the full path for local history.
            const finalStrokeData = {
                tool: currentTool,
                points: currentStrokePoints, // Re-collect points or ensure they were collected
                color: currentColor,
                width: currentBrushSize
            };
            whiteboardPages[currentPageIndex].push({
                action: 'draw',
                data: finalStrokeData
            });
            currentStrokePoints = []; // Clear for next stroke

        } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
            const finalCoords = getCoords(e);
            const currentX = finalCoords.x;
            const currentY = finalCoords.y;

            // Redraw existing to reset canvas state, then draw final shape
            renderCurrentWhiteboardPage(); // This ensures shapes are drawn over existing content

            whiteboardCtx.save();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = currentBrushSize;

            const shapeData = {
                startX,
                startY,
                endX: currentX,
                endY: currentY,
                color: currentColor,
                width: currentBrushSize,
                tool: currentTool
            };

            drawWhiteboardItem(shapeData); // Draw the final shape
            whiteboardCtx.restore();

            // Emit the final shape data to the server
            socket.emit('whiteboard_data', {
                action: 'draw',
                classroomId: currentClassroom.id,
                data: shapeData,
                pageIndex: currentPageIndex
            });

            whiteboardPages[currentPageIndex].push({
                action: 'draw',
                data: shapeData
            }); // Save to local history
        }

        // Reset eraser mode if it was active
        if (whiteboardCtx.globalCompositeOperation === 'destination-out') {
            whiteboardCtx.globalCompositeOperation = 'source-over';
        }

        // saveState(); // Save for undo/redo - ensure this handles segmented data if used
    }

    // NEW: Function to emit text data (placed here so it has access to global variables)
    let textInputX = 0;
    let textInputY = 0;

    function emitWhiteboardText() {
        const textContent = whiteboardTextInput.value.trim();
        if (textContent === '' || !socket || !currentClassroom || !currentClassroom.id) {
            whiteboardTextInput.classList.add('hidden'); // Hide if empty
            return;
        }

        const fontSize = whiteboardTextInputFontSize.value + 'px'; // e.g., "24px"
        const fontColor = currentColor; // Use the currently selected color
        const fontFamily = 'Arial'; // You can make this configurable

        const textData = {
            tool: 'text',
            x: textInputX,
            y: textInputY,
            content: textContent,
            fontSize: fontSize,
            fontColor: fontColor,
            fontFamily: fontFamily
        };

        // Emit text data with 'draw' action
        socket.emit('whiteboard_data', {
            action: 'draw', // Using 'draw' action for text for server simplicity
            classroomId: currentClassroom.id,
            data: textData,
            pageIndex: currentPageIndex
        });

        // Store locally for immediate display and history
        if (!whiteboardPages[currentPageIndex]) {
            whiteboardPages[currentPageIndex] = [];
        }
        whiteboardPages[currentPageIndex].push({
            action: 'draw',
            data: textData
        });

        // Clear and hide the text input after emitting
        whiteboardTextInput.value = '';
        whiteboardTextInput.classList.add('hidden');

        // Re-render the current page to include the newly added text
        // This is crucial to ensure it's drawn on the canvas after input is hidden
        renderCurrentWhiteboardPage();
    }


    // --- Whiteboard Page Navigation ---
    function updateWhiteboardPageDisplay() {
        if (whiteboardPageDisplay) {
            whiteboardPageDisplay.textContent = `Page ${currentPageIndex + 1}/${whiteboardPages.length}`;
        }
        pageNavPrevBtn.disabled = currentPageIndex === 0;
        pageNavNextBtn.disabled = currentPageIndex === whiteboardPages.length - 1;
    }

    function goToWhiteboardPage(index) {
        if (index >= 0 && index < whiteboardPages.length) {
            currentPageIndex = index;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            // Emit page change to server if you want to sync page views
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('whiteboard_page_change', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex
                });
            }
        } else if (index === whiteboardPages.length) {
            // Create a new page if going beyond last existing page
            whiteboardPages.push([]);
            currentPageIndex = index;
            renderCurrentWhiteboardPage();
            updateWhiteboardPageDisplay();
            if (socket && currentClassroom && currentClassroom.id) {
                socket.emit('whiteboard_page_change', {
                    classroomId: currentClassroom.id,
                    pageIndex: currentPageIndex,
                    action: 'newPage' // Indicate a new page was created
                });
            }
        }
    }


    // --- Socket.IO Handlers ---
    function initializeSocketIO() {
        // Ensure socket is only initialized once
        if (socket) return;

        socket = io({
            withCredentials: true
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server');
            createNotification('Connected to server.', 'success');
            if (currentUser && currentUser.classroom_id && currentClassroom) {
                // If currentUser is already associated with a classroom from checkLoginStatus, join it.
                // Otherwise, the join_classroom API call will handle it.
                socket.emit('join_classroom', {
                    classroomId: currentClassroom.id
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
            createNotification('Disconnected from server.', 'danger');
            chatStatus.textContent = 'Disconnected';
            onlineMembersCount.textContent = '0';
        });

        socket.on('classroom_joined', (data) => {
            console.log('Joined classroom:', data);
            createNotification(`Joined classroom: ${data.classroom_name}`, 'info');
            currentClassroom = data;
            classroomIdDisplay.textContent = currentClassroom.id;
            classroomNameDisplay.textContent = currentClassroom.name;
            classroomIdDetailDisplay.textContent = currentClassroom.id;
            inviteLinkInput.value = `${window.location.origin}/?join=${currentClassroom.id}`; // Generate invite link

            if (data.whiteboard_history) {
                whiteboardPages = data.whiteboard_history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages.push([]); // Ensure at least one page
                }
                currentPageIndex = data.current_page_index || 0; // Load server's current page
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
            }

            // Fetch initial file list for the classroom
            fetchUploadedFiles();
            fetchLibraryFiles();

            showSection('classroom-section');
            updateUIBasedOnRole();
        });

        socket.on('user_joined', (data) => {
            createNotification(`${data.username} has joined the classroom.`, 'info');
            updateClassroomMembers(data.members);
        });

        socket.on('user_left', (data) => {
            createNotification(`${data.username} has left the classroom.`, 'info');
            updateClassroomMembers(data.members);
        });

        socket.on('members_update', (data) => {
            updateClassroomMembers(data.members);
        });

        socket.on('new_chat_message', (data) => {
            addChatMessage(data.username, data.message, data.timestamp);
        });

        socket.on('whiteboard_data', (data) => {
            // Parses and draws incoming updates
            console.log('[Whiteboard] Received whiteboard_data:', data);

            if (!whiteboardCtx) {
                console.warn('Whiteboard canvas context not available, cannot draw incoming data.');
                return;
            }

            const action = data.action;
            const drawingItem = data.data; // This is the segment or shape data or text data
            const pageIndex = data.pageIndex;
            const senderId = data.sender_sid; // Server should provide sender_sid

            // Skip drawing if it's from this client (to prevent drawing twice)
            if (senderId && senderId === socket.id) {
                // console.log("Skipping drawing from self");
                return;
            }

            if (action === 'draw') {
                if (drawingItem && typeof pageIndex !== 'undefined') {
                    // Ensure the page array exists
                    if (!whiteboardPages[pageIndex]) {
                        whiteboardPages[pageIndex] = [];
                    }
                    whiteboardPages[pageIndex].push({
                        action: 'draw',
                        data: drawingItem
                    }); // Store for history

                    if (pageIndex === currentPageIndex) {
                        whiteboardCtx.save();
                        // applyDrawingProperties is called inside drawWhiteboardItem for each item
                        drawWhiteboardItem(drawingItem); // Assumes drawWhiteboardItem can handle segments or full shapes or text
                        whiteboardCtx.restore();
                    }
                }
            } else if (action === 'clear') {
                if (typeof pageIndex !== 'undefined') {
                    whiteboardPages[pageIndex] = []; // Clear local data
                    if (pageIndex === currentPageIndex) {
                        whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                        whiteboardCtx.fillStyle = '#000000'; // Fill with black after clearing
                        whiteboardCtx.fillRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
                    }
                }
            } else if (action === 'history' && data.history) {
                // This might be sent when a new user joins or requests history
                whiteboardPages = data.history;
                if (whiteboardPages.length === 0) {
                    whiteboardPages.push([]); // Ensure at least one page
                }
                currentPageIndex = data.currentPageIndex || 0; // Sync current page too
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();
            }
        });

        socket.on('whiteboard_page_change', (data) => {
            const newPageIndex = data.pageIndex;
            const action = data.action; // 'newPage' if created

            // Don't switch if sender is current client and this is not a new page
            if (data.sender_sid && data.sender_sid === socket.id && action !== 'newPage') {
                return;
            }

            if (action === 'newPage' && newPageIndex === whiteboardPages.length) {
                whiteboardPages.push([]); // Add new page if server indicates creation
                createNotification(`Admin created a new whiteboard page: Page ${newPageIndex + 1}`, 'info');
            }
            goToWhiteboardPage(newPageIndex); // Switch to the received page index
            createNotification(`Whiteboard page changed to ${newPageIndex + 1}`, 'info');
        });

        socket.on('file_uploaded', (data) => {
            createNotification(`New file uploaded: ${data.filename}`, 'info');
            fetchUploadedFiles(); // Refresh list to show new file
            fetchLibraryFiles(); // Refresh library files as well
        });

        socket.on('file_deleted', (data) => {
            createNotification(`File deleted: ${data.filename}`, 'info');
            fetchUploadedFiles(); // Refresh list
            fetchLibraryFiles();
        });

        socket.on('assessment_created', (data) => {
            createNotification(`New assessment "${data.title}" created by ${data.creator_username}.`, 'info');
            loadAssessments(); // Refresh the list of assessments
        });

        socket.on('assessment_deleted', (data) => {
            createNotification(`Assessment "${data.title}" deleted.`, 'info');
            loadAssessments();
        });

        socket.on('assessment_submitted', (data) => {
            createNotification(`Assessment "${data.title}" submitted by ${data.submitter_username}.`, 'info');
            // Admins might want to refresh submission list, users might get a confirmation
        });

        socket.on('admin_action_update', (data) => {
            createNotification(`Admin action: ${data.message}`, 'info');
        });


        // WebRTC Signaling
        socket.on('webrtc_offer', async (data) => {
            console.log('WEBRTC: Received offer from', data.sender_id);
            const peerId = data.sender_id;
            await setupPeerConnection(peerId, true); // Create PC, create answer, set remote description
            if (peerConnections[peerId]) {
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnections[peerId].createAnswer();
                await peerConnections[peerId].setLocalDescription(answer);
                socket.emit('webrtc_answer', {
                    answer: answer,
                    recipient_id: peerId,
                    classroomId: currentClassroom.id
                });
            }
        });

        socket.on('webrtc_answer', async (data) => {
            console.log('WEBRTC: Received answer from', data.sender_id);
            const peerId = data.sender_id;
            if (peerConnections[peerId]) {
                await peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        socket.on('webrtc_ice_candidate', async (data) => {
            console.log('WEBRTC: Received ICE candidate from', data.sender_id);
            const peerId = data.sender_id;
            if (peerConnections[peerId] && data.candidate) {
                try {
                    await peerConnections[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding received ICE candidate:', e);
                }
            }
        });

        socket.on('webrtc_peer_disconnected', (data) => {
            console.log('WEBRTC: Peer disconnected:', data.peer_id);
            const peerId = data.peer_id;
            if (peerConnections[peerId]) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                // Remove video element if applicable
                const remoteVideo = document.getElementById(`video-${peerId}`);
                if (remoteVideo) remoteVideo.remove();
            }
        });
    }

    // --- WebRTC Functions ---
    async function startWebRTC() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            // Add local stream to a local video element if desired
            // const localVideo = document.createElement('video');
            // localVideo.srcObject = localStream;
            // localVideo.autoplay = true;
            // localVideo.muted = true; // Mute local preview
            // document.getElementById('local-video-container').appendChild(localVideo);

            console.log('Local stream obtained:', localStream);
            // After getting local stream, signal presence to others in the room
            // and set up connections for existing members
        } catch (error) {
            console.error('Error accessing media devices:', error);
            createNotification('Error accessing camera/microphone. Please ensure permissions are granted.', 'danger');
        }
    }

    async function setupPeerConnection(peerId, isOfferer = false) {
        if (peerConnections[peerId]) return peerConnections[peerId]; // Already exists

        const pc = new RTCPeerConnection({
            iceServers: [{
                urls: 'stun:stun.l.google.com:19302'
            }] // Google's public STUN server
        });
        peerConnections[peerId] = pc;

        // Add local stream tracks to the peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc_ice_candidate', {
                    recipient_id: peerId,
                    candidate: event.candidate,
                    classroomId: currentClassroom.id
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('WEBRTC: Remote stream received from', peerId);
            if (!remoteStreams[peerId]) {
                remoteStreams[peerId] = new MediaStream();
                const remoteVideo = document.createElement('video');
                remoteVideo.id = `video-${peerId}`;
                remoteVideo.srcObject = remoteStreams[peerId];
                remoteVideo.autoplay = true;
                document.getElementById('remote-videos-container').appendChild(remoteVideo); // Assuming this container exists
            }
            event.streams[0].getTracks().forEach(track => {
                remoteStreams[peerId].addTrack(track);
            });
        };

        if (isOfferer) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc_offer', {
                offer: offer,
                recipient_id: peerId,
                classroomId: currentClassroom.id
            });
        }
        return pc;
    }


    // --- Classroom Member List ---
    function updateClassroomMembers(members) {
        currentClassroomMembersList.innerHTML = '';
        onlineMembersCount.textContent = members.length;
        members.forEach(member => {
            const li = document.createElement('li');
            li.textContent = member.username + (member.role === 'admin' ? ' (Admin)' : '');
            li.classList.add('member-item');
            if (member.socket_id === socket.id) {
                li.classList.add('self');
            }
            currentClassroomMembersList.appendChild(li);

            // WebRTC: If a new peer joins, set up a connection for them
            if (member.socket_id !== socket.id && !peerConnections[member.socket_id]) {
                // If we are the 'older' client, create an offer to the new peer
                // This logic might need refinement for multiple peers to avoid N offers/answers
                // For simplicity, let's assume one peer initiates if currentStream is available
                if (localStream && currentClassroom) { // Ensure currentClassroom is set
                    setupPeerConnection(member.socket_id, true);
                }
            }
        });

        // Clean up peer connections for members who have left
        for (const peerId in peerConnections) {
            if (!members.some(m => m.socket_id === peerId)) {
                peerConnections[peerId].close();
                delete peerConnections[peerId];
                const remoteVideo = document.getElementById(`video-${peerId}`);
                if (remoteVideo) remoteVideo.remove();
            }
        }
    }

    // --- Chat Functions ---
    function addChatMessage(username, message, timestamp) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        const time = new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        messageElement.innerHTML = `<strong>${username}</strong> <span class="timestamp">${time}</span><p>${message}</p>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
    }


    // --- File Sharing Functions ---
    async function fetchUploadedFiles() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/classroom/${currentClassroom.id}/files/uploaded`);
            const data = await response.json();
            if (response.ok) {
                displayUploadedFiles(data.files);
            } else {
                createNotification(`Error fetching uploaded files: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error fetching uploaded files:', error);
            createNotification('Network error fetching uploaded files.', 'danger');
        }
    }

    function displayUploadedFiles(files) {
        uploadedFilesList.innerHTML = '';
        if (files.length === 0) {
            uploadedFilesList.innerHTML = '<p>No files uploaded yet.</p>';
            return;
        }
        files.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${file.filename} (${(file.size / 1024).toFixed(2)} KB)</span>
                <a href="/uploads/${file.filename}" target="_blank" class="download-btn" title="Download"><i class="fas fa-download"></i></a>
                ${currentUser && currentUser.role === 'admin' ? `<button class="delete-file-btn" data-filename="${file.filename}" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
            `;
            uploadedFilesList.appendChild(li);
        });

        document.querySelectorAll('.delete-file-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const filename = e.currentTarget.dataset.filename;
                if (confirm(`Are you sure you want to delete "${filename}"?`)) {
                    try {
                        const response = await fetch(`/api/classroom/${currentClassroom.id}/file/delete/${filename}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });
                        const data = await response.json();
                        if (response.ok) {
                            createNotification(`File "${filename}" deleted successfully.`, 'success');
                            // Server will emit 'file_deleted', which will trigger fetchUploadedFiles()
                        } else {
                            createNotification(`Error deleting file: ${data.error}`, 'danger');
                        }
                    } catch (error) {
                        console.error('Error deleting file:', error);
                        createNotification('Network error deleting file.', 'danger');
                    }
                }
            });
        });
    }

    async function fetchLibraryFiles() {
        if (!currentClassroom) return;
        try {
            const response = await fetch(`/api/library/files?classroomId=${currentClassroom.id}`);
            const data = await response.json();
            if (response.ok) {
                displayLibraryFiles(data.files);
            } else {
                createNotification(`Error fetching library files: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error fetching library files:', error);
            createNotification('Network error fetching library files.', 'danger');
        }
    }

    function displayLibraryFiles(files) {
        libraryFilesList.innerHTML = '';
        if (files.length === 0) {
            libraryFilesList.innerHTML = '<p>No library files available.</p>';
            return;
        }
        files.forEach(file => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${file.filename} (${(file.size / 1024).toFixed(2)} KB) - Shared by ${file.username}</span>
                <a href="${file.url}" target="_blank" class="download-btn" title="View/Download"><i class="fas fa-eye"></i></a>
                ${currentUser && currentUser.role === 'admin' ? `<button class="delete-library-file-btn" data-file-id="${file._id}" title="Delete from Library"><i class="fas fa-trash"></i></button>` : ''}
            `;
            libraryFilesList.appendChild(li);
        });

        document.querySelectorAll('.delete-library-file-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fileId = e.currentTarget.dataset.fileId;
                if (confirm('Are you sure you want to delete this library file?')) {
                    try {
                        const response = await fetch(`/api/library/file/delete/${fileId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });
                        const data = await response.json();
                        if (response.ok) {
                            createNotification(`Library file deleted successfully.`, 'success');
                            fetchLibraryFiles(); // Refresh list
                        } else {
                            createNotification(`Error deleting library file: ${data.error}`, 'danger');
                        }
                    } catch (error) {
                        console.error('Error deleting library file:', error);
                        createNotification('Network error deleting library file.', 'danger');
                    }
                }
            });
        });
    }


    // --- Assessment Functions ---
    async function loadAssessments() {
        showSection('assessment-section');
        createAssessmentContainer.classList.add('hidden');
        assessmentListContainer.classList.remove('hidden');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/assessments', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                displayAssessments(data.assessments);
            } else {
                createNotification(`Error loading assessments: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error loading assessments:', error);
            createNotification('Network error loading assessments.', 'danger');
        }
    }

    function displayAssessments(assessments) {
        assessmentList.innerHTML = '';
        if (assessments.length === 0) {
            assessmentList.innerHTML = '<p>No assessments available.</p>';
            return;
        }
        assessments.forEach(assessment => {
            const li = document.createElement('li');
            const isAdmin = currentUser && currentUser.role === 'admin';
            li.innerHTML = `
                <h4>${assessment.title}</h4>
                <p>${assessment.description}</p>
                <p>Created by: ${assessment.creator_username}</p>
                <div class="assessment-actions">
                    <button class="take-assessment-btn" data-assessment-id="${assessment._id}">Take Assessment</button>
                    ${isAdmin ? `<button class="view-submissions-btn" data-assessment-id="${assessment._id}" data-assessment-title="${assessment.title}">View Submissions</button>` : ''}
                    ${isAdmin ? `<button class="delete-assessment-btn" data-assessment-id="${assessment._id}" data-assessment-title="${assessment.title}">Delete</button>` : ''}
                </div>
            `;
            assessmentList.appendChild(li);
        });

        document.querySelectorAll('.take-assessment-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assessmentId = e.currentTarget.dataset.assessmentId;
                fetchAssessmentToTake(assessmentId);
            });
        });

        document.querySelectorAll('.view-submissions-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const assessmentId = e.currentTarget.dataset.assessmentId;
                const assessmentTitle = e.currentTarget.dataset.assessmentTitle;
                fetchSubmissions(assessmentId, assessmentTitle);
            });
        });

        document.querySelectorAll('.delete-assessment-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const assessmentId = e.currentTarget.dataset.assessmentId;
                const assessmentTitle = e.currentTarget.dataset.assessmentTitle;
                if (confirm(`Are you sure you want to delete the assessment "${assessmentTitle}"?`)) {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`/api/assessments/${assessmentId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const data = await response.json();
                        if (response.ok) {
                            createNotification(`Assessment "${assessmentTitle}" deleted successfully.`, 'success');
                            // Server will emit 'assessment_deleted', which will trigger loadAssessments()
                        } else {
                            createNotification(`Error deleting assessment: ${data.error}`, 'danger');
                        }
                    } catch (error) {
                        console.error('Error deleting assessment:', error);
                        createNotification('Network error deleting assessment.', 'danger');
                    }
                }
            });
        });
    }

    async function fetchAssessmentToTake(assessmentId) {
        showSection('assessment-section');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.remove('hidden');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/assessments/${assessmentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                currentAssessmentToTake = data.assessment;
                displayAssessmentToTake(currentAssessmentToTake);
            } else {
                createNotification(`Error fetching assessment: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error fetching assessment:', error);
            createNotification('Network error fetching assessment.', 'danger');
        }
    }

    function displayAssessmentToTake(assessment) {
        takeAssessmentTitle.textContent = assessment.title;
        takeAssessmentDescription.textContent = assessment.description;
        takeAssessmentForm.innerHTML = ''; // Clear previous questions
        assessmentSubmissionMessage.textContent = ''; // Clear previous message
        submitAnswersBtn.classList.remove('hidden');

        assessment.questions.forEach((q, qIndex) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('assessment-question');
            questionDiv.innerHTML = `
                <p><strong>${qIndex + 1}. ${q.question_text}</strong></p>
            `;
            if (q.type === 'mcq') {
                q.options.forEach((option, oIndex) => {
                    questionDiv.innerHTML += `
                        <label>
                            <input type="radio" name="question-${qIndex}" value="${option}" required>
                            ${option}
                        </label><br>
                    `;
                });
            } else if (q.type === 'short_answer') {
                questionDiv.innerHTML += `
                    <textarea name="question-${qIndex}" rows="3" placeholder="Your answer" required></textarea>
                `;
            }
            takeAssessmentForm.appendChild(questionDiv);
        });
    }

    async function submitAssessmentAnswers(assessmentId, answers) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    answers
                })
            });
            const data = await response.json();
            if (response.ok) {
                assessmentSubmissionMessage.textContent = 'Assessment submitted successfully!';
                assessmentSubmissionMessage.style.color = 'green';
                submitAnswersBtn.classList.add('hidden');
                createNotification('Your assessment has been submitted!', 'success');
                // Server will emit 'assessment_submitted'
            } else {
                assessmentSubmissionMessage.textContent = `Error: ${data.error}`;
                assessmentSubmissionMessage.style.color = 'red';
                createNotification(`Error submitting assessment: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            assessmentSubmissionMessage.textContent = 'Network error during submission.';
            assessmentSubmissionMessage.style.color = 'red';
            createNotification('Network error submitting assessment.', 'danger');
        }
    }

    async function fetchSubmissions(assessmentId, assessmentTitle) {
        showSection('assessment-section');
        assessmentListContainer.classList.add('hidden');
        takeAssessmentContainer.classList.add('hidden');
        viewSubmissionsContainer.classList.remove('hidden');
        submissionsAssessmentTitle.textContent = assessmentTitle;
        submissionsList.innerHTML = '<p>Loading submissions...</p>';

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/assessments/${assessmentId}/submissions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                displaySubmissions(data.submissions);
            } else {
                createNotification(`Error fetching submissions: ${data.error}`, 'danger');
                submissionsList.innerHTML = `<p>Error: ${data.error}</p>`;
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
            createNotification('Network error fetching submissions.', 'danger');
            submissionsList.innerHTML = '<p>Network error fetching submissions.</p>';
        }
    }

    function displaySubmissions(submissions) {
        submissionsList.innerHTML = '';
        if (submissions.length === 0) {
            submissionsList.innerHTML = '<p>No submissions yet.</p>';
            return;
        }

        submissions.forEach(submission => {
            const submissionDiv = document.createElement('div');
            submissionDiv.classList.add('submission-item');
            const submitDate = new Date(submission.submitted_at).toLocaleString();
            submissionDiv.innerHTML = `
                <h4>Submission by: ${submission.username}</h4>
                <p>Submitted On: ${submitDate}</p>
                <h5>Answers:</h5>
                <ul>
            `;
            submission.answers.forEach((answer, index) => {
                submissionDiv.innerHTML += `<li>Q${index + 1}: ${answer.answer}</li>`;
            });
            submissionDiv.innerHTML += `</ul>`;
            submissionsList.appendChild(submissionDiv);
        });
    }

    // --- Authentication and User Management ---
    async function checkLoginStatus() {
        const token = localStorage.getItem('token');
        if (!token) {
            showSection('auth-section');
            return;
        }

        try {
            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                currentUser = data.user;
                currentUsernameDisplay.textContent = currentUser.username;
                if (currentUser.classroom_id) {
                    // User is already in a classroom, try to join it
                    fetchClassroomDetailsAndJoin(currentUser.classroom_id);
                } else {
                    showSection('dashboard-section');
                    loadUserClassrooms(); // Load classrooms for the dashboard
                }
            } else {
                localStorage.removeItem('token'); // Invalid token
                showSection('auth-section');
                createNotification(`Session expired: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            localStorage.removeItem('token');
            showSection('auth-section');
            createNotification('Network error, please try again.', 'danger');
        }
    }

    async function fetchClassroomDetailsAndJoin(classroomId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classroom/${classroomId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                currentClassroom = data.classroom;
                initializeSocketIO(); // Initialize Socket.IO here
                // Socket.IO 'connect' event will handle joining the classroom room
            } else {
                createNotification(`Error joining classroom: ${data.error}`, 'danger');
                // If classroom doesn't exist or user can't join, redirect to dashboard
                await leaveClassroom(false); // Force leave if server says problem
                showSection('dashboard-section');
            }
        } catch (error) {
            console.error('Error fetching classroom details:', error);
            createNotification('Network error fetching classroom details.', 'danger');
            showSection('dashboard-section'); // Go to dashboard on network error
        }
    }

    // MODIFIED: loadUserClassrooms now fetches ALL discoverable classrooms
    async function loadUserClassrooms() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/classrooms', { // Changed to fetch all classrooms
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                displayUserClassrooms(data); // `data` is directly the array of classrooms from /api/classrooms
            } else {
                createNotification(`Error loading available classrooms: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error loading available classrooms:', error);
            createNotification('Network error loading available classrooms.', 'danger');
        }
    }

    function displayUserClassrooms(classrooms) {
        classroomList.innerHTML = ''; // Use classroomList for all discoverable classes
        if (classrooms.length === 0) {
            classroomList.innerHTML = '<p>No classrooms available. Create one or ask an admin to invite you!</p>';
            return;
        }
        classrooms.forEach(classroom => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${classroom.name} (${classroom.id})</span>
                <button class="join-existing-classroom-btn" data-classroom-id="${classroom.id}">Join</button>
            `;
            classroomList.appendChild(li); // Append to classroomList
        });

        document.querySelectorAll('.join-existing-classroom-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const classroomId = e.currentTarget.dataset.classroomId;
                joinClassroom(classroomId);
            });
        });
    }

    async function login(email, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                currentUser = data.user; // Set global currentUser variable
                createNotification('Login successful!', 'success');
                currentUsernameDisplay.textContent = currentUser.username; // Update UI immediately
                if (currentUser.classroom_id) {
                    fetchClassroomDetailsAndJoin(currentUser.classroom_id); // Go to classroom if assigned
                } else {
                    showSection('dashboard-section'); // Go to dashboard
                    loadUserClassrooms(); // Load classrooms for the dashboard
                }
                // Clear any previous auth messages
                authMessage.textContent = '';
                loginEmail.value = ''; // Clear input fields
                loginPassword.value = '';
            } else {
                authMessage.textContent = data.error;
                authMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error during login:', error);
            authMessage.textContent = 'Network error, please try again.';
            authMessage.style.color = 'red';
        }
    }

    async function register(username, email, password) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });
            const data = await response.json();
            if (response.ok) {
                authMessage.textContent = 'Registration successful! Please login.';
                authMessage.style.color = 'green';
                showSection('auth-section');
                loginContainer.classList.remove('hidden');
                registerContainer.classList.add('hidden');
            } else {
                authMessage.textContent = data.error;
                authMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Error during registration:', error);
            authMessage.textContent = 'Network error, please try again.';
            authMessage.style.color = 'red';
        }
    }

    async function createClassroom(name) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/classrooms', { // MODIFIED: Corrected endpoint to /api/classrooms (POST)
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name
                })
            });
            const data = await response.json();
            if (response.ok) {
                createNotification(`Classroom "${data.classroom.name}" created! ID: ${data.classroom.id}`, 'success');
                joinClassroom(data.classroom.id);
            } else {
                createNotification(`Error creating classroom: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error creating classroom:', error);
            createNotification('Network error creating classroom.', 'danger');
        }
    }

    async function joinClassroom(classroomId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${classroomId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                currentUser.classroom_id = classroomId; // Update local user state
                // Socket.IO will handle the actual room join after successful API call
                initializeSocketIO();
                createNotification(`Successfully joined classroom: ${data.classroom.name}`, 'success');
            } else {
                createNotification(`Error joining classroom: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error joining classroom:', error);
            createNotification('Network error joining classroom.', 'danger');
        }
    }

    async function leaveClassroom(notifyServer = true) {
        if (!currentClassroom) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/classrooms/${currentClassroom.id}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                createNotification('Left classroom.', 'info');
                currentUser.classroom_id = null; // Clear local classroom state
                currentClassroom = null;
                if (socket && notifyServer) {
                    socket.emit('leave_classroom', {
                        classroomId: data.classroomId // Use ID from server for consistency
                    });
                    socket.disconnect(); // Disconnect socket completely
                    socket = null; // Clear socket instance
                }
                // Clear whiteboard state
                whiteboardPages = [
                    []
                ];
                currentPageIndex = 0;
                renderCurrentWhiteboardPage();
                updateWhiteboardPageDisplay();

                // Stop WebRTC streams and close connections
                if (localStream) {
                    localStream.getTracks().forEach(track => track.stop());
                    localStream = null;
                }
                for (const peerId in peerConnections) {
                    peerConnections[peerId].close();
                    delete peerConnections[peerId];
                    const remoteVideo = document.getElementById(`video-${peerId}`);
                    if (remoteVideo) remoteVideo.remove();
                }
                remoteStreams = {};

                loadUserClassrooms(); // Reload classrooms for the dashboard
                showSection('dashboard-section');
            } else {
                createNotification(`Error leaving classroom: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error leaving classroom:', error);
            createNotification('Network error leaving classroom.', 'danger');
        }
    }

    function logout() {
        localStorage.removeItem('token');
        currentUser = null;
        if (currentClassroom) {
            leaveClassroom(); // Ensure user leaves classroom on logout
        } else {
            showSection('auth-section');
        }
        createNotification('Logged out successfully.', 'info');
    }

    // --- UI Update Functions ---
    function updateUIBasedOnRole() {
        const isAdmin = currentUser && currentUser.role === 'admin';

        // Whiteboard controls for admins
        if (whiteboardControls) {
            whiteboardControls.classList.toggle('admin-hidden', !isAdmin);
        }
        if (whiteboardCanvas) {
            whiteboardCanvas.style.pointerEvents = isAdmin ? 'auto' : 'none'; // Only admins can draw
        }
        if (whiteboardRoleMessage) {
            whiteboardRoleMessage.textContent = isAdmin ? '' : 'Only administrators can draw on the whiteboard. Your view is read-only.';
        }

        // File upload for admins
        if (uploadFileBtn) uploadFileBtn.classList.toggle('admin-hidden', !isAdmin);
        if (uploadLibraryFilesBtn) uploadLibraryFilesBtn.classList.toggle('admin-hidden', !isAdmin);

        // Assessment creation for admins
        if (createAssessmentBtn) createAssessmentBtn.classList.toggle('admin-hidden', !isAdmin);

        // Hide/show admin-only elements throughout the page
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
        });
        document.querySelectorAll('[data-admin-show]').forEach(el => {
            el.classList.toggle('hidden', !isAdmin);
        });
    }

    // --- Event Listeners ---
    // Auth Forms
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginEmail.value;
        const password = loginPassword.value;
        login(email, password);
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = registerUsername.value;
        const email = registerEmail.value;
        const password = registerPassword.value;
        register(username, email, password);
    });

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

    // Navigation
    navDashboard.addEventListener('click', () => {
        showSection('dashboard-section');
        loadUserClassrooms();
    });
    navClassroom.addEventListener('click', () => {
        if (currentClassroom) {
            showSection('classroom-section');
        } else {
            createNotification('You are not in a classroom.', 'warning');
        }
    });
    navSettings.addEventListener('click', () => showSection('settings-section'));
    logoutBtn.addEventListener('click', logout);


    // Classroom Management
    createClassroomBtn.addEventListener('click', () => {
        const name = newClassroomNameInput.value.trim();
        if (name) {
            createClassroom(name);
            newClassroomNameInput.value = '';
        } else {
            createNotification('Classroom name cannot be empty.', 'warning');
        }
    });

    joinClassroomBtn.addEventListener('click', () => {
        const id = joinClassroomInput.value.trim();
        if (id) {
            joinClassroom(id);
            joinClassroomInput.value = '';
        } else {
            createNotification('Classroom ID cannot be empty.', 'warning');
        }
    });

    leaveClassroomBtn.addEventListener('click', () => {
        if (currentClassroom) {
            leaveClassroom();
        }
    });


    // Chat
    sendChatButton.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message && socket && currentClassroom) {
            socket.emit('chat_message', {
                classroomId: currentClassroom.id,
                message: message
            });
            chatInput.value = '';
        }
    });
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendChatButton.click();
        }
    });

    // File Sharing
    uploadFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentClassroom) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('classroomId', currentClassroom.id);

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
                createNotification('File uploaded successfully!', 'success');
                // Server will emit 'file_uploaded', triggering fetchUploadedFiles()
            } else {
                createNotification(`Error uploading file: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            createNotification('Network error uploading file.', 'danger');
        } finally {
            e.target.value = ''; // Clear file input
        }
    });

    uploadLibraryFilesBtn.addEventListener('click', () => libraryFileInput.click());
    libraryFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !currentClassroom) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('classroomId', currentClassroom.id);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/upload_library_file', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                createNotification('File added to library successfully!', 'success');
                fetchLibraryFiles(); // Refresh list
            } else {
                createNotification(`Error adding to library: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error adding to library:', error);
            createNotification('Network error adding to library.', 'danger');
        } finally {
            e.target.value = ''; // Clear file input
        }
    });

    copyInviteLinkBtn.addEventListener('click', () => {
        inviteLinkInput.select();
        document.execCommand('copy');
        createNotification('Invite link copied to clipboard!', 'info');
    });

    // Whiteboard Controls
    if (whiteboardCanvas) { // Only add listeners if canvas exists
        whiteboardCanvas.addEventListener('mousedown', handleMouseDown);
        whiteboardCanvas.addEventListener('mousemove', handleMouseMove);
        whiteboardCanvas.addEventListener('mouseup', handleMouseUp);
        whiteboardCanvas.addEventListener('mouseout', handleMouseUp); // End drawing if mouse leaves canvas

        // Touch events for mobile
        whiteboardCanvas.addEventListener('touchstart', handleMouseDown);
        whiteboardCanvas.addEventListener('touchmove', handleMouseMove);
        whiteboardCanvas.addEventListener('touchend', handleMouseUp);
        whiteboardCanvas.addEventListener('touchcancel', handleMouseUp);
    }

    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentTool = button.dataset.tool;
            if (currentTool !== 'text' && whiteboardTextInput) {
                whiteboardTextInput.classList.add('hidden'); // Hide text input if switching away
                whiteboardTextInput.value = ''; // Clear text input
            }
            setActiveToolButton(button);
        });
    });

    // Initial active tool
    if (document.querySelector(`button[data-tool="${currentTool}"]`)) {
        setActiveToolButton(document.querySelector(`button[data-tool="${currentTool}"]`));
    }


    function setActiveToolButton(clickedButton) {
        toolButtons.forEach(button => button.classList.remove('active'));
        if (clickedButton) {
            clickedButton.classList.add('active');
        }
    }


    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
    });

    brushSizeSlider.addEventListener('input', (e) => {
        currentBrushSize = parseInt(e.target.value);
    });

    clearWhiteboardBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to clear the current whiteboard page?')) {
            return;
        }
        if (socket && currentClassroom) {
            socket.emit('whiteboard_data', {
                action: 'clear',
                classroomId: currentClassroom.id,
                pageIndex: currentPageIndex
            });
        }
    });

    pageNavPrevBtn.addEventListener('click', () => goToWhiteboardPage(currentPageIndex - 1));
    pageNavNextBtn.addEventListener('click', () => goToWhiteboardPage(currentPageIndex + 1));

    // Initial whiteboard setup
    initializeWhiteboard();


    // NEW: Text Input Event Listeners
    if (whiteboardTextInput) {
        whiteboardTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent new line in text area
                emitWhiteboardText();
            }
        });

        whiteboardTextInput.addEventListener('blur', () => {
            emitWhiteboardText();
        });
    }

    // Assessment Management
    createAssessmentBtn.addEventListener('click', () => {
        showSection('assessment-section');
        createAssessmentContainer.classList.remove('hidden'); // Show create form
        assessmentListContainer.classList.add('hidden'); // Hide list
        assessmentCreationForm.reset();
        questionsContainer.innerHTML = '';
        questionCount = 0;
        questionCounter.textContent = `Question 0`;
        assessmentMessage.textContent = '';
    });

    addQuestionBtn.addEventListener('click', () => {
        questionCount++;
        questionCounter.textContent = `Question ${questionCount}`;
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question-block');
        questionDiv.dataset.questionIndex = questionCount - 1; // 0-indexed

        questionDiv.innerHTML = `
            <h5>Question ${questionCount}</h5>
            <label for="question-text-${questionCount}">Question Text:</label>
            <textarea id="question-text-${questionCount}" name="question-text-${questionCount}" rows="2" required></textarea>

            <label for="question-type-${questionCount}">Type:</label>
            <select id="question-type-${questionCount}" name="question-type-${questionCount}">
                <option value="mcq">Multiple Choice</option>
                <option value="short_answer">Short Answer</option>
            </select>

            <div class="mcq-options">
                <label>Options (for MCQ, separate with commas):</label>
                <input type="text" id="question-options-${questionCount}" name="question-options-${questionCount}">
                <label for="correct-answer-${questionCount}">Correct Answer (for MCQ):</label>
                <input type="text" id="correct-answer-${questionCount}" name="correct-answer-${questionCount}">
            </div>
            <button type="button" class="remove-question-btn" data-question-index="${questionCount - 1}">Remove</button>
            <hr>
        `;
        questionsContainer.appendChild(questionDiv);

        // Add event listener for type change to show/hide MCQ options
        const questionTypeSelect = questionDiv.querySelector(`#question-type-${questionCount}`);
        const mcqOptionsDiv = questionDiv.querySelector('.mcq-options');
        questionTypeSelect.addEventListener('change', () => {
            if (questionTypeSelect.value === 'mcq') {
                mcqOptionsDiv.classList.remove('hidden');
            } else {
                mcqOptionsDiv.classList.add('hidden');
            }
        });

        // Add event listener for remove button
        questionDiv.querySelector('.remove-question-btn').addEventListener('click', (e) => {
            e.target.closest('.question-block').remove();
            // Re-index questions visually if needed, or just let their data-index remain
        });
    });

    submitAssessmentBtn.addEventListener('click', async () => {
        const title = assessmentTitleInput.value.trim();
        const description = assessmentDescriptionInput.value.trim();
        if (!title || !description) {
            assessmentMessage.textContent = 'Title and description are required.';
            assessmentMessage.style.color = 'red';
            return;
        }

        const questions = [];
        document.querySelectorAll('.question-block').forEach((qBlock, index) => {
            const qText = qBlock.querySelector('textarea[name^="question-text-"]').value.trim();
            const qType = qBlock.querySelector('select[name^="question-type-"]').value;
            let options = [];
            let correctAnswer = '';

            if (qType === 'mcq') {
                options = qBlock.querySelector('input[name^="question-options-"]').value.split(',').map(opt => opt.trim()).filter(opt => opt !== '');
                correctAnswer = qBlock.querySelector('input[name^="correct-answer-"]').value.trim();
            }

            if (qText) {
                questions.push({
                    question_text: qText,
                    type: qType,
                    options: options, // Will be empty for short_answer
                    correct_answer: correctAnswer // Will be empty for short_answer
                });
            }
        });

        if (questions.length === 0) {
            assessmentMessage.textContent = 'Please add at least one question.';
            assessmentMessage.style.color = 'red';
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
                body: JSON.stringify({
                    title,
                    description,
                    questions
                })
            });
            const data = await response.json();
            if (response.ok) {
                assessmentMessage.textContent = 'Assessment created successfully!';
                assessmentMessage.style.color = 'green';
                createNotification('Assessment created!', 'success');
                assessmentCreationForm.reset();
                questionsContainer.innerHTML = '';
                questionCount = 0;
                questionCounter.textContent = `Question 0`;
                loadAssessments(); // Go back to assessment list
            } else {
                assessmentMessage.textContent = `Error: ${data.error}`;
                assessmentMessage.style.color = 'red';
                createNotification(`Error creating assessment: ${data.error}`, 'danger');
            }
        } catch (error) {
            console.error('Error creating assessment:', error);
            assessmentMessage.textContent = 'Network error creating assessment.';
            assessmentMessage.style.color = 'red';
            createNotification('Network error creating assessment.', 'danger');
        }
    });

    takeAssessmentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const answers = [];
        currentAssessmentToTake.questions.forEach((q, qIndex) => {
            let answer = '';
            if (q.type === 'mcq') {
                const selectedOption = takeAssessmentForm.querySelector(`input[name="question-${qIndex}"]:checked`);
                if (selectedOption) {
                    answer = selectedOption.value;
                }
            } else if (q.type === 'short_answer') {
                answer = takeAssessmentForm.querySelector(`textarea[name="question-${qIndex}"]`).value.trim();
            }
            answers.push({
                question_index: qIndex,
                question_text: q.question_text,
                answer: answer
            });
        });
        submitAssessmentAnswers(currentAssessmentToTake._id, answers);
    });

    // Back buttons for assessments
    if (backToAssessmentListBtn) backToAssessmentListBtn.addEventListener('click', () => {
        currentAssessmentToTake = null;
        loadAssessments();
    });
    if (backToAssessmentListFromSubmissionsBtn) backToAssessmentListFromSubmissionsBtn.addEventListener('click', () => {
        loadAssessments();
    });

    // Check for join parameter in URL on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const joinClassroomId = urlParams.get('join');
    if (joinClassroomId) {
        // If a join ID is present, try to join after login status is checked
        // This will be handled by checkLoginStatus calling fetchClassroomDetailsAndJoin
        // or by loadUserClassrooms which may then call joinClassroom
        // Ensure this logic flows correctly. For now, rely on fetchClassroomDetailsAndJoin
        // after checkLoginStatus.
        // It's assumed checkLoginStatus handles redirection and classroom joining
        // based on currentUser.classroom_id. If user is logged in but not in classroom,
        // it should attempt to join this `joinClassroomId`.
    }

    checkLoginStatus(); // Initial check on page load

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
