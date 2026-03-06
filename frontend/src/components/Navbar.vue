<script setup>
import { ref } from "vue";

const menuAbierto = ref(false);

const toggleMenu = () => {
  menuAbierto.value = !menuAbierto.value;
};
</script>

<template>
  <nav class="navbar">
    <div class="left">
      <h1>Sistema RH</h1>
      <img src="../assets/logo.png" class="logo" />
    </div>

    <!-- Hamburguesa -->
    <div class="hamburger" @click="toggleMenu">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <!-- Menu -->
    <div :class="['menu', menuAbierto ? 'activo' : '']">
      <router-link to="/empleados">Empleados</router-link>
      <router-link to="/vacaciones">Vacaciones</router-link>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  width: 100%;
  background: #0f3f8f;
  color: white;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 10px 20px;
  box-sizing: border-box;
  position: relative;
}

/* IZQUIERDA */

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

h1 {
  font-size: 20px;
  margin: 0;
}

.logo {
  width: 90px;
  height: auto;
}

/* MENU DESKTOP */

.menu {
  display: flex;
  gap: 25px;
}

.menu a {
  color: white;
  text-decoration: none;
  font-size: 15px;
}

/* HAMBURGUESA */

.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background: white;
  display: block;
}

/* ---------------- */
/* RESPONSIVE */
/* ---------------- */

@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }

  .menu {
    position: absolute;
    top: 60px;
    left: 0;
    width: 100%;
    background: #0f3f8f;

    flex-direction: column;
    align-items: center;
    gap: 15px;

    padding: 20px 0;

    display: none;
  }

  .menu.activo {
    display: flex;
  }
}
</style>
