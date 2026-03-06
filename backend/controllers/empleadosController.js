/*Controlador para los empleados
Se definen las funciones para gestionar las operaciones CRUD de los empleados 
*/
const db = require("../db");
const {
  calcularDiasVacaciones,
  calcularAntiguedad
} = require("../utils/vacaciones.utils");

// CREAR EMPLEADO
exports.crearEmpleado = (req, res) => {

  const { nombre, fecha_ingreso, puesto, departamento, correo } = req.body;

  db.run(
    `INSERT INTO empleados 
    (nombre, fecha_ingreso, puesto, departamento, correo)
    VALUES (?, ?, ?, ?, ?)`,
    [nombre, fecha_ingreso, puesto, departamento, correo],
    function (err) {

      if (err) {
        return res.status(500).json(err);
      }

      const empleadoId = this.lastID;

      // calcular antiguedad
      const anios = calcularAntiguedad(fecha_ingreso);

      // calcular dias
      const dias = calcularDiasVacaciones(anios);

      const anioActual = new Date().getFullYear();

      db.run(
        `INSERT INTO control_vacaciones
        (empleado_id, anio, dias_correspondientes, dias_restantes)
        VALUES (?, ?, ?, ?)`,
        [empleadoId, anioActual, dias, dias],
        (err2) => {

          if (err2) {
            return res.status(500).json(err2);
          }

          res.json({
            mensaje: "Empleado creado con control de vacaciones",
            empleadoId,
            diasVacaciones: dias
          });

        }
      );

    }
  );
};
// OBTENER TODOS LOS EMPLEADOS
exports.obtenerEmpleados = (req, res) => {
  const query = `SELECT * FROM empleados`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
};

// OBTENER EMPLEADO POR ID
exports.obtenerEmpleadoPorId = (req, res) => {
  const { id } = req.params;

  const query = `SELECT * FROM empleados WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(row);
  });
};

// ACTUALIZAR EMPLEADO
exports.actualizarEmpleado = (req, res) => {
  const { id } = req.params;

  const { nombre, fecha_ingreso, puesto, departamento, correo } = req.body;

  const query = `
    UPDATE empleados
    SET nombre = ?, fecha_ingreso = ?, puesto = ?, departamento = ?, correo = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [nombre, fecha_ingreso, puesto, departamento, correo, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        mensaje: "Empleado actualizado correctamente",
      });
    },
  );
};

// DESACTIVAR EMPLEADO
exports.desactivarEmpleado = (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE empleados
    SET estatus = 'inactivo'
    WHERE id = ?
  `;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      mensaje: "Empleado desactivado correctamente",
    });
  });
};

// ACTIVAR EMPLEADO
exports.activarEmpleado = (req, res) => {
  const { id } = req.params;

  const query = `
    UPDATE empleados
    SET estatus = 'activo'
    WHERE id = ?
  `;

  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({
      mensaje: "Empleado activado correctamente",
    });
  });
};
