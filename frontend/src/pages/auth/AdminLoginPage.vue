<script setup lang="ts">
import { publicMockContent } from '../../content/publicMockContent'

function handleSubmit(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <main class="flex-grow flex items-center justify-center pt-[100px] pb-xl px-gutter relative overflow-hidden">
    <form class="w-full max-w-md bg-primary-container rounded-[32px] p-8 md:p-12 neo-shadow" @submit="handleSubmit">
      <div class="text-center mb-8">
        <div class="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center neo-pressed mb-4 mx-auto border border-tertiary-fixed/30">
          <span class="material-symbols-outlined text-secondary text-[30px]">shield_lock</span>
        </div>
        <h1 class="font-display-lg text-display-lg text-on-surface mb-sm">{{ publicMockContent.adminLogin.title }}</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">{{ publicMockContent.adminLogin.copy }}</p>
      </div>
      <div class="space-y-5">
        <input class="w-full bg-surface-dim text-on-surface rounded-lg py-3 pl-4 pr-4 font-body-md shadow-[inset_2px_2px_5px_#c2b5ac,inset_-2px_-2px_5px_#ffffff] border border-transparent neo-input-focus transition-all duration-300 placeholder:text-outline" type="email" placeholder="admin@techhumana.com" />
        <input class="w-full bg-surface-dim text-on-surface rounded-lg py-3 pl-4 pr-4 font-body-md shadow-[inset_2px_2px_5px_#c2b5ac,inset_-2px_-2px_5px_#ffffff] border border-transparent neo-input-focus transition-all duration-300 placeholder:text-outline" type="password" placeholder="••••••••" />
        <button class="w-full h-14 mt-4 rounded-xl bg-surface text-secondary font-label-md text-label-md tracking-widest neo-btn flex items-center justify-center gap-2 group" type="submit">
          <span>管理員登入</span>
          <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </form>
  </main>
</template>
