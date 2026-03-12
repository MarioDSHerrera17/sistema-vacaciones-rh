<template>
  <div class="vacaciones">
    <div v-if="toast.visible" :class="['toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>

    <div class="header">
      <h1>Control de Vacaciones</h1>
    </div>

    <!-- FILTROS -->
    <div class="filtros">
      <input v-model="filtros.nombre" placeholder="Buscar empleado" />

      <input v-model="filtros.puesto" placeholder="Puesto" />

      <select v-model="filtros.dias">
        <option value="">Días correspondientes</option>
        <option value="12">12</option>
        <option value="14">14</option>
        <option value="16">16</option>
        <option value="18">18</option>
        <option value="20">20</option>
        <option value="22">22</option>
        <option value="24">24</option>
        <option value="26">26</option>
        <option value="28">28</option>
        <option value="30">30</option>
      </select>

      <button class="btn-reset" @click="limpiarFiltros">Borrar filtros</button>
    </div>

    <div class="tabla-container">
      <table v-if="controlFiltrado.length">
        <thead>
          <tr>
            <th></th>
            <th>Empleado</th>
            <th>Puesto</th>
            <th>Días correspondientes</th>
            <th>Días usados</th>
            <th>Días restantes</th>
            <th>Días acumulados</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <template v-for="c in controlFiltrado" :key="c.id">
            <tr>
              <td class="expand">
                <button class="btn-expand" @click="toggleHistorial(c.id)">
                  {{ expandido === c.id ? "▾" : "▸" }}
                </button>
              </td>

              <td>{{ c.nombre }}</td>
              <td>{{ c.puesto }}</td>
              <td>{{ c.dias_correspondientes }}</td>
              <td>{{ c.dias_usados }}</td>

              <td class="restantes">
                {{ c.dias_restantes }}
              </td>

              <td>
                {{ c.dias_acumulados }}
              </td>

              <td>
                <button class="btn-editar" @click="editarAcumulados(c)">
                  ✏️
                </button>
              </td>
            </tr>

            <!-- HISTORIAL -->
            <tr v-if="expandido === c.id">
              <td colspan="8" class="historial-container">
                <table class="tabla-historial">
                  <thead>
                    <tr>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Días</th>
                      <th>Comentario</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="v in historial[c.id]" :key="v.id">
                      <td>{{ formatearFecha(v.fecha_inicio) }}</td>
                      <td>{{ formatearFecha(v.fecha_fin) }}</td>
                      <td>{{ v.dias_tomados }}</td>
                      <td>{{ v.comentario }}</td>
                    </tr>

                    <tr v-if="!historial[c.id] || !historial[c.id].length">
                      <td colspan="4">No tiene vacaciones registradas</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <p v-else>No hay resultados</p>
    </div>
    <!-- MODAL EDITAR ACUMULADOS -->
    <div v-if="modal.visible" class="modal-overlay">
      <div class="modal">
        <h3>Editar días acumulados</h3>

        <p class="empleado">
          {{ modal.nombre }}
        </p>

        <input type="number" v-model="modal.dias" min="0" />

        <div class="acciones">
          <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>

          <button class="btn-guardar" @click="guardarAcumulados">
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const controlVacaciones = ref([]);
const historial = ref({});
const expandido = ref(null);

/* FILTROS */

const filtros = ref({
  nombre: "",
  puesto: "",
  dias: "",
});

const controlFiltrado = computed(() => {
  return controlVacaciones.value.filter((c) => {
    const nombre = c.nombre
      .toLowerCase()
      .includes(filtros.value.nombre.toLowerCase());

    const puesto = c.puesto
      .toLowerCase()
      .includes(filtros.value.puesto.toLowerCase());

    const dias =
      !filtros.value.dias || c.dias_correspondientes == filtros.value.dias;

    return nombre && puesto && dias;
  });
});

const limpiarFiltros = () => {
  filtros.value = {
    nombre: "",
    puesto: "",
    dias: "",
  };
};

/* TOAST */

const toast = ref({
  visible: false,
  mensaje: "",
  tipo: "success",
});

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value.mensaje = mensaje;
  toast.value.tipo = tipo;
  toast.value.visible = true;

  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

/* CONTROL */

const cargarControl = async () => {
  const res = await axios.get("http://localhost:3000/api/vacaciones/control");

  controlVacaciones.value = res.data;
};

/* HISTORIAL */

const toggleHistorial = async (empleadoId) => {
  if (expandido.value === empleadoId) {
    expandido.value = null;
    return;
  }

  expandido.value = empleadoId;

  if (!historial.value[empleadoId]) {
    const res = await axios.get(
      `http://localhost:3000/api/vacaciones/empleado/${empleadoId}`,
    );

    historial.value[empleadoId] = res.data;
  }
};

/* EDITAR ACUMULADOS */

/* MODAL */

const modal = ref({
  visible: false,
  control_id: null,
  nombre: "",
  dias: 0,
});

const editarAcumulados = (control) => {
  modal.value.visible = true;
  modal.value.control_id = control.control_id;
  modal.value.nombre = control.nombre;
  modal.value.dias = control.dias_acumulados;
};

const cerrarModal = () => {
  modal.value.visible = false;
};

const guardarAcumulados = async () => {
  try {
    const res = await axios.put(
      `http://localhost:3000/api/vacaciones/acumulados/${modal.value.control_id}`,
      { dias_acumulados: modal.value.dias },
    );

    mostrarToast("Días acumulados actualizados");

    modal.value.visible = false;

    cargarControl();
  } catch (error) {
    if (error.response) {
      mostrarToast(
        error.response?.data?.mensaje ||
          error.response?.data?.error ||
          "No se pudo actualizar los días acumulados",
        "error",
      );
    } else {
      mostrarToast("Error al conectar con el servidor", "error");
    }
  }
};

/* FECHA */

const formatearFecha = (fecha) => {
  const [anio, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${anio}`;
};

onMounted(() => {
  cargarControl();
});
</script>

<style scoped src="../css/vacaciones-control.css"></style>
