/*Controlador para los empleados
Se definen las funciones para gestionar las operaciones CRUD de los empleados 
*/

const db = require("../db");

const {
  calcularDiasVacaciones,
  calcularAntiguedad,
} = require("../utils/vacaciones.utils");

// ======================================
// CREAR EMPLEADO
// ======================================

exports.crearEmpleado = (req, res) => {
  const { nombre, fecha_ingreso, puesto, departamento, correo } = req.body;
  
  

  // =============================
  // VALIDACIONES
  // =============================

  if (!nombre || !fecha_ingreso || !puesto || !departamento || !correo) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  const nombreLimpio = nombre.trim();
  const correoLimpio = correo.trim().toLowerCase();
  const departamentoLimpio = departamento.trim().toUpperCase();

  if (nombreLimpio.length < 3) {
    return res.status(400).json({
      mensaje: "El nombre debe tener al menos 3 caracteres",
    });
  }

  // validar correo

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regexCorreo.test(correoLimpio)) {
    return res.status(400).json({
      mensaje: "El formato del correo no es válido",
    });
  }

  // validar fecha futura

  const hoy = new Date();
  const fechaIngreso = new Date(fecha_ingreso);

  if (fechaIngreso > hoy) {
    return res.status(400).json({
      mensaje: "La fecha de ingreso no puede ser futura",
    });
  }

  // =============================
  // VALIDAR CORREO DUPLICADO
  // =============================

  const validarQuery = `
    SELECT id FROM empleados 
    WHERE correo = ?
  `;

  db.get(validarQuery, [correoLimpio], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      return res.status(400).json({
        mensaje: "El correo ya está registrado",
      });
    }

    // =============================
    // INSERTAR EMPLEADO
    // =============================

    db.run(
      `INSERT INTO empleados
      (nombre, fecha_ingreso, puesto, departamento, correo)
      VALUES (?, ?, ?, ?, ?)`,
      [nombreLimpio, fecha_ingreso, puesto, departamentoLimpio, correoLimpio],
      function (err) {
        if (err) {
          return res.status(500).json(err);
        }

        const empleadoId = this.lastID;

        // =============================
        // CALCULAR VACACIONES
        // =============================

        const anios = calcularAntiguedad(fecha_ingreso);

        const dias = calcularDiasVacaciones(anios);

        const anioActual = new Date().getFullYear();

        // =============================
        // CREAR CONTROL VACACIONES
        // =============================

        db.run(
          `INSERT INTO control_vacaciones
          (empleado_id, anio, dias_correspondientes)
          VALUES (?, ?, ?)`,
          [empleadoId, anioActual, dias],
          (err2) => {
            if (err2) {
              return res.status(500).json(err2);
            }

            res.json({
              mensaje: "Empleado creado correctamente",
              empleadoId,
              diasVacaciones: dias,
            });
          },
        );
      },
    );
  });
};

// ======================================
// OBTENER TODOS LOS EMPLEADOS
// ======================================

exports.obtenerEmpleados = (req, res) => {
  const query = `SELECT * FROM empleados ORDER BY nombre`;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
};

// ======================================
// OBTENER EMPLEADO POR ID
// ======================================

exports.obtenerEmpleadoPorId = (req, res) => {
  const { id } = req.params;

  const query = `SELECT * FROM empleados WHERE id = ?`;

  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({
        mensaje: "Empleado no encontrado",
      });
    }

    res.json(row);
  });
};

// ======================================
// ACTUALIZAR EMPLEADO
// ======================================

exports.actualizarEmpleado = (req, res) => {
  const { id } = req.params;

  const { nombre, fecha_ingreso, puesto, departamento, correo } = req.body;
  const departamentoLimpio = departamento.trim().toUpperCase();

  if (!nombre || !fecha_ingreso || !puesto || !departamento || !correo) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  const correoLimpio = correo.trim().toLowerCase();

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!regexCorreo.test(correoLimpio)) {
    return res.status(400).json({
      mensaje: "Correo inválido",
    });
  }

  const fechaIngreso = new Date(fecha_ingreso);
  const hoy = new Date();

  if (fechaIngreso > hoy) {
    return res.status(400).json({
      mensaje: "La fecha de ingreso no puede ser futura",
    });
  }

  const validarQuery = `
    SELECT id FROM empleados
    WHERE correo = ?
    AND id != ?
  `;

  db.get(validarQuery, [correoLimpio, id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      return res.status(400).json({
        mensaje: "El correo ya está en uso",
      });
    }

    const query = `
      UPDATE empleados
      SET nombre = ?, fecha_ingreso = ?, puesto = ?, departamento = ?, correo = ?
      WHERE id = ?
    `;

    db.run(
      query,
      [nombre.trim(), fecha_ingreso, puesto, departamentoLimpio, correoLimpio, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          mensaje: "Empleado actualizado correctamente",
        });
      },
    );
  });
};

// ======================================
// DESACTIVAR EMPLEADO
// ======================================

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

// ======================================
// ACTIVAR EMPLEADO
// ======================================

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
