<template>
  <div class="admin-theme">
    <header class="admin-header">
      <div class="container">
        <div class="admin-header-inner admin-surface">
          <div class="brand-block">
            <p class="brand-mark">{{ t('admin.layout.brandTitle') }}</p>
            <p class="brand-copy">{{ t('admin.layout.brandCopy') }}</p>
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

    <main class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-surface admin-sidebar-panel">
          <div class="brand-block admin-sidebar-intro">
            <p class="eyebrow">{{ t('admin.layout.workspace') }}</p>
            <p class="section-title admin-panel-title">{{ t('admin.layout.panel') }}</p>
          </div>

          <nav class="sidebar-nav">
            <RouterLink class="nav-link" :class="{ active: route.path === '/admin' }" to="/admin">
              {{ t('admin.layout.dashboard') }}
            </RouterLink>
            <RouterLink class="nav-link" :class="{ active: route.path.startsWith('/admin/posts') }" to="/admin/posts">
              {{ t('admin.layout.posts') }}
            </RouterLink>
          </nav>
        </div>
      </aside>

      <section class="admin-main">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import '../style.css'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AdminLocaleSwitcher from '../components/admin/AdminLocaleSwitcher.vue'
import { authState, logout } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const isUserMenuOpen = ref(false)
const logoutPending = ref(false)
const logoutError = ref('')
const userMenuRef = ref<HTMLElement | null>(null)

const adminIdentityLabel = computed(() => (
  authState.profile?.displayName
  ?? authState.profile?.username
  ?? t('common.statusValues.admin')
))

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

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
