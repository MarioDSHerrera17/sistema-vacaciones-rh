<script setup>
import { onMounted } from "vue";
import { obtenerAPI } from "./services/api";

onMounted(async () => {
  const data = await obtenerAPI();
  console.log(data);
});
</script>

<template>
  <h1>Sistema de Vacaciones RH</h1>
</template>