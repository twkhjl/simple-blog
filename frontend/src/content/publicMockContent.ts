import type {
  PublicContactCard,
  PublicContactField,
  PublicFooterLink,
  PublicMockPost,
  PublicNavItem,
  PublicSection,
} from '../types/publicPages'

const nav: PublicNavItem[] = [
  { label: '首頁', to: '/' },
  { label: '關於', to: '/about' },
  { label: '聯絡', to: '/contact' },
]

const footerLinks: PublicFooterLink[] = [
  { label: '首頁', to: '/' },
  { label: '關於', to: '/about' },
  { label: '聯絡', to: '/contact' },
]

const aboutSections: PublicSection[] = [
  {
    title: '我們寫什麼',
    body: 'TechHumana 聚焦前端、後端、產品設計與協作流程，內容偏向實務總結與可落地的操作建議。',
  },
  {
    title: '我們怎麼寫',
    body: '每篇文章都盡量保留脈絡、決策理由與實作取捨，讓讀者不只知道怎麼做，也知道為什麼這樣做。',
  },
  {
    title: '我們相信什麼',
    body: '好的內容應該同時兼顧清楚、準確與可維護。這也是本次從靜態 HTML 回歸 Vue 元件化的核心原因。',
  },
]

const contactCards: PublicContactCard[] = [
  { label: 'Email', value: 'studio@example.invalid' },
  { label: 'Office Hours', value: 'Mon - Fri / 10:00 - 18:00' },
  { label: 'Location', value: 'Taipei / Remote-first' },
]

const contactFields: PublicContactField[] = [
  { id: 'name', label: '姓名', placeholder: '請輸入你的姓名', type: 'text' },
  { id: 'email', label: '電子郵件', placeholder: 'your.email@example.com', type: 'email' },
  { id: 'subject', label: '主旨', placeholder: '這次想聊什麼？', type: 'text' },
  { id: 'message', label: '內容', placeholder: '告訴我們你的需求或問題', type: 'textarea' },
]

const posts: PublicMockPost[] = [
  {
    id: 'post-1',
    title: '把靜態頁改成 Vue 元件，先拆 layout 再拆內容',
    slug: 'first-post',
    excerpt: '當畫面只是把整份 HTML 透過 v-html 灌進去，長期維護成本會一路上升。這篇整理我們如何先抽共用殼層，再回收 page-specific main content。',
    publishedAt: '2026-05-26',
    coverImageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    category: '前端架構',
    readTime: '5 分鐘',
    author: 'TechHumana Studio',
    content: [
      '靜態 HTML 當作視覺參考很方便，但一旦直接進到執行期，就會失去 Vue 原本提供的結構、資料流與可測試性。',
      '比較穩的做法是先找出 header、drawer、footer 這些跨頁共用區塊，把它們收斂到 layout，再讓每個頁面只留下自己真正負責的內容。',
      '這樣做的好處不只是可維護，也讓日後接 API、改互動、補測試時，不需要再從大段字串 HTML 裡硬拆 DOM。',
    ],
  },
  {
    id: 'post-2',
    title: '文章列表改版時，如何保住視覺一致性',
    slug: 'article-grid-refresh',
    excerpt: '想保留靜態稿的氛圍，又不想把整頁寫死，關鍵在於先抽視覺 token，再讓卡片與區塊吃同一套樣式語言。',
    publishedAt: '2026-05-25',
    coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    category: '設計系統',
    readTime: '4 分鐘',
    author: 'TechHumana Studio',
    content: [
      '如果每個頁面都各自複製陰影、圓角與間距，最後很難維持一致。把樣式抽成可重用 class，才有辦法控制整體視覺密度。',
    ],
  },
  {
    id: 'post-3',
    title: '當內容還沒接 API，先用 mock data 也要有邊界',
    slug: 'reading-surface-only',
    excerpt: 'Mock data 不是暫時亂塞字串就好。若資料結構先整理好，之後接真實資料源時，元件層才不會再重拆一次。',
    publishedAt: '2026-05-24',
    coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    category: '內容建模',
    readTime: '6 分鐘',
    author: 'TechHumana Studio',
    content: [
      '內容先建模，頁面才知道自己要消費什麼資料，而不是反過來依賴一份龐大的 HTML 文本。',
      '這也是讓測試可以只關注行為與結構，而不用去比對整頁字串的前提。',
    ],
  },
]

export const publicMockContent = {
  site: {
    brand: 'TechHumana',
    signInLabel: '登入',
    nav,
    footerLinks,
    footerCopy: '© 2026 TechHumana. All rights reserved.',
  },
  about: {
    title: '關於 TechHumana',
    intro: '我們是一個以技術內容與產品實作為核心的團隊，專注在把抽象需求轉成清楚、可靠、可維護的系統。',
    sections: aboutSections,
  },
  contact: {
    title: '聯絡我們',
    intro: '如果你想聊內容合作、工程顧問、前端重構或編輯流程設計，可以透過下面表單留下訊息，我們會再與你聯繫。',
    cards: contactCards,
    form: {
      fields: contactFields,
      submitLabel: '送出留言',
    },
  },
  login: {
    title: '會員登入',
    copy: '登入後可以收藏文章、查看閱讀清單，並延續你在站上的工作流程。',
  },
  adminLogin: {
    title: 'Admin Sign In',
    copy: '後台登入保留給內容維運與編輯作業使用。',
  },
  articleList: {
    title: '最新文章',
    intro: '整理近期發布的教學、重構筆記與設計決策，讓首頁直接成為主要閱讀入口。',
    filters: ['全部', '前端架構', '設計系統', '內容建模'],
  },
  posts,
} as const

export function getMockPostBySlug(slug: string) {
  return publicMockContent.posts.find(post => post.slug === slug) ?? null
}
