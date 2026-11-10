const LightBulbAIController = require('../MVC/controllers/lightbulbAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const lightbulbAIController = new LightBulbAIController();

// Manage the GET request to /users
router.get('/', lightbulbAIController.start);

module.exports = router;