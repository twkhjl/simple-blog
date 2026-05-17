import { createApp } from 'vue'
import App from './App.vue'
import { createAppRouter } from './router'
import { initializeAuth } from './stores/auth'
import './style.css'

const app = createApp(App)

app.use(createAppRouter())
initializeAuth().finally(() => {
  app.mount('#app')
})
