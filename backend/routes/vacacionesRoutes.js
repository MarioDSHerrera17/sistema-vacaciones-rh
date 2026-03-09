const express = require("express");
const router = express.Router();

const vacacionesController = require("../controllers/vacacionesController");

router.post("/", vacacionesController.registrarVacaciones);
router.get("/control", vacacionesController.obtenerControlVacaciones);
router.get("/historial", vacacionesController.obtenerHistorialVacaciones);
router.put("/acumulados/:id", vacacionesController.editarAcumulados)
router.put("/:id", vacacionesController.editarVacaciones)
router.delete("/:id", vacacionesController.eliminarVacaciones)


module.exports = router;