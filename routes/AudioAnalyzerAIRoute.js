const AudioAnalyzerAIController = require('../MVC/controllers/audioanalyzerAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const audioanalyzerAIController = new AudioAnalyzerAIController();

// Manage the GET request to /users
router.get('/', audioanalyzerAIController.start);

module.exports = router;