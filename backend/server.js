const express = require("express");
const cors = require("cors");

require("./initDatabase");

const empleadosRoutes = require("./routes/empleadosRoutes");
const vacacionesRoutes = require("./routes/vacacionesRoutes");
const historialRoutes = require("./routes/historiaRoutes")

const app = express();

app.use(cors());
app.use(express.json());

// rutas
app.use("/api", empleadosRoutes);
app.use("/api/vacaciones", vacacionesRoutes);
app.use("/api/historial", historialRoutes);
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});