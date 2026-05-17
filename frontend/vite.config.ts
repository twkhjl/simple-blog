import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/blog-system/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
