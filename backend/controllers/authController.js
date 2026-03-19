/*
  Controlador de autenticación
  Valida el código de acceso para modo administrador
*/

const CODIGO_ADMIN = "ETU2026V";

// ======================================
// VERIFICAR CÓDIGO
// ======================================

exports.verificarCodigo = (req, res) => {
  const { codigo } = req.body;

  if (!codigo) {
    return res.status(400).json({ mensaje: "El código es obligatorio" });
  }

  if (codigo === CODIGO_ADMIN) {
    return res.json({ valido: true });
  }

  return res.status(401).json({ valido: false, mensaje: "Código incorrecto" });
};
