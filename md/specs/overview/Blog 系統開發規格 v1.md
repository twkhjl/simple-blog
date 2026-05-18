Blog 系統開發規格 v1.1

1. 專案目標

開發一套可部署的 Blog 系統，包含：

1. 前台 Blog
2. 後台管理系統
3. 使用者登入 / 註冊
4. 管理員登入
5. 文章管理
6. 圖片 / 檔案上傳
7. 權限控管

系統需符合：

- 前台與後台都部署到 GitHub Pages
- 後端 API 使用 Cloudflare Workers
- 帳號驗證使用 Supabase Auth
- 資料庫使用 Supabase PostgreSQL
- 圖片與檔案使用 Cloudflare R2

2. 技術架構

2.1 整體架構

Browser
  ↓
GitHub Pages Frontend
  ↓ API Request + Supabase Access Token
Cloudflare Worker API
  ↓
Supabase Auth / PostgreSQL
  ↓
Cloudflare R2

2.2 技術選型

Frontend:
- Vite
- Vue 3
- Vue Router Hash History
- GitHub Pages 部署

Backend:
- Cloudflare Workers
- Hono
- TypeScript

Auth:
- Supabase Auth

Database:
- Supabase PostgreSQL

File Storage:
- Cloudflare R2

Deploy:
- GitHub Pages
- GitHub Actions
- Cloudflare Workers / Wrangler

2.3 技術決策

第一版前端固定使用 Vue 3 + Vite，不再保留 React 分支。

原因：

- 後台表單、列表、CRUD 畫面較多，Vue 寫法較直接
- 檔案結構容易維持清楚
- GitHub Pages + Hash Router 配置簡單

3. 部署設計

3.1 前端部署

前台與後台放在同一個 Vite SPA 專案中。

部署位置：

GitHub Pages

部署方式：

- 使用 GitHub Actions 自動建置與發佈 frontend
- 不使用 `gh-pages` npm 套件作為主要部署方案
- 每次合併到預設分支後，自動執行 build 與 deploy

網址範例：

https://your-github-username.github.io/blog-system/

因為 GitHub Pages 是靜態網站，前端路由使用 Hash Router：

https://your-github-username.github.io/blog-system/#/
https://your-github-username.github.io/blog-system/#/post/launch-checklist
https://your-github-username.github.io/blog-system/#/login
https://your-github-username.github.io/blog-system/#/admin
https://your-github-username.github.io/blog-system/#/admin/posts

3.2 後端部署

Cloudflare Worker API：

https://blog-api.your-worker.workers.dev

之後可綁定自訂網域：

https://api.yourdomain.com

3.3 圖片 / 檔案網址

第一版使用 Worker 代理讀取：

https://api.yourdomain.com/files/posts/2026/05/example.webp

之後可切換成 R2 public custom domain：

https://assets.yourdomain.com/posts/2026/05/example.webp

第一版先用 Worker 代理，方便做權限與後續擴充。

4. 專案資料夾結構

