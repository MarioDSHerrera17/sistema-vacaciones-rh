<template>
  <nav class="navbar">
    <div class="left">
      <img src="../assets/logo.png" class="logo" />
      <div class="brand">
        <span class="brand-title">SISTEMA RH</span>
        <span class="brand-sub">Gestión de Recursos Humanos</span>
      </div>
    </div>

    <!-- Hamburguesa -->
    <div class="hamburger" @click="toggleMenu">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <!-- Menu -->
    <div :class="['menu', menuAbierto ? 'activo' : '']">
      <router-link to="/empleados">EMPLEADOS</router-link>
      <router-link to="/vacaciones">VACACIONES</router-link>
      <router-link to="/historial">HISTORIAL</router-link>
      <router-link to="/feriados">FERIADOS</router-link>

      <!-- Botón respaldo solo para admin -->
      <button
        v-if="esAdmin"
        class="btn-backup"
        @click="crearBackup"
        :disabled="cargando"
      >
        {{ cargando ? "Guardando..." : "💾 Respaldo" }}
      </button>

      <!-- Botón sesión -->
      <button v-if="!esAdmin" class="btn-codigo" @click="abrirModal">
        🔓 Ingresar código
      </button>
      <button v-else class="btn-cerrar-sesion" @click="salir">
        🔒 Cerrar sesión
      </button>
    </div>

    <!-- Toast del navbar -->
    <div v-if="toast.visible" :class="['navbar-toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>

    <!-- Modal de código -->
    <div v-if="modalVisible" class="codigo-overlay">
      <div class="codigo-modal">
        <h3>Acceso administrador</h3>
        <p>Ingresa el código para habilitar la edición</p>

        <input
          v-model="codigo"
          type="password"
          placeholder="Código de acceso"
          @keyup.enter="verificarCodigo"
          ref="inputCodigo"
        />

        <div class="codigo-acciones">
          <button class="btn-cancelar" @click="cerrarModal">Cancelar</button>
          <button class="btn-guardar" @click="verificarCodigo">Ingresar</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, nextTick } from "vue";
import axios from "axios";
import { API_URL } from "../services/api";
import { esAdmin, iniciarSesion, cerrarSesion } from "../stores/auth";

const menuAbierto = ref(false);
const cargando = ref(false);
const modalVisible = ref(false);
const codigo = ref("");
const inputCodigo = ref(null);

const toast = ref({ visible: false, mensaje: "", tipo: "success" });

const toggleMenu = () => {
  menuAbierto.value = !menuAbierto.value;
};

const mostrarToast = (mensaje, tipo = "success") => {
  toast.value = { visible: true, mensaje, tipo };
  setTimeout(() => {
    toast.value.visible = false;
  }, 3500);
};

// ==========================
// MODAL CÓDIGO
// ==========================

const abrirModal = () => {
  modalVisible.value = true;
  codigo.value = "";
  nextTick(() => {
    inputCodigo.value?.focus();
  });
};

const cerrarModal = () => {
  modalVisible.value = false;
  codigo.value = "";
};

const verificarCodigo = async () => {
  if (!codigo.value) {
    mostrarToast("Ingresa el código", "error");
    return;
  }

  try {
    const res = await axios.post(`${API_URL}/auth/verificar`, {
      codigo: codigo.value,
    });

    if (res.data.valido) {
      iniciarSesion();
      cerrarModal();
      mostrarToast("✓ Modo administrador activado", "success");
    }
  } catch (error) {
    mostrarToast(error.response?.data?.mensaje || "Código incorrecto", "error");
    codigo.value = "";
    nextTick(() => {
      inputCodigo.value?.focus();
    });
  }
};

const salir = () => {
  cerrarSesion();
  mostrarToast("Sesión cerrada", "success");
};

// ==========================
// BACKUP
// ==========================

const crearBackup = async () => {
  cargando.value = true;
  try {
    const res = await axios.post(`${API_URL}/backup`);
    mostrarToast(`✓ ${res.data.archivo}`, "success");
  } catch (error) {
    mostrarToast(
      error.response?.data?.mensaje || "Error al crear el respaldo",
      "error",
    );
  } finally {
    cargando.value = false;
  }
};
</script>
<style src="../css/navbar.css"></style>