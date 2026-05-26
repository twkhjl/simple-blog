import { createApp } from 'vue'
import App from './App.vue'
import { createAppI18n, syncDocumentLanguage } from './i18n'
import { createAppRouter } from './router'

const app = createApp(App)
const i18n = createAppI18n()
const router = createAppRouter(i18n)

syncDocumentLanguage(i18n.global.locale.value)
app.use(i18n)
app.use(router)
app.mount('#app')
