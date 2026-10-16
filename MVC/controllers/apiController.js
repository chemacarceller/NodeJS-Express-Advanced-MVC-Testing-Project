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

             const serverSessionId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() 
                                            : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            const response = await fetch(`${PRIVATE_AGENT_URL}/init-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    sessionId: serverSessionId,
                    mode: mode || 'NormalDB' })
            });

            const data = await response.json();
        
            if (!response.ok) throw new Error(data.error || 'Error en el servidor privado de agentes');
        
            res.json({ 
                success: true, 
                sessionId: serverSessionId 
            });

        } catch (error) {
            console.error('❌ Error in proxy /init-agent:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }

    }

    async sendMessage(req, res) {

        try {
            const { sessionId, message } = req.body;

            const response = await fetch(`${PRIVATE_AGENT_URL}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Error al procesar el mensaje en el agente');
        
            res.json({ success: true, answer: data.answer });

        } catch (error) {
            console.error('❌ Error en proxy /send-message:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }

    }

}

module.exports = ApiController;