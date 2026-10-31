const ManequinManAIRepository = require('../repositories/manequinmanAIRepository');

class ManequinManAIService { 
    constructor() {
        this.manequinmanAIRepository = new ManequinManAIRepository();
    }
};

module.exports = ManequinManAIService;