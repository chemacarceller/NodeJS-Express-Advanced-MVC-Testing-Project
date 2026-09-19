
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

/*

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