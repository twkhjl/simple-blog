<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { hydrateAdminRecoverySession, updateAdminPassword } from '../../services/adminAuth'

const router = useRouter()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const ready = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const hydrated = await hydrateAdminRecoverySession()
  ready.value = hydrated
  if (!hydrated) {
    errorMessage.value = 'Recovery link is invalid or expired. Request a new reset email.'
  }
})

async function handleSubmit() {
  if (!ready.value || loading.value) {
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await updateAdminPassword(password.value)
    await router.replace('/admin/login')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Password update failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="admin-login-shell admin-theme">
    <section class="admin-login-layout">
      <div class="admin-login-brand-panel admin-card">
        <p class="admin-kicker">Admin Recovery</p>
        <h1 class="admin-page-title">Reset Password</h1>
        <p class="admin-page-copy">Set a new password for your admin account.</p>
      </div>

      <form class="admin-login-card admin-card" @submit.prevent="handleSubmit">
        <label class="admin-field">
          <span>New password</span>
          <input
            v-model="password"
            name="password"
            type="password"
            autocomplete="new-password"
            placeholder="Enter a new password"
          >
        </label>

        <label class="admin-field">
          <span>Confirm password</span>
          <input
            v-model="confirmPassword"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Repeat the new password"
          >
        </label>

        <p v-if="errorMessage" class="admin-status error">{{ errorMessage }}</p>
        <p v-else class="admin-status">Choose a new password to finish recovery.</p>

        <button class="admin-button" type="submit" :disabled="loading || !ready">
          {{ loading ? 'Updating...' : 'Update password' }}
        </button>
      </form>
    </section>
  </main>
</template>
