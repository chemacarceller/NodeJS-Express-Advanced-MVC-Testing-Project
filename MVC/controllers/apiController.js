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

            // Secure UUID generation using the native Node.js module
            const serverSessionId = crypto.randomUUID ? crypto.randomUUID() 
                : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/init-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sessionId: serverSessionId,
                    mode: mode || 'NormalDB' 
                })
            });

            // If the response is not successful, we throw an exception
            if (!response.ok) {
                const errorJson = await response.json();
                throw errorJson;
            }
    
            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Intelligence Agent sucessfully initialized',
                sessionId: serverSessionId,
                status: response.status 
            });            

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.error || 'Error in Aplication initializing agent',
                details: error.details || 'Remote Fetch Failed'
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

            // If the response is not successful, we throw an exception
            if (!response.ok) {
                const errorJson = await response.json();
                throw errorJson;
            }

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Model created successfully',
                status: response.status 
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.error || 'Error in Aplication creating custom model',
                details: error.details || 'Remote Fetch Failed'
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

            // If the response is not successful, we throw an exception
             if (!response.ok) {
                const errorJson = await response.json();
                throw errorJson;
            }

            // Here we know that the request is successful, so we retrieve the data
            const data = await response.json();

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Message sent successfully',
                answer: data.answer,
                status: response.status 
            });            

        } catch (error) {
            
            return res.status(500).json({
                success: false,
                error: error.error || 'Error in Aplication sending message',
                details: error.details || 'Remote Fetch Failed'
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

            // If the response is not successful, we throw an exception
            if (!response.ok) {
                const errorJson = await response.json();
                throw errorJson;
            }

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Model fixed successfully',
                status: response.status 
            });

        } catch (error) {

            return res.status(500).json({
                success: false,
                error: error.error || 'Error in Aplication fixing the model system',
                details: error.details || 'Remote Fetch Failed'
            });
        }
    }
}

module.exports = ApiController;