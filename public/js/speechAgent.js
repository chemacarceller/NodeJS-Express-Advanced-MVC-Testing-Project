const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

const eventClick = new Event('click', { bubbles: true });
const agentState = { hearing: false };
const hearEvent = new CustomEvent("hearEvent", { detail: agentState, bubbles: true });

export default class SpeechAgent {

    constructor({inputLanguage='es-Es', outputLanguage='es-Es'} = {}) {
  
        this.lang = outputLanguage;
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
            this.recognition.lang = inputLanguage;
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
        }

        this.#initVoices('es');
    }

    #initVoices(language, favouriteVoice='') {

        const loadVoice = () => {

            const voices = window.speechSynthesis.getVoices();
            const voicesInLanguage = voices.filter(v => v.lang.includes(language));

            if (voicesInLanguage.length > 0) {
                const favorite = voicesInLanguage.find(v => v.name.includes(favouriteVoice));
                this.voice = favorite || voicesInLanguage[0];
            } else {
                console.log("No entries have been found in the specified language:" + language);
                return;
            }
        };

        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoice;
        }
    }


    speak(text) {
        
        const cleanText = text.replace(/\./g, '');
        if (!cleanText) return;

        this.messageQueue.push(cleanText);
        
        if (!this.speaking) this.#processQueue();
    }

    #processQueue() {

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

        reading.onend = () => this.#processQueue();
        reading.onerror = () => this.#processQueue();

        window.speechSynthesis.speak(reading);
    }

    stopHearing() { if (this.recognition) this.recognition.stop(); }

    async hear(inputMessage) {

        let fixedText = "";

        if (!this.hearing) {
            fixedText = inputMessage.value;
            this.recognition.start();
        } else this.recognition.stop();

        this.recognition.onstart = () => {
            this.hearing = true;
            agentState.hearing = true;
            window.dispatchEvent(hearEvent); 
        };

        this.recognition.onend = () => {
            this.hearing = false;
            agentState.hearing = false;
            window.dispatchEvent(hearEvent); 
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
                        const cleanText = event.results[i][0].transcript.replace(/punto y final/i, '').trim();
                        if (cleanText) currentFixedText += cleanText + ". ";
                        fixedText = currentFixedText;
                        inputMessage.value = fixedText;
                        this.stopHearing();
                        btnSend.dispatchEvent(eventClick);                        
                        return;
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