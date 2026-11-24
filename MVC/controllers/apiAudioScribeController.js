const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');


// JavaScript class for audio transcription
class ApiAudioScribeController {

    // --- PRIVATE AND STATIC CONSTANTS ---
    static #UPLOAD_DIR = path.resolve('uploads');
    static #PYTHON_PATH = path.resolve('./.venv/bin/python');
    static #SCRIPT_PATH = path.resolve('python/transcribe.py');
    static #ALLOWED_EXT = /\.(mp3|wav|m4a|ogg|webm|flac|aac|mp4)$/i;

    static { 
        if (!fs.existsSync(this.#UPLOAD_DIR)) {
            fs.mkdirSync(this.#UPLOAD_DIR, { recursive: true }); 
        }
    }

    // Single reusable Multer instance
    static #upload = multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => cb(null, ApiAudioScribeController.#UPLOAD_DIR),
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, uniqueSuffix + path.extname(file.originalname));
            }
        }),
        fileFilter: (req, file, cb) => {
            if (file.mimetype.startsWith('audio/') || ApiAudioScribeController.#ALLOWED_EXT.test(file.originalname)) {
                cb(null, true);
            } else {
                cb(new Error('The file must be in a valid audio format'), false);
            }
        },
        limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
    }).single('audioFile');


    // Private properties to queue GPU tasks sequentially, track the active file, and allow job cancellation
    #queue = Promise.resolve();
    #activeFile = null;
    #jobs = new Map(); 


    constructor() {
        // Methods exposed by this API
        this.transcribe = this.transcribe.bind(this);
        this.uploadAudioFile = this.uploadAudioFile.bind(this);
        this.getStatus = this.getStatus.bind(this);
        this.abortTranscription = this.abortTranscription.bind(this);
    }


    // --- PRIVATE METHODS ---

    // Enqueues the task and marks which file has its turn on the GPU
    #enqueue(filename, task) {

        const job = { aborted: false, process: null };
        this.#jobs.set(filename, job);

        const wrappedTask = async () => {
            if (job.aborted) {
                throw new Error('ABORTED');
            }
            this.#activeFile = filename;
            try {
                return await task(job);
            } finally {
                this.#activeFile = null;
                this.#jobs.delete(filename);
            }
        };

        const nextTask = this.#queue.then(wrappedTask, wrappedTask);
        this.#queue = nextTask.catch(() => {});
        return nextTask;
    }


    // Converts a raw duration in seconds into a readable timestamp format (MM:SS or HH:MM:SS)
    #formatTimestamp(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const pad = (num) => String(num).padStart(2, '0');

        return hrs > 0 
            ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` 
            : `${pad(mins)}:${pad(secs)}`;
    }


    // Groups consecutive WhisperX segments by speaker into a clean, timestamped dialogue script
    #formatTranscriptionAsDialogue(whisperResult) {
        if (!whisperResult || !Array.isArray(whisperResult.segments)) {
            return "";
        }

        let formattedDialogue = "";
        let currentSpeaker = null;
        let currentStartTime = null;
        let text2Speech = "";

        whisperResult.segments.forEach(segment => {
            const speaker = segment.speaker || "UNKNOWN";
            const text = segment.text.trim();

            if (speaker !== currentSpeaker) {
                if (currentSpeaker !== null) {
                    formattedDialogue += `[${currentStartTime}] ${currentSpeaker} : ${text2Speech.trim()}\n`;
                }
                currentSpeaker = speaker;
                currentStartTime = this.#formatTimestamp(segment.start);
                text2Speech = text;
            } else {
                text2Speech += " " + text;
            }
        });

        if (currentSpeaker !== null) {
            formattedDialogue += `[${currentStartTime}] ${currentSpeaker} : ${text2Speech.trim()}\n`;
        }

        return formattedDialogue;
    }


    // Spawns the Python WhisperX script for the given audio file and returns its stdout output as a Promise
    #executeWhisper(audioPath, job) {

        return new Promise((resolve, reject) => {

            if (job.aborted) return reject(new Error('ABORTED'));

            const pythonProcess = spawn(
                ApiAudioScribeController.#PYTHON_PATH,
                [ApiAudioScribeController.#SCRIPT_PATH, audioPath]
            );
            job.process = pythonProcess;

            let textOutput = '';
            let errors = '';

            pythonProcess.stdout.on('data', (data) => { textOutput += data.toString(); });
            pythonProcess.stderr.on('data', (data) => { errors += data.toString(); });

            pythonProcess.on('error', (err) => {
                reject(new Error(`Failed to start Python process: ${err.message}`));
            });

            pythonProcess.on('close', (code) => {
                if (job.aborted) {
                    return reject(new Error('ABORTED'));
                }
                if (code !== 0) {
                    const finalMessage = textOutput.trim() || errors.trim();
                    return reject(new Error(`Python error (code ${code}): ${finalMessage}`));
                }
                resolve(textOutput.trim());
            });
        });
    }




    // --- PUBLIC METHODS (ENDPOINTS) ---


    // Returns which file is currently being transcribed (or null if it is free)
    getStatus(req, res) {
        return res.json({ activeFile: this.#activeFile });
    }


    // Uploads an audio file to the server
    uploadAudioFile(req, res) {
        ApiAudioScribeController.#upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ error: `Upload error : ${err.message}` });
            }
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No file was uploaded' });
            }

            return res.status(200).json({
                message: 'Audio uploaded successfully',
                filename: req.file.filename,
                path: req.file.path
            });
        });
    }


    // Validates the audio file, queues its WhisperX transcription, formats the output as dialogue, and cleans up the file afterward
    async transcribe(req, res) {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: 'The filename was not received.' });

        const uniqueName = path.basename(filename);
        const fullAudioPath = path.join(ApiAudioScribeController.#UPLOAD_DIR, uniqueName);

        if (!fs.existsSync(fullAudioPath)) {
            return res.status(404).json({ error: 'The audio filename does not exist on the server' });
        }

        try {
            console.log(`🕒 Enqueued audio: ${uniqueName}`);

            const jsonStringTranscription = await this.#enqueue(uniqueName, (job) => {
                console.log(`⏳ Transcribing and recognizing voices : ${uniqueName}...`);
                return this.#executeWhisper(fullAudioPath, job);
            });

            const jsonStart = jsonStringTranscription.indexOf('{');
            const jsonEnd = jsonStringTranscription.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) throw new Error("The Python output does not contain valid JSON.");

            const jsonResult = JSON.parse(jsonStringTranscription.substring(jsonStart, jsonEnd + 1));
            const formattedDialogue = this.#formatTranscriptionAsDialogue(jsonResult);

            return res.json({
                success: true,
                transcription: formattedDialogue,
                raw: jsonResult
            });

        } catch (error) {
            if (error.message === 'ABORTED') return res.status(499).json({ aborted: true, message: 'Transcription cancelled by user.' });
            console.error('❌ Error in /transcribe:', error);
            return res.status(500).json({ error: error.message || 'Internal error while processing audio with Whisper.' });
        } finally {
            this.#jobs.delete(uniqueName);
            fs.promises.unlink(fullAudioPath).catch(() => {});
        }
    }
    

    // Cancels a queued or running transcription job, kills the Python process if active, and deletes the temporary audio file
    abortTranscription(req, res) {

        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: 'Filename required.' });

        const uniqueName = path.basename(filename);
        const job = this.#jobs.get(uniqueName);

        if (!job) return res.status(404).json({ error: 'No active or queued transcription found for this file.' });

        job.aborted = true;

        if (job.process) job.process.kill('SIGKILL');

        const fullAudioPath = path.join(ApiAudioScribeController.#UPLOAD_DIR, uniqueName);
        fs.promises.unlink(fullAudioPath).catch(() => {});

        console.log(`🛑 Transcription aborted by user: ${uniqueName}`);
        return res.json({ success: true, message: 'Transcription aborted.' });
    }
}

module.exports = ApiAudioScribeController;