/*
  Utilidades de fechas
  Los feriados se leen desde data/feriados.json
  para que puedan ser gestionados desde el frontend
*/

const fs = require("fs");
const path = require("path");

const RUTA_FERIADOS = path.join(__dirname, "../data/feriados.json");

// ======================================
// LEER FERIADOS DESDE JSON
// ======================================

const obtenerFechasFeriadas = () => {
  try {
    const contenido = fs.readFileSync(RUTA_FERIADOS, "utf-8");
    const feriados = JSON.parse(contenido);
    return feriados.map((f) => f.fecha); // Solo las fechas en formato YYYY-MM-DD
  } catch (err) {
    console.error("Error al leer feriados.json:", err.message);
    return []; // Si falla la lectura, no bloquea el cálculo
  }
};

// ======================================
// PARSEAR FECHA SIN DESFASE DE ZONA HORARIA
// ======================================

const parseFecha = (fecha) => {
  const [anio, mes, dia] = fecha.split("-");
  return new Date(anio, mes - 1, dia);
};

// ======================================
// CALCULAR DÍAS HÁBILES
// Excluye fines de semana y feriados del JSON
// ======================================

exports.calcularDias = (inicio, fin) => {
  const feriados = obtenerFechasFeriadas();

  let fechaInicio = parseFecha(inicio);
  let fechaFin = parseFecha(fin);

  let dias = 0;

  while (fechaInicio <= fechaFin) {
    const diaSemana = fechaInicio.getDay();

    const yyyy = fechaInicio.getFullYear();
    const mm = String(fechaInicio.getMonth() + 1).padStart(2, "0");
    const dd = String(fechaInicio.getDate()).padStart(2, "0");
    const fechaISO = `${yyyy}-${mm}-${dd}`;

    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
    const esFeriado = feriados.includes(fechaISO);

    if (!esFinDeSemana && !esFeriado) {
      dias++;
    }

    fechaInicio.setDate(fechaInicio.getDate() + 1);
  }

  return dias;
};