blog-system/
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ main.ts
│  │  ├─ App.vue
│  │  ├─ style.css
│  │  ├─ router/
│  │  │  └─ index.ts
│  │  ├─ services/
│  │  │  ├─ api.ts
│  │  │  ├─ auth.ts
│  │  │  └─ supabase.ts
│  │  ├─ layouts/
│  │  │  ├─ PublicLayout.vue
│  │  │  └─ AdminLayout.vue
│  │  ├─ pages/
│  │  │  ├─ public/
│  │  │  │  ├─ HomePage.vue
│  │  │  │  ├─ PostListPage.vue
│  │  │  │  └─ PostDetailPage.vue
│  │  │  ├─ auth/
│  │  │  │  ├─ LoginPage.vue
│  │  │  │  └─ RegisterPage.vue
│  │  │  └─ admin/
│  │  │     ├─ AdminDashboardPage.vue
│  │  │     ├─ AdminPostListPage.vue
│  │  │     └─ AdminPostEditPage.vue
│  │  ├─ components/
│  │  │  ├─ common/
│  │  │  ├─ public/
│  │  │  └─ admin/
│  │  └─ types/
│  │     └─ index.ts
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ .env.example
├─ worker/
│  ├─ src/
│  │  ├─ index.ts
│  │  ├─ routes/
│  │  │  ├─ public.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ posts.ts
│  │  │  ├─ files.ts
│  │  │  └─ admin.ts
│  │  ├─ lib/
│  │  │  ├─ supabase.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ r2.ts
│  │  │  ├─ cors.ts
│  │  │  └─ response.ts
│  │  ├─ middleware/
│  │  │  ├─ requireAuth.ts
│  │  │  └─ requireRole.ts
│  │  └─ types.ts
│  ├─ package.json
│  ├─ wrangler.toml
│  └─ .dev.vars.example
├─ database/
│  ├─ schema.sql
│  ├─ policies.sql
│  ├─ triggers.sql
│  └─ seed.sql
├─ docs/
│  ├─ architecture.md
│  ├─ deployment.md
│  └─ api.md
├─ README.md
├─ PROJECT_NOTES.md
└─ .gitignore

v1 備註：

- `AdminCategoryPage.vue`、`AdminCommentPage.vue`、`AdminUserPage.vue` 不在 v1 建立
- `comments.ts` 不在 v1 建立
- 分類、標籤、留言、使用者管理相關結構保留到 v2 再擴充

5. MVP 範圍

5.1 第一版包含

前台：
1. 文章列表
2. 文章詳細
3. 使用者登入
4. 使用者註冊

後台：
1. 後台登入檢查
2. 文章列表
3. 新增文章
4. 編輯文章
5. 刪除文章
6. 草稿 / 發布狀態切換
7. 封面圖上傳到 R2

後端：
1. Supabase JWT 驗證
2. 角色權限檢查
3. `posts` CRUD
4. `files` upload
5. public posts API
6. `/api/me`

資料庫：
1. `profiles`
2. `posts`
3. `files`

5.2 第一版不包含

以下功能先不進 MVP，不實作對應頁面與 API：

1. 分類管理
2. 標籤管理
3. 留言系統
4. 使用者管理頁
5. 複雜儀表板
6. 文章版本紀錄
7. 多作者審核流程
8. 通知系統
9. 站內搜尋全文索引
10. SEO 靜態產生
11. 金流

備註：

- 文件中若提到分類、標籤、留言、使用者管理，視為 v2 預留，不納入 v1.1 交付。
- 前端可先保留對應資料夾命名，但不必建立畫面。

6. 前端功能規格

6.1 前台頁面

首頁 `/#/`

功能：

- 顯示已發布文章列表
- 預設依 `published_at desc` 排序
- 顯示文章標題
- 顯示文章摘要
- 顯示封面圖
- 顯示發布日期
- 點擊文章進入詳細頁

文章詳細頁 `/#/post/:slug`

功能：

- 顯示文章標題
- 顯示文章內容
- 顯示封面圖
- 顯示作者
- 顯示發布日期
- 僅可讀取 `status = published` 文章

登入頁 `/#/login`

功能：

- 使用 Supabase Auth 登入
- Email / Password 登入
- 登入成功後取得 Supabase session
- 回到原頁面或首頁

註冊頁 `/#/register`

功能：

- 使用 Supabase Auth 註冊
- 建立一般 `user` 帳號
- 註冊成功後由資料庫 trigger 自動建立 `profiles`

個人資料頁 `/#/profile`

功能：

- 顯示目前登入者資料
- 修改 `display_name`
- 顯示使用者 `role`

6.2 後台頁面

後台路由：

- `/#/admin`
- `/#/admin/posts`
- `/#/admin/posts/new`
- `/#/admin/posts/:id/edit`

後台首頁 `/#/admin`

功能：

- 檢查是否登入
- 檢查是否具有 `editor/admin/super_admin` 權限
- 顯示簡單統計：
  - 文章總數
  - 草稿數
  - 已發布數

