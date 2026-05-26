<template>
  <section class="front-contact-page" data-testid="front-contact-page">
    <header class="front-panel front-page-head">
      <p class="front-eyebrow">{{ content.contact.eyebrow }}</p>
      <h1 class="front-title">{{ content.contact.title }}</h1>
      <p class="front-copy">{{ content.contact.intro }}</p>
    </header>

    <div class="front-contact-grid">
      <article v-for="item in content.contact.cards" :key="item.label" class="front-panel front-static-card">
        <p class="front-card-category">{{ item.label }}</p>
        <p class="front-card-copy">{{ item.value }}</p>
      </article>
    </div>

    <form class="front-contact-form">
      <label class="front-field">
        <span>姓名</span>
        <input class="front-input" type="text" placeholder="這裡只做展示，不會送出" disabled>
      </label>
      <label class="front-field">
        <span>Email</span>
        <input class="front-input" type="email" placeholder="demo@example.invalid" disabled>
      </label>
      <label class="front-field">
        <span>訊息</span>
        <textarea class="front-textarea" rows="6" disabled>前台聯絡表單目前不串功能，只保留新版型。</textarea>
      </label>
      <button class="front-subtle-button" type="button" disabled>送出功能未啟用</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

const content = publicMockContent
</script>
