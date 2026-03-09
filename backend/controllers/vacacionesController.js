const db = require("../db");
const { calcularDias } = require("../utils/fechas.utils");

// ======================================
// OBTENER CONTROL DE VACACIONES
// (tabla superior)
// ======================================

exports.obtenerControlVacaciones = (req, res) => {
  const anioActual = new Date().getFullYear();

  const query = `
    SELECT 
      e.id,
      e.nombre,
      e.puesto,
      cv.dias_correspondientes,
      cv.dias_usados,
      cv.dias_restantes,
      cv.dias_acumulados
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
// OBTENER HISTORIAL DE VACACIONES
// (tabla inferior)
// ======================================

exports.obtenerHistorialVacaciones = (req, res) => {
  const query = `
    SELECT 
      v.id,
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

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json(err);

    res.json(rows);
  });
};

// ======================================
// REGISTRAR VACACIONES
// ======================================

exports.registrarVacaciones = (req, res) => {
  const { empleado_id, fecha_inicio, fecha_fin, comentario } = req.body;

  const dias = calcularDias(fecha_inicio, fecha_fin);

  const anioActual = new Date().getFullYear();

  db.get(
    `SELECT * FROM control_vacaciones 
     WHERE empleado_id = ? AND anio = ?`,
    [empleado_id, anioActual],
    (err, control) => {
      if (err) return res.status(500).json(err);

      if (!control) {
        return res.status(404).json({
          mensaje: "No existe control de vacaciones",
        });
      }

      if (control.dias_restantes < dias) {
        return res.status(400).json({
          mensaje: "No tiene suficientes días",
        });
      }

      // VALIDAR TRASLAPE
      db.get(
        `SELECT id FROM vacaciones
         WHERE empleado_id = ?
         AND fecha_inicio <= ?
         AND fecha_fin >= ?`,
        [empleado_id, fecha_fin, fecha_inicio],
        (errOverlap, overlap) => {
          if (errOverlap) return res.status(500).json(errOverlap);

          if (overlap) {
            return res.status(400).json({
              mensaje: "Ya existen vacaciones en ese periodo",
            });
          }

          // INSERT SOLO SI NO HAY TRASLAPE
          db.run(
            `INSERT INTO vacaciones
            (empleado_id, fecha_inicio, fecha_fin, dias_tomados, comentario)
            VALUES (?, ?, ?, ?, ?)`,
            [empleado_id, fecha_inicio, fecha_fin, dias, comentario],
            function (err2) {
              if (err2) return res.status(500).json(err2);

              const nuevosUsados = control.dias_usados + dias;
              const nuevosRestantes = control.dias_restantes - dias;

              db.run(
                `UPDATE control_vacaciones
                 SET dias_usados=?, dias_restantes=?
                 WHERE id=?`,
                [nuevosUsados, nuevosRestantes, control.id],
                (err3) => {
                  if (err3) return res.status(500).json(err3);

                  res.json({
                    mensaje: "Vacaciones registradas",
                    dias_tomados: dias,
                  });
                },
              );
            },
          );
        },
      );
    },
  );
};
//Editar vacaciones
exports.editarVacaciones = (req, res) => {
  const { id } = req.params;
  const { fecha_inicio, fecha_fin, comentario } = req.body;

  const diasNuevos = calcularDias(fecha_inicio, fecha_fin);

  db.get(`SELECT * FROM vacaciones WHERE id=?`, [id], (err, vac) => {
    if (err) return res.status(500).json(err);
    if (!vac) return res.status(404).json({ mensaje: "No encontrada" });

    const diferencia = diasNuevos - vac.dias_tomados;

    db.run(
      `UPDATE vacaciones
         SET fecha_inicio=?, fecha_fin=?, dias_tomados=?, comentario=?
         WHERE id=?`,
      [fecha_inicio, fecha_fin, diasNuevos, comentario, id],
      (err2) => {
        if (err2) return res.status(500).json(err2);

        db.run(
          `UPDATE control_vacaciones
             SET dias_usados = dias_usados + ?,
                 dias_restantes = dias_restantes - ?
             WHERE empleado_id=?`,
          [diferencia, diferencia, vac.empleado_id],
        );

        res.json({ mensaje: "Vacaciones actualizadas" });
      },
    );
  });
};

//Eliminar vacaciones
exports.eliminarVacaciones = (req, res) => {
  const { id } = req.params;

  const hoy = new Date().toISOString().split("T")[0];

  db.get(`SELECT * FROM vacaciones WHERE id=?`, [id], (err, vac) => {
    if (err) return res.status(500).json(err);
    if (!vac) return res.status(404).json({ mensaje: "No encontrada" });

    if (vac.fecha_inicio <= hoy) {
      return res.status(400).json({
        mensaje: "No se pueden eliminar vacaciones ya iniciadas",
      });
    }

    db.run(`DELETE FROM vacaciones WHERE id=?`, [id], (err2) => {
      if (err2) return res.status(500).json(err2);

      db.run(
        `UPDATE control_vacaciones
             SET dias_usados = dias_usados - ?,
                 dias_restantes = dias_restantes + ?
             WHERE empleado_id=?`,
        [vac.dias_tomados, vac.dias_tomados, vac.empleado_id],
      );

      res.json({ mensaje: "Vacaciones eliminadas" });
    });
  });
};
//Editar acumulados
exports.editarAcumulados = (req, res) => {
  const { id } = req.params;
  const { dias_acumulados } = req.body;
  db.get(`SELECT * FROM control_vacaciones WHERE id=?`, [id], (err, control) => {
    if (err) return res.status(500).json(err);
    if (!control) return res.status(404).json({ mensaje: "No encontrado" });    

    db.run(
      `UPDATE control_vacaciones
         SET dias_acumulados=?
         WHERE id=?`,
      [dias_acumulados, id],
      (err2) => {
        if (err2) return res.status(500).json(err2);
        res.json({ mensaje: "Días acumulados actualizados" });
      },
    );
  });
}