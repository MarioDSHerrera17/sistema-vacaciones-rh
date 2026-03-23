const cron = require("node-cron");
const db = require("../db");
const {
  calcularDiasVacaciones,
  calcularAntiguedad,
} = require("../utils/vacaciones.utils");

cron.schedule("1 0 1 1 *", async () => {
  console.log("[JOB] Iniciando renovación anual de vacaciones...");

  const anioNuevo = new Date().getFullYear();
  const anioAnterior = anioNuevo - 1;

  try {
    const pool = await db;

    console.log(
      `[JOB] Generando control para año ${anioNuevo} desde ${anioAnterior}`,
    );

    const [empleados] = await pool.execute(
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
    );

    if (empleados.length === 0) {
      return console.log("[JOB] No hay empleados activos para renovar.");
    }

    console.log(`[JOB] Empleados encontrados: ${empleados.length}`);

    let procesados = 0;
    let errores = 0;

    for (const emp of empleados) {
      try {
        const anios = calcularAntiguedad(emp.fecha_ingreso);
        const diasNuevos = calcularDiasVacaciones(anios);

        const diasSobrantes =
          emp.dias_correspondientes + emp.dias_acumulados - emp.dias_usados;

        const acumulados = Math.max(diasSobrantes, 0);

        console.log(
          `[JOB] Empleado ${emp.id} → días nuevos: ${diasNuevos}, acumulados: ${acumulados}`,
        );

        await pool.execute(
          `INSERT IGNORE INTO control_vacaciones
           (empleado_id, anio, dias_correspondientes, dias_acumulados, dias_usados)
           VALUES (?, ?, ?, ?, 0)`,
          [emp.id, anioNuevo, diasNuevos, acumulados],
        );

        procesados++;
        console.log(`[JOB] ✓ Empleado ${emp.id} renovado correctamente`);
      } catch (err2) {
        errores++;
        console.error(
          `[JOB] Error al renovar empleado ${emp.id}:`,
          err2.message,
        );
      }
    }

    console.log(
      `[JOB] ✅ Renovación completada. Procesados: ${procesados}, Errores: ${errores}`,
    );
  } catch (err) {
    console.error("[JOB] Error general:", err.message);
  }
});
