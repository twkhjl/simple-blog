import { createRouter, createWebHashHistory } from 'vue-router'
import PublicLayout from '../layouts/PublicLayout.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import AboutPage from '../pages/public/AboutPage.vue'
import ArticleListPage from '../pages/public/ArticleListPage.vue'
import ContactPage from '../pages/public/ContactPage.vue'
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        component: PublicLayout,
        children: [
          { path: '', component: HomePage },
          { path: 'about', component: AboutPage },
          { path: 'contact', component: ContactPage },
          { path: 'articles', component: ArticleListPage },
          { path: 'login', component: LoginPage },
          { path: 'post/:slug', component: PostDetailPage },
        ],
      },
    ],
  })
}
