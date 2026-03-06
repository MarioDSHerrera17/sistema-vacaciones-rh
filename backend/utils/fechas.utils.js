function calcularDias(fechaInicio, fechaFin) {

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const diferencia = fin - inicio;

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1;

  return dias;
}

module.exports = { calcularDias };