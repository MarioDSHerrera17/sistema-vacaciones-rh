const db = require("../db");
const { calcularDias } = require("../utils/fechas.utils");


// Registrar vacaciones
exports.registrarVacaciones = (req, res) => {

  const { empleado_id, fecha_inicio, fecha_fin, comentario } = req.body;

  const dias = calcularDias(fecha_inicio, fecha_fin);

  const anioActual = new Date().getFullYear();

  // Obtener control de vacaciones
  db.get(
    `SELECT * FROM control_vacaciones 
     WHERE empleado_id = ? AND anio = ?`,
    [empleado_id, anioActual],
    (err, control) => {

      if (err) return res.status(500).json(err);

      if (!control) {
        return res.status(404).json({
          mensaje: "No existe control de vacaciones para este empleado"
        });
      }

      // Validar si tiene días disponibles
      if (control.dias_restantes < dias) {
        return res.status(400).json({
          mensaje: "No tiene suficientes días de vacaciones"
        });
      }

      // Guardar vacaciones
      db.run(
        `INSERT INTO vacaciones
        (empleado_id, fecha_inicio, fecha_fin, dias_tomados, comentario)
        VALUES (?, ?, ?, ?, ?)`,
        [empleado_id, fecha_inicio, fecha_fin, dias, comentario],
        function (err2) {

          if (err2) return res.status(500).json(err2);

          // Actualizar control
          const nuevosUsados = control.dias_usados + dias;
          const nuevosRestantes = control.dias_restantes - dias;

          db.run(
            `UPDATE control_vacaciones
            SET dias_usados = ?, dias_restantes = ?
            WHERE id = ?`,
            [nuevosUsados, nuevosRestantes, control.id],
            (err3) => {

              if (err3) return res.status(500).json(err3);

              res.json({
                mensaje: "Vacaciones registradas correctamente",
                dias_tomados: dias,
                dias_restantes: nuevosRestantes
              });

            }
          );

        }
      );

    }
  );

};