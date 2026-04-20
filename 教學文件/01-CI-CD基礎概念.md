# 01 - CI/CD 基礎概念

## 什麼是 CI/CD？

CI/CD 是現代軟體開發中 **自動化交付流程** 的統稱，包含三個階段：

| 縮寫 | 全名 | 中文 | 說明 |
|------|------|------|------|
| CI | Continuous Integration | 持續整合 | 開發者頻繁合併程式碼，每次合併自動執行測試 / 建置 |
| CD | Continuous Delivery | 持續交付 | 程式碼通過測試後，自動準備好可部署的版本 |
| CD | Continuous Deployment | 持續部署 | 更進一步，自動部署到正式環境 |

簡單來說：
> CI/CD 讓你的程式從「寫完 code」到「上線」的過程 **全自動化**。

---

## 為什麼需要 CI/CD？

### 傳統部署的痛點

```
開發者：「我改好了，幫我部署。」
維運人員：「等等，我先手動跑測試... 再手動 build... 再手動上傳... 再手動重啟...」
（兩小時後）
維運人員：「部署好了，但好像壞了，我回滾...」
```

常見問題：
- 手動部署容易出錯（忘記步驟、打錯指令）
- 部署耗時，一次部署要花數小時
- 程式碼合併後才發現衝突或 bug
- 每次部署都很緊張，大家不敢頻繁發布

### CI/CD 的解決方案

```
開發者 push code
    ↓ （自動觸發）
自動跑測試 / 建置 ──→ 失敗？ → 通知開發者修復
    ↓ 通過
自動產出部署產物（靜態檔 / Docker image）
    ↓
自動部署到環境（GitHub Pages / Railway / K8S）
    ↓
  ✅ 上線完成！
```

**效果**：
- 每天可以部署數十次，而不是一個月一次
- 問題在幾分鐘內被發現，而不是上線後才爆炸
- 部署變成「按一個按鈕」甚至「全自動」

---

## CI/CD Pipeline（流水線）

CI/CD 的流程通常被稱為 **Pipeline（流水線）**，由多個 **Stage（階段）** 組成：

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Source │───►│  Build  │───►│  Test   │───►│ Package │───►│ Deploy  │
│ 取得原碼 │    │ 編譯建置 │    │ 執行測試 │    │ 打包產物 │    │ 部署上線 │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 各階段對照今日兩個 Demo

| 階段 | Demo A（GitHub Pages） | Demo B（Railway） |
|------|----------------------|-------------------|
| Source | GitHub push main | GitHub push main |
| Build | （純 HTML，不需要 build） | `npm ci` |
| Test | （無） | `npm run check`（`node --check` 語法檢查） |
| Package | 直接使用根目錄靜態檔 | `docker build` → Docker Image |
| Deploy | 推到 `gh-pages` branch | Push 到 Docker Hub → Railway CLI 重新部署 |

---

## 常見的 CI/CD 工具

| 工具 | 類型 | 特色 |
|------|------|------|
| **GitHub Actions** | 雲端（GitHub 內建） | 與 GitHub 深度整合，免費額度充足 |
| GitLab CI | 雲端 / 自架 | GitLab 內建，功能完整 |
| Jenkins | 自架 | 老牌工具，高度客製化，但維護成本高 |
| CircleCI | 雲端 | 設定簡潔，速度快 |
| Azure DevOps | 雲端 | 微軟生態系整合 |
| Bitbucket Pipelines | 雲端 | 搭配 Bitbucket |

### 為什麼選 GitHub Actions？

- **免費**：公開 repo 完全免費，私有 repo 每月 2,000 分鐘免費
- **簡單**：用 YAML 設定，學習曲線低
- **整合**：直接在 GitHub 裡面看結果，不需要跳到外部平台
- **生態系**：Marketplace 有大量現成的 Action 可以直接用（如 `docker/build-push-action`、`peaceiris/actions-gh-pages`）

---

## CI 與 CD 的差異圖解

```
                        CI                              CD
              ┌─────────────────────┐    ┌──────────────────────────┐
              │                     │    │                          │
  push code ──► Build → Test → Lint ──► Package → Deploy (Staging) ──► Deploy (Production)
              │                     │    │                          │
              └─────────────────────┘    └──────────────────────────┘
                                              │
                                    Continuous Delivery：
                                    到這裡止，需手動批准才部署到 Production

                                    Continuous Deployment：
                                    全自動到 Production
```

> 今天的 Demo A 和 Demo B 都是 **Continuous Deployment** 的範例——push 到 main 之後全自動到 Production。

---

## 重要觀念

### 1. 快速回饋（Fast Feedback）
Pipeline 失敗要能在幾分鐘內通知開發者，越快發現問題，修復成本越低。

### 2. 小批量頻繁發布
每次變更小一點，每天部署多次，比「累積一個月一次大更新」安全得多。

### 3. 自動化一切可自動化的事
手動步驟 = 風險。能自動化的就不要手動做。

### 4. Pipeline 也是程式碼
CI/CD 設定檔（如 `.github/workflows/*.yml`）放進版本控制，跟 app 程式碼一起管理 / 一起 review。

---

## 小結

| 項目 | 說明 |
|------|------|
| CI | 自動建置 + 測試，確保程式碼品質 |
| CD | 自動交付 / 部署，加速上線流程 |
| Pipeline | 由多個階段串成的自動化流程 |
| 核心價值 | 降低人為錯誤、加速交付、提升品質 |

> 接下來我們會用 **GitHub Actions** 實際建立兩條 Pipeline——一條部署到 GitHub Pages，一條部署到 Railway！
> 下一份教材：[02-GitHub-Actions基礎.md](02-GitHub-Actions基礎.md)
