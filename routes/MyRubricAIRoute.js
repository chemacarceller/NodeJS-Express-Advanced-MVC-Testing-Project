const MyRubricAIController = require('../MVC/controllers/myrubricAIController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const myrubricAIController = new MyRubricAIController();

// Manage the GET request to /users
router.get('/', myrubricAIController.start);

module.exports = router;