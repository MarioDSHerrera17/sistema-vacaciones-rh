/*
  Controlador para control de vacaciones
  Gestiona la consulta del control anual, edición de días acumulados e historial por empleado
*/

const db = require("../db");

// ======================================
// OBTENER CONTROL DE VACACIONES
// Solo empleados activos
// ======================================

exports.obtenerControlVacaciones = (req, res) => {
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

  db.all(query, [anioActual], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// ======================================
// EDITAR DIAS ACUMULADOS
// ======================================

exports.editarAcumulados = (req, res) => {
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

  db.get(
    `SELECT cv.dias_correspondientes, cv.dias_acumulados, cv.dias_usados, e.estatus
     FROM control_vacaciones cv
     JOIN empleados e ON e.id = cv.empleado_id
     WHERE cv.id = ?`,
    [id],
    (err, control) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!control) {
        return res
          .status(404)
          .json({ mensaje: "Control de vacaciones no encontrado" });
      }

      // Bloquear edición si el empleado está inactivo
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

      db.run(
        `UPDATE control_vacaciones SET dias_acumulados = ? WHERE id = ?`,
        [Number(dias_acumulados), id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({
            mensaje: "Días acumulados actualizados correctamente",
            dias_acumulados: Number(dias_acumulados),
            dias_restantes: restantes,
          });
        },
      );
    },
  );
};

// ======================================
// HISTORIAL POR EMPLEADO
// ======================================

exports.obtenerHistorialPorEmpleado = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT id FROM empleados WHERE id = ?`, [id], (err, empleado) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado" });
    }

    const query = `
      SELECT id, fecha_inicio, fecha_fin, dias_tomados, comentario
      FROM vacaciones
      WHERE empleado_id = ?
      ORDER BY fecha_inicio DESC
    `;

    db.all(query, [id], (err2, rows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(rows);
    });
  });
};
