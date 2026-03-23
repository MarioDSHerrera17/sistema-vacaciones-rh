const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const RUTA_BACKUPS = path.join(__dirname, "../../database/backups");

const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "sistema_vacaciones",
};

// ======================================
// CREAR RESPALDO
// ======================================

const { spawn } = require("child_process");

exports.crearBackup = (req, res) => {
  try {
    if (!fs.existsSync(RUTA_BACKUPS)) {
      fs.mkdirSync(RUTA_BACKUPS, { recursive: true });
    }

    const ahora = new Date();
    const fecha = ahora.toISOString().split("T")[0];
    const hora = ahora.toTimeString().split(" ")[0].replace(/:/g, "-");

    const nombreArchivo = `backup_${fecha}_${hora}.sql`;
    const rutaDestino = path.join(RUTA_BACKUPS, nombreArchivo);

    // 🔥 RUTA COMPLETA DE MYSQLDUMP (CLAVE)
    const mysqldumpPath = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe"`;

    const comando = `${mysqldumpPath} -h ${DB_CONFIG.host} -u ${DB_CONFIG.user} -p${DB_CONFIG.password} ${DB_CONFIG.database} > "${rutaDestino}"`;

    exec(comando, (error, stdout, stderr) => {
      if (error) {
        console.error("Error mysqldump:", error);
        return res.status(500).json({
          mensaje: "Error al crear respaldo",
          error: error.message,
        });
      }

      if (stderr) {
        console.warn("Warning mysqldump:", stderr);
      }

      res.json({
        mensaje: "Respaldo creado correctamente",
        archivo: nombreArchivo,
        ruta: rutaDestino,
      });
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
      .filter((f) => f.endsWith(".sql")) // 🔥 cambio aquí
      .map((f) => {
        const stats = fs.statSync(path.join(RUTA_BACKUPS, f));
        return {
          nombre: f,
          fecha: stats.mtime,
          tamaño: (stats.size / 1024).toFixed(1) + " KB",
        };
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

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
