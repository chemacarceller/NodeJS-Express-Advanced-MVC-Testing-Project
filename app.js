const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();
const PORT = 3000;
app.locals.title = 'My Testing Web Site'; 

// EJS template engine configuration
app.set('view engine', 'ejs');

// Change EJS template path
app.set('views', path.join(__dirname, 'MVC', 'views'));

// We enable the template system (Layouts) to have a common base design.
app.use(expressLayouts); 

// Extract the <style> and <link> elements from the child views to place them in the <head> of the global layout
app.set("layout extractStyles", true); 

// Serve static files (CSS, images, client-side JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Loads and connects the main router (route aggregator from the routes folder)
const apiRouter = require('./routes');
app.use('/', apiRouter);






// Temporary route to test the 500 error
app.get('/forzar-error', (req, res, next) => {
    throw new Error('Oops! This is an error triggered for testing purposes.');
});




// Code for error page; ALWAYS at the end of app.js

// Middleware to handle not-found routes (404)
app.use((req, res, next) => {
    const errorCode = 404;
    res.status(404).render('error', {
        title: `Error ${errorCode}`,
        errorCodecode: 404,
        message: "We're sorry, the page you are looking for does not exist."
    });
});

// General server error handling middleware (500)
app.use((err, req, res, next) => {
    const errorCode = 500;
    console.error(err.stack); 
    res.status(500).render('error', {
        title: `Error ${errorCode}`,
        errorCodecode: errorCode,
        message: err.message || 'There was an internal server problem. Please try again later.'
    });
});

module.exports = app;