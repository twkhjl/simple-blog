<template>
  <div class="site-shell">
    <header class="public-header">
      <div class="public-layout">
        <div class="public-header-inner neo-shell">
          <div class="brand-block">
            <p class="brand-mark">{{ t('public.brand.title') }}</p>
            <p class="brand-copy">{{ t('public.brand.headerCopy') }}</p>
          </div>
          <nav class="top-nav desktop-nav">
            <RouterLink class="nav-link" :class="{ active: route.path === '/' }" to="/">{{ t('public.nav.explore') }}</RouterLink>
            <RouterLink class="nav-link" :class="{ active: route.path === '/profile' }" to="/profile">{{ t('public.nav.profile') }}</RouterLink>
            <RouterLink
              v-if="canAdmin"
              class="nav-link"
              :class="{ active: route.path.startsWith('/admin') }"
              to="/admin/posts"
            >
              {{ t('public.nav.admin') }}
            </RouterLink>
          </nav>
          <div class="inline-actions desktop-actions">
            <LocaleSwitcher />
            <RouterLink v-if="!isLoggedIn" class="neo-button primary" to="/login">{{ t('common.actions.login') }}</RouterLink>
            <RouterLink v-if="!isLoggedIn" class="neo-button" to="/register">{{ t('common.actions.register') }}</RouterLink>
            <button v-else type="button" class="neo-button secondary" @click="handleLogout">{{ t('common.actions.logout') }}</button>
          </div>
          <button
            type="button"
            class="mobile-menu-toggle"
            data-testid="mobile-menu-toggle"
            :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
            aria-controls="mobile-public-menu"
            @click="toggleMobileMenu"
          >
            <span class="visually-hidden">{{ t('common.messages.toggleNavigationMenu') }}</span>
            <span class="mobile-menu-toggle-line" />
            <span class="mobile-menu-toggle-line" />
            <span class="mobile-menu-toggle-line" />
          </button>
          <div
            id="mobile-public-menu"
            v-show="isMobileMenuOpen"
            class="mobile-menu-panel neo-shell"
            data-testid="mobile-menu-panel"
            :data-open="isMobileMenuOpen ? 'true' : 'false'"
          >
            <div class="mobile-menu-section">
              <RouterLink
                class="nav-link mobile-nav-link"
                :class="{ active: route.path === '/' }"
                data-testid="mobile-nav-explore"
                to="/"
                @click="closeMobileMenu"
              >
                {{ t('public.nav.explore') }}
              </RouterLink>
              <RouterLink
                class="nav-link mobile-nav-link"
                :class="{ active: route.path === '/profile' }"
                data-testid="mobile-nav-profile"
                to="/profile"
                @click="closeMobileMenu"
              >
                {{ t('public.nav.profile') }}
              </RouterLink>
              <RouterLink
                v-if="canAdmin"
                class="nav-link mobile-nav-link"
                :class="{ active: route.path.startsWith('/admin') }"
                data-testid="mobile-nav-admin"
                to="/admin/posts"
                @click="closeMobileMenu"
              >
                {{ t('public.nav.admin') }}
              </RouterLink>
            </div>
            <div class="mobile-menu-section mobile-menu-actions">
              <LocaleSwitcher />
              <RouterLink
                v-if="!isLoggedIn"
                class="neo-button primary"
                data-testid="mobile-login"
                to="/login"
                @click="closeMobileMenu"
              >
                {{ t('common.actions.login') }}
              </RouterLink>
              <RouterLink
                v-if="!isLoggedIn"
                class="neo-button"
                data-testid="mobile-register"
                to="/register"
                @click="closeMobileMenu"
              >
                {{ t('common.actions.register') }}
              </RouterLink>
              <button
                v-else
                type="button"
                class="neo-button secondary"
                data-testid="mobile-logout"
                @click="handleLogout"
              >
                {{ t('common.actions.logout') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="page-body">
      <div class="public-layout">
        <RouterView />
      </div>
    </main>

    <footer class="public-footer">
      <div class="public-layout">
        <div class="public-footer-inner neo-shell">
          <div class="brand-block">
            <p class="brand-mark">{{ t('public.brand.title') }}</p>
            <p class="brand-copy">{{ t('public.brand.footerLead') }}</p>
          </div>
          <p class="brand-copy">{{ t('public.brand.footerCopy') }}</p>
        </div>
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
const isMobileMenuOpen = ref(false)
const isLoggedIn = computed(() => Boolean(authState.session))
const canAdmin = computed(() => canAccessAdmin())

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

async function handleLogout() {
  closeMobileMenu()
  await logout()
}

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
  },
)
</script>
