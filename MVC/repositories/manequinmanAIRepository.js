const ManequinManAIModel = require('../models/manequinmanAIModel'); 

class ManequinManAIRepository { 
    constructor() {
        this.manequinmanAIModel = new ManequinManAIModel();
    }
};

module.exports = ManequinManAIRepository;