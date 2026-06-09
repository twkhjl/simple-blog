<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminModal from '../../components/admin/AdminModal.vue'
import { adminCommentsService } from '../../services/adminComments'
import type { AdminCommentDetail, AdminCommentListItem, CommentStatus } from '../../types'

const { locale, t } = useI18n()
const comments = ref<AdminCommentListItem[]>([])
const selectedComment = ref<AdminCommentDetail | null>(null)
const loading = ref(true)
const detailLoading = ref(false)
const deleting = ref(false)
const error = ref('')
const modalError = ref('')
const search = ref('')
const statusFilter = ref<CommentStatus | 'all'>('all')
const isDetailModalOpen = ref(false)
const confirmingDeleteId = ref<string | null>(null)

const statusOptions = computed(() => ([
  { value: 'all', label: t('admin.comments.statusAll') },
  { value: 'pending', label: t('admin.comments.statusPending') },
  { value: 'approved', label: t('admin.comments.statusApproved') },
  { value: 'hidden', label: t('admin.comments.statusHidden') },
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

function statusLabel(status: CommentStatus) {
  if (status === 'approved') {
    return t('admin.comments.statusApproved')
  }
  if (status === 'hidden') {
    return t('admin.comments.statusHidden')
  }
  return t('admin.comments.statusPending')
}

async function loadComments() {
  loading.value = true
  error.value = ''

  try {
    comments.value = await adminCommentsService.listComments({
      status: statusFilter.value,
      search: search.value,
    })
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('admin.comments.loadError')
  } finally {
    loading.value = false
  }
}

function closeDetailModal() {
  isDetailModalOpen.value = false
  selectedComment.value = null
  detailLoading.value = false
  modalError.value = ''
}

async function selectComment(commentId: string) {
  isDetailModalOpen.value = true
  selectedComment.value = null
  detailLoading.value = true
  modalError.value = ''

  try {
    selectedComment.value = await adminCommentsService.getComment(commentId)
  } catch (fetchError) {
    modalError.value = fetchError instanceof Error ? fetchError.message : t('admin.comments.loadDetailError')
  } finally {
    detailLoading.value = false
  }
}

async function updateStatus(item: AdminCommentListItem | AdminCommentDetail, status: CommentStatus) {
  error.value = ''
  modalError.value = ''

  try {
    const updated = await adminCommentsService.updateStatus(item.id, status)
    comments.value = comments.value.map(comment =>
      comment.id === updated.id
        ? {
            ...comment,
            status: updated.status,
            approvedAt: updated.approvedAt,
          }
        : comment,
    )
    if (selectedComment.value?.id === updated.id) {
      selectedComment.value = updated
    }
  } catch (updateError) {
    const nextError = updateError instanceof Error ? updateError.message : t('admin.comments.updateError')
    error.value = nextError
    modalError.value = nextError
  }
}

async function confirmDelete(commentId: string) {
  deleting.value = true
  error.value = ''

  try {
    await adminCommentsService.deleteComment(commentId)
    confirmingDeleteId.value = null
    closeDetailModal()
    await loadComments()
  } catch (deleteError) {
    error.value = deleteError instanceof Error ? deleteError.message : t('admin.comments.deleteError')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  void loadComments()
})
</script>

<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.comments.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.6rem);">{{ t('admin.comments.title') }}</h1>
      <p class="hero-copy">{{ t('admin.comments.copy') }}</p>
    </div>

    <p v-if="error" class="status-message error">{{ error }}</p>

    <div class="neo-shell" style="padding: 1.4rem;">
      <div class="inline-actions" style="align-items: end; gap: 1rem; flex-wrap: wrap;">
        <div class="field" style="flex: 1 1 18rem;">
          <span class="field-label">{{ t('admin.comments.search') }}</span>
          <input v-model="search" class="neo-input" type="text" :placeholder="t('admin.comments.searchPlaceholder')" @keyup.enter="loadComments">
        </div>
        <div class="field" style="width: min(14rem, 100%);">
          <span class="field-label">{{ t('admin.comments.statusFilter') }}</span>
          <select v-model="statusFilter" class="neo-select" @change="loadComments">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
        <button type="button" class="neo-button primary" @click="loadComments">{{ t('admin.comments.applyFilters') }}</button>
      </div>
    </div>

    <div v-if="loading" class="status-message">{{ t('admin.comments.loading') }}</div>
    <div v-else-if="!comments.length" class="empty-shell neo-shell">
      <p class="section-title">{{ t('admin.comments.emptyTitle') }}</p>
      <p class="section-copy">{{ t('admin.comments.emptyCopy') }}</p>
    </div>
    <div v-else class="neo-panel stack-card">
      <div style="overflow-x: auto;">
        <table style="width: 100%; min-width: 78rem; border-collapse: collapse;">
          <thead>
            <tr>
              <th>{{ t('admin.comments.post') }}</th>
              <th>{{ t('admin.comments.author') }}</th>
              <th>{{ t('common.labels.email') }}</th>
              <th>{{ t('admin.comments.preview') }}</th>
              <th>{{ t('admin.comments.parent') }}</th>
              <th>{{ t('common.labels.status') }}</th>
              <th>{{ t('common.labels.created') }}</th>
              <th>{{ t('admin.tags.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comment in comments" :key="comment.id" data-testid="admin-comment-row">
              <td>{{ comment.postTitle ?? t('common.status.notSet') }}</td>
              <td>{{ comment.authorName }}</td>
              <td>{{ comment.authorEmail }}</td>
              <td>{{ comment.bodyPreview }}</td>
              <td>{{ comment.parentBody ?? t('common.status.notSet') }}</td>
              <td>{{ statusLabel(comment.status) }}</td>
              <td>{{ formatDate(comment.createdAt) }}</td>
              <td>
                <div class="inline-actions" style="justify-content: flex-end;">
                  <button type="button" class="neo-button secondary" data-testid="admin-comment-view" @click="selectComment(comment.id)">
                    {{ t('common.actions.viewDetail') }}
                  </button>
                  <button
                    v-if="comment.status !== 'approved'"
                    type="button"
                    class="neo-button"
                    data-testid="admin-comment-approve"
                    @click="updateStatus(comment, 'approved')"
                  >
                    {{ t('admin.comments.approve') }}
                  </button>
                  <button type="button" class="neo-button" data-testid="admin-comment-delete" @click="confirmingDeleteId = comment.id">
                    {{ t('common.actions.delete') }}
                  </button>
                  <button
                    v-if="confirmingDeleteId === comment.id"
                    type="button"
                    class="neo-button primary"
                    data-testid="admin-comment-confirm-delete"
                    :disabled="deleting"
                    @click="confirmDelete(comment.id)"
                  >
                    {{ t('admin.comments.confirmDelete') }}
                  </button>
                </div>
                <p v-if="confirmingDeleteId === comment.id" class="status-message error">
                  {{ t('admin.comments.deleteWarning') }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AdminModal :open="isDetailModalOpen" :title="t('admin.comments.detailTitle')" @close="closeDetailModal">
      <p v-if="modalError" class="status-message error">{{ modalError }}</p>
      <p v-else-if="detailLoading" class="status-message">{{ t('admin.comments.loadingDetail') }}</p>
      <template v-else-if="selectedComment">
        <div class="metadata-list">
          <div class="metadata-row">
            <span class="metadata-label">{{ t('admin.comments.post') }}</span>
            <span class="metadata-value">{{ selectedComment.postTitle ?? t('common.status.notSet') }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('admin.comments.author') }}</span>
            <span class="metadata-value">{{ selectedComment.authorName }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.email') }}</span>
            <span class="metadata-value">{{ selectedComment.authorEmail }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.status') }}</span>
            <span class="metadata-value">{{ statusLabel(selectedComment.status) }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('admin.comments.parent') }}</span>
            <span class="metadata-value">{{ selectedComment.parent?.body ?? t('common.status.notSet') }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.created') }}</span>
            <span class="metadata-value">{{ formatDate(selectedComment.createdAt) }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.updated') }}</span>
            <span class="metadata-value">{{ formatDate(selectedComment.updatedAt) }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('admin.comments.approvedAt') }}</span>
            <span class="metadata-value">{{ formatDate(selectedComment.approvedAt) }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.ipAddress') }}</span>
            <span class="metadata-value">{{ selectedComment.requestIp ?? t('auth.loginRecords.noIp') }}</span>
          </div>
          <div class="metadata-row">
            <span class="metadata-label">{{ t('common.labels.userAgent') }}</span>
            <span class="metadata-value">{{ selectedComment.userAgent ?? t('auth.loginRecords.noUserAgent') }}</span>
          </div>
        </div>

        <div class="field" style="margin-top: 1rem;">
          <span class="field-label">{{ t('admin.comments.comment') }}</span>
          <div class="neo-panel" style="white-space: pre-wrap; line-height: 1.75;">{{ selectedComment.body }}</div>
        </div>
      </template>
    </AdminModal>
  </section>
</template>
