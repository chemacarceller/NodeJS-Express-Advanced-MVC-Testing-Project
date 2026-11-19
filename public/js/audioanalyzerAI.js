const URL_PROXY = `${window.location.origin}/api`;

const layoutWrapper = document.getElementById('auLayoutWrapper');
const fileInput = document.getElementById('audioInput');
const dropZone = document.getElementById('dropZone');
const previewBox = document.getElementById('previewBox');
const fileNameDisplay = document.getElementById('fileName');
const audioPreview = document.getElementById('audioPreview');
const uploadBtn = document.getElementById('uploadBtn');
const transcribeBtn = document.getElementById('transcribeBtn');
const statusText = document.getElementById('status');
const transcriptionText = document.getElementById('transcriptionText');
const copyBtn = document.getElementById('copyBtn');

let uploadedFileName = null;

function showStatus(message, type) {
    statusText.textContent = message;
    statusText.className = `au-status ${type}`;
    statusText.style.display = 'block';
}


fileInput.addEventListener('change', () => {
    const file = fileInput.files.item(0);
    if (!file) return;

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    fileNameDisplay.textContent = `🎵 ${file.name} (${sizeMB} MB)`;

    audioPreview.src = URL.createObjectURL(file);
    previewBox.style.display = 'block';
    
    statusText.style.display = 'none';
    transcribeBtn.style.display = 'none';
    layoutWrapper.classList.remove('has-transcription');
    transcriptionText.value = '';
    uploadedFileName = null;
});

if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
}

uploadBtn.addEventListener('click', async () => {
    const file = fileInput.files.item(0);
    if (!file) {
        showStatus('Please select an audio file first.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('audioFile', file);

    try {
        uploadBtn.disabled = true;
        transcribeBtn.style.display = 'none';
        showStatus('Uploading...', 'loading');

        const response = await fetch(`${URL_PROXY}/upload-audio`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            showStatus(`✅ Success: ${data.message} (${data.archivo})`, 'success');
            uploadedFileName = data.archivo;
            transcribeBtn.style.display = 'block';
        } else {
            showStatus(`❌ Error: ${data.error}`, 'error');
        }

    } catch (error) {
        showStatus('❌ Connection error with the server', 'error');
        console.error(error);
    } finally {
        uploadBtn.disabled = false;
    }
});

transcribeBtn.addEventListener('click', async () => {
    if (!uploadedFileName) return;

    layoutWrapper.classList.add('has-transcription');
    transcriptionText.value = 'Transcribing audio, please wait...';
    transcribeBtn.disabled = true;

    try {
        const response = await fetch(`${URL_PROXY}/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivo: uploadedFileName })
        });

        const data = await response.json();
        if (response.ok) transcriptionText.value = data.transcription || data.text || 'Transcription completed.';
        else transcriptionText.value = `Error during transcription : ${data.error || 'Server failure'}`;
        
    } catch (error) {
        transcriptionText.value = 'Connection error while attempting to transcribe the audio.';
        console.error(error);
    } finally {
        transcribeBtn.disabled = false;
    }
});

copyBtn.addEventListener('click', () => {
    if (!transcriptionText.value) return;
    navigator.clipboard.writeText(transcriptionText.value);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '¡Copied!';
    setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
});