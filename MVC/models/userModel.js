
class Usuario {

    constructor( id = null, name, email, status, role ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.status = status;
        this.role = role;
    }

    cambiarEmail(nuevoEmail) {
        if (!nuevoEmail.includes('@')) {
            throw new Error("El formato del email es inválido.");
        }
        this.email = nuevoEmail;
    }
}

module.exports = Usuario;

/*

// Codigo ejemplo para acceder a MongoDB

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

// Codigo ejemplo para acceder a BBDD relacionales mediante sequelize

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