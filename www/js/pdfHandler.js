pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class PDFHandler {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.scale = 1.5;
        this.canvas = null;
        this.ctx = null;
        this.pdfBytes = null;
        this.formEditor = null;
    }

    setFormEditor(editor) {
        this.formEditor = editor;
    }

    async loadPDF(file) {
        try {
            console.log('Loading PDF:', file.name);
            
            const arrayBuffer = await file.arrayBuffer();
            this.pdfBytes = new Uint8Array(arrayBuffer);
            
            const loadingTask = pdfjsLib.getDocument({ data: this.pdfBytes });
            this.pdfDoc = await loadingTask.promise;
            
            this.canvas = document.getElementById('pdfCanvas');
            this.ctx = this.canvas.getContext('2d');
            
            console.log('PDF loaded. Pages:', this.pdfDoc.numPages);
            this.currentPage = 1;
            await this.renderPage(this.currentPage);
            
            this.setupPinchZoom();
            
            return true;
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF: ' + error.message);
            throw error;
        }
    }

    setupPinchZoom() {
        let initialDistance = 0;
        let initialScale = this.scale;

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
                initialScale = this.scale;
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scaleChange = currentDistance / initialDistance;
                this.scale = Math.max(0.5, Math.min(3, initialScale * scaleChange));
                this.renderPage(this.currentPage);
            }
        });
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    async renderPage(pageNum) {
        try {
            if (!this.canvas) {
                this.canvas = document.getElementById('pdfCanvas');
                this.ctx = this.canvas.getContext('2d');
            }
            
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.scale });
            
            this.canvas.width = viewport.width;
            this.canvas.height = viewport.height;
            
            await page.render({
                canvasContext: this.ctx,
                viewport: viewport
            }).promise;
            
            document.getElementById('pageInfo').textContent = 
                `Page ${pageNum} of ${this.pdfDoc.numPages}`;
            
            if (this.formEditor) {
                this.formEditor.setPage(pageNum);
            }
            
            console.log('Page rendered:', pageNum, 'scale:', this.scale);
        } catch (error) {
            console.error('Error rendering page:', error);
            throw error;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPage(this.currentPage);
        }
    }

    nextPage() {
        if (this.currentPage < this.pdfDoc.numPages) {
            this.currentPage++;
            this.renderPage(this.currentPage);
        }
    }

    zoomIn() {
        this.scale = Math.min(3, this.scale + 0.25);
        this.renderPage(this.currentPage);
        console.log('Zoom in, new scale:', this.scale);
    }

    zoomOut() {
        this.scale = Math.max(0.5, this.scale - 0.25);
        this.renderPage(this.currentPage);
        console.log('Zoom out, new scale:', this.scale);
    }
}

console.log('pdfHandler.js loaded');
