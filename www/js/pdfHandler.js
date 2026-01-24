// Configure PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class PDFHandler {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pdfBytes = null;
        console.log('PDFHandler initialized');
    }

    async loadPDF(file) {
        try {
            console.log('loadPDF called with:', file);
            console.log('File type:', typeof file);
            console.log('File name:', file.name);
            console.log('File size:', file.size);
            
            // Read file as ArrayBuffer
            console.log('Reading file as ArrayBuffer...');
            const arrayBuffer = await file.arrayBuffer();
            console.log('ArrayBuffer size:', arrayBuffer.byteLength);
            
            this.pdfBytes = new Uint8Array(arrayBuffer);
            console.log('Converted to Uint8Array, length:', this.pdfBytes.length);
            
            // Load with PDF.js for viewing
            console.log('Loading PDF with PDF.js...');
            const loadingTask = pdfjsLib.getDocument({ data: this.pdfBytes });
            this.pdfDoc = await loadingTask.promise;
            
            console.log('PDF loaded successfully. Pages:', this.pdfDoc.numPages);
            this.currentPage = 1;
            await this.renderPage(this.currentPage);
            
            return true;
        } catch (error) {
            console.error('Error in loadPDF:', error);
            console.error('Error stack:', error.stack);
            alert('Error loading PDF: ' + error.message);
            throw error;
        }
    }

    async renderPage(pageNum) {
        try {
            console.log('Rendering page:', pageNum);
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.scale });
            
            this.canvas.width = viewport.width;
            this.canvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            document.getElementById('pageInfo').textContent = 
                `Page ${pageNum} of ${this.pdfDoc.numPages}`;
            
            console.log('Page rendered successfully:', pageNum);
        } catch (error) {
            console.error('Error rendering page:', error);
            alert('Error rendering page: ' + error.message);
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
