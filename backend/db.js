const mysql = require("mysql2/promise");

// Configuración de conexión
const DB_CONFIG = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "root",
};

const DB_NAME = "sistema_vacaciones";

async function initConnection() {
  try {
    // Conectar SIN especificar BD para poder crearla si no existe
    const connection = await mysql.createConnection(DB_CONFIG);

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`Base de datos '${DB_NAME}' lista`);

    await connection.end();

    // Crear el pool ya apuntando a la BD
    const pool = mysql.createPool({
      ...DB_CONFIG,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });

    console.log("Pool de conexiones MySQL creado");
    return pool;

  } catch (err) {
    console.error("Error al conectar con MySQL:", err.message);
    process.exit(1);
  }
}

// Exportar promesa del pool para usar en toda la app
const poolPromise = initConnection();
module.exports = poolPromise;