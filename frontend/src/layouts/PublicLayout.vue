<script setup lang="ts">
import '../styles/public.css'
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import PublicDrawer from '../components/public/PublicDrawer.vue'
import PublicFooter from '../components/public/PublicFooter.vue'
import PublicHeader from '../components/public/PublicHeader.vue'
import { publicMockContent } from '../content/publicMockContent'

const drawerOpen = ref(false)
</script>

<template>
  <div data-testid="public-layout" class="front-theme">
    <div class="front-drawer-backdrop" :class="{ open: drawerOpen }" @click="drawerOpen = false"></div>
    <PublicDrawer
      :brand="publicMockContent.site.brand"
      :sign-in-label="publicMockContent.site.signInLabel"
      :open="drawerOpen"
      :nav="publicMockContent.site.nav"
      @close="drawerOpen = false"
    />
    <header class="front-header">
      <PublicHeader
        :brand="publicMockContent.site.brand"
        :sign-in-label="publicMockContent.site.signInLabel"
        @toggle-menu="drawerOpen = !drawerOpen"
      />
    </header>
    <RouterView />
    <PublicFooter
      :brand="publicMockContent.site.brand"
      :copy="publicMockContent.site.footerCopy"
      :links="publicMockContent.site.footerLinks"
    />
  </div>
</template>
