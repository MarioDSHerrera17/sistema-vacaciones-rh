const express = require('express');
const router = express.Router();

const historialController = require('../controllers/historialController');

router.post("/", historialController.registrarVacaciones);
router.get("/historial", historialController.obtenerHistorialVacaciones);
router.put("/:id", historialController.editarVacaciones);
router.delete("/:id", historialController.eliminarVacaciones);

module.exports = router;