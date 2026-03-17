/*
  Controlador para feriados
  Lee y escribe sobre data/feriados.json
  No usa base de datos
*/

const fs = require("fs");
const path = require("path");
const db = require("../db");

const RUTA_FERIADOS = path.join(__dirname, "../data/feriados.json");

// ======================================
// HELPERS
// ======================================

const leerFeriados = () => {
  const contenido = fs.readFileSync(RUTA_FERIADOS, "utf-8");
  return JSON.parse(contenido);
};

const guardarFeriados = (feriados) => {
  fs.writeFileSync(RUTA_FERIADOS, JSON.stringify(feriados, null, 2), "utf-8");
};

// ======================================
// OBTENER TODOS LOS FERIADOS
// ======================================

exports.obtenerFeriados = (req, res) => {
  try {
    const feriados = leerFeriados();
    res.json(feriados);
  } catch (err) {
    res.status(500).json({ error: "Error al leer los feriados" });
  }
};

// ======================================
// AGREGAR FERIADO
// ======================================

exports.agregarFeriado = (req, res) => {
  const { fecha, descripcion } = req.body;

  // =============================
  // VALIDACIONES
  // =============================

  if (!fecha || !descripcion) {
    return res.status(400).json({
      mensaje: "fecha y descripcion son obligatorios",
    });
  }

  const regexFecha = /^\d{4}-\d{2}-\d{2}$/;
  if (!regexFecha.test(fecha)) {
    return res.status(400).json({
      mensaje: "El formato de fecha debe ser YYYY-MM-DD",
    });
  }

  try {
    const feriados = leerFeriados();

    // Verificar duplicado
    const existe = feriados.find((f) => f.fecha === fecha);
    if (existe) {
      return res.status(400).json({
        mensaje: "Ya existe un feriado registrado en esa fecha",
      });
    }

    // Generar nuevo id
    const nuevoId =
      feriados.length > 0 ? Math.max(...feriados.map((f) => f.id)) + 1 : 1;

    const nuevo = {
      id: nuevoId,
      fecha,
      descripcion: descripcion.trim(),
    };

    feriados.push(nuevo);

    // Ordenar por fecha antes de guardar
    feriados.sort((a, b) => (a.fecha > b.fecha ? 1 : -1));

    guardarFeriados(feriados);

    res.json({
      mensaje: "Feriado agregado correctamente",
      feriado: nuevo,
    });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar el feriado" });
  }
};

// ======================================
// ELIMINAR FERIADO
// ======================================

exports.eliminarFeriado = (req, res) => {
  const { id } = req.params;

  try {
    const feriados = leerFeriados();

    const index = feriados.findIndex((f) => f.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ mensaje: "Feriado no encontrado" });
    }

    const feriado = feriados[index];

    // =============================
    // VALIDAR QUE NO HAY VACACIONES
    // QUE CAIGAN EN ESTE FERIADO
    // =============================

    db.get(
      `SELECT v.id, e.nombre
       FROM vacaciones v
       JOIN empleados e ON e.id = v.empleado_id
       WHERE v.fecha_inicio <= ? AND v.fecha_fin >= ?
       LIMIT 1`,
      [feriado.fecha, feriado.fecha],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (row) {
          return res.status(400).json({
            mensaje: `No se puede eliminar este feriado porque ${row.nombre} tiene vacaciones registradas en esa fecha. Elimina o edita esas vacaciones primero.`,
          });
        }

        // =============================
        // SIN CONFLICTOS — ELIMINAR
        // =============================

        feriados.splice(index, 1);
        guardarFeriados(feriados);

        res.json({ mensaje: "Feriado eliminado correctamente" });
      },
    );
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el feriado" });
  }
};
