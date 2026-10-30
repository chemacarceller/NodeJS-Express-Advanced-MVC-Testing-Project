const SpeechAIModel = require('../models/speechAIModel'); 

class SpeechAIRepository { 
    constructor() {
        this.speechAIModel = new SpeechAIModel();
    }
};

module.exports = SpeechAIRepository;