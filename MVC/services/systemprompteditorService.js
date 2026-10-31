const SystemPromptEditorRepository = require('../repositories/systemprompteditorRepository');

class SystemPromptEditorService { 
    constructor() {
        this.systemprompteditorRepository = new SystemPromptEditorRepository();
    }
};

module.exports = SystemPromptEditorService;