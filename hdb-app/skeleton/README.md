# Application Skeleton (Mocked)

This folder contains a minimal, DB-free skeleton of your app. It mirrors your main structure so you can demo navigation and UX without a database.

## Prerequisites
- Node.js 18.18+ or 20+ (recommended via nvm)
- npm 9+ (or pnpm/yarn if your repo uses them)

No database download is required for the skeleton. It uses in-memory mock data only.

## Install dependencies (once per repo)
In the project root (e.g., `hdb-app/`):

```sh
npm install
```

The skeleton uses only the packages already in your root `package.json` (Next.js/React). Mongoose/MongoDB are NOT required while running the skeleton.

How to use
- Option A (temporary copy):
  - Backup your existing `src` if needed.
  - Copy the skeleton into `src`:
    - macOS/zsh:
      - cp -R skeleton/src/* src/
      - cp -R skeleton/public/* public/
- Option B (side-by-side review):
  - Open these files to see the structure and copy only what you need.

What’s included
- Pages: `(auth)/login`, `(auth)/register`, `home`, `account`, `userinfo`, `userpref`, `layout`.
- API routes: `/api/login`, `/api/register`, `/api/userinfo`, `/api/userpref` — all mocked, no DB.
- Lib: `lib/mock.ts` with an in-memory user; `lib/config.ts` for a `SKELETON` flag; `lib/mongoose.ts` stubbed.
- Models: `models/User.ts`, `models/bookmark.ts` stubbed to match imports.
- Public: `public/favicon.svg`, `public/logo.svg` placeholders.
- Data: `src/data/seed.json` example data (optional), and a README.
- Styles: `src/app/globals.css` minimal base styles (optional).

Notes
- These files are not used by Next.js until you copy them into `src/`.
- Mock data is held in-memory (resets on server restart).

Environment (optional)
- You can add an env toggle after copying:
  - `.env.local` → `SKELETON=true`
  - Use `IS_SKELETON` from `@/lib/config` in routes to short-circuit to mocks.

## Run
After copying into `src/`:

```sh
npm run dev
```

Then open http://localhost:3000 and try:
- `/login` → then `/home`
- `/account`
- `/userinfo`
- `/userpref`
