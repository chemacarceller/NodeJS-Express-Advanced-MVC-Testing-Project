const UserService = require('../services/userService');


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
        title: 'UserList - My Testing Web Site',
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