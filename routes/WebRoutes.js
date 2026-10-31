const HomeController = require('../MVC/controllers/homeController'); 

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

// Route handling for `/users` is moved to the `./users.js` file—that is, the same level as `index.js`.
const usersRouter = require('./UserRoute');
router.use('/users', usersRouter); 

const speechAIRouter = require('./SpeechAIRoute');
router.use('/speechAI', speechAIRouter); 

const translatorAIRouter = require('./TranslatorAIRoute');
router.use('/translatorAI', translatorAIRouter); 

const systemprompteditorRouter = require('./SystemPromptEditorRoute');
router.use('/systemprompteditor', systemprompteditorRouter); 

const systemprompttestingAIRouter = require('./SystemPromptTestingAIRoute');
router.use('/systemprompttestingAI', systemprompttestingAIRouter); 

const audioanalyzerAIRouter = require('./AudioAnalyzerAIRoute');
router.use('/audioanalyzerAI', audioanalyzerAIRouter); 

const manequinmanAIRouter = require('./ManequinManAIRoute');
router.use('/manequinmanAI', manequinwManAIRouter); 

const manequinwomanAIRouter = require('./ManequinWomanAIRoute');
router.use('/manequinwomanAI', manequinwomanAIRouter);

// The home route is handled via indexController.start
const homeController = new HomeController();
router.get('/', homeController.start); 

module.exports = router;