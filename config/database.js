/*
const mongoose = require('mongoose');

const createConnection = (uri) => {
    
  if (!uri) {
    console.error('Error: La URI de la base de datos no está definida.');
    process.exit(1);
  }

  const connection = mongoose.createConnection(uri);


  connection.on('connected', () => {
    console.log(` Instancia de base de datos conectada correctamente.`);
  });

  connection.on('error', (err) => {
    console.error(` Error en la conexión a la base de datos: ${err.message}`);
  });

  connection.on('disconnected', () => {
    console.log(' Conexión a la base de datos cerrada.');
  });


  return connection;
};

module.exports = createConnection;
*/