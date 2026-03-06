import { createRouter, createWebHistory } from "vue-router";

import Empleados from "../views/Empleados.vue";
import Vacaciones from "../views/Vacaciones.vue";

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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;