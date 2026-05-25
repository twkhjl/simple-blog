<template>
  <div class="th-theme">
    <div
      class="th-drawer-backdrop"
      :class="{ open: isDrawerOpen }"
      data-testid="th-drawer-backdrop"
      @click="closeDrawer"
    />

    <aside class="th-drawer" :class="{ open: isDrawerOpen }" :data-open="isDrawerOpen ? 'true' : 'false'" data-testid="th-drawer">
      <div class="th-drawer-header">
        <div>
          <p class="th-drawer-title">Menu</p>
          <p class="th-drawer-copy">{{ t('public.brand.title') }}</p>
        </div>
        <button type="button" class="th-icon-button" data-testid="th-drawer-close" @click="closeDrawer">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <nav class="th-drawer-nav">
        <RouterLink class="th-drawer-link" data-testid="th-drawer-link-home" to="/" @click="closeDrawer">
          <span class="material-symbols-outlined">home</span>
          <span>{{ t('public.nav.home') }}</span>
        </RouterLink>
        <RouterLink class="th-drawer-link" data-testid="th-drawer-link-articles" to="/articles" @click="closeDrawer">
          <span class="material-symbols-outlined">article</span>
          <span>{{ t('public.nav.articles') }}</span>
        </RouterLink>
        <RouterLink class="th-drawer-link" data-testid="th-drawer-link-about" to="/about" @click="closeDrawer">
          <span class="material-symbols-outlined">person</span>
          <span>{{ t('public.nav.about') }}</span>
        </RouterLink>
        <RouterLink class="th-drawer-link" data-testid="th-drawer-link-contact" to="/contact" @click="closeDrawer">
          <span class="material-symbols-outlined">mail</span>
          <span>{{ t('public.nav.contact') }}</span>
        </RouterLink>
        <RouterLink class="th-drawer-link" data-testid="th-drawer-link-profile" to="/profile" @click="closeDrawer">
          <span class="material-symbols-outlined">account_circle</span>
          <span>{{ t('public.nav.profile') }}</span>
        </RouterLink>
        <RouterLink
          v-if="canAdmin"
          class="th-drawer-link"
          data-testid="th-drawer-link-admin"
          to="/admin/posts"
          @click="closeDrawer"
        >
          <span class="material-symbols-outlined">admin_panel_settings</span>
          <span>{{ t('public.nav.admin') }}</span>
        </RouterLink>
      </nav>

      <div class="th-drawer-footer">
        <LocaleSwitcher />
        <RouterLink v-if="!isLoggedIn" class="th-drawer-link" to="/login" @click="closeDrawer">
          <span class="material-symbols-outlined">login</span>
          <span>{{ t('common.actions.login') }}</span>
        </RouterLink>
        <button v-else type="button" class="th-drawer-link" data-testid="th-drawer-logout" @click="handleLogout">
          <span class="material-symbols-outlined">logout</span>
          <span>{{ t('common.actions.logout') }}</span>
        </button>
      </div>
    </aside>

    <header class="th-topbar-shell">
      <div class="th-topbar">
        <button type="button" class="th-icon-button" data-testid="th-drawer-toggle" @click="toggleDrawer">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <RouterLink class="th-topbar-brand" data-testid="th-topbar-brand" to="/">{{ t('public.brand.title') }}</RouterLink>
        <div class="th-topbar-actions">
          <nav class="th-desktop-nav">
            <RouterLink class="th-inline-link" data-testid="th-topbar-link-home" to="/">{{ t('public.nav.home') }}</RouterLink>
            <RouterLink class="th-inline-link" to="/articles">{{ t('public.nav.articles') }}</RouterLink>
            <RouterLink class="th-inline-link" to="/about">{{ t('public.nav.about') }}</RouterLink>
            <RouterLink class="th-inline-link" to="/contact">{{ t('public.nav.contact') }}</RouterLink>
          </nav>
          <LocaleSwitcher />
          <RouterLink
            v-if="!isLoggedIn"
            class="th-topbar-auth"
            data-testid="th-topbar-auth"
            to="/login"
          >
            {{ t('common.actions.login') }}
          </RouterLink>
          <button v-else class="th-topbar-auth" data-testid="th-topbar-auth" type="button" @click="handleLogout">
            {{ t('common.actions.logout') }}
          </button>
        </div>
      </div>
    </header>

    <main class="th-main">
      <RouterView />
    </main>

    <footer class="th-footer">
      <div class="th-footer-inner">
        <p class="th-footer-brand">{{ t('public.brand.title') }}</p>
        <p class="th-footer-copy">{{ t('public.brand.footerLead') }}</p>
        <div class="th-footer-links">
          <RouterLink class="th-footer-link" to="/about">{{ t('public.nav.about') }}</RouterLink>
          <RouterLink class="th-footer-link" to="/contact">{{ t('public.nav.contact') }}</RouterLink>
          <RouterLink class="th-footer-link" to="/articles">{{ t('public.nav.articles') }}</RouterLink>
        </div>
        <p class="th-footer-copy">{{ t('public.brand.footerCopy') }}</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import LocaleSwitcher from '../components/app/LocaleSwitcher.vue'
import { authState, canAccessAdmin, logout } from '../stores/auth'

const route = useRoute()
const { t } = useI18n()
const isDrawerOpen = ref(false)
const isLoggedIn = computed(() => Boolean(authState.session))
const canAdmin = computed(() => canAccessAdmin())

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value
}

function closeDrawer() {
  isDrawerOpen.value = false
}

async function handleLogout() {
  closeDrawer()
  await logout()
}

watch(
  () => route.fullPath,
  () => {
    closeDrawer()
  },
)
</script>
