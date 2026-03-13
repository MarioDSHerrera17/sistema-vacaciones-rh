const express = require("express");
const router = express.Router();

const {
  obtenerFeriados,
  agregarFeriado,
  eliminarFeriado,
} = require("../controllers/feriadosController");

router.get("/", obtenerFeriados);
router.post("/", agregarFeriado);
router.delete("/:id", eliminarFeriado);

module.exports = router;