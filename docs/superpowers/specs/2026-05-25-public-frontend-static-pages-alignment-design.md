# Public Frontend Static Pages Alignment Design

## 背景

`simple-blog` 目前前台已經有一版 Vue 實作，包含首頁、文章列表、文章詳情、登入、註冊、個人資料與管理後台路由。`page_example/front` 另外提供一組新的靜態 HTML 頁面，目標是以這批靜態頁為主要視覺與結構來源，替換現有前台。

本次工作不是重做整個系統，而是以現有 Vue 3 + Vite 專案為基礎，保留既有可用功能、資料流與登入流程，將前台頁面改成對齊 `page_example/front`。若靜態頁對應的路由或功能目前不存在，則新增路由；若後端尚未提供資料，則先使用前端假資料或固定文案。

## 目標

- 以前台靜態頁為準，替換現有前台主要頁面視覺與內容結構
- 保留現有可用功能與既有 public API / auth API
- 新增缺少的前台路由與頁面
- 對目前不存在的資料來源使用假資料，不阻塞切版與整合
- 將管理端登入頁獨立為 `/admin/login`

## 非目標

- 不改動資料庫 schema
- 不新增 about / contact 後端 API
- 不實作 contact 表單送出
- 不為了貼合靜態稿而推翻現有 router、auth、API client 架構
- 不大改 admin 既有頁面功能

## 靜態頁與目標路由對照

- `page_example/front/index.html` -> `/`
- `page_example/front/post_list.html` -> `/articles`
- `page_example/front/post_detail.html` -> `/post/:slug`
- `page_example/front/login.html` -> `/login`
- `page_example/front/admin_login.html` -> `/admin/login`
- `page_example/front/about.html` -> `/about`
- `page_example/front/contact.html` -> `/contact`

## 現況判斷

現有前台已具備以下基礎：

- `frontend/src/layouts/PublicLayout.vue` 已有公共 header / footer / mobile menu
- `frontend/src/pages/public/HomePage.vue`、`ArticleListPage.vue`、`PostDetailPage.vue` 已接 public API
- `frontend/src/pages/auth/LoginPage.vue`、`RegisterPage.vue`、`ProfilePage.vue` 已有前台登入與會員功能
- `frontend/src/router/index.ts` 已有 `/`、`/articles`、`/post/:slug`、`/login`、`/register`、`/profile`、`/admin/*`

主要缺口：

- 缺少 `/about`
- 缺少 `/contact`
- 缺少獨立 `/admin/login`
- 前台導覽未完整納入 about / contact
- 部分靜態稿展示資訊目前沒有後端資料來源

## 採用方案

採用漸進式替換，不做推翻式重寫。

原則如下：

- 保留 `Vue 3 + Vite + vue-router + vue-i18n` 架構
- 保留現有 public API 與 auth API
- 以頁面與樣式替換為主，不改動底層服務邏輯
- 能使用真文章資料的區塊優先使用真資料
- 非核心展示區塊、靜態介紹內容、側欄資訊以假資料或固定文案提供

這種做法的理由：

- 風險低於整包重切
- 可最大化重用現有路由、測試、登入流程與資料型別
- 符合「已有功能就替換，不存在路徑就新增，不存在功能先假資料」的需求邊界

## 路由設計

### 公開前台路由

- `/`
- `/articles`
- `/post/:slug`
- `/about`
- `/contact`
- `/login`
- `/register`
- `/profile`

### 管理端相關路由

