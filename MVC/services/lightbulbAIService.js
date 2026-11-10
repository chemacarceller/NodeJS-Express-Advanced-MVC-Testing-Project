const LightBulbAIRepository = require('../repositories/lightbulbAIRepository');

class LightBulbAIService { 
    constructor() {
        this.lightbulbAIRepository = new LightBulbAIRepository();
    }
};

module.exports = LightBulbAIService;