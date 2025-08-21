// whiteboard.js

let currentTool = 'pen';
let isDrawing = false;
let startX, startY, lastX, lastY;
let currentStrokePoints = [];
let snapshot = null;
let whiteboardCtx, whiteboardCanvas;
let currentUser, currentClassroom, whiteboardPages;

// Public setup
function setupWhiteboardControls({
    canvas,
    toolButtons,
    colorPicker,
    brushSizeSlider,
    undoButton,
    redoButton,
    clearButton,
    saveButton,
    prevWhiteboardPageBtn,
    nextWhiteboardPageBtn,
    user,
    socketRef,
    classroom,
    whiteboardPagesRef
}) {
    whiteboardCanvas = canvas;
    whiteboardCtx = whiteboardCanvas.getContext('2d');
    currentUser = user;
    socket = socketRef;
    currentClassroom = classroom;
    whiteboardPages = whiteboardPagesRef;

    // initial canvas styles
    whiteboardCtx.lineJoin = 'round';
    whiteboardCtx.lineCap = 'round';
    whiteboardCtx.lineWidth = currentBrushSize;
    whiteboardCtx.strokeStyle = currentColor;
    whiteboardCtx.fillStyle = currentColor;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseout', handleMouseUp);

    canvas.addEventListener('touchstart', handleMouseDown, { passive: false });
    canvas.addEventListener('touchmove', handleMouseMove, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp);
    canvas.addEventListener('touchcancel', handleMouseUp);

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

// ---------------- Internal Functions ---------------- //

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
    const coords = getCoords(e);
    startX = coords.x;
    startY = coords.y;
    lastX = coords.x;
    lastY = coords.y;

    if (currentTool === 'pen' || currentTool === 'eraser') {
        isDrawing = true;
        currentStrokePoints = [{ x: startX, y: startY, time: Date.now(), width: currentBrushSize }];
        whiteboardCtx.beginPath();
        whiteboardCtx.moveTo(startX, startY);
    } else if (currentTool === 'text') {
        const textInput = prompt("Enter text:");
        if (textInput && textInput.trim() !== '') {
            whiteboardCtx.save();
            whiteboardCtx.font = `${currentBrushSize * 2}px Inter, sans-serif`;
            whiteboardCtx.fillStyle = currentColor;
            whiteboardCtx.fillText(textInput, startX, startY);
            whiteboardCtx.restore();

            const textData = {
                startX, startY,
                text: textInput,
                color: currentColor,
                width: currentBrushSize,
                tool: 'text',
                pageIndex: currentPageIndex
            };

            socket.emit('whiteboard_data', {
                action: 'draw',
                classroomId: currentClassroom.id,
                data: textData
            });
            whiteboardPages[currentPageIndex].push({ action: 'draw', data: textData });
            saveState();
        }
    } else {
        snapshot = whiteboardCtx.getImageData(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
        isDrawing = true;
    }
}

function handleMouseMove(e) {
    if (!isDrawing || currentUser.role !== 'admin') return;
    e.preventDefault();
    const coords = getCoords(e);
    const currentX = coords.x;
    const currentY = coords.y;
    const now = Date.now();

    if (currentTool === 'pen' || currentTool === 'eraser') {
        const lastPoint = currentStrokePoints[currentStrokePoints.length - 1];
        const timeDiff = now - (lastPoint?.time || now);
        const dx = currentX - (lastPoint?.x || currentX);
        const dy = currentY - (lastPoint?.y || currentY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = distance / (timeDiff || 1);

        const minWidth = 1.5;
        const maxWidth = 6;
        const velocity = Math.min(speed / 2, 1);
        const newWidth = maxWidth - (maxWidth - minWidth) * velocity;

        currentStrokePoints.push({ x: currentX, y: currentY, time: now, width: newWidth });

        if (currentStrokePoints.length > 2) {
            const p0 = currentStrokePoints[currentStrokePoints.length - 3];
            const p1 = currentStrokePoints[currentStrokePoints.length - 2];
            const p2 = currentStrokePoints[currentStrokePoints.length - 1];

            whiteboardCtx.save();
            whiteboardCtx.strokeStyle = currentColor;
            whiteboardCtx.lineWidth = p1.width;
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(p0.x, p0.y);
            whiteboardCtx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
            whiteboardCtx.stroke();
            whiteboardCtx.restore();
        }
    } else if (snapshot && (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle')) {
        whiteboardCtx.putImageData(snapshot, 0, 0);
        drawWhiteboardItem({ tool: currentTool, startX, startY, endX: currentX, endY: currentY, color: currentColor, width: currentBrushSize });
    }
}

function handleMouseUp(e) {
    if (!isDrawing || currentUser.role !== 'admin') return;
    isDrawing = false;

    if (currentTool === 'pen' || currentTool === 'eraser') {
        const strokeData = {
            points: currentStrokePoints,
            color: currentColor,
            tool: currentTool
        };
        socket.emit('whiteboard_data', {
            action: 'draw',
            classroomId: currentClassroom.id,
            data: strokeData,
            pageIndex: currentPageIndex
        });
        whiteboardPages[currentPageIndex].push({ action: 'draw', data: strokeData });
        renderCurrentWhiteboardPage();
        currentStrokePoints = [];
    } else if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
        const coords = getCoords(e);
        const shapeData = {
            startX, startY,
            endX: coords.x,
            endY: coords.y,
            color: currentColor,
            width: currentBrushSize,
            tool: currentTool
        };
        drawWhiteboardItem(shapeData);
        socket.emit('whiteboard_data', {
            action: 'draw',
            classroomId: currentClassroom.id,
            data: shapeData,
            pageIndex: currentPageIndex
        });
        whiteboardPages[currentPageIndex].push({ action: 'draw', data: shapeData });
    }
    whiteboardCtx.globalCompositeOperation = 'source-over';
    saveState();
}

function drawWhiteboardItem(commandData) {
    const { tool, startX, startY, endX, endY, text, points, color, width } = commandData;
    whiteboardCtx.strokeStyle = color;
    whiteboardCtx.lineWidth = width;
    whiteboardCtx.fillStyle = color;
    whiteboardCtx.globalCompositeOperation = (tool === 'eraser') ? 'destination-out' : 'source-over';

    switch (tool) {
        case 'pen':
        case 'eraser':
            if (!points || points.length === 0) break;
            if (points.length === 1) {
                const p = points[0];
                whiteboardCtx.beginPath();
                whiteboardCtx.arc(p.x, p.y, p.width / 2, 0, Math.PI * 2);
                whiteboardCtx.fill();
                break;
            }
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                whiteboardCtx.lineWidth = p1.width || width;
                whiteboardCtx.quadraticCurveTo(p1.x, p1.y, midX, midY);
            }
            whiteboardCtx.stroke();
            break;

        case 'line':
            whiteboardCtx.beginPath();
            whiteboardCtx.moveTo(startX, startY);
            whiteboardCtx.lineTo(endX, endY);
            whiteboardCtx.stroke();
            break;

        case 'rectangle':
            whiteboardCtx.strokeRect(startX, startY, endX - startX, endY - startY);
            break;

        case 'circle':
            const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            whiteboardCtx.beginPath();
            whiteboardCtx.arc(startX, startY, radius, 0, Math.PI * 2);
            whiteboardCtx.stroke();
            break;

        case 'text':
            whiteboardCtx.font = `${width * 2}px Inter, sans-serif`;
            whiteboardCtx.fillText(text, startX, startY);
            break;
    }
}

function renderCurrentWhiteboardPage() {
    whiteboardCtx.clearRect(0, 0, whiteboardCanvas.width, whiteboardCanvas.height);
    const currentPage = whiteboardPages[currentPageIndex] || [];
    currentPage.forEach(item => drawWhiteboardItem(item.data));
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
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function selectTool(tool) {
    currentTool = tool;
    toolButtons.forEach(button => {
        if (button.dataset.tool === tool) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    if (whiteboardCtx.globalCompositeOperation === 'destination-out' && tool !== 'eraser') {
        whiteboardCtx.globalCompositeOperation = 'source-over';
    }
}

// Expose globally
window.setupWhiteboardControls = setupWhiteboardControls;
