// The service class uses the repository class to access data and implements business logic.
const userRepository = require('../repositories/userRepository');

const getUsersForList = async () => {
  try {

    // Data are requested via a repository
    const users = await userRepository.findAllActive();
    
    // The data are validated
    if (!users || users.length === 0) {
      throw new Error('There are no active registered users.');
    }
    
    // The data are returned
    return users;
    
  } catch (error) {
      throw error;
  }
};

module.exports = { getUsersForList };