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
      <div v-else class="stack-card">
        <article v-for="item in records.items" :key="item.id" class="neo-panel stack-card">
          <p class="stat-label">{{ item.identifier }}</p>
          <p class="section-copy">{{ item.ipAddress ?? t('admin.loginRecords.noIp') }}</p>
          <p class="section-copy">{{ item.userAgent ?? t('admin.loginRecords.noUserAgent') }}</p>
          <p class="section-copy">{{ item.failureReason ?? t('admin.loginRecords.noFailureReason') }}</p>
        </article>
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
import type { LoginRecordsResponse } from '../../types'

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
