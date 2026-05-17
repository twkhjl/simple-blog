import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/simple-blog/',
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
