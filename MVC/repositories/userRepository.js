const createConnection = require('../../config/database');
const userSchema = require('../models/userModel'); 

//const dbConnection = createConnection(process.env.MONGO_URI);

//const UserModel = dbConnection.model('User', userSchema);

const mockUsers = [
  { id: '1', name: 'Alice', email: 'alice@example.com', status: 'active', role: 'admin' },
  { id: '2', name: 'Bob', email: 'bob@example.com', status: 'active', role: 'user' },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', status: 'inactive', role: 'user' }
];


const findById = async (id) => {
//  try {
//    return await UserModel.findById(id).lean();
//  } catch (error) {
//    throw new Error(`Repository error while searching for ID ${id}: ${error.message}`);
//   }

  /* 
  try {
  
  const userRaw = await User.findByPk(id, { raw: true });
    
    if (!userRaw) return null;
    
    return {
      id: userRaw.id,
      displayName: userRaw.name,
      email: userRaw.email,
      role: userRaw.role,
      status: userRaw.status
    };
  } catch (error) {
    throw new Error(`Repository error while searching for ID ${id} with Sequelize: ${error.message}`);
  }
  */


  // Hardcoded data for testing
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.id === id);
      resolve(user ? { ...user } : null);
    }, 50);
  });


};

const findAllActive = async () => {
//  try {
//    return await UserModel.find({ status: 'active' }).lean();
//  } catch (error) {
//    throw new Error(`Repository error while listing active users: ${error.message}`);
//  }


  /*
  try {

    const activeUsersRaw = await User.findAll({
      where: { status: 'active' },
      raw: true
    });
    
    return activeUsersRaw.map(userRaw => ({
      id: userRaw.id,
      displayName: userRaw.name,
      email: userRaw.email,
      role: userRaw.role,
      status: userRaw.status
    }));

  } catch (error) {
    throw new Error(`Repository error when listing active users with Sequelize: ${error.message}`);
  }
  */


  // Hardcoded data for testing
  return new Promise((resolve) => {
    setTimeout(() => {
      const activeUsers = mockUsers.filter(u => u.status === 'active');
      resolve(activeUsers.map(u => ({ ...u })));
    }, 50);
  });


};

module.exports = { 
  findById,
  findAllActive 
};


