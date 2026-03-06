const express = require("express");
const router = express.Router();

const vacacionesController = require("../controllers/vacacionesController");

router.post("/", vacacionesController.registrarVacaciones);

module.exports = router;