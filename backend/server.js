const express = require("express");
const cors = require("cors");

const initDB = require("./initDatabase"); // ✅ importar
require("./jobs/renovarVacaciones.job.js");

initDB();

const empleadosRoutes = require("./routes/empleadosRoutes");
const vacacionesRoutes = require("./routes/vacacionesRoutes");
const historialRoutes = require("./routes/historiaRoutes");
const feriadosRoutes = require("./routes/feriadosRoutes");
const backupRoutes = require("./routes/backupRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

app.use("/api", empleadosRoutes);
app.use("/api/vacaciones", vacacionesRoutes);
app.use("/api/historial", historialRoutes);
app.use("/api/feriados", feriadosRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});
