const express = require("express");
const router = express.Router();

const { verificarCodigo } = require("../controllers/authController");

router.post("/verificar", verificarCodigo);

module.exports = router;