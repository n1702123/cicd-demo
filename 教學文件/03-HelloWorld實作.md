# 03 - 純 HTML Hello World + GitHub Actions + GitHub Pages

## 目標

用 GitHub Actions 自動部署純 HTML 靜態網站到 GitHub Pages：
> Push code → 自動部署到網路上（不需要 build）

---

## 整體流程

```
開發者 push code 到 GitHub
        │
        ▼
GitHub Actions 自動觸發
        │
        ├── Step 1: Checkout 程式碼
        └── Step 2: 推到 gh-pages branch
        │
        ▼
  GitHub Pages 更新網站
  ✅ 網址：https://{帳號}.github.io/{repo名稱}/
```

---

## 專案結構

```
hello-world/
├── .github/
│   └── workflows/
│       └── deploy.yml   ← GitHub Actions 設定
└── index.html           ← 首頁（Hello World）
```

---

## index.html

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

---

## GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]       # push 到 main 時自動觸發
  workflow_dispatch:        # 也可以手動觸發

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write       # 需要寫入權限推到 gh-pages branch

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .    # 直接發布根目錄
```

---

## GitHub 上的設定步驟

1. 把專案 push 到 GitHub
2. 等 Actions 跑完（約 30 秒）
3. 到 repo → **Settings** → **Pages**
4. Source 選 **Deploy from a branch**
5. Branch 選 **`gh-pages`**，資料夾選 **`/ (root)`**
6. 按 Save

---

## 完成後

網址：
```
https://{你的GitHub帳號}.github.io/hello-world/
```

每次 push 到 main，網站就會自動更新。
