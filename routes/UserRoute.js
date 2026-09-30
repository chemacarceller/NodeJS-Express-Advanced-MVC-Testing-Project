const UserController = require('../MVC/controllers/userController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const userController = new UserController();

// Manage the GET request to /users
router.get('/', userController.listUsers); 

module.exports = router;