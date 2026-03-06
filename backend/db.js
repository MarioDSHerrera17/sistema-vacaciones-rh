// Archivo para manejar la conexión a la base de datos SQLite
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// ruta de la base de datos
const dbPath = path.join(__dirname, "../database/vacaciones.db");

// conexión
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar DB", err.message);
  } else {
    console.log("Base de datos SQLite conectada");
  }
});

module.exports = db;