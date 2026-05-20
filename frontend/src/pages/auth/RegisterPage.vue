<template>
  <section class="auth-shell">
    <div class="auth-card neo-shell">
      <div class="stack-card" style="margin-bottom: 1.2rem;">
        <p class="eyebrow">{{ t('auth.register.eyebrow') }}</p>
        <h1 class="section-title">{{ t('auth.register.title') }}</h1>
        <p class="section-copy">{{ t('auth.register.copy') }}</p>
      </div>

      <form @submit.prevent="handleRegister">
        <label class="field">
          <span class="field-label">{{ t('common.labels.email') }}</span>
          <input v-model="email" class="neo-input" type="email" autocomplete="email" required :placeholder="t('auth.register.emailPlaceholder')">
        </label>
        <label class="field">
          <span class="field-label">{{ t('common.labels.password') }}</span>
          <input
            v-model="password"
            class="neo-input"
            type="password"
            autocomplete="new-password"
            required
            :placeholder="t('auth.register.passwordPlaceholder')"
          >
        </label>
        <button type="submit" class="neo-button primary" :disabled="submitting">{{ t('auth.register.submit') }}</button>
      </form>

      <p v-if="message" class="status-message" :class="{ error: !isSuccess, success: isSuccess }" style="margin-top: 1rem;">
        {{ message }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { signUpWithPassword } from '../../services/supabase'

const { t } = useI18n()
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
    message.value = t('common.messages.registerSuccess')
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.registerFailed')
  } finally {
    submitting.value = false
  }
}
</script>
