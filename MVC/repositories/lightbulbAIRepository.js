const LightBulbAIModel = require('../models/lightbulbAIModel'); 

class LightBulbAIRepository { 
    constructor() {
        this.lightbulbAIModel = new LightBulbAIModel();
    }
};

module.exports = LightBulbAIRepository;