import { createApp } from 'vue'
import App from './App.vue'
import { createAppI18n } from './i18n'
import { createAppRouter } from './router'
import { persistAdminRecoverySessionFromUrl } from './services/adminAuth'

const isAdminRecoveryBootstrap =
  window.location.search.includes('admin_reset=1') &&
  window.location.hash.includes('access_token=')

if (isAdminRecoveryBootstrap && persistAdminRecoverySessionFromUrl()) {
  window.history.replaceState({}, '', `${window.location.pathname}#/admin/reset-password`)
}

const app = createApp(App)
const i18n = createAppI18n()
const router = createAppRouter()

app.use(i18n)
app.use(router)
app.mount('#app')
