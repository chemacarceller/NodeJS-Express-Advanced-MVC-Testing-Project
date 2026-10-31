const ManequinWomanAIModel = require('../models/manequinwomanAIModel'); 

class ManequinWomanAIRepository { 
    constructor() {
        this.manequinwomanAIModel = new ManequinWomanAIModel();
    }
};

module.exports = ManequinWomanAIRepository;