<template>
  <section class="public-auth-shell" data-testid="public-auth-shell">
    <div class="public-auth-card">
      <div class="stack-card" style="margin-bottom: 1.25rem;">
        <p class="public-section-kicker">{{ t('auth.login.eyebrow') }}</p>
        <h1 class="public-section-title">{{ t('auth.login.title') }}</h1>
        <p class="public-section-copy">{{ t('auth.login.copy') }}</p>
      </div>

      <form @submit.prevent="handleLogin">
        <label class="public-field">
          <span>{{ t('common.labels.email') }}</span>
          <input v-model="email" class="public-input" type="email" autocomplete="email" required :placeholder="t('auth.login.emailPlaceholder')">
        </label>
        <label class="public-field">
          <span>{{ t('common.labels.password') }}</span>
          <input
            v-model="password"
            class="public-input"
            type="password"
            autocomplete="current-password"
            required
            :placeholder="t('auth.login.passwordPlaceholder')"
          >
        </label>
        <button type="submit" class="public-primary-button" :disabled="submitting">{{ t('common.actions.login') }}</button>
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
import { useRouter } from 'vue-router'
import { hasAdminAccess } from '../../services/auth'
import { signInWithPassword } from '../../services/supabase'
import { refreshProfile } from '../../stores/auth'

const { t } = useI18n()
const router = useRouter()
const email = ref('')
const password = ref('')
const message = ref('')
const submitting = ref(false)
const isSuccess = ref(false)

async function handleLogin() {
  submitting.value = true
  message.value = ''
  isSuccess.value = false

  try {
    const { error } = await signInWithPassword(email.value, password.value)
    if (error) {
      throw error
    }

    const profile = await refreshProfile()
    isSuccess.value = true
    message.value = t('common.messages.loginSuccess')
    await router.push(hasAdminAccess(profile?.role) ? '/admin/posts' : '/profile')
  } catch (error) {
    message.value = error instanceof Error ? error.message : t('common.messages.loginFailed')
  } finally {
    submitting.value = false
  }
}
</script>
