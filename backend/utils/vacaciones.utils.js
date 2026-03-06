function calcularDiasVacaciones(anios) {

  if (anios === 1) return 12;
  if (anios === 2) return 14;
  if (anios === 3) return 16;
  if (anios === 4) return 18;
  if (anios === 5) return 20;

  if (anios >= 6 && anios <= 10) return 22;
  if (anios >= 11 && anios <= 15) return 24;
  if (anios >= 16 && anios <= 20) return 26;
  if (anios >= 21 && anios <= 25) return 28;
  if (anios >= 26 && anios <= 30) return 30;

  return 30;
}

function calcularAntiguedad(fechaIngreso) {

  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();

  let anios = hoy.getFullYear() - ingreso.getFullYear();

  const mes = hoy.getMonth() - ingreso.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < ingreso.getDate())) {
    anios--;
  }

  return anios + 1;
}

module.exports = {
  calcularDiasVacaciones,
  calcularAntiguedad
};