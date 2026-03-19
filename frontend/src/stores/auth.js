// Store global de autenticación
// Guarda si el usuario es admin o no
// Se comparte entre todos los componentes

import { ref } from "vue";

const esAdmin = ref(false);

const iniciarSesion = () => {
  esAdmin.value = true;
};

const cerrarSesion = () => {
  esAdmin.value = false;
};

export { esAdmin, iniciarSesion, cerrarSesion };