<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { requestAdminPasswordReset } from '../../services/adminAuth'

const router = useRouter()
const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const canSubmit = computed(() => email.value.trim().length > 0)

async function handleSubmit() {
  if (!canSubmit.value || loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await requestAdminPasswordReset(email.value.trim())
    successMessage.value = 'Check your inbox for the password reset link.'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Password reset request failed'
  } finally {
    loading.value = false
  }
}

function goToLogin() {
  void router.push('/admin/login')
}
</script>

<template>
  <main class="admin-login-shell admin-theme">
    <section class="admin-login-layout">
      <div class="admin-login-brand-panel admin-card">
        <p class="admin-kicker">Admin Recovery</p>
        <h1 class="admin-page-title">Forgot Password</h1>
        <p class="admin-page-copy">Enter your admin email address. We only send reset mail for active admin accounts.</p>
        <button class="admin-link-button" type="button" @click="goToLogin">Back to login</button>
      </div>

      <form class="admin-login-card admin-card" @submit.prevent="handleSubmit">
        <label class="admin-field">
          <span>Email</span>
          <input
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="admin@example.com"
          >
        </label>

        <p v-if="errorMessage" class="admin-status error">{{ errorMessage }}</p>
        <p v-else-if="successMessage" class="admin-status success">{{ successMessage }}</p>
        <p v-else class="admin-status">Enter your admin email to request a reset link.</p>

        <button class="admin-button" type="submit" :disabled="loading || !canSubmit">
          {{ loading ? 'Sending...' : 'Send reset link' }}
        </button>
      </form>
    </section>
  </main>
</template>
