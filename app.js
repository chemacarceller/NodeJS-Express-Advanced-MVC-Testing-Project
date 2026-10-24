// Loads environment variables from a secret file named .env into the Node.js process.env object
require('dotenv').config();

// Import Express.js, the most popular web framework for Node.js.
const express = require('express');

// Import the `cors` package, which is a middleware for Express used to enable and configure CORS (Cross-Origin Resource Sharing).
const cors = require('cors');

// Import the native Node.js 'path' module, which contains tools for managing, combining, 
// and manipulating file and folder paths.
const path = require('path');

// creates an instance of the Express application and stores it in the variable named `app`.
const app = express();
app.locals.title = 'My Testing Web Site';

// Imports a plugin for the EJS template engine.
// Its main function is to allow you to use a common base layout
// as a template that already includes the navigation menu and footer,
// so you don't have to repeat that same HTML code on every page of your site.
const expressLayouts = require('express-ejs-layouts');

// EJS template engine configuration
app.set('view engine', 'ejs');

// Change EJS template path
app.set('views', path.join(__dirname, 'MVC', 'views'));

// Extract the <style> and <link> elements from the child views to place them in the <head> of the global layout
app.set("layout extractStyles", true); 

app.set('view cache', false);


// It is an Express middleware that allows your server to understand and process data received in JSON format.
app.use(express.json());

const THIS_HOST = process.env.THIS_HOST || '127.0.0.1';
const THIS_PORT = process.env.THIS_PORT || '4501';
const THIS_URL = `http://${THIS_HOST}:${THIS_PORT}`; 

app.use(cors({
    origin: ['http://localhost:4501', `${THIS_URL}`],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// It is an Express middleware that allows your server to understand and process data sent from native HTML forms.
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, images, client-side JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// We enable the template system (Layouts) to have a common base design.
app.use(expressLayouts); 

// Loads and connects the main router (route aggregator from the routes folder)
// The home route is managed via an WebRoutes.js file located within ./routes
const WebRoutes = require('./routes/WebRoutes');
app.use('/', WebRoutes);

// The AJAX routes (classes that return res.json) managed via an ApiRoyes.js file located within ./routes
const ApiRoutes = require('./routes/ApiRoutes');
app.use('/api', ApiRoutes); 


// It serves to efficiently silence the automatic requests that web browsers make when looking for your website's icon (the favicon).
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Temporary route to force the 500 error
app.get('/force-error', (req, res, next) => {
    const finalMessage = req.query.msg ? decodeURIComponent(req.query.msg) : 'Oops! This is an error triggered for testing purposes.';
    return next(new Error(finalMessage));
});




// Code for error page; ALWAYS at the end of app.js

// Middleware to handle not-found routes (404)
// Since it has three parameters (req, res, next), Express treats it as a standard middleware in the chain.
// By placing it at the very end of your routes file, if no preceding route has responded to the request, 
// the code execution naturally reaches this block.
// Since no route matches, you confirm that the page does not exist and return a 404 status.. */
app.use((req, res, next) => {
    const errorCode = 404;
    res.status(404).render('error', {
        title: `Error ${errorCode}`,
        errorCode : 404,
        message: "We're sorry, the page you are looking for does not exist."
    });
});

// General server error handling middleware (500)
// When you use `throw` or pass an error object to `next(error)`, Express stops the application's normal execution 
// and jumps directly to the first middleware that has exactly four parameters.
// This four-argument function explicitly tells Express: "I am a server error handler."
// Any internal server error, database crash, or manually thrown exception with throw triggers this special mechanism. 
// Express will ignore all normal middlewares (including 404)
app.use((err, req, res, next) => {
    const errorCode = 500;
    res.status(500).render('error', {
        title: `Error ${errorCode}`,
        errorCode: errorCode,
        message: err.message || 'There was an internal server problem. Please try again later',
        layout: 'layout' 
    });
});

module.exports = app;