const userController = require('../MVC/controllers/userController'); 
const express = require('express');
const router = express.Router();

// The users route is handled via userController.listUsers
router.get('/', userController.listUsers); 

module.exports = router;