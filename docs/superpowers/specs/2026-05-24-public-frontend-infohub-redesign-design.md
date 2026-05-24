# 前台 InfoHub 改版設計

## 背景

目前前台使用自訂深色 `neo-*` 風格，公開頁面集中在以下檔案：

- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/pages/auth/LoginPage.vue`
- `frontend/src/pages/auth/RegisterPage.vue`
- `frontend/src/pages/auth/ProfilePage.vue`
- `frontend/src/style.css`

需求是將「整個公開前台」改成使用 `page_example/stitch_infohub/_1/code.html` 作為文章列表頁主參考、`page_example/stitch_infohub/_2/code.html` 作為文章詳細頁主參考，並沿用 `infohub` 的品牌語言延伸其他公開頁。後台不在這次改版範圍內，且前後台樣式必須分離，避免互相污染。

使用者已明確確認：

- 文章列表頁主參考為 `page_example/stitch_infohub/_1/code.html`
- 文章詳細頁主參考為 `page_example/stitch_infohub/_2/code.html`
- 其他公開頁延伸 `infohub` 品牌語言
- 改版範圍包含整個公開前台
- 後台維持現狀
- 缺少靜態稿的前台頁面，依 `infohub` 主版風格自行延伸設計

## 目標

- 將公開前台整體視覺改為 `InfoHub` 的 warm editorial 風格
- 保留現有資料流與功能：router、auth、API、i18n
- 將前台與後台樣式系統拆開處理，避免共享視覺 class
- 讓首頁、文章內頁、登入、註冊、個人頁具有一致的前台品牌感
- 維持既有前台互動能力：手機選單、登入登出、管理入口、文章列表與文章內頁載入

## 非目標

- 不改後台 `AdminLayout` 與 admin pages 的外觀
- 不重做後台資訊架構、表單流程或元件樣式
- 不把整個前端專案遷移成 Tailwind 專案
- 不更動後端 API schema、auth 規則或資料表結構
- 不在這次改版內新增搜尋、分類篩選、收藏、分享等新功能；範本若出現這些區塊，僅當作視覺參考，不承諾實作

## 現況觀察

### 前台技術結構

- 專案為 `Vue 3 + Vite + vue-router + vue-i18n`
- 公開前台與後台目前共用同一份 `frontend/src/style.css`
- 現有公開頁含：
  - 首頁文章列表
  - 文章內頁
  - 登入頁
  - 註冊頁
  - 個人頁
- `PublicLayout.vue` 已包含：
  - 公開導覽列
  - 手機選單
  - 語系切換
  - 登入 / 註冊 / 登出
  - 管理入口顯示條件

### 範本素材狀況

- `_1/code.html` 提供資訊密度較高的文章列表頁、側欄、卡片節奏，應作為文章列表頁主參考
- `infohub/code.html` 提供明亮暖色的品牌語言、首頁 hero、導覽、文章卡片與 editorial 細節，應作為其他公開頁的品牌母體
- `_2/code.html` 提供長文型文章頁較完整的 editorial 結構，應作為文章詳細頁主參考
- 終端目前讀取範本時出現亂碼，但使用者已確認原始檔為 UTF-8，因此應視為目前讀取/顯示環境問題，而非素材不可用

## 設計原則

### 1. 前後台樣式隔離

- 後台維持現有 `neo-*` / admin 相關樣式，不在這次改版內重命名或換皮
- 前台新增獨立視覺命名空間，不直接覆蓋 admin 使用中的 class
- 前台改版後，不要求後台同步沿用同一套 design tokens
- 若需抽取少量共用 reset/base，僅保留真正通用的基礎樣式，其餘明確分到 public 或 admin

### 2. 保留行為，替換視覺層

- 不變動公開前台頁面的主要資料來源與路由規則
- 重新切出版型結構與 CSS，不把範本 HTML 生硬嵌進 Vue
- 導覽、文章列表、文章內頁、登入/註冊/個人頁，全部保持現有功能意圖，只更新視覺與版面結構

### 3. 列表頁用 `_1`，詳細頁用 `_2`，品牌語言用 `infohub`

- 文章列表頁以 `_1` 的版面結構、資訊密度、側欄與卡片節奏為準
- 文章詳細頁以 `_2` 的 editorial 結構與資訊節奏為準
- 登入、註冊、個人頁沿用 `infohub` 的品牌語言延伸
- `infohub` 負責整體品牌氣質、色彩、字體與前台共通語言

### 4. 不導入 Tailwind 作為正式依賴

- 範本使用 Tailwind CDN，但正式實作採用既有 `Vue SFC + CSS`
- 理由：
  - 目前專案沒有 Tailwind build pipeline
  - 這次需求是換前台視覺，不是整體前端技術棧遷移
  - 若直接在正式頁面依賴 CDN Tailwind，後續維護、tree shaking、樣式治理都較差

## 視覺系統設計

### 品牌方向

- 氣質：warm technical editorial
- 基底：明亮暖白 / 米白背景
- 點綴：銅色、暖灰、深炭文字
- 材質：玻璃感 panel、柔和邊框、多層次低對比陰影
- 字體：延續範本使用的 `Noto Sans TC`

### 前台 design tokens

前台會整理成一組獨立 CSS variables，至少包含：

- 色彩
  - `--public-bg`
  - `--public-surface`
  - `--public-surface-soft`
  - `--public-text`
  - `--public-text-muted`
  - `--public-accent`
  - `--public-accent-strong`
  - `--public-border`
- 圓角
  - 按鈕
  - input
  - 卡片
  - 大型容器
- 陰影
  - 導覽玻璃層
  - 卡片 ambient shadow
  - 浮層 / menu shadow
- 間距
  - container width
  - desktop / mobile gutter
  - section vertical spacing
- 字級
  - hero title
  - section title
  - body
  - meta / label

### 與後台的關係

- 後台保留目前 dark `neo-*` tokens
- 前台 tokens 不覆蓋 admin tokens
- 同一份 `style.css` 若繼續存在，需拆出清楚區段：
  - base/reset
  - public theme
  - admin theme

## 頁面設計

### PublicLayout

`frontend/src/layouts/PublicLayout.vue`

負責：

- 前台 sticky header
- 品牌字樣 / 首頁入口
- 公開導覽項目
- 語系切換
- 登入 / 註冊 / 登出 / 管理入口
- 手機選單
- 主內容容器
- 前台 footer

改版方向：

- 以 `infohub` header/footer 為主
- 導覽改成輕量、明亮、玻璃感 sticky bar
- 保留既有 route active 狀態
- 保留 mobile menu 開關與 route 切換時自動收合
- 登入狀態與管理權限邏輯保持不變

### 首頁 / 文章列表頁

`frontend/src/pages/public/HomePage.vue`

保留現有功能：

- 進入頁面後打 `/api/posts`
- 顯示 loading / error / empty / list
- 每篇文章可進入 `/post/:slug`

改版方向：

- 以 `_1` 的列表頁結構為主：
  - 頁首標題區
  - 側欄資訊或過濾視覺區
  - 較高資訊密度的文章卡片網格
- 頁面品牌語言仍對齊 `infohub` 的暖色系、字體、邊框與陰影
- 文章卡片以 `_1` 的資訊節奏為主，並套用 `infohub` 色彩語言：
  - 封面圖
  - 日期
  - slug 或次要 metadata
  - title
  - excerpt
  - CTA
- 若現有資料不足以支撐範本中的分類、閱讀時間、作者頭像、排序或過濾等欄位，僅呈現現有可用欄位，不造假資料，也不新增假互動

### 文章內頁

`frontend/src/pages/public/PostDetailPage.vue`

保留現有功能：

- 根據 slug 載入單篇文章
- 顯示 loading / not found / error
- 顯示封面圖、標題、摘要、內容
- 內容依現有 rich text sanitize/render 流程處理

改版方向：

- 整體風格以 `_2` 的文章頁結構為主，並套用 `infohub` 的品牌語言
- 建立 editorial hero：
  - 標題
  - 摘要
  - 日期
  - 作者顯示名稱
  - slug 或文章狀態作次要 metadata
- 封面圖改成高品質主視覺區
- 正文區提高閱讀舒適度：
  - 控制最大寬度
  - 優化段落、標題、清單、blockquote、code block、連結樣式
- 側欄資訊是否保留，以「不破壞長文閱讀流」為準；可保留簡化版 metadata / back CTA，但不強行複製現有結構

### 登入頁

`frontend/src/pages/auth/LoginPage.vue`

改版方向：

- 沒有靜態稿，依 `infohub` 主風格自行延伸
- 採用 editorial brand shell + 單欄或雙欄登入卡
- 保留目前登入流程、錯誤顯示與跳轉邏輯
- 表單元件樣式切到前台暖色主題，不沿用後台 dark `neo-*` 外觀

### 註冊頁

`frontend/src/pages/auth/RegisterPage.vue`

改版方向：

- 與登入頁維持同套品牌語言
- 保留目前註冊流程與驗證提示
- 版面可與登入頁共用視覺骨架，避免重複設計與 CSS

### 個人頁

`frontend/src/pages/auth/ProfilePage.vue`

改版方向：

- 依前台品牌語言延伸成 profile editorial dashboard
- 保留目前資料顯示與編輯功能
- 讓個人資料區、狀態區、表單區有清楚資訊層次

## 元件與樣式邊界

### 要改的主要檔案

- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/pages/public/HomePage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/pages/auth/LoginPage.vue`
- `frontend/src/pages/auth/RegisterPage.vue`
- `frontend/src/pages/auth/ProfilePage.vue`
- `frontend/src/style.css`

