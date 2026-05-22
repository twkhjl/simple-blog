# Editor Paste Instant Preview Design

Date: 2026-05-22
Status: Implementation-ready

## Goal

讓 admin 文章編輯器在使用者貼上 clipboard image blob 時，圖片可立即出現在 editor 內，不必等待 `/api/files/upload` 完成後才看得到。

本次目標是改善作者編輯體感，不改變既有檔案上傳 API、資料表 schema、文章儲存格式與 public render 安全邊界。

## Scope

### In Scope

- editor 內貼上圖片時立即顯示本機預覽
- 預覽圖背景上傳成功後，自動替換為正式檔案 URL
- 預覽圖上傳失敗時，移除該圖片並顯示錯誤訊息
- 儲存文章前阻擋仍在上傳中的暫時圖片
- 維持現有 inline image 上傳 MIME 與大小限制
- 補齊 editor 與儲存流程測試

### Out of Scope

- toolbar 圖片插入流程改成即時預覽
- 拖拉上傳
- 進度條或百分比
- caption、對齊、裁切、縮放 UI
- 離開頁面後續傳
- orphan file 清理機制
- public render 接受 `blob:` 或 `data:` 圖片

## User Problem

現況貼上圖片後，editor 會先攔截 paste 事件，然後等待 upload 完成才插入 `<img>`。網路稍慢時，作者會感覺圖片「卡一下才出現」，不確定貼上是否成功。

本次需求要解決的是可感知延遲，不是後端上傳效能本身。

## Recommendation

採用「先插入 `blob:` 預覽圖，背景 upload，成功後原位替換正式 URL」。

理由：

- 最貼近需求，能做到貼上當下立刻可見
- 後端 `/api/files/upload` 可完全沿用
- `posts.content` 仍只儲存正式 uploaded URL，不破壞既有 sanitize 策略
- 風險集中在 editor 端，變更範圍可控

## Alternatives Considered

### Option A: Blob Preview Then Replace

做法：
- 貼上當下建立 `blob:` object URL
- 立即插入 image node
- 背景上傳，成功後替換 `src`

優點：
- 體感最佳
- 不需改 API
- 安全邊界可維持

缺點：
- 需處理 pending 狀態、失敗回滾、object URL 釋放

### Option B: Loading Placeholder Then Replace

做法：
- 貼上時先插入「上傳中」佔位節點
- upload 成功後才換成正式圖片

優點：
- 實作較單純

缺點：
- 不符合「一貼上就看到圖片」

### Option C: Store Base64/Data URL Temporarily

做法：
- 直接把 `data:` 圖片插入內容
- 之後再背景替換正式 URL

優點：
- 表面上最直接

缺點：
- 與現有 `allowBase64: false` 與 sanitize 規則方向相反
- HTML 內容膨脹
- 失敗清理與儲存邊界較差

採用 Option A。

## Existing Baseline

- editor 元件：`frontend/src/components/editor/RichTextEditor.vue`
- inline image uploader：`frontend/src/services/uploads.ts`
- admin 編輯頁：`frontend/src/pages/admin/AdminPostEditPage.vue`
- public sanitize 與 meaningful content 判斷：`frontend/src/utils/richText.ts`

目前行為：

- paste handler 攔截圖片貼上
- 逐張等待 `imageUploader.upload(file)`
- upload 成功後才 `setImage()`

這就是目前延遲可見的直接原因。

## Product Rules

- 使用者貼上支援格式圖片時，editor 必須立即插入預覽圖
- 預覽圖只能存在於編輯中狀態，不可成為最終發佈內容
- 若圖片仍在上傳中，使用者不可儲存文章
- 若 upload 失敗，該預覽圖需從 editor 移除，避免留下不可發佈內容
- 多張圖片貼上時，每張都要先立即顯示，再各自完成 upload 與替換

## Technical Design

## Data Model Inside Editor

新增 editor 內部暫時圖片概念，但不改後端資料模型。

每張 pending 圖需要有：

- `uploadId`: 唯一識別碼
- `objectUrl`: `URL.createObjectURL(file)` 產生的暫時 URL
- `status`: `pending | failed | uploaded`

`uploadId` 不需要儲存在最終 HTML。它只用於 editor 執行期，幫助找到要替換或移除的那一張圖片。

建議做法：

- 在 image node 上加 `data-upload-id`
- upload 完成後依 `data-upload-id` 找到該 node
- 替換 `src` 後移除 `data-upload-id`

若 Tiptap `Image` extension 預設不保留自訂屬性，新增一個本地 editor image extension 來擴充 `data-upload-id` 屬性。

## Paste Flow

1. 使用者在 editor 內貼上
2. paste handler 從 `ClipboardEvent.clipboardData.items` 篩出支援的 image file
3. 若無支援圖片，交還 editor 預設 paste 行為
4. 若有圖片，`preventDefault()`
5. 對每個 `File`：
   - 產生 `uploadId`
   - 產生 `objectUrl`
   - 立即插入 `<img src="blob:..." data-upload-id="...">`
   - 將此圖片加入 pending upload 集合
   - 啟動背景 upload
6. 背景 upload 成功後：
   - 找到對應 `data-upload-id` 圖片
   - 將 `src` 換成正式 uploaded URL
   - `alt` 換成實際檔名
   - 移除 `data-upload-id`
   - `URL.revokeObjectURL(objectUrl)`
   - 從 pending upload 集合移除
7. 背景 upload 失敗後：
   - 找到對應 `data-upload-id` 圖片
   - 從 editor 移除該圖片
   - `URL.revokeObjectURL(objectUrl)`
   - 從 pending upload 集合移除
   - 顯示錯誤訊息

## Save Guard

儲存文章前，admin page 需新增 pending upload guard。

規則：

