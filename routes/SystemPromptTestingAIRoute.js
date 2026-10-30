const SystemPromptTestingAIController = require('../MVC/controllers/systemprompttestingAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const systemprompttestingAIController = new SystemPromptTestingAIController();

// Manage the GET request to /users
router.get('/', systemprompttestingAIController.start);

module.exports = router;