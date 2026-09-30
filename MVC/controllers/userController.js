// We obtain the service object responsible for requesting data from the repository object.
// and implement the potential business logic
const UserService = require('../services/userService');

// The controller class simply manages data loading and view rendering.
class UserController {

  constructor() {
    this.userService = new UserService();
    this.listUsers = this.listUsers.bind(this);
  }

  async listUsers(req, res, next) {
    try {
      
      // We retrieve the data via the Service class
      const users = await this.userService.getUsersForList();

      // Display the users view
      res.render('userView', { 
        title: 'User List', 
        usersList: users 
      });

    } catch (error) {
        // The next function is a built-in Express tool. 
        // By passing the error parameter to it, Express halts the normal execution of the current route 
        // and jumps directly to the error-handling middleware configured at the end of app.js.
        next(error); 
    }
  }
}

module.exports = UserController;