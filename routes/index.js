const IndexController = require('../MVC/controllers/indexController'); 

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

// Route handling for `/users` is moved to the `./users.js` file—that is, the same level as `index.js`.
const usersRouter = require('./users.js');
router.use('/users', usersRouter); 

// The home route is handled via indexController.start
const indexController = new IndexController();
router.get('/', indexController.start); 

module.exports = router;