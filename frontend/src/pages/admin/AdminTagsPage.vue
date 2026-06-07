<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminModal from '../../components/admin/AdminModal.vue'
import { adminTagsService } from '../../services/adminTags'
import type { AdminTag } from '../../types'

const { t } = useI18n()
const tags = ref<AdminTag[]>([])
const loading = ref(true)
const error = ref('')
const modalError = ref('')
const search = ref('')
const isCreateEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const activeTag = ref<AdminTag | null>(null)
const modalTagName = ref('')

const filteredTags = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) {
    return tags.value
  }

  return tags.value.filter(tag =>
    tag.name.toLowerCase().includes(keyword)
    || tag.slug.toLowerCase().includes(keyword),
  )
})

const createEditTitle = computed(() => modalMode.value === 'create'
  ? t('admin.tags.createTitle')
  : t('admin.tags.editTitle'))

async function loadTags() {
  loading.value = true
  error.value = ''

  try {
    tags.value = await adminTagsService.listTags()
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : t('admin.tags.loadError')
  } finally {
    loading.value = false
  }
}

function closeCreateEditModal() {
  isCreateEditModalOpen.value = false
  activeTag.value = null
  modalTagName.value = ''
  modalError.value = ''
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
  activeTag.value = null
  modalError.value = ''
}

function openCreateModal() {
  modalMode.value = 'create'
  activeTag.value = null
  modalTagName.value = ''
  modalError.value = ''
  isCreateEditModalOpen.value = true
}

function openEditModal(tag: AdminTag) {
  modalMode.value = 'edit'
  activeTag.value = tag
  modalTagName.value = tag.name
  modalError.value = ''
  isCreateEditModalOpen.value = true
}

function openDeleteModal(tag: AdminTag) {
  activeTag.value = tag
  modalError.value = ''
  isDeleteModalOpen.value = true
}

async function submitCreateEdit() {
  if (!modalTagName.value.trim()) {
    return
  }

  try {
    if (modalMode.value === 'create') {
      const created = await adminTagsService.createTag(modalTagName.value)
      const next = tags.value.filter(tag => tag.id !== created.id)
      tags.value = [...next, created].sort((a, b) => a.name.localeCompare(b.name))
      closeCreateEditModal()
      return
    }

    if (!activeTag.value) {
      return
    }

    const updated = await adminTagsService.updateTag(activeTag.value.id, modalTagName.value)
    tags.value = tags.value
      .map(item => item.id === activeTag.value?.id ? updated : item)
      .sort((a, b) => a.name.localeCompare(b.name))
    closeCreateEditModal()
  } catch (submitError) {
    modalError.value = submitError instanceof Error
      ? submitError.message
      : modalMode.value === 'create'
        ? t('admin.tags.createError')
        : t('admin.tags.renameError')
  }
}

async function toggleStatus(tag: AdminTag) {
  try {
    const updated = await adminTagsService.updateTagStatus(tag.id, tag.status === 'active' ? 'disabled' : 'active')
    tags.value = tags.value.map(item => item.id === tag.id ? updated : item)
  } catch (toggleError) {
    error.value = toggleError instanceof Error ? toggleError.message : t('admin.tags.statusError')
  }
}

async function handleDeleteTag() {
  if (!activeTag.value) {
    return
  }

  try {
    await adminTagsService.deleteTag(activeTag.value.id)
    tags.value = tags.value.filter(item => item.id !== activeTag.value?.id)
    closeDeleteModal()
  } catch (deleteError) {
    modalError.value = deleteError instanceof Error ? deleteError.message : t('admin.tags.deleteError')
  }
}

onMounted(() => {
  void loadTags()
})
</script>

