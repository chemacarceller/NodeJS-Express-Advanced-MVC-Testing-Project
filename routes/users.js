const userController = require('../MVC/controllers/userController'); 
const express = require('express');
const router = express.Router();

router.get('/', userController.listUsers); 

module.exports = router;