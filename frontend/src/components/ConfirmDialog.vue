<template>
  <div v-if="visible" class="overlay">
    <div class="dialog">
      <h3>{{ titulo }}</h3>
      <p>{{ mensaje }}</p>

      <div class="botones">
        <button class="cancelar" @click="$emit('cancelar')">
          Cancelar
        </button>

        <button class="confirmar" @click="$emit('confirmar')">
          Confirmar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  visible: Boolean,
  titulo: String,
  mensaje: String
});
</script>

<style scoped>
.overlay{
  position: fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background: rgba(0,0,0,0.4);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index:1000;
}

.dialog{
  background:white;
  padding:25px;
  border-radius:10px;
  width:350px;
  text-align:center;
}

.botones{
  margin-top:20px;
  display:flex;
  justify-content:space-between;
}

.confirmar{
  background:#e74c3c;
  color:white;
}

.cancelar{
  background:#ccc;
}
</style>