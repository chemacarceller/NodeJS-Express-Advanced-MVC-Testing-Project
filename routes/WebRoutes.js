const HomeController = require('../MVC/controllers/homeController'); 

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

// Route handling for `/users` is moved to the `./users.js` file—that is, the same level as `index.js`.
const usersRouter = require('./UserRoute');
router.use('/users', usersRouter); 

// The home route is handled via indexController.start
const homeController = new HomeController();
router.get('/', homeController.start); 

module.exports = router;