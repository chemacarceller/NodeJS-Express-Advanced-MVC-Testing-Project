const CharacterAIRepository = require('../repositories/characterAIRepository');

class CharacterAIService { 
    constructor() {
        this.characterAIRepository = new CharacterAIRepository();
    }
};

module.exports = CharacterAIService;