# 團隊任務管理系統需求文件

**Date:** 2026-05-12  
**Status:** Draft  
**Session type:** Socratic requirements gathering

---

## Problem Statement

2–5 人小團隊目前沒有統一工具追蹤工作任務，任務分配與進度回報散落於 Line/Slack/Email，導致無人知道誰負責什麼、進度到哪。需要一個輕量內部工具統一管理任務、負責人、狀態，並支援任務分解為多層子任務。每個任務必須有負責人，子任務未完成時主任務強制無法完成。

## Context & Background

- **Trigger:** 缺乏統一工具，任務散落各溝通頻道
- **Affected users:** 2–5 人內部團隊成員
- **Current state:** 口頭分配 + 訊息追蹤，無結構化紀錄
- **Cost of inaction:** 任務掉球、責任不清、進度不透明

## Constraints

| Constraint | Detail |
|------------|--------|
| Team size | 2–5 人小團隊 |
| Timeline | MVP 優先，持續迭代 |
| Audience | 內部工具，不對外，不需多租戶 |
| Compliance | 無特殊合規需求 |

## Task Data Model

### 資料結構

**平鋪式（Flat）**：所有任務存在同一張表，以 `parent_task_id`（可選）表達父子關係。UI 依此遞迴渲染成樹狀視圖，層數無限制。

```
Member {
  id
  name
  avatar_color   // UI 顯示用
}

Tag {
  id
  name           // 全域共用，所有任務共享同一池
  color
}

Project {
  id
  name
  description    // 選填
  color          // UI 顯示用
  created_at
}

Task {
  id
  title          // 必填
  assignee_id    // 必填，外鍵 → Member
  status         // 見下方
  priority       // 高/中/低
  due_date       // 選填
  description    // 選填
  parent_task_id // 選填，自參照外鍵 → Task
  sort_order     // 同層排序位置，拖拉後持久化
  created_at
  updated_at
}

// D1 (SQLite) 不支援陣列欄位，tag_ids / project_ids 以 junction table 實作：
TaskTag     { task_id, tag_id }
TaskProject { task_id, project_id }
```

> **MVP 無 auth**：不需登入，直接使用。成員清單手動維護，後續迭代加入登入與身份綁定。

### Project 可見性繼承規則

> 子任務（及所有後代）**繼承祖先任務的 project 可見性**，但此為查詢邏輯，**不修改子任務的 `project_ids` 欄位**。

| 場景 | 結果 |
|------|------|
| 父任務綁定專案 A，子任務 `project_ids = []` | 子任務在專案 A 視圖中可見 |
| 父任務綁定專案 A + B，子任務 `project_ids = []` | 子任務在 A 和 B 視圖中均可見 |
| 子任務自己也綁定專案 C | 子任務在 A + B + C 中可見 |
| 根任務 `project_ids = []`，子任務也 `= []` | 兩者都只在「我的任務」出現 |

**Tags 不繼承**：每個任務的 `tag_ids` 完全獨立，不向上或向下傳遞。

**查詢邏輯（pseudo）：**
```
getTasksForProject(projectId):
  找出所有 project_ids 含 projectId 的根任務
  遞迴取得這些根任務的所有後代
  合併去重後回傳
```

### 欄位說明

| 欄位 | 必填 | 說明 |
|------|------|------|
| 標題 | ✅ | |
| 負責人 (assignee) | ✅ | 從團隊成員選擇，不可留空 |
| 狀態 | ✅ | 見下方，預設 Todo |
| 優先級 | — | 高 / 中 / 低，預設中 |
| 截止日期 | — | |
| 標籤 Tags | — | 自訂，複數 |
| 描述/備註 | — | 純文字或 Markdown |
| parent_task_id | — | 有值 = 子任務；無值 = 根任務 |

### 任務狀態

