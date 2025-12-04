# HP Studio Website

A monochrome web app for HP Studio to register with phone/email, upload files, and showcase every upload publicly.

## Features
- **Auth**: Register with name + password plus a verified email *or* phone（可选两个都绑），登录时可使用任意已绑定的账号，session 存在 HttpOnly Cookie。
- **Password Reset**: “忘记密码” 支持邮箱+手机号双验证码验证，再发放重置链接/令牌。
- **Verification**: 注册时至少完成一种验证（邮箱或手机号），另一种可在需要时再绑定。
- **Uploads**: 10GB limit（可通过 `MAX_UPLOAD_BYTES` 调整，仍允许 0 字节空文件），元数据存在 SQLite，文件保存在 `/uploads`。
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
- `MAX_UPLOAD_BYTES` 控制 API 接受的单文件体积，默认 10GiB。如放在 Nginx/OSS 前面，请同步设置 `client_max_body_size 10240m;`、`proxy_request_buffering off;` 并放宽上游超时（`proxy_read_timeout`/`proxy_send_timeout` 至 ≥3600s），否则大文件会被网关提前阻断。

### 大文件上传（10GB 目标）
1. 在 `.env` 里设置 `MAX_UPLOAD_BYTES=10737418240`（或更大自定义值），再 `pm2 restart` / `systemctl restart` 让后台读取新阈值。
2. Web 服务器需同步调大：
	 - **Nginx** 示例：
		 ```nginx
		 client_max_body_size 10240m;
		 proxy_request_buffering off;
		 proxy_read_timeout 3600s;
		 proxy_send_timeout 3600s;
		 ```
	 - 若使用 CDN/负载均衡，请在前置节点也放宽上传大小与超时。
3. 服务器磁盘需至少多预留 10GB + 冗余空间；建议把 `uploads/` 挂载至 OSS/S3 之类的持久化存储。
4. 终端用户要想加快传输，可使用支持断点续传/多线程的 HTTP 客户端（如 `aria2`、`curl --parallel` 或浏览器分片上传），后端已经禁用超时并允许长连接。

## SMTP 邮件配置
1. 选择一个 SMTP 服务（腾讯/阿里企业邮、SendGrid、Mailgun 等）并创建发信账号或 API Key。
2. 在 `.env` 中填入：
	- `SMTP_HOST`：SMTP 服务器域名
	- `SMTP_PORT`：465（SSL）或 587（STARTTLS）
	- `SMTP_SECURE`：`true` 表示 SSL，`false` 表示 STARTTLS
	- `SMTP_USER` / `SMTP_PASS`：登录凭据
	- `SMTP_FROM`：发件人标识，例如 `"HP Studio" <noreply@hp-studio.top>`
3. 重新运行 `npm run build` 并 `pm2 restart hp-studio --update-env`，之后忘记密码接口会发送邮件，同时仍在日志中保留调试用链接/令牌。

## 注册验证码（邮箱 / 手机二选一）
1. 用户在注册表单中填写邮箱、手机号中的任意一项（也可以两项），并点击对应的“获取验证码”。后台会：
	- 检查该邮箱/手机号是否占用；
	- 生成 6 位验证码写入 `verification_codes` 表；
	- 邮箱：配置 SMTP 时会发送邮件；否则在响应中返回 `previewCode` 供调试；
	- 手机：配置 `SMS_PROVIDER` 时走真实短信通道，否则返回 `previewCode` 并写入日志。
2. 每个通道都有独立冷却（默认 60 秒），只要完成至少一种验证即可提交注册；另一种可以在个人中心后续绑定。
3. 注册接口仅校验用户实际填写的通道，并允许缺省的邮箱或手机号为 `NULL`。若同时填写，则两个验证码都必须正确。

### SMS 环境变量
- `SMS_PROVIDER`: `aliyun` / `twilio` / `spug` / `mock`
- **Aliyun**：`SMS_ALIYUN_ACCESS_KEY_ID`、`SMS_ALIYUN_ACCESS_KEY_SECRET`、`SMS_ALIYUN_SIGN_NAME`、`SMS_ALIYUN_TEMPLATE_CODE`、`SMS_ALIYUN_REGION_ID`
- **Twilio**：`SMS_TWILIO_ACCOUNT_SID`、`SMS_TWILIO_AUTH_TOKEN`、`SMS_TWILIO_FROM`
- **Spug**：
	- `SPUG_SMS_ENDPOINT` *或* `SPUG_SMS_BASE_URL + SPUG_SMS_PATH`（推荐 `/send/<模板编号>`）
	- `SPUG_SMS_TEMPLATE_ID`（若使用 `BASE_URL + PATH` 拼接，可直接填模板编号）
	- `SPUG_SMS_TOKEN` + `SPUG_SMS_AUTH_SCHEME`（默认 `Token`）
	- `SPUG_SMS_NAME`：Spug 模板中的 `${name}` 变量
	- `SPUG_SMS_HEADERS_JSON`（默认仅含 `Content-Type`）
	- `SPUG_SMS_TIMEOUT_MS`（默认 20000 毫秒）
	- `SPUG_SMS_EXTRA_JSON`（可选，将合并进请求体，如 `{"targets2":"..."}`）
- `SMS_PROVIDER=mock` 时不会真实发信，接口会返回 `previewCode` 便于测试。

## 维护 / 清理
- `npm run reset:data`：删除所有 `users / files / password_resets / verification_codes` 记录，并清空 `uploads/` 目录，适合演示结束后的一键清理。

## Password Reset Flow
1. 用户在登录界面点击 “忘记密码？” ，输入注册邮箱 + 手机号，并分别获取邮箱/短信验证码。
2. 后端校验邮箱和手机号与账号一致，同时验证两枚验证码（`reset-email` / `reset-phone`）。
3. 通过验证后生成一次性令牌写入 `password_resets` 表，并在调试模式下返回 `resetToken`（正式环境通过邮件发送 `resetUrl`）。
4. 用户在 “重置密码” 面板中输入令牌与新密码即可更新账号。
5. 如果需要真实邮件或短信通知，请配置 SMTP 与 `SMS_PROVIDER`，否则 API 会直接返回 `previewCode` 供测试。
