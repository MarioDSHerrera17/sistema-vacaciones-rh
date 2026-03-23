const db = require("../db");

const {
  calcularDiasVacaciones,
  calcularAntiguedad,
} = require("../utils/vacaciones.utils");

// ======================================
// CREAR EMPLEADO
// ======================================

exports.crearEmpleado = async (req, res) => {
  const { nombre, fecha_ingreso, puesto, departamento } = req.body;

  if (!nombre || !fecha_ingreso || !puesto || !departamento) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  const nombreLimpio = nombre.trim();
  const departamentoLimpio = departamento.trim().toUpperCase();

  if (nombreLimpio.length < 3) {
    return res.status(400).json({
      mensaje: "El nombre debe tener al menos 3 caracteres",
    });
  }

  const hoy = new Date();
  const fechaIngreso = new Date(fecha_ingreso);

  if (fechaIngreso > hoy) {
    return res.status(400).json({
      mensaje: "La fecha de ingreso no puede ser futura",
    });
  }

  try {
    const pool = await db;

    // INSERTAR EMPLEADO
    const [result] = await pool.execute(
      `INSERT INTO empleados (nombre, fecha_ingreso, puesto, departamento)
       VALUES (?, ?, ?, ?)`,
      [nombreLimpio, fecha_ingreso, puesto, departamentoLimpio],
    );

    const empleadoId = result.insertId;

    // CALCULAR VACACIONES
    const anios = calcularAntiguedad(fecha_ingreso);
    const dias = calcularDiasVacaciones(anios);
    const anioActual = new Date().getFullYear();

    // CREAR CONTROL VACACIONES
    await pool.execute(
      `INSERT INTO control_vacaciones (empleado_id, anio, dias_correspondientes)
       VALUES (?, ?, ?)`,
      [empleadoId, anioActual, dias],
    );

    res.json({
      mensaje: "Empleado creado correctamente",
      empleadoId,
      diasVacaciones: dias,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// OBTENER TODOS LOS EMPLEADOS
// ======================================

exports.obtenerEmpleados = async (req, res) => {
  const hoy = new Date().toISOString().split("T")[0];

  const query = `
    SELECT
      e.id,
      e.nombre,
      e.fecha_ingreso,
      e.puesto,
      e.departamento,
      e.estatus,
      e.created_at,

      -- Antigüedad en años (MySQL)
      TIMESTAMPDIFF(YEAR, e.fecha_ingreso, CURDATE()) AS antiguedad,

      -- Disponibilidad
      CASE
        WHEN EXISTS (
          SELECT 1 FROM vacaciones v
          WHERE v.empleado_id = e.id
          AND v.fecha_inicio <= ?
          AND v.fecha_fin >= ?
        ) THEN 'vacaciones'
        ELSE 'disponible'
      END AS disponibilidad

    FROM empleados e
    ORDER BY e.nombre
  `;

  try {
    const pool = await db;
    const [rows] = await pool.execute(query, [hoy, hoy]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// OBTENER EMPLEADO POR ID
// ======================================

exports.obtenerEmpleadoPorId = async (req, res) => {
  const { id } = req.params;
  const hoy = new Date().toISOString().split("T")[0];

  const query = `
    SELECT
      e.id,
      e.nombre,
      e.fecha_ingreso,
      e.puesto,
      e.departamento,
      e.estatus,
      e.created_at,

      TIMESTAMPDIFF(YEAR, e.fecha_ingreso, CURDATE()) AS antiguedad,

      CASE
        WHEN EXISTS (
          SELECT 1 FROM vacaciones v
          WHERE v.empleado_id = e.id
          AND v.fecha_inicio <= ?
          AND v.fecha_fin >= ?
        ) THEN 'vacaciones'
        ELSE 'disponible'
      END AS disponibilidad

    FROM empleados e
    WHERE e.id = ?
  `;

  try {
    const pool = await db;
    const [rows] = await pool.execute(query, [hoy, hoy, id]);

    if (rows.length === 0) {
      return res.status(404).json({
        mensaje: "Empleado no encontrado",
      });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// ACTUALIZAR EMPLEADO
// ======================================

exports.actualizarEmpleado = async (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_ingreso, puesto, departamento } = req.body;

  if (!nombre || !fecha_ingreso || !puesto || !departamento) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  const nombreLimpio = nombre.trim();
  const departamentoLimpio = departamento.trim().toUpperCase();

  const fechaIngreso = new Date(fecha_ingreso);
  const hoy = new Date();

  if (fechaIngreso > hoy) {
    return res.status(400).json({
      mensaje: "La fecha de ingreso no puede ser futura",
    });
  }

  try {
    const pool = await db;

    const [result] = await pool.execute(
      `UPDATE empleados
       SET nombre = ?, fecha_ingreso = ?, puesto = ?, departamento = ?
       WHERE id = ?`,
      [nombreLimpio, fecha_ingreso, puesto, departamentoLimpio, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        mensaje: "Empleado no encontrado",
      });
    }

    res.json({
      mensaje: "Empleado actualizado correctamente",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// DESACTIVAR EMPLEADO
// ======================================

exports.desactivarEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await db;

    const [result] = await pool.execute(
      `UPDATE empleados SET estatus = 'inactivo' WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Empleado no encontrado" });
    }

    res.json({ mensaje: "Empleado desactivado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// ACTIVAR EMPLEADO
// ======================================

exports.activarEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await db;

    const [result] = await pool.execute(
      `UPDATE empleados SET estatus = 'activo' WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Empleado no encontrado" });
    }

    res.json({ mensaje: "Empleado activado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
