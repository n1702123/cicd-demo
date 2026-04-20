# 02 - GitHub Actions 基礎

## 什麼是 GitHub Actions？

GitHub Actions 是 GitHub 內建的 **CI/CD 自動化平台**，讓你可以在 GitHub repo 裡直接定義自動化流程。

簡單來說：
> 當某件事發生在你的 repo（例如 push code），GitHub 就自動幫你執行指定的任務。

---

## 核心概念

### 架構總覽

```
┌─ Repository ────────────────────────────────────┐
│                                                  │
│  .github/workflows/                              │
│      ├── deploy.yml    ← Workflow 定義檔          │
│      └── ci.yml                                  │
│                                                  │
└──────────────────────────────────────────────────┘
        │
        │ 觸發（push / PR / 手動 / 定時...）
        ▼
┌─ GitHub Actions ────────────────────────────────┐
│                                                  │
│  Workflow（工作流程）                             │
│    └── Job（工作）                                │
│          └── Step（步驟）                          │
│                └── Action（動作）                  │
│                                                  │
│  在 Runner（執行環境）上執行                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 關鍵術語

| 術語 | 說明 | 類比 |
|------|------|------|
| **Workflow** | 一個完整的自動化流程，定義在 YAML 檔中 | 一張食譜 |
| **Event** | 觸發 Workflow 的事件（push、PR、定時等） | 「開始做菜」的信號 |
| **Job** | Workflow 中的一組任務，可以平行或依序執行 | 食譜中的一道菜 |
| **Step** | Job 中的單一步驟 | 做菜的每個步驟 |
| **Action** | 可重用的動作模組（社群或自訂） | 預製的調味料包 |
| **Runner** | 執行 Job 的伺服器環境 | 廚房 |

---

## 第一個 Workflow

### 檔案位置

Workflow 檔案必須放在 `.github/workflows/` 目錄下：

```
my-project/
├── .github/
│   └── workflows/
│       └── deploy.yml    ← 這裡！
├── app/
├── Dockerfile
└── package.json
```

### 最簡單的 Workflow

```yaml
# .github/workflows/hello.yml
name: Hello CI                    # Workflow 名稱

on: [push]                        # 觸發條件：push 時執行

jobs:
  say-hello:                      # Job ID
    runs-on: ubuntu-latest        # 執行環境
    steps:
      - name: Say Hello           # 步驟名稱
        run: echo "Hello, CI/CD!" # 執行的指令
```

**逐行解說**：

| 行 | 說明 |
|-----|------|
| `name:` | 在 GitHub UI 上顯示的 Workflow 名稱 |
| `on: [push]` | 當 push 到任何分支時觸發 |
| `jobs:` | 定義要執行的工作 |
| `runs-on: ubuntu-latest` | 在 GitHub 提供的 Ubuntu 機器上跑 |
| `steps:` | 這個 Job 的步驟清單 |
| `run:` | 要執行的 shell 指令 |

---

## 觸發條件（Events）

### 常用觸發事件

```yaml
on:
  push:                          # push 到 repo 時
    branches: [main]             # 只限 main 分支
  pull_request:                  # 建立或更新 PR 時
    branches: [main]
  schedule:                      # 定時執行
    - cron: '0 9 * * 1'          # 每週一早上 9 點
  workflow_dispatch:             # 手動觸發（在 GitHub UI 上按按鈕）
```

### 觸發條件對照表

| 事件 | 說明 | 常見用途 |
|------|------|----------|
| `push` | Push 到 repo | CI 測試 / 部署 |
| `pull_request` | PR 建立 / 更新 | Code review 前自動測試 |
| `schedule` | 定時（cron） | 定期安全掃描、nightly build |
| `workflow_dispatch` | 手動觸發 | 按需部署 |
| `release` | 建立 Release | 正式版本發佈 |

> Demo A 和 Demo B 都同時用了 `push: branches: [main]` + `workflow_dispatch`，這樣既能自動部署，也能在 GitHub UI 手動觸發。

---

## Steps 詳解

### 兩種 Step

```yaml
steps:
  # 第一種：使用現成的 Action
  - name: Checkout code
    uses: actions/checkout@v4        # 使用社群 / 官方提供的 Action

  # 第二種：直接執行指令
  - name: Run build
    run: npm run build               # 執行 shell 指令
