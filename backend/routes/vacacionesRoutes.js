const express = require("express");
const router = express.Router();

const vacacionesController = require("../controllers/vacacionesController");


router.get("/control", vacacionesController.obtenerControlVacaciones);//Se queda
router.put("/acumulados/:id", vacacionesController.editarAcumulados);//Se queda
router.get("/empleado/:id", vacacionesController.obtenerHistorialPorEmpleado);//Se queda

module.exports = router;
