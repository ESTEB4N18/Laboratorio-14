const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Error al conectar con SQLite:', error.message);
  } else {
    console.log('Base de datos conectada');
  }
});

module.exports = db;
