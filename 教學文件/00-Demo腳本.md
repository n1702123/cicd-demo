# CI/CD 實戰教育訓練 — Demo 腳本

> 講師現場示範指引。每個 Demo 都標註預估時間與講解要點。
> 對應兩個實際專案：[demo-01-github-pages/](../demo-01-github-pages/)、[demo-02-railway-docker/](../demo-02-railway-docker/)

---

## Demo 全覽

| Demo | 主題 | 範例專案 | 時間 |
|------|------|---------|------|
| Demo 1 | 第一個 GitHub Actions Workflow（熱身）| 任何空 repo | 15 min |
| Demo A | 純 HTML → GitHub Pages（無 Docker）| `demo-01-github-pages` | 20 min |
| Demo B | Node.js + Redis + Docker → Docker Hub → Railway | `demo-02-railway-docker` | 25 min |

---

## 事前準備

### 共通

- 兩個專案都已經 push 到 GitHub
- 事先跑過一次 Actions 確認成功
- 預先開好分頁：兩個 repo 的 Actions 頁、Docker Hub、Railway 儀表板

### Demo A 用 — `demo-01-github-pages/`

已經預備好：

```
demo-01-github-pages/
├── .github/workflows/deploy.yml
└── index.html                  ← 純 HTML Hello World
```

GitHub repo 設定：
- Settings → Pages → Source = `Deploy from a branch`，Branch = `gh-pages`

### Demo B 用 — `demo-02-railway-docker/`

已經預備好：

```
demo-02-railway-docker/
├── .github/workflows/deploy.yml
├── public/index.html            ← 前端計數器 UI
├── server.js                    ← Node.js http + Redis
├── package.json                 ← 依賴 ioredis
├── Dockerfile                   ← 單階段
└── docker-compose.yml           ← 本機 app + Redis
```

GitHub Secrets 已設定（共 4 個）：
| Secret | 說明 |
|--------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 帳號 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token（Read & Write） |
| `RAILWAY_TOKEN` | Railway Account Token |
| `RAILWAY_SERVICE_ID` | Railway Service ID（UUID） |

Railway 專案已設定：
- `Deploy from Docker Image` → 指向 `{帳號}/hello-world-railway:latest`
- 加上 Redis plugin（自動注入 `REDIS_URL`）

---

## Demo 1：第一個 Workflow（15 min）

**目標**：讓學員看到「push code 自動跑東西」的效果，建立 GitHub Actions 心智模型。

### 1-1. 建立 Workflow（5 min）

```bash
mkdir -p .github/workflows
```

建立 `.github/workflows/hello.yml`：

```yaml
name: Hello CI

on: [push]

jobs:
  say-hello:
    runs-on: ubuntu-latest
    steps:
      - name: Say Hello
        run: echo "Hello, CI/CD!"

      - name: Show date
        run: date

      - name: Show runner info
        run: |
          echo "OS: $(uname -s)"
          echo "User: $(whoami)"
          echo "Directory: $(pwd)"
```

**講解要點**：
- YAML 結構：`name` → `on` → `jobs` → `steps`
- 「這就是在告訴 GitHub：每次 push，在雲端 Linux 機器跑這些指令」
- `run: |` 可以寫多行

### 1-2. Push 並觀看結果（5 min）

```bash
git add .github/workflows/hello.yml
git commit -m "Add first CI workflow"
git push
```

| 狀態 | 說明 |
|------|------|
| 🟡 黃色圓圈 | 執行中 |
| ✅ 綠色勾勾 | 成功 |
| ❌ 紅色叉叉 | 失敗 |

切到 Actions 頁籤，點進去看每個 Step 的 log。

### 1-3. 加入 Checkout（5 min）

更新 workflow：

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v5

  - name: List files
    run: ls -la
```

**講解要點**：
- 沒 `checkout`，Runner 上是**空的**
- `uses` vs `run`：
  - `uses` → 用別人寫好的 Action
  - `run` → 自己寫 shell 指令
- log 裡可以看到 `ls -la` 列出 repo 檔案

---

## Demo A：純 HTML → GitHub Pages（20 min）

**目標**：展示最簡單、無需 Docker、無需 Secrets 的真實部署流程。
**使用專案**：[demo-01-github-pages/](../demo-01-github-pages/)

### A-1. 專案快速導覽（3 min）

打開 `index.html`：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
```

**講解要點**：
- 純靜態檔案，沒有 build、沒有 node_modules
- GitHub Pages 就是一個能託管靜態檔的免費 HTTP server

### A-2. Workflow 逐行解說（5 min）

打開 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # 推到 gh-pages branch 需要

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .    # 直接發布根目錄
```

| Step | 做了什麼 |
|------|---------|
| Checkout | 拉 repo 到 Runner |
| Deploy | 把根目錄（含 `index.html`）推到 `gh-pages` branch |

**重點**：
- 這個 Demo 沒有 build 步驟，直接發布 HTML
- `GITHUB_TOKEN` 是 GitHub **自動提供**的，不用自己設定
- 只要宣告 `permissions: contents: write` 就能用

### A-3. 現場修改 + Push（5 min）

修改 `index.html`：

```html
<h1>Hello from CI/CD! 🚀</h1>
```

```bash
git add . && git commit -m "Update greeting" && git push
```

切到 Actions 頁面，即時看 Step 跑完（約 30 秒 ~ 1 分鐘）。

### A-4. 打開成品（5 min）

```
https://{你的GitHub帳號}.github.io/demo-01-github-pages/
```

**講解要點**：
- 看到剛剛的修改已經上線了
- 打開 Settings → Pages，說明 `gh-pages` branch 的設定
- **整個流程 0 個 Secrets！** 因為用的是內建 `GITHUB_TOKEN`

### A-5. 小結（2 min）

> 「一個 YAML 檔、0 個 Secrets，純 HTML 就能自動部署上線。適合文件站、部落格、Landing Page。」

**限制**：
- 只能跑靜態，沒有後端
- 有後端邏輯、需要資料庫的 App 要真正的 Server → 下一個 Demo

---

## Demo B：完整 CI/CD Pipeline → Railway（25 min）

**目標**：串起完整容器化部署流程。
**使用專案**：[demo-02-railway-docker/](../demo-02-railway-docker/)
**這是整堂課的高潮！**

### B-1. 專案結構導覽（3 min）

打開 `server.js`：

```js
import http from 'http'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
const PORT = process.env.PORT ?? 3000

