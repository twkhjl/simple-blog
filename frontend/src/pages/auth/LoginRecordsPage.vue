<template>
  <main class="admin-login-shell">
    <section class="admin-login-layout" style="grid-template-columns: minmax(0, 1fr);">
      <div class="admin-login-brand-panel admin-card">
        <p class="admin-kicker">{{ t('auth.loginRecords.eyebrow') }}</p>
        <h1 class="admin-page-title">{{ t('auth.loginRecords.title') }}</h1>
        <p class="admin-page-copy">{{ t('auth.loginRecords.copy') }}</p>
      </div>

      <section class="admin-login-card admin-card">
        <div class="inline-actions" style="margin-bottom: 1rem;">
          <label class="admin-field" style="margin: 0;">
            <span>{{ t('auth.loginRecords.resultFilter') }}</span>
            <select v-model="resultFilter" name="result" @change="reload(1)">
              <option value="all">{{ t('auth.loginRecords.allResults') }}</option>
              <option value="success">{{ t('auth.loginRecords.successOnly') }}</option>
              <option value="failure">{{ t('auth.loginRecords.failureOnly') }}</option>
            </select>
          </label>
        </div>

        <p v-if="errorMessage" class="admin-status error">{{ errorMessage }}</p>
        <p v-else-if="loading" class="admin-status">{{ t('auth.loginRecords.loading') }}</p>
        <div v-else class="stack-card">
          <article v-for="item in records.items" :key="item.id" class="neo-panel stack-card">
            <p class="stat-label">{{ item.identifier }}</p>
            <p class="section-copy">{{ item.ipAddress ?? t('auth.loginRecords.noIp') }}</p>
            <p class="section-copy">{{ item.userAgent ?? t('auth.loginRecords.noUserAgent') }}</p>
            <p class="section-copy">{{ item.failureReason ?? t('auth.loginRecords.noFailureReason') }}</p>
          </article>
        </div>

        <div class="inline-actions" style="margin-top: 1rem;">
          <button class="neo-button" type="button" :disabled="records.page <= 1" @click="reload(records.page - 1)">
            {{ t('auth.loginRecords.previous') }}
          </button>
          <button
            class="neo-button"
            type="button"
            :disabled="records.page * records.limit >= records.total"
            @click="reload(records.page + 1)"
          >
            {{ t('auth.loginRecords.next') }}
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LoginRecordsResponse } from '../../types'
import { listMyLoginRecords } from '../../services/loginRecords'

const { t } = useI18n()
const loading = ref(false)
const errorMessage = ref('')
const resultFilter = ref<'all' | 'success' | 'failure'>('all')
const records = ref<LoginRecordsResponse>({
  items: [],
  page: 1,
  limit: 20,
  total: 0,
})

async function reload(page = 1) {
  loading.value = true
  errorMessage.value = ''

  try {
    records.value = await listMyLoginRecords({
      page,
      result: resultFilter.value,
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
