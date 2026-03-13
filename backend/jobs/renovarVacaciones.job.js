/*
  Job automático: Renovación anual de vacaciones
  Se ejecuta el 1 de enero a las 00:01
  Genera los registros de control_vacaciones para el año nuevo
  y acumula los días sobrantes del año anterior
*/

const cron = require("node-cron");
const db = require("../db");
const {
  calcularDiasVacaciones,
  calcularAntiguedad,
} = require("../utils/vacaciones.utils");

// ======================================
// JOB: 1 DE ENERO A LAS 00:01
// ======================================

cron.schedule("1 0 1 1 *", () => {
  console.log("[JOB] Iniciando renovación anual de vacaciones...");

  const anioNuevo = new Date().getFullYear();
  const anioAnterior = anioNuevo - 1;

  console.log(`[JOB] Generando control para año ${anioNuevo} desde ${anioAnterior}`);

  db.all(
    `SELECT 
      e.id,
      e.fecha_ingreso,
      cv.dias_correspondientes,
      cv.dias_usados,
      cv.dias_acumulados
     FROM empleados e
     JOIN control_vacaciones cv ON cv.empleado_id = e.id
     WHERE e.estatus = 'activo'
     AND cv.anio = ?`,
    [anioAnterior],
    (err, empleados) => {
      if (err) {
        return console.error("[JOB] Error al obtener empleados:", err.message);
      }

      if (empleados.length === 0) {
        return console.log("[JOB] No hay empleados activos para renovar.");
      }

      console.log(`[JOB] Empleados encontrados: ${empleados.length}`);

      let procesados = 0;
      let errores = 0;

      empleados.forEach((emp) => {
        const anios = calcularAntiguedad(emp.fecha_ingreso);
        const diasNuevos = calcularDiasVacaciones(anios);

        // Los días no usados del año anterior se acumulan
        const diasSobrantes =
          emp.dias_correspondientes + emp.dias_acumulados - emp.dias_usados;
        const acumulados = Math.max(diasSobrantes, 0);

        console.log(
          `[JOB] Empleado ${emp.id} → días nuevos: ${diasNuevos}, acumulados: ${acumulados}`
        );

        db.run(
          `INSERT OR IGNORE INTO control_vacaciones
           (empleado_id, anio, dias_correspondientes, dias_acumulados, dias_usados)
           VALUES (?, ?, ?, ?, 0)`,
          [emp.id, anioNuevo, diasNuevos, acumulados],
          (err2) => {
            if (err2) {
              errores++;
              console.error(
                `[JOB] Error al renovar empleado ${emp.id}:`,
                err2.message
              );
            } else {
              procesados++;
              console.log(`[JOB] ✓ Empleado ${emp.id} renovado correctamente`);
            }

            if (procesados + errores === empleados.length) {
              console.log(
                `[JOB] ✅ Renovación completada. Procesados: ${procesados}, Errores: ${errores}`
              );
            }
          }
        );
      });
    }
  );
});