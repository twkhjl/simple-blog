import { createApp } from 'vue'
import App from './App.vue'
import { createAppI18n } from './i18n'
import { createAppRouter } from './router'

const app = createApp(App)
const i18n = createAppI18n()
const router = createAppRouter()

app.use(i18n)
app.use(router)
app.mount('#app')