- 若 editor 尚有 pending upload，`handleSave` 直接中止
- 顯示明確訊息，例如「圖片仍在上傳中，請稍候再儲存」
- 不允許把含 `blob:` 圖片的 HTML 送到文章 API

此 guard 應放在 admin page 的 save 流程，而不是只靠 public sanitize 兜底。

## Sanitization Boundary

既有安全邊界維持不變：

- public render 只接受正式 uploaded URL
- `sanitizeRenderHtml()` 不接受 `blob:` 圖片
- `isMeaningfulEditorHtml()` 不把 `blob:` 圖片視為可發佈內容

本次即時預覽只存在 editor 互動期間，因此不需要放寬 `richText.ts` 的安全規則。

## Concurrency

多圖貼上時：

- 預覽插入應立即完成，不等待前一張 upload
- upload 可平行執行
- 每張圖片獨立成功或失敗

原因：

- 若沿用目前串行 `await`，多張貼圖時第二張之後仍會延後出現
- 預覽與 upload 解耦後，平行 upload 比較符合預期體感

## Cleanup Rules

- 每個成功或失敗的 pending 圖都必須 `URL.revokeObjectURL`
- editor unmount 時，若仍有 pending 圖，全部 revoke
- locale 切換若會重建 editor instance，不可遺失 pending upload 狀態管理

## Error Handling

- 不支援格式：沿用既有錯誤訊息
- 檔案過大：沿用既有錯誤訊息
- upload API 失敗：移除暫時圖，顯示 upload 失敗訊息
- 使用者在 upload 完成前刪掉該圖：背景 upload 完成後若找不到目標 node，僅做 cleanup，不重新插回圖片

## File-Level Plan

### 1. `frontend/src/components/editor/RichTextEditor.vue`

調整重點：

- 新增 pending upload 狀態管理
- 將 `insertImageFromFile(file)` 拆成：
  - `insertPendingImage(file)`
  - `uploadAndReplaceImage(file, uploadId, objectUrl)`
- paste 流程改為「立即插入預覽 + 背景 upload」
- 對外 expose `hasPendingUploads()`
- unmount 時清理 object URLs

### 2. `frontend/src/components/editor/extensions/InstantPreviewImage.ts`

若現有 `Image` extension 無法保留 `data-upload-id`，新增本地 extension：

- 繼承 `@tiptap/extension-image`
- allow `data-upload-id`
- 最終 render 時若屬性已移除，輸出與原本 image node 一致

若實作驗證後發現直接設定 `HTMLAttributes` 即可保留屬性，可不新增此檔，改在 spec 實作時記錄簡化決策。

### 3. `frontend/src/pages/admin/AdminPostEditPage.vue`

調整重點：

- 透過 `ref` 取得 editor instance/exposed API
- save 前檢查 `hasPendingUploads()`
- 若有 pending upload，顯示訊息並中止送出

### 4. `frontend/src/services/uploads.ts`

原則上不改 API。

可選擇性小調整：

- 若需要更清楚區分 toolbar upload 與 instant preview upload，可補輔助型別或錯誤封裝

但此檔不應改變現有 upload contract。

### 5. `frontend/tests/rich-text-editor.spec.ts`

新增或調整測試：

- 貼上圖片時立即插入 `blob:` 預覽圖
- upload 成功後預覽圖被替換成正式 URL
- upload 失敗後預覽圖被移除，並顯示錯誤訊息
- 多圖貼上時，兩張都會先立即出現
- 使用者先刪除 pending 圖後，upload 完成不會重新插回

### 6. `frontend/tests/admin-post-edit-page.spec.ts`

新增或調整測試：

- editor 有 pending upload 時不可儲存
- pending upload 全部完成後可正常儲存

## Implementation Notes

- 不要把 `blob:` 圖片寫入資料庫
- 不要修改 public render 讓它接受 `blob:` 或 `data:`
- 不要把 upload 失敗的圖片保留在 editor，避免作者誤以為已可發佈
- 若 toolbar 圖片插入沿用舊流程，本次不強制一併改；避免 scope 膨脹

## Test Plan

### Unit / Component

- `RichTextEditor` paste image instant preview
- `RichTextEditor` upload success replacement
- `RichTextEditor` upload failure removal
- `RichTextEditor` multi-image paste behavior
- `RichTextEditor` pending upload cleanup on unmount

### Page-Level

- `AdminPostEditPage` blocks save when pending uploads exist
- `AdminPostEditPage` allows save after all uploads finish

### Regression

- 非圖片 clipboard paste 不受影響
- 不支援 MIME 仍不攔截或仍回既有錯誤
- 既有 toolbar image upload 不回歸
- public article render 仍只顯示正式 uploaded image

## Risks

### Risk 1: Tiptap image node 不保留自訂屬性

Impact:
- 無法可靠找到待替換的那張預覽圖

Mitigation:
- 以擴充 image extension 為預設備案

### Risk 2: Editor 重建造成 pending 圖狀態遺失

Impact:
- locale 切換或其他重建時，upload 回填目標消失

Mitigation:
- pending upload map 與 cleanup 狀態放在 component scope，不綁死 editor instance
- upload 完成後找不到 node 時，只做 cleanup，不重插

### Risk 3: 使用者在 upload 中直接儲存

Impact:
- HTML 可能殘留 `blob:` 圖

Mitigation:
- save guard 強制擋下

## Acceptance Criteria

- 貼上一張支援格式圖片後，100ms 級別內可在 editor 看到預覽，不需等待 upload 完成
- upload 成功後，預覽圖會自動變成正式檔案 URL
- upload 失敗後，暫時圖不會殘留在 editor
- 儲存文章時，不會送出含 `blob:` 圖片的 HTML
- public render 行為與安全規則不變

