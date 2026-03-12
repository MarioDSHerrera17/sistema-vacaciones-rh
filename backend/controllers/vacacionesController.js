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
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
};

// ======================================
// EDITAR DIAS ACUMULADOS
// ======================================

exports.editarAcumulados = (req, res) => {
  const { id } = req.params;
  const { dias_acumulados } = req.body;

  db.get(
    `SELECT dias_correspondientes, dias_acumulados, dias_usados
     FROM control_vacaciones
     WHERE id=?`,
    [id],
    (err, control) => {
      if (err) return res.status(500).json(err);

      if (!control) {
        return res.status(404).json({
          mensaje: "Control de vacaciones no encontrado",
        });
      }
      if (dias_acumulados < 0) {
        return res.status(400).json({
          mensaje: "Los días acumulados no pueden ser negativos",
        });
      }
      const restantes =
        control.dias_correspondientes + dias_acumulados - control.dias_usados;

      // VALIDAR QUE NO QUEDE NEGATIVO

      if (restantes < 0) {
        return res.status(400).json({
          mensaje:
            "No se pueden reducir los días acumulados porque ya existen vacaciones registradas que utilizan esos días",
        });
      }

      db.run(
        `UPDATE control_vacaciones
         SET dias_acumulados=?
         WHERE id=?`,
        [dias_acumulados, id],
        (err2) => {
          if (err2) return res.status(500).json(err2);

          res.json({
            mensaje: "Días acumulados actualizados",
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

  db.all(query, [id], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
};
