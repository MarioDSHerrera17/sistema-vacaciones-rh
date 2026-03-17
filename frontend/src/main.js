import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import router from './router'
import './css/global.css'
createApp(App)
.use(router)
.mount('#app')