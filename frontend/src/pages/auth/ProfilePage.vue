<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('auth.profile.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.5rem);">{{ t('auth.profile.title') }}</h1>
      <p class="hero-copy">{{ t('auth.profile.copy') }}</p>
    </div>

    <p v-if="!profile" class="status-message error">{{ t('common.messages.pleaseLoginFirst') }}</p>
    <div v-else class="split-layout">
      <div class="stack-card neo-shell" style="padding: 1.5rem;">
        <div class="stack-card">
          <p class="eyebrow">{{ t('auth.profile.editableField') }}</p>
          <h2 class="section-title">{{ t('auth.profile.displaySettings') }}</h2>
          <p class="section-copy">{{ t('auth.profile.displaySettingsCopy') }}</p>
        </div>

        <form class="stack-card" @submit.prevent="handleSave">
          <label class="field">
            <span class="field-label">{{ t('common.labels.displayName') }}</span>
            <input v-model="displayName" class="neo-input" type="text" maxlength="50" :placeholder="t('auth.profile.displayNamePlaceholder')">
          </label>
          <div class="inline-actions">
            <button type="submit" class="neo-button primary" :disabled="saving">{{ t('common.actions.save') }}</button>
          </div>
        </form>

        <p v-if="message" class="status-message" :class="{ error: !isSuccess, success: isSuccess }">{{ message }}</p>
      </div>

      <aside class="stack-card">
        <div class="neo-panel">
          <p class="stat-label">{{ t('auth.profile.metadata') }}</p>
          <div class="metadata-list">
            <div class="metadata-row">
              <span class="metadata-label">{{ t('common.labels.email') }}</span>
              <span class="metadata-value">{{ profile.email }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">{{ t('common.labels.role') }}</span>
              <span class="metadata-value">{{ t(`common.statusValues.${profile.role}`) }}</span>
            </div>
            <div class="metadata-row">
              <span class="metadata-label">{{ t('common.labels.accountStatus') }}</span>
              <span class="metadata-value">{{ t(`common.statusValues.${profile.status}`) }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createApiClient } from '../../services/api'
import { extractAccessToken } from '../../services/auth'
import { authState, refreshProfile } from '../../stores/auth'

const { t } = useI18n()
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
    message.value = t('common.messages.pleaseLoginFirst')
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
    message.value = t('common.messages.profileUpdated')
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.profileUpdateFailed')
  } finally {
    saving.value = false
  }
}
</script>
