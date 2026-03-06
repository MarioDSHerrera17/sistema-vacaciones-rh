//Archivo para inicializar la base de datos y crear las tablas necesarias
const db = require("./db");

db.serialize(() => {

  // TABLA EMPLEADOS para almacenar la información de los empleados
  //Agregar campo departamento y correo
  db.run(`
    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      fecha_ingreso DATE NOT NULL,
      puesto TEXT,
      departamento TEXT,
      correo TEXT,
      estatus TEXT DEFAULT 'activo'
    )
  `);

  // TABLA VACACIONES para registrar los dias de vacaciones tomados por cada empleado
  db.run(`
    CREATE TABLE IF NOT EXISTS vacaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER,
      fecha_inicio DATE,
      fecha_fin DATE,
      dias_tomados INTEGER,
      comentario TEXT,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    )
  `);

  // TABLA CONTROL VACACIONES para llevar el control de los dias de vacaciones correspondientes, 
  // usados, restantes y acumulados por cada empleado
  db.run(`
    CREATE TABLE IF NOT EXISTS control_vacaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER,
      anio INTEGER,
      dias_correspondientes INTEGER,
      dias_usados INTEGER DEFAULT 0,
      dias_restantes INTEGER,
      dias_acumulados INTEGER DEFAULT 0,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    )
  `);

  console.log("Tablas creadas correctamente");

});