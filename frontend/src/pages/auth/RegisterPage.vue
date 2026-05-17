<template>
  <section class="auth-shell">
    <div class="auth-card neo-shell">
      <div class="stack-card" style="margin-bottom: 1.2rem;">
        <p class="eyebrow">New Identity</p>
        <h1 class="section-title">Register</h1>
        <p class="section-copy">Create a new account without leaving the same sculpted auth surface.</p>
      </div>

      <form @submit.prevent="handleRegister">
        <label class="field">
          <span class="field-label">Email</span>
          <input v-model="email" class="neo-input" type="email" autocomplete="email" required placeholder="writer@example.com">
        </label>
        <label class="field">
          <span class="field-label">Password</span>
          <input
            v-model="password"
            class="neo-input"
            type="password"
            autocomplete="new-password"
            required
            placeholder="Choose a strong password"
          >
        </label>
        <button type="submit" class="neo-button primary" :disabled="submitting">Create account</button>
      </form>

      <p v-if="message" class="status-message" :class="{ error: !isSuccess, success: isSuccess }" style="margin-top: 1rem;">
        {{ message }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { signUpWithPassword } from '../../services/supabase'

const email = ref('')
const password = ref('')
const message = ref('')
const submitting = ref(false)
const isSuccess = ref(false)

async function handleRegister() {
  submitting.value = true
  message.value = ''
  isSuccess.value = false

  try {
    const { error } = await signUpWithPassword(email.value, password.value)
    if (error) {
      throw error
    }

    isSuccess.value = true
    message.value = 'Account created. You can log in now.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Register failed'
  } finally {
    submitting.value = false
  }
}
</script>