| 狀態 | 說明 |
|------|------|
| 待處理 (Todo) | 建立但尚未開始 |
| 進行中 (In Progress) | 正在執行 |
| 封鎖中 (Blocked) | 等待外部依賴或其他任務 |
| 已完成 (Done) | 完成 |
| 已封存/取消 (Archived) | 不做了，保留紀錄 |

### 業務規則：完成封鎖

> **主任務有任一子任務狀態不是 `Done` 或 `Archived`，則主任務不可設為 `Done`。**

- 系統強制，非提醒 — UI 應 disable 完成按鈕並顯示原因
- 遞迴：孫任務也算（任何後代未完成即封鎖）
- `Archived` 視同完成，不封鎖父任務

## Navigation Model

應用程式有兩種入口，決定任務的可見範圍：

| 入口 | 顯示內容 |
|------|---------|
| **專案** (Project) | 側邊欄列出所有 Project，點入後列出該 Project 的所有任務 |
| **我的任務** (My Tasks) | 列出 `project_ids` 為空的任務（未綁定任何專案） |

> 子任務繼承父任務的 project 可見性（遞迴，查詢邏輯，非資料複製）。Tags 不繼承。

## MVP Scope

### In Scope

- **任務 CRUD** — 建立、編輯、刪除任務，含所有欄位
- **樹狀展開** — 多層子任務，無層數限制
- **團隊成員管理** — 新增/移除成員，任務分配給成員
- **專案管理** — 建立/編輯/刪除 Project，任務綁定 0~多個專案
- **我的任務視圖** — 顯示未綁定任何專案的任務
- **專案視圖** — 以專案為入口，列出該專案所有任務
- **視圖切換** — 列表視圖（預設）、看板視圖 (Kanban)
- **排序與篩選** — 依狀態、負責人、優先級、截止日期篩選與排序

### Out of Scope (v1)

- 通知系統 (email/push) — 迭代再加
- 附件上傳 — 迭代再加
- 時間追蹤 / 工時紀錄 — 迭代再加
- 多租戶 / 對外 SaaS — 不在規劃內
- 權限角色 (Admin/Member) — MVP 全員平等

## Success Criteria

- [ ] 任何成員可在 30 秒內建立一個帶負責人與截止日的任務
- [ ] 負責人必填，UI 不允許儲存無負責人的任務
- [ ] 任務可展開至少 3 層子任務，視覺清楚呈現層級
- [ ] 主任務有未完成子任務時，完成按鈕 disabled 並顯示原因
- [ ] 看板視圖拖拉更新狀態可在 1 秒內反應
- [ ] 5 種狀態完整運作，封鎖中任務有視覺區別

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 任務結構 | 平鋪 + parent_task_id，UI 渲染樹狀 | 查詢簡單，無限層，遞迴渲染 |
| 負責人 | 必填欄位，不可空 | 任務責任歸屬清晰 |
| 完成封鎖 | 系統強制，非提醒 | 避免主任務假完成 |
| 對象 | 內部工具 | 不需多租戶、計費、對外展示 |
| 上線策略 | MVP 先行，持續迭代 | 小團隊快速驗證需求 |
| 狀態數量 | 5 種 | 涵蓋封鎖與封存場景 |
| Auth | MVP 無 auth | 降低複雜度，後續迭代加入 |
| 預設視圖 | 列表視圖 | 資訊密度高，適合初期 |
| 標籤管理 | 全域共用標籤池 | 統一分類，避免重複標籤 |
| Project vs Tag | Project 有獨立面板入口，Tag 只是篩選維度 | Project 驅動導覽，Tag 驅動分類 |
| 無專案任務 | 只出現在「我的任務」 | 個人待辦與專案任務明確分離 |
| Project 繼承 | 查詢邏輯繼承，不寫入子任務欄位 | 保持資料單純，繼承在 query 層處理 |
| Tag 繼承 | 不繼承，每任務獨立 | Tag 是個人標記，非結構關係 |
| Task 排序 | sort_order 欄位持久化，拖拉後 API 更新 | 所有成員看到一致順序 |
| Task 刪除（有子任務） | 子任務升格為根任務 | 保留子任務資料，不連帶刪除 |
| Member 刪除 | 阻止刪除，UI 提示重新分配任務 | assignee 必填，不可產生無人負責任務 |
| Project 刪除 | 任務移至「我的任務」（project_ids 變空） | 資料不丟失，任務仍可追蹤 |
| API 設計 | REST，SvelteKit +server.ts | 簡單直接，不需額外套件 |

