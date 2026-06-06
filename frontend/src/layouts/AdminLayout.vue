<template>
  <div class="admin-theme">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-inner admin-surface">
          <div class="admin-topbar-main">
            <button
              type="button"
              class="admin-mobile-menu-button"
              data-testid="admin-mobile-menu-button"
              :aria-expanded="isMobileNavOpen"
              :aria-label="t('admin.layout.openMenu')"
              @click="toggleMobileNav"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div class="brand-block">
              <p class="brand-mark">{{ t('admin.layout.brandTitle') }}</p>
              <p class="brand-copy">{{ t('admin.layout.brandCopy') }}</p>
            </div>
          </div>

          <div class="admin-topbar-actions">
            <AdminLocaleSwitcher />
            <RouterLink class="admin-shell-button secondary" to="/">{{ t('common.actions.backToSite') }}</RouterLink>
            <RouterLink class="admin-shell-button primary" to="/admin/posts/new">{{ t('common.actions.newPost') }}</RouterLink>
            <div ref="userMenuRef" class="admin-user-menu-shell">
              <button
                class="admin-shell-button admin-user-trigger"
                type="button"
                data-testid="admin-user-trigger"
                :aria-expanded="isUserMenuOpen"
                @click="toggleUserMenu"
              >
                {{ adminIdentityLabel }}
              </button>

              <div
                v-if="isUserMenuOpen"
                class="admin-user-menu admin-surface"
                data-testid="admin-user-menu"
              >
                <p v-if="logoutError" class="admin-user-menu-error">{{ logoutError }}</p>
                <RouterLink
                  class="admin-user-menu-action"
                  to="/admin/change-password"
                  data-testid="admin-change-password-link"
                  @click="isUserMenuOpen = false"
                >
                  {{ t('common.actions.changePassword') }}
                </RouterLink>
                <button
                  class="admin-user-menu-action"
                  type="button"
                  data-testid="admin-logout-action"
                  :disabled="logoutPending"
                  @click="handleLogout"
                >
                  {{ t('common.actions.logout') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div
      class="admin-mobile-overlay"
      :class="{ open: isMobileNavOpen }"
      data-testid="admin-mobile-overlay"
      @click="closeMobileNav"
    ></div>

    <main class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-surface admin-sidebar-panel">
          <div class="brand-block admin-sidebar-intro">
            <p class="eyebrow">{{ t('admin.layout.workspace') }}</p>
            <p class="section-title admin-panel-title">{{ t('admin.layout.panel') }}</p>
          </div>

          <nav class="sidebar-nav" :aria-label="t('admin.layout.primaryNav')">
            <RouterLink
              v-for="item in navItems"
              :key="item.key"
              class="nav-link"
              :class="{ active: item.active }"
              :to="item.to"
              :data-testid="item.testId"
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>
      </aside>

      <aside
        class="admin-mobile-drawer admin-surface"
        :class="{ open: isMobileNavOpen }"
        data-testid="admin-mobile-drawer"
      >
        <div class="admin-mobile-drawer-head">
          <p class="section-title admin-panel-title">{{ t('admin.layout.panel') }}</p>
          <button
            type="button"
            class="admin-drawer-close"
            :aria-label="t('admin.layout.closeMenu')"
            @click="closeMobileNav"
          >
            x
          </button>
        </div>

        <nav class="sidebar-nav" :aria-label="t('admin.layout.primaryNav')">
          <RouterLink
            v-for="item in navItems"
            :key="`${item.key}-mobile`"
            class="nav-link"
            :class="{ active: item.active }"
            :to="item.to"
            :data-testid="item.mobileTestId"
            @click="closeMobileNav"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <section class="admin-mobile-actions" data-testid="admin-mobile-actions">
          <p class="eyebrow">{{ t('admin.layout.globalActions') }}</p>
          <div class="admin-mobile-action-list">
            <AdminLocaleSwitcher />
            <RouterLink class="admin-shell-button secondary" to="/" @click="closeMobileNav">
              {{ t('common.actions.backToSite') }}
            </RouterLink>
            <RouterLink class="admin-shell-button primary" to="/admin/posts/new" @click="closeMobileNav">
              {{ t('common.actions.newPost') }}
            </RouterLink>
            <RouterLink
              class="admin-user-menu-action"
              to="/admin/change-password"
              data-testid="admin-mobile-action-change-password"
              @click="closeMobileNav"
            >
              {{ t('common.actions.changePassword') }}
            </RouterLink>
            <button
              class="admin-user-menu-action"
              type="button"
              data-testid="admin-mobile-action-logout"
              :disabled="logoutPending"
              @click="handleMobileLogout"
            >
              {{ t('common.actions.logout') }}
            </button>
          </div>
        </section>
      </aside>

      <section class="admin-main">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import '../style.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AdminLocaleSwitcher from '../components/admin/AdminLocaleSwitcher.vue'
import { authState, logout } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const isUserMenuOpen = ref(false)
const isMobileNavOpen = ref(false)
const logoutPending = ref(false)
const logoutError = ref('')
const userMenuRef = ref<HTMLElement | null>(null)

const navItems = computed(() => [
  {
    key: 'dashboard',
    label: t('admin.layout.dashboard'),
    to: '/admin',
    active: route.path === '/admin',
    testId: 'admin-nav-dashboard',
    mobileTestId: 'admin-mobile-nav-dashboard',
  },
  {
    key: 'login-records',
    label: t('admin.layout.loginRecords'),
    to: '/admin/login-records',
    active: route.path.startsWith('/admin/login-records'),
    testId: 'admin-nav-login-records',
    mobileTestId: 'admin-mobile-nav-login-records',
  },
  {
    key: 'posts',
    label: t('admin.layout.posts'),
    to: '/admin/posts',
    active: route.path.startsWith('/admin/posts'),
    testId: 'admin-nav-posts',
    mobileTestId: 'admin-mobile-nav-posts',
  },
  {
    key: 'tags',
    label: t('admin.layout.tags'),
    to: '/admin/tags',
    active: route.path.startsWith('/admin/tags'),
    testId: 'admin-nav-tags',
    mobileTestId: 'admin-mobile-nav-tags',
  },
])

const adminIdentityLabel = computed(() => (
  authState.profile?.displayName
  ?? authState.profile?.username
  ?? t('common.statusValues.admin')
))

function closeMobileNav() {
  isMobileNavOpen.value = false
}

function toggleMobileNav() {
  isMobileNavOpen.value = !isMobileNavOpen.value
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
  if (isUserMenuOpen.value) {
    logoutError.value = ''
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (!isUserMenuOpen.value) {
    return
  }

  const target = event.target
  if (!(target instanceof Node)) {
    return
  }

  if (!userMenuRef.value?.contains(target)) {
    isUserMenuOpen.value = false
  }
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return
  }

  isUserMenuOpen.value = false
  closeMobileNav()
}

async function handleLogout() {
  if (logoutPending.value) {
    return
  }

  logoutPending.value = true
  logoutError.value = ''

  try {
    await logout()
    isUserMenuOpen.value = false
    await router.push('/admin/login')
  } catch (error) {
    logoutError.value = error instanceof Error ? error.message : t('common.messages.logoutFailed')
  } finally {
    logoutPending.value = false
  }
}

async function handleMobileLogout() {
  closeMobileNav()
  await handleLogout()
}

watch(() => route.fullPath, () => {
  isUserMenuOpen.value = false
  closeMobileNav()
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>
