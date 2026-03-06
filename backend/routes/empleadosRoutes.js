const express = require("express");
const router = express.Router();

const empleadosController = require("../controllers/empleadosController");


// CRUD
router.post("/empleados", empleadosController.crearEmpleado);
router.get("/empleados", empleadosController.obtenerEmpleados);
router.get("/empleados/:id", empleadosController.obtenerEmpleadoPorId);
router.put("/empleados/:id", empleadosController.actualizarEmpleado);

// activar / desactivar
router.put("/empleados/desactivar/:id", empleadosController.desactivarEmpleado);
router.put("/empleados/activar/:id", empleadosController.activarEmpleado);

module.exports = router;