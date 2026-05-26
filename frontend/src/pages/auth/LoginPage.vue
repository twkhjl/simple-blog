<template>
  <section class="front-login-page" data-testid="front-login-page">
    <header class="front-panel front-page-head">
      <p class="front-eyebrow">{{ content.login.eyebrow }}</p>
      <h1 class="front-title">{{ content.login.title }}</h1>
      <p class="front-copy">{{ content.login.copy }}</p>
    </header>

    <div class="front-login-card">
      <form class="front-contact-form">
        <label class="front-field">
          <span>Email</span>
          <input class="front-input" type="email" autocomplete="email" placeholder="editor@demo.invalid" disabled>
        </label>
        <label class="front-field">
          <span>密碼</span>
          <input class="front-input" type="password" autocomplete="current-password" placeholder="這一版前台不處理登入" disabled>
        </label>
        <button type="button" class="front-subtle-button" disabled>登入功能未啟用</button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

const content = publicMockContent
</script>
