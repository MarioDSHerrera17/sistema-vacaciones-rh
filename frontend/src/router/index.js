import { createRouter, createWebHashHistory } from "vue-router";

import Empleados from "../views/Empleados.vue";
import Vacaciones from "../views/Vacaciones.vue";
import HistorialVacaciones from "../views/Historial-Vacaciones.vue";
import Feriados from "../views/Feriados.vue";

const routes = [
  {
    path: "/",
    redirect: "/empleados",
  },
  {
    path: "/empleados",
    component: Empleados,
  },
  {
    path: "/vacaciones",
    component: Vacaciones,
  },
  {
    path: "/historial",
    component: HistorialVacaciones,
  },
  {
    path: "/feriados",
    component: Feriados,
  },
];

const router = createRouter({
  history: createWebHashHistory(), // ← hash mode para Electron (file://)
  routes,
});

export default router;