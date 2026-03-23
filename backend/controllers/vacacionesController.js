const db = require("../db");

// ======================================
// OBTENER CONTROL DE VACACIONES
// ======================================

exports.obtenerControlVacaciones = async (req, res) => {
  const anioActual = new Date().getFullYear();

  const query = `
    SELECT 
      e.id,
      e.nombre,
      e.puesto,
      e.estatus,
      cv.id as control_id,
      cv.dias_correspondientes,
      cv.dias_usados,
      cv.dias_acumulados,
      (cv.dias_correspondientes + cv.dias_acumulados - cv.dias_usados) AS dias_restantes
    FROM control_vacaciones cv
    JOIN empleados e ON e.id = cv.empleado_id
    WHERE cv.anio = ?
    AND e.estatus = 'activo'
    ORDER BY e.nombre
  `;

  try {
    const pool = await db;
    const [rows] = await pool.execute(query, [anioActual]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// EDITAR DIAS ACUMULADOS
// ======================================

exports.editarAcumulados = async (req, res) => {
  const { id } = req.params;
  const { dias_acumulados } = req.body;

  if (dias_acumulados === undefined || dias_acumulados === null) {
    return res.status(400).json({ mensaje: "dias_acumulados es obligatorio" });
  }

  if (!Number.isInteger(Number(dias_acumulados))) {
    return res
      .status(400)
      .json({ mensaje: "dias_acumulados debe ser un número entero" });
  }

  if (dias_acumulados < 0) {
    return res
      .status(400)
      .json({ mensaje: "Los días acumulados no pueden ser negativos" });
  }

  try {
    const pool = await db;

    const [rows] = await pool.execute(
      `SELECT cv.dias_correspondientes, cv.dias_acumulados, cv.dias_usados, e.estatus
       FROM control_vacaciones cv
       JOIN empleados e ON e.id = cv.empleado_id
       WHERE cv.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "Control de vacaciones no encontrado" });
    }

    const control = rows[0];

    if (control.estatus === "inactivo") {
      return res.status(400).json({
        mensaje:
          "No se pueden editar los días acumulados de un empleado inactivo",
      });
    }

    const restantes =
      control.dias_correspondientes +
      Number(dias_acumulados) -
      control.dias_usados;

    if (restantes < 0) {
      return res.status(400).json({
        mensaje:
          "No se pueden reducir los días acumulados porque ya existen vacaciones registradas que utilizan esos días",
      });
    }

    await pool.execute(
      `UPDATE control_vacaciones SET dias_acumulados = ? WHERE id = ?`,
      [Number(dias_acumulados), id],
    );

    res.json({
      mensaje: "Días acumulados actualizados correctamente",
      dias_acumulados: Number(dias_acumulados),
      dias_restantes: restantes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// HISTORIAL POR EMPLEADO
// ======================================

exports.obtenerHistorialPorEmpleado = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await db;

    const [empleadoRows] = await pool.execute(
      `SELECT id FROM empleados WHERE id = ?`,
      [id],
    );

    if (empleadoRows.length === 0) {
      return res.status(404).json({ mensaje: "Empleado no encontrado" });
    }

    const [rows] = await pool.execute(
      `SELECT id, fecha_inicio, fecha_fin, dias_tomados, comentario
       FROM vacaciones
       WHERE empleado_id = ?
       ORDER BY fecha_inicio DESC`,
      [id],
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
