// Whiteboard.js

/**
 * Represents the interactive whiteboard functionality in the classroom.
 * Handles drawing, tools, history, and real-time synchronization via Socket.IO.
 */
class Whiteboard {
    /**
     * @param {HTMLElement} canvasElement - The HTML canvas element for the whiteboard.
     * @param {HTMLElement} colorPickerElement - The color input element.
     * @param {HTMLElement} brushSizeSliderElement - The brush size slider input element.
     * @param {HTMLElement} undoButtonElement - The undo button.
     * @param {HTMLElement} redoButtonElement - The redo button.
     * @param {HTMLElement} clearButtonElement - The clear button.
     * @param {HTMLElement} saveButtonElement - The save button.
     * @param {HTMLElement} prevPageButtonElement - The previous page button.
     * @param {HTMLElement} nextPageButtonElement - The next page button.
     * @param {HTMLElement} pageDisplayElement - The element to display current page number.
     * @param {HTMLElement} roleMessageElement - The element to display role-based messages.
     * @param {Array<HTMLElement>} toolButtons - An array of tool button elements.
     * @param {object} dependencies - An object containing external dependencies like socket, currentUser, currentClassroom, and showNotification function.
     * @param {SocketIOClient.Socket} dependencies.socket - The Socket.IO client instance.
     * @param {object} dependencies.currentUser - The current logged-in user object.
     * @param {object} dependencies.currentClassroom - The current classroom object.
     * @param {function(string, boolean): void} dependencies.showNotification - Function to display notifications.
     */
    constructor(
        canvasElement,
        colorPickerElement,
        brushSizeSliderElement,
        undoButtonElement,
        redoButtonElement,
        clearButtonElement,
        saveButtonElement,
        prevPageButtonElement,
        nextPageButtonElement,
        pageDisplayElement,
        roleMessageElement,
        toolButtons,
        dependencies
    ) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.colorPicker = colorPickerElement;
        this.brushSizeSlider = brushSizeSliderElement;
        this.undoButton = undoButtonElement;
        this.redoButton = redoButtonElement;
        this.clearButton = clearButtonElement;
        this.saveButton = saveButtonElement;
        this.prevPageButton = prevPageButtonElement;
        this.nextPageButton = nextPageButtonElement;
        this.pageDisplay = pageDisplayElement;
        this.roleMessage = roleMessageElement;
        this.toolButtons = toolButtons;

        // Dependencies
        this.socket = dependencies.socket;
        this.currentUser = dependencies.currentUser;
        this.currentClassroom = dependencies.currentClassroom;
        this.showNotification = dependencies.showNotification;

        // Whiteboard State Variables
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = this.colorPicker ? this.colorPicker.value : '#FFF800';
        this.currentBrushSize = this.brushSizeSlider ? parseInt(this.brushSizeSlider.value) : 5;
        this.currentTool = 'pen';
        this.snapshot = null; // For temporary drawing of shapes
        this.currentStrokePoints = []; // Stores all points for a single pen/eraser stroke

        // Whiteboard History (Multi-page)
        this.whiteboardPages = [[]]; // Array of arrays, each sub-array is a page of drawing commands
        this.currentPageIndex = 0;
        this.undoStack = []; // For local undo/redo of single actions on current page
        this.redoStack = [];
        this.MAX_HISTORY_STEPS = 50;

