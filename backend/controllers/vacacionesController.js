const db = require("../db");
const { calcularDias } = require("../utils/fechas.utils");


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
// OBTENER HISTORIAL DE VACACIONES
// ======================================

exports.obtenerHistorialVacaciones = (req, res) => {

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
        return res.status(404).json({ mensaje: "No existe control de vacaciones" });
      }

      const disponibles =
        control.dias_correspondientes +
        control.dias_acumulados -
        control.dias_usados;

      if (disponibles < dias) {
        return res.status(400).json({
          mensaje: "No tiene suficientes días disponibles"
        });
      }

      // validar traslape

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
              mensaje: "Ya existen vacaciones en ese periodo"
            });
          }

          db.run(
            `INSERT INTO vacaciones
            (empleado_id, fecha_inicio, fecha_fin, dias_tomados, comentario)
            VALUES (?, ?, ?, ?, ?)`,
            [
              empleado_id,
              fecha_inicio,
              fecha_fin,
              dias,
              comentario
            ],
            function (err2) {

              if (err2) return res.status(500).json(err2);

              db.run(
                `UPDATE control_vacaciones
                 SET dias_usados = dias_usados + ?
                 WHERE id = ?`,
                [
                  dias,
                  control.id
                ],
                (err3) => {

                  if (err3) return res.status(500).json(err3);

                  res.json({
                    mensaje: "Vacaciones registradas",
                    dias_tomados: dias
                  });

                }
              );

            }
          );

        }
      );

    }
  );

};



// ======================================
// EDITAR VACACIONES
// ======================================

exports.editarVacaciones = (req, res) => {

  const { id } = req.params;
  const { fecha_inicio, fecha_fin, comentario } = req.body;

  const diasNuevos = calcularDias(fecha_inicio, fecha_fin);

  db.get(`SELECT * FROM vacaciones WHERE id=?`, [id], (err, vac) => {

    if (err) return res.status(500).json(err);

    if (!vac) return res.status(404).json({ mensaje: "Vacación no encontrada" });

    const anioActual = new Date().getFullYear();

    db.get(
      `SELECT * FROM control_vacaciones WHERE empleado_id=? AND anio=?`,
      [vac.empleado_id, anioActual],
      (err2, control) => {

        if (err2) return res.status(500).json(err2);

        const disponibles =
          control.dias_correspondientes +
          control.dias_acumulados -
          control.dias_usados +
          vac.dias_tomados;

        if (disponibles < diasNuevos) {
          return res.status(400).json({
            mensaje: "No hay suficientes días para editar"
          });
        }

        db.run(
          `UPDATE vacaciones
           SET fecha_inicio=?, fecha_fin=?, dias_tomados=?, comentario=?
           WHERE id=?`,
          [
            fecha_inicio,
            fecha_fin,
            diasNuevos,
            comentario,
            id
          ],
          (err3) => {

            if (err3) return res.status(500).json(err3);

            db.run(
              `UPDATE control_vacaciones
               SET dias_usados = dias_usados - ? + ?
               WHERE id=?`,
              [
                vac.dias_tomados,
                diasNuevos,
                control.id
              ]
            );

            res.json({ mensaje: "Vacaciones actualizadas" });

          }
        );

      }
    );

  });

};



// ======================================
// ELIMINAR VACACIONES
// ======================================

exports.eliminarVacaciones = (req, res) => {

  const { id } = req.params;

  const hoy = new Date().toISOString().split("T")[0];

  db.get(`SELECT * FROM vacaciones WHERE id=?`, [id], (err, vac) => {

    if (err) return res.status(500).json(err);

    if (!vac) return res.status(404).json({ mensaje: "Vacación no encontrada" });

    if (vac.fecha_inicio <= hoy) {
      return res.status(400).json({
        mensaje: "No se pueden eliminar vacaciones ya iniciadas"
      });
    }

    const anioActual = new Date().getFullYear();

    db.get(
      `SELECT * FROM control_vacaciones WHERE empleado_id=? AND anio=?`,
      [vac.empleado_id, anioActual],
      (err2, control) => {

        if (err2) return res.status(500).json(err2);

        db.run(`DELETE FROM vacaciones WHERE id=?`, [id], (err3) => {

          if (err3) return res.status(500).json(err3);

          db.run(
            `UPDATE control_vacaciones
             SET dias_usados = dias_usados - ?
             WHERE id=?`,
            [
              vac.dias_tomados,
              control.id
            ]
          );

          res.json({ mensaje: "Vacaciones eliminadas" });

        });

      }
    );

  });

};



// ======================================
// EDITAR DIAS ACUMULADOS
// ======================================

exports.editarAcumulados = (req, res) => {

  const { id } = req.params;
  const { dias_acumulados } = req.body;

  db.run(
    `UPDATE control_vacaciones
     SET dias_acumulados=?
     WHERE id=?`,
    [dias_acumulados, id],
    (err) => {

      if (err) return res.status(500).json(err);

      res.json({ mensaje: "Días acumulados actualizados" });

    }
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