<template>
  <section class="auth-shell">
    <div class="auth-card neo-shell">
      <div class="stack-card" style="margin-bottom: 1.2rem;">
        <p class="eyebrow">Secure Entry</p>
        <h1 class="section-title">Login</h1>
        <p class="section-copy">Enter the editorial workspace with the same dark tactile language as the rest of the app.</p>
      </div>

      <form @submit.prevent="handleLogin">
        <label class="field">
          <span class="field-label">Email</span>
          <input v-model="email" class="neo-input" type="email" autocomplete="email" required placeholder="editor@example.com">
        </label>
        <label class="field">
          <span class="field-label">Password</span>
          <input
            v-model="password"
            class="neo-input"
            type="password"
            autocomplete="current-password"
            required
            placeholder="Enter your password"
          >
        </label>
        <button type="submit" class="neo-button primary" :disabled="submitting">Login</button>
      </form>

      <p v-if="message" class="status-message" :class="{ error: !isSuccess, success: isSuccess }" style="margin-top: 1rem;">
        {{ message }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { hasAdminAccess } from '../../services/auth'
import { signInWithPassword } from '../../services/supabase'
import { refreshProfile } from '../../stores/auth'

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
    isSuccess.value = true
    message.value = 'Login successful. Redirecting...'
    await router.push(hasAdminAccess(profile?.role) ? '/admin/posts' : '/profile')
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>
