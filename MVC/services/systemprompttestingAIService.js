const SystemPromptTestingAIRepository = require('../repositories/systemprompttestingAIRepository');

class SystemPromptTestingAIService { 
    
    constructor() {
        this.systemprompttestingAIRepository = new SystemPromptTestingAIRepository();
    }
};

module.exports = SystemPromptTestingAIService;