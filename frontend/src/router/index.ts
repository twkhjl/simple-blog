import { createRouter, createWebHashHistory } from 'vue-router'
import AboutPage from '../pages/public/AboutPage.vue'
import ArticleListPage from '../pages/public/ArticleListPage.vue'
import ContactPage from '../pages/public/ContactPage.vue'
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/', component: HomePage },
      { path: '/about', component: AboutPage },
      { path: '/contact', component: ContactPage },
      { path: '/articles', component: ArticleListPage },
      { path: '/post/:slug', component: PostDetailPage },
    ],
  })
}
