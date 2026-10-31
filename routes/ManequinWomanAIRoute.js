const ManequinWomanAIController = require('../MVC/controllers/manequinwomanAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const manequinwomanAIController = new ManequinWomanAIController();

// Manage the GET request to /users
router.get('/', manequinwomanAIController.start);

module.exports = router;