<template>
  <section class="page-stack">
    <div class="page-hero neo-shell">
      <p class="eyebrow">{{ t('admin.tags.eyebrow') }}</p>
      <h1 class="hero-title" style="font-size: clamp(2rem, 5vw, 3.6rem);">{{ t('admin.tags.title') }}</h1>
      <p class="hero-copy">{{ t('admin.tags.copy') }}</p>
      <div class="inline-actions">
        <button type="button" class="neo-button primary" data-testid="admin-tag-create-open" @click="openCreateModal">
          {{ t('admin.tags.create') }}
        </button>
      </div>
    </div>

    <p v-if="error" class="status-message error">{{ error }}</p>

    <div class="neo-shell" style="padding: 1.4rem;">
      <div class="field">
        <span class="field-label">{{ t('admin.tags.search') }}</span>
        <input v-model="search" class="neo-input" type="text" :placeholder="t('admin.tags.searchPlaceholder')">
      </div>
    </div>

    <div v-if="loading" class="status-message">{{ t('admin.tags.loading') }}</div>
    <div v-else-if="!filteredTags.length" class="empty-shell neo-shell">
      <p class="section-title">{{ t('admin.tags.emptyTitle') }}</p>
      <p class="section-copy">{{ t('admin.tags.emptyCopy') }}</p>
    </div>
    <div v-else class="neo-panel stack-card">
      <div class="admin-tags-table-shell">
        <table class="admin-tags-table">
          <thead>
            <tr>
              <th scope="col">{{ t('admin.contactMessages.name') }}</th>
              <th scope="col">{{ t('common.labels.slug') }}</th>
              <th scope="col">{{ t('common.labels.status') }}</th>
              <th scope="col">{{ t('admin.tags.postCount') }}</th>
              <th scope="col">{{ t('admin.tags.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tag in filteredTags" :key="tag.id">
              <td>{{ tag.name }}</td>
              <td>{{ tag.slug }}</td>
              <td>
                <span class="status-badge" :class="tag.status">{{ t(`common.statusValues.${tag.status}`) }}</span>
              </td>
              <td>{{ tag.postCount }}</td>
              <td>
                <div class="inline-actions" style="justify-content: flex-end;">
                  <button type="button" class="neo-button secondary" data-testid="admin-tag-edit" @click="openEditModal(tag)">{{ t('common.actions.edit') }}</button>
                  <button type="button" class="neo-button" data-testid="admin-tag-status" @click="toggleStatus(tag)">
                    {{ tag.status === 'active' ? t('admin.tags.disable') : t('admin.tags.enable') }}
                  </button>
                  <button type="button" class="neo-button danger" data-testid="admin-tag-delete" @click="openDeleteModal(tag)">
                    {{ t('common.actions.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AdminModal :open="isCreateEditModalOpen" :title="createEditTitle" @close="closeCreateEditModal">
      <div class="field">
        <span class="field-label">{{ t('admin.tags.nameLabel') }}</span>
        <input v-model="modalTagName" data-testid="admin-tag-name-input" class="neo-input" type="text" :placeholder="t('admin.tags.newPlaceholder')">
      </div>
      <p v-if="modalError" class="status-message error" style="margin-top: 1rem;">{{ modalError }}</p>

      <template #footer>
        <button type="button" class="neo-button" @click="closeCreateEditModal">{{ t('common.actions.cancel') }}</button>
        <button type="button" class="neo-button primary" data-testid="admin-tag-submit" @click="submitCreateEdit">{{ t('common.actions.save') }}</button>
      </template>
    </AdminModal>

    <AdminModal :open="isDeleteModalOpen" :title="t('admin.tags.deleteTitle')" @close="closeDeleteModal">
      <p>{{ t('admin.tags.deleteConfirm', { name: activeTag?.name ?? '' }) }}</p>
      <p v-if="modalError" class="status-message error" style="margin-top: 1rem;">{{ modalError }}</p>

      <template #footer>
        <button type="button" class="neo-button" @click="closeDeleteModal">{{ t('common.actions.cancel') }}</button>
        <button type="button" class="neo-button danger" data-testid="admin-tag-delete-confirm" @click="handleDeleteTag">{{ t('common.actions.delete') }}</button>
      </template>
    </AdminModal>
  </section>
</template>

<style scoped>
.admin-tags-table-shell {
  overflow-x: auto;
}

.admin-tags-table {
  width: 100%;
  min-width: 52rem;
  border-collapse: collapse;
}

.admin-tags-table th,
.admin-tags-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  text-align: left;
  vertical-align: top;
}

.admin-tags-table th {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.72);
}

.admin-tags-table td {
  color: rgba(241, 245, 249, 0.94);
}
</style>
