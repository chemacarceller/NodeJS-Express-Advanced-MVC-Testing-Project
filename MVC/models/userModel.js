// Application entity class related to users
class User {

    constructor( id = null, name, email, status, role ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.status = status;
        this.role = role;
    }

    changeEmail(newEmail) {
        if (!newEmail.includes('@')) {
            throw new Error("The email format is invalid");
        }
        this.email = newEmail;
    }
}

module.exports = User;

/*

// Example code to access MongoDB

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'The name is mandatory.'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'The email address is mandatory.'], 
    unique: true,
    lowercase: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  status: { 
    type: String, 
    default: 'active' 
  }
}, {
  timestamps: true 
});

module.exports = userSchema;

*/


/*

// Example code for accessing relational databases using Sequelize.

const { DataTypes } = require('sequelize');

const defineUserModel = (sequelizeInstance) => {

  return sequelizeInstance.define('User', {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true } 
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    }
  }, {
    tableName: 'users',
    timestamps: true
  });
};

module.exports = defineUserModel;

*/