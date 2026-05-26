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
    brand: 'Simple Blog',
    tagline: '靜態版型翻新中的前台展示站',
    footerLead: '暖白質感、浮雕光影、純展示內容。',
    footerCopy: '2026 simple-blog demo workspace',
    nav: [
      { label: '首頁', to: '/' },
      { label: '文章列表', to: '/articles' },
      { label: '關於我們', to: '/about' },
      { label: '聯絡方式', to: '/contact' },
    ],
  },
  home: {
    eyebrow: 'Editorial Front',
    title: '把舊前台整套拆掉，換成全新靜態展示版型。',
    copy:
      '目前所有前台內容都來自本地 mock data。沒有 API、沒有登入流程、沒有舊版型遺留，只有新視覺方向與展示路由。',
    primaryLabel: '瀏覽全部文章',
    secondaryLabel: '查看精選文章',
    metrics: [
      { label: '6 篇假資料文章', value: '06' },
      { label: '0 條前台 API 請求', value: '00' },
      { label: '100% 新版型覆蓋', value: '100' },
    ],
  },
  articleFilters: ['全部文章', '設計系統', '前端工程', '內容策略', '產品觀點'],
  about: {
    eyebrow: 'About',
    title: '這一版前台只處理展示層，不處理功能層。',
    intro:
      '這次改版的目標不是把既有前台微調，而是整套抽換。路由、頁面、樣式、假資料全部重建，並且和後台展示層切乾淨。',
    sections: [
      {
        title: '前台只吃 mock data',
        body: '首頁、文章列表、文章內頁、關於、聯絡、登入，全部都由本地假資料驅動，不經過任何 API client。',
      },
      {
        title: '舊前台結構不保留',
        body: '舊的 public route、profile/register auth 頁、前台共用元件與原版型 class contract 都在這次範圍內被移除。',
      },
      {
        title: '後台另行獨立改版',
        body: '後台目前保留原功能，但視覺與元件來源已開始和前台分離，方便下一階段單獨改 admin。',
      },
    ],
  },
  contact: {
    eyebrow: 'Contact',
    title: '這裡是靜態聯絡頁，不送出表單。',
    intro:
      '表單與聯絡資訊目前僅為視覺展示。欄位可填，但不會送出請求，也不會寫入任何資料來源。',
    cards: [
      { label: 'Email', value: 'studio@example.invalid' },
      { label: 'Office Hours', value: 'Mon - Fri / 10:00 - 18:00' },
      { label: 'Location', value: 'Taipei / Remote-first editorial setup' },
    ],
  },
  login: {
    eyebrow: 'Static Login',
    title: '這是純展示登入頁。',
    copy:
      '目前前台登入不會觸發 auth。這個頁面只保留新版型與表單視覺，後續若要接前台會員功能，再另外規劃。',
  },
  posts: [
    {
      id: 'post-1',
      title: '新版首頁先處理氣氛，再處理資訊層級',
      slug: 'first-post',
      excerpt: '首頁改版先建立氣氛與節奏，再把文章入口、指標與 CTA 重新排列成更穩定的展示序列。',
      publishedAt: '2026-05-26',
      coverImageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
      category: '設計系統',
      readTime: '5 min',
      author: '編輯台',
      content: [
        '這次首頁不再假裝自己是功能入口，而是明確回到展示首頁的角色。主視覺先把改版語氣立起來，再讓文章卡片承接資訊密度。',
        '我們保留固定 header、抽屜選單與大標題 hero，但把舊前台的搜尋、登入狀態、profile 捷徑與 API loading 狀態全部拆掉。',
        '因此現在的首頁不需要等待任何外部資料。畫面一開就完整，內容一致，沒有前後端狀態差異。',
      ],
    },
    {
      id: 'post-2',
      title: '文章列表改成真正的版面，不再只是卡片堆疊',
      slug: 'article-grid-refresh',
      excerpt: '新版文章列表多了篩選膠囊、側欄資訊與更穩定的卡片比例，讓整體不像舊前台那樣只是簡單堆文章。',
      publishedAt: '2026-05-25',
      coverImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      category: '前端工程',
      readTime: '4 min',
      author: '產品設計',
      content: [
        '列表頁最大的調整是承認自己是展示頁，不需要承載真篩選功能，所以篩選膠囊只負責視覺節奏與資訊分群暗示。',
        '文章卡片統一分成封面、分類、標題、摘要與閱讀時間，視覺比例固定後，整體閱讀節奏乾淨很多。',
      ],
    },
    {
      id: 'post-3',
      title: '文章內頁拿掉評論與互動真功能，只保留閱讀感',
      slug: 'reading-surface-only',
      excerpt: '舊版文章頁混了太多將來式功能。新版先把閱讀感做對，互動全部降成靜態展示。',
      publishedAt: '2026-05-24',
      coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      category: '內容策略',
      readTime: '6 min',
      author: '內容編輯',
      content: [
        '文章頁改成左側導引、右側延伸資訊、中間閱讀主欄的三段結構。就算沒有真 TOC 邏輯，也能先建立穩定版面。',
        '最重要的決定是拿掉舊的評論、reaction、登入綁定等半成品流程。現在看到的互動元件都只是靜態展示。',
        '這讓使用者不會被尚未完成的功能誤導，也讓之後接真資料時可以重新設計互動，不受舊殼限制。',
      ],
    },
    {
      id: 'post-4',
      title: 'About 頁不是補文案，是交代前台邊界',
      slug: 'about-boundary',
      excerpt: '關於頁在這版的責任，是把公開前台與後台管理層的邊界講清楚。',
      publishedAt: '2026-05-23',
      coverImageUrl: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=1200&q=80',
      category: '產品觀點',
      readTime: '3 min',
      author: '設計協作',
      content: [
        'About 頁在這次不是品牌故事頁，而是邊界說明頁。它直接告訴團隊：前台目前只做展示，不做真互動。',
      ],
    },
    {
      id: 'post-5',
      title: 'Contact 頁保留表單視覺，但禁止偷偷送 request',
      slug: 'contact-static-only',
      excerpt: '聯絡頁面常常最容易被順手接上 API，但這次明確禁止，先只做視覺與欄位節奏。',
      publishedAt: '2026-05-22',
      coverImageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
      category: '前端工程',
      readTime: '4 min',
      author: '編輯台',
      content: [
        'Contact 頁保留卡片、資訊欄與表單區，但送出按鈕改成 disabled 或提示靜態頁，避免任何人誤以為這版已接資料。',
      ],
    },
    {
      id: 'post-6',
      title: '前後台開始拆家，下一步才好改 admin',
      slug: 'split-front-admin',
      excerpt: '如果這次前台翻新還和 admin 共用版型元件，下次改後台會再爆一次，所以先切開。',
      publishedAt: '2026-05-21',
      coverImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      category: '系統拆分',
      readTime: '5 min',
      author: '架構筆記',
      content: [
        '前後台分離不只是資料流，也包括展示層。只要 public layout 和 admin layout 還共享 UI 元件，之後改其中一邊就會拖到另一邊。',
      ],
    },
  ] satisfies PublicMockPost[],
} as const

export function getMockPostBySlug(slug: string) {
  return publicMockContent.posts.find(post => post.slug === slug) ?? null
}
