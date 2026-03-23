const poolPromise = require("./db");

async function initDB() {
  const pool = await poolPromise;

  try {
    // ======================================
    // TABLA EMPLEADOS
    // ======================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS empleados (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        nombre      VARCHAR(255) NOT NULL,
        fecha_ingreso DATE NOT NULL,
        puesto      VARCHAR(100),
        departamento VARCHAR(100),
        estatus     VARCHAR(20) DEFAULT 'activo',
        created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ======================================
    // TABLA CONTROL VACACIONES
    // ======================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS control_vacaciones (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        empleado_id           INT NOT NULL,
        anio                  INT NOT NULL,
        dias_correspondientes INT NOT NULL,
        dias_usados           INT DEFAULT 0,
        dias_acumulados       INT DEFAULT 0,
        UNIQUE KEY uq_empleado_anio (empleado_id, anio),
        FOREIGN KEY (empleado_id)
          REFERENCES empleados(id)
          ON DELETE CASCADE
      )
    `);

    // ======================================
    // TABLA VACACIONES
    // ======================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vacaciones (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        empleado_id  INT NOT NULL,
        fecha_inicio DATE NOT NULL,
        fecha_fin    DATE NOT NULL,
        dias_tomados INT NOT NULL,
        comentario   TEXT,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empleado_id)
          REFERENCES empleados(id)
          ON DELETE CASCADE
      )
    `);

    console.log("Tablas creadas/verificadas correctamente");

  } catch (err) {
    console.error("Error al crear tablas:", err.message);
    process.exit(1);
  }
}

module.exports = initDB;