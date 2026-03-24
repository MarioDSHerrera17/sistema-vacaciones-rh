const express = require("express");
const cors = require("cors");
const path = require("path");

const initDB = require("./initDatabase");
require("./jobs/renovarVacaciones.job.js");

initDB();

const empleadosRoutes = require("./routes/empleadosRoutes");
const vacacionesRoutes = require("./routes/vacacionesRoutes");
const historialRoutes = require("./routes/historiaRoutes");
const feriadosRoutes = require("./routes/feriadosRoutes");
const backupRoutes = require("./routes/backupRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// =======================
// RUTAS API
// =======================
app.use("/api", empleadosRoutes);
app.use("/api/vacaciones", vacacionesRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/feriados", feriadosRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/auth", authRoutes);

// =======================
// FRONTEND (PRODUCCIÓN)
// =======================
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

// =======================
// SERVIDOR (AL FINAL)
// =======================
const PORT = process.env.PORT || 80;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});