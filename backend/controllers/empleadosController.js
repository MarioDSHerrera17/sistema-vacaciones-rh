/*
  Controlador para los empleados
  Se definen las funciones para gestionar las operaciones CRUD de los empleados
*/

const db = require("../db");

const {
  calcularDiasVacaciones,
  calcularAntiguedad,
} = require("../utils/vacaciones.utils");

// ======================================
// CREAR EMPLEADO
// ======================================

exports.crearEmpleado = (req, res) => {
  const { nombre, fecha_ingreso, puesto, departamento } = req.body;

  // =============================
  // VALIDACIONES
  // =============================

  if (!nombre || !fecha_ingreso || !puesto || !departamento) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  const nombreLimpio = nombre.trim();
  const departamentoLimpio = departamento.trim().toUpperCase();

  if (nombreLimpio.length < 3) {
    return res.status(400).json({
      mensaje: "El nombre debe tener al menos 3 caracteres",
    });
  }

  const hoy = new Date();
  const fechaIngreso = new Date(fecha_ingreso);

  if (fechaIngreso > hoy) {
    return res.status(400).json({
      mensaje: "La fecha de ingreso no puede ser futura",
    });
  }

  // =============================
  // INSERTAR EMPLEADO
  // =============================

  db.run(
    `INSERT INTO empleados (nombre, fecha_ingreso, puesto, departamento)
     VALUES (?, ?, ?, ?)`,
    [nombreLimpio, fecha_ingreso, puesto, departamentoLimpio],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const empleadoId = this.lastID;

      // =============================
      // CALCULAR VACACIONES
      // =============================

      const anios = calcularAntiguedad(fecha_ingreso);
      const dias = calcularDiasVacaciones(anios);
      const anioActual = new Date().getFullYear();

      // =============================
      // CREAR CONTROL VACACIONES
      // =============================

      db.run(
        `INSERT INTO control_vacaciones (empleado_id, anio, dias_correspondientes)
         VALUES (?, ?, ?)`,
        [empleadoId, anioActual, dias],
        (err2) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }

          res.json({
            mensaje: "Empleado creado correctamente",
            empleadoId,
            diasVacaciones: dias,
          });
        }
      );
    }
  );
};

// ======================================
// OBTENER TODOS LOS EMPLEADOS
// Incluye disponibilidad y antiguedad calculados
// ======================================

exports.obtenerEmpleados = (req, res) => {
  const hoy = new Date().toISOString().split("T")[0];

  const query = `
    SELECT
      e.id,
      e.nombre,
      e.fecha_ingreso,
      e.puesto,
      e.departamento,
      e.estatus,
      e.created_at,

      -- Antigüedad en años completos
      (
        CAST(strftime('%Y', 'now') AS INTEGER) -
        CAST(strftime('%Y', e.fecha_ingreso) AS INTEGER) -
        CASE
          WHEN strftime('%m-%d', 'now') < strftime('%m-%d', e.fecha_ingreso)
          THEN 1 ELSE 0
        END
      ) AS antiguedad,

      -- Disponibilidad: 'vacaciones' si hay un periodo activo hoy, sino 'disponible'
      CASE
        WHEN EXISTS (
          SELECT 1 FROM vacaciones v
          WHERE v.empleado_id = e.id
          AND v.fecha_inicio <= ?
          AND v.fecha_fin >= ?
        ) THEN 'vacaciones'
        ELSE 'disponible'
      END AS disponibilidad

    FROM empleados e
    ORDER BY e.nombre
  `;

  db.all(query, [hoy, hoy], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(rows);
  });
};

// ======================================
// OBTENER EMPLEADO POR ID
// ======================================

exports.obtenerEmpleadoPorId = (req, res) => {
  const { id } = req.params;
  const hoy = new Date().toISOString().split("T")[0];

  const query = `
    SELECT
      e.id,
      e.nombre,
      e.fecha_ingreso,
      e.puesto,
      e.departamento,
      e.estatus,
      e.created_at,
      (
        CAST(strftime('%Y', 'now') AS INTEGER) -
        CAST(strftime('%Y', e.fecha_ingreso) AS INTEGER) -
        CASE
          WHEN strftime('%m-%d', 'now') < strftime('%m-%d', e.fecha_ingreso)
          THEN 1 ELSE 0
        END
      ) AS antiguedad,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM vacaciones v
          WHERE v.empleado_id = e.id
          AND v.fecha_inicio <= ?
          AND v.fecha_fin >= ?
        ) THEN 'vacaciones'
        ELSE 'disponible'
      END AS disponibilidad
    FROM empleados e
    WHERE e.id = ?
  `;

  db.get(query, [hoy, hoy, id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({
        mensaje: "Empleado no encontrado",
      });
    }

    res.json(row);
  });
};

// ======================================
// ACTUALIZAR EMPLEADO
// ======================================

exports.actualizarEmpleado = (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_ingreso, puesto, departamento } = req.body;

  // =============================
  // VALIDACIONES
  // =============================

  if (!nombre || !fecha_ingreso || !puesto || !departamento) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios",
    });
  }

  const nombreLimpio = nombre.trim();
  const departamentoLimpio = departamento.trim().toUpperCase();

  const fechaIngreso = new Date(fecha_ingreso);
  const hoy = new Date();

  if (fechaIngreso > hoy) {
    return res.status(400).json({
      mensaje: "La fecha de ingreso no puede ser futura",
    });
  }

  // =============================
  // ACTUALIZAR
  // =============================

  const query = `
    UPDATE empleados
    SET nombre = ?, fecha_ingreso = ?, puesto = ?, departamento = ?
    WHERE id = ?
  `;

  db.run(
    query,
    [nombreLimpio, fecha_ingreso, puesto, departamentoLimpio, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          mensaje: "Empleado no encontrado",
        });
      }

      res.json({
        mensaje: "Empleado actualizado correctamente",
      });
    }
  );
};

// ======================================
// DESACTIVAR EMPLEADO
// ======================================

exports.desactivarEmpleado = (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE empleados SET estatus = 'inactivo' WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ mensaje: "Empleado no encontrado" });
      }

      res.json({ mensaje: "Empleado desactivado correctamente" });
    }
  );
};

// ======================================
// ACTIVAR EMPLEADO
// ======================================

exports.activarEmpleado = (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE empleados SET estatus = 'activo' WHERE id = ?`,
    [id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ mensaje: "Empleado no encontrado" });
      }

      res.json({ mensaje: "Empleado activado correctamente" });
    }
  );
};