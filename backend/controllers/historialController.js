const db = require("../db");
const { calcularDias } = require("../utils/fechas.utils");

// ======================================
// OBTENER HISTORIAL DE VACACIONES
// ======================================

exports.obtenerHistorialVacaciones = async (req, res) => {
  const query = `
    SELECT 
      v.id,
      v.empleado_id,
      e.nombre,
      e.puesto,
      v.fecha_inicio,
      v.fecha_fin,
      v.dias_tomados,
      v.comentario
    FROM vacaciones v
    JOIN empleados e ON e.id = v.empleado_id
    ORDER BY v.fecha_inicio DESC
  `;

  try {
    const pool = await db;
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// REGISTRAR VACACIONES
// ======================================

exports.registrarVacaciones = async (req, res) => {
  const { empleado_id, fecha_inicio, fecha_fin, comentario } = req.body;

  if (!empleado_id || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      mensaje: "empleado_id, fecha_inicio y fecha_fin son obligatorios",
    });
  }

  if (fecha_fin < fecha_inicio) {
    return res.status(400).json({
      mensaje: "La fecha de fin no puede ser anterior a la fecha de inicio",
    });
  }

  if (
    new Date(fecha_inicio).getFullYear() !== new Date(fecha_fin).getFullYear()
  ) {
    return res.status(400).json({
      mensaje:
        "Las vacaciones no pueden cruzar de año. Registra dos periodos separados",
    });
  }

  const dias = calcularDias(fecha_inicio, fecha_fin);
  const anioActual = new Date(fecha_inicio).getFullYear();

  try {
    const pool = await db;

    // CONTROL
    const [controlRows] = await pool.execute(
      `SELECT cv.*, e.estatus
       FROM control_vacaciones cv
       JOIN empleados e ON e.id = cv.empleado_id
       WHERE cv.empleado_id = ? AND cv.anio = ?`,
      [empleado_id, anioActual],
    );

    if (controlRows.length === 0) {
      return res.status(404).json({
        mensaje: "No existe control de vacaciones para este empleado",
      });
    }

    const control = controlRows[0];

    if (control.estatus === "inactivo") {
      return res.status(400).json({
        mensaje: "No se pueden registrar vacaciones para empleados inactivos",
      });
    }

    const disponibles =
      control.dias_correspondientes +
      control.dias_acumulados -
      control.dias_usados;

    if (disponibles < dias) {
      return res.status(400).json({
        mensaje: `No tiene suficientes días disponibles. Disponibles: ${disponibles}, solicitados: ${dias}`,
      });
    }

    // TRASLAPE
    const [overlapRows] = await pool.execute(
      `SELECT id FROM vacaciones
       WHERE empleado_id = ?
       AND fecha_inicio <= ?
       AND fecha_fin >= ?`,
      [empleado_id, fecha_fin, fecha_inicio],
    );

    if (overlapRows.length > 0) {
      return res.status(400).json({
        mensaje: "Ya existen vacaciones registradas en ese periodo",
      });
    }

    // INSERT
    await pool.execute(
      `INSERT INTO vacaciones
       (empleado_id, fecha_inicio, fecha_fin, dias_tomados, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [empleado_id, fecha_inicio, fecha_fin, dias, comentario],
    );

    // UPDATE CONTROL
    await pool.execute(
      `UPDATE control_vacaciones
       SET dias_usados = dias_usados + ?
       WHERE id = ?`,
      [dias, control.id],
    );

    res.json({
      mensaje: "Vacaciones registradas correctamente",
      dias_tomados: dias,
      dias_restantes: disponibles - dias,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// EDITAR VACACIONES
// ======================================

exports.editarVacaciones = async (req, res) => {
  const { id } = req.params;
  const { fecha_inicio, fecha_fin, comentario } = req.body;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      mensaje: "fecha_inicio y fecha_fin son obligatorios",
    });
  }

  if (fecha_fin < fecha_inicio) {
    return res.status(400).json({
      mensaje: "La fecha de fin no puede ser anterior a la fecha de inicio",
    });
  }

  if (
    new Date(fecha_inicio).getFullYear() !== new Date(fecha_fin).getFullYear()
  ) {
    return res.status(400).json({
      mensaje: "Las vacaciones no pueden cruzar de año",
    });
  }

  const diasNuevos = calcularDias(fecha_inicio, fecha_fin);
  const hoy = new Date().toISOString().split("T")[0];

  try {
    const pool = await db;

    const [vacRows] = await pool.execute(
      `SELECT * FROM vacaciones WHERE id = ?`,
      [id],
    );

    if (vacRows.length === 0) {
      return res.status(404).json({ mensaje: "Vacación no encontrada" });
    }

    const vac = vacRows[0];

    if (vac.fecha_fin < hoy) {
      await pool.execute(`UPDATE vacaciones SET comentario = ? WHERE id = ?`, [
        comentario,
        id,
      ]);

      return res.json({
        mensaje:
          "Las vacaciones ya ocurrieron. Solo se actualizó el comentario",
      });
    }

    const anioActual = new Date(fecha_inicio).getFullYear();

    const [controlRows] = await pool.execute(
      `SELECT * FROM control_vacaciones WHERE empleado_id = ? AND anio = ?`,
      [vac.empleado_id, anioActual],
    );

    if (controlRows.length === 0) {
      return res.status(404).json({
        mensaje: "Las vacaciones no se pueden editar para ese año",
      });
    }

    const control = controlRows[0];

    const disponibles =
      control.dias_correspondientes +
      control.dias_acumulados -
      control.dias_usados +
      vac.dias_tomados;

    if (disponibles < diasNuevos) {
      return res.status(400).json({
        mensaje: `No hay suficientes días. Disponibles: ${disponibles}, solicitados: ${diasNuevos}`,
      });
    }

    const [overlapRows] = await pool.execute(
      `SELECT id FROM vacaciones
       WHERE empleado_id = ?
       AND id != ?
       AND fecha_inicio <= ?
       AND fecha_fin >= ?`,
      [vac.empleado_id, id, fecha_fin, fecha_inicio],
    );

    if (overlapRows.length > 0) {
      return res.status(400).json({
        mensaje: "Ya existen vacaciones registradas en ese periodo",
      });
    }

    await pool.execute(
      `UPDATE vacaciones
       SET fecha_inicio = ?, fecha_fin = ?, dias_tomados = ?, comentario = ?
       WHERE id = ?`,
      [fecha_inicio, fecha_fin, diasNuevos, comentario, id],
    );

    await pool.execute(
      `UPDATE control_vacaciones
       SET dias_usados = dias_usados - ? + ?
       WHERE id = ?`,
      [vac.dias_tomados, diasNuevos, control.id],
    );

    res.json({
      mensaje: "Vacaciones actualizadas correctamente",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// ELIMINAR VACACIONES
// ======================================

exports.eliminarVacaciones = async (req, res) => {
  const { id } = req.params;
  const hoy = new Date().toISOString().split("T")[0];

  try {
    const pool = await db;

    const [vacRows] = await pool.execute(
      `SELECT * FROM vacaciones WHERE id = ?`,
      [id],
    );

    if (vacRows.length === 0) {
      return res.status(404).json({ mensaje: "Vacación no encontrada" });
    }

    const vac = vacRows[0];

    if (vac.fecha_inicio <= hoy) {
      return res.status(400).json({
        mensaje: "No se pueden eliminar vacaciones ya iniciadas o pasadas",
      });
    }

    const anioVacacion = new Date(vac.fecha_inicio).getFullYear();

    const [controlRows] = await pool.execute(
      `SELECT * FROM control_vacaciones WHERE empleado_id = ? AND anio = ?`,
      [vac.empleado_id, anioVacacion],
    );

    if (controlRows.length === 0) {
      return res.status(404).json({
        mensaje: "No existe control de vacaciones para este año",
      });
    }

    const control = controlRows[0];

    await pool.execute(`DELETE FROM vacaciones WHERE id = ?`, [id]);

    await pool.execute(
      `UPDATE control_vacaciones
       SET dias_usados = dias_usados - ?
       WHERE id = ?`,
      [vac.dias_tomados, control.id],
    );

    res.json({ mensaje: "Vacaciones eliminadas correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
