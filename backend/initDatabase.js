//Archivo para inicializar la base de datos y crear las tablas necesarias
const db = require("./db");
db.serialize(() => {

  // TABLA EMPLEADOS
  db.run(`
    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      fecha_ingreso DATE NOT NULL,
      puesto TEXT,
      departamento TEXT,
      correo TEXT UNIQUE,
      estatus TEXT DEFAULT 'activo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // TABLA CONTROL VACACIONES
  db.run(`
    CREATE TABLE IF NOT EXISTS control_vacaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER NOT NULL,
      anio INTEGER NOT NULL,
      dias_correspondientes INTEGER NOT NULL,
      dias_usados INTEGER DEFAULT 0,
      dias_acumulados INTEGER DEFAULT 0,
      UNIQUE(empleado_id, anio),
      FOREIGN KEY (empleado_id) 
      REFERENCES empleados(id) 
      ON DELETE CASCADE
    )
  `);

  // TABLA VACACIONES
  db.run(`
    CREATE TABLE IF NOT EXISTS vacaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER NOT NULL,
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE NOT NULL,
      dias_tomados INTEGER NOT NULL,
      comentario TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empleado_id) 
      REFERENCES empleados(id) 
      ON DELETE CASCADE
    )
  `);

  console.log("Tablas creadas correctamente");

});