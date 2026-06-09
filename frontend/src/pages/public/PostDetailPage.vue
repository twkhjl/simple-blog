<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import PublicCommentThread from '../../components/public/PublicCommentThread.vue'
import PublicRichContent from '../../components/public/PublicRichContent.vue'
import { ApiRequestError } from '../../services/api'
import { publicCommentsService } from '../../services/publicComments'
import { publicPostsService } from '../../services/publicPosts'
import type { PublicCommentNode, PublicPostDetail } from '../../types'

const route = useRoute()
const { locale, t } = useI18n()
const post = ref<PublicPostDetail | null>(null)
const comments = ref<PublicCommentNode[]>([])
const replyTarget = ref<PublicCommentNode | null>(null)
const isLoading = ref(true)
const commentsLoading = ref(false)
const submitPending = ref(false)
const errorMessage = ref('')
const commentsError = ref('')
const submitError = ref('')
const successMessage = ref('')
const isNotFound = ref(false)
const form = reactive({
  authorName: '',
  authorEmail: '',
  body: '',
})

function formatPublishedAt(value: string | null) {
  if (!value) {
    return t('common.status.notSet')
  }

  return new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

const authorName = computed(() => post.value?.author.displayName ?? t('common.status.editorialDesk'))

async function loadComments(slug: string) {
  commentsLoading.value = true
  commentsError.value = ''

  try {
    comments.value = await publicCommentsService.listComments(slug)
  } catch (error) {
    comments.value = []
    commentsError.value = error instanceof Error ? error.message : t('public.comments.loadError')
  } finally {
    commentsLoading.value = false
  }
}

async function loadPost(slug: string) {
  isLoading.value = true
  errorMessage.value = ''
  isNotFound.value = false
  comments.value = []
  replyTarget.value = null

  try {
    const payload = await publicPostsService.getPostBySlug(slug)
    if (!payload) {
      post.value = null
      isNotFound.value = true
      return
    }

    post.value = payload
    await loadComments(slug)
  } catch (error) {
    post.value = null
    errorMessage.value = error instanceof Error ? error.message : t('common.messages.failedToLoadPost')
  } finally {
    isLoading.value = false
  }
}

function startReply(comment: PublicCommentNode) {
  replyTarget.value = comment
  submitError.value = ''
  successMessage.value = ''
}

function cancelReply() {
  replyTarget.value = null
}

function resetForm() {
  form.authorName = ''
  form.authorEmail = ''
  form.body = ''
  replyTarget.value = null
}

function validateForm() {
  if (!form.authorName.trim() || !form.authorEmail.trim() || !form.body.trim()) {
    submitError.value = t('public.comments.required')
    return false
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.authorEmail.trim())) {
    submitError.value = t('public.comments.emailInvalid')
    return false
  }

  return true
}

async function handleSubmit(event: Event) {
  event.preventDefault()
  submitError.value = ''
  successMessage.value = ''

  if (!validateForm()) {
    return
  }

  submitPending.value = true
  try {
    await publicCommentsService.submitComment(String(route.params.slug ?? ''), {
      authorName: form.authorName.trim(),
      authorEmail: form.authorEmail.trim(),
      body: form.body.trim(),
      parentId: replyTarget.value?.id ?? null,
    })
    resetForm()
    successMessage.value = t('public.comments.submitSuccess')
    await loadComments(String(route.params.slug ?? ''))
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 429) {
      submitError.value = t('public.comments.rateLimited')
    } else {
      submitError.value = error instanceof Error ? error.message : t('public.comments.submitError')
    }
  } finally {
    submitPending.value = false
  }
}

watch(
  () => String(route.params.slug ?? ''),
  slug => {
    void loadPost(slug)
  },
  { immediate: true },
)
</script>

