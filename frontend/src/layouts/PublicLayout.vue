<template>
  <div class="public-theme">
    <header class="public-header">
      <div class="public-header-bar public-glass-card">
        <RouterLink class="public-brand" to="/">{{ t('public.brand.title') }}</RouterLink>

        <nav class="public-desktop-nav">
          <RouterLink class="public-nav-link" :class="{ active: route.path === '/' }" data-testid="desktop-nav-home" to="/">
            {{ t('public.nav.home') }}
          </RouterLink>
          <RouterLink
            class="public-nav-link"
            :class="{ active: route.path === '/articles' }"
            data-testid="desktop-nav-articles"
            to="/articles"
          >
            {{ t('public.nav.articles') }}
          </RouterLink>
          <RouterLink
            class="public-nav-link"
            :class="{ active: route.path === '/profile' }"
            data-testid="desktop-nav-profile"
            to="/profile"
          >
            {{ t('public.nav.profile') }}
          </RouterLink>
          <RouterLink
            v-if="canAdmin"
            class="public-nav-link"
            :class="{ active: route.path.startsWith('/admin') }"
            data-testid="desktop-nav-admin"
            to="/admin/posts"
          >
            {{ t('public.nav.admin') }}
          </RouterLink>
        </nav>

        <div class="public-header-actions">
          <LocaleSwitcher />
          <RouterLink v-if="!isLoggedIn" class="public-secondary-button" to="/login">
            {{ t('common.actions.login') }}
          </RouterLink>
          <RouterLink v-if="!isLoggedIn" class="public-primary-button" to="/register">
            {{ t('common.actions.register') }}
          </RouterLink>
          <button v-else type="button" class="public-secondary-button" @click="handleLogout">
            {{ t('common.actions.logout') }}
          </button>
        </div>

        <button
          type="button"
          class="public-mobile-toggle"
          data-testid="mobile-menu-toggle"
          :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
          aria-controls="mobile-public-menu"
          @click="toggleMobileMenu"
        >
          <span class="visually-hidden">{{ t('common.messages.toggleNavigationMenu') }}</span>
          <span />
          <span />
          <span />
        </button>

        <div
          id="mobile-public-menu"
          class="public-mobile-panel public-glass-card"
          v-show="isMobileMenuOpen"
          data-testid="mobile-menu-panel"
          :data-open="isMobileMenuOpen ? 'true' : 'false'"
        >
          <RouterLink
            class="public-nav-link"
            :class="{ active: route.path === '/' }"
            data-testid="mobile-nav-home"
            to="/"
            @click="closeMobileMenu"
          >
            {{ t('public.nav.home') }}
          </RouterLink>
          <RouterLink
            class="public-nav-link"
            :class="{ active: route.path === '/articles' }"
            data-testid="mobile-nav-articles"
            to="/articles"
            @click="closeMobileMenu"
          >
            {{ t('public.nav.articles') }}
          </RouterLink>
          <RouterLink
            class="public-nav-link"
            :class="{ active: route.path === '/profile' }"
            data-testid="mobile-nav-profile"
            to="/profile"
            @click="closeMobileMenu"
          >
            {{ t('public.nav.profile') }}
          </RouterLink>
          <RouterLink
            v-if="canAdmin"
            class="public-nav-link"
            :class="{ active: route.path.startsWith('/admin') }"
            data-testid="mobile-nav-admin"
            to="/admin/posts"
            @click="closeMobileMenu"
          >
            {{ t('public.nav.admin') }}
          </RouterLink>

          <div class="public-mobile-actions">
            <LocaleSwitcher />
            <RouterLink v-if="!isLoggedIn" class="public-secondary-button" to="/login" @click="closeMobileMenu">
              {{ t('common.actions.login') }}
            </RouterLink>
            <RouterLink v-if="!isLoggedIn" class="public-primary-button" to="/register" @click="closeMobileMenu">
              {{ t('common.actions.register') }}
            </RouterLink>
            <button
              v-else
              type="button"
              class="public-secondary-button"
              data-testid="mobile-logout"
              @click="handleLogout"
            >
              {{ t('common.actions.logout') }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="public-main">
      <RouterView />
    </main>

    <footer class="public-footer">
      <div class="public-footer-bar">
        <div>
          <p class="public-brand-footer">{{ t('public.brand.title') }}</p>
          <p class="public-footer-copy">{{ t('public.brand.footerLead') }}</p>
        </div>
        <p class="public-footer-copy">{{ t('public.brand.footerCopy') }}</p>
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
