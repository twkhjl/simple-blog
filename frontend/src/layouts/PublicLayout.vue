<script setup lang="ts">
import '../styles/public.css'
import { computed, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import PublicDrawer from '../components/public/PublicDrawer.vue'
import PublicFooter from '../components/public/PublicFooter.vue'
import PublicHeader from '../components/public/PublicHeader.vue'
import { publicMockContent } from '../content/publicMockContent'
import { useI18n } from 'vue-i18n'
import { ensureAuthInitialized, authState, logout } from '../stores/auth'

const drawerOpen = ref(false)
const { t } = useI18n()
const isLoggedIn = computed(() => Boolean(authState.session))

async function handleLogout() {
  await logout()
}

onMounted(() => {
  void ensureAuthInitialized()
})
</script>

<template>
  <div data-testid="public-layout" class="front-theme">
    <div class="front-drawer-backdrop" :class="{ open: drawerOpen }" @click="drawerOpen = false"></div>
    <PublicDrawer
      :brand="publicMockContent.site.brand"
      :sign-in-label="publicMockContent.site.signInLabel"
      :login-records-label="t('auth.loginRecords.title')"
      :logout-label="t('common.actions.logout')"
      :is-logged-in="isLoggedIn"
      :open="drawerOpen"
      :nav="publicMockContent.site.nav"
      @close="drawerOpen = false"
      @logout="handleLogout"
    />
    <header class="front-header">
      <PublicHeader
        :brand="publicMockContent.site.brand"
        :sign-in-label="publicMockContent.site.signInLabel"
        :login-records-label="t('auth.loginRecords.title')"
        :logout-label="t('common.actions.logout')"
        :is-logged-in="isLoggedIn"
        @toggle-menu="drawerOpen = !drawerOpen"
        @logout="handleLogout"
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
