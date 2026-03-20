<template>
  <div class="empleados">
    <div v-if="toast.visible" :class="['toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>

    <div class="header">
      <h1>Gestión de Empleados</h1>

      <div class="acciones">
        <input
          v-model="search"
          placeholder="Buscar empleado..."
          class="search"
        />

        <select v-model="filtroDepartamento">
          <option value="">Todos los departamentos</option>
          <option v-for="dep in departamentos" :key="dep">{{ dep }}</option>
        </select>

        <select v-model="filtroMes">
          <option value="">Mes</option>
          <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
        </select>

        <select v-model="filtroAnio">
          <option value="">Año</option>
          <option v-for="a in anios" :key="a">{{ a }}</option>
        </select>

        <button v-if="esAdmin" class="btn-agregar" @click="abrirModal">
          + Agregar empleado
        </button>
        <button class="btn-limpiar" @click="limpiarFiltros">
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs">
      <button
        :class="['tab', tabActivo === 'todos' ? 'tab-activo' : '']"
        @click="tabActivo = 'todos'"
      >
        Todos ({{ empleadosFiltrados.length }})
      </button>
      <button
        :class="['tab', tabActivo === 'disponible' ? 'tab-activo' : '']"
        @click="tabActivo = 'disponible'"
      >
        Disponibles ({{ disponibles.length }})
      </button>
      <button
        :class="['tab', tabActivo === 'vacaciones' ? 'tab-activo' : '']"
        @click="tabActivo = 'vacaciones'"
      >
        En vacaciones ({{ enVacaciones.length }})
      </button>
      <button
        :class="['tab', tabActivo === 'inactivos' ? 'tab-activo' : '']"
        @click="tabActivo = 'inactivos'"
      >
        Inactivos ({{ inactivos.length }})
      </button>
    </div>

    <!-- TABLA -->
    <table v-if="empleadosTab.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Fecha Ingreso</th>
          <th>Antigüedad</th>
          <th>Puesto</th>
          <th>Departamento</th>
          <th v-if="tabActivo !== 'inactivos'">Disponibilidad</th>
          <th>Estatus</th>
          <th v-if="esAdmin">Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="emp in empleadosTab" :key="emp.id">
          <td>{{ emp.id }}</td>
          <td>{{ emp.nombre }}</td>
          <td>{{ formatearFecha(emp.fecha_ingreso) }}</td>
          <td>
            {{ emp.antiguedad }} {{ emp.antiguedad === 1 ? "año" : "años" }}
          </td>
          <td>{{ emp.puesto }}</td>
          <td>{{ emp.departamento }}</td>

          <td v-if="tabActivo !== 'inactivos'" class="td-disponibilidad">
            <span :class="['badge', emp.disponibilidad]">
              {{
                emp.disponibilidad === "disponible"
                  ? "Disponible"
                  : "En vacaciones"
              }}
            </span>
          </td>

          <td>
            <span :class="emp.estatus">{{ emp.estatus }}</span>
          </td>

          <td v-if="esAdmin" class="acciones-tabla">
            <button class="btn-editar" @click="editarEmpleado(emp)">
              Editar
            </button>
            <button
              v-if="emp.estatus === 'activo'"
              class="btn-desactivar"
              @click="desactivarEmpleado(emp.id)"
            >
              Desactivar
            </button>
            <button v-else class="btn-activar" @click="activarEmpleado(emp.id)">
              Activar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>No hay empleados en esta categoría</p>

    <!-- MODAL CREAR -->
    <div v-if="modalVisible && esAdmin" class="modal">
      <div class="modal-content">
        <h2>Nuevo Empleado</h2>
        <input v-model="nuevo.nombre" placeholder="Nombre" />
        <input type="date" v-model="nuevo.fecha_ingreso" max="9999-12-31" />
        <input v-model="nuevo.puesto" placeholder="Puesto" />
        <input
          v-model="nuevo.departamento"
          placeholder="Departamento"
          @input="nuevo.departamento = nuevo.departamento.toUpperCase()"
        />
        <div class="modal-buttons">
          <button @click="crearEmpleado">Crear</button>
          <button @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR -->
    <div v-if="modalEditar && esAdmin" class="modal">
      <div class="modal-content">
        <h2>Editar empleado</h2>
        <input v-model="empleadoEdit.nombre" placeholder="Nombre" />
        <input
          type="date"
          v-model="empleadoEdit.fecha_ingreso"
          max="9999-12-31"
        />
        <input v-model="empleadoEdit.puesto" placeholder="Puesto" />
        <input
          v-model="empleadoEdit.departamento"
          placeholder="Departamento"
          @input="
            empleadoEdit.departamento = empleadoEdit.departamento.toUpperCase()
          "
        />
        <div class="modal-buttons">
          <button @click="actualizarEmpleado">Guardar</button>
          <button @click="cerrarModalEditar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :visible="confirmVisible"
    :titulo="confirmTitulo"
    :mensaje="confirmMensaje"
    @confirmar="confirmarAccion"
    @cancelar="cancelarAccion"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { API_URL } from "../services/api";
import { esAdmin } from "../stores/auth";

const confirmVisible = ref(false);
const confirmTitulo = ref("");
const confirmMensaje = ref("");
let accionConfirmada = null;

const abrirConfirmacion = (titulo, mensaje, accion) => {
  confirmTitulo.value = titulo;
  confirmMensaje.value = mensaje;
  accionConfirmada = accion;
  confirmVisible.value = true;
};

const confirmarAccion = () => {
  if (accionConfirmada) accionConfirmada();
  confirmVisible.value = false;
};
const cancelarAccion = () => {
  confirmVisible.value = false;
};

