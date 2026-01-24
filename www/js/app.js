document.addEventListener('deviceready', onDeviceReady, false);

let app = {
    pdfHandler: null,
    formEditor: null
};

function onDeviceReady() {
    console.log('Device ready');

    app.pdfHandler = new PDFHandler();
    app.formEditor = new FormEditor();
    app.pdfHandler.setFormEditor(app.formEditor);

    setupEventListeners();
    hideLoading();
}

function setupEventListeners() {
    document.getElementById('openFileBtn').addEventListener('click', openFilePicker);
    document.getElementById('welcomeOpenBtn').addEventListener('click', openFilePicker);
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);

    document.getElementById('prevPageBtn').addEventListener('click', () => {
        app.pdfHandler.previousPage();
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        app.pdfHandler.nextPage();
    });

    document.getElementById('zoomInBtn').addEventListener('click', () => {
        app.pdfHandler.zoomIn();
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        app.pdfHandler.zoomOut();
    });

    document.getElementById('addTextBtn').addEventListener('click', () => {
        app.formEditor.enableTextMode();
    });

    document.getElementById('addCheckBtn').addEventListener('click', () => {
        app.formEditor.addCheckbox();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        app.formEditor.clearAll();
    });

    document.getElementById('addTextConfirm').addEventListener('click', () => {
        app.formEditor.confirmText();
    });

    document.getElementById('cancelText').addEventListener('click', () => {
        app.formEditor.cancelText();
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
        savePDF();
    });

    document.getElementById('pdfCanvas').addEventListener('click', (e) => {
        if (app.formEditor.isTextMode) {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            app.formEditor.showTextInput(x, y);
        }
    });
}

function openFilePicker() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        showLoading();
        app.pdfHandler.loadPDF(file).then(() => {
            hideLoading();
            showPDFViewer();
            showEditorPanel();
        }).catch(error => {
            hideLoading();
            alert('Error loading PDF: ' + error.message);
        });
    } else {
        alert('Please select a valid PDF file');
    }
}

function showPDFViewer() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('pdfViewer').style.display = 'flex';
}

function showEditorPanel() {
    document.getElementById('editorPanel').style.display = 'flex';
}

function savePDF() {
    showLoading();

    app.formEditor.applyAnnotationsToPDF(app.pdfHandler.pdfBytes).then(modifiedPdfBytes => {
        const fileName = 'edited_' + Date.now() + '.pdf';
        const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        hideLoading();
        alert('PDF saved to Downloads: ' + fileName);
    }).catch(error => {
        hideLoading();
        alert('Error saving PDF: ' + error.message);
    });
}

function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}