文章列表 `/#/admin/posts`

功能：

- 顯示所有文章
- 可依狀態篩選：`draft / published / archived`
- 可搜尋標題
- 可進入編輯頁
- 可刪除文章

新增文章 `/#/admin/posts/new`

欄位：

- `title`
- `slug`
- `excerpt`
- `content`
- `cover_image_key`
- `status`
- `published_at`

功能：

- 新增文章
- 上傳封面圖到 R2
- 儲存草稿
- 發布文章

編輯文章 `/#/admin/posts/:id/edit`

功能：

- 修改文章內容
- 修改封面圖
- 草稿與發布切換
- 封存文章
- 刪除文章

7. 角色與權限設計

7.1 角色定義

`user`
- 一般使用者
- 可瀏覽已發布文章
- 可修改自己的 profile

`editor`
- 可進入後台
- 可新增 / 編輯 / 發布文章
- 可上傳圖片
- 僅可管理自己建立的文章

`admin`
- 擁有 `editor` 全部權限
- 可管理所有文章

`super_admin`
- 擁有全部權限
- 可修改其他使用者 role
- 可停用 / 啟用其他使用者

7.2 v1 權限矩陣

`user`
- 前台文章讀取：可
- 個人資料修改：可
- 後台登入：不可
- 文章 CRUD：不可
- 檔案上傳：不可

`editor`
- 前台文章讀取：可
- 個人資料修改：可
- 後台登入：可
- 自己文章 CRUD：可
- 他人文章 CRUD：不可
- 檔案上傳：可
- 管理其他使用者：不可

`admin`
- 前台文章讀取：可
- 個人資料修改：可
- 後台登入：可
- 自己文章 CRUD：可
- 他人文章 CRUD：可
- 檔案上傳：可
- 管理其他使用者：不可

`super_admin`
- 全部可

7.3 權限規則

- 前端只做畫面保護，不能作為真正安全依據
- 真正權限檢查必須在 Cloudflare Worker
- `editor` 只可管理自己建立的文章
- `admin` 可管理所有文章
- `super_admin` 才能修改其他人的 `role` 與 `status`
- 使用者不可修改自己的 `role`
- 不可把最後一位 `super_admin` 降權或停用

8. 認證與授權流程

8.1 前端登入流程

1. 使用者在 GitHub Pages 前端輸入 email/password
2. 前端呼叫 Supabase Auth
3. Supabase 回傳 session
4. 前端保存 session
5. 呼叫 Worker API 時帶上 access token

Request Header 範例：

`Authorization: Bearer <supabase_access_token>`

8.2 Worker 驗證流程

1. Worker 從 Authorization header 取得 Bearer token
2. 驗證 Supabase JWT
3. 取得 user id
4. 查詢 `profiles`
5. 檢查 `status = active`
6. 檢查 `role` 是否符合 API 要求

8.3 Worker 與 RLS 分工

- 前端不直接對 Supabase 資料表做 CRUD
- 前端所有業務資料請求都經過 Worker
- Worker 連 Supabase 時使用 `service_role_key`
- RLS 仍需開啟，避免未來誤用 client key 直連資料表
- v1 的主要授權邏輯在 Worker

9. 文章內容規格

9.1 內容格式

- `content` 使用 Markdown 純文字儲存
- `excerpt` 可手動輸入，不自動截斷產生
- 前端渲染 Markdown 時必須經過 sanitizer
- 不直接渲染未處理 HTML

9.2 slug 規則

- slug 必須全站唯一
- 建議只允許小寫英數、連字號 `-`
- 若使用者未輸入 slug，可由前端依 title 自動產生初值
- 若 slug 已存在，API 回傳 `409 Conflict`

9.3 狀態規則

- `draft`：未發布，不可出現在前台 public API
- `published`：已發布，可出現在前台 public API
- `archived`：封存，不可出現在前台 public API

規則：

- `status = published` 時，`published_at` 必須有值
- `status = draft` 時，`published_at` 可為 `null`
- `status = archived` 時，保留原 `published_at`

