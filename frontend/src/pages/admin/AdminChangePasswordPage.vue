<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.changePassword.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.4rem);">{{ t('admin.changePassword.title') }}</h1>
      <p class="hero-copy">{{ t('admin.changePassword.copy') }}</p>
    </div>

    <form class="neo-panel stack-card" @submit.prevent="handleSubmit">
      <label class="admin-field">
        <span>{{ t('common.labels.currentPassword') }}</span>
        <input
          v-model="form.currentPassword"
          name="currentPassword"
          type="password"
          autocomplete="current-password"
          :placeholder="t('admin.changePassword.currentPasswordPlaceholder')"
        >
      </label>

      <label class="admin-field">
        <span>{{ t('common.labels.newPassword') }}</span>
        <input
          v-model="form.newPassword"
          name="newPassword"
          type="password"
          autocomplete="new-password"
          :placeholder="t('admin.changePassword.newPasswordPlaceholder')"
        >
      </label>

      <label class="admin-field">
        <span>{{ t('common.labels.confirmPassword') }}</span>
        <input
          v-model="form.confirmPassword"
          name="confirmPassword"
          type="password"
          autocomplete="new-password"
          :placeholder="t('admin.changePassword.confirmPasswordPlaceholder')"
        >
      </label>

      <p v-if="errorMessage" class="admin-status error">{{ errorMessage }}</p>
      <p v-else-if="successMessage" class="admin-status success">{{ successMessage }}</p>
      <p v-else class="admin-status">{{ t('admin.changePassword.help') }}</p>

      <div class="inline-actions">
        <button class="neo-button primary" type="submit" :disabled="loading || !canSubmit">
          {{ loading ? t('admin.changePassword.submitting') : t('common.actions.changePassword') }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiRequestError } from '../../services/api'
import { changeAdminPassword } from '../../services/adminAuth'

const MIN_PASSWORD_LENGTH = 8

const { t } = useI18n()
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const canSubmit = computed(() => (
  form.currentPassword.length > 0
  && form.newPassword.length > 0
  && form.confirmPassword.length > 0
))

function clearForm() {
  form.currentPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
}

function getValidationError() {
  if (!canSubmit.value) {
    return t('admin.changePassword.required')
  }

  if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
    return t('admin.changePassword.tooShort', { count: MIN_PASSWORD_LENGTH })
  }

  if (form.newPassword !== form.confirmPassword) {
    return t('admin.changePassword.mismatch')
  }

  if (form.currentPassword === form.newPassword) {
    return t('admin.changePassword.sameAsCurrent')
  }

  return ''
}

function getRequestErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'INVALID_CURRENT_PASSWORD') {
      return t('admin.changePassword.invalidCurrentPassword')
    }

    if (error.code === 'INVALID_NEW_PASSWORD') {
      return t('admin.changePassword.invalidNewPassword')
    }

    if (error.code === 'UNAUTHORIZED') {
      return t('admin.changePassword.unauthorized')
    }
  }

  return error instanceof Error ? error.message : t('admin.changePassword.failed')
}

async function handleSubmit() {
  if (loading.value) {
    return
  }

  const validationError = getValidationError()
  if (validationError) {
    errorMessage.value = validationError
    successMessage.value = ''
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await changeAdminPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    clearForm()
    successMessage.value = t('admin.changePassword.success')
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error)
  } finally {
    loading.value = false
  }
}
</script>
