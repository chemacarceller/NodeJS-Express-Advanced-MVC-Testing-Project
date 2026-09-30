const ApiController = require('../MVC/controllers/apiController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const apiController = new ApiController();

// List of AJAX requests, all starting with /api
router.get('/users', (req, res) => apiController.getUsers(req, res));

module.exports = router;