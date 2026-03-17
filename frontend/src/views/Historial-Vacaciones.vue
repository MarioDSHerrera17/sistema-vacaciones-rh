<template>
  <div class="vacaciones">
    <div v-if="toast.visible" :class="['toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>

    <div class="header">
      <h1>Historial de Vacaciones</h1>      
    </div>

    <!-- FILTROS -->
    <div class="filtros">
      <input v-model="filtros.nombre" placeholder="Buscar empleado" />
      <input v-model="filtros.puesto" placeholder="Buscar puesto" />
      <input type="date" v-model="filtros.fecha_inicio" />
      <input type="date" v-model="filtros.fecha_fin" />
      <button class="btn-reset" @click="limpiarFiltros">Borrar filtros</button>
      <button class="btn-agregar" @click="abrirModal">
        + Registrar vacaciones
      </button>
    </div>

    <div class="tabla-container">
      <table v-if="historialFiltrado.length">
        <thead>
          <tr>
            <th>ID</th>
            <th>Empleado</th>
            <th>Puesto</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Días</th>
            <th>Comentario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in historialFiltrado" :key="v.id">
            <td>{{ v.id }}</td>
            <td>{{ v.nombre }}</td>
            <td>{{ v.puesto }}</td>
            <td>{{ formatearFecha(v.fecha_inicio) }}</td>
            <td>{{ formatearFecha(v.fecha_fin) }}</td>
            <td class="dias">{{ v.dias_tomados }}</td>
            <td>{{ v.comentario }}</td>
            <td class="acciones">
              <button class="btn-editar" @click="editarVacacion(v)">✏️</button>
              <button class="btn-eliminar" @click="eliminarVacacion(v.id)">
                🗑
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No hay vacaciones registradas</p>
    </div>

    <!-- MODAL -->
    <div v-if="modalVisible" class="modal">
      <div class="modal-content">
        <h2>{{ editando ? "Editar Vacaciones" : "Registrar Vacaciones" }}</h2>

        <select v-model="nueva.empleado_id" :disabled="editando">
          <option value="">Seleccionar empleado</option>
          <option v-for="emp in empleados" :key="emp.id" :value="emp.id">
            {{ emp.nombre }} - {{ emp.puesto }}
          </option>
        </select>

        <label>Fecha inicio</label>
        <input
          type="date"
          v-model="nueva.fecha_inicio"
          :disabled="esVacacionPasada"
        />

        <label>Fecha fin</label>
        <input
          type="date"
          v-model="nueva.fecha_fin"
          :disabled="esVacacionPasada"
        />

        <textarea
          v-model="nueva.comentario"
          placeholder="Comentario"
        ></textarea>

        <div class="modal-buttons">
          <button @click="registrarVacaciones">
            {{ editando ? "Guardar" : "Registrar" }}
          </button>
          <button @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="dialogVisible"
      titulo="Eliminar vacaciones"
      mensaje="¿Seguro que deseas eliminar este registro?"
      @confirmar="confirmarEliminar"
      @cancelar="cancelarEliminar"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { API_URL } from "../services/api";

const dialogVisible = ref(false);
const vacacionEliminar = ref(null);
const historialVacaciones = ref([]);
const empleados = ref([]);
const modalVisible = ref(false);
const editando = ref(false);
const vacacionEditando = ref(null);

const filtros = ref({
  nombre: "",
  puesto: "",
  fecha_inicio: "",
  fecha_fin: "",
});
const toast = ref({ visible: false, mensaje: "", tipo: "success" });
const nueva = ref({
  empleado_id: "",
  fecha_inicio: "",
  fecha_fin: "",
  comentario: "",
});

const historialFiltrado = computed(() => {
  return historialVacaciones.value.filter((v) => {
    return (
      v.nombre.toLowerCase().includes(filtros.value.nombre.toLowerCase()) &&
      v.puesto.toLowerCase().includes(filtros.value.puesto.toLowerCase()) &&
      (!filtros.value.fecha_inicio ||
        v.fecha_inicio >= filtros.value.fecha_inicio) &&
      (!filtros.value.fecha_fin || v.fecha_fin <= filtros.value.fecha_fin)
    );
  });
});

const limpiarFiltros = () => {
  filtros.value = { nombre: "", puesto: "", fecha_inicio: "", fecha_fin: "" };
};

const esVacacionPasada = computed(() => {
  if (!editando.value) return false;
  const hoy = new Date().toISOString().split("T")[0];
  return nueva.value.fecha_fin < hoy;
});

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value = { visible: true, mensaje, tipo };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

const cargarHistorial = async () => {
  const res = await axios.get(`${API_URL}/historial/historial`);
  historialVacaciones.value = res.data;
};

const cargarEmpleados = async () => {
  const res = await axios.get(`${API_URL}/empleados`);
  empleados.value = res.data.filter((e) => e.estatus === "activo");
};

const registrarVacaciones = async () => {
  if (
    !nueva.value.empleado_id ||
    !nueva.value.fecha_inicio ||
    !nueva.value.fecha_fin
  ) {
    mostrarToast("Todos los campos son obligatorios", "error");
    return;
  }

  try {
    if (editando.value) {
      await axios.put(
        `${API_URL}/historial/${vacacionEditando.value}`,
        nueva.value,
      );
      mostrarToast("Vacaciones actualizadas");
    } else {
      const res = await axios.post(`${API_URL}/historial`, nueva.value);
      mostrarToast(res.data.mensaje);
    }
    cerrarModal();
    cargarHistorial();
  } catch (error) {
    mostrarToast(error.response?.data?.mensaje || "Error", "error");
  }
};

const eliminarVacacion = (id) => {
  vacacionEliminar.value = id;
  dialogVisible.value = true;
};

const confirmarEliminar = async () => {
  try {
    await axios.delete(`${API_URL}/historial/${vacacionEliminar.value}`);
    mostrarToast("Vacaciones eliminadas");
    cargarHistorial();
  } catch (error) {
    mostrarToast(
      error.response?.data?.mensaje ||
        "No se pueden eliminar vacaciones pasadas",
      "error",
    );
  }
  dialogVisible.value = false;
  vacacionEliminar.value = null;
};

const cancelarEliminar = () => {
  dialogVisible.value = false;
  vacacionEliminar.value = null;
};

const editarVacacion = (v) => {
  editando.value = true;
  vacacionEditando.value = v.id;
  nueva.value = {
    empleado_id: v.empleado_id,
    fecha_inicio: v.fecha_inicio,
    fecha_fin: v.fecha_fin,
    comentario: v.comentario,
  };
  modalVisible.value = true;
};

const abrirModal = () => {
  modalVisible.value = true;
};

const cerrarModal = () => {
  modalVisible.value = false;
  editando.value = false;
  vacacionEditando.value = null;
  nueva.value = {
    empleado_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    comentario: "",
  };
};

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

onMounted(() => {
  cargarHistorial();
  cargarEmpleados();
});
</script>

<style scoped src="../css/vacaciones-historial.css"></style>
<style scoped src="../css/global.css"></style>