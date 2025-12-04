# HP Studio Website

A monochrome web app for HP Studio to register with phone/email, upload files, and showcase every upload publicly.

## Features
- **Auth**: Register with name + phone + email, login with phone or email, session stored via HttpOnly cookies.
- **Uploads**: 20MB file limit, metadata stored in SQLite, binaries saved under `/uploads`.
- **Gallery**: Public explore page so anyone can browse/download shared files.
- **Branding**: Black/white UI that keeps “HP Studio” front and center.

## Tech Stack
- Next.js 14 (Pages Router)
- SQLite via `better-sqlite3`
- JWT + bcrypt for authentication
- `formidable` for handling multipart uploads

## Getting Started
```bash
# Install deps
npm install

# Set environment variables
cp .env.example .env
# then edit JWT_SECRET

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
