// List of services to import for handling AJAX requests
const UserService = require('../services/userService');

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
}

module.exports = ApiController;