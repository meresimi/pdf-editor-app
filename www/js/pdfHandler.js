// Configure PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class PDFHandler {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.canvas = document.getElementById('pdfCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.pdfBytes = null;
    }

    async loadPDF(fileUri) {
        try {
            console.log('Loading PDF from:', fileUri);
            
            // Read file using Cordova File plugin
            const fileEntry = await this.resolveLocalFileSystemURL(fileUri);
            const file = await this.getFile(fileEntry);
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            
            this.pdfBytes = new Uint8Array(arrayBuffer);
            
            // Load with PDF.js for viewing
            const loadingTask = pdfjsLib.getDocument({ data: this.pdfBytes });
            this.pdfDoc = await loadingTask.promise;
            
            console.log('PDF loaded successfully');
            this.currentPage = 1;
            await this.renderPage(this.currentPage);
            
            return true;
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Error loading PDF: ' + error.message);
            return false;
        }
    }

    async renderPage(pageNum) {
        try {
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            
            this.canvas.width = viewport.width;
            this.canvas.height = viewport.height;
            
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            document.getElementById('pageInfo').textContent = 
                `Page ${pageNum} of ${this.pdfDoc.numPages}`;
        } catch (error) {
            console.error('Error rendering page:', error);
            alert('Error rendering page: ' + error.message);
        }
    }

    async savePDF(modifiedPdfBytes) {
        try {
            // Save to Downloads folder
            const fileName = `edited_pdf_${Date.now()}.pdf`;
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            
            // Use Cordova File plugin to save
            const dirEntry = await this.resolveLocalFileSystemURL(
                cordova.file.externalDataDirectory
            );
            const fileEntry = await this.createFile(dirEntry, fileName);
            await this.writeFile(fileEntry, blob);
            
            alert('PDF saved successfully to: ' + fileEntry.nativeURL);
            return fileEntry.nativeURL;
        } catch (error) {
            console.error('Error saving PDF:', error);
            alert('Error saving PDF: ' + error.message);
            return null;
        }
    }

    // Helper methods for Cordova File plugin
    resolveLocalFileSystemURL(url) {
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(url, resolve, reject);
        });
    }

    getFile(fileEntry) {
        return new Promise((resolve, reject) => {
            fileEntry.file(resolve, reject);
        });
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    createFile(dirEntry, fileName) {
        return new Promise((resolve, reject) => {
            dirEntry.getFile(fileName, { create: true, exclusive: false }, resolve, reject);
        });
    }

    writeFile(fileEntry, blob) {
        return new Promise((resolve, reject) => {
            fileEntry.createWriter((writer) => {
                writer.onwriteend = resolve;
                writer.onerror = reject;
                writer.write(blob);
            });
        });
    }
}
