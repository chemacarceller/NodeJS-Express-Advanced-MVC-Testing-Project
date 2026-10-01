// The service class uses the repository class to access data and implements business logic.
const SpeechAIRepository = require('../repositories/speechAIRepository');

class SpeechAIService { 

    constructor() {
        this.speechAIRepository = new SpeechAIRepository();
    }
};

module.exports = SpeechAIService;