# HP Studio Website Architecture

## Tech Stack
- **Framework**: Next.js 14 (Pages Router) for unified frontend + API routes.
- **Styling**: CSS Modules + global CSS emphasizing a monochrome (black/white) palette.
- **State/Auth**: Lightweight JWT sessions stored in HttpOnly cookies, client context for user session details.
- **Database**: SQLite (via `better-sqlite3`) for user accounts and file metadata.
- **File Storage**: Local `/uploads` directory managed by API routes using `formidable` for multipart handling.

## Core Modules
1. **Auth APIs** (`/api/auth/*`)
   - `POST /api/auth/register`: accepts name, email, phone, password; ensures uniqueness on phone/email; stores bcrypt-hashed passwords.
   - `POST /api/auth/login`: accepts email or phone plus password; issues JWT cookie on success.
   - `POST /api/auth/logout`: clears the auth cookie.
2. **File APIs** (`/api/files/*`)
   - `POST /api/files/upload`: protected; accepts file + title/description; persists file metadata + saves binary.
   - `GET /api/files/list`: public; returns recent uploads with uploader name, timestamps, download URL.

## Frontend Pages
- **`/` Home**: Hero highlighting “HP Studio” with monochrome branding, CTA buttons.
- **`/auth`**: combined register/login view with toggle for phone/email flows.
- **`/dashboard`**: authenticated upload form + personal recent uploads.
- **`/explore`**: public gallery listing all files with download buttons.

## Key UI Elements
- Minimal black background, white typography, accent borders.
- Reusable components: `Layout`, `Header`, `FileCard`, `AuthForm`.

## Security & Validation
- Password hashing via bcrypt.
- JWT signed with server-side secret, 7-day expiration.
- Upload size capped (configurable) and limited file extensions.
- Input validation on both client + server.

## Future Enhancements
- Move storage to S3-equivalent, add search/filter, add admin moderation.
