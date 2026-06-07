<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminModal from '../../components/admin/AdminModal.vue'
import { adminContactMessagesService } from '../../services/adminContactMessages'
import type { AdminContactMessageDetail, AdminContactMessageListItem, ContactMessageStatus } from '../../types'

const { locale, t } = useI18n()
const messages = ref<AdminContactMessageListItem[]>([])
const selectedMessage = ref<AdminContactMessageDetail | null>(null)
const loading = ref(true)
const detailLoading = ref(false)
const error = ref('')
const modalError = ref('')
const search = ref('')
const statusFilter = ref<ContactMessageStatus | 'all'>('all')
const isDetailModalOpen = ref(false)

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
        closeDetailModal()
      }
    }
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('admin.contactMessages.loadError')
  } finally {
    loading.value = false
  }
}

function closeDetailModal() {
  isDetailModalOpen.value = false
  selectedMessage.value = null
  detailLoading.value = false
  modalError.value = ''
}

async function selectMessage(messageId: string) {
  isDetailModalOpen.value = true
  selectedMessage.value = null
  detailLoading.value = true
  modalError.value = ''

  try {
    selectedMessage.value = await adminContactMessagesService.getMessage(messageId)
  } catch (fetchError) {
    modalError.value = fetchError instanceof Error ? fetchError.message : t('admin.contactMessages.loadDetailError')
  } finally {
    detailLoading.value = false
  }
}

async function updateStatus(message: AdminContactMessageListItem | AdminContactMessageDetail, status: ContactMessageStatus) {
  error.value = ''
  modalError.value = ''

  try {
    const updated = await adminContactMessagesService.updateStatus(message.id, status)
    messages.value = messages.value.map(item => item.id === updated.id ? updated : item)
    if (selectedMessage.value?.id === updated.id) {
      selectedMessage.value = updated
    }
  } catch (updateError) {
    const nextError = updateError instanceof Error ? updateError.message : t('admin.contactMessages.updateError')
    error.value = nextError
    modalError.value = nextError
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

    <div v-if="loading" class="status-message">{{ t('admin.contactMessages.loading') }}</div>
    <div v-else-if="!messages.length" class="empty-shell neo-shell">
      <p class="section-title">{{ t('admin.contactMessages.emptyTitle') }}</p>
      <p class="section-copy">{{ t('admin.contactMessages.emptyCopy') }}</p>
    </div>
    <div v-else class="neo-panel stack-card">
      <div class="admin-contact-table-shell">
        <table class="admin-contact-table">
          <thead>
            <tr>
              <th scope="col">{{ t('admin.contactMessages.subject') }}</th>
              <th scope="col">{{ t('admin.contactMessages.name') }}</th>
              <th scope="col">{{ t('common.labels.email') }}</th>
              <th scope="col">{{ t('common.labels.created') }}</th>
              <th scope="col">{{ t('common.labels.status') }}</th>
              <th scope="col">{{ t('admin.tags.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="message in messages" :key="message.id" data-testid="admin-contact-row">
              <td>{{ message.subject }}</td>
              <td>{{ message.name }}</td>
              <td>{{ message.email }}</td>
              <td>{{ formatDate(message.createdAt) }}</td>
              <td>
                <span class="status-badge" :class="message.status === 'pending' ? 'draft' : 'published'">
                  {{ t(`admin.contactMessages.status${message.status === 'pending' ? 'Pending' : 'Processed'}`) }}
                </span>
              </td>
              <td>
                <div class="inline-actions" style="justify-content: flex-end;">
                  <button type="button" class="neo-button secondary" data-testid="admin-contact-view" @click="selectMessage(message.id)">
                    {{ t('admin.contactMessages.viewDetail') }}
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AdminModal :open="isDetailModalOpen" :title="t('admin.contactMessages.detailTitle')" @close="closeDetailModal">
      <p v-if="modalError" class="status-message error">{{ modalError }}</p>
      <p v-else-if="detailLoading" class="status-message">{{ t('admin.contactMessages.loadingDetail') }}</p>
      <template v-else-if="selectedMessage">
        <div class="metadata-list">
          <div class="metadata-row">
            <span class="metadata-label">{{ t('admin.contactMessages.subject') }}</span>
            <span class="metadata-value">{{ selectedMessage.subject }}</span>
          </div>
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
          <div class="metadata-row">
            <span class="metadata-label">{{ t('admin.contactMessages.processedAt') }}</span>
            <span class="metadata-value">{{ formatDate(selectedMessage.processedAt) }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.ipAddress') }}</span>
            <span class="metadata-value">{{ selectedMessage.requestIp ?? t('auth.loginRecords.noIp') }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.userAgent') }}</span>
            <span class="metadata-value">{{ selectedMessage.userAgent ?? t('auth.loginRecords.noUserAgent') }}</span>
          </div>
        </div>

        <div class="field" style="margin-top: 1rem;">
          <span class="field-label">{{ t('admin.contactMessages.message') }}</span>
          <div class="neo-panel" style="white-space: pre-wrap; line-height: 1.75;">{{ selectedMessage.message }}</div>
        </div>
      </template>

      <template #footer>
        <button type="button" class="neo-button" @click="closeDetailModal">{{ t('common.actions.close') }}</button>
        <button
          v-if="selectedMessage"
          type="button"
          class="neo-button primary"
          data-testid="admin-contact-modal-status"
          @click="updateStatus(selectedMessage, selectedMessage.status === 'pending' ? 'processed' : 'pending')"
        >
          {{ selectedMessage.status === 'pending' ? t('admin.contactMessages.markProcessed') : t('admin.contactMessages.markPending') }}
        </button>
      </template>
    </AdminModal>
  </section>
</template>

<style scoped>
.admin-contact-table-shell {
  overflow-x: auto;
}

.admin-contact-table {
  width: 100%;
  min-width: 70rem;
  border-collapse: collapse;
}

.admin-contact-table th,
.admin-contact-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  text-align: left;
  vertical-align: top;
}

.admin-contact-table th {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.72);
}

.admin-contact-table td {
  color: rgba(241, 245, 249, 0.94);
}
</style>
