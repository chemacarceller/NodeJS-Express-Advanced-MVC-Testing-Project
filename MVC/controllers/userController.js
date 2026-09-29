// We obtain the service object responsible for requesting data from the repository object.
// and implement the potential business logic
// The controller class simply manages data loading and view rendering.
const UserService = require('../services/userService');

class UserController {

  constructor() {
    this.userService = new UserService();
    this.listUsers = this.listUsers.bind(this);
  }

  async listUsers(req, res, next) {
    try {
      
      const users = await this.userService.getUsersForList();

      res.render('userView', { 
        title: 'User List', 
        usersList: users 
      });
    } catch (error) {
        next(error); 
    }
  }
}

module.exports = UserController;