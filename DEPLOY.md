# Vercel Hobby + Supabase Free 部署

## 1. 建立 Supabase 專案

1. 到 Supabase 建立新 project。
2. 到 Project Settings -> Database -> Connection string。
3. 複製 Prisma/Node.js 可用的 PostgreSQL 連線字串。
4. 建議使用 pooled connection string，並加上 `?pgbouncer=true&connection_limit=1`。

範例：

```text
postgresql://postgres.xxxxx:你的密碼@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

## 2. 建立資料表

在本機 `.env` 放入 Supabase 的 `DATABASE_URL` 後執行：

```powershell
npx prisma db push
```

這會依照 `prisma/schema.prisma` 在 Supabase 建立資料表。

## 3. 匯入商品主檔

資料表建立後，可以在本機先匯入商品：

```powershell
npm run products:import -- "C:\Users\user\Desktop\1150504商品售價彙總表.ods"
```

或部署完成後，到 `/admin` 登入後用「匯入商品主檔」上傳。

## 4. Vercel 設定

到 Vercel 匯入 GitHub repo：

```text
sulipa181/warehouse-inventory-mvp
```

環境變數：

```text
DATABASE_URL=Supabase PostgreSQL connection string
ADMIN_PASSWORD=你的後台密碼
```

Build command 使用預設：

```text
npm run build
```

部署後：

```text
https://你的-vercel網址/mobile
https://你的-vercel網址/admin
```

## 注意

- 免費方案適合 MVP 和小量使用。
- Supabase Free 專案長時間沒使用可能會 pause；正式長期使用前要確認方案限制。
- 後台密碼請務必改掉，不要使用本機預設 `admin123`。
