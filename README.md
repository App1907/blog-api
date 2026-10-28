# Blog API (MongoDB)

REST API for a blog with authentication (custom MongoDB sessions), posts, tags, comments, and statistics.

**Stack:** Node.js · Express · TypeScript (strict) · MongoDB Atlas · Mongoose · Zod · bcryptjs

Database: `blog_ayush`

## Setup

```bash
npm install
cp .env.example .env   # set MONGODB_URI
npm run dev
```

## Scripts

- `npm run dev` — auto-restart
- `npm run build` — compile
- `npm start` — run compiled JS

## Highlights

- Custom sessions in MongoDB (no `express-session` / Passport)
- TTL index on `sessions.expiresAt`
- Post list via `$facet` (body excluded)
- Stats via one `$facet` aggregation
- Login attempt limiting (MongoDB)
- Password never returned; stacks never leaked

## Main endpoints

- Auth: `/api/auth/signup|login|logout|logout-all`
- Users: `/api/users/me`, `/api/users/me/posts`
- Posts: `/api/posts`, `/api/posts/:id`
- Comments: `/api/posts/:id/comments`, `/api/comments/:id`
- Stats: `/api/stats`
- Health: `/api/health`
