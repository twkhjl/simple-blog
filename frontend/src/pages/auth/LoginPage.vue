<template>
  <section class="page">
    <h2>Login</h2>
    <form class="form" @submit.prevent="handleLogin">
      <label>
        Email
        <input v-model="email" type="email" autocomplete="email" required>
      </label>
      <label>
        Password
        <input v-model="password" type="password" autocomplete="current-password" required>
      </label>
      <button type="submit" :disabled="submitting">Login</button>
    </form>
    <p v-if="message">{{ message }}</p>
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

async function handleLogin() {
  submitting.value = true
  message.value = ''

  try {
    const { error } = await signInWithPassword(email.value, password.value)
    if (error) {
      throw error
    }

    const profile = await refreshProfile()
    await router.push(hasAdminAccess(profile?.role) ? '/admin/posts' : '/profile')
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>
