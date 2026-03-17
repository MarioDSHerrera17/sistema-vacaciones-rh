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
          <option v-for="dep in departamentos" :key="dep">
            {{ dep }}
          </option>
        </select>

        <select v-model="filtroMes">
          <option value="">Mes</option>
          <option v-for="m in 12" :key="m" :value="m">
            {{ m }}
          </option>
        </select>

        <select v-model="filtroAnio">
          <option value="">Año</option>
          <option v-for="a in anios" :key="a">
            {{ a }}
          </option>
        </select>

        <button class="btn-agregar" @click="abrirModal">
          + Agregar empleado
        </button>
        <button class="btn-limpiar" @click="limpiarFiltros">
          Limpiar filtros
        </button>
      </div>
    </div>

    <table v-if="empleadosFiltrados.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Fecha Ingreso</th>
          <th>Puesto</th>
          <th>Departamento</th>
          <th>Correo</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="emp in empleadosFiltrados" :key="emp.id">
          <td>{{ emp.id }}</td>
          <td>{{ emp.nombre }}</td>
          <td>{{ formatearFecha(emp.fecha_ingreso) }}</td>
          <td>{{ emp.puesto }}</td>
          <td>{{ emp.departamento }}</td>
          <td>{{ emp.correo }}</td>

          <td>
            <span :class="emp.estatus">
              {{ emp.estatus }}
            </span>
          </td>

          <td class="acciones-tabla">
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

    <p v-else>No hay empleados</p>

    <!-- MODAL CREAR EMPLEADO -->

    <div v-if="modalVisible" class="modal">
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

        <input type="email" v-model="nuevo.correo" placeholder="Correo" />

        <div class="modal-buttons">
          <button @click="crearEmpleado">Crear</button>

          <button @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR EMPLEADO -->

    <div v-if="modalEditar" class="modal">
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

        <input v-model="empleadoEdit.correo" placeholder="Correo" />

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
const departamentos = ref([]);
const anios = ref([]);
const modalVisible = ref(false);
const modalEditar = ref(false);

const toast = ref({
  visible: false,
  mensaje: "",
  tipo: "success",
});

const nuevo = ref({
  nombre: "",
  fecha_ingreso: "",
  puesto: "",
  departamento: "",
  correo: "",
});

const empleadoEdit = ref({
  id: null,
  nombre: "",
  fecha_ingreso: "",
  puesto: "",
  departamento: "",
  correo: "",
});

// ==========================
// CARGAR EMPLEADOS
// ==========================

const cargarEmpleados = async () => {
  const res = await axios.get("http://localhost:3000/api/empleados");

  empleados.value = res.data;

  departamentos.value = [...new Set(res.data.map((e) => e.departamento))];

  anios.value = [
    ...new Set(res.data.map((e) => e.fecha_ingreso.split("-")[0])),
  ];
};

// ==========================
// FILTROS
// ==========================

const empleadosFiltrados = computed(() => {
  return empleados.value.filter((emp) => {
    const partes = emp.fecha_ingreso.split("-");

    const anio = parseInt(partes[0]);
    const mes = parseInt(partes[1]);

    const coincideBusqueda = emp.nombre
      .toLowerCase()
      .includes(search.value.toLowerCase());

    const coincideDepartamento =
      !filtroDepartamento.value ||
      emp.departamento === filtroDepartamento.value;

    const coincideMes = !filtroMes.value || mes == filtroMes.value;

    const coincideAnio = !filtroAnio.value || anio == filtroAnio.value;

    return (
      coincideBusqueda && coincideDepartamento && coincideMes && coincideAnio
    );
  });
});

// ==========================
// TOAST
// ==========================

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value.mensaje = mensaje;
  toast.value.tipo = tipo;
  toast.value.visible = true;

  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

// ==========================
// CREAR EMPLEADO
// ==========================

