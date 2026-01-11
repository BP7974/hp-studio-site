@echo off
set SERVER=39.96.96.75
set USER=admin
set REMOTE_DIR=/home/admin/hp-studio

REM 1. 本地构建
call npm ci
call npm run build

REM 2. 上传代码到服务器（排除 node_modules/.cache/.git 可选）
REM 需要安装 WinSCP 或使用 scp 命令行工具
REM 推荐用 WinSCP 图形界面或 WSL 下用 scp
REM 下面是 scp 示例（需安装 OpenSSH 客户端）：
REM scp -r * %USER%@%SERVER%:%REMOTE_DIR%

REM 3. 远程自动部署
ssh %USER%@%SERVER% ^
"cd %REMOTE_DIR% && \
npm ci && \
npm run build && \
pm2 stop all && \
pm2 delete all && \
pm2 start npm --name hp-studio -- start --cwd %REMOTE_DIR% && \
pm2 logs hp-studio --lines 30"