# Blog API — Base Setup

Express + TypeScript (strict) + MongoDB Atlas + Redis foundation for the Blog API assignment.

**Prefix / DB name:** `blog_ayush`

## Scripts

```bash
npm install
docker compose up -d   # local Redis
npm run dev            # auto-restart
npm run build
npm start
```

## Environment

Copy `.env.example` → `.env`:

- `MONGODB_URI` — Atlas URI with database `blog_ayush`
- `REDIS_URL` — default `redis://localhost:6379`
- `REDIS_KEY_PREFIX` — `blog_ayush:`

## Included (Part 1)

- TypeScript strict project + folder structure
- MongoDB + Redis connections (server starts only after both connect)
- `GET /api/health` → `{ "status": "ok" }`
- Global error handler → `{ "success": false, "message": "..." }`
- Redis key helpers + shared ioredis client (`error` event logged, app does not crash)

Feature modules (auth, posts, comments, stats, caching) come in the complete assignment branch.
