<template>
  <section class="page">
    <h2>Profile</h2>
    <p v-if="!profile">Please log in first.</p>
    <form v-else class="form" @submit.prevent="handleSave">
      <p>Email: {{ profile.email }}</p>
      <p>Role: {{ profile.role }}</p>
      <label>
        Display name
        <input v-model="displayName" type="text" maxlength="50">
      </label>
      <button type="submit" :disabled="saving">Save</button>
    </form>
    <p v-if="message">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { authState, refreshProfile } from '../../stores/auth'

const profile = computed(() => authState.profile)
const displayName = ref('')
const saving = ref(false)
const message = ref('')

watch(profile, value => {
  displayName.value = value?.displayName ?? ''
}, { immediate: true })

async function handleSave() {
  if (!authState.session) {
    message.value = 'Please log in first.'
    return
  }

  saving.value = true
  message.value = ''

  try {
    const client = createApiClient(fetch, () => extractAccessToken(authState.session))
    await client.patch('/api/me', {
      displayName: displayName.value.trim() || null,
    })
    await refreshProfile()
    message.value = 'Profile updated.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Profile update failed'
  } finally {
    saving.value = false
  }
}
</script>
