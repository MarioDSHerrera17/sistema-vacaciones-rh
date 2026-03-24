-- Creamos una nueva BD para sustituir SQLITE
CREATE DATABASE sistema_vacaciones;
USE sistema_vacaciones;
-- ======================================
-- TABLA EMPLEADOS
-- ======================================
CREATE TABLE IF NOT EXISTS empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  puesto VARCHAR(100),
  departamento VARCHAR(100),
  estatus VARCHAR(20) DEFAULT 'activo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ======================================
-- TABLA CONTROL VACACIONES
-- ======================================
CREATE TABLE IF NOT EXISTS control_vacaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  anio INT NOT NULL,
  dias_correspondientes INT NOT NULL,
  dias_usados INT DEFAULT 0,
  dias_acumulados INT DEFAULT 0,
  UNIQUE KEY uq_empleado_anio (empleado_id, anio),
  FOREIGN KEY (empleado_id)
    REFERENCES empleados(id)
    ON DELETE CASCADE
);

-- ======================================
-- TABLA VACACIONES
-- ======================================
CREATE TABLE IF NOT EXISTS vacaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_tomados INT NOT NULL,
  comentario TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id)
    REFERENCES empleados(id)
    ON DELETE CASCADE
);

Select * from empleados;
Select * from control_vacaciones;
Select * from vacaciones;