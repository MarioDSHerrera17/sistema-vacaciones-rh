/*
  Controlador para vacaciones
  Gestiona el ciclo completo: historial, registro, edición y eliminación
*/

const db = require("../db");
const { calcularDias } = require("../utils/fechas.utils");

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
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows);
  });
};

// ======================================
// REGISTRAR VACACIONES
// ======================================

exports.registrarVacaciones = (req, res) => {
  const { empleado_id, fecha_inicio, fecha_fin, comentario } = req.body;

  // =============================
  // VALIDACIONES
  // =============================

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

  // FIX: Prohibir vacaciones que crucen año
  if (new Date(fecha_inicio).getFullYear() !== new Date(fecha_fin).getFullYear()) {
    return res.status(400).json({
      mensaje: "Las vacaciones no pueden cruzar de año. Registra dos periodos separados",
    });
  }

  const dias = calcularDias(fecha_inicio, fecha_fin);

  // FIX: Usar el año de fecha_inicio en lugar del año actual del servidor
  const anioActual = new Date(fecha_inicio).getFullYear();

  // =============================
  // VERIFICAR CONTROL Y ESTATUS
  // =============================

  db.get(
    `SELECT cv.*, e.estatus
     FROM control_vacaciones cv
     JOIN empleados e ON e.id = cv.empleado_id
     WHERE cv.empleado_id = ? AND cv.anio = ?`,
    [empleado_id, anioActual],
    (err, control) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!control) {
        return res.status(404).json({
          mensaje: "No existe control de vacaciones para este empleado",
        });
      }

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

      // =============================
      // VALIDAR TRASLAPE
      // =============================

      db.get(
        `SELECT id FROM vacaciones
         WHERE empleado_id = ?
         AND fecha_inicio <= ?
         AND fecha_fin >= ?`,
        [empleado_id, fecha_fin, fecha_inicio],
        (errOverlap, overlap) => {
          if (errOverlap) return res.status(500).json({ error: errOverlap.message });

          if (overlap) {
            return res.status(400).json({
              mensaje: "Ya existen vacaciones registradas en ese periodo",
            });
          }

          // =============================
          // INSERTAR VACACIONES
          // =============================

          db.run(
            `INSERT INTO vacaciones
             (empleado_id, fecha_inicio, fecha_fin, dias_tomados, comentario)
             VALUES (?, ?, ?, ?, ?)`,
            [empleado_id, fecha_inicio, fecha_fin, dias, comentario],
            function (err2) {
              if (err2) return res.status(500).json({ error: err2.message });

              // =============================
              // ACTUALIZAR DÍAS USADOS
              // =============================

              db.run(
                `UPDATE control_vacaciones
                 SET dias_usados = dias_usados + ?
                 WHERE id = ?`,
                [dias, control.id],
                (err3) => {
                  if (err3) return res.status(500).json({ error: err3.message });

                  res.json({
                    mensaje: "Vacaciones registradas correctamente",
                    dias_tomados: dias,
                    dias_restantes: disponibles - dias,
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

  // =============================
  // VALIDACIONES
  // =============================

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

  // FIX: Prohibir vacaciones que crucen año
  if (new Date(fecha_inicio).getFullYear() !== new Date(fecha_fin).getFullYear()) {
    return res.status(400).json({
      mensaje: "Las vacaciones no pueden cruzar de año. Registra dos periodos separados",
    });
  }

  const diasNuevos = calcularDias(fecha_inicio, fecha_fin);
  const hoy = new Date().toISOString().split("T")[0];

  // =============================
  // BUSCAR VACACIÓN
  // =============================

  db.get(`SELECT * FROM vacaciones WHERE id = ?`, [id], (err, vac) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!vac) {
      return res.status(404).json({ mensaje: "Vacación no encontrada" });
    }

    // =============================
    // VACACIONES YA PASADAS → SOLO COMENTARIO
    // =============================

    if (vac.fecha_fin < hoy) {
      db.run(
        `UPDATE vacaciones SET comentario = ? WHERE id = ?`,
        [comentario, id],
        (errUpdate) => {
          if (errUpdate) return res.status(500).json({ error: errUpdate.message });

          return res.json({
            mensaje: "Las vacaciones ya ocurrieron. Solo se actualizó el comentario",
          });
        }
      );

      return;
    }

    // FIX: Usar el año de fecha_inicio en lugar del año actual del servidor
    const anioActual = new Date(fecha_inicio).getFullYear();

    // =============================
    // VERIFICAR CONTROL
    // =============================

    db.get(
      `SELECT * FROM control_vacaciones WHERE empleado_id = ? AND anio = ?`,
      [vac.empleado_id, anioActual],
      (err2, control) => {
        if (err2) return res.status(500).json({ error: err2.message });

        if (!control) {
          return res.status(404).json({
            mensaje: "Las vacaciones no se pueden editar para ese año",
          });
        }

        const disponibles =
          control.dias_correspondientes +
          control.dias_acumulados -
          control.dias_usados +
          vac.dias_tomados; // Se devuelven los días actuales al pool

        if (disponibles < diasNuevos) {
          return res.status(400).json({
            mensaje: `No hay suficientes días. Disponibles: ${disponibles}, solicitados: ${diasNuevos}`,
          });
        }

        // =============================
        // VALIDAR TRASLAPE AL EDITAR
        // =============================

        db.get(
          `SELECT id FROM vacaciones
           WHERE empleado_id = ?
           AND id != ?
           AND fecha_inicio <= ?
           AND fecha_fin >= ?`,
          [vac.empleado_id, id, fecha_fin, fecha_inicio],
          (errOverlap, overlap) => {
            if (errOverlap) return res.status(500).json({ error: errOverlap.message });

            if (overlap) {
              return res.status(400).json({
                mensaje: "Ya existen vacaciones registradas en ese periodo",
              });
            }

            // =============================
            // ACTUALIZAR VACACIONES
            // =============================

            db.run(
              `UPDATE vacaciones
               SET fecha_inicio = ?, fecha_fin = ?, dias_tomados = ?, comentario = ?
               WHERE id = ?`,
              [fecha_inicio, fecha_fin, diasNuevos, comentario, id],
              (err3) => {
                if (err3) return res.status(500).json({ error: err3.message });

                // =============================
                // ACTUALIZAR DÍAS USADOS
                // =============================

                db.run(
                  `UPDATE control_vacaciones
                   SET dias_usados = dias_usados - ? + ?
                   WHERE id = ?`,
                  [vac.dias_tomados, diasNuevos, control.id],
                  (err4) => {
                    if (err4) return res.status(500).json({ error: err4.message });

                    res.json({
                      mensaje: "Vacaciones actualizadas correctamente",
                    });
                  }
                );
              }
            );
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

  // =============================
  // BUSCAR VACACIÓN
  // =============================

  db.get(`SELECT * FROM vacaciones WHERE id = ?`, [id], (err, vac) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!vac) {
      return res.status(404).json({ mensaje: "Vacación no encontrada" });
    }

    if (vac.fecha_inicio <= hoy) {
      return res.status(400).json({
        mensaje: "No se pueden eliminar vacaciones ya iniciadas o pasadas",
      });
    }

    // FIX: Usar el año de fecha_inicio de la vacación
    const anioVacacion = new Date(vac.fecha_inicio).getFullYear();

    // =============================
    // VERIFICAR CONTROL
    // =============================

    db.get(
      `SELECT * FROM control_vacaciones WHERE empleado_id = ? AND anio = ?`,
      [vac.empleado_id, anioVacacion],
      (err2, control) => {
        if (err2) return res.status(500).json({ error: err2.message });

        if (!control) {
          return res.status(404).json({
            mensaje: "No existe control de vacaciones para este año",
          });
        }

        // =============================
        // ELIMINAR Y DEVOLVER DÍAS
        // =============================

        db.run(`DELETE FROM vacaciones WHERE id = ?`, [id], (err3) => {
          if (err3) return res.status(500).json({ error: err3.message });

          db.run(
            `UPDATE control_vacaciones
             SET dias_usados = dias_usados - ?
             WHERE id = ?`,
            [vac.dias_tomados, control.id],
            (err4) => {
              if (err4) return res.status(500).json({ error: err4.message });

              res.json({ mensaje: "Vacaciones eliminadas correctamente" });
            }
          );
        });
      }
    );
  });
};