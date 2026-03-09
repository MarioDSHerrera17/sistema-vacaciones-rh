<template>
  <div class="vacaciones">
    <!-- TOAST -->

    <div v-if="toast.visible" :class="['toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>

    <!-- HEADER -->

    <div class="header">
      <h1>Gestión de Vacaciones</h1>

      <button class="btn-agregar" @click="abrirModal">
        + Registrar vacaciones
      </button>
    </div>

    <!-- ============================= -->
    <!-- CONTROL DE VACACIONES -->
    <!-- ============================= -->

    <div class="tabla-container">
      <h2>Control de Vacaciones</h2>

      <table v-if="controlVacaciones.length">
        <thead>
          <tr>
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
          <tr v-for="c in controlVacaciones" :key="c.id">
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
        </tbody>
      </table>

      <p v-else>No hay control de vacaciones</p>
    </div>

    <!-- ============================= -->
    <!-- HISTORIAL -->
    <!-- ============================= -->

    <div class="tabla-container">
      <h2>Historial de Vacaciones</h2>

      <table v-if="historialVacaciones.length">
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
          <tr v-for="v in historialVacaciones" :key="v.id">
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

    <!-- ============================= -->
    <!-- MODAL REGISTRAR -->
    <!-- ============================= -->

    <div v-if="modalVisible" class="modal">
      <div class="modal-content">
        <h2>Registrar Vacaciones</h2>

        <select v-model="nueva.empleado_id">
          <option value="">Seleccionar empleado</option>

          <option v-for="emp in empleados" :key="emp.id" :value="emp.id">
            {{ emp.nombre }} - {{ emp.puesto }}
          </option>
        </select>

        <label>Fecha inicio</label>
        <input type="date" v-model="nueva.fecha_inicio" />

        <label>Fecha fin</label>
        <input type="date" v-model="nueva.fecha_fin" />

        <textarea
          v-model="nueva.comentario"
          placeholder="Comentario"
        ></textarea>

        <div class="modal-buttons">
          <button @click="registrarVacaciones">Registrar</button>

          <button @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const controlVacaciones = ref([]);
const historialVacaciones = ref([]);
const empleados = ref([]);

const modalVisible = ref(false);

const toast = ref({
  visible: false,
  mensaje: "",
  tipo: "success",
});

const nueva = ref({
  empleado_id: "",
  fecha_inicio: "",
  fecha_fin: "",
  comentario: "",
});

/* ======================
TOAST
====================== */

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value.mensaje = mensaje;
  toast.value.tipo = tipo;
  toast.value.visible = true;

  setTimeout(() => {
    toast.value.visible = false;
  }, 3000);
};

/* ======================
CARGAR CONTROL
====================== */

const cargarControl = async () => {
  const res = await axios.get("http://localhost:3000/api/vacaciones/control");

  controlVacaciones.value = res.data;
};

/* ======================
CARGAR HISTORIAL
====================== */

const cargarHistorial = async () => {
  const res = await axios.get("http://localhost:3000/api/vacaciones/historial");

  historialVacaciones.value = res.data;
};

/* ======================
CARGAR EMPLEADOS
====================== */

const cargarEmpleados = async () => {
  const res = await axios.get("http://localhost:3000/api/empleados");

  empleados.value = res.data;
};

/* ======================
REGISTRAR VACACIONES
====================== */

const registrarVacaciones = async () => {

  if(
    !nueva.value.empleado_id ||
    !nueva.value.fecha_inicio ||
    !nueva.value.fecha_fin
  ){
    mostrarToast("Todos los campos son obligatorios","error")
    return
  }

  try{

    if(editando.value){

      await axios.put(
        `http://localhost:3000/api/vacaciones/${vacacionEditando.value}`,
        nueva.value
      )

      mostrarToast("Vacaciones actualizadas")

    }else{

      const res = await axios.post(
        "http://localhost:3000/api/vacaciones",
        nueva.value
      )

      mostrarToast(res.data.mensaje)

    }

    cerrarModal()

    cargarControl()
    cargarHistorial()

    editando.value = false

  }catch(error){

    mostrarToast(
      error.response?.data?.mensaje || "Error",
      "error"
    )

  }

};

/* ======================
MODAL
====================== */

const abrirModal = () => {
  modalVisible.value = true;
};

const cerrarModal = () => {
  modalVisible.value = false;

  nueva.value = {
    empleado_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    comentario: "",
  };
};

/* ======================
UTILIDADES
====================== */

const formatearFecha = (fecha) => {

  const [anio, mes, dia] = fecha.split("-")

  return `${dia}/${mes}/${anio}`

}

/* ======================
INIT
====================== */

onMounted(() => {
  cargarControl();
  cargarHistorial();
  cargarEmpleados();
});

const editarAcumulados = async (control) => {
  const nuevo = prompt("Editar días acumulados", control.dias_acumulados);

  if (nuevo === null) return;

  await axios.put(
    `http://localhost:3000/api/vacaciones/acumulados/${control.id}`,
    { dias_acumulados: nuevo },
  );

  mostrarToast("Días acumulados actualizados");

  cargarControl();
};

const eliminarVacacion = async (id) => {

  const confirmar = confirm("¿Eliminar estas vacaciones?")

  if(!confirmar) return

  try{

    await axios.delete(
      `http://localhost:3000/api/vacaciones/${id}`
    )

    mostrarToast("Vacaciones eliminadas")

    cargarControl()
    cargarHistorial()

  }catch{

    mostrarToast("Error al eliminar","error")

  }

}
const editando = ref(false)
const vacacionEditando = ref(null)
const editarVacacion = (v) => {

  editando.value = true
  vacacionEditando.value = v.id

  nueva.value = {
    empleado_id: v.empleado_id,
    fecha_inicio: v.fecha_inicio,
    fecha_fin: v.fecha_fin,
    comentario: v.comentario
  }

  modalVisible.value = true
}
</script>

<style scoped src="../css/vacaciones.css"></style>
