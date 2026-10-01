const SpeechAIController = require('../MVC/controllers/speechAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const speechAIController = new SpeechAIController();

// Manage the GET request to /users
router.get('/', speechAIController.start); 

module.exports = router;