### 刪除行為規則

| 刪除對象 | 規則 |
|---------|------|
| 有子任務的 Task | 直接子任務升格為根任務（`parent_task_id = null`），孫任務以下保持原有層級 |
| Member（仍有任務） | **阻止刪除**，UI 顯示哪些任務需先重新分配 |
| Project | `TaskProject` 記錄刪除，任務 `project_ids` 變空 → 自動移至「我的任務」視圖 |
| Tag | `TaskTag` 記錄 cascade 刪除，任務不受影響 |

### 「我的任務」視圖語意

MVP 無 auth，「我的任務」= **所有 `project_ids` 為空的任務**（跨所有成員）。
因為 assignee 必填，這些任務必然有負責人，實質上是「個人未分類任務」。
加入 auth 後改為：登入成員負責且無專案的任務。

## Open Questions

- [ ] 樹狀視圖與看板視圖如何同時呈現父子關係？（迭代時再定）

## Technical Architecture

### Stack

| 層級 | 選型 | 說明 |
|------|------|------|
| Frontend / CSR | SvelteKit + TypeScript + TailwindCSS（SPA 模式，`ssr = false`）| 已設定 |
| Adapter | `@sveltejs/adapter-cloudflare` | 部署至 Cloudflare Pages |
| Deploy | Cloudflare Pages | GitHub push → 自動 CI/CD，免費方案 |
| API | Cloudflare Workers (Pages Functions 內建) | SvelteKit server routes 直接運行 |
| Database | Cloudflare D1 (SQLite) | 免費方案，支援遞迴 CTE 查詢子任務樹 |
| UI 組件庫 | Skeleton UI v3 | 專為 SvelteKit 設計，現代活潑主題系統，Tailwind-based |
| 拖拉互動 | svelte-dnd-action | 跨列表 DnD（Kanban）、巢狀清單排序、Accessible |
| 甘特圖（後續） | svelte-gantt | Svelte native，內建任務拖拉與依賴線，契合 parent_task_id 資料模型 |

### Cloudflare 免費方案配額

| 服務 | 免費限制 |
|------|---------|
| Cloudflare Pages | 無限靜態請求，500 builds/month |
| Cloudflare Workers | 100K requests/day |
| Cloudflare D1 | 5GB storage，5M reads/day，100K writes/day |

> 2–5 人內部工具遠低於所有配額，無需付費。

### D1 使用注意

SvelteKit server routes 透過 `platform.env.DB` 取得 D1 binding，不可使用 Node.js 的 `better-sqlite3`，須使用 Cloudflare 官方 D1 client API。

### 本地開發環境（Wrangler）

```bash
# 安裝
pnpm add -D wrangler

# 本地啟動（模擬 Workers + D1）
pnpm wrangler pages dev -- pnpm dev

# 建立本地 D1
pnpm wrangler d1 create taskra-db
pnpm wrangler d1 execute taskra-db --local --file=./schema.sql
```

`wrangler.toml` 需設定 D1 binding 名稱為 `DB`，與 `platform.env.DB` 對應。

### Deploy 流程

```
GitHub push → Cloudflare Pages CI/CD → Pages Functions (Workers) → D1
```

## Next Steps

1. ~~確認技術選型~~ ✅ SvelteKit + Cloudflare Pages + D1
2. 設計 DB schema（任務樹狀結構 + 成員表）
3. 實作 MVP：任務 CRUD → 樹狀展開 → 成員管理 → 視圖切換 → 篩選排序
4. 每個功能完成後回測核心用戶流程
