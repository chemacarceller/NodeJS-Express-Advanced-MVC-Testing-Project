const TranslatorAIController = require('../MVC/controllers/translatorAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const translatorAIController = new TranslatorAIController();

// Manage the GET request to /users
router.get('/', translatorAIController.start); 

module.exports = router;