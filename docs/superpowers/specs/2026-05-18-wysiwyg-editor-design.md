# WYSIWYG Editor Design

Date: 2026-05-18
Status: Implementation-ready

## Goal

將 admin 文章編輯頁目前的假 toolbar + `textarea` 改為可正式使用的 WYSIWYG editor，並將內容儲存為 `HTML string`。新設計需沿用現有 `posts.content` 欄位與既有 admin API，避免一次改動資料模型或後端 schema。

本次目標不是做完整 CMS，只交付可投入日常編輯的第一版 editor。

## Scope

### In Scope

- 以現成 Vue 3 套件替換文章內容輸入區
- 儲存格式統一為 `HTML string`
- 支援基本 rich text 能力
- 支援從現有資料載入 HTML
- 支援儲存前最基本內容驗證
- 公開頁與 admin 編輯介面可正確顯示 HTML 內容
- 加入 HTML sanitize 流程，避免儲存與渲染風險

### Out of Scope

- 內文圖片插入與圖片編排
- 表格、程式碼區塊、iframe、embed
- 協作編輯
- 歷史版本
- 自動儲存
- Markdown 雙向轉換

## Recommendation

採用 `Tiptap` 作為 editor 核心，第一期儲存 `HTML string`。

原因：

- 與 Vue 3 整合成熟
- 可先以基本 toolbar 交付，後續再擴充 extension
- 目前後端 `content` 已是字串欄位，改存 HTML 成本最低
- 未來若要補圖片、清單、blockquote、link、heading，擴充路徑清楚

## Alternatives Considered

### Option A: Tiptap + HTML

優點：

- 擴充性最好
- Vue 生態整合自然
- 對現有資料與 API 改動最小

缺點：

- 需自行定 toolbar 與 sanitize 規則
- 需處理 editor state 與 HTML 同步

### Option B: Toast UI Editor + HTML/Markdown

優點：

- 內建功能較多
- 上手快

缺點：

- 客製整合感較重
- 與既有 UI 風格整合彈性較弱

### Option C: 保留 textarea，外掛 preview

優點：

- 成本最低

缺點：

- 不符合 WYSIWYG 需求
- 無法改善作者編輯體驗

結論：採 Option A。

## Concrete Technical Decisions

本 spec 直接固定以下決策，避免 implementation 階段再次發散：

- Editor library: `@tiptap/vue-3`
- Core extensions: `StarterKit`, `Link`, `Placeholder`
- Frontend sanitize library: `dompurify`
- Backend sanitize library: `sanitize-html`
- Content transport format: API 與 DB 一律使用 `HTML string`
- Editor component path: `frontend/src/components/editor/RichTextEditor.vue`
- Shared editor styles path: `frontend/src/style.css`
- Backend sanitize entrypoint: `worker/src/lib/content.ts`
- Public article render path: `frontend/src/pages/public/PostDetailPage.vue`
- Admin editor field source of truth: `form.content`
- 第一階段不做 inline image、table、code block、raw HTML mode

## Dependencies

### Frontend

新增依賴：

- `@tiptap/vue-3`
- `@tiptap/starter-kit`
- `@tiptap/extension-link`
- `@tiptap/extension-placeholder`
- `dompurify`

### Worker

新增依賴：

- `sanitize-html`

## User Experience

admin 編輯頁保留現有版面結構：

- 左側主要編輯區：標題、slug、excerpt、content editor
- 右側側欄：狀態、metadata、封面圖、操作按鈕

內容區改為：

- 上方固定一排 editor toolbar
- 下方為 editor content 區
- toolbar 提供明確啟用狀態
- 空內容時顯示 placeholder

第一期支援格式：

- Paragraph
- Bold
- Italic
- Heading 1
- Heading 2
- Bullet List
- Ordered List
- Blockquote
- Link
- Hard Break
- Undo / Redo

第一期 toolbar 固定包含：

- Paragraph
- H1
- H2
- Bold
- Italic
- Bullet List
- Ordered List
- Blockquote
- Link
- Undo
- Redo

第一期不提供：

- 內文圖片
- 表格
- HTML 原始碼切換

## Data Contract

### Stored Format

`posts.content` 持續使用單一字串欄位，內容改存 sanitize 後的 HTML。