const empleados = ref([]);
const search = ref("");
const filtroDepartamento = ref("");
const filtroMes = ref("");
const filtroAnio = ref("");
const tabActivo = ref("todos");
const departamentos = ref([]);
const anios = ref([]);
const modalVisible = ref(false);
const modalEditar = ref(false);
const toast = ref({ visible: false, mensaje: "", tipo: "success" });

const nuevo = ref({
  nombre: "",
  fecha_ingreso: "",
  puesto: "",
  departamento: "",
});
const empleadoEdit = ref({
  id: null,
  nombre: "",
  fecha_ingreso: "",
  puesto: "",
  departamento: "",
});

const cargarEmpleados = async () => {
  const res = await axios.get(`${API_URL}/empleados`);
  empleados.value = res.data;
  departamentos.value = [...new Set(res.data.map((e) => e.departamento))];
  anios.value = [
    ...new Set(res.data.map((e) => e.fecha_ingreso.split("-")[0])),
  ];
};

const empleadosFiltrados = computed(() => {
  return empleados.value.filter((emp) => {
    const partes = emp.fecha_ingreso.split("-");
    return (
      emp.nombre.toLowerCase().includes(search.value.toLowerCase()) &&
      (!filtroDepartamento.value ||
        emp.departamento === filtroDepartamento.value) &&
      (!filtroMes.value || parseInt(partes[1]) == filtroMes.value) &&
      (!filtroAnio.value || parseInt(partes[0]) == filtroAnio.value)
    );
  });
});

// Solo activos para disponibles y en vacaciones
const disponibles = computed(() =>
  empleadosFiltrados.value.filter(
    (e) => e.estatus === "activo" && e.disponibilidad === "disponible",
  ),
);
const enVacaciones = computed(() =>
  empleadosFiltrados.value.filter(
    (e) => e.estatus === "activo" && e.disponibilidad === "vacaciones",
  ),
);
const inactivos = computed(() =>
  empleadosFiltrados.value.filter((e) => e.estatus === "inactivo"),
);

const empleadosTab = computed(() => {
  if (tabActivo.value === "disponible") return disponibles.value;
  if (tabActivo.value === "vacaciones") return enVacaciones.value;
  if (tabActivo.value === "inactivos") return inactivos.value;
  return empleadosFiltrados.value;
});

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value = { visible: true, mensaje, tipo };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

const crearEmpleado = async () => {
  if (
    !nuevo.value.nombre ||
    !nuevo.value.fecha_ingreso ||
    !nuevo.value.puesto ||
    !nuevo.value.departamento
  ) {
    mostrarToast("Todos los campos son obligatorios", "error");
    return;
  }
  if (new Date(nuevo.value.fecha_ingreso) > new Date()) {
    mostrarToast("La fecha de ingreso no puede ser futura", "error");
    return;
  }
  try {
    await axios.post(`${API_URL}/empleados`, nuevo.value);
    mostrarToast("Empleado creado correctamente");
    cerrarModal();
    cargarEmpleados();
  } catch (error) {
    mostrarToast(
      error.response?.data?.mensaje || "Error al crear el empleado",
      "error",
    );
  }
};

const abrirModal = () => {
  modalVisible.value = true;
};
const cerrarModal = () => {
  modalVisible.value = false;
  nuevo.value = { nombre: "", fecha_ingreso: "", puesto: "", departamento: "" };
};

const editarEmpleado = (emp) => {
  empleadoEdit.value = { ...emp };
  modalEditar.value = true;
};
const cerrarModalEditar = () => {
  modalEditar.value = false;
  empleadoEdit.value = {
    id: null,
    nombre: "",
    fecha_ingreso: "",
    puesto: "",
    departamento: "",
  };
};

const actualizarEmpleado = async () => {
  const e = empleadoEdit.value;
  if (!e.nombre || !e.fecha_ingreso || !e.puesto || !e.departamento) {
    mostrarToast("Todos los campos son obligatorios", "error");
    return;
  }
  abrirConfirmacion(
    "Actualizar empleado",
    "¿Deseas guardar los cambios?",
    async () => {
      try {
        await axios.put(`${API_URL}/empleados/${e.id}`, {
          nombre: e.nombre,
          fecha_ingreso: e.fecha_ingreso,
          puesto: e.puesto,
          departamento: e.departamento,
        });
        mostrarToast("Empleado actualizado correctamente");
        cerrarModalEditar();
        cargarEmpleados();
      } catch {
        mostrarToast("Error al actualizar", "error");
      }
    },
  );
};

const desactivarEmpleado = (id) => {
  abrirConfirmacion(
    "Desactivar empleado",
    "¿Seguro que deseas desactivar este empleado?",
    async () => {
      try {
        await axios.put(`${API_URL}/empleados/desactivar/${id}`);
        mostrarToast("Empleado desactivado");
        cargarEmpleados();
      } catch {
        mostrarToast("Error al desactivar", "error");
      }
    },
  );
};

const activarEmpleado = (id) => {
  abrirConfirmacion(
    "Activar empleado",
    "¿Deseas activar nuevamente este empleado?",
    async () => {
      try {
        await axios.put(`${API_URL}/empleados/activar/${id}`);
        mostrarToast("Empleado activado");
        cargarEmpleados();
      } catch {
        mostrarToast("Error al activar", "error");
      }
    },
  );
};

const limpiarFiltros = () => {
  search.value = "";
  filtroDepartamento.value = "";
  filtroMes.value = "";
  filtroAnio.value = "";
};

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const solo = fecha.split("T")[0];
  const [anio, mes, dia] = solo.split("-");
  return `${dia}/${mes}/${anio}`;
};

onMounted(() => {
  cargarEmpleados();
});
</script>

<style src="../css/empleados.css"></style>
