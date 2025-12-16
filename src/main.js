import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 引入 Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// 全局样式
import './assets/main.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')