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

      <!-- Botón respaldo -->
      <button class="btn-backup" @click="crearBackup" :disabled="cargando">
        {{ cargando ? "Guardando..." : "💾 Respaldo" }}
      </button>
    </div>

    <!-- Toast del navbar -->
    <div v-if="toast.visible" :class="['navbar-toast', toast.tipo]">
      {{ toast.mensaje }}
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { API_URL } from "../services/api";

const menuAbierto = ref(false);
const cargando = ref(false);

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

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Barlow:wght@300;400;500&display=swap");

.navbar {
  width: 100%;
  background: #0d1b3e;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  height: 64px;
  box-sizing: border-box;
  position: relative;
  border-bottom: 3px solid #e8821a;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
}

/* ========================
   IZQUIERDA
======================== */

.left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.brand {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-title {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 2px;
  color: white;
}

.brand-sub {
  font-family: "Barlow", sans-serif;
  font-weight: 300;
  font-size: 10px;
  letter-spacing: 1.5px;
  color: #e8821a;
  text-transform: uppercase;
}

/* ========================
   MENU
======================== */

.menu {
  display: flex;
  gap: 0;
  height: 100%;
  align-items: center;
}

.menu a {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  padding: 0 20px;
  height: 64px;
  display: flex;
  align-items: center;
  transition:
    color 0.2s,
    background 0.2s;
  border-bottom: 3px solid transparent;
  margin-bottom: -3px;
}

.menu a:hover {
  color: white;
  background: rgba(255, 255, 255, 0.06);
}

.menu a.router-link-active {
  color: white;
  border-bottom-color: #e8821a;
  background: rgba(232, 130, 26, 0.08);
}

/* ========================
   BOTÓN RESPALDO
======================== */

.btn-backup {
  font-family: "Barlow Condensed", sans-serif;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: rgba(232, 130, 26, 0.15);
  color: #e8821a;
  border: 1px solid rgba(232, 130, 26, 0.4);
  border-radius: 4px;
  padding: 6px 14px;
  margin-left: 16px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
  white-space: nowrap;
}

.btn-backup:hover {
  background: #e8821a;
  color: white;
  border-color: #e8821a;
}

.btn-backup:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========================
   TOAST DEL NAVBAR
======================== */

.navbar-toast {
  position: fixed;
  top: 80px;
  right: 24px;
  padding: 10px 18px;
  border-radius: 4px;
  color: white;
  font-family: "Barlow Condensed", sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.navbar-toast.success {
  background: #27ae60;
  border-left: 4px solid #1e8449;
}

.navbar-toast.error {
  background: #e74c3c;
  border-left: 4px solid #a93226;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========================
   HAMBURGUESA
======================== */

.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 5px;
}

.hamburger span {
  width: 24px;
  height: 2px;
  background: white;
  display: block;
}

/* ========================
   RESPONSIVE
======================== */

@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }
  .brand-sub {
    display: none;
  }

  .menu {
    position: absolute;
    top: 64px;
    left: 0;
    width: 100%;
    background: #0d1b3e;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-direction: column;
    align-items: stretch;
    height: auto;
    display: none;
    z-index: 999;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .menu.activo {
    display: flex;
  }

  .menu a {
    height: 48px;
    padding: 0 25px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    border-left: 3px solid transparent;
    margin-bottom: 0;
  }

  .menu a.router-link-active {
    border-left-color: #e8821a;
    border-bottom-color: transparent;
    background: rgba(232, 130, 26, 0.08);
  }

  .btn-backup {
    margin: 8px 16px;
    text-align: center;
  }
}
</style>
