<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import PublicDrawer from '../components/public/PublicDrawer.vue'
import PublicFooter from '../components/public/PublicFooter.vue'
import PublicHeader from '../components/public/PublicHeader.vue'
import { publicMockContent } from '../content/publicMockContent'

const drawerOpen = ref(false)
</script>

<template>
  <div class="bg-surface text-on-surface font-body-md min-h-screen flex flex-col pt-[72px]">
    <div
      :class="drawerOpen ? 'opacity-100' : 'hidden opacity-0'"
      class="fixed inset-0 bg-on-surface/40 z-[60] transition-opacity duration-300"
      @click="drawerOpen = false"
    ></div>
    <PublicDrawer
      :open="drawerOpen"
      :nav="publicMockContent.site.nav"
      @close="drawerOpen = false"
    />
    <div class="front-header-bar">
      <PublicHeader
        :sign-in-label="publicMockContent.site.signInLabel"
        @toggle-menu="drawerOpen = !drawerOpen"
      />
    </div>
    <RouterView />
    <div class="front-footer">
      <PublicFooter />
    </div>
  </div>
</template>
