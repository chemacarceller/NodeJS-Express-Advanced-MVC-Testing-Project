const ApiIAgentController = require('../MVC/controllers/apiIAgentController');

const express = require('express');

// Create a modular and isolated router in Express
const router = express.Router();

const apiIAgentController = new ApiIAgentController();

router.post('/init-agent', (req, res) => apiIAgentController.initAgent(req, res));
router.post('/send-message', (req, res) => apiIAgentController.sendMessage(req, res));
router.post('/create-custom-model', (req, res) => apiIAgentController.createCustomModel(req, res));
router.post('/fix-model-system', (req, res) => apiIAgentController.fixModelSystem(req, res));
router.post('/expired-session-consult', (req, res) => apiIAgentController.expiredSessionConsult(req, res));
router.post('/closure-cancel', (req, res) => apiIAgentController.closureCancel(req, res));
router.post('/closure-notify', (req, res) => apiIAgentController.closureNotify(req, res));

module.exports = router;