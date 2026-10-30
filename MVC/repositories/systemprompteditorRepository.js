const SystemPromptEditorModel = require('../models/systemprompteditorModel'); 

class SystemPromptEditorRepository { 
    constructor() {
        this.systemprompteditorModel = new SystemPromptEditorModel();
    }
};

module.exports = SystemPromptEditorRepository;