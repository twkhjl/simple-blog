<template>
  <section class="th-admin-login-page" data-testid="th-admin-login-page">
    <div class="th-auth-card dark">
      <div class="th-auth-head">
        <span class="material-symbols-outlined th-admin-icon">admin_panel_settings</span>
        <h1 class="th-display">{{ t('auth.adminLogin.title') }}</h1>
        <p class="th-muted">{{ t('auth.adminLogin.copy') }}</p>
      </div>

      <form class="th-auth-form" @submit.prevent="handleLogin">
        <label class="th-field">
          <span>{{ t('common.labels.email') }}</span>
          <input v-model="email" type="email" autocomplete="email" required :placeholder="t('auth.login.emailPlaceholder')">
        </label>
        <label class="th-field">
          <span>{{ t('common.labels.password') }}</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :placeholder="t('auth.login.passwordPlaceholder')"
          >
        </label>
        <button type="submit" class="th-button th-button-primary" :disabled="submitting">{{ t('auth.adminLogin.title') }}</button>
      </form>

      <p v-if="message" class="th-status" :class="{ error: !isSuccess }">{{ message }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import '../../style.css'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { hasAdminAccess } from '../../services/auth'
import { signInWithPassword } from '../../services/supabase'
import { logout, refreshProfile } from '../../stores/auth'

const { t } = useI18n()
const router = useRouter()
const email = ref('')
const password = ref('')
const message = ref('')
const submitting = ref(false)
const isSuccess = ref(false)

async function handleLogin() {
  submitting.value = true
  message.value = ''
  isSuccess.value = false

  try {
    const { error } = await signInWithPassword(email.value, password.value)
    if (error) {
      throw error
    }

    const profile = await refreshProfile()
    if (!hasAdminAccess(profile?.role)) {
      await logout()
      throw new Error(t('auth.adminLogin.forbidden'))
    }

    isSuccess.value = true
    message.value = t('common.messages.loginSuccess')
    await router.push('/admin/posts')
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.loginFailed')
  } finally {
    submitting.value = false
  }
}
</script>
