class FormEditor {
    constructor() {
        this.annotationsByPage = {};
        this.currentPage = 1;
        this.isTextMode = false;
        this.currentTextPosition = null;
        this.annotationLayer = null;
        this.initialized = false;
        this.currentScale = 1.0;
        this.selectedAnnotation = null;
        this.canvasContainer = null;
    }

    initialize() {
        this.annotationLayer = document.getElementById('annotationLayer');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.initialized = true;
        console.log('FormEditor initialized');
        
        // Add click listener to lock annotations when clicking outside
        document.addEventListener('click', (e) => {
            const isAnnotation = e.target.closest('.annotation-item');
            const isEditControl = e.target.closest('.text-edit-controls');
            
            if (!isAnnotation && !isEditControl && this.selectedAnnotation) {
                this.lockSelectedAnnotation();
            }
        });
    }

    setScale(scale) {
        this.currentScale = scale;
        this.refreshAnnotationLayer();
    }

    setPage(pageNum) {
        this.currentPage = pageNum;
        this.refreshAnnotationLayer();
    }

    refreshAnnotationLayer() {
        if (!this.initialized) this.initialize();

        this.annotationLayer = document.getElementById('annotationLayer');
        if (!this.annotationLayer) {
            console.error('Annotation layer not found');
            return;
        }

        this.annotationLayer.innerHTML = '';

        const pageAnnotations = this.annotationsByPage[this.currentPage] || [];
        pageAnnotations.forEach(annotation => {
            this.renderAnnotation(annotation);
        });
    }

    enableTextMode() {
        this.isTextMode = true;
        document.getElementById('pdfCanvas').style.cursor = 'crosshair';
        alert('Click on the PDF where you want to add text');
    }

    showTextInput(x, y) {
        // Convert screen coordinates to PDF coordinates (unscaled)
        const canvas = document.getElementById('pdfCanvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        this.currentTextPosition = { 
            x: x - canvasRect.left,
            y: y - canvasRect.top
        };
        
        const textInputPanel = document.getElementById('textInput');
        textInputPanel.style.display = 'block';
        document.getElementById('textField').focus();
    }

    confirmText() {
        const text = document.getElementById('textField').value.trim();
        if (text) {
            // Convert screen position to relative PDF position
            const canvas = document.getElementById('pdfCanvas');
            const relativeX = this.currentTextPosition.x / this.currentScale;
            const relativeY = this.currentTextPosition.y / this.currentScale;
            
            this.addTextAnnotation(text, relativeX, relativeY);
            this.cancelText();
        }
    }

    cancelText() {
        this.isTextMode = false;
        document.getElementById('pdfCanvas').style.cursor = 'default';
        document.getElementById('textInput').style.display = 'none';
        document.getElementById('textField').value = '';
        this.currentTextPosition = null;
    }

    addTextAnnotation(text, x, y) {
        if (!this.initialized) this.initialize();

        const annotation = {
            type: 'text',
            text: text,
            x: x,  // Store in relative/unscaled coordinates
            y: y,
            page: this.currentPage,
            id: Date.now(),
            locked: true,
            fontSize: 16,
            color: '#000000'
        };

        if (!this.annotationsByPage[this.currentPage]) {
            this.annotationsByPage[this.currentPage] = [];
        }
        this.annotationsByPage[this.currentPage].push(annotation);
        this.renderAnnotation(annotation);
    }

    addCheckbox() {
        if (!this.initialized) this.initialize();

        const canvas = document.getElementById('pdfCanvas');
        if (!canvas) {
            alert('Please load a PDF first');
            return;
        }

        console.log('Adding checkbox - canvas width:', canvas.width, 'scale:', this.currentScale);

        // Position at center in relative coordinates
        const relativeX = (canvas.width / 2) / this.currentScale;
        const relativeY = (canvas.height / 2) / this.currentScale;

        const annotation = {
            type: 'checkbox',
            checked: false,
            x: relativeX,
            y: relativeY,
            page: this.currentPage,
            id: Date.now(),
            locked: true
        };

        if (!this.annotationsByPage[this.currentPage]) {
            this.annotationsByPage[this.currentPage] = [];
        }
        this.annotationsByPage[this.currentPage].push(annotation);
        
        console.log('Checkbox annotation created:', annotation);
        
        this.renderAnnotation(annotation);
        
        console.log('Checkbox added successfully at relative position:', relativeX, relativeY);
        alert('Checkbox added! Click on it to unlock and move it.');
    }

    disableCanvasScroll() {
        if (this.canvasContainer) {
            this.canvasContainer.style.overflow = 'hidden';
            console.log('Canvas scroll disabled');
        }
    }

    enableCanvasScroll() {
        if (this.canvasContainer) {
            this.canvasContainer.style.overflow = 'auto';
            console.log('Canvas scroll enabled');
        }
    }

