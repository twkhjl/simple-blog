<template>
  <div class="locale-switcher" role="group" aria-label="Language switcher">
    <button
      type="button"
      class="locale-switcher-option"
      :class="{ active: locale === 'zh-TW' }"
      data-testid="locale-zh-TW"
      @click="handleSwitch('zh-TW')"
    >
      {{ t('common.locale.zhTW') }}
    </button>
    <button
      type="button"
      class="locale-switcher-option"
      :class="{ active: locale === 'en' }"
      data-testid="locale-en"
      @click="handleSwitch('en')"
    >
      {{ t('common.locale.en') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { applyDocumentTitle, setAppLocale, type AppLocale } from '../../i18n'

const { locale, t } = useI18n()
const route = useRoute()
const currentLocale = computed(() => locale.value as AppLocale)

function handleSwitch(nextLocale: AppLocale) {
  if (currentLocale.value === nextLocale) {
    return
  }

  locale.value = nextLocale
  setAppLocale(nextLocale)
  applyDocumentTitle(route, t)
}
</script>
