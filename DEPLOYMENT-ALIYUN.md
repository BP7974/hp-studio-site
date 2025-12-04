# HP Studio · 轻量应用服务器部署指南（阿里云）

面向场景：你已经在阿里云开通 **轻量应用服务器（Lighthouse）**，准备绑定备案好的自有域名，将本项目（Next.js + SQLite + 本地上传目录）部署上线。

---
## 1. 服务器初始化
1. 选择偏好系统（推荐 Ubuntu 22.04 64 位），开放 `22`, `80`, `443` 端口 — 你的实例公网 IP 为 **39.96.96.75**，后续命令中的 `<服务器IP>` 都可以替换为该地址。
2. SSH 登录服务器，创建项目目录：
   ```bash
   sudo mkdir -p /srv/hp-studio && sudo chown $USER:$USER /srv/hp-studio
   ```
3. 安装基础依赖：
   ```bash
   sudo apt update && sudo apt install -y nginx sqlite3 build-essential curl git
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

## 2. 部署代码
1. 上传或拉取代码：
   ```bash
   cd /srv/hp-studio
   git clone <你的仓库地址> .
   npm install
   cp .env.example .env   # 修改 JWT_SECRET、APP_BASE_URL、PASSWORD_RESET_TTL_MINUTES、VERIFICATION_*、SMTP_*、SMS_*
   ```
   配置 `.env` 时请根据下方“SMTP 邮件发送配置 / 短信验证码配置”补全邮件与短信变量，否则验证码/找回密码接口只会返回调试数据，不会真正发信。
2. 初始化数据库与上传目录（第一次启动自动创建，但建议提前赋权）：
   ```bash
   mkdir -p uploads
   chmod 750 uploads
   ```
3. 构建并试跑：
   ```bash
   npm run build
   npm run start -- --hostname 127.0.0.1 --port 3000
   ```
   确认 http://服务器IP:3000 正常后 Ctrl+C 停止。

## 3. 使用 PM2 / systemd 常驻
### 方案 A：PM2
```bash
sudo npm install -g pm2
pm2 start "npm run start -- --hostname 127.0.0.1 --port 3000" --name hp-studio
pm2 startup systemd
pm2 save
```

### 方案 B：systemd
创建 `/etc/systemd/system/hp-studio.service`：
```
[Unit]
Description=HP Studio Next.js App
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/hp-studio
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=10
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```
然后：
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hp-studio
```
（若使用 www-data，先把项目目录/数据库/上传目录授权给该用户。）

## 4. Nginx 反向代理 + HTTPS
1. 新建 `/etc/nginx/sites-available/hp-studio.conf`（以下示例已替换为你的域名 **hp-studio.top**）：
```
server {
    listen 80;
   server_name hp-studio.top www.hp-studio.top;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```
2. 启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/hp-studio.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
3. 申请 HTTPS（推荐 `certbot` + 阿里云 DNS，或在控制台申请免费证书）：
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d hp-studio.top -d www.hp-studio.top
```
   Certbot 会自动生成 443 配置并定期续期。

   > 📧 **找回密码邮件**：生产环境建议配置 SMTP，并在 `.env` 中增加相应的连接信息（或在 API 中扩展实际发送逻辑）。默认情况下，后端会在日志以及接口响应里返回调试令牌，方便你在没有邮件服务器时完成测试，上线前务必替换为真实通知手段。

## 5. SMTP 邮件发送配置
1. 选择一个 SMTP 服务（例如腾讯/阿里企业邮、SendGrid、Mailgun）。
2. 在 `.env` 中填入：
   - `SMTP_HOST`
   - `SMTP_PORT`（465=SSL，587=STARTTLS）
   - `SMTP_SECURE`（`true` 或 `false`）
   - `SMTP_USER` / `SMTP_PASS`
   - `SMTP_FROM`（例如 `"HP Studio" <noreply@hp-studio.top>`）
3. 重新执行 `npm run build` 并 `pm2 restart hp-studio --update-env` 让服务读取最新变量。若暂未配置 SMTP，API 会在响应里返回调试 token；上线前务必改为真实邮件通知。更多说明见 `README.md` 的 “SMTP 邮件配置” 章节。

## 6. 短信验证码配置
1. 选择短信服务：目前内置 `SMS_PROVIDER=aliyun`、`SMS_PROVIDER=twilio`、`SMS_PROVIDER=spug`；保持 `mock` 则仅输出调试验证码。
2. 阿里云短信需在 `.env` 中设置：
   - `SMS_ALIYUN_ACCESS_KEY_ID`
   - `SMS_ALIYUN_ACCESS_KEY_SECRET`
   - `SMS_ALIYUN_SIGN_NAME`
   - `SMS_ALIYUN_TEMPLATE_CODE`（模板需包含变量 `code` / `ttl`）
   - `SMS_ALIYUN_REGION_ID`（默认 `cn-hangzhou`）
3. Twilio 需设置：
   - `SMS_TWILIO_ACCOUNT_SID`
   - `SMS_TWILIO_AUTH_TOKEN`
   - `SMS_TWILIO_FROM`（例如 `+1234567890`）
4. Spug 需配置：
   - `SPUG_SMS_ENDPOINT`（或 `SPUG_SMS_BASE_URL + SPUG_SMS_PATH`）
   - `SPUG_SMS_TOKEN`、`SPUG_SMS_AUTH_SCHEME`、`SPUG_SMS_CHANNEL`
   - 模板：使用 `SPUG_SMS_TEMPLATE_ID`（Spug 模板）或 `SPUG_SMS_MESSAGE_TEMPLATE`（直接发送内容，支持 `{code}`、`{ttl}` 占位符）
   - 可选：`SPUG_SMS_TIMEOUT_MS`、`SPUG_SMS_HEADERS_JSON`
5. 所有方案都可通过 `VERIFICATION_CODE_TTL_MINUTES` / `VERIFICATION_RESEND_SECONDS` 控制验证码有效期与冷却时间。

## 7. 域名解析
- 登录阿里云域名控制台，找到 `hp-studio.top`。
- 新增/修改 `@` 主机记录的 `A` 记录，指向轻量应用服务器的 **公网 IP**；
- 如需 `www.hp-studio.top`，再添加一条 `www` 主机记录的 `A` 记录指向同 IP；
- 解析传播完成（通常几分钟至 1 小时）后，访问 http://hp-studio.top 即可命中服务器。

## 8. 上传文件存储注意事项
- 轻量型服务器磁盘有限：必要时挂载数据盘或迁移 `uploads/` 至阿里云 OSS。
- 若想使用 OSS，请改造 `/api/files/upload` 及下载路由，改用 OSS SDK 上传/读取，并将 `uploads/` 目录改为临时缓存。

## 9. 日常运维
- 更新代码：
  ```bash
  cd /srv/hp-studio
  git pull
  npm install
  npm run build
      pm2 restart hp-studio --update-env   # 或 systemctl restart hp-studio
  ```
- 备份：
  - `hpstudio.db`（SQLite） + `uploads/` 目录，建议定期打包备份至 OSS/对象存储。
- 监控：
  - 关注磁盘容量、CPU、内存；开启云监控报警。

这样就可以在阿里云轻量应用服务器上使用你自己的域名稳定运行 HP Studio 网站啦。
