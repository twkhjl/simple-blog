<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'
</script>

<template>
  <main class="flex-grow flex flex-col items-center w-full px-gutter md:px-0 py-xl max-w-container-max mx-auto gap-xl">
    <section class="w-full flex flex-col md:flex-row items-center gap-lg bg-surface-container-lowest p-lg rounded-xl neomorphic-extruded relative overflow-hidden">
      <div class="relative z-10 w-40 h-40 md:w-56 md:h-56 shrink-0 rounded-full neomorphic-inset p-4 bg-surface-container">
        <div class="w-full h-full rounded-full bg-surface-container-high flex items-center justify-center text-secondary font-display-lg text-4xl">
          TH
        </div>
      </div>
      <div class="flex flex-col gap-sm">
        <h1 class="font-display-lg text-display-lg text-on-surface">{{ publicMockContent.about.title }}</h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">{{ publicMockContent.about.intro }}</p>
        <p class="font-body-md text-body-md text-outline mt-2 max-w-xl">
          這個頁面目前使用假資料呈現，重點是保留靜態稿的版面、陰影與排版節奏。
        </p>
      </div>
    </section>

    <section class="w-full grid grid-cols-1 md:grid-cols-2 gap-lg">
      <div
        v-for="section in publicMockContent.about.sections"
        :key="section.title"
        class="bg-surface p-lg rounded-xl neomorphic-extruded flex flex-col gap-md border-t border-outline-variant/10"
      >
        <div class="flex items-center gap-sm text-secondary">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">code</span>
          <h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg">
            {{ section.title }}
          </h2>
        </div>
        <p class="font-body-md text-body-md text-on-surface-variant">{{ section.body }}</p>
      </div>
    </section>

    <section class="w-full flex flex-col items-center gap-md bg-surface p-xl rounded-xl neomorphic-extruded relative">
      <h2 class="relative z-10 font-headline-lg text-headline-lg text-secondary text-center">社群與聯繫</h2>
      <p class="relative z-10 font-body-md text-body-md text-on-surface-variant text-center max-w-md">
        如果你喜歡這種帶有柔和材質感的前台風格，後續可以在此基礎上再接回真實內容流程。
      </p>
      <div class="relative z-10 flex gap-lg mt-8">
        <a aria-label="Email" class="w-16 h-16 rounded-full neomorphic-extruded bg-surface flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-300 active:neomorphic-inset" href="#">
          <span class="material-symbols-outlined text-[32px]">mail</span>
        </a>
        <a aria-label="LinkedIn" class="w-16 h-16 rounded-full neomorphic-extruded bg-surface flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-300 active:neomorphic-inset" href="#">
          <span class="material-symbols-outlined text-[32px]">work</span>
        </a>
        <a aria-label="Twitter" class="w-16 h-16 rounded-full neomorphic-extruded bg-surface flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors duration-300 active:neomorphic-inset" href="#">
          <span class="material-symbols-outlined text-[32px]">chat</span>
        </a>
      </div>
    </section>
  </main>
</template>
