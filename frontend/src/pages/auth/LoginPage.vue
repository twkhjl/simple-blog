<template>
  <main class="admin-login-shell">
    <section class="admin-login-layout">
      <div class="admin-login-brand-panel admin-card">
        <p class="admin-kicker">{{ t('auth.login.eyebrow') }}</p>
        <h1 class="admin-page-title">{{ t('auth.login.title') }}</h1>
        <p class="admin-page-copy">{{ t('auth.login.copy') }}</p>
      </div>

      <form class="admin-login-card admin-card" @submit.prevent="handleSubmit">
        <label class="admin-field">
          <span>{{ t('common.labels.email') }}</span>
          <input
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            :placeholder="t('auth.login.emailPlaceholder')"
          >
        </label>

        <label class="admin-field">
          <span>{{ t('common.labels.password') }}</span>
          <input
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            :placeholder="t('auth.login.passwordPlaceholder')"
          >
        </label>

        <p v-if="errorMessage" class="admin-status error">{{ errorMessage }}</p>
        <p v-else class="admin-status">{{ t('common.messages.pleaseLoginFirst') }}</p>

        <button class="admin-button" type="submit" :disabled="loading || !canSubmit">
          {{ loading ? t('auth.login.submitting') : t('common.actions.login') }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { loginWithEmail } from '../../services/publicAuth'

const router = useRouter()
const { t } = useI18n()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0)

async function handleSubmit() {
  if (!canSubmit.value || loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await loginWithEmail(email.value.trim(), password.value)
    await router.replace('/login-records')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('common.messages.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>
