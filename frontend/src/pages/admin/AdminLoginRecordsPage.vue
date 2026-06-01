<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.loginRecords.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.4rem);">{{ t('admin.loginRecords.title') }}</h1>
      <p class="hero-copy">{{ t('admin.loginRecords.copy') }}</p>
    </div>

    <section class="neo-panel stack-card">
      <div class="inline-actions">
        <label v-if="canSwitchSurface" class="admin-field">
          <span>{{ t('admin.loginRecords.surfaceFilter') }}</span>
          <select v-model="surfaceFilter" name="surface" @change="reload(1)">
            <option value="admin">{{ t('admin.loginRecords.adminSurface') }}</option>
            <option value="front">{{ t('admin.loginRecords.frontSurface') }}</option>
          </select>
        </label>

        <label class="admin-field">
          <span>{{ t('admin.loginRecords.resultFilter') }}</span>
          <select v-model="resultFilter" name="result" @change="reload(1)">
            <option value="all">{{ t('admin.loginRecords.allResults') }}</option>
            <option value="success">{{ t('admin.loginRecords.successOnly') }}</option>
            <option value="failure">{{ t('admin.loginRecords.failureOnly') }}</option>
          </select>
        </label>

        <label class="admin-field">
          <span>{{ t('admin.loginRecords.identifierFilter') }}</span>
          <input v-model="identifierFilter" name="identifier" type="text" @change="reload(1)">
        </label>
      </div>

      <p v-if="errorMessage" class="admin-status error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="admin-status">{{ t('admin.loginRecords.loading') }}</p>
      <p v-else-if="records.items.length === 0" class="admin-status">{{ t('admin.loginRecords.empty') }}</p>
      <div v-else class="login-records-table-shell">
        <table class="login-records-table">
          <thead>
            <tr>
              <th scope="col">{{ t('admin.loginRecords.createdAt') }}</th>
              <th scope="col">{{ t('admin.loginRecords.surface') }}</th>
              <th scope="col">{{ t('admin.loginRecords.result') }}</th>
              <th scope="col">{{ t('admin.loginRecords.name') }}</th>
              <th scope="col">{{ t('admin.loginRecords.loginAccount') }}</th>
              <th scope="col">{{ t('admin.loginRecords.ipAddress') }}</th>
              <th scope="col">{{ t('admin.loginRecords.userAgent') }}</th>
              <th scope="col">{{ t('admin.loginRecords.failureReason') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in records.items" :key="item.id">
              <td>{{ formatTimestamp(item.createdAt) }}</td>
              <td>{{ formatSurface(item.surface) }}</td>
              <td>
                <span class="login-result-chip" :class="item.result">
                  {{ formatResult(item.result) }}
                </span>
              </td>
              <td>{{ formatName(item) }}</td>
              <td>{{ formatLoginAccount(item) }}</td>
              <td>{{ item.ipAddress ?? t('admin.loginRecords.noIp') }}</td>
              <td class="wrapping-cell">{{ item.userAgent ?? t('admin.loginRecords.noUserAgent') }}</td>
              <td class="wrapping-cell">{{ item.failureReason ?? t('admin.loginRecords.noFailureReason') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="inline-actions">
        <button class="neo-button" type="button" :disabled="records.page <= 1" @click="reload(records.page - 1)">
          {{ t('admin.loginRecords.previous') }}
        </button>
        <button
          class="neo-button"
          type="button"
          :disabled="records.page * records.limit >= records.total"
          @click="reload(records.page + 1)"
        >
          {{ t('admin.loginRecords.next') }}
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { listAdminLoginRecords, listAdminUserLoginRecords, listMyLoginRecords } from '../../services/loginRecords'
import { authState } from '../../stores/auth'
import type { LoginRecordItem, LoginRecordUser, LoginRecordsResponse } from '../../types'

const { t } = useI18n()
const loading = ref(false)
const errorMessage = ref('')
const surfaceFilter = ref<'front' | 'admin'>('admin')
const resultFilter = ref<'all' | 'success' | 'failure'>('all')
const identifierFilter = ref('')
const records = ref<LoginRecordsResponse>({
  items: [],
  page: 1,
  limit: 20,
  total: 0,
})

const isGlobalViewer = computed(() => authState.profile?.role === 'admin' || authState.profile?.role === 'super_admin')
const canSwitchSurface = computed(() => isGlobalViewer.value)

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatSurface(surface: 'front' | 'admin') {
  return surface === 'front' ? t('admin.loginRecords.frontSurface') : t('admin.loginRecords.adminSurface')
}

function formatResult(result: 'success' | 'failure') {
  return result === 'success' ? t('admin.loginRecords.successResult') : t('admin.loginRecords.failureResult')
}

function formatUser(user: LoginRecordUser) {
  return user.displayName ?? user.email ?? user.username ?? t('admin.loginRecords.identifier')
}

function formatName(item: LoginRecordItem) {
  return item.user.displayName ?? item.user.username ?? item.user.email ?? item.identifier
}

function formatLoginAccount(item: LoginRecordItem) {
  return item.user.username ?? item.identifier ?? item.user.email ?? formatUser(item.user)
}

async function reload(page = 1) {
  loading.value = true
  errorMessage.value = ''

  try {
    if (!isGlobalViewer.value) {
      records.value = await listMyLoginRecords({ page, result: resultFilter.value })
      return
    }

    if (surfaceFilter.value === 'admin') {
      records.value = await listAdminLoginRecords({
        page,
        result: resultFilter.value,
        identifier: identifierFilter.value,
      })
      return
    }

    records.value = await listAdminUserLoginRecords({
      page,
      surface: surfaceFilter.value,
      result: resultFilter.value,
      identifier: identifierFilter.value,
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('common.messages.loginFailed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.login-records-table-shell {
  overflow-x: auto;
}

.login-records-table {
  width: 100%;
  min-width: 76rem;
  border-collapse: collapse;
}

.login-records-table th,
.login-records-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  text-align: left;
  vertical-align: top;
}

.login-records-table th {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.72);
}

.login-records-table td {
  color: rgba(241, 245, 249, 0.94);
}

.wrapping-cell {
  min-width: 14rem;
  white-space: normal;
  word-break: break-word;
}

.login-result-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.login-result-chip.success {
  background: rgba(34, 197, 94, 0.14);
  color: rgb(134, 239, 172);
}

.login-result-chip.failure {
  background: rgba(248, 113, 113, 0.14);
  color: rgb(252, 165, 165);
}
</style>
