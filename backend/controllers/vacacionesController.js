/*
  Controlador para control de vacaciones
  Gestiona la consulta del control anual, edición de días acumulados e historial por empleado
*/

const db = require("../db");

// ======================================
// OBTENER CONTROL DE VACACIONES
// ======================================

exports.obtenerControlVacaciones = (req, res) => {
  const anioActual = new Date().getFullYear();

  const query = `
    SELECT 
      e.id,
      e.nombre,
      e.puesto,
      cv.id as control_id,
      cv.dias_correspondientes,
      cv.dias_usados,
      cv.dias_acumulados,
      (cv.dias_correspondientes + cv.dias_acumulados - cv.dias_usados) AS dias_restantes
    FROM control_vacaciones cv
    JOIN empleados e ON e.id = cv.empleado_id
    WHERE cv.anio = ?
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

  // =============================
  // VALIDACIONES
  // =============================

  // FIX: Verificar que el campo venga en el body
  if (dias_acumulados === undefined || dias_acumulados === null) {
    return res.status(400).json({
      mensaje: "dias_acumulados es obligatorio",
    });
  }

  // FIX: Verificar que sea un número entero válido
  if (!Number.isInteger(Number(dias_acumulados))) {
    return res.status(400).json({
      mensaje: "dias_acumulados debe ser un número entero",
    });
  }

  if (dias_acumulados < 0) {
    return res.status(400).json({
      mensaje: "Los días acumulados no pueden ser negativos",
    });
  }

  // =============================
  // BUSCAR CONTROL
  // =============================

  db.get(
    `SELECT dias_correspondientes, dias_acumulados, dias_usados
     FROM control_vacaciones
     WHERE id = ?`,
    [id],
    (err, control) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!control) {
        return res.status(404).json({
          mensaje: "Control de vacaciones no encontrado",
        });
      }

      // =============================
      // VALIDAR QUE NO QUEDE NEGATIVO
      // =============================

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

      // =============================
      // ACTUALIZAR
      // =============================

      db.run(
        `UPDATE control_vacaciones
         SET dias_acumulados = ?
         WHERE id = ?`,
        [Number(dias_acumulados), id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({
            mensaje: "Días acumulados actualizados correctamente",
            dias_acumulados: Number(dias_acumulados),
            dias_restantes: restantes,
          });
        }
      );
    }
  );
};

// ======================================
// HISTORIAL POR EMPLEADO
// ======================================

exports.obtenerHistorialPorEmpleado = (req, res) => {
  const { id } = req.params;

  // FIX: Verificar que el empleado existe antes de buscar su historial
  db.get(`SELECT id FROM empleados WHERE id = ?`, [id], (err, empleado) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!empleado) {
      return res.status(404).json({ mensaje: "Empleado no encontrado" });
    }

    const query = `
      SELECT 
        id,
        fecha_inicio,
        fecha_fin,
        dias_tomados,
        comentario
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