### 原則上不改的檔案

- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/pages/admin/*`
- `frontend/src/services/*`
- `frontend/src/stores/auth.ts`
- `frontend/src/router/index.ts` 的路由結構本身

### 可能需要小幅配合的檔案

- `frontend/src/i18n/locales/zh-TW.ts`
- `frontend/src/i18n/locales/en.ts`

僅在以下情況補文字：

- 新增前台頁面所需標題或說明文案 key
- 補齊登入/註冊/個人頁在新版版面中需要的新 label

## 資料與內容規則

- 一律使用現有 API / auth / profile 資料
- 不為了貼近範本而加入假的作者頭像、閱讀時間、分類資料
- 若設計需要某類 metadata，但目前沒有對應資料，優先：
  1. 省略
  2. 改成現有欄位
  3. 改成中性 UI 區塊
- 文案以 i18n 為主，不直接抄範本中文字

## 互動規格

### 保留的既有行為

- header active route 標示
- mobile menu 開關
- route 切換時 mobile menu 自動收合
- 已登入時顯示登出
- admin 角色顯示管理入口
- 首頁文章列表 loading / error / empty state
- 文章頁 loading / error / not found state

### 可接受的調整

- DOM 結構可大改
- class 名稱可全面重構
- loading / error / empty 區塊視覺可全面更新
- 文章卡片資訊排序可調整

## 測試影響

### 必然受影響的測試

- `frontend/tests/public-layout.spec.ts`

原因：

- header DOM 結構會重做
- 手機選單的選擇器與文字內容可能改變

### 需要回歸檢查的測試

- `frontend/tests/router.spec.ts`
- `frontend/tests/ui.spec.ts`
- 與 auth 頁面相關的測試

### 測試策略

- 優先保留行為驗證，不綁死舊 class 名稱
- 若測試目前過度依賴舊 DOM，需改成測行為或較穩定的 selector
- 必要時補 `data-testid` 到新前台結構，特別是：
  - mobile menu toggle
  - mobile menu panel
  - auth actions
  - 主要 public nav links

## 驗證方式

- `npm test`
- `npm run build`
- 視覺回歸至少覆蓋：
  - 首頁桌機
  - 首頁手機
  - 文章內頁桌機
  - 登入頁
  - 註冊頁
  - 個人頁
  - 後台頁面未受前台樣式污染

## 風險與對策

### 1. 共用 `style.css` 造成樣式互相污染

對策：

- 重新分區前台 / 後台樣式
- 前台 class 使用獨立命名空間
- 驗證 admin 頁面視覺未退化

### 2. 範本和現有資料欄位不對齊

對策：

- 僅保留可由現有資料支撐的資訊
- 把多餘範本元素視為裝飾，不視為功能需求

### 3. 測試只會驗舊 DOM

對策：

- 讓測試改驗行為與穩定 selector
- 新 DOM 若需測試支撐，主動補 `data-testid`

### 4. 前台頁面缺少完整靜態稿

對策：

- 明確以 `infohub` 作為品牌母體，並讓列表頁在版面結構上優先貼近 `_1`
- 登入、註冊、個人頁採同套 design tokens 與版面語言延伸
- 避免另外發明與主版風格衝突的次品牌

## 實作順序建議

1. 先整理前台 design tokens 與樣式分區策略
2. 重做 `PublicLayout.vue`
3. 重做首頁
4. 重做文章內頁
5. 重做登入 / 註冊 / 個人頁
6. 更新受影響測試
7. 執行測試與 build

## 設計結論

這次需求屬於「公開前台整體換皮」，不是單純 CSS 覆蓋。最佳做法是以前台獨立視覺系統重切版面，保留現有 router、auth、API、i18n 與資料流程，同時把前後台樣式明確分離。文章列表頁以 `_1` 為主參考，文章詳細頁以 `_2` 為主參考，登入/註冊/個人頁則延伸 `infohub` 的品牌語言設計。
