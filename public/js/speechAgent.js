export default class SpeechAgent {

    constructor() {
  
        this.lang = 'es-ES';
        this.rate = 1;
        this.pitch = 1;
        this.voice = null;
        
        this.messageQueue = [];
        this.speaking = false;

        this._initVoices();
    }

    _initVoices(favouriteVoice='') {

        const loadVoice = () => {

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
}