- `/admin/login`
- `/admin`
- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/:id/edit`

### 導頁規則

- 未登入使用者進入 `/admin/*` 時，導向 `/admin/login`
- `/admin/login` 登入成功後：
  - 若帳號具管理權限，導向 `/admin` 或 `/admin/posts`
  - 若帳號無管理權限，顯示權限錯誤訊息，且不得進入 admin 頁
- `/login` 維持一般前台登入入口
- `/login` 登入成功後沿用現有邏輯：
  - admin / editor 可導向 admin 區
  - 一般 user 導向 `/profile`

## 頁面設計

### 首頁 `/`

以 `index.html` 為主要視覺來源。

保留功能：

- 文章精選區塊使用真文章資料
- CTA 連往 `/articles`
- 文章卡可連往 `/post/:slug`
- loading / error / empty state 維持現有資料載入模式

先用假資料或展示文案的區塊：

- 搜尋框
- 標籤 / 類別
- 額外資訊卡
- 非 API 支援的統計數字

### 文章列表 `/articles`

以 `post_list.html` 為主要視覺來源。

保留功能：

- 文章清單使用 `/api/posts`
- 文章卡連往 `/post/:slug`
- loading / error / empty state 保留

先用假資料或展示文案的區塊：

- 側欄簡介
- 分類 / 篩選清單
- 推薦內容
- 非 API 支援的摘要模組

### 文章詳情 `/post/:slug`

以 `post_detail.html` 為主要視覺來源。

保留功能：

- 使用 slug 載入真文章資料
- 顯示標題、摘要、日期、作者、封面、內文
- 保留 loading / error / not found state
- 內容仍經既有 render / sanitize 流程處理

若靜態稿有但資料源暫無支援，可先採以下策略：

- 閱讀時間：假資料或隱藏
- 觀看數：假資料或隱藏
- 留言數：假資料或隱藏

### About `/about`

新增純靜態頁，主要內容以 `about.html` 為準。

規則：

- 不打 API
- 內容使用 i18n 文案或前端固定內容模組
- header / footer 與前台一致

### Contact `/contact`

新增純靜態頁，主要內容以 `contact.html` 為準。

規則：

- 不打 API
- 不送出表單
- 若靜態稿有表單，先做純展示
- 聯絡資訊使用固定文案或假資料

### Login `/login`

以 `login.html` 為主要視覺來源。

規則：

- 保留現有一般使用者登入流程
- 登入成功後維持現有角色分流
- 樣式改成新前台視覺，但不改服務層 API

### Admin Login `/admin/login`

新增獨立頁面，視覺以 `admin_login.html` 為準。

規則：

- 可共用既有登入 API
- 但登入成功後必須額外檢查是否具 admin / editor 權限
- 權限不足時顯示明確錯誤訊息
- 不與一般 `/login` 共用同一路由

### Register `/register`

雖然靜態頁未明示獨立註冊頁，但前台已存在功能，需延續同一視覺語言。

規則：

- 保留現有註冊流程
- 樣式與新前台一致

### Profile `/profile`

延續既有功能，但視覺與共用前台 shell 對齊。

規則：

- 保留會員資料更新功能
- 沿用現有 API
- header / footer 與新前台一致

## 共用元件與檔案邊界

### 保留

- `frontend/src/layouts/PublicLayout.vue`
- `frontend/src/components/public/PublicCoverMedia.vue`
- `frontend/src/services/api.ts`
- `frontend/src/stores/auth.ts`

### 新增或擴充

- 新增 `AboutPage.vue`
- 新增 `ContactPage.vue`
- 新增 `AdminLoginPage.vue`
- 視需要新增前台靜態內容模組，例如 `frontend/src/content/publicStaticContent.ts`
- 視需要抽出重複卡片或區塊元件，但只在重複明確時抽離

### 樣式原則

- 不直接搬運 Tailwind CDN 寫法進專案
- 以現有 `frontend/src/style.css` 為基礎擴充
- 前台新樣式集中在 `public-*` 命名空間
- admin 既有樣式維持隔離，避免互踩

## 資料策略

### 真資料

以下區塊應優先吃既有真資料：

- 首頁文章精選
- 文章列表
- 文章詳情
- 個人資料

### 假資料 / 固定文案

以下區塊可先使用假資料或固定文案：

- about 內容
- contact 內容
- 首頁附加資訊區
- 列表頁側欄
- 非核心數字型統計
- 靜態展示型 CTA 說明

假資料應集中管理，不散落在各頁內聯。

## 錯誤處理

- public API 失敗時，頁面需保留可視錯誤訊息
- 文章不存在時，詳情頁需顯示 not found 狀態
- `/admin/login` 權限不足時，需顯示「此帳號無管理權限」等明確訊息
- 純靜態頁不得因無資料源而出現永久 loading

## 測試設計

### Router

補強以下測試：

- `/about` 已註冊
- `/contact` 已註冊
- `/admin/login` 已註冊
- `/admin/*` 未登入導向 `/admin/login`

### Page Rendering

補強以下測試：

- About 頁面 shell render
- Contact 頁面 shell render
- Admin login 頁面 shell render
- PublicLayout 導覽有 about / contact
- mobile menu 有 about / contact

### Auth Behavior

補強以下測試：

- `/admin/login` 成功登入且具權限時可進 admin
- `/admin/login` 成功登入但無權限時顯示錯誤
- 一般 `/login` 仍維持既有分流行為

### Existing Public Pages

保留並更新以下測試：

- 首頁真資料渲染
- 列表頁真資料渲染
- 文章詳情頁真資料渲染

## 風險與限制

- 靜態 HTML 部分文案有編碼異常，實作時應以視覺結構為準，不直接照抄錯碼文字
- 若靜態稿存在大量只適合展示站的互動，需判斷是否保留展示層而不實作真功能
- `/admin/login` 與 `/login` 會共用登入 API，但路由與頁面狀態需明確分離
- about / contact 若未來要 API 化，應透過集中資料模組降低重構成本

## 驗收條件

- 現有前台主要頁面改為對齊 `page_example/front` 的視覺方向
- `/about`、`/contact`、`/admin/login` 可正常進入
- 文章首頁 / 列表 / 詳情仍使用真文章資料
- about / contact 與其他無後端資料區塊先由假資料或固定文案支撐
- `/admin/*` 未登入時會導向 `/admin/login`
- `/admin/login` 對非管理角色有明確阻擋