範例：

```html
<h1>Article title</h1>
<p>Intro paragraph.</p>
<blockquote>Quoted text.</blockquote>
<ul>
  <li>Point one</li>
  <li>Point two</li>
</ul>
```

### Compatibility

- 新文章：直接由 editor 產生 HTML
- 舊文章：
  - 若內容符合 HTML tag 偵測規則 `/<\/?[a-z][\s\S]*>/i`，直接當 HTML 載入
  - 若內容不含 HTML tag，視為純文字內容，前端載入 editor 前先 escape HTML 特殊字元，再依空行切段轉成 `<p>` block
  - 舊文第一次重新儲存後，資料會自然轉為標準 HTML 格式

此策略避免一次性 migration，同時降低舊純文字內容在 editor 內顯示混亂的風險。

## Architecture

### Files To Add

- `frontend/src/components/editor/RichTextEditor.vue`
- `frontend/src/utils/richText.ts`
- `worker/src/lib/content.ts`
- `frontend/tests/rich-text.spec.ts`
- `worker/tests/content.spec.ts`

### Files To Modify

- `frontend/src/pages/admin/AdminPostEditPage.vue`
- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/style.css`
- `worker/src/routes/admin.ts`
- `frontend/package.json`
- `worker/package.json`

### Frontend

新增一個獨立 editor 元件：

- `frontend/src/components/editor/RichTextEditor.vue`

責任：

- 初始化 Tiptap editor
- 接收 `modelValue: string`
- 對外發出 `update:modelValue`
- 渲染 toolbar
- 封裝 editor 指令與 UI 狀態
- 處理空內容判斷
- 處理 link 編輯 UI
- 在 unmount 時正確 destroy editor instance

`frontend/src/utils/richText.ts` 責任：

- `isHtmlLike(input: string): boolean`
- `plainTextToHtml(input: string): string`
- `sanitizeRenderHtml(input: string): string`
- `isMeaningfulEditorHtml(input: string): boolean`

此檔案只放純函式，不放 Vue state。

admin 頁面 [AdminPostEditPage.vue](/D:/codes/simple-blog/frontend/src/pages/admin/AdminPostEditPage.vue:1) 改為只負責：

- 載入 API 資料
- 綁定 `form.content`
- 儲存與錯誤顯示

不要把 editor 實作直接塞回頁面，避免該頁繼續膨脹。

### Backend

後端 API contract 不變：

- `POST /api/admin/posts`
- `PUT /api/admin/posts/:id`

仍接受：

```json
{
  "content": "<p>...</p>"
}
```

後端新增內容 sanitize 流程，避免只信任 admin 前端。

固定實作位置：

- `worker/src/lib/content.ts`

此模組責任：

- `sanitizeRichTextHtml(input: string): string`
- `isMeaningfulRichText(input: string): boolean`
- 統一 allowlist 規則

`admin.ts` 只負責呼叫此模組，不直接內嵌 sanitize 規則。

`worker/src/lib/content.ts` 具體輸出：

- `sanitizeRichTextHtml(input: string): string`
- `isMeaningfulRichText(input: string): boolean`
- `normalizeRichTextHtml(input: string): string`

### Rendering

公開頁 [PostDetailPage.vue](/D:/codes/simple-blog/frontend/src/pages/public/PostDetailPage.vue:1) 需改為 HTML 渲染模式，而不是將 `content` 當純文字。

做法：

- 以 `v-html` 顯示 API 回傳內容
- 渲染前再做一次 frontend sanitize
- 搭配 `.rich-content` 容器套用排版樣式

重點：

- DB 寫入前 sanitize 一次
- Public render 前 sanitize 一次
- 不直接渲染未處理 HTML

## Sanitization Strategy

### Why

即使 admin 才能編輯，仍不能假設內容永遠安全。若 HTML 可直接寫入 DB，再由公開頁渲染，會形成 stored XSS 風險。

### Rules

前後端都做 sanitize，但角色不同：

- 前端 sanitize：保證 editor 顯示與 public render 較穩定
- 後端 sanitize：最終安全邊界，任何進 DB 的內容都必須經過

前端：

- editor extension 本身限制可輸入格式
- 儲存前先 normalize HTML

後端：

- 對 `content` 做 allowlist sanitize
- 移除 `script`
- 移除 inline event handlers
- 移除不安全 URL scheme
- sanitize 後再做 normalize

允許標籤：

- `p`
- `br`
- `strong`
- `em`
- `h1`
- `h2`
- `ul`
- `ol`
- `li`
- `blockquote`
- `a`

允許屬性：

- `a[href]`
- `a[target]`
- `a[rel]`

限制：

- `href` 僅允許 `http:`, `https:`, `mailto:`
- 外部連結統一補 `rel="noopener noreferrer"`
- 不允許 `style`
- 不允許 `class`
- 不允許任意 `data-*`
- 不允許 `target="_blank"` 但未帶安全 `rel`

normalize 規則：

- 空段落與多餘巢狀結構儘量簡化
- 連續空白不作語意儲存保證
- editor 輸出的非 allowlist node 一律移除
- 輸出字串 trim 後再寫入 DB

library 使用原則：

- frontend `dompurify` 僅用於 render safety 與 fallback import safety
- backend `sanitize-html` 為唯一 authoritative sanitization

## Editor Behavior

### Initialization

- create mode：editor 初始為空
- edit mode：以 API 回傳的 `content` 初始化
- 若載入內容為純文字 fallback，需先轉成安全 HTML 再灌入 editor

### Sync

- editor 內部 state 為單一真實來源
- 每次內容變更後，更新外部 `v-model`
- `handleSave()` 只讀 `form.content`

### Empty Content Rule

若 editor 內容僅剩空白、空段落或無意義節點，視為空內容，不可送出。

空內容判斷規則固定為：

- 去除 HTML tag 後的純文字若為空字串，視為空內容
- 僅包含 `<p></p>`、`<p><br></p>`、空白字元、換行，全部視為空內容

### Link Handling

第一期不做複雜 popover，但不使用瀏覽器原生 `prompt`。

做法：

- toolbar 點擊後顯示最小 inline 表單
- 欄位只有 URL
- 可套用 link 與移除 link
- 不處理 `title` attribute
- URL 驗證僅允許 `http`, `https`, `mailto`

這可避免原生 `prompt` 的可用性與樣式斷裂問題。

### Paste Handling

第一期不保留外部網站貼上的複雜樣式。

規則：

- 貼上後只保留 allowlist 內的語意節點
- 移除外部 inline style、font、class
- 不承諾保留 Word / Google Docs 原始格式

## Styling

新增一組 rich text content 樣式，供 editor 內部與公開頁共用。

- `.rich-content`
- `.rich-editor`
- `.rich-toolbar`

樣式需涵蓋：

- heading 層級
- paragraph spacing
- list indentation
- blockquote 樣式
- link hover / focus
- selected / active toolbar state
- editor focus ring
- empty placeholder state

避免 editor 區與公開頁顯示差距過大。

原則：

- editor 內容排版應盡量貼近 public article render
- toolbar 樣式沿用既有 admin 視覺語言，不另開新設計系統

## Error Handling

### Frontend

- editor 初始化失敗：顯示 `Editor failed to load`
- 儲存失敗：維持目前內容，不清空 editor
- 非法連結：阻擋套用並提示
- 載入舊內容轉換失敗：退回 escaped plain text 模式，不丟例外中斷整頁

### Backend

- sanitize 後內容為空：回 `400 VALIDATION_ERROR`
- payload 缺少 `content`：回 `400`
- sanitize 過程失敗：回 `400 VALIDATION_ERROR`，不可 fallback 成原始 HTML 入庫

## Testing

### Frontend Tests

新增或調整測試覆蓋：

- editor 可接收初始 HTML 並顯示
- editor 內容變更可同步回 `form.content`
- save payload 送出 HTML string
- 空內容不可儲存
- 純文字舊內容可轉成 paragraph HTML 載入
- link UI 可正確套用與移除 anchor
- editor unmount 時會釋放 instance
- public render 前會先經過 sanitizeRenderHtml

### Worker Tests

新增或調整測試覆蓋：

- `sanitizeRichTextHtml()` 僅保留 allowlist 標籤
- `normalizeRichTextHtml()` 會移除多餘空內容
- `isMeaningfulRichText()` 可正確判定空內容
- admin create/update 接受 HTML content
- 危險標籤與屬性會被清除
- sanitize 後空內容回 400
- 不安全 `href` 會被移除或降級
- 外部 link 會補安全 `rel`

### Manual QA

- 建立新文章，套用粗體、標題、清單後儲存
- 重新打開文章，格式仍存在
- 公開頁顯示與 editor 輸出一致
- 惡意 HTML 無法在公開頁執行
- 舊純文字文章可正常載入並重新儲存
- 貼上外部內容後不會把奇怪樣式一起帶入

## Development Tasks

### Task 1: Add Dependencies

修改：

- `frontend/package.json`
- `worker/package.json`

完成條件：

- frontend 可 import Tiptap 與 `dompurify`
- worker 可 import `sanitize-html`

### Task 2: Build Rich Text Utilities

新增：

- `frontend/src/utils/richText.ts`
- `worker/src/lib/content.ts`

完成條件：

- frontend 有 fallback / render helper
- worker 有 sanitize / normalize / meaningful check helper
- 對應單元測試存在

### Task 3: Build Editor Component

新增：

- `frontend/src/components/editor/RichTextEditor.vue`

完成條件：

- 可接收 `v-model`
- 可載入初始 HTML
- 可輸出更新後 HTML
- toolbar 支援本 spec 定義功能
- inline link form 可套用與移除連結

### Task 4: Integrate Admin Edit Page

修改：

- `frontend/src/pages/admin/AdminPostEditPage.vue`

完成條件：

- 移除 `textarea` 內容編輯區
- 改接 `RichTextEditor`
- edit/create 皆用 `form.content`
- 舊純文字內容可 fallback 載入
- 空內容不可送出

### Task 5: Enforce Backend Sanitization

修改：

- `worker/src/routes/admin.ts`

完成條件：

- create / update 寫入前必經 `sanitizeRichTextHtml`
- sanitize 後空內容回 `400 VALIDATION_ERROR`
- DB 不會寫入未處理原始 HTML

### Task 6: Render Public HTML Safely

修改：

- `frontend/src/pages/public/PostDetailPage.vue`
- `frontend/src/style.css`

完成條件：

- article content 用 `v-html` render
- render 前經過 `sanitizeRenderHtml`
- `.rich-content` 樣式完成

### Task 7: Complete Test Coverage

新增或修改：

- `frontend/tests/rich-text.spec.ts`
- `worker/tests/content.spec.ts`
- 既有 admin / public 測試檔

完成條件：

- frontend 新 editor 邏輯有測試
- worker sanitize 邏輯有測試
- 既有 CRUD 與 public render 不回歸

## Verification Commands

開發完成時必跑：

### Frontend

```bash
cd frontend
npm test
npm run build
```

### Worker

```bash
cd worker
npm run check
```

## Acceptance Criteria

- admin 文章內容區不再使用純 `textarea`
- 可透過 toolbar 編輯基本 rich text
- 儲存後 DB 中 `content` 為 HTML string
- 重新編輯同一篇文章時可正確還原格式
- 公開頁可正確顯示 HTML 內容
- 危險 HTML 不會在公開頁執行
- 舊純文字文章第一次重新儲存後會轉為標準 HTML
- 既有文章 CRUD 流程不被破壞

## Deliverables

- 可重用 `RichTextEditor` 元件
- frontend rich text helper
- worker sanitize helper
- public article safe HTML render
- 完整測試覆蓋與通過驗證命令

## Risks

### Old Content Compatibility

舊內容若包含混雜 Markdown-like 與不完整 HTML，fallback 規則可能無法完美還原原貌。此風險可接受，但需在 QA 階段用現有舊文樣本確認。

### Styling Drift

editor 內顯示與公開頁顯示若使用不同樣式，作者會看到「編輯時一套、發佈後一套」。需共用 rich content styles 降低落差。

### Over-Scoping

若第一期就加入圖片、表格、貼上清理、slash menu，會大幅增加複雜度。第一期應只做基本文字編輯。

## Decision

採用 `Tiptap + HTML storage + backend sanitize + public safe HTML rendering` 作為第一期方案。
