const express = require('express');
const router = express.Router();

const usersRouter = require('./users');
router.use('/users', usersRouter); 

router.get('/', (req, res) => {

    // Renders the 'views/index.ejs' file and passes data to it
    res.render('index', { 
        title: 'Home - My Testing Web Site',
        message: 'Hello! EJS is configured correctly.' 
    });
});

module.exports = router;