```

### 常用的官方 Action

| Action | 用途 | 今天用到？ |
|--------|------|-----------|
| `actions/checkout@v4` / `@v5` | 把 repo 的程式碼拉下來（幾乎每個 workflow 都需要）| ✅ Demo A 用 v4、Demo B 用 v5 |
| `actions/setup-node@v5` | 安裝 Node.js | ✅ Demo B |
| `actions/setup-python@v5` | 安裝 Python | ❌ |
| `actions/cache@v4` | 快取相依套件，加速 CI | `cache: 'npm'` 間接用到 |
| `docker/login-action@v4` | 登入 Docker Hub | ✅ Demo B |
| `docker/build-push-action@v6` | Build 並 push Docker image | ✅ Demo B |
| `peaceiris/actions-gh-pages@v3` | 部署靜態檔案到 GitHub Pages | ✅ Demo A |

---

## Jobs 的執行方式

### 平行執行（預設）

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running tests"

  lint:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running linter"

  # test 和 lint 同時跑！
```

### 依序執行（needs）

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running tests"

  deploy:
    needs: test                    # 等 test 完成才跑
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

```
平行：                     依序：
┌──────┐                  ┌──────┐
│ test │                  │ test │
└──────┘                  └──┬───┘
┌──────┐                     │
│ lint │                  ┌──▼───┐
└──────┘                  │deploy│
（同時跑）                 └──────┘
                          （test 先，deploy 後）
```

> Demo B 的三個 Job（`test` → `docker-build-push` → `deploy-to-railway`）就是經典的依序執行範例。

### Job 之間不共享檔案

每個 Job 都在**獨立的 Runner**（全新機器）上執行，所以：
- 檔案不會從前一個 Job 流到下一個
- 每個 Job 要自己 `checkout`
- 要跨 Job 傳檔案需要 `actions/upload-artifact` + `actions/download-artifact`

---

## 環境變數與 Secrets

### 環境變數

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:                              # Job 層級的環境變數
      NODE_ENV: production
    steps:
      - name: Show env
        run: echo "Environment is $NODE_ENV"

      - name: Step-level env
        env:                          # Step 層級的環境變數
          MY_VAR: hello
        run: echo "$MY_VAR"
```

### GitHub Secrets

用來存放 **敏感資訊**（密碼、Token、API Key、Webhook URL），不會出現在 log 中：

```yaml
steps:
  - uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}
```

**設定方式**：
1. GitHub repo → Settings → Secrets and variables → Actions
2. 點 "New repository secret"
3. 輸入名稱和值

> **重要**：絕對不要把密碼寫在 YAML 檔裡面！一律使用 Secrets。

### 兩種「Token」

| 類型 | 來源 | 今天的使用情境 |
|------|------|--------------|
| **內建 `GITHUB_TOKEN`** | GitHub 每次 Workflow 自動產生 | Demo A：推 `gh-pages` branch |
| **使用者自訂 Secrets** | 自己到 Settings 設定 | Demo B：Docker Hub 帳密、Railway Webhook |

### Permissions

當你要用 `GITHUB_TOKEN` 做寫入操作，必須宣告 `permissions:`：

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # 允許推到 branch
    steps:
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

---

## GitHub Actions 的執行環境（Runner）

| Runner | 說明 |
|--------|------|
| `ubuntu-latest` | GitHub 提供的 Ubuntu Linux（最常用） |
| `windows-latest` | GitHub 提供的 Windows |
| `macos-latest` | GitHub 提供的 macOS |
| Self-hosted | 自己架設的 Runner（公司內網、GPU 機器等） |

**特性**：
- 每次執行都是**全新、乾淨**的機器（用完即丟）
- 預裝常用工具（git、docker、node、python、curl...）
- 免費額度：公開 repo 無限制，私有 repo 每月 2,000 分鐘

---

## 在 GitHub 上查看結果

Push 之後，可以在以下位置查看 Workflow 執行狀態：

1. **Actions 頁籤**：repo 頂部的 "Actions" → 看到所有 Workflow 的執行紀錄
2. **Commit 狀態**：每個 commit 旁邊的 ✅ 或 ❌ 圖示
3. **PR 檢查**：PR 頁面底部的 "Checks" 區塊

---

## 小結

| 概念 | 說明 |
|------|------|
| Workflow | `.github/workflows/*.yml`，定義自動化流程 |
| Event | 觸發條件（push、PR、手動、定時） |
| Job | 一組步驟，跑在**獨立 Runner** 上 |
| Step | 單一步驟（`run` 指令或 `uses` Action） |
| Runner | 執行 Job 的機器，全新用完即丟 |
| Secrets | 安全存放敏感資訊 |
| Permissions | 控制 `GITHUB_TOKEN` 的權限 |
