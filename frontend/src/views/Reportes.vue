<template>
  <div class="empleados">
    <div v-if="toast.visible" :class="['toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>

    <div class="header">
      <h1>Reportes</h1>
    </div>

    <!-- TIPO DE REPORTE -->
    <div class="reporte-seccion">
      <label class="reporte-label">Tipo de reporte</label>
      <div class="reporte-tipos">
        <button
          v-for="tipo in tipos"
          :key="tipo.value"
          :class="['tab', tipoSeleccionado === tipo.value ? 'tab-activo' : '']"
          @click="seleccionarTipo(tipo.value)"
        >
          {{ tipo.label }}
        </button>
      </div>
    </div>

    <!-- FILTROS EMPLEADOS -->
    <div v-if="tipoSeleccionado === 'empleados'" class="reporte-filtros">
      <div class="filtro-grupo">
        <label>Estatus</label>
        <select v-model="filtros.empleados.estatus">
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>
      <div class="filtro-grupo">
        <label>Disponibilidad</label>
        <select v-model="filtros.empleados.disponibilidad">
          <option value="">Todas</option>
          <option value="disponible">Disponibles</option>
          <option value="vacaciones">En vacaciones</option>
        </select>
      </div>
      <div class="filtro-grupo">
        <label>Departamento</label>
        <select v-model="filtros.empleados.departamento">
          <option value="">Todos</option>
          <option v-for="dep in departamentos" :key="dep" :value="dep">
            {{ dep }}
          </option>
        </select>
      </div>
      <div class="filtro-grupo">
        <label>Fecha de ingreso desde</label>
        <input type="date" v-model="filtros.empleados.fecha_desde" />
      </div>
      <div class="filtro-grupo">
        <label>Fecha de ingreso hasta</label>
        <input type="date" v-model="filtros.empleados.fecha_hasta" />
      </div>
    </div>

    <!-- FILTROS VACACIONES -->
    <div v-if="tipoSeleccionado === 'vacaciones'" class="reporte-filtros">
      <div class="filtro-grupo">
        <label>Empleado</label>
        <select v-model="filtros.vacaciones.empleado_id">
          <option value="">Todos</option>
          <option v-for="emp in empleados" :key="emp.id" :value="emp.id">
            {{ emp.nombre }}
          </option>
        </select>
      </div>
      <div class="filtro-grupo">
        <label>Fecha inicio desde</label>
        <input type="date" v-model="filtros.vacaciones.fecha_desde" />
      </div>
      <div class="filtro-grupo">
        <label>Fecha inicio hasta</label>
        <input type="date" v-model="filtros.vacaciones.fecha_hasta" />
      </div>
    </div>

    <!-- FILTROS FERIADOS -->
    <div v-if="tipoSeleccionado === 'feriados'" class="reporte-filtros">
      <div class="filtro-grupo">
        <label>Año</label>
        <select v-model="filtros.feriados.anio">
          <option value="">Todos</option>
          <option v-for="a in aniosFeriados" :key="a" :value="a">
            {{ a }}
          </option>
        </select>
      </div>
      <div class="filtro-grupo">
        <label>Mes</label>
        <select v-model="filtros.feriados.mes">
          <option value="">Todos</option>
          <option v-for="m in meses" :key="m.value" :value="m.value">
            {{ m.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- FILTROS CONTROL VACACIONES -->
    <div v-if="tipoSeleccionado === 'control'" class="reporte-filtros">
      <div class="filtro-grupo">
        <label>Empleado</label>
        <select v-model="filtros.control.empleado_id">
          <option value="">Todos</option>
          <option v-for="emp in empleados" :key="emp.id" :value="emp.id">
            {{ emp.nombre }}
          </option>
        </select>
      </div>
      <div class="filtro-grupo">
        <label>Departamento</label>
        <select v-model="filtros.control.departamento">
          <option value="">Todos</option>
          <option v-for="dep in departamentos" :key="dep" :value="dep">
            {{ dep }}
          </option>
        </select>
      </div>
    </div>

    <!-- VISTA PREVIA -->
    <div
      v-if="tipoSeleccionado && datosReporte.length"
      class="preview-container"
    >
      <div class="preview-header">
        <span>Vista previa — {{ datosReporte.length }} registro(s)</span>
        <button class="btn-agregar" @click="generarPDF" :disabled="generando">
          {{ generando ? "Generando..." : "📄 Generar PDF" }}
        </button>
      </div>

      <table v-if="tipoSeleccionado === 'empleados'">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Puesto</th>
            <th>Departamento</th>
            <th>Antigüedad</th>
            <th>Disponibilidad</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in datosReporte" :key="emp.id">
            <td>{{ emp.nombre }}</td>
            <td>{{ emp.puesto }}</td>
            <td>{{ emp.departamento }}</td>
            <td>
              {{ emp.antiguedad }} {{ emp.antiguedad === 1 ? "año" : "años" }}
            </td>
            <td>
              {{
                emp.disponibilidad === "disponible"
                  ? "Disponible"
                  : "En vacaciones"
              }}
            </td>
            <td>{{ emp.estatus }}</td>
          </tr>
        </tbody>
      </table>

      <table v-if="tipoSeleccionado === 'vacaciones'">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Puesto</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
            <th>Días</th>
            <th>Comentario</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in datosReporte" :key="v.id">
            <td>{{ v.nombre }}</td>
            <td>{{ v.puesto }}</td>
            <td>{{ formatearFecha(v.fecha_inicio) }}</td>
            <td>{{ formatearFecha(v.fecha_fin) }}</td>
            <td>{{ v.dias_tomados }}</td>
            <td>{{ v.comentario }}</td>
          </tr>
        </tbody>
      </table>

      <table v-if="tipoSeleccionado === 'feriados'">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in datosReporte" :key="f.id">
            <td>{{ formatearFecha(f.fecha) }}</td>
            <td>{{ f.descripcion }}</td>
          </tr>
        </tbody>
      </table>

      <table v-if="tipoSeleccionado === 'control'">
        <thead>
          <tr>
            <th>Empleado</th>
            <th>Puesto</th>
            <th>Correspondientes</th>
            <th>Usados</th>
            <th>Restantes</th>
            <th>Acumulados</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in datosReporte" :key="c.control_id">
            <td>{{ c.nombre }}</td>
            <td>{{ c.puesto }}</td>
            <td>{{ c.dias_correspondientes }}</td>
            <td>{{ c.dias_usados }}</td>
            <td>{{ c.dias_restantes }}</td>
            <td>{{ c.dias_acumulados }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="tipoSeleccionado && !datosReporte.length"
      class="preview-container"
    >
      <p>No hay datos con los filtros seleccionados</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { API_URL } from "../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../assets/LogoC.png";

const toast = ref({ visible: false, mensaje: "", tipo: "success" });
const generando = ref(false);
const tipoSeleccionado = ref("");

const empleados = ref([]);
const departamentos = ref([]);
const aniosFeriados = ref([]);
const todosEmpleados = ref([]);
const todasVacaciones = ref([]);
const todosFeriados = ref([]);
const todoControl = ref([]);

const tipos = [
  { value: "empleados", label: "Empleados" },
  { value: "vacaciones", label: "Vacaciones" },
  { value: "feriados", label: "Días Feriados" },
  { value: "control", label: "Control de Vacaciones" },
];

const meses = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const filtros = ref({
  empleados: {
    estatus: "",
    disponibilidad: "",
    departamento: "",
    fecha_desde: "",
    fecha_hasta: "",
  },
  vacaciones: { empleado_id: "", fecha_desde: "", fecha_hasta: "" },
  feriados: { anio: "", mes: "" },
  control: { empleado_id: "", departamento: "" },
});

const datosReporte = computed(() => {
  if (tipoSeleccionado.value === "empleados") {
    return todosEmpleados.value.filter((emp) => {
      const f = filtros.value.empleados;
      return (
        (!f.estatus || emp.estatus === f.estatus) &&
        (!f.disponibilidad || emp.disponibilidad === f.disponibilidad) &&
        (!f.departamento || emp.departamento === f.departamento) &&
        (!f.fecha_desde || emp.fecha_ingreso >= f.fecha_desde) &&
        (!f.fecha_hasta || emp.fecha_ingreso <= f.fecha_hasta)
      );
    });
  }
  if (tipoSeleccionado.value === "vacaciones") {
    return todasVacaciones.value.filter((v) => {
      const f = filtros.value.vacaciones;
      return (
        (!f.empleado_id || v.empleado_id === f.empleado_id) &&
        (!f.fecha_desde || v.fecha_inicio >= f.fecha_desde) &&
        (!f.fecha_hasta || v.fecha_inicio <= f.fecha_hasta)
      );
    });
  }
  if (tipoSeleccionado.value === "feriados") {
    return todosFeriados.value.filter((fer) => {
      const f = filtros.value.feriados;
      return (
        (!f.anio || fer.fecha.split("-")[0] === f.anio) &&
        (!f.mes || fer.fecha.split("-")[1] === f.mes)
      );
    });
  }
  if (tipoSeleccionado.value === "control") {
    return todoControl.value.filter((c) => {
      const f = filtros.value.control;
      return (        
        (!f.empleado_id || c.nombre === empleados.value.find(e => e.id == f.empleado_id)?.nombre) &&
        (!f.departamento || empleados.value.find(e => e.nombre === c.nombre)?.departamento === f.departamento)
      );
    });
  }
  return [];
});

const cargarDatos = async () => {
  const [empRes, vacRes, ferRes, ctrlRes] = await Promise.all([
    axios.get(`${API_URL}/empleados`),
    axios.get(`${API_URL}/historial/historial`),
    axios.get(`${API_URL}/feriados`),
    axios.get(`${API_URL}/vacaciones/control`),
  ]);
  todosEmpleados.value = empRes.data;
  todasVacaciones.value = vacRes.data;
  todosFeriados.value = ferRes.data;
  todoControl.value = ctrlRes.data;
  departamentos.value = [...new Set(empRes.data.map((e) => e.departamento))];
  empleados.value = empRes.data;
  aniosFeriados.value = [
    ...new Set(ferRes.data.map((f) => f.fecha.split("-")[0])),
  ].sort();
};

const seleccionarTipo = (tipo) => {
  tipoSeleccionado.value = tipo;
};

const titulosPorTipo = {
  empleados: "EMPLEADOS",
  vacaciones: "VACACIONES",
  feriados: "DÍAS FERIADOS",
  control: "CONTROL DE VACACIONES",
};

// FIX: cargar logo con fetch para obtener base64 real
const cargarLogoBase64 = () => {
  return new Promise((resolve) => {
    fetch(logoUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => resolve(null)); // si falla, continúa sin logo
  });
};

const generarPDF = async () => {
  generando.value = true;

  try {
    const logoBase64 = await cargarLogoBase64();

    const doc = new jsPDF({ orientation: "landscape" });
    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaStr = ahora.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 10, 8, 50, 18); // ancho 28mm, altura 18mm para mantener proporción y buena resolución
    }

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(13, 27, 62);
    doc.text(titulosPorTipo[tipoSeleccionado.value], 148, 14, {
      align: "center",
    });

    // Fecha y hora
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 106, 128);
    doc.text(`Generado el ${fechaStr} a las ${horaStr}`, 148, 21, {
      align: "center",
    });

    // Línea naranja decorativa
    doc.setDrawColor(232, 130, 26);
    doc.setLineWidth(0.8);
    doc.line(10, 28, 287, 28);

    let columns = [];
    let rows = [];

    if (tipoSeleccionado.value === "empleados") {
      columns = [
        "Nombre",
        "Puesto",
        "Departamento",
        "Antigüedad",
        "Disponibilidad",
        "Estatus",
      ];
      rows = datosReporte.value.map((e) => [
        e.nombre,
        e.puesto,
        e.departamento,
        `${e.antiguedad} ${e.antiguedad === 1 ? "año" : "años"}`,
        e.disponibilidad === "disponible" ? "Disponible" : "En vacaciones",
        e.estatus,
      ]);
    }
    if (tipoSeleccionado.value === "vacaciones") {
      columns = [
        "Empleado",
        "Puesto",
        "Fecha inicio",
        "Fecha fin",
        "Días",
        "Comentario",
      ];
      rows = datosReporte.value.map((v) => [
        v.nombre,
        v.puesto,
        formatearFecha(v.fecha_inicio),
        formatearFecha(v.fecha_fin),
        v.dias_tomados,
        v.comentario || "",
      ]);
    }
    if (tipoSeleccionado.value === "feriados") {
      columns = ["Fecha", "Descripción"];
      rows = datosReporte.value.map((f) => [
        formatearFecha(f.fecha),
        f.descripcion,
      ]);
    }
    if (tipoSeleccionado.value === "control") {
      columns = [
        "Empleado",
        "Puesto",
        "Correspondientes",
        "Usados",
        "Restantes",
        "Acumulados",
      ];
      rows = datosReporte.value.map((c) => [
        c.nombre,
        c.puesto,
        c.dias_correspondientes,
        c.dias_usados,
        c.dias_restantes,
        c.dias_acumulados,
      ]);
    }

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 33,
      styles: { fontSize: 9, cellPadding: 4, font: "helvetica" },
      headStyles: {
        fillColor: [13, 27, 62],
        textColor: 255,
        fontStyle: "bold",
        lineWidth: 0,
      },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      tableLineColor: [221, 227, 237],
      tableLineWidth: 0.1,
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, 148, 205, { align: "center" });
      doc.text("Sistema RH — ETU", 287, 205, { align: "right" });
    }

    const nombreArchivo = `reporte_${tipoSeleccionado.value}_${ahora.toISOString().split("T")[0]}.pdf`;
    doc.save(nombreArchivo);
    mostrarToast(`✓ PDF generado: ${nombreArchivo}`, "success");
  } catch (err) {
    console.error(err);
    mostrarToast("Error al generar el PDF", "error");
  } finally {
    generando.value = false;
  }
};

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value = { visible: true, mensaje, tipo };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3500);
};

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

onMounted(() => {
  cargarDatos();
});
</script>

<style src="../css/empleados.css"></style>
<style scoped>
.reporte-seccion {
  margin-bottom: 24px;
}

.reporte-label {
  display: block;
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #5a6a80;
  margin-bottom: 10px;
}

.reporte-tipos {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #dde3ed;
  margin-bottom: 24px;
}

.reporte-filtros {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  background: #f5f8ff;
  border: 1px solid #dde3ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.filtro-grupo label {
  font-family: "Barlow Condensed", sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #5a6a80;
}

.filtro-grupo input,
.filtro-grupo select {
  padding: 8px 10px;
  border: 1px solid #dde3ed;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: #1a2a4a;
}

.filtro-grupo input:focus,
.filtro-grupo select:focus {
  outline: none;
  border-color: #e8821a;
}

.preview-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(13, 27, 62, 0.1);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #f5f8ff;
  border-bottom: 1px solid #dde3ed;
  font-family: "Barlow Condensed", sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #5a6a80;
  text-transform: uppercase;
}
</style>
