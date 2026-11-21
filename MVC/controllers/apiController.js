// Import for handling AJAX requests
const UserService = require('../services/userService');
const say = require('say');

class ApiController {

    constructor() {
        this.userService = new UserService();
        this.getUsers = this.getUsers.bind(this);
    }

    async getUsers(req, res) {
        try {
            const activeOnly = req.query.activeUser === 'true';
            const users = await this.userService.getUsersForList(activeOnly);
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

}

module.exports = ApiController;