const express = require("express");
const router = express.Router();

const {
  crearBackup,
  obtenerBackups,
  eliminarBackup,
} = require("../controllers/backupController");

router.post("/", crearBackup);
router.get("/", obtenerBackups);
router.delete("/:nombre", eliminarBackup);

module.exports = router;