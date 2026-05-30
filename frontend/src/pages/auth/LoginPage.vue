<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

function handleSubmit(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <main data-testid="front-login-page" class="flex-grow flex items-center justify-center px-gutter pt-32 pb-xl w-full">
    <form class="w-full max-w-md bg-primary-container rounded-[32px] p-8 md:p-12 neo-shadow" @submit="handleSubmit">
      <div class="text-center mb-8">
        <h1 class="font-display-lg text-display-lg text-on-surface mb-sm">{{ publicMockContent.login.title }}</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">{{ publicMockContent.login.copy }}</p>
        <p class="font-label-sm text-label-sm text-outline mt-2">登入功能未啟用</p>
      </div>
      <div class="space-y-5">
        <input class="w-full h-14 pl-4 pr-4 rounded-xl bg-surface-container border-none neo-inset neo-inset-focus outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant transition-shadow" type="email" placeholder="name@example.com" />
        <input class="w-full h-14 pl-4 pr-4 rounded-xl bg-surface-container border-none neo-inset neo-inset-focus outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant transition-shadow" type="password" placeholder="••••••••" />
        <button class="w-full h-14 mt-4 rounded-xl bg-surface text-secondary font-label-md text-label-md tracking-widest neo-btn flex items-center justify-center gap-2 group" type="submit">
          <span>登入</span>
          <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </form>
  </main>
</template>
