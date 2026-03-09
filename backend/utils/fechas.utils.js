const feriados = [
  "2026-01-01",
  "2026-02-05",
  "2026-03-16",
  "2026-05-01",
  "2026-09-16",
  "2026-11-16",
  "2026-12-25"
]

function parseFecha(fecha){

  const [anio, mes, dia] = fecha.split("-")

  return new Date(anio, mes - 1, dia)

}

exports.calcularDias = (inicio, fin) => {

  let fechaInicio = parseFecha(inicio)
  let fechaFin = parseFecha(fin)

  let dias = 0

  while (fechaInicio <= fechaFin) {

    const diaSemana = fechaInicio.getDay()

    const yyyy = fechaInicio.getFullYear()
    const mm = String(fechaInicio.getMonth()+1).padStart(2,"0")
    const dd = String(fechaInicio.getDate()).padStart(2,"0")

    const fechaISO = `${yyyy}-${mm}-${dd}`

    const esFinDeSemana = diaSemana === 0 || diaSemana === 6
    const esFeriado = feriados.includes(fechaISO)

    if (!esFinDeSemana && !esFeriado) {
      dias++
    }

    fechaInicio.setDate(fechaInicio.getDate() + 1)

  }

  return dias

}