    renderAnnotation(annotation) {
        if (!this.annotationLayer) {
            console.error('Cannot render - annotation layer not ready');
            return;
        }

        const element = document.createElement('div');
        element.className = 'annotation-item';
        element.dataset.id = annotation.id;
        
        // Convert relative position to screen position using current scale
        const screenX = annotation.x * this.currentScale;
        const screenY = annotation.y * this.currentScale;
        
        element.style.left = screenX + 'px';
        element.style.top = screenY + 'px';
        element.style.position = 'absolute';

        // Add locked state if not exists
        if (annotation.locked === undefined) {
            annotation.locked = true;
        }

        if (annotation.type === 'text') {
            element.className += ' text-annotation';
            element.textContent = annotation.text;
            
            // Scale font size with PDF
            element.style.fontSize = (annotation.fontSize * this.currentScale) + 'px';
            element.style.color = annotation.color;
            
            // Set contentEditable based on locked state
            element.contentEditable = !annotation.locked;
            
            if (annotation.locked) {
                element.classList.add('locked');
                element.style.cursor = 'pointer';
            } else {
                element.classList.add('editable');
                element.style.cursor = 'move';
            }

            // Handle click to unlock
            element.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (annotation.locked) {
                    // Unlock on click
                    this.unlockAnnotation(annotation, element);
                }
            });

