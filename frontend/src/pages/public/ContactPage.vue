<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'
</script>

<template>
  <main class="flex-grow max-w-container-max mx-auto w-full px-gutter py-xl">
    <div class="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-lg">
      <div class="bg-primary-container rounded-xl p-lg neo-shadow mb-lg">
        <h1 class="font-display-lg text-display-lg text-on-surface mb-sm">{{ publicMockContent.contact.title }}</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant mb-lg">{{ publicMockContent.contact.intro }}</p>
        <form class="space-y-md">
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-xs" for="name">您的姓名</label>
            <input id="name" class="w-full bg-surface-container-lowest border-none rounded-lg p-sm font-body-md text-body-md text-on-surface neo-inset focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-shadow" placeholder="您的姓名" type="text" />
          </div>
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-xs" for="email">電子郵件</label>
            <input id="email" class="w-full bg-surface-container-lowest border-none rounded-lg p-sm font-body-md text-body-md text-on-surface neo-inset focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-shadow" placeholder="your.email@example.com" type="email" />
          </div>
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-xs" for="subject">主旨</label>
            <input id="subject" class="w-full bg-surface-container-lowest border-none rounded-lg p-sm font-body-md text-body-md text-on-surface neo-inset focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-shadow" placeholder="信件主旨" type="text" />
          </div>
          <div>
            <label class="block font-label-md text-label-md text-on-surface mb-xs" for="message">內容</label>
            <textarea id="message" class="w-full bg-surface-container-lowest border-none rounded-lg p-sm font-body-md text-body-md text-on-surface neo-inset focus:ring-1 focus:ring-secondary/50 focus:outline-none transition-shadow resize-none" placeholder="請在此輸入您的訊息..." rows="5"></textarea>
          </div>
          <button class="mt-base w-full bg-secondary text-on-secondary font-label-md text-label-md py-sm rounded-lg neo-button flex items-center justify-center gap-2" type="button">
            <span class="material-symbols-outlined">send</span>
            送出訊息
          </button>
        </form>
      </div>

      <aside class="flex flex-col gap-md">
        <section
          v-for="card in publicMockContent.contact.cards"
          :key="card.label"
          class="bg-surface rounded-xl neo-shadow p-lg"
        >
          <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-secondary mb-xs">{{ card.label }}</h2>
          <p class="font-body-md text-body-md text-on-surface-variant">{{ card.value }}</p>
        </section>
      </aside>
    </div>
  </main>
</template>