10. API 規格

10.1 共用規則

Base URL：

`https://blog-api.your-worker.workers.dev`

回應格式：

成功：

```json
{
  "success": true,
  "data": {}
}
```

失敗：

```json
{
  "success": false,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "Post not found"
  }
}
```

常用狀態碼：

- `200 OK`：查詢成功
- `201 Created`：建立成功
- `400 Bad Request`：參數錯誤
- `401 Unauthorized`：未登入或 token 無效
- `403 Forbidden`：權限不足或帳號停用
- `404 Not Found`：資源不存在
- `409 Conflict`：slug 重複等衝突
- `413 Payload Too Large`：上傳檔案超限
- `415 Unsupported Media Type`：檔案格式不支援
- `500 Internal Server Error`：伺服器錯誤

10.1.1 欄位驗證規則

通用規則：

- 所有字串欄位在後端驗證前先 `trim()`
- 僅含空白的字串視為未填
- 驗證失敗回 `400 Bad Request`

欄位表：

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `title` | string | 是 | 長度 1-200 |
| `slug` | string | 是 | 長度 1-120，只允許 `a-z`、`0-9`、`-` |
| `excerpt` | string | 否 | 長度 0-500 |
| `content` | string | 是 | 長度 1-50000 |
| `displayName` | string | 否 | 長度 1-50；若有傳值不可為空白 |
| `keyword` | string | 否 | 長度 1-100 |
| `status` | string | 是 | 只允許 `draft`、`published`、`archived` |
| `publishedAt` | string(datetime) | 否 | ISO 8601 格式 |

檔案欄位規則：

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `file` | binary | 是 | 大小 <= 5MB |
| `folder` | string | 是 | v1 只允許 `posts` |

10.2 Public API

取得已發布文章列表

`GET /api/posts`

Query：

- `page`，預設 `1`
- `limit`，預設 `10`，最大 `50`
- `keyword`，搜尋 `title`

排序：

- 固定 `published_at desc`

Response：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "文章標題",
        "slug": "post-slug",
        "excerpt": "文章摘要",
        "coverImageUrl": "https://...",
        "publishedAt": "2026-05-16T00:00:00Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

取得文章詳細

`GET /api/posts/:slug`

規則：

- 僅回傳 `published` 文章

Response：

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "文章標題",
    "slug": "post-slug",
    "content": "文章內容",
    "excerpt": "文章摘要",
    "coverImageUrl": "https://...",
    "status": "published",
    "author": {
      "id": "uuid",
      "displayName": "Editorial Account"
    },
    "publishedAt": "2026-05-16T00:00:00Z"
  }
}
```

10.3 Auth API

取得目前使用者

`GET /api/me`

需要登入。

Response：

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "member@demo.invalid",
    "displayName": "Editorial Account",
    "role": "admin",
    "status": "active"
  }
}
```

更新自己的 profile

`PATCH /api/me`

需要登入。

Body：

```json
{
  "displayName": "Team Alias"
}
```

規則：

- 只允許修改自己的 `display_name`
- `displayName` 不可為空白字串
- `displayName` 可傳 `null` 表示清空
- 不允許修改 `role`、`status`、`email`

