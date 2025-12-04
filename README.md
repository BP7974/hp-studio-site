# HP Studio Website

A monochrome web app for HP Studio to register with phone/email, upload files, and showcase every upload publicly.

## Features
- **Auth**: Register with name + phone + email, login with phone or email, session stored via HttpOnly cookies。
- **Password Reset**: Built-in“忘记密码”流程，支持邮件链接或调试令牌。
- **Verification**: 注册时邮箱与手机号都需验证码，防止垃圾注册。
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
- Configure `APP_BASE_URL` 为公网域名、`PASSWORD_RESET_TTL_MINUTES` 控制找回密码链接有效期；若未配置 SMTP，可使用 API 返回的调试令牌帮助测试。
- 如果需要真实邮件通知，配置 `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` 后即可自动发送“忘记密码”/“注册验证码”邮件。
- `VERIFICATION_CODE_TTL_MINUTES`/`VERIFICATION_RESEND_SECONDS` 控制验证码有效期与冷却时间。
- `SMS_PROVIDER` 可设置为 `aliyun`、`twilio`、`spug` 或 `mock`（默认），并填充对应凭据后即可发送手机验证码。

## SMTP 邮件配置
1. 选择一个 SMTP 服务（腾讯/阿里企业邮、SendGrid、Mailgun 等）并创建发信账号或 API Key。
2. 在 `.env` 中填入：
	- `SMTP_HOST`：SMTP 服务器域名
	- `SMTP_PORT`：465（SSL）或 587（STARTTLS）
	- `SMTP_SECURE`：`true` 表示 SSL，`false` 表示 STARTTLS
	- `SMTP_USER` / `SMTP_PASS`：登录凭据
	- `SMTP_FROM`：发件人标识，例如 `"HP Studio" <noreply@hp-studio.top>`
3. 重新运行 `npm run build` 并 `pm2 restart hp-studio --update-env`，之后忘记密码接口会发送邮件，同时仍在日志中保留调试用链接/令牌。

## 注册验证码（邮箱 + 手机）
1. 用户在注册表单中点击“获取验证码”，后端会：
	- 验证邮箱/手机号是否已使用；
	- 生成 6 位数字验证码，写入 `verification_codes` 表并设置过期时间；
	- 邮箱：若配置 SMTP 则发送邮件，否则在响应里返回 `previewCode` 供调试；
	- 手机：若配置 `SMS_PROVIDER` 则调用阿里云/ Twilio 发送短信，否则返回 `previewCode` 并在日志输出。
2. 前端会自动进入冷却倒计时（默认 60 秒），用户输入验证码后才能提交注册。
3. 注册接口会校验邮箱和手机验证码，成功后才写入 `users` 表。

### SMS 环境变量
- `SMS_PROVIDER`: `aliyun` / `twilio` / `spug` / `mock`
- **Aliyun**：`SMS_ALIYUN_ACCESS_KEY_ID`、`SMS_ALIYUN_ACCESS_KEY_SECRET`、`SMS_ALIYUN_SIGN_NAME`、`SMS_ALIYUN_TEMPLATE_CODE`、`SMS_ALIYUN_REGION_ID`
- **Twilio**：`SMS_TWILIO_ACCOUNT_SID`、`SMS_TWILIO_AUTH_TOKEN`、`SMS_TWILIO_FROM`
- **Spug**：
	- `SPUG_SMS_ENDPOINT`（或 `SPUG_SMS_BASE_URL + SPUG_SMS_PATH`）
	- `SPUG_SMS_TOKEN` + `SPUG_SMS_AUTH_SCHEME`（默认 `Token`）
	- `SPUG_SMS_CHANNEL`（默认 `SMS`）
	- 任选其一：`SPUG_SMS_TEMPLATE_ID` *或* `SPUG_SMS_MESSAGE_TEMPLATE`（模板字符串支持 `{code}` / `{ttl}`）
	- 可选：`SPUG_SMS_TIMEOUT_MS`、`SPUG_SMS_HEADERS_JSON`
- `SMS_PROVIDER=mock` 时不会真实发信，接口会返回 `previewCode` 便于测试。

## 维护 / 清理
- `npm run reset:data`：删除所有 `users / files / password_resets / verification_codes` 记录，并清空 `uploads/` 目录，适合演示结束后的一键清理。

## Password Reset Flow
1. 用户在登录界面点击 “忘记密码？” ，输入注册邮箱请求链接。
2. 服务器生成一次性令牌，写入 `password_resets` 表，并在调试模式下直接返回令牌。
3. 用户打开 `resetToken` 填写新密码，即可完成更新。
4. 若部署生产环境，建议在 API 中接入真实邮件服务（或通过第三方通知）将 `resetUrl` 发给用户。
