const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition


const eventClick = new Event('click', { bubbles: true });

export default class SpeechAgent {

    constructor() {
  
        this.lang = 'es-ES';
        this.rate = 1;
        this.pitch = 1;
        this.voice = null;
        
        this.messageQueue = [];
        this.speaking = false;
        this.hearing = false;

        this.recognition = null;

        this.isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

        if (!SpeechRecognition) {
            console.error("This browser does not support SpeechRecognition.");
            return;
        } else {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'es-ES';
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
        }

        this._initVoices();
    }

    _initVoices(favouriteVoice='') {

        const loadVoice = (favouriteVoice='') => {

            const voices = window.speechSynthesis.getVoices();
            const voicesInSpanish = voices.filter(v => v.lang.includes('es'));

            if (voicesInSpanish.length > 0) {
                const favorite = voicesInSpanish.find(v => v.name.includes(favouriteVoice));
                this.voice = favorite || voicesInSpanish[0];
            }
        };

        loadVoice();

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoice;
        }
    }


    speak(text) {
        
        const cleanText = text.replace(/\./g, '');
        if (!cleanText) return;

        this.messageQueue.push(cleanText);
        
        if (!this.hablando) this._processQueue();
    }

    _processQueue() {

        if (this.messageQueue.length === 0) {
            this.speaking = false;
            return;
        }

        this.speaking = true;
        const nextItem = this.messageQueue.shift();

        const reading = new SpeechSynthesisUtterance(nextItem);
        reading.lang = this.lang;
        reading.rate = this.rate;
        reading.pitch = this.pitch;
        if (this.voice) reading.voice = this.voice;

        reading.onend = () => this._processQueue();
        reading.onerror = () => this._processQueue();

        window.speechSynthesis.speak(reading);
    }

    stopHearing() { if (this.recognition) this.recognition.stop(); }

    async hear() {

        let fixedText = "";

        if (!this.hearing) {
            fixedText = inputMessage.value;
            this.recognition.start();
        } else this.recognition.stop();

        this.recognition.onstart = () => {
            this.hearing = true;
            btnVoice.textContent = "Stop Dictation";
            btnVoice.classList.add('hearing');
        };

        this.recognition.onend = () => {
            this.hearing = false;
            btnVoice.textContent = "Start Dictation";
            btnVoice.classList.remove('hearing');    
        };

        this.recognition.onresult = (event) => {

            let provisionaltext = "";
            let currentFixedText = "";

            for (let i = 0; i < event.results.length; ++i) {
        
                if (!event.results[i] || !event.results[i][0] || typeof event.results[i][0].transcript === 'undefined') continue;

                let transcription = event.results[i][0].transcript.trim().toLowerCase();

                if (transcription === "borrar todo") {
                    fixedText = "";
                    inputMessage.value = "";
                    this.recognition.abort(); 
                    setTimeout(() => {
                        this.hearing = true;
                        this.recognition.start();
                    }, 100);
                    return;
                }

                transcription = event.results[i][0].transcript.toLowerCase().trim();

                if (event.results[i].isFinal) {
                    if (transcription.includes("punto y final")) {
                        this.stopHearing();
                        btnSend.dispatchEvent(eventClick);                        
                    } else if (transcription.includes("punto y aparte")) {
                        const textBeforeCommand = event.results[i][0].transcript.replace(/punto y aparte/i, '').trim();
                        currentFixedText += (textBeforeCommand ? textBeforeCommand + " " : "") + ".\n";
                        fixedText += (textBeforeCommand ? textBeforeCommand + " " : "") + ".\n";
                    } else {
                        currentFixedText += event.results[i][0].transcript + " ";
                    }
                } else {
                    if (!transcription.includes("punto y aparte") && !transcription.includes("borrar todo")) {
                        provisionaltext += event.results[i][0].transcript;
                    }
                }
            }
            fixedText = currentFixedText;
            inputMessage.value = fixedText + provisionaltext;
            inputMessage.scrollTop = inputMessage.scrollHeight;
        };
    }
}