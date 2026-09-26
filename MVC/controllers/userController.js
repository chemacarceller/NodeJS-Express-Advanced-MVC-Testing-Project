// We obtain the service object responsible for requesting data from the repository object.
// and implement the potential business logic
// The controller class simply manages data loading and view rendering.
const userService = require('../services/userService');

const listUsers = async (req, res, next) => {

  try {

    // Data request using the service object
    const users = await userService.getUsersForList();
    
    // Display the view, passing the data to it
    res.render('userView', { 
      title: 'User List', 
      usersList: users 
    });

  } catch (error) {
      next(error); 
  }
};

module.exports = { listUsers };