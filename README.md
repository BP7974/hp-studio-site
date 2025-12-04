# HP Studio Website

A monochrome web app for HP Studio to register with phone/email, upload files, and showcase every upload publicly.

## Features
- **Auth**: Register with name + phone + email, login with phone or email, session stored via HttpOnly cookies。
- **Password Reset**: Built-in“忘记密码”流程，支持邮件链接或调试令牌。
- **Uploads**: 20MB file limit, metadata stored in SQLite, binaries saved under `/uploads`.
- **Gallery**: Public explore page so anyone can browse/download shared files.
- **Branding**: Black/white UI that keeps “HP Studio” front and center.

## Tech Stack
- Next.js 16 (Pages Router)
- SQLite via `better-sqlite3`
- JWT + bcrypt for authentication
- `formidable` for handling multipart uploads

## Getting Started
```bash
# Install deps
npm install

# Set environment variables
cp .env.example .env
# then edit JWT_SECRET / APP_BASE_URL / etc.

# Run dev server
npm run dev
```

Visit http://localhost:3000

## Deploying to Aliyun Lightweight App Server
See `DEPLOYMENT-ALIYUN.md` for step-by-step guidance covering Node installation, systemd/PM2, Nginx reverse proxy, HTTPS, and domain binding（文档示例已使用你的域名 `hp-studio.top`）。

## Project Layout
- `pages/` – React pages + API routes
- `lib/` – SQLite + auth helpers
- `uploads/` – File binaries (gitignored)

## Production Notes
- Move `uploads` to durable storage like OSS/S3 in production.
- Swap `JWT_SECRET` with a long, random string.
- Put HTTPS/Reverse proxy in front to protect file downloads.
- Configure `APP_BASE_URL` 为公网域名、`PASSWORD_RESET_TTL_MINUTES` 控制找回密码链接有效期；若未配置 SMTP，可使用 API 返回的调试令牌帮助测试。

## Password Reset Flow
1. 用户在登录界面点击 “忘记密码？” ，输入注册邮箱请求链接。
2. 服务器生成一次性令牌，写入 `password_resets` 表，并在调试模式下直接返回令牌。
3. 用户打开 `resetToken` 填写新密码，即可完成更新。
4. 若部署生产环境，建议在 API 中接入真实邮件服务（或通过第三方通知）将 `resetUrl` 发给用户。
