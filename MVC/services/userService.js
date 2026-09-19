const userRepository = require('../repositories/userRepository');

const getUsersForList = async () => {
  try {

    const users = await userRepository.findAllActive();
    
    if (!users || users.length === 0) {
      throw new Error('There are no active registered users.');
    }
    
    return users;
    
  } catch (error) {
      throw error;
  }
};

module.exports = { getUsersForList };