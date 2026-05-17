import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import ProfilePage from '../pages/auth/ProfilePage.vue'
import RegisterPage from '../pages/auth/RegisterPage.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminPostEditPage from '../pages/admin/AdminPostEditPage.vue'
import AdminPostListPage from '../pages/admin/AdminPostListPage.vue'
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
          { path: 'post/:slug', component: PostDetailPage },
          { path: 'login', component: LoginPage },
          { path: 'register', component: RegisterPage },
          { path: 'profile', component: ProfilePage },
        ],
      },
      {
        path: '/admin',
        component: AdminLayout,
        children: [
          { path: '', component: AdminDashboardPage },
          { path: 'posts', component: AdminPostListPage },
          { path: 'posts/new', component: AdminPostEditPage },
          { path: 'posts/:id/edit', component: AdminPostEditPage },
        ],
      },
    ],
  })
}