// GET/POST /api/counter → 用 Redis 做的全域計數器
// GET /api/info → 回傳 hostname / Redis 狀態
```

打開 `Dockerfile`（單階段）：

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
```

**講解要點**：
- Node.js 原生 HTTP，沒有 framework —— 強調「CI/CD 和框架無關」
- Redis 用來展示**持久化狀態**：重新部署後計數不會歸零
- 單階段 Dockerfile 就夠（沒有編譯步驟），不需要三階段

打開 `docker-compose.yml`：

```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on: [redis]
  redis:
    image: redis:7-alpine
```

→ 本機 `docker compose up` 就能跑起一整組（app + Redis）。

### B-2. Workflow 三個 Job 解說（7 min）

打開 `.github/workflows/deploy.yml`：

```yaml
name: Build, Push & Deploy to Railway

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run check      # node --check server.js

  docker-build-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: docker/login-action@v4
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/hello-world-railway:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/hello-world-railway:${{ github.sha }}

  deploy-to-railway:
    needs: docker-build-push
    runs-on: ubuntu-latest
    steps:
      - run: |
          npm install -g @railway/cli
          railway redeploy --service ${{ secrets.RAILWAY_SERVICE_ID }} --yes
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**三個 Job 的依賴鏈**：

```
test ── needs ──► docker-build-push ── needs ──► deploy-to-railway
```

**講解要點**：
- 每個 Job 都在**獨立 Runner** 上跑（全新機器）
- `needs` 讓前一個失敗，後面就被 skip
- 兩個 tag：`latest`（最新）+ git SHA（可追蹤、可回滾）
- `docker/build-push-action` 自動幫你 `docker build` + `docker push`
- Deploy 用 Railway CLI + Token，比 Webhook 更明確指定 service

### B-3. 展示 Secrets 與 Railway（3 min）

- GitHub repo → Settings → Secrets and variables → Actions：展示 4 個 Secret 的名稱（值看不到）
- Railway → 專案 → Settings：展示 Service ID；Account → Tokens 展示如何生成 Token

### B-4. 現場修改 + Push（3 min）

修改 `public/index.html` 的標題：

```html
<h1>Hello from Railway! 🚂</h1>
```

```bash
git add . && git commit -m "Update Railway demo greeting" && git push
```

### B-5. 即時觀看 Pipeline（5 min）

切到 Actions 頁面：

1. 🟡 Pipeline 開始
2. ✅ `test` Job 完成（~30s）
3. 🟡 `docker-build-push` 開始（~1-2 min）
4. ✅ Docker image push 完成
5. 🟡 `deploy-to-railway` 呼叫 Railway CLI
6. ✅ 全部完成

**講解要點**：
- 展示 Actions UI 的 Job 依賴關係圖
- log 裡 Secrets 的值都被遮成 `***`

### B-6. 驗證結果（4 min）

1. **Docker Hub**：到 `hub.docker.com/r/{帳號}/hello-world-railway` → 看到 `latest` 和 `{sha}` 兩個 tag
2. **Railway**：儀表板顯示 `Deploying` → `Active`
3. **成品網址**：`https://your-app.railway.app` → 看到新版本
4. **計數器**：重刷幾次按 +1，觀察 Redis 持久化 —— 即使剛剛重新部署，計數也沒歸零

### B-7. 串整個故事（2 min）

> 「我只是 push 一行 code。後面的事情——測試、Build Docker Image、Push 上 Docker Hub、通知 Railway 部署——全部在 2-4 分鐘內自動完成。這就是 CI/CD 的威力。」

---

## 緊急備案

| 狀況 | 解決方案 |
|------|---------|
| Actions 排隊跑太慢 | 先講下一段，回來再看；或用預先跑成功的截圖 |
| Docker Hub 登入失敗 | 檢查 `DOCKERHUB_TOKEN` 權限（Read & Write） |
| Docker Hub push 失敗 | 檢查 image 名稱，備案只 demo 到 `docker build` |
| Railway CLI 失敗 | 檢查 `RAILWAY_TOKEN` 與 `RAILWAY_SERVICE_ID`，備案用儀表板手動 Redeploy |
| GitHub Pages 404 | 確認 `gh-pages` branch 已產生、Source 設定正確 |
| Redis 連線失敗 | 確認 Railway Redis plugin 有加、`REDIS_URL` 有注入 |
| 網路不穩 | 使用預先錄好的 Demo 影片或截圖 |

---

## 回顧：三個 Demo 的關鍵差異

| | Demo 1 | Demo A | Demo B |
|---|-------|-------|-------|
| 目的 | 熱身：看 Actions 能跑 | 真實靜態部署 | 完整容器化 CI/CD |
| 範例 | Echo 指令 | 純 HTML | Node.js + Redis + Docker |
| 部署目標 | 無 | GitHub Pages | Railway |
| Job 數 | 1 | 1 | 3 |
| Secrets 數 | 0 | 0 | 4 |
| 學到什麼 | YAML 結構、Runner | Permissions、官方 Action | Docker 整合、Secrets、Job 依賴、CLI 部署 |
