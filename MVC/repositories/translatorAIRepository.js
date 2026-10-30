const TranslatorAIModel = require('../models/translatorAIModel'); 

class TranslatorAIRepository { 
    constructor() {
        this.translatorAIModel = new TranslatorAIModel();
    }
};

module.exports = TranslatorAIRepository;