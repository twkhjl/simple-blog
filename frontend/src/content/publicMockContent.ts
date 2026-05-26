export interface PublicMockPost {
  id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  coverImageUrl: string
  category: string
  readTime: string
  author: string
  content: string[]
}

export const publicMockContent = {
  site: {
    brand: 'TechHumana',
    signInLabel: 'Sign In',
    nav: [
      { label: '首頁', to: '/' },
      { label: '文章列表', to: '/articles' },
      { label: '關於我們', to: '/about' },
      { label: '聯絡我們', to: '/contact' },
    ],
  },
  home: {
    title: '探索設計、技術與工作流',
    copy: '這一版前台只負責呈現靜態稿畫面，所有資料都使用集中假資料。',
  },
  about: {
    title: '關於 TechHumana',
    intro: '這個階段只處理視覺還原，不處理真實內容串接。',
    sections: [
      { title: '重建原則', body: '優先保留靜態 HTML 的階層、間距、字體與視覺節奏。' },
      { title: '資料策略', body: '全部頁面統一由假資料模組供應，後續再替換成真資料來源。' },
    ],
  },
  contact: {
    title: '聯絡我們',
    intro: '這個聯絡頁面目前是展示用，表單不會送出資料。',
    cards: [
      { label: 'Email', value: 'studio@example.invalid' },
      { label: 'Office Hours', value: 'Mon - Fri / 10:00 - 18:00' },
      { label: 'Location', value: 'Taipei / Remote-first' },
    ],
  },
  login: {
    title: '歡迎回來',
    copy: '這個登入頁僅保留靜態外觀，不串接驗證。',
  },
  adminLogin: {
    title: 'Admin Sign In',
    copy: '此頁面先維持靜態稿外觀，後續再接回真實驗證流程。',
  },
  posts: [
    {
      id: 'post-1',
      title: '在靜態稿與 Vue 元件之間維持 1:1 視覺一致',
      slug: 'first-post',
      excerpt: '以最少抽象還原視覺，避免樣式系統重刻造成偏差。',
      publishedAt: '2026-05-26',
      coverImageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
      category: '設計系統',
      readTime: '5 min',
      author: 'TechHumana Studio',
      content: ['第一段示意文章內容。', '第二段示意文章內容。', '第三段示意文章內容。'],
    },
    {
      id: 'post-2',
      title: '文章列表卡片的層級要與靜態稿一致',
      slug: 'article-grid-refresh',
      excerpt: '列表頁測試用文章，提供卡片、日期、作者與標籤區塊。',
      publishedAt: '2026-05-25',
      coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      category: '內容展示',
      readTime: '4 min',
      author: 'TechHumana Studio',
      content: ['列表示意內容。'],
    },
    {
      id: 'post-3',
      title: '閱讀頁面只做視覺還原，不做 API 串接',
      slug: 'reading-surface-only',
      excerpt: '詳細頁測試用文章，提供標題、摘要、段落、作者與封面圖。',
      publishedAt: '2026-05-24',
      coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      category: '前台重建',
      readTime: '6 min',
      author: 'TechHumana Studio',
      content: ['詳細頁第一段。', '詳細頁第二段。'],
    },
  ] satisfies PublicMockPost[],
} as const

export function getMockPostBySlug(slug: string) {
  return publicMockContent.posts.find(post => post.slug === slug) ?? null
}
