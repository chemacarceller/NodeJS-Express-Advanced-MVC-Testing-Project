const userService = require('../services/userService');

const listUsers = async (req, res, next) => {

  try {

    const users = await userService.getUsersForList();
    
    res.render('users', { 
      title: 'User List', 
      usersList: users 
    });
  } catch (error) {
      next(error); 
  }
};

module.exports = { listUsers };