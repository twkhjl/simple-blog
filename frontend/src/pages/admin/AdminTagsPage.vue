<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminTagsService } from '../../services/adminTags'
import type { AdminTag } from '../../types'

const { t } = useI18n()
const tags = ref<AdminTag[]>([])
const loading = ref(true)
const error = ref('')
const newTagName = ref('')
const search = ref('')

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

async function handleCreateTag() {
  if (!newTagName.value.trim()) {
    return
  }

  try {
    const created = await adminTagsService.createTag(newTagName.value)
    const next = tags.value.filter(tag => tag.id !== created.id)
    tags.value = [...next, created].sort((a, b) => a.name.localeCompare(b.name))
    newTagName.value = ''
  } catch (createError) {
    error.value = createError instanceof Error ? createError.message : t('admin.tags.createError')
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

async function renameTag(tag: AdminTag) {
  const nextName = window.prompt(t('admin.tags.renamePrompt'), tag.name)
  if (!nextName || nextName.trim() === tag.name) {
    return
  }

  try {
    const updated = await adminTagsService.updateTag(tag.id, nextName)
    tags.value = tags.value.map(item => item.id === tag.id ? updated : item)
  } catch (renameError) {
    error.value = renameError instanceof Error ? renameError.message : t('admin.tags.renameError')
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
    </div>

    <p v-if="error" class="status-message error">{{ error }}</p>

    <div class="neo-shell" style="padding: 1.4rem;">
      <div class="inline-actions" style="align-items: stretch;">
        <input v-model="newTagName" class="neo-input" type="text" :placeholder="t('admin.tags.newPlaceholder')">
        <button type="button" class="neo-button primary" @click="handleCreateTag">{{ t('admin.tags.create') }}</button>
      </div>
      <div class="field" style="margin-top: 1rem;">
        <span class="field-label">{{ t('admin.tags.search') }}</span>
        <input v-model="search" class="neo-input" type="text" :placeholder="t('admin.tags.searchPlaceholder')">
      </div>
    </div>

    <div v-if="loading" class="status-message">{{ t('admin.tags.loading') }}</div>
    <div v-else-if="!filteredTags.length" class="empty-shell neo-shell">
      <p class="section-title">{{ t('admin.tags.emptyTitle') }}</p>
      <p class="section-copy">{{ t('admin.tags.emptyCopy') }}</p>
    </div>
    <div v-else class="list-shell">
      <article v-for="tag in filteredTags" :key="tag.id" class="list-row neo-card">
        <div class="list-row-main">
          <h2 class="list-row-title">{{ tag.name }}</h2>
          <div class="list-row-meta">
            <span>{{ tag.slug }}</span>
            <span>{{ tag.postCount }} posts</span>
            <span>{{ t(`common.statusValues.${tag.status}`) }}</span>
          </div>
        </div>
        <div class="inline-actions" style="justify-content: flex-end;">
          <button type="button" class="neo-button secondary" @click="renameTag(tag)">{{ t('common.actions.edit') }}</button>
          <button type="button" class="neo-button" @click="toggleStatus(tag)">
            {{ tag.status === 'active' ? t('admin.tags.disable') : t('admin.tags.enable') }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
