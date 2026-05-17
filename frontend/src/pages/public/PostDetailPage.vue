<template>
  <section class="page">
    <h2>Post Detail</h2>
    <p>Slug: {{ slug }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = computed(() => route.params.slug ?? '')
</script>
