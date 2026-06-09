<script setup lang="ts">
import type { PublicCommentNode } from '../../types'

defineProps<{
  comments: PublicCommentNode[]
  depth?: number
}>()

const emit = defineEmits<{
  reply: [comment: PublicCommentNode]
}>()

function handleReply(comment: PublicCommentNode) {
  emit('reply', comment)
}

function indentStyle(depth: number) {
  return {
    marginLeft: `${Math.min(depth, 4) * 1.1}rem`,
  }
}
</script>

<template>
  <div class="public-comment-thread">
    <article
      v-for="comment in comments"
      :key="comment.id"
      class="front-panel front-side-card public-comment-card"
      :style="indentStyle(depth ?? 0)"
    >
      <div class="front-meta-row">
        <strong>{{ comment.authorName }}</strong>
        <span class="front-muted">{{ new Date(comment.createdAt).toLocaleString() }}</span>
      </div>
      <p class="front-card-copy" style="white-space: pre-wrap;">{{ comment.body }}</p>
      <button
        type="button"
        class="front-subtle-button"
        data-testid="public-comment-reply"
        @click="handleReply(comment)"
      >
        Reply
      </button>

      <PublicCommentThread
        v-if="comment.replies.length"
        :comments="comment.replies"
        :depth="(depth ?? 0) + 1"
        @reply="handleReply"
      />
    </article>
  </div>
</template>
