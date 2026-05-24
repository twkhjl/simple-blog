# 編輯器段落樣式與對齊設計

## 目標

為後台 Tiptap 編輯器新增：

- 段落樣式選擇：`正文`、`小字`、`大字`、`H1`、`H2`、`H3`、`H4`、`H5`、`H6`
- 區塊對齊：`靠左`、`置中`、`靠右`

並確保內容儲存到後端後不會被 sanitizer 移除，且前台文章渲染與後台編輯器顯示一致。

## 現況

- 編輯器目前使用 `StarterKit`、`Image`、`Link`、`Placeholder`
- 工具列已有 `H1`~`H3` 按鈕，沒有段落樣式下拉與對齊按鈕
- 後端 `worker/src/lib/content.ts` 不允許 `style`
- 前台 `frontend/src/utils/richText.ts` 也不允許一般 `class` / `data-*`

這代表不能用任意 inline CSS 存格式，否則送出後會被洗掉。

## 推薦方案

採用「受控 block attrs」方案：

- `paragraph` 節點允許 `data-size="small|normal|large"`
- `paragraph` 與 `heading` 節點允許 `data-align="left|center|right"`

段落樣式映射：

- `正文` -> `<p>`
- `小字` -> `<p data-size="small">`
- `大字` -> `<p data-size="large">`
- `H1`~`H6` -> `<h1>`~`<h6>`

對齊映射：

- `靠左` -> `data-align="left"`
- `置中` -> `data-align="center"`
- `靠右` -> `data-align="right"`

## 為何不用 inline style

- 後端與前台 sanitizer 目前都會過濾 `style`
- 即使放寬 `style`，也要額外限制可用屬性，風險高
- `data-*` 白名單值更容易驗證，測試也更穩

## 編輯器 UI

- 把現有 `H1`~`H3` 單獨按鈕改成一個段落樣式下拉
- 選項：`正文`、`小字`、`大字`、`H1`、`H2`、`H3`、`H4`、`H5`、`H6`
- 新增一組對齊按鈕：左、中、右

理由：

- 工具列不會再被 heading 按鈕佔太多空間
- 樣式入口清楚，避免同時存在「多個 heading 按鈕 + 額外大小按鈕」的混亂

## sanitizer 與 render 規則

### 後端

在 `worker/src/lib/content.ts`：

- `p` 允許 `data-size`、`data-align`
- `h1`~`h6` 允許 `data-align`
- 僅保留白名單值，其餘移除

### 前端公開渲染

在 `frontend/src/utils/richText.ts`：

- 渲染前先用 DOM template 清洗 `data-size` / `data-align`
- DOMPurify 僅允許這些受控 attribute
- 不開放一般 `style`

## CSS

後台 `.tiptap` 與前台 `.rich-content` 都加同一套規則：

- `[data-size="small"]`
- `[data-size="large"]`
- `[data-align="left"]`
- `[data-align="center"]`
- `[data-align="right"]`

這樣作者在後台看到的效果會接近前台。

## 測試範圍

- 編輯器：
  - 段落樣式下拉可套用 `small` / `large`
  - 可切換 `H1`~`H6`
  - 對齊按鈕可套用 `data-align`
- 後端 sanitizer：
  - 允許白名單 `data-size` / `data-align`
  - 移除非法值
- 前台 render sanitizer：
  - 保留安全 `data-size` / `data-align`
  - 移除非法值
- UI/CSS：
  - 有段落樣式選單與對齊按鈕
  - `.tiptap` / `.rich-content` 有對應樣式

## 風險

- `RichTextEditor.vue` 已偏大，這次最好把 editor formatting extension / helpers 抽出去
- `data-*` 一旦命名不一致，前後端很容易對不上；需統一常數

## 決策

- 採用受控 `data-size` / `data-align`
- 不使用 inline style
- 使用段落樣式下拉取代現有 `H1`~`H3` 按鈕
- 補齊 `H4`~`H6`
