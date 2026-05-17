<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">Account Surface</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.5rem);">Profile</h1>
      <p class="hero-copy">Review your account metadata and update the display name without leaving the same visual system.</p>
    </div>

    <p v-if="!profile" class="status-message error">Please log in first.</p>
    <div v-else class="split-layout">
      <div class="stack-card neo-shell" style="padding: 1.5rem;">
        <div class="stack-card">
          <p class="eyebrow">Editable Field</p>
          <h2 class="section-title">Display Settings</h2>
          <p class="section-copy">The profile endpoint currently exposes a compact account shape, so this screen focuses on clarity instead of extra chrome.</p>
        </div>

        <form class="stack-card" @submit.prevent="handleSave">
          <label class="field">
            <span class="field-label">Display name</span>
            <input v-model="displayName" class="neo-input" type="text" maxlength="50" placeholder="How should your byline appear?">
          </label>
          <div class="inline-actions">
            <button type="submit" class="neo-button primary" :disabled="saving">Save</button>
          </div>
        </form>

        <p v-if="message" class="status-message" :class="{ error: !isSuccess, success: isSuccess }">{{ message }}</p>
      </div>

      <aside class="stack-card">
        <div class="neo-panel">
          <p class="stat-label">Account Metadata</p>
          <div class="metadata-list">
            <div class="metadata-row">
              <span class="metadata-label">Email</span>
              <span class="metadata-value">{{ profile.email }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Role</span>
              <span class="metadata-value">{{ profile.role }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">Status</span>
              <span class="metadata-value">{{ profile.status }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
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
const isSuccess = ref(false)

watch(profile, value => {
  displayName.value = value?.displayName ?? ''
}, { immediate: true })

async function handleSave() {
  if (!authState.session) {
    isSuccess.value = false
    message.value = 'Please log in first.'
    return
  }

  saving.value = true
  message.value = ''
  isSuccess.value = false

  try {
    const client = createApiClient(fetch, () => extractAccessToken(authState.session))
    await client.patch('/api/me', {
      displayName: displayName.value.trim() || null,
    })
    await refreshProfile()
    isSuccess.value = true
    message.value = 'Profile updated.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Profile update failed'
  } finally {
    saving.value = false
  }
}
</script>
