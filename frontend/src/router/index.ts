import { createRouter, createWebHashHistory } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import PublicLayout from '../layouts/PublicLayout.vue'
import AdminLoginPage from '../pages/auth/AdminLoginPage.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import ProfilePage from '../pages/auth/ProfilePage.vue'
import RegisterPage from '../pages/auth/RegisterPage.vue'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.vue'
import AdminPostEditPage from '../pages/admin/AdminPostEditPage.vue'
import AdminPostListPage from '../pages/admin/AdminPostListPage.vue'
import ArticleListPage from '../pages/public/ArticleListPage.vue'
import AboutPage from '../pages/public/AboutPage.vue'
import ContactPage from '../pages/public/ContactPage.vue'
import HomePage from '../pages/public/HomePage.vue'
import PostDetailPage from '../pages/public/PostDetailPage.vue'
import { authState, canAccessAdmin, waitForAuthReady } from '../stores/auth'
import { applyDocumentTitle, syncDocumentLanguage, type AppLocale } from '../i18n'

interface I18nLike {
  global: {
    locale: string | { value: string }
    t: (key: string, ...args: unknown[]) => string
  }
}

function resolveLocale(locale: I18nLike['global']['locale']): AppLocale {
  return (typeof locale === 'string' ? locale : locale.value) as AppLocale
}

export function createAppRouter(i18n?: I18nLike) {
  const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        component: PublicLayout,
        meta: { titleKey: 'seo.home.title' },
        children: [
          { path: '', component: HomePage, meta: { titleKey: 'seo.home.title' } },
          { path: 'articles', component: ArticleListPage, meta: { titleKey: 'seo.articles.title' } },
          { path: 'post/:slug', component: PostDetailPage, meta: { titleKey: 'seo.post.title' } },
          { path: 'about', component: AboutPage, meta: { titleKey: 'seo.about.title' } },
          { path: 'contact', component: ContactPage, meta: { titleKey: 'seo.contact.title' } },
          { path: 'login', component: LoginPage, meta: { titleKey: 'seo.login.title' } },
          { path: 'register', component: RegisterPage, meta: { titleKey: 'seo.register.title' } },
          { path: 'profile', component: ProfilePage, meta: { requiresAuth: true, titleKey: 'seo.profile.title' } },
        ],
      },
      {
        path: '/admin/login',
        component: AdminLoginPage,
        meta: { titleKey: 'seo.adminLogin.title' },
      },
      {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAdmin: true, titleKey: 'seo.adminDashboard.title' },
        children: [
          { path: '', component: AdminDashboardPage, meta: { titleKey: 'seo.adminDashboard.title' } },
          { path: 'posts', component: AdminPostListPage, meta: { titleKey: 'seo.adminPosts.title' } },
          { path: 'posts/new', component: AdminPostEditPage, meta: { titleKey: 'seo.adminPostNew.title' } },
          { path: 'posts/:id/edit', component: AdminPostEditPage, meta: { titleKey: 'seo.adminPostEdit.title' } },
        ],
      },
    ],
  })

  router.beforeEach(async to => {
    if ((to.meta.requiresAuth || to.meta.requiresAdmin) && !authState.ready) {
      await waitForAuthReady()
    }

    if (to.meta.requiresAuth && !authState.session) {
      return '/login'
    }

    if (to.meta.requiresAdmin && !canAccessAdmin()) {
      return authState.session ? '/profile' : '/admin/login'
    }

    return true
  })

  if (i18n) {
    router.afterEach(to => {
      syncDocumentLanguage(resolveLocale(i18n.global.locale))
      applyDocumentTitle(to, i18n.global.t)
    })
  }

  return router
}
