<script setup lang="ts">
import { reactive } from 'vue'
import { publicMockContent } from '../../content/publicMockContent'

const formState = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

function handleSubmit(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <main data-testid="front-contact-page" class="front-main front-contact-page">
    <section class="front-page-head front-panel">
      <p class="front-eyebrow">Contact</p>
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
        <div v-for="field in publicMockContent.contact.form.fields" :key="field.id" class="front-field">
          <label :for="field.id">{{ field.label }}</label>
          <textarea
            v-if="field.type === 'textarea'"
            :id="field.id"
            v-model="formState.message"
            :placeholder="field.placeholder"
            class="front-textarea"
            rows="5"
          ></textarea>
          <input
            v-else-if="field.id === 'name'"
            :id="field.id"
            v-model="formState.name"
            :type="field.type"
            :placeholder="field.placeholder"
            class="front-input"
          />
          <input
            v-else-if="field.id === 'email'"
            :id="field.id"
            v-model="formState.email"
            :type="field.type"
            :placeholder="field.placeholder"
            class="front-input"
          />
          <input
            v-else
            :id="field.id"
            v-model="formState.subject"
            :type="field.type"
            :placeholder="field.placeholder"
            class="front-input"
          />
        </div>
        <button type="submit" class="front-action-button">
          {{ publicMockContent.contact.form.submitLabel }}
        </button>
      </form>
    </section>
  </main>
</template>
