const ManequinWomanAIRepository = require('../repositories/manequinwomanAIRepository');

class ManequinWomanAIService { 
    constructor() {
        this.manequinwomanAIRepository = new ManequinWomanAIRepository();
    }
};

module.exports = ManequinWomanAIService;