        this.init();
    }

    /**
     * Initializes the whiteboard canvas and its controls.
     */
    init() {
        if (!this.ctx) {
            console.error("[Whiteboard] 2D context failed to initialize. Whiteboard will not function.");
            return;
        }

        // Set initial drawing properties for the context
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = this.currentBrushSize;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor; // For text

        this.resizeCanvas(); // Set initial size
        window.addEventListener('resize', this.resizeCanvas.bind(this));

        // Event Listeners for Drawing
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseUp.bind(this));

        // Touch/Stylus Optimization: Use passive: false for touchmove to allow preventDefault
        this.canvas.addEventListener('touchstart', this.handleMouseDown.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMouseMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleMouseUp.bind(this));

        // Tool selection
        this.toolButtons.forEach(button => {
            button.addEventListener('click', () => this.selectTool(button.dataset.tool));
        });

        // Color and Size
        if (this.colorPicker) this.colorPicker.addEventListener('input', this.updateColor.bind(this));
        if (this.brushSizeSlider) this.brushSizeSlider.addEventListener('input', this.updateBrushSize.bind(this));

        // Actions
        if (this.undoButton) this.undoButton.addEventListener('click', this.undo.bind(this));
        if (this.redoButton) this.redoButton.addEventListener('click', this.redo.bind(this));
        if (this.clearButton) this.clearButton.addEventListener('click', () => this.clearCanvas(true));
        if (this.saveButton) this.saveButton.addEventListener('click', this.saveImage.bind(this));

        // Page Navigation
        if (this.prevPageButton) this.prevPageButton.addEventListener('click', this.goToPreviousWhiteboardPage.bind(this));
        if (this.nextPageButton) this.nextPageButton.addEventListener('click', this.goToNextWhiteboardPage.bind(this));

        this.setupSocketListeners();
        this.renderCurrentWhiteboardPage();
        this.updateWhiteboardPageDisplay();
        this.updateUndoRedoButtons();
    }

    /**
     * Sets up Socket.IO listeners specific to the whiteboard.
     */
    setupSocketListeners() {
        if (!this.socket) {
            console.warn("[Whiteboard] Socket.IO instance not provided. Real-time features will not work.");
            return;
        }

        this.socket.on('whiteboard_data', (data) => {
            if (!this.ctx) {
                console.warn('[Whiteboard] Cannot draw: whiteboardCtx is null when receiving whiteboard data.');
                return;
            }
            const applyDrawingProperties = (tool, color, width) => {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = width;
                this.ctx.fillStyle = color;
                if (tool === 'eraser') {
                    this.ctx.globalCompositeOperation = 'destination-out';
                } else {
                    this.ctx.globalCompositeOperation = 'source-over';
                }
            };

            if (data.action === 'draw') {
                const drawingItem = data.data;
                const pageIndex = data.pageIndex;

                if (!this.whiteboardPages[pageIndex]) {
                    this.whiteboardPages[pageIndex] = [];
                }
                this.whiteboardPages[pageIndex].push(drawingItem);

                if (pageIndex === this.currentPageIndex) {
                    this.ctx.save();
                    applyDrawingProperties(drawingItem.tool, drawingItem.color, drawingItem.width);
                    this.drawWhiteboardItem(drawingItem);
                    this.ctx.restore();
                }
            } else if (data.action === 'clear') {
                const pageIndex = data.pageIndex;
                if (this.whiteboardPages[pageIndex]) {
                    this.whiteboardPages[pageIndex] = [];
                }
                if (pageIndex === this.currentPageIndex) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
            } else if (data.action === 'history' && data.history) {
                this.whiteboardPages = data.history;
                if (this.whiteboardPages.length === 0) {
                    this.whiteboardPages = [[]];
                }
                this.currentPageIndex = 0;
                this.renderCurrentWhiteboardPage();
                this.updateWhiteboardPageDisplay();
            }
        });

        this.socket.on('whiteboard_page_change', (data) => {
            const { newPageIndex } = data;
            if (newPageIndex >= 0 && newPageIndex < this.whiteboardPages.length) {
                this.currentPageIndex = newPageIndex;
                this.renderCurrentWhiteboardPage();
                this.updateWhiteboardPageDisplay();
                this.showNotification(`Whiteboard page changed to ${newPageIndex + 1}`);
            }
        });
    }

    /**
     * Adjusts the canvas dimensions to fit its parent container while maintaining aspect ratio.
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const aspectRatio = 1200 / 800; // Original design aspect ratio
        let newWidth = container.clientWidth - 40; // Account for padding/margins
        let newHeight = newWidth / aspectRatio;

        if (newHeight > window.innerHeight * 0.9) {
            newHeight = window.innerHeight * 0.9;
            newWidth = newHeight * aspectRatio;
        }

        this.canvas.width = Math.max(newWidth, 300);
        this.canvas.height = Math.max(newHeight, 700);

        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = this.currentBrushSize;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor;
        this.renderCurrentWhiteboardPage();
    }

    /**
     * Handles the start of a drawing action (mousedown or touchstart).
     */
    handleMouseDown(e) {
        if (this.currentUser.role !== 'admin') return;
        this.isDrawing = true;
        const coords = this.getCoords(e);
        this.startX = coords.x;
        this.startY = coords.y;
        this.lastX = coords.x;
        this.lastY = coords.y;

        if (this.currentTool !== 'pen' && this.currentTool !== 'eraser' && this.currentTool !== 'text') {
            this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }

        if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
            this.currentStrokePoints = [{ x: this.startX, y: this.startY }];
            this.ctx.beginPath();
            this.ctx.moveTo(this.startX, this.startY);
        } else if (this.currentTool === 'text') {
            const textInput = prompt("Enter text:");
            if (textInput !== null && textInput.trim() !== '') {
                this.ctx.save();
                this.ctx.font = `${this.currentBrushSize * 2}px Inter, sans-serif`;
                this.ctx.fillStyle = this.currentColor;
                this.ctx.fillText(textInput, this.startX, this.startY);
                this.ctx.restore();

                this.saveState();
                const textData = {
                    startX: this.startX,
                    startY: this.startY,
                    endX: this.startX,
                    endY: this.startY,
                    text: textInput,
                    color: this.currentColor,
                    width: this.currentBrushSize,
                    tool: 'text',
                    pageIndex: this.currentPageIndex
                };
                this.socket.emit('whiteboard_data', {
                    action: 'draw',
                    classroomId: this.currentClassroom.id,
                    data: textData,
                    pageIndex: this.currentPageIndex
                });
                this.whiteboardPages[this.currentPageIndex].push({ action: 'draw', data: textData });
            }
            this.isDrawing = false;
        }
    }

    /**
     * Handles the movement during a drawing action (mousemove or touchmove).
     * Includes stroke smoothing and line interpolation for pen/eraser.
     */
    handleMouseMove(e) {
        if (!this.isDrawing || this.currentUser.role !== 'admin' || this.currentTool === 'text') return;
        e.preventDefault();

        const coords = this.getCoords(e);
        const currentX = coords.x;
        const currentY = coords.y;

        this.ctx.save();
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentBrushSize;

        if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';

            this.currentStrokePoints.push({ x: currentX, y: currentY });

            this.ctx.quadraticCurveTo(this.lastX, this.lastY, (currentX + this.lastX) / 2, (currentY + this.lastY) / 2);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo((currentX + this.lastX) / 2, (currentY + this.lastY) / 2);

            this.lastX = currentX;
            this.lastY = currentY;

        } else {
            if (this.snapshot) {
                this.ctx.putImageData(this.snapshot, 0, 0);
            } else {
                this.renderCurrentWhiteboardPage();
            }
            this.drawWhiteboardItem({ tool: this.currentTool, startX: this.startX, startY: this.startY, endX: currentX, endY: currentY, color: this.currentColor, width: this.currentBrushSize });
        }
        this.ctx.restore();
    }

    /**
     * Handles the end of a drawing action (mouseup or touchend).
     */
    handleMouseUp(e) {
        if (!this.isDrawing || this.currentUser.role !== 'admin') return;
        this.isDrawing = false;

        if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
            this.ctx.lineTo(this.lastX, this.lastY);
            this.ctx.stroke();
            this.ctx.closePath();

            const strokeData = {
                points: this.currentStrokePoints,
                color: this.currentColor,
                width: this.currentBrushSize,
                tool: this.currentTool
            };

            this.socket.emit('whiteboard_data', {
                action: 'draw',
                classroomId: this.currentClassroom.id,
                data: strokeData,
                pageIndex: this.currentPageIndex
            });

            this.whiteboardPages[this.currentPageIndex].push({ action: 'draw', data: strokeData });
            this.currentStrokePoints = [];

        } else if (this.currentTool === 'line' || this.currentTool === 'rectangle' || this.currentTool === 'circle') {
            const finalCoords = this.getCoords(e);
            const currentX = finalCoords.x;
            const currentY = finalCoords.y;

            this.renderCurrentWhiteboardPage();

            this.ctx.save();
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.currentBrushSize;

            const shapeData = {
                startX: this.startX, startY: this.startY,
                endX: currentX,
                endY: currentY,
                color: this.currentColor,
                width: this.currentBrushSize,
                tool: this.currentTool
            };

            this.drawWhiteboardItem(shapeData);
            this.ctx.restore();

            this.socket.emit('whiteboard_data', {
                action: 'draw',
                classroomId: this.currentClassroom.id,
                data: shapeData,
                pageIndex: this.currentPageIndex
            });

            this.whiteboardPages[this.currentPageIndex].push({ action: 'draw', data: shapeData });
        }

        if (this.ctx.globalCompositeOperation === 'destination-out') {
            this.ctx.globalCompositeOperation = 'source-over';
        }

        this.saveState();
    }


    /**
     * Draws a specific whiteboard item (line, rectangle, circle, text, or smoothed pen/eraser stroke).
     * @param {object} commandData - The data object for the drawing command.
     * @param {string} commandData.tool - The drawing tool.
     * @param {number} [commandData.startX] - Start X coordinate (for shapes/text).
     * @param {number} [commandData.startY] - Start Y coordinate (for shapes/text).
     * @param {number} [commandData.endX] - End X coordinate (for shapes).
     * @param {number} [commandData.endY] - End Y coordinate (for shapes).
     * @param {string} [commandData.text] - Text content for the 'text' tool.
     * @param {Array<object>} [commandData.points] - Array of {x, y} points for 'pen'/'eraser' strokes.
     * @param {string} commandData.color - Stroke/fill color.
     * @param {number} commandData.width - Stroke width.
     */
    drawWhiteboardItem(commandData) {
        const { tool, startX, startY, endX, endY, text, points, color, width } = commandData;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.fillStyle = color;

        if (tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
        }

        switch (tool) {
            case 'pen':
            case 'eraser':
                if (points && points.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(points[0].x, points[0].y);

                    for (let i = 1; i < points.length - 1; i++) {
                        const p0 = points[i - 1];
                        const p1 = points[i];
                        const p2 = points[i + 1];

                        const controlX = (p0.x + p1.x) / 2;
                        const controlY = (p0.y + p1.y) / 2;
                        const endX_segment = (p1.x + p2.x) / 2;
                        const endY_segment = (p1.y + p2.y) / 2;

                        this.ctx.quadraticCurveTo(p1.x, p1.y, endX_segment, endY_segment);
                    }
                    this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
                break;
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                this.ctx.closePath();
                break;
            case 'rectangle':
                this.ctx.beginPath();
                this.ctx.rect(startX, startY, endX - startX, endY - startY);
                this.ctx.stroke();
                this.ctx.closePath();
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                this.ctx.beginPath();
                this.ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.closePath();
                break;
            case 'text':
                this.ctx.font = `${width * 2}px Inter, sans-serif`;
                this.ctx.fillText(text, startX, startY);
                break;
        }
    }

    /**
     * Gets mouse/touch coordinates relative to the canvas.
     * @param {MouseEvent|TouchEvent} e - The event object.
     * @returns {object} An object with x and y coordinates.
     */
    getCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
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

    /**
     * Changes the active drawing tool.
     * @param {string} tool - The tool to activate.
     */
    selectTool(tool) {
        this.currentTool = tool;
        this.toolButtons.forEach(button => {
            if (button.dataset.tool === tool) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        if (this.ctx.globalCompositeOperation === 'destination-out' && tool !== 'eraser') {
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }

    /**
     * Updates the drawing color.
     */
    updateColor() {
        this.currentColor = this.colorPicker.value;
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.fillStyle = this.currentColor;
    }

    /**
     * Updates the brush/stroke size.
     */
    updateBrushSize() {
        this.currentBrushSize = parseInt(this.brushSizeSlider.value);
        this.ctx.lineWidth = this.currentBrushSize;
    }

    /**
     * Clears the current whiteboard page and emits the clear event.
     * @param {boolean} [emitEvent=true] - Whether to emit the clear event to the server.
     */
    clearCanvas(emitEvent = true) {
        if (this.currentUser.role !== 'admin') {
            this.showNotification("Only administrators can clear the whiteboard.", true);
            return;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.whiteboardPages[this.currentPageIndex] = [];
        this.saveState();

        if (emitEvent && this.socket && this.currentClassroom && this.currentClassroom.id) {
            this.socket.emit('whiteboard_data', { action: 'clear', classroomId: this.currentClassroom.id, data: { pageIndex: this.currentPageIndex } });
        }
        this.showNotification(`Whiteboard page ${this.currentPageIndex + 1} cleared.`);
    }

    /**
     * Saves the current canvas content as a PNG image.
     */
    saveImage() {
        if (this.currentUser.role !== 'admin') {
            this.showNotification("Only administrators can save the whiteboard image.", true);
            return;
        }
        const dataURL = this.canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = `whiteboard-page-${this.currentPageIndex + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.showNotification(`Whiteboard page ${this.currentPageIndex + 1} saved as image.`);
    }

    /**
     * Saves the current canvas state to the undo stack.
     * Clears the redo stack when a new state is saved.
     */
    saveState() {
        if (this.undoStack.length >= this.MAX_HISTORY_STEPS) {
            this.undoStack.shift();
        }
        this.undoStack.push(this.canvas.toDataURL());
        this.redoStack.length = 0;
        this.updateUndoRedoButtons();
    }

    /**
     * Loads a canvas state from a data URL.
     * @param {string} dataURL - The data URL of the canvas image.
     */
    loadState(dataURL) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
        img.src = dataURL;
    }

    /**
     * Performs an undo operation.
     */
    undo() {
        if (this.undoStack.length > 1) {
            const lastState = this.undoStack.pop();
            this.redoStack.push(lastState);
            this.loadState(this.undoStack[this.undoStack.length - 1]);
        } else if (this.undoStack.length === 1) {
            const lastState = this.undoStack.pop();
            this.redoStack.push(lastState);
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.updateUndoRedoButtons();
    }

    /**
     * Performs a redo operation.
     */
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.loadState(nextState);
        }
        this.updateUndoRedoButtons();
    }

    /**
     * Updates the enabled/disabled state of the undo and redo buttons.
     */
    updateUndoRedoButtons() {
        if (this.undoButton) this.undoButton.disabled = this.undoStack.length <= 1;
        if (this.redoButton) this.redoButton.disabled = this.redoStack.length === 0;
    }

    /**
     * Fetches whiteboard history for all pages from the server.
     */
    async fetchWhiteboardHistory() {
        if (!this.currentClassroom || !this.currentClassroom.id) {
            console.warn("Cannot fetch whiteboard history: No current classroom.");
            return;
        }
        try {
            const response = await fetch(`/api/whiteboard-history/${this.currentClassroom.id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    console.log("No whiteboard history found for this classroom. Starting fresh.");
                    this.whiteboardPages = [[]];
                    this.currentPageIndex = 0;
                    this.renderCurrentWhiteboardPage();
                    this.updateWhiteboardPageDisplay();
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.whiteboardPages = data.history || [[]];
            if (this.whiteboardPages.length === 0) {
                this.whiteboardPages = [[]];
            }
            this.currentPageIndex = 0;
            this.renderCurrentWhiteboardPage();
            this.updateWhiteboardPageDisplay();
            this.showNotification("Whiteboard history loaded.");
        } catch (error) {
            console.error("Error fetching whiteboard history:", error);
            this.whiteboardPages = [[]];
            this.currentPageIndex = 0;
            this.renderCurrentWhiteboardPage();
            this.updateWhiteboardPageDisplay();
            this.showNotification("Failed to load whiteboard history.", true);
        }
    }

    /**
     * Renders the drawing commands for the current page onto the canvas.
     */
    renderCurrentWhiteboardPage() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const currentPage = this.whiteboardPages[this.currentPageIndex];
        if (currentPage) {
            currentPage.forEach(command => {
                this.ctx.save();
                this.ctx.strokeStyle = command.data.color;
                this.ctx.lineWidth = command.data.width;
                this.ctx.fillStyle = command.data.color;
                if (command.data.tool === 'eraser') {
                    this.ctx.globalCompositeOperation = 'destination-out';
                } else {
                    this.ctx.globalCompositeOperation = 'source-over';
                }
                this.drawWhiteboardItem(command.data);
                this.ctx.restore();
            });
        }
        this.updateWhiteboardPageDisplay();
    }

    /**
     * Updates the whiteboard page display and navigation button states.
     */
    updateWhiteboardPageDisplay() {
        if (this.pageDisplay) {
            this.pageDisplay.textContent = `Page ${this.currentPageIndex + 1}/${this.whiteboardPages.length}`;
        }
        if (this.prevPageButton) {
            this.prevPageButton.disabled = this.currentPageIndex === 0;
        }
        if (this.nextPageButton) {
            this.nextPageButton.disabled = this.currentPageIndex === this.whiteboardPages.length - 1 && this.currentUser.role !== 'admin';
        }
    }

    /**
     * Navigates to the next whiteboard page. Creates a new page if at the end (admin only).
     */
    goToNextWhiteboardPage() {
        if (this.currentPageIndex < this.whiteboardPages.length - 1) {
            this.currentPageIndex++;
        } else if (this.currentUser.role === 'admin') {
            this.whiteboardPages.push([]);
            this.currentPageIndex = this.whiteboardPages.length - 1;
            this.socket.emit('whiteboard_page_change', {
                classroomId: this.currentClassroom.id,
                newPageIndex: this.currentPageIndex,
                action: 'add_page'
            });
        } else {
            this.showNotification("No next page available.", true);
            return;
        }
        this.renderCurrentWhiteboardPage();
        this.updateWhiteboardPageDisplay();
        this.socket.emit('whiteboard_page_change', { classroomId: this.currentClassroom.id, newPageIndex: this.currentPageIndex });
        this.showNotification(`Moved to whiteboard page ${this.currentPageIndex + 1}`);
    }

    /**
     * Navigates to the previous whiteboard page.
     */
    goToPreviousWhiteboardPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.renderCurrentWhiteboardPage();
            this.updateWhiteboardPageDisplay();
            this.socket.emit('whiteboard_page_change', { classroomId: this.currentClassroom.id, newPageIndex: this.currentPageIndex });
            this.showNotification(`Moved to whiteboard page ${this.currentPageIndex + 1}`);
        } else {
            this.showNotification("Already on the first page.", true);
        }
    }

    /**
     * Updates UI elements based on the current user's role (admin/user).
     * This method is called externally by app.js to ensure UI consistency.
     */
    updateRoleBasedUI() {
        const isAdmin = this.currentUser && this.currentUser.role === 'admin';
        if (this.roleMessage) {
            this.roleMessage.classList.toggle('hidden', isAdmin);
            this.roleMessage.textContent = isAdmin ? '' : 'Only administrators can draw on the whiteboard. Your view is read-only.';
        }
        if (this.canvas) {
            this.canvas.style.pointerEvents = isAdmin ? 'auto' : 'none';
        }
        // Also update button states for page navigation
        this.updateWhiteboardPageDisplay();
    }

    /**
     * Public method to trigger fetching whiteboard history from app.js.
     */
    loadHistory() {
        this.fetchWhiteboardHistory();
    }
}