            // Update text content when editing
            element.addEventListener('input', (e) => {
                annotation.text = e.target.textContent.trim();
            });
            
        } else if (annotation.type === 'checkbox') {
            element.className += ' checkbox-annotation';
            
            // Scale checkbox size with PDF
            const checkboxSize = 20 * this.currentScale;
            element.style.width = checkboxSize + 'px';
            element.style.height = checkboxSize + 'px';
            element.style.fontSize = (16 * this.currentScale) + 'px';
            
            console.log('Rendering checkbox at screen position:', screenX, screenY, 'size:', checkboxSize);
            
            if (annotation.locked === undefined) {
                annotation.locked = true;
            }
            
            if (annotation.locked) {
                element.classList.add('locked');
                element.style.cursor = 'pointer';
            } else {
                element.classList.add('editable');
                element.style.cursor = 'move';
            }
            
            if (annotation.checked) {
                element.classList.add('checked');
                element.textContent = '✓';
            } else {
                element.textContent = '';
            }

            element.addEventListener('click', (e) => {
                e.stopPropagation();
                
                console.log('Checkbox clicked, locked:', annotation.locked);
                
                if (annotation.locked) {
                    // Unlock on first click
                    this.unlockAnnotation(annotation, element);
                } else {
                    // Toggle checkbox when unlocked
                    annotation.checked = !annotation.checked;
                    console.log('Toggled checkbox, now checked:', annotation.checked);
                    
                    if (annotation.checked) {
                        element.classList.add('checked');
                        element.textContent = '✓';
                    } else {
                        element.classList.remove('checked');
                        element.textContent = '';
                    }
                }
            });
        }

        // Make draggable only when unlocked
        this.makeDraggable(element, annotation);
        this.annotationLayer.appendChild(element);
        
        console.log('Annotation rendered and added to layer');
    }

    unlockAnnotation(annotation, element) {
        // Lock any previously selected annotation
        if (this.selectedAnnotation && this.selectedAnnotation !== annotation) {
            this.lockSelectedAnnotation();
        }
        
        // Unlock this annotation
        annotation.locked = false;
        element.classList.remove('locked');
        element.classList.add('editable');
        element.style.cursor = 'move';
        
        if (annotation.type === 'text') {
            element.contentEditable = true;
            element.focus();
        }
        
        this.selectedAnnotation = annotation;
        
        if (annotation.type === 'text') {
            this.showEditControls(annotation);
        }
        
        // Disable canvas scrolling when annotation is unlocked
        this.disableCanvasScroll();
        
        console.log('Annotation unlocked:', annotation.type);
    }

    lockSelectedAnnotation() {
        if (!this.selectedAnnotation) return;
        
        this.selectedAnnotation.locked = true;
        this.selectedAnnotation = null;
        this.hideEditControls();
        
        // Re-enable canvas scrolling when annotation is locked
        this.enableCanvasScroll();
        
        // Refresh to update visual state
        this.refreshAnnotationLayer();
    }

    showEditControls(annotation) {
        if (annotation.type !== 'text') return;
        
        let controlPanel = document.getElementById('textEditControls');
        if (!controlPanel) {
            controlPanel = document.createElement('div');
            controlPanel.id = 'textEditControls';
            controlPanel.className = 'text-edit-controls';
            controlPanel.innerHTML = `
                <h4>Edit Text</h4>
                <label>Font Size: <input type="number" id="fontSizeInput" min="8" max="72" value="16"></label>
                <label>Color: <input type="color" id="colorInput" value="#000000"></label>
                <button id="lockTextBtn" class="btn">Lock Text</button>
            `;
            document.getElementById('editorPanel').appendChild(controlPanel);
            
            // Add event listeners
            document.getElementById('fontSizeInput').addEventListener('input', (e) => {
                if (this.selectedAnnotation) {
                    this.selectedAnnotation.fontSize = parseInt(e.target.value);
                    this.refreshAnnotationLayer();
                }
            });
            
            document.getElementById('colorInput').addEventListener('input', (e) => {
                if (this.selectedAnnotation) {
                    this.selectedAnnotation.color = e.target.value;
                    this.refreshAnnotationLayer();
                }
            });
            
            document.getElementById('lockTextBtn').addEventListener('click', () => {
                this.lockSelectedAnnotation();
            });
        }
        
        controlPanel.style.display = 'block';
        document.getElementById('fontSizeInput').value = annotation.fontSize;
        document.getElementById('colorInput').value = annotation.color;
    }

    hideEditControls() {
        const controlPanel = document.getElementById('textEditControls');
        if (controlPanel) {
            controlPanel.style.display = 'none';
        }
    }

    makeDraggable(element, annotation) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        const startDrag = (e) => {
            // Don't drag if locked
            if (annotation.locked) {
                return;
            }
            
            // Don't start drag if clicking on editable text content
            if (annotation.type === 'text' && e.target.isContentEditable) {
                return;
            }

            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            initialX = annotation.x;
            initialY = annotation.y;
            
            e.preventDefault();
            e.stopPropagation();

            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
        };

        const drag = (e) => {
            if (!isDragging || annotation.locked) return;
            e.preventDefault();
            e.stopPropagation();

            const touch = e.touches ? e.touches[0] : e;
            
            // Calculate movement in screen pixels, then convert to relative coordinates
            const dx = (touch.clientX - startX) / this.currentScale;
            const dy = (touch.clientY - startY) / this.currentScale;

            // Update relative position
            annotation.x = initialX + dx;
            annotation.y = initialY + dy;

            // Update screen position
            element.style.left = (annotation.x * this.currentScale) + 'px';
            element.style.top = (annotation.y * this.currentScale) + 'px';
        };

        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag, { passive: false });
    }

    clearAll() {
        if (confirm('Clear all annotations on ALL pages?')) {
            this.annotationsByPage = {};
            if (this.annotationLayer) {
                this.annotationLayer.innerHTML = '';
            }
            this.selectedAnnotation = null;
            this.hideEditControls();
            this.enableCanvasScroll();
        }
    }

    async applyAnnotationsToPDF(pdfBytes) {
        try {
            const { PDFDocument, rgb, StandardFonts } = window.PDFLib;

            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            for (let pageNum in this.annotationsByPage) {
                const pageIndex = parseInt(pageNum) - 1;
                if (pageIndex < 0 || pageIndex >= pages.length) continue;

                const page = pages[pageIndex];
                const { width, height } = page.getSize();
                const canvas = document.getElementById('pdfCanvas');
                
                // Calculate scale factors between canvas and PDF page
                const scaleX = width / (canvas.width / this.currentScale);
                const scaleY = height / (canvas.height / this.currentScale);

                const annotations = this.annotationsByPage[pageNum];
                for (const annotation of annotations) {
                    // Convert from relative canvas coords to PDF coords
                    const x = annotation.x * scaleX;
                    const y = height - (annotation.y * scaleY);

                    if (annotation.type === 'text') {
                        page.drawText(annotation.text, {
                            x: x,
                            y: y - (annotation.fontSize * scaleY * 0.8),
                            size: annotation.fontSize,
                            font: font,
                            color: this.hexToRgb(annotation.color)
                        });
                    } else if (annotation.type === 'checkbox') {
                        const boxSize = 20;
                        // Draw checkbox border
                        page.drawRectangle({
                            x: x,
                            y: y - boxSize,
                            width: boxSize,
                            height: boxSize,
                            borderColor: rgb(0, 0, 0),
                            borderWidth: 2
                        });
                        
                        // Draw checkmark if checked
                        if (annotation.checked) {
                            page.drawText('✓', {
                                x: x + 2,
                                y: y - boxSize + 3,
                                size: 18,
                                color: rgb(0, 0, 0)
                            });
                        }
                    }
                }
            }

            const modifiedPdfBytes = await pdfDoc.save();
            return modifiedPdfBytes;
        } catch (error) {
            console.error('Error applying annotations:', error);
            throw error;
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? window.PDFLib.rgb(
            parseInt(result[1], 16) / 255,
            parseInt(result[2], 16) / 255,
            parseInt(result[3], 16) / 255
        ) : window.PDFLib.rgb(0, 0, 0);
    }
}

console.log('formEditor.js loaded');
