const TranslatorAIRepository = require('../repositories/translatorAIRepository');

class TranslatorAIService { 
    constructor() {
        this.translatorAIRepository = new TranslatorAIRepository();
    }
};

module.exports = TranslatorAIService;