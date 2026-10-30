const SystemPromptTestingAIModel = require('../models/systemprompttestingAIModel'); 

class SystemPromptTestingAIRepository { 
    constructor() {
        this.systemprompttestingAIModel = new SystemPromptTestingAIModel();
    }
};

module.exports = SystemPromptTestingAIRepository;