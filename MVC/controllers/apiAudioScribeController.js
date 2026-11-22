// Imports required in the class
const path = require('path');
const fs = require('fs');

// Manages the uploading of files (such as audio or video) sent from a form or an HTTP request
const multer = require('multer');

// Allows you to run external processes (such as a Python script with WhisperX) in the background and communicate with them in real time.
const { spawn } = require('child_process');


// ApiAudioScribeController Class
// Provides the necessary methods to manage the transcription of an audio file
class ApiAudioScribeController {

    // --- PRIVATE AND STATIC CONSTANTS ---
    static #UPLOAD_DIR = path.resolve('uploads');
    static #PYTHON_PATH = path.resolve('./.venv/bin/python');
    static #SCRIPT_PATH = path.resolve('python/transcribe.py');

    // Static block: executed only once when the class is loaded
    static { if (!fs.existsSync(this.#UPLOAD_DIR)) fs.mkdirSync(this.#UPLOAD_DIR, { recursive: true }); }

    constructor() {
        this.transcribe = this.transcribe.bind(this);
        this.uploadAudioFile = this.uploadAudioFile.bind(this);
    }

    // --- PRIVATE METHODS ---

    async #cleanPreviousUploads(currentFilename) {
        try {
            const files = await fs.promises.readdir(ApiAudioScribeController.#UPLOAD_DIR);
            for (const file of files) {
                if (file !== currentFilename) {
                    const filePath = path.join(ApiAudioScribeController.#UPLOAD_DIR, file);
                    await fs.promises.unlink(filePath);
                    console.log(`Old file deleted : ${file}`);
                }
            }
        } catch (error) {
            console.error('Error while cleaning up old files : ', error);
        }
    }


    // Converts the raw output of WhisperX (split into multiple loose segments) into a clean script or dialogue 
    // grouped by speaker and adding timestamps
    #formatTimestamp(seconds) {

        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const pad = (num) => String(num).padStart(2, '0');

        return hrs > 0 
            ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` 
            : `${pad(mins)}:${pad(secs)}`;
    }

    #formatTranscriptionAsDialogue(whisperResult) {

        let formattedDialogue = "";
        let currentSpeaker = null;
        let currentStartTime = null;
        let text2Speech = "";

        whisperResult.segments.forEach(segment => {

            const speaker = segment.speaker || "UNKNOWN";
            const text = segment.text.trim();

            if (speaker !== currentSpeaker) {
                if (currentSpeaker !== null) formattedDialogue += `[${currentStartTime}] ${currentSpeaker} : ${text2Speech.trim()}\n`;
                currentSpeaker = speaker;
                currentStartTime = this.#formatTimestamp(segment.start);
                text2Speech = text;
            } else text2Speech += " " + text;
        });

        if (currentSpeaker !== null) formattedDialogue += `[${currentStartTime}] ${currentSpeaker} : ${text2Speech.trim()}\n`;

        return formattedDialogue;
    }

    // Runs the WhisperX Python script in the background from Node.js
    // Captures what it prints to the console and wraps it in a Promise
    // So it can be easily used with async/await.
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

    // manages the reception, validation, and storage on disk of an audio file sent to the API,
    // also cleaning up previous files before confirming the upload to the client.
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

        upload(req, res, async (err) => {

            if (err instanceof multer.MulterError) return res.status(400).json({ error: `Upload error : ${err.message}` });
            if (err) return res.status(400).json({ error: err.message });
            if (!req.file) return res.status(400).json({ error: 'No file was uploaded' });

            await this.#cleanPreviousUploads(req.file.filename);

            return res.status(200).json({
                message: 'Audio uploaded successfully',
                filename: req.file.filename,
                path: req.file.path
            });
        });
    }

    // Main endpoint that orchestrates the entire transcription process:
    // Receives the name of a file previously uploaded with uploadAudioFile,
    // Runs WhisperX on it,
    // Cleans up the Python response,
    // Formats the dialog,
    // and returns the result to the client.
    async transcribe(req, res) {

        const { filename } = req.body;

        if (!filename) return res.status(400).json({ error: 'The filename was not received.' });

        const uniqueName = path.basename(filename);
        const fullAudioPath = path.join(ApiAudioScribeController.#UPLOAD_DIR, uniqueName);

        if (!fs.existsSync(fullAudioPath)) return res.status(404).json({ error: 'The audio filename does not exist on the server' });

        try {

            console.log(`⏳ Transcribing and recognizing voices : ${uniqueName}...`);
            const jsonStringTranscription = await this.#executeWhisper(fullAudioPath);

            const jsonStart = jsonStringTranscription.indexOf('{');
            const jsonEnd = jsonStringTranscription.lastIndexOf('}');

            if (jsonStart === -1 || jsonEnd === -1) throw new Error("The Python output does not contain valid JSON.");

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
        }
    }
}

module.exports = ApiAudioScribeController;