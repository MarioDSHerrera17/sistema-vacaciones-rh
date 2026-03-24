---

# 🏖️ Sistema de Control de Vacaciones (RH)

Aplicación web para la gestión de vacaciones de empleados dentro de una organización.
El sistema permite administrar empleados, periodos vacacionales, días acumulados y generar reportes, todo desde una interfaz dinámica sin recargas.

---

## 📌 Descripción

Este sistema fue desarrollado como una solución interna para el área de **Recursos Humanos**, permitiendo llevar un control preciso de las vacaciones conforme a la ley y políticas internas.

La aplicación está diseñada para funcionar en una **red local**, sin necesidad de exposición a internet, garantizando mayor seguridad y simplicidad en su implementación.

---

## 🛠️ Tecnologías utilizadas

### Frontend

* **Vue.js** → Interfaz dinámica sin recargas
* **Vite** → Build tool

### Backend

* **Node.js** → Lógica del sistema
* **Express.js** → API REST

### Base de datos

* **MySQL**

### Otros

* **Cron Jobs** → Automatización de procesos anuales
* **DNS local** → Acceso amigable dentro de la red

---

## 🧩 Arquitectura del proyecto

```
/backend
  /controllers   # Lógica de negocio
  /data          # Datos auxiliares
  /jobs          # Tareas programadas (cron)
  /routes        # Endpoints de la API
  /utils         # Funciones reutilizables
  db.js          # Conexión a MySQL
  initDatabase.js# Inicialización de DB
  server.js      # Servidor principal

/frontend
  /src
    /assets
    /components
    /css
    /router
    /services
    /stores
    /views
    App.vue
    main.js
  index.html

/database        # Scripts o estructura de BD
/electron        # Configuración para app de escritorio (si aplica)
```

---

## 🚀 Funcionalidades principales

### 👥 Gestión de empleados

* Alta de empleados con:

  * Nombre
  * Fecha de ingreso
  * Puesto
  * Departamento
* Activar/Inactivar empleados (sin eliminar datos)

---

### 📊 Control de vacaciones

* Cálculo automático de días por año según fecha de ingreso
* Visualización de:

  * Días asignados
  * Días utilizados
  * Días restantes
  * Días acumulados

---

### 🔄 Acumulación automática

* Los días no utilizados se transfieren automáticamente a acumulados al inicio de año mediante un **cron job**

---

### 🗓️ Gestión de periodos vacacionales

* Crear solicitudes de vacaciones por empleado
* Editar vacaciones **solo si no han iniciado**
* Eliminar vacaciones futuras (no pasadas)
* Exclusión automática de:

  * Fines de semana
  * Días feriados

---

### 🎉 Gestión de días feriados

* Registro de días festivos
* Exclusión automática en el cálculo de vacaciones

---

### 🔍 Filtros y estados

* Filtrar empleados por:

  * Disponibles
  * De vacaciones
  * Inactivos

---

### 📈 Reportes

* Generación de reportes basados en:

  * Estado de empleados
  * Vacaciones
  * Días utilizados/acumulados

---

### 🔐 Seguridad básica

* Uso de un **código estático** para permitir la edición dentro del sistema

---

## 🌐 Despliegue

El sistema está diseñado para ejecutarse en una **red local**:

* Se levanta un servidor Node.js accesible por:

  ```
  http://IP_LOCAL:PUERTO
  ```
* Se implementó un **DNS local** para evitar el uso de la IP directamente

🔒 No se expone a internet por:

* Seguridad
* Uso exclusivo interno
* No requerir acceso externo

---


## ⚠️ Reglas importantes del sistema

* ❌ No se pueden eliminar empleados (solo inactivar)
* ❌ No se pueden eliminar vacaciones pasadas
* ❌ No se pueden editar vacaciones ya iniciadas
* ✔️ Los días feriados no cuentan como vacaciones
* ✔️ Los fines de semana no se contabilizan

---

## 🔮 Posibles mejoras

* Sistema de autenticación con roles
* Historial de cambios (auditoría)
* Dashboard con métricas visuales
* Exportación de reportes (PDF/Excel)
* Notificaciones automáticas
* Deploy en entorno cloud (opcional)

---

## 🤝 Contribuciones

Este proyecto fue desarrollado para uso interno de ETU, pero puedes hacer fork y adaptarlo a tus necesidades.

---

