<template>
  <section class="public-auth-shell" data-testid="public-auth-shell">
    <div class="public-auth-card">
      <div class="stack-card" style="margin-bottom: 1.25rem;">
        <p class="public-section-kicker">{{ t('auth.register.eyebrow') }}</p>
        <h1 class="public-section-title">{{ t('auth.register.title') }}</h1>
        <p class="public-section-copy">{{ t('auth.register.copy') }}</p>
      </div>

      <form @submit.prevent="handleRegister">
        <label class="public-field">
          <span>{{ t('common.labels.email') }}</span>
          <input v-model="email" class="public-input" type="email" autocomplete="email" required :placeholder="t('auth.register.emailPlaceholder')">
        </label>
        <label class="public-field">
          <span>{{ t('common.labels.password') }}</span>
          <input
            v-model="password"
            class="public-input"
            type="password"
            autocomplete="new-password"
            required
            :placeholder="t('auth.register.passwordPlaceholder')"
          >
        </label>
        <button type="submit" class="public-primary-button" :disabled="submitting">{{ t('auth.register.submit') }}</button>
      </form>

      <p v-if="message" class="public-status-message" :class="{ error: !isSuccess }" style="margin-top: 1rem;">
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
