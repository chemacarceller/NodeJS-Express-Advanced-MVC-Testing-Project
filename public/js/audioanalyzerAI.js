document.addEventListener('DOMContentLoaded', async () => {

    // HTML elements of the page
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
    const txtBtn = document.getElementById('txtBtn');
    const abortBtn = document.getElementById('abortBtn');

    // We create the constant for making Audio Scribe requests endpoint up /api/audioscribe
    const URL_PROXY = `${window.location.origin}/api/audioscribe`;

    // Global variable, used in several event handler functions
    let uploadedFileName = null;
    let originalUploadedFileName = null;

    // AddEventListeners...


    // The function that handles the change event on the file input type is defined for uploading a file.
    // Its function is to display a preview of the selected audio and reset the interface to prepare it before a new upload and transcription.
    if (fileInput) {

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
            originalUploadedFileName = null;
        });
    }


    // Implements drag and drop functionality over a specific area of ​​the page (dropZone),
    // directly connecting it to the previous fileInput code so that both methods function exactly the same.
    if (dropZone) {

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            if (isTranscribing) return;
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }


    // Handles the click on the upload button (uploadBtn), packaging the selected audio file
    // and sending it via HTTP to the /upload-audio endpoint of the Node.js server (where Multer will receive it)
    if (uploadBtn) {

        uploadBtn.addEventListener('click', async () => {

            // Auxiliary function
            // Updates an on-screen notification box (statusText) with the corresponding message
            function showStatus(message, type) {
                statusText.textContent = message;
                statusText.className = `au-status ${type}`;
                statusText.style.display = 'block';
            }

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
                    showStatus(`✅ Success: ${data.message} (${data.filename})`, 'success');
                    uploadedFileName = data.filename;
                    originalUploadedFileName = file.name;
                    transcribeBtn.style.display = 'block';
                } else {
                    showStatus(`❌ Error: ${data.error}`, 'error');
                }
            } catch (error) {
                showStatus('❌ Connection error with the server', 'error');
                console.error(error);
            } finally {
                uploadBtn.disabled = false;
                transcribeBtn.disabled = false;
            }
        });
    }


    // When you press the transcribe button (transcribeBtn), send the name of the uploaded file to the /transcribe endpoint of your backend.
    // Wait for WhisperX to finish and display the clean dialog in the text area.
    let isTranscribing = false;
    let currentAbortController = null;
    let currentFileInQueue = null;

    if (transcribeBtn) {

        transcribeBtn.addEventListener('click', async () => {

            if (!uploadedFileName || isTranscribing) return;

            if (txtBtn) txtBtn.disabled = true;
            if (copyBtn) copyBtn.disabled = true;

            const myFileName = uploadedFileName.split(/[\\/]/).pop();
            currentFileInQueue = myFileName;
            currentAbortController = new AbortController();

            isTranscribing = true;
            transcribeBtn.disabled = true;
            if (fileInput) fileInput.disabled = true;

            if (abortBtn) {
                abortBtn.style.display = 'inline-block';
                abortBtn.disabled = false;
            }

            layoutWrapper.classList.add('has-transcription');
            
            transcriptionText.value = 'Transcribing audio, please wait...';

            const fileInputEl = document.querySelector('input[type="file"]');
            const dropZoneEl = document.getElementById('dropZone');
            if (fileInputEl) fileInputEl.disabled = true;
            if (dropZoneEl) dropZoneEl.style.pointerEvents = 'none';
            if (typeof uploadBtn !== 'undefined' && uploadBtn) uploadBtn.disabled = true;

            const transcribePromise = fetch(`${URL_PROXY}/transcribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: myFileName }),
                signal: currentAbortController.signal
            });

            const checkStatus = async () => {
                try {
                    const res = await fetch(`${URL_PROXY}/status?t=${Date.now()}`, { cache: 'no-store' });
                    if (!res.ok) return;

                    const { activeFile } = await res.json();

                    if (activeFile === myFileName) {
                        transcriptionText.value = 'Transcribing audio, please wait...';
                        if (abortBtn) abortBtn.style.display = 'none';
                        clearInterval(statusInterval);
                    } else if (activeFile) {
                        transcriptionText.value = 'Queued, please wait...';
                    }
                } catch (_) {}
            };

            setTimeout(checkStatus, 250);
            const statusInterval = setInterval(checkStatus, 1500);

            try {
                const response = await transcribePromise;
                const data = await response.json();

                if (response.ok) { 
                    const rawText = data.transcription || data.text || 'Transcription completed.';
                    transcriptionText.value = rawText
                        .replace(/\*\*/g, '')          
                        .split(/\r?\n/)                
                        .map(linea => linea.trim())    
                        .filter(Boolean)               
                        .join('\n');                   
                } else {
                    transcriptionText.value = `Error during transcription : ${data.error || 'Server failure'}`;
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    transcriptionText.value = 'Transcription cancelled by user.';
                    transcribeBtn.style.display = 'none';
                    uploadedFileName = null;
                    originalUploadedFileName = null
                } else {
                    transcriptionText.value = 'Connection error while attempting to transcribe the audio.';
                    console.error(error);
                }
            } finally {

                clearInterval(statusInterval);
                isTranscribing = false;
                currentAbortController = null;
                currentFileInQueue = null;
                transcribeBtn.disabled = true;

                if (abortBtn) {
                    abortBtn.style.display = 'none';
                    abortBtn.disabled = false;
                }

                if (fileInputEl) { 
                    fileInputEl.value = '';
                    fileInputEl.disabled = false;
                }

                if (previewBox) {
                    previewBox.style.display = 'none';
                    const audio = previewBox.querySelector('audio');
                    if (audio) audio.src = '';
                }

                if (dropZoneEl) dropZoneEl.style.pointerEvents = '';
                if (typeof uploadBtn !== 'undefined' && uploadBtn) uploadBtn.disabled = false;
                if (typeof txtBtn !== 'undefined' && txtBtn) txtBtn.disabled = false;
                if (typeof copyBtn !== 'undefined' && copyBtn) copyBtn.disabled = false;
            }
        });
    }


    // Cancels the queued or active transcription on the server and aborts the pending HTTP request
    if (abortBtn) {

        abortBtn.addEventListener('click', async () => {

            if (!currentFileInQueue) return;

            abortBtn.disabled = true;
            transcriptionText.value = 'Cancelling transcription...';

            const fileToAbort = currentFileInQueue;

            try {
                await fetch(`${URL_PROXY}/abort`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: fileToAbort }),
                    keepalive: true
                });
            } catch (err) {
                console.error('Error sending abort request:', err);
            }

            if (currentAbortController) currentAbortController.abort();
        });
    }


    // Allows the user to copy the entire transcript to the clipboard with a single click
    // and provides temporary visual confirmation on the button itself.
    if (copyBtn) {

        const originalText = copyBtn.textContent;

        copyBtn.addEventListener('click', async () => {

            if (!transcriptionText.value) return;

            try {

                if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(transcriptionText.value);
                else {
                    transcriptionText.select();
                    transcriptionText.setSelectionRange(0, 99999); 
                    const isOk = document.execCommand('copy');
                    window.getSelection().removeAllRanges(); 

                    if (!isOk) throw new Error('Failed execCommand');
                }

                copyBtn.textContent = '¡Copied!';
                setTimeout(() => { copyBtn.textContent = originalText; }, 2000);

            } catch (err) {
                console.error('Error copying to clipboard : ', err);
                copyBtn.textContent = 'Error';
                setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
            }
        });
    }

/*

    // Alternative code if the execCommand method becomes unavailable in browsers at any point
    // If the user is not in a secure, non-local environment, we will force them to press Ctrl+C
    if (copyBtn) {
    
        const originalText = copyBtn.textContent;

        copyBtn.addEventListener('click', async () => {

            if (!transcriptionText.value) return;

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(transcriptionText.value);
                copyBtn.textContent = '¡Copied!';
            } else {
            
                transcriptionText.focus();
                transcriptionText.select();
                const copied = document['execCommand']?.('copy');

                if (copied) {
                    window.getSelection().removeAllRanges();
                    copyBtn.textContent = '¡Copied!';
                } else copyBtn.textContent = 'Press Ctrl+C';
            }

            setTimeout(() => { copyBtn.textContent = originalText; }, 2000);
        });
    }

*/


    // Allows the user to generate a file with the entire transcript with a single click
    // and provides temporary visual confirmation on the button itself.
    if (txtBtn) {
    
        const originalText = txtBtn.textContent;

        txtBtn.addEventListener('click', () => {

            if (!transcriptionText.value) return;

            try {

                const baseName = originalUploadedFileName?.replace(/\.[^/.]+$/, '') || 'transcription';

                const blob = new Blob([transcriptionText.value], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
            
                a.href = url;
                a.download = `${baseName}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setTimeout(() => URL.revokeObjectURL(url), 100);

                txtBtn.textContent = '¡Downloaded!';
                setTimeout(() => { txtBtn.textContent = originalText; }, 2000);

            } catch (err) {
                console.error('Error generating the text file : ', err);
                txtBtn.textContent = 'Error';
                setTimeout(() => { txtBtn.textContent = originalText; }, 2000);
            }
        });
    }
});