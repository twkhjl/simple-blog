<template>
  <section class="page">
    <h2>Register</h2>
    <form class="form" @submit.prevent="handleRegister">
      <label>
        Email
        <input v-model="email" type="email" autocomplete="email" required>
      </label>
      <label>
        Password
        <input v-model="password" type="password" autocomplete="new-password" required>
      </label>
      <button type="submit" :disabled="submitting">Create account</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { signUpWithPassword } from '../../services/supabase'

const email = ref('')
const password = ref('')
const message = ref('')
const submitting = ref(false)

async function handleRegister() {
  submitting.value = true
  message.value = ''

  try {
    const { error } = await signUpWithPassword(email.value, password.value)
    if (error) {
      throw error
    }

    message.value = 'Account created. You can log in now.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Register failed'
  } finally {
    submitting.value = false
  }
}
</script>
