<script setup>
import Navbar from "./components/Navbar.vue";
</script>

<template>

<Navbar/>

<div class="container">
  <router-view />
</div>

</template>

<style>

.container{
  padding: 40px;
  max-width: 1200px;
  margin: auto;
}

</style>