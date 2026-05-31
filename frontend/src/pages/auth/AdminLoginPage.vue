<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { loginAdminWithUsername } from '../../services/adminAuth'

const router = useRouter()
const { locale, t } = useI18n()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => username.value.trim().length > 0 && password.value.length > 0)
const isZhTW = computed(() => locale.value === 'zh-TW')
const eyebrowLabel = computed(() => (isZhTW.value ? '後台登入' : 'Admin Access'))
const titleLabel = computed(() => (isZhTW.value ? '管理員登入' : 'Admin Login'))
const copyLabel = computed(() => (
  isZhTW.value
    ? '使用後台帳號的使用者名稱與密碼登入控制台。'
    : 'Use your admin username and password to enter the control surface.'
))
const usernameLabel = computed(() => (isZhTW.value ? '使用者名稱' : 'Username'))
const helperCopy = computed(() => (
  isZhTW.value
    ? '前台只輸入 username，內部仍由 Supabase Auth 維護 session。'
    : 'Username stays public-facing. Email stays internal to Supabase Auth.'
))
const usernamePlaceholder = computed(() => 'admin')
const passwordPlaceholder = computed(() => (isZhTW.value ? '請輸入密碼' : 'Enter your password'))
const defaultMessage = computed(() => (
  isZhTW.value
    ? '請輸入管理員帳號密碼以存取後台。'
    : 'Enter your admin credentials to continue.'
))
const submitLabel = computed(() => (isZhTW.value ? '登入管理後台' : 'Sign in to admin'))
const submittingLabel = computed(() => (isZhTW.value ? '登入中...' : 'Signing in...'))

async function handleSubmit() {
  if (!canSubmit.value || loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await loginAdminWithUsername(username.value.trim(), password.value)
    await router.replace('/admin')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('common.messages.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="admin-login-shell admin-theme">
    <section class="admin-login-layout">
      <div class="admin-login-brand-panel admin-card">
        <p class="admin-kicker">{{ eyebrowLabel }}</p>
        <h1 class="admin-page-title">{{ titleLabel }}</h1>
        <p class="admin-page-copy">{{ copyLabel }}</p>
        <p class="admin-note">{{ helperCopy }}</p>
      </div>

      <form class="admin-login-card admin-card" @submit.prevent="handleSubmit">
        <label class="admin-field">
          <span>{{ usernameLabel }}</span>
          <input
            v-model="username"
            name="username"
            type="text"
            autocomplete="username"
            :placeholder="usernamePlaceholder"
          >
        </label>

        <label class="admin-field">
          <span>{{ t('common.labels.password') }}</span>
          <input
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            :placeholder="passwordPlaceholder"
          >
        </label>

        <p v-if="errorMessage" class="admin-status error">{{ errorMessage }}</p>
        <p v-else class="admin-status">{{ defaultMessage }}</p>

        <button class="admin-button" type="submit" :disabled="loading || !canSubmit">
          {{ loading ? submittingLabel : submitLabel }}
        </button>
      </form>
    </section>
  </main>
</template>
