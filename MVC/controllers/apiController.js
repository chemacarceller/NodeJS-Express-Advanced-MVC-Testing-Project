// List of services to import for handling AJAX requests
const UserService = require('../services/userService');
const say = require('say');

const HOST_IAGENT = process.env.HOST_IAGENT || '127.0.0.1';
const PORT_IAGENT = process.env.PORT_IAGENT || '4500';
const PRIVATE_AGENT_URL = `http://${HOST_IAGENT}:${PORT_IAGENT}/api`; 

// Controller class that handles all AJAX requests
class ApiController {

    constructor() {
        this.userService = new UserService();
        this.getUsers = this.getUsers.bind(this);
    }

    async getUsers(req, res) {
        try {

            // Retrieve the boolean value activeUser; defaults to true if not provided.
            const activeOnly = req.query.activeUser === 'true';

            // Users must be accessed via the userService service.
            const users = await this.userService.getUsersForList(activeOnly);

            // Return the data JSON, indicating success
            // Since the apiController class is for managing ajax requests, it does not render any page but sends
            // the data as a JSON
            // Even though the function is async, Express's res.json() method takes your JavaScript object, 
            // transforms it into a JSON-formatted string, and sends it over the HTTP network.            
            return res.status(200).json({ success: true, data: users });

        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    async reproduce(req, res) {
    
        const { text } = req.body;
        console.log(`[Server] Request received to play: "${text}"`);

        say.speak(text, null, 1.0, (err) => {
            if (err) {
                console.error("Error in say.speak:", err);
                if (!res.headersSent) return res.status(500).json({ error: "Unable to play" });
                return;
            }
            console.log("[Server] Playback finished.");
        });
        res.json({ success: true, message: "Playing sound on the server" });
    }

    
    async initAgent(req, res) {
    
        try {

            const { mode } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/init-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: mode || 'NormalDB'
                })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(data);
    
            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Intelligence Agent sucessfully initialized',
                sessionId: data.sessionId,
                status: response.status 
            });            

        } catch (error) {

            // If an error occurs within the try block of this class or in the Intelligence Agent module
            const realDetail = error.cause ? error.cause.message : error.message;

            return res.status(500).json({
                success: false,
                error: error.error || 'Error in the Agent API Controller Module Failed to initialize the agent',
                details: error.details || `${realDetail}`
            });
        }
    }


    async createCustomModel(req, res) {
        
        try {

            const { sessionId, modelName, from, system, parameters } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/create-custom-model`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, modelName, from, system, parameters })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(data);

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Model created successfully',
                status: response.status 
            });

        } catch (error) {

            // If an error occurs within the try block of this class or in the Intelligence Agent module
            const realDetail = error.cause ? error.cause.message : error.message;

            return res.status(500).json({
                success: false,
                error: error.error || 'Error in the Agent API Controller Module Failed to create the custom model',
                details: error.details || `${realDetail}`
            });
        }

    }


    async fixModelSystem(req, res) {

        try {

            const { sessionId, system, parameters } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/fix-model-system`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, system, parameters })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(data);

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Model fixed successfully',
                status: response.status 
            });

        } catch (error) {

            // If an error occurs within the try block of this class or in the Intelligence Agent module
            const realDetail = error.cause ? error.cause.message : error.message;

            return res.status(500).json({
                success: false,
                error: error.error || 'Error in the Agent API Controller Module Failed to fix the model',
                details: error.details || `${realDetail}`
            });
        }
    }


    async sendMessage(req, res) {

        try {

            const { sessionId, message, type, promptWrapper, model } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message, type, promptWrapper, model })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(data);

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Message sent successfully',
                answer: data.answer,
                status: response.status 
            });            

        } catch (error) {

            // If an error occurs within the try block of this class or in the Intelligence Agent module
            const realDetail = error.cause ? error.cause.message : error.message;

            return res.status(500).json({
                success: false,
                error: error.error || 'Error in the Agent API Controller Module Failed to send the message',
                details: error.details || `${realDetail}`
            });
        }
    }

    async expiredSessionConsult(req, res) {

        try {

            const { sessionId } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/expired-session-consult`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(data);

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                msg: data.msg,
                status: data.status 
            });

        } catch (error) {

            // If an error occurs within the try block of this class or in the Intelligence Agent module
            const realDetail = error.cause ? error.cause.message : error.message;

            return res.status(500).json({
                success: false,
                error: error.error || 'Error in the Agent API Controller Module during expired session consultation',
                details: error.details || `${realDetail}`
            });
        }
    }
}

module.exports = ApiController;