<template>
  <main data-testid="front-post-detail-page" class="front-main front-post-page">
    <section v-if="isLoading" data-testid="post-detail-loading" class="front-panel front-side-card">
      <p class="front-card-copy">{{ t('common.messages.loadingPost') }}</p>
    </section>

    <section v-else-if="errorMessage" data-testid="post-detail-error" class="front-panel front-side-card">
      <p class="front-card-copy">{{ errorMessage }}</p>
      <button type="button" class="front-subtle-button" @click="loadPost(String(route.params.slug ?? ''))">{{ t('common.actions.clear') }}</button>
    </section>

    <section v-else-if="isNotFound" data-testid="post-detail-not-found" class="front-panel front-side-card">
      <h1 class="front-title">{{ t('common.messages.postNotFound', { slug: String(route.params.slug ?? '') }) }}</h1>
      <p class="front-card-copy">{{ t('common.messages.failedToLoadPost') }}</p>
      <RouterLink to="/" class="front-subtle-button">{{ t('common.actions.backToExplore') }}</RouterLink>
    </section>

    <template v-else-if="post">
      <section class="front-page-head front-panel">
        <h1 class="front-title">{{ post.title }}</h1>
        <p v-if="post.excerpt" class="front-copy">{{ post.excerpt }}</p>
        <div v-if="post.tags.length" class="front-tag-row">
          <RouterLink
            v-for="tag in post.tags"
            :key="tag.slug"
            :to="`/tag/${tag.slug}`"
            class="front-tag-chip"
          >
            {{ tag.name }}
          </RouterLink>
        </div>
        <div class="front-meta-row">
          <span class="front-muted">{{ authorName }}</span>
          <span class="front-muted">{{ formatPublishedAt(post.publishedAt) }}</span>
        </div>
      </section>

      <section class="front-post-grid">
        <article class="front-panel front-side-card">
          <div v-if="post.coverImageUrl" class="front-post-cover">
            <img :src="post.coverImageUrl" :alt="post.title" />
          </div>
          <PublicRichContent :content="post.content" />
        </article>

        <aside class="front-panel front-side-card">
          <p class="front-eyebrow">{{ t('public.post.eyebrow') }}</p>
          <h2 class="front-card-title">{{ t('public.post.continue') }}</h2>
          <p class="front-card-copy">{{ t('public.post.continueCopy') }}</p>
          <RouterLink to="/" class="front-subtle-button">{{ t('common.actions.backToExplore') }}</RouterLink>
        </aside>
      </section>

      <section class="front-panel front-side-card" data-testid="public-comments-section">
        <div class="front-page-head" style="padding: 0;">
          <p class="front-eyebrow">{{ t('public.comments.eyebrow') }}</p>
          <h2 class="front-card-title">{{ t('public.comments.title') }}</h2>
          <p class="front-card-copy">{{ t('public.comments.copy') }}</p>
        </div>

        <form class="front-contact-form" data-testid="public-comment-form" @submit="handleSubmit">
          <p v-if="submitError" class="front-card-copy" data-testid="public-comment-error">{{ submitError }}</p>
          <p v-if="successMessage" class="front-card-copy" data-testid="public-comment-success">{{ successMessage }}</p>
          <div v-if="replyTarget" class="front-panel" style="padding: 0.8rem 1rem;">
            <p>{{ t('public.comments.replyingTo', { author: replyTarget.authorName }) }}</p>
            <button type="button" class="front-subtle-button" data-testid="public-comment-cancel-reply" @click="cancelReply">
              {{ t('common.actions.cancel') }}
            </button>
          </div>
          <div class="front-field">
            <label for="comment-author">{{ t('common.labels.name') }}</label>
            <input id="comment-author" v-model="form.authorName" data-testid="public-comment-author" class="front-input" :disabled="submitPending">
          </div>
          <div class="front-field">
            <label for="comment-email">{{ t('common.labels.email') }}</label>
            <input id="comment-email" v-model="form.authorEmail" data-testid="public-comment-email" class="front-input" :disabled="submitPending">
          </div>
          <div class="front-field">
            <label for="comment-body">{{ t('admin.contactMessages.message') }}</label>
            <textarea id="comment-body" v-model="form.body" data-testid="public-comment-body" class="front-textarea" rows="5" :disabled="submitPending"></textarea>
          </div>
          <button type="submit" class="front-action-button" :disabled="submitPending">
            {{ submitPending ? t('public.comments.submitting') : t('public.comments.submit') }}
          </button>
        </form>

        <p v-if="commentsError" class="front-card-copy">{{ commentsError }}</p>
        <p v-else-if="commentsLoading" class="front-card-copy">{{ t('public.comments.loading') }}</p>
        <p v-else-if="comments.length === 0" class="front-card-copy">{{ t('public.comments.empty') }}</p>
        <PublicCommentThread v-else :comments="comments" @reply="startReply" />
      </section>
    </template>
  </main>
</template>
