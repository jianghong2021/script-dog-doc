# 脚本盒子文档

脚本盒子官方文档

## 脚本分享站

在文档基础上增加了脚本市场（列表 / 详情 / 上传）、邮箱用户体系与管理后台，使用 Cloudflare D1 + R2，部署到 Cloudflare Workers。

### 本地开发

```bash
npm install
# 初始化本地 D1 表结构（首次）
npx wrangler d1 execute script-dog-doc --local --file=./schema.sql
npm run dev
```

### 部署到 Cloudflare

```bash
# 1. 创建 D1 数据库，并把返回的 database_id 填入 wrangler.jsonc
npx wrangler d1 create script-dog-doc
# 2. 初始化线上表结构
npx wrangler d1 execute script-dog-doc --file=./schema.sql --remote
# 3. 创建 R2 桶（存放预览图片与原始脚本 JSON）
npx wrangler r2 bucket create script-dog-files
# 4. 构建并部署
npm run build
npx wrangler deploy
```

### 说明

- 首个管理员：在 `wrangler.jsonc` 的 `vars.ADMIN_EMAIL` 中配置邮箱，该邮箱注册后自动成为管理员。
- 仅「上传脚本」需要登录，浏览、下载与安装均无需登录。
- 上传限制：最多 2 张预览图片，单张小于 1MB。

