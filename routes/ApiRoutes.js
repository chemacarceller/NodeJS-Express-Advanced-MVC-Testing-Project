const ApiController = require('../MVC/controllers/apiController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const apiController = new ApiController();

// List of AJAX requests, all starting with /api
router.get('/users', (req, res) => apiController.getUsers(req, res));
router.post('/reproduce', (req, res) => apiController.reproduce(req, res));

router.post('/client/init-agent', (req, res) => apiController.initAgent(req, res));
router.post('/client/send-message', (req, res) => apiController.sendMessage(req, res));

module.exports = router;