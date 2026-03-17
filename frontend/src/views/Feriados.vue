<template>
  <div class="empleados">
    <div v-if="toast.visible" :class="['toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>

    <div class="header">
      <h1>Gestión de Feriados</h1>

      <div class="acciones">
        <input
          v-model="search"
          placeholder="Buscar feriado..."
          class="search"
        />

        <select v-model="filtroAnio">
          <option value="">Todos los años</option>
          <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
        </select>

        <button class="btn-agregar" @click="abrirModal">
          + Agregar feriado
        </button>
        <button class="btn-limpiar" @click="limpiarFiltros">
          Limpiar filtros
        </button>
      </div>
    </div>

    <table v-if="feriadosFiltrados.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Descripción</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in feriadosFiltrados" :key="f.id">
          <td>{{ f.id }}</td>
          <td>{{ formatearFecha(f.fecha) }}</td>
          <td>{{ f.descripcion }}</td>
          <td class="acciones-tabla">
            <button class="btn-desactivar" @click="pedirEliminar(f.id)">
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>No hay feriados registrados</p>

    <!-- MODAL AGREGAR FERIADO -->
    <div v-if="modalVisible" class="modal">
      <div class="modal-content">
        <h2>Nuevo Feriado</h2>

        <label>Fecha</label>
        <input type="date" v-model="nuevo.fecha" max="9999-12-31" />

        <label>Descripción</label>
        <input v-model="nuevo.descripcion" placeholder="Ej: Día del Trabajo" />

        <div class="modal-buttons">
          <button @click="agregarFeriado">Agregar</button>
          <button @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="confirmVisible"
      titulo="Eliminar feriado"
      mensaje="¿Seguro que deseas eliminar este feriado?"
      @confirmar="confirmarEliminar"
      @cancelar="cancelarEliminar"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { API_URL } from "../services/api";

const feriados = ref([]);
const search = ref("");
const filtroAnio = ref("");
const anios = ref([]);
const modalVisible = ref(false);
const confirmVisible = ref(false);
const feriadoEliminar = ref(null);

const toast = ref({ visible: false, mensaje: "", tipo: "success" });
const nuevo = ref({ fecha: "", descripcion: "" });

const cargarFeriados = async () => {
  const res = await axios.get(`${API_URL}/feriados`);
  feriados.value = res.data;
  anios.value = [...new Set(res.data.map((f) => f.fecha.split("-")[0]))].sort();
};

const feriadosFiltrados = computed(() => {
  return feriados.value.filter((f) => {
    return (
      f.descripcion.toLowerCase().includes(search.value.toLowerCase()) &&
      (!filtroAnio.value || f.fecha.split("-")[0] === filtroAnio.value)
    );
  });
});

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value = { visible: true, mensaje, tipo };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

const agregarFeriado = async () => {
  if (!nuevo.value.fecha || !nuevo.value.descripcion) {
    mostrarToast("La fecha y descripción son obligatorias", "error");
    return;
  }
  try {
    await axios.post(`${API_URL}/feriados`, nuevo.value);
    mostrarToast("Feriado agregado correctamente");
    cerrarModal();
    cargarFeriados();
  } catch (error) {
    mostrarToast(
      error.response?.data?.mensaje || "Error al agregar el feriado",
      "error",
    );
  }
};

const pedirEliminar = (id) => {
  feriadoEliminar.value = id;
  confirmVisible.value = true;
};

const confirmarEliminar = async () => {
  try {
    await axios.delete(`${API_URL}/feriados/${feriadoEliminar.value}`);
    mostrarToast("Feriado eliminado correctamente");
    cargarFeriados();
  } catch (error) {
    mostrarToast(
      error.response?.data?.mensaje || "Error al eliminar el feriado",
      "error",
    );
  }
  confirmVisible.value = false;
  feriadoEliminar.value = null;
};

const cancelarEliminar = () => {
  confirmVisible.value = false;
  feriadoEliminar.value = null;
};

const abrirModal = () => {
  modalVisible.value = true;
};

const cerrarModal = () => {
  modalVisible.value = false;
  nuevo.value = { fecha: "", descripcion: "" };
};

const limpiarFiltros = () => {
  search.value = "";
  filtroAnio.value = "";
};

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

onMounted(() => {
  cargarFeriados();
});
</script>

<style scoped src="../css/empleados.css"></style>
<style scoped src="../css/global.css"></style>