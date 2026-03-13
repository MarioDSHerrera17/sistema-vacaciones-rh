// ======================================
// UTILIDADES DE VACACIONES (LFT México)
// ======================================

/**
 * Calcula los días de vacaciones según antigüedad (LFT México).
 * @param {number} anios - Años de antigüedad del empleado
 * @returns {number} Días de vacaciones correspondientes
 */
function calcularDiasVacaciones(anios) {
  const tabla = [
    { hasta: 1,  dias: 12 },
    { hasta: 2,  dias: 14 },
    { hasta: 3,  dias: 16 },
    { hasta: 4,  dias: 18 },
    { hasta: 5,  dias: 20 },
    { hasta: 10, dias: 22 },
    { hasta: 15, dias: 24 },
    { hasta: 20, dias: 26 },
    { hasta: 25, dias: 28 },
    { hasta: 30, dias: 30 },
  ];

  return (tabla.find(({ hasta }) => anios <= hasta) ?? { dias: 30 }).dias;
}

/**
 * Calcula los años de antigüedad a partir de la fecha de ingreso.
 * Nota: retorna anios + 1 para considerar el año en curso como primer año.
 * Un empleado con menos de 1 año retornará 1 (primer año).
 * @param {string} fechaIngreso - Fecha de ingreso en formato ISO (YYYY-MM-DD)
 * @returns {number} Años de antigüedad (mínimo 1)
 */
function calcularAntiguedad(fechaIngreso) {
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();

  let anios = hoy.getFullYear() - ingreso.getFullYear();

  const difMes = hoy.getMonth() - ingreso.getMonth();

  if (difMes < 0 || (difMes === 0 && hoy.getDate() < ingreso.getDate())) {
    anios--;
  }

  // Se suma 1 para considerar el año en curso (ej: 0 años cumplidos = año 1)
  return anios + 1;
}

module.exports = {
  calcularDiasVacaciones,
  calcularAntiguedad,
};