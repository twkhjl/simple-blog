import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminPostEditPage from '../pages/admin/AdminPostEditPage.vue'
import AdminPostListPage from '../pages/admin/AdminPostListPage.vue'
import AdminLoginPage from '../pages/auth/AdminLoginPage.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import AboutPage from '../pages/public/AboutPage.vue'
import ArticleListPage from '../pages/public/ArticleListPage.vue'
import ContactPage from '../pages/public/ContactPage.vue'
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'
import { canAccessAdmin, ensureAuthInitialized } from '../stores/auth'

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/admin/login',
        component: AdminLoginPage,
      },
      {
        path: '/admin',
        component: AdminLayout,
        beforeEnter: async () => {
          await ensureAuthInitialized()
          if (!canAccessAdmin()) {
            return '/admin/login'
          }

          return true
        },
        children: [
          { path: '', component: AdminDashboardPage },
          { path: 'posts', component: AdminPostListPage },
          { path: 'posts/new', component: AdminPostEditPage },
          { path: 'posts/:id/edit', component: AdminPostEditPage },
        ],
      },
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
