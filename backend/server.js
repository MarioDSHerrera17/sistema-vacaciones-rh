const express = require("express");
const cors = require("cors");

require("./initDatabase");
require("./jobs/renovarVacaciones.job.js");

const empleadosRoutes = require("./routes/empleadosRoutes");
const vacacionesRoutes = require("./routes/vacacionesRoutes");
const historialRoutes = require("./routes/historiaRoutes");
const feriadosRoutes = require("./routes/feriadosRoutes");
const backupRoutes = require("./routes/backupRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// ======================================
// CORS — permite acceso desde cualquier PC en la red
// En producción puedes restringir el origin a tu IP local
// ej: origin: "http://192.168.1.50:5173"
// ======================================
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// ======================================
// RUTAS
// ======================================
app.use("/api", empleadosRoutes);
app.use("/api/vacaciones", vacacionesRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/feriados", feriadosRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/auth", authRoutes);

// ======================================
// SERVIDOR
// "0.0.0.0" hace que escuche en todas las interfaces de red
// no solo en localhost — necesario para acceso desde la red local
// ======================================
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`Accesible en la red en http://<IP-del-servidor>:${PORT}`);
});
