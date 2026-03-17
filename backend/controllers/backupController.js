/*
  Controlador de respaldos
  Copia la base de datos a la carpeta backups/
  con fecha y hora en el nombre del archivo
*/

const fs = require("fs");
const path = require("path");

const RUTA_DB = path.join(__dirname, "../../database/vacaciones.db");
const RUTA_BACKUPS = path.join(__dirname, "../../database/backups");

// ======================================
// CREAR RESPALDO
// ======================================

exports.crearBackup = (req, res) => {      
  try {
    // Crear carpeta backups si no existe
    if (!fs.existsSync(RUTA_BACKUPS)) {
      fs.mkdirSync(RUTA_BACKUPS);
    }

    // Verificar que la BD existe
    if (!fs.existsSync(RUTA_DB)) {
      return res.status(404).json({
        mensaje: "No se encontró el archivo de base de datos",
      });
    }

    // Generar nombre con fecha y hora
    const ahora = new Date();
    const fecha = ahora.toISOString().split("T")[0]; // 2026-03-17
    const hora = ahora.toTimeString().split(" ")[0].replace(/:/g, "-"); // 14-30-00
    const nombreArchivo = `backup_${fecha}_${hora}.db`;
    const rutaDestino = path.join(RUTA_BACKUPS, nombreArchivo);

    // Copiar archivo
    fs.copyFileSync(RUTA_DB, rutaDestino);

    res.json({
      mensaje: "Respaldo creado correctamente",
      archivo: nombreArchivo,
      ruta: rutaDestino,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// OBTENER LISTA DE RESPALDOS
// ======================================

exports.obtenerBackups = (req, res) => {
  try {
    if (!fs.existsSync(RUTA_BACKUPS)) {
      return res.json([]);
    }

    const archivos = fs
      .readdirSync(RUTA_BACKUPS)
      .filter((f) => f.endsWith(".db"))
      .map((f) => {
        const stats = fs.statSync(path.join(RUTA_BACKUPS, f));
        return {
          nombre: f,
          fecha: stats.mtime,
          tamaño: (stats.size / 1024).toFixed(1) + " KB",
        };
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // más reciente primero

    res.json(archivos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ======================================
// ELIMINAR RESPALDO
// ======================================

exports.eliminarBackup = (req, res) => {
  const { nombre } = req.params;

  // Validar que no salga del directorio backups (seguridad)
  if (nombre.includes("..") || nombre.includes("/") || nombre.includes("\\")) {
    return res.status(400).json({ mensaje: "Nombre de archivo inválido" });
  }

  const rutaArchivo = path.join(RUTA_BACKUPS, nombre);

  try {
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ mensaje: "Respaldo no encontrado" });
    }

    fs.unlinkSync(rutaArchivo);

    res.json({ mensaje: "Respaldo eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};