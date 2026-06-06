<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiRequestError } from '../../services/api'
import { publicContactService } from '../../services/publicContact'
import { publicMockContent } from '../../content/publicMockContent'

const { t } = useI18n()
const formState = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})
const fieldErrors = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})
const pending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

function resetFieldErrors() {
  fieldErrors.name = ''
  fieldErrors.email = ''
  fieldErrors.subject = ''
  fieldErrors.message = ''
}

function validateForm() {
  resetFieldErrors()
  let valid = true

  if (!formState.name.trim()) {
    fieldErrors.name = t('public.contact.nameRequired')
    valid = false
  }

  if (!formState.email.trim()) {
    fieldErrors.email = t('public.contact.emailRequired')
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
    fieldErrors.email = t('public.contact.emailInvalid')
    valid = false
  }

  if (!formState.subject.trim()) {
    fieldErrors.subject = t('public.contact.subjectRequired')
    valid = false
  }

  if (!formState.message.trim()) {
    fieldErrors.message = t('public.contact.messageRequired')
    valid = false
  }

  return valid
}

function resetForm() {
  formState.name = ''
  formState.email = ''
  formState.subject = ''
  formState.message = ''
}

async function handleSubmit(event: Event) {
  event.preventDefault()
  errorMessage.value = ''
  successMessage.value = ''

  if (!validateForm()) {
    return
  }

  pending.value = true
  try {
    await publicContactService.submitContact({
      name: formState.name.trim(),
      email: formState.email.trim(),
      subject: formState.subject.trim(),
      message: formState.message.trim(),
    })
    resetForm()
    resetFieldErrors()
    successMessage.value = t('public.contact.submitSuccess')
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 429) {
      errorMessage.value = t('public.contact.rateLimited')
    } else {
      errorMessage.value = error instanceof Error ? error.message : t('public.contact.submitError')
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main data-testid="front-contact-page" class="front-main front-contact-page">
    <section class="front-page-head front-panel">
      <p class="front-eyebrow">聯絡</p>
      <h1 class="front-title">{{ publicMockContent.contact.title }}</h1>
      <p class="front-copy">{{ publicMockContent.contact.intro }}</p>
    </section>

    <section class="front-contact-grid">
      <article
        v-for="card in publicMockContent.contact.cards"
        :key="card.label"
        class="front-panel front-static-card"
      >
        <p class="front-card-category">{{ card.label }}</p>
        <h2 class="front-card-title">{{ card.value }}</h2>
      </article>

      <form class="front-contact-form" @submit="handleSubmit">
        <p v-if="errorMessage" class="front-card-copy" data-testid="contact-submit-error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="front-card-copy" data-testid="contact-submit-success">{{ successMessage }}</p>

        <div v-for="field in publicMockContent.contact.form.fields" :key="field.id" class="front-field">
          <label :for="field.id">{{ field.label }}</label>
          <textarea
            v-if="field.type === 'textarea'"
            :id="field.id"
            v-model="formState.message"
            :placeholder="field.placeholder"
            class="front-textarea"
            rows="5"
            :disabled="pending"
          ></textarea>
          <input
            v-else-if="field.id === 'name'"
            :id="field.id"
            v-model="formState.name"
            :type="field.type"
            :placeholder="field.placeholder"
            class="front-input"
            :disabled="pending"
          />
          <input
            v-else-if="field.id === 'email'"
            :id="field.id"
            v-model="formState.email"
            :type="field.type"
            :placeholder="field.placeholder"
            class="front-input"
            :disabled="pending"
          />
          <input
            v-else
            :id="field.id"
            v-model="formState.subject"
            :type="field.type"
            :placeholder="field.placeholder"
            class="front-input"
            :disabled="pending"
          />
          <p v-if="fieldErrors[field.id as keyof typeof fieldErrors]" class="front-card-copy">
            {{ fieldErrors[field.id as keyof typeof fieldErrors] }}
          </p>
        </div>
        <button type="submit" class="front-action-button" :disabled="pending">
          {{ pending ? t('public.contact.submitting') : publicMockContent.contact.form.submitLabel }}
        </button>
      </form>
    </section>
  </main>
</template>