Response：

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "member@demo.invalid",
    "displayName": "Team Alias",
    "role": "user",
    "status": "active"
  }
}
```

10.4 Admin API

所有 `/api/admin/*` 都需要：

- 已登入
- `status = active`
- `role in (editor, admin, super_admin)`

後台取得文章列表

`GET /api/admin/posts`

Query：

- `page`，預設 `1`
- `limit`，預設 `20`，最大 `100`
- `status`
- `keyword`

排序：

- 固定 `updated_at desc`

權限規則：

- `editor` 只看到自己建立的文章
- `admin` 與 `super_admin` 可看到全部文章

Response：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "文章標題",
        "slug": "post-slug",
        "status": "draft",
        "authorId": "uuid",
        "authorDisplayName": "Editorial Account",
        "publishedAt": "2026-05-16T00:00:00Z",
        "updatedAt": "2026-05-16T00:00:00Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 30
  }
}
```

後台取得單篇文章

`GET /api/admin/posts/:id`

權限規則：

- `editor` 僅可讀取自己建立的文章
- `admin` 與 `super_admin` 可讀取全部文章

Response：

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "文章標題",
    "slug": "post-slug",
    "excerpt": "文章摘要",
    "content": "文章內容",
    "coverImageKey": "posts/2026/05/xxx.webp",
    "status": "draft",
    "authorId": "uuid",
    "authorDisplayName": "Editorial Account",
    "publishedAt": null,
    "createdAt": "2026-05-16T00:00:00Z",
    "updatedAt": "2026-05-16T00:00:00Z"
  }
}
```

新增文章

`POST /api/admin/posts`

Body：

```json
{
  "title": "文章標題",
  "slug": "post-slug",
  "excerpt": "文章摘要",
  "content": "文章內容",
  "coverImageKey": "posts/2026/05/xxx.webp",
  "status": "draft",
  "publishedAt": null
}
```

規則：

- `title` 必填
- `slug` 必填且唯一
- `content` 必填
- `status` 只允許 `draft / published / archived`
- `status = published` 時，若 `publishedAt` 未傳，後端自動補 `now()`
- `editor` 建立文章時，`author_id` 一律寫入自己帳號

更新文章

`PUT /api/admin/posts/:id`

規則：

- 欄位與建立文章相同
- 若由 `draft` 切成 `published` 且原本 `published_at` 為空，後端自動補 `now()`
- `editor` 不可修改他人文章，違反時回 `403`

刪除文章

`DELETE /api/admin/posts/:id`

規則：

- 只刪文章資料，不立即刪除 R2 檔案
- 後續再以清理工具處理孤兒檔案
- `editor` 不可刪除他人文章，違反時回 `403`

10.5 File API

上傳檔案

`POST /api/files/upload`

需要登入。
需要 `editor/admin/super_admin`。

FormData：

- `file`
- `folder`

`folder` 允許值：

- `posts`

備註：

- v1 實際只支援 `posts`
- `attachments` 與 `avatars` 保留到 v2
- `application/pdf` 雖允許上傳，但 v1 僅視為後台檔案資產，不在前台文章頁提供附件顯示流程

限制：

允許類型：

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`
- `application/pdf`

單檔大小：

- MVP 限制 `5MB`

Response：

```json
{
  "success": true,
  "data": {
    "key": "posts/2026/05/uuid.webp",
    "url": "https://api.yourdomain.com/files/posts/2026/05/uuid.webp",
    "fileName": "cover.webp",
    "mimeType": "image/webp",
    "size": 123456
  }
}
```

讀取公開檔案

`GET /files/*`

規則：

- v1 僅處理公開檔案
- 找不到檔案回 `404`

11. 資料庫規格摘要

完整資料庫文件另放：

`md/specs/database/database-schema-v1.md`

11.1 v1 實際建立表

- `profiles`
- `posts`
- `files`

11.2 v2 預留表

- `categories`
- `post_categories`
- `tags`
- `post_tags`
- `comments`

11.3 DB 文件涵蓋內容

獨立 DB 文件必須包含：

- table schema
- constraint
- index
- RLS policy
- trigger
- seed / bootstrap 規則
- migration 建立順序

12. 初始化與資料生命週期

12.1 profiles 自動建立

註冊後 `profiles` 建立方式：

- 由 Supabase 資料庫 trigger 在 `auth.users` 新增後自動建立 `public.profiles`
- `email` 取自 `auth.users.email`
- `display_name` 預設為 `null`
- `role` 預設 `user`
- `status` 預設 `active`
- trigger 建立失敗時，該次註冊視為失敗，不允許留下缺少 `profiles` 的帳號

12.2 第一個管理員建立方式

第一個 `super_admin` 不透過前台註冊流程設定權限。

做法：

1. 先正常註冊一個帳號
2. 由專案管理者在 Supabase SQL Editor 手動更新該帳號的 `profiles.role = 'super_admin'`
3. 上線後其他使用者權限只能由 `super_admin` 維護

12.3 文章刪除與檔案清理

- 刪除文章時，只刪除文章資料
- 關聯封面圖不立即刪除
- 後續以批次工具清理未被引用的 R2 檔案

13. R2 檔案設計

13.1 Bucket

`blog-assets`

13.2 R2 Key 規則

`posts/{year}/{month}/{uuid}.{ext}`

範例：

`posts/2026/05/0c1d2e3f.webp`

v2 預留：

- `avatars/{userId}/{uuid}.{ext}`
- `attachments/{year}/{month}/{uuid}.{ext}`

13.3 檔案安全規則

1. 不允許直接使用使用者上傳的原始檔名作為 R2 key
2. 必須重新產生 uuid 檔名
3. 必須檢查 MIME type
4. 必須限制檔案大小
5. 後台上傳必須檢查 role
6. `folder` 不在允許列表時回 `400`

14. 環境變數

14.1 Frontend `.env`

`VITE_SUPABASE_URL=https://xxxx.supabase.co`
`VITE_SUPABASE_ANON_KEY=your-anon-key`
`VITE_API_BASE_URL=https://blog-api.your-worker.workers.dev`

這些會被打包到前端，所以不能放秘密。

14.2 Worker `.dev.vars`

`SUPABASE_URL=https://xxxx.supabase.co`
`SUPABASE_ANON_KEY=your-anon-key`
`SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`
`SUPABASE_JWT_SECRET=your-jwt-secret`
`ALLOWED_ORIGINS=http://localhost:5173,https://your-github-username.github.io`

正式環境使用 Wrangler secrets：

`wrangler secret put SUPABASE_URL`
`wrangler secret put SUPABASE_ANON_KEY`
`wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
`wrangler secret put SUPABASE_JWT_SECRET`
`wrangler secret put ALLOWED_ORIGINS`

15. CORS 規格

Worker 必須允許：

- `http://localhost:5173`
- `https://your-github-username.github.io`
- `https://your-custom-domain.com`

允許 Header：

- `Content-Type`
- `Authorization`

允許 Methods：

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`

所有 OPTIONS request 必須正確回應。

16. GitHub Pages 注意事項

16.1 Vite base

如果部署到：

`https://your-github-username.github.io/blog-system/`

`vite.config.ts`：

```ts
export default defineConfig({
  base: '/blog-system/',
})
```

如果部署到自訂網域：

`https://blog.yourdomain.com/`

使用：

```ts
export default defineConfig({
  base: '/',
})
```

16.2 部署策略

前端部署固定使用 GitHub Actions。

最低要求：

- workflow 在 push 到預設分支時自動執行
- workflow 先安裝相依、執行 frontend build
- build 產物使用 Vite `dist`
- deploy 目標為 GitHub Pages
- deploy 後網址需能正常載入前台與後台 SPA 路由

16.3 靜態資源引用規則

為了確保 GitHub Pages 子路徑部署正常，靜態資源必須遵守以下規則：

- 不直接寫死根路徑資源，例如 `/logo.png`、`/images/banner.jpg`
- `src` 內資源優先使用 Vite import，例如 `import cover from './assets/cover.png'`
- `public/` 內資源若需直接引用，必須透過 `import.meta.env.BASE_URL` 組路徑
- API base URL 與靜態資源 URL 不混用
- 文章封面圖、R2 圖片屬遠端資源，不受 `base` 影響

範例：

```ts
const logoUrl = `${import.meta.env.BASE_URL}logo.png`
```

錯誤示例：

```ts
const logoUrl = '/logo.png'
```

16.4 Router

MVP 使用 Hash Router：

- `/#/`
- `/#/post/:slug`
- `/#/admin/posts`

避免 GitHub Pages 重新整理後 404。

17. 安全規格

17.1 絕對不能放前端

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `Cloudflare API Token`
- 任何資料庫密碼

17.2 後台安全

1. 前端後台頁面被看到沒關係
2. 真正資料操作必須經過 Worker
3. Worker 必須檢查 JWT
4. Worker 必須檢查 role
5. Worker 必須檢查 `status = active`

17.3 XSS 防護

文章內容如果允許 HTML，必須消毒。

MVP 規則：

- 文章內容使用 Markdown
- 前端渲染 Markdown 時使用 sanitizer
- 不直接使用 `v-html` 顯示未處理輸入

17.4 SQL 安全

- 所有資料庫操作透過 Supabase client
- 不手動拼接 SQL 字串

18. 建議開發順序

Phase 1：專案初始化
1. 建立 GitHub repo
2. 建立 frontend Vite 專案
3. 建立 worker Hono 專案
4. 建立 Supabase project
5. 建立 R2 bucket
6. 設定 GitHub Pages
7. 設定 Wrangler

Phase 2：Supabase 資料庫
1. 建立 `profiles` 表
2. 建立 `posts` 表
3. 建立 `files` 表
4. 建立 `profiles` 自動建立 trigger
5. 建立第一個 `super_admin`

Phase 3：Auth
1. 前端串 Supabase 登入
2. 前端取得 session
3. Worker 驗證 Authorization Bearer token
4. Worker 查 `profiles.role`
5. 完成 `/api/me`

Phase 4：文章功能
1. 後台文章列表
2. 新增文章
3. 編輯文章
4. 刪除文章
5. 發布文章
6. 前台文章列表
7. 前台文章詳細

Phase 5：R2 上傳
1. Worker 綁定 R2
2. 完成 `/api/files/upload`
3. 後台上傳封面圖
4. `posts` 儲存 `cover_image_key`
5. 前台顯示封面圖

Phase 6：部署
1. frontend build
2. deploy to GitHub Pages
3. worker deploy
4. 設定 Supabase Redirect URLs
5. 設定 CORS allowed origins
6. 測試正式環境登入與後台功能

19. 驗收標準

19.1 Happy Path

1. 使用者可以註冊 / 登入
2. `editor` 以上角色可登入後台
3. `editor` 以上角色可新增文章
4. `editor` 以上角色可編輯文章
5. `editor` 以上角色可刪除文章
6. `editor` 以上角色可上傳封面圖
7. 前台可以看到已發布文章列表
8. 前台可以看到文章詳細頁
9. 圖片可成功存到 R2 並顯示
10. 前端可部署到 GitHub Pages
11. Worker 可部署到 Cloudflare

19.2 權限與失敗情境

1. 未登入呼叫 `/api/me` 回 `401`
2. 未登入呼叫 `/api/admin/posts` 回 `401`
3. `user` 呼叫 `/api/admin/posts` 回 `403`
4. `disabled` 帳號呼叫任何受保護 API 回 `403`
5. slug 重複建立文章回 `409`
6. 上傳超過 5MB 檔案回 `413`
7. 上傳不支援格式回 `415`
8. public API 不可讀取 `draft` 或 `archived` 文章

19.3 部署與整合情境

1. 使用者登入後重新整理頁面，session 仍可用
2. 直接開啟 `/#/admin/posts`，已登入且有權限時可正常載入
3. 直接開啟 `/#/admin/posts`，未登入時會導向登入頁
4. GitHub Pages 呼叫 Worker API 時，CORS preflight 正常通過
5. R2 圖片在正式前端網域可正常顯示

20. 最終建議版本

第一版固定使用：

Frontend：
- Vite
- Vue 3
- Hash Router
- GitHub Pages

Backend：
- Cloudflare Workers
- Hono
- TypeScript

Auth：
- Supabase Auth

Database：
- Supabase PostgreSQL

Storage：
- Cloudflare R2

資料流：

Frontend → Worker API → Supabase / R2

這版規格可直接用來：

1. 建立 repo
2. 開資料表
3. 建 API
4. 做前端頁面
5. 規劃驗收
