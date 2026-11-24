const ApiAudioScribeController = require('../MVC/controllers/apiAudioScribeController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const apiAudioScribeController = new ApiAudioScribeController();

// List of AJAX requests, all starting with /api
router.post('/upload-audio', (req, res) => apiAudioScribeController.uploadAudioFile(req, res));
router.post('/transcribe', (req, res) => apiAudioScribeController.transcribe(req, res));
router.get('/status', (req, res) => apiAudioScribeController.getStatus(req, res));

module.exports = router;