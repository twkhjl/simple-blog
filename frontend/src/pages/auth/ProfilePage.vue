<template>
  <section class="public-profile-shell" data-testid="public-profile-shell">
    <div class="public-profile-main">
      <div class="stack-card" style="margin-bottom: 1.25rem;">
        <p class="public-section-kicker">{{ t('auth.profile.eyebrow') }}</p>
        <h1 class="public-section-title">{{ t('auth.profile.title') }}</h1>
        <p class="public-section-copy">{{ t('auth.profile.copy') }}</p>
      </div>

      <p v-if="!profile" class="public-status-message error">{{ t('common.messages.pleaseLoginFirst') }}</p>
      <template v-else>
        <form @submit.prevent="handleSave">
          <label class="public-field">
            <span>{{ t('common.labels.displayName') }}</span>
            <input v-model="displayName" class="public-input" type="text" maxlength="50" :placeholder="t('auth.profile.displayNamePlaceholder')">
          </label>
          <button type="submit" class="public-primary-button" :disabled="saving">{{ t('common.actions.save') }}</button>
        </form>

        <p v-if="message" class="public-status-message" :class="{ error: !isSuccess }" style="margin-top: 1rem;">{{ message }}</p>
      </template>
    </div>

    <aside class="public-profile-meta">
      <p class="public-card-label">{{ t('auth.profile.metadata') }}</p>
      <div v-if="profile" class="metadata-list" style="margin-top: 1rem;">
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
    </aside>
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
