const CharacterAIController = require('../MVC/controllers/characterAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const characterAIController = new CharacterAIController();

// Manage the GET request to /users
router.get('/', characterAIController.start);

module.exports = router;