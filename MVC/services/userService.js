// The service class uses the repository class to access data and implements business logic.
const UserRepository = require('../repositories/userRepository');

class UserService {

  constructor() {
    this.userRepository = new UserRepository();
    this.getUsersForList = this.getUsersForList.bind(this);
  }

  async getUsersForList() {
    try {

      const users = await this.userRepository.findAllActive();
      
      if (!users || users.length === 0) {
        throw new Error('There are no active registered users.');
      }
      
      return users;
      
    } catch (error) {
        throw error;
    }
  }
}

module.exports = UserService;