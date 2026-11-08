const CharacterAIModel = require('../models/characterAIModel'); 

class CharacterAIRepository { 
    constructor() {
        this.characterAIModel = new CharacterAIModel();
    }
};

module.exports = CharacterAIRepository;