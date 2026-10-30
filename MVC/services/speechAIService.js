const SpeechAIRepository = require('../repositories/speechAIRepository');

class SpeechAIService { 
    constructor() {
        this.speechAIRepository = new SpeechAIRepository();
    }
};

module.exports = SpeechAIService;