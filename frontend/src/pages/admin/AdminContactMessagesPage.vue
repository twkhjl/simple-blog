<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminContactMessagesService } from '../../services/adminContactMessages'
import type { AdminContactMessageDetail, AdminContactMessageListItem, ContactMessageStatus } from '../../types'

const { locale, t } = useI18n()
const messages = ref<AdminContactMessageListItem[]>([])
const selectedMessage = ref<AdminContactMessageDetail | null>(null)
const loading = ref(true)
const detailLoading = ref(false)
const error = ref('')
const search = ref('')
const statusFilter = ref<ContactMessageStatus | 'all'>('all')

const statusOptions = computed(() => ([
  { value: 'all', label: t('admin.contactMessages.statusAll') },
  { value: 'pending', label: t('admin.contactMessages.statusPending') },
  { value: 'processed', label: t('admin.contactMessages.statusProcessed') },
]))

function formatDate(value: string | null) {
  if (!value) {
    return t('common.status.notSet')
  }

  return new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function loadMessages() {
  loading.value = true
  error.value = ''

  try {
    messages.value = await adminContactMessagesService.listMessages({
      status: statusFilter.value,
      search: search.value,
    })

    if (selectedMessage.value) {
      const stillExists = messages.value.some(message => message.id === selectedMessage.value?.id)
      if (!stillExists) {
        selectedMessage.value = null
      }
    }
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('admin.contactMessages.loadError')
  } finally {
    loading.value = false
  }
}

async function selectMessage(messageId: string) {
  detailLoading.value = true
  error.value = ''

  try {
    selectedMessage.value = await adminContactMessagesService.getMessage(messageId)
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('admin.contactMessages.loadDetailError')
  } finally {
    detailLoading.value = false
  }
}

async function updateStatus(message: AdminContactMessageListItem | AdminContactMessageDetail, status: ContactMessageStatus) {
  error.value = ''

  try {
    const updated = await adminContactMessagesService.updateStatus(message.id, status)
    messages.value = messages.value.map(item => item.id === updated.id ? updated : item)
    if (selectedMessage.value?.id === updated.id) {
      selectedMessage.value = updated
    }
  } catch (updateError) {
    error.value = updateError instanceof Error ? updateError.message : t('admin.contactMessages.updateError')
  }
}

onMounted(() => {
  void loadMessages()
})
</script>

<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.contactMessages.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.6rem);">{{ t('admin.contactMessages.title') }}</h1>
      <p class="hero-copy">{{ t('admin.contactMessages.copy') }}</p>
    </div>

    <p v-if="error" class="status-message error">{{ error }}</p>

    <div class="neo-shell" style="padding: 1.4rem;">
      <div class="inline-actions" style="align-items: end; gap: 1rem; flex-wrap: wrap;">
        <div class="field" style="flex: 1 1 18rem;">
          <span class="field-label">{{ t('admin.contactMessages.search') }}</span>
          <input v-model="search" class="neo-input" type="text" :placeholder="t('admin.contactMessages.searchPlaceholder')" @keyup.enter="loadMessages">
        </div>
        <div class="field" style="width: min(14rem, 100%);">
          <span class="field-label">{{ t('admin.contactMessages.statusFilter') }}</span>
          <select v-model="statusFilter" class="neo-select" @change="loadMessages">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
        <button type="button" class="neo-button primary" @click="loadMessages">{{ t('admin.contactMessages.applyFilters') }}</button>
      </div>
    </div>

    <div v-if="selectedMessage" class="neo-shell" style="padding: 1.4rem;" data-testid="admin-contact-detail">
      <div class="inline-actions" style="justify-content: space-between; align-items: center;">
        <div>
          <p class="eyebrow">{{ t('admin.contactMessages.detailTitle') }}</p>
          <h2 class="section-title">{{ selectedMessage.subject }}</h2>
        </div>
        <button
          type="button"
          class="neo-button"
          @click="updateStatus(selectedMessage, selectedMessage.status === 'pending' ? 'processed' : 'pending')"
        >
          {{ selectedMessage.status === 'pending' ? t('admin.contactMessages.markProcessed') : t('admin.contactMessages.markPending') }}
        </button>
      </div>

      <div class="metadata-list" style="margin-top: 1rem;">
        <div class="metadata-row">
          <span class="metadata-label">{{ t('admin.contactMessages.name') }}</span>
          <span class="metadata-value">{{ selectedMessage.name }}</span>
        </div>
        <div class="metadata-row">
          <span class="metadata-label">{{ t('common.labels.email') }}</span>
          <span class="metadata-value">{{ selectedMessage.email }}</span>
        </div>
        <div class="metadata-row">
          <span class="metadata-label">{{ t('common.labels.status') }}</span>
          <span class="metadata-value">{{ t(`admin.contactMessages.status${selectedMessage.status === 'pending' ? 'Pending' : 'Processed'}`) }}</span>
        </div>
        <div class="metadata-row">
          <span class="metadata-label">{{ t('common.labels.created') }}</span>
          <span class="metadata-value">{{ formatDate(selectedMessage.createdAt) }}</span>
        </div>
      </div>

      <div class="field" style="margin-top: 1rem;">
        <span class="field-label">{{ t('admin.contactMessages.message') }}</span>
        <div class="neo-panel" style="white-space: pre-wrap; line-height: 1.75;">{{ selectedMessage.message }}</div>
      </div>
    </div>

    <div v-if="loading" class="status-message">{{ t('admin.contactMessages.loading') }}</div>
    <div v-else-if="!messages.length" class="empty-shell neo-shell">
      <p class="section-title">{{ t('admin.contactMessages.emptyTitle') }}</p>
      <p class="section-copy">{{ t('admin.contactMessages.emptyCopy') }}</p>
    </div>
    <div v-else class="list-shell">
      <article v-for="message in messages" :key="message.id" class="list-row neo-card" data-testid="admin-contact-row">
        <div class="list-row-main">
          <h2 class="list-row-title">{{ message.subject }}</h2>
          <div class="list-row-meta">
            <span>{{ message.name }}</span>
            <span>{{ message.email }}</span>
            <span>{{ formatDate(message.createdAt) }}</span>
            <span>{{ t(`admin.contactMessages.status${message.status === 'pending' ? 'Pending' : 'Processed'}`) }}</span>
          </div>
        </div>
        <div class="inline-actions" style="justify-content: flex-end;">
          <button type="button" class="neo-button secondary" data-testid="admin-contact-view" @click="selectMessage(message.id)">
            {{ detailLoading && selectedMessage?.id === message.id ? t('admin.contactMessages.loadingDetail') : t('admin.contactMessages.viewDetail') }}
          </button>
          <button
            type="button"
            class="neo-button"
            data-testid="admin-contact-status"
            @click="updateStatus(message, message.status === 'pending' ? 'processed' : 'pending')"
          >
            {{ message.status === 'pending' ? t('admin.contactMessages.markProcessed') : t('admin.contactMessages.markPending') }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