const crearEmpleado = async () => {
  if (
    !nuevo.value.nombre ||
    !nuevo.value.fecha_ingreso ||
    !nuevo.value.puesto ||
    !nuevo.value.departamento ||
    !nuevo.value.correo
  ) {
    mostrarToast("Todos los campos son obligatorios", "error");
    return;
  }

  const hoy = new Date();
  const fechaIngreso = new Date(nuevo.value.fecha_ingreso);

  if (fechaIngreso > hoy) {
    mostrarToast("La fecha de ingreso no puede ser futura", "error");
    return;
  }

  try {
    await axios.post("http://localhost:3000/api/empleados", nuevo.value);

    mostrarToast("Empleado creado correctamente");

    cerrarModal();
    cargarEmpleados();
  } catch (error) {
    const mensaje =
      error.response?.data?.mensaje || "Error al crear el empleado";

    mostrarToast(mensaje, "error");
  }
};

// ==========================
// MODAL CREAR
// ==========================

const abrirModal = () => {
  modalVisible.value = true;
};

const cerrarModal = () => {
  modalVisible.value = false;

  nuevo.value = {
    nombre: "",
    fecha_ingreso: "",
    puesto: "",
    departamento: "",
    correo: "",
  };
};

// ==========================
// MODAL EDITAR
// ==========================

const editarEmpleado = (emp) => {
  empleadoEdit.value = { ...emp };
  modalEditar.value = true;
};

// FIX: limpiar formulario al cerrar
const cerrarModalEditar = () => {
  modalEditar.value = false;
  empleadoEdit.value = {
    id: null,
    nombre: "",
    fecha_ingreso: "",
    puesto: "",
    departamento: "",
    correo: "",
  };
};

// ==========================
// ACTUALIZAR EMPLEADO
// ==========================

const actualizarEmpleado = async () => {
  const e = empleadoEdit.value;

  if (
    !e.nombre ||
    !e.fecha_ingreso ||
    !e.puesto ||
    !e.departamento ||
    !e.correo
  ) {
    mostrarToast("Todos los campos son obligatorios", "error");
    return;
  }

  abrirConfirmacion(
    "Actualizar empleado",
    "¿Deseas guardar los cambios de este empleado?",
    async () => {
      try {
        await axios.put(`http://localhost:3000/api/empleados/${e.id}`, {
          nombre: e.nombre,
          fecha_ingreso: e.fecha_ingreso,
          puesto: e.puesto,
          departamento: e.departamento,
          correo: e.correo,
        });

        mostrarToast("Empleado actualizado correctamente");

        cerrarModalEditar();
        cargarEmpleados();
      } catch {
        mostrarToast("Error al actualizar", "error");
      }
    }
  );
};

// ==========================
// ACTIVAR / DESACTIVAR
// ==========================

const desactivarEmpleado = (id) => {
  abrirConfirmacion(
    "Desactivar empleado",
    "¿Seguro que deseas desactivar este empleado?",
    async () => {
      try {
        await axios.put(`http://localhost:3000/api/empleados/desactivar/${id}`);

        mostrarToast("Empleado desactivado");
        cargarEmpleados();
      } catch {
        mostrarToast("Error al desactivar", "error");
      }
    }
  );
};

const activarEmpleado = (id) => {
  abrirConfirmacion(
    "Activar empleado",
    "¿Deseas activar nuevamente este empleado?",
    async () => {
      try {
        await axios.put(`http://localhost:3000/api/empleados/activar/${id}`);

        mostrarToast("Empleado activado");
        cargarEmpleados();
      } catch {
        mostrarToast("Error al activar", "error");
      }
    }
  );
};

// ==========================
// UTILIDADES
// ==========================

const limpiarFiltros = () => {
  search.value = "";
  filtroDepartamento.value = "";
  filtroMes.value = "";
  filtroAnio.value = "";
};

// FIX: formatear correctamente a DD/MM/YYYY
const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const solo = fecha.split("T")[0];
  const [anio, mes, dia] = solo.split("-");
  return `${dia}/${mes}/${anio}`;
};

// ==========================
// INIT
// ==========================

onMounted(() => {
  cargarEmpleados();
});
</script>

<style scoped src="../css/empleados.css"></style>