const ManequinManAIController = require('../MVC/controllers/manequinmanAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const manequinmanAIController = new ManequinManAIController();

// Manage the GET request to /users
router.get('/', manequinmanAIController.start);

module.exports = router;