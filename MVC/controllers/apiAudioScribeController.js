const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');

class ApiAudioScribeController {

    // --- PRIVATE AND STATIC CONSTANTS ---
    static #UPLOAD_DIR = path.resolve('uploads');
    static #PYTHON_PATH = path.resolve('./.venv/bin/python');
    static #SCRIPT_PATH = path.resolve('python/transcribe.py');

    static { 
        if (!fs.existsSync(this.#UPLOAD_DIR)) {
            fs.mkdirSync(this.#UPLOAD_DIR, { recursive: true }); 
        }
    }

    // Sequential queue and file currently being executed . Private fields
    #queue = Promise.resolve();
    #activeFile = null;

    constructor() {
        this.transcribe = this.transcribe.bind(this);
        this.uploadAudioFile = this.uploadAudioFile.bind(this);
        this.getStatus = this.getStatus.bind(this);
    }

    // --- PRIVATE METHODS ---

    // Enqueues the task and marks which file has its turn on the GPU
    #enqueue(filename, task) {
        const wrappedTask = async () => {
            this.#activeFile = filename;
            try {
                return await task();
            } finally {
                this.#activeFile = null;
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
    #executeWhisper(audioPath) {
        return new Promise((resolve, reject) => {
            const process = spawn(
                ApiAudioScribeController.#PYTHON_PATH,
                [ApiAudioScribeController.#SCRIPT_PATH, audioPath]
            );
            let textOutput = '';
            let errors = '';

            process.stdout.on('data', (data) => {
                textOutput += data.toString();
            });

            process.stderr.on('data', (data) => {
                errors += data.toString();
            });

            process.on('close', (code) => {
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
        const storage = multer.diskStorage({
            destination: (req, file, cb) => cb(null, ApiAudioScribeController.#UPLOAD_DIR),
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, uniqueSuffix + path.extname(file.originalname));
            }
        });

        const fileFilter = (req, file, cb) => {
            if (file.mimetype.startsWith('audio/')) cb(null, true);
            else cb(new Error('The file must be in a valid audio format'), false);
        };

        const upload = multer({
            storage,
            fileFilter,
            limits: { fileSize: 100 * 1024 * 1024 }
        }).single('audioFile');

        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) return res.status(400).json({ error: `Upload error : ${err.message}` });
            if (err) return res.status(400).json({ error: err.message });
            if (!req.file) return res.status(400).json({ error: 'No file was uploaded' });

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

            const jsonStringTranscription = await this.#enqueue(uniqueName, () => {
                console.log(`⏳ Transcribing and recognizing voices : ${uniqueName}...`);
                return this.#executeWhisper(fullAudioPath);
            });

            const jsonStart = jsonStringTranscription.indexOf('{');
            const jsonEnd = jsonStringTranscription.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error("The Python output does not contain valid JSON.");
            }

            const jsonCleaned = jsonStringTranscription.substring(jsonStart, jsonEnd + 1);
            const jsonResult = JSON.parse(jsonCleaned);
            const formattedDialogue = this.#formatTranscriptionAsDialogue(jsonResult);

            return res.json({
                success: true,
                transcription: formattedDialogue,
                raw: jsonResult
            });

        } catch (error) {
            console.error('❌ Error in /transcribe:', error);
            return res.status(500).json({ error: error.message || 'Internal error while processing audio with Whisper.' });
        } finally {
            fs.promises.unlink(fullAudioPath).catch(() => {});
        }
    }
}

module.exports = ApiAudioScribeController;
