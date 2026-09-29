const UserController = require('../MVC/controllers/userController');
const express = require('express');
const router = express.Router();

const userController = new UserController();
router.get('/', userController.listUsers); 

module.exports = router;