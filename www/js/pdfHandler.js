pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class PDFHandler {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
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
            
            console.log('PDF loaded. Pages:', this.pdfDoc.numPages);
            this.currentPage = 1;
            await this.renderPage(this.currentPage);
            
            return true;
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF: ' + error.message);
            throw error;
        }
    }

    async renderPage(pageNum) {
        try {
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
            
            console.log('Page rendered:', pageNum);
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
        this.scale += 0.25;
        this.renderPage(this.currentPage);
    }

    zoomOut() {
        if (this.scale > 0.5) {
            this.scale -= 0.25;
            this.renderPage(this.currentPage);
        }
    }
}
