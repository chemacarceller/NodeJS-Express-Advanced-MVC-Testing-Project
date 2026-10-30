const SystemPromptEditorController = require('../MVC/controllers/systemprompteditorController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const systemprompteditorController = new SystemPromptEditorController();

// Manage the GET request to /users
router.get('/', systemprompteditorController.start);

module.exports = router;