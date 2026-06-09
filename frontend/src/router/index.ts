import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminChangePasswordPage from '../pages/admin/AdminChangePasswordPage.vue'
import AdminContactMessagesPage from '../pages/admin/AdminContactMessagesPage.vue'
import AdminCommentsPage from '../pages/admin/AdminCommentsPage.vue'
import AdminLoginRecordsPage from '../pages/admin/AdminLoginRecordsPage.vue'
import AdminPostEditPage from '../pages/admin/AdminPostEditPage.vue'
import AdminPostListPage from '../pages/admin/AdminPostListPage.vue'
import AdminTagsPage from '../pages/admin/AdminTagsPage.vue'
import AdminForgotPasswordPage from '../pages/auth/AdminForgotPasswordPage.vue'
import AdminLoginPage from '../pages/auth/AdminLoginPage.vue'
import AdminResetPasswordPage from '../pages/auth/AdminResetPasswordPage.vue'
import LoginRecordsPage from '../pages/auth/LoginRecordsPage.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import AboutPage from '../pages/public/AboutPage.vue'
import ArticleListPage from '../pages/public/ArticleListPage.vue'
import ContactPage from '../pages/public/ContactPage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'
import TagPostsPage from '../pages/public/TagPostsPage.vue'
import { canAccessAdmin, ensureAuthInitialized } from '../stores/auth'
import { authState } from '../stores/auth'

export function createAppRouter() {
  return createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/admin/login',
        component: AdminLoginPage,
      },
      {
        path: '/admin/forgot-password',
        component: AdminForgotPasswordPage,
      },
      {
        path: '/admin/reset-password',
        component: AdminResetPasswordPage,
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
          { path: 'change-password', component: AdminChangePasswordPage },
          {
            path: 'contact-messages',
            component: AdminContactMessagesPage,
            beforeEnter: async () => {
              await ensureAuthInitialized()
              if (authState.profile?.role !== 'admin' && authState.profile?.role !== 'super_admin') {
                return '/admin'
              }

              return true
            },
          },
          {
            path: 'comments',
            component: AdminCommentsPage,
            beforeEnter: async () => {
              await ensureAuthInitialized()
              if (authState.profile?.role !== 'admin' && authState.profile?.role !== 'super_admin') {
                return '/admin'
              }

              return true
            },
          },
          { path: 'login-records', component: AdminLoginRecordsPage },
          { path: 'posts', component: AdminPostListPage },
          { path: 'posts/new', component: AdminPostEditPage },
          { path: 'posts/:id/edit', component: AdminPostEditPage },
          { path: 'tags', component: AdminTagsPage },
        ],
      },
      {
        path: '/',
        component: PublicLayout,
        children: [
          { path: '', component: ArticleListPage },
          { path: 'about', component: AboutPage },
          { path: 'contact', component: ContactPage },
          { path: 'articles', redirect: '/' },
          { path: 'tag/:slug', component: TagPostsPage },
          { path: 'login', component: LoginPage },
          {
            path: 'login-records',
            component: LoginRecordsPage,
            beforeEnter: async () => {
              await ensureAuthInitialized()
              if (!authState.session) {
                return '/login'
              }

              return true
            },
          },
          { path: 'post/:slug', component: PostDetailPage },
        ],
      },
    ],
  })
}
