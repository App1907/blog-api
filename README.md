# Blog API

REST API for a blog with authentication (custom MongoDB sessions), posts, tags, comments, statistics, and Redis caching.

**Stack:** Node.js · Express · TypeScript (strict) · MongoDB Atlas · Mongoose · Redis (ioredis) · Zod · bcryptjs

Database + Redis key prefix: `blog_ayush`

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` → `.env` and set your Atlas URI (database name `blog_ayush`).

```env
PORT=3000
MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER.mongodb.net/blog_ayush?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=blog_ayush:
NODE_ENV=development
COOKIE_NAME=session_token
COOKIE_SECURE=false
```

### 3. Start Redis (Docker)

```bash
docker compose up -d
```

### 4. Run API

```bash
npm run dev      # development (auto-restart)
npm run build    # compile TypeScript → dist/
npm start        # run compiled JS
```

Health: `GET http://localhost:3000/api/health` → `{ "status": "ok" }`

Server starts only after **MongoDB and Redis** are connected.

---

## Project structure

```
src/
  constants/           # config, messages, Redis keys + TTLs
  providers/database/  # Mongoose connection
  providers/redis/     # shared ioredis client
  model/               # User, Session, Post, Comment
  Repository/          # DB queries
  Modules/             # controllers + services + validation
  routes/
  middlewares/         # auth, validate, error handler
  utils/               # AppError, crypto, cache helpers
  app.ts
  server.ts
```

---

## API overview

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | — | Create account |
| POST | `/api/auth/login` | — | Login (httpOnly cookie + token) |
| POST | `/api/auth/logout` | ✓ | Delete current session |
| POST | `/api/auth/logout-all` | ✓ | Delete all sessions |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/me` | ✓ | Profile (`X-Cache`) |
| PATCH | `/api/users/me` | ✓ | Update name |
| GET | `/api/users/me/posts` | ✓ | Own posts incl. drafts (not cached) |

### Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/posts` | ✓ | Create |
| GET | `/api/posts` | — | Published list + `$facet` (`X-Cache`) |
| GET | `/api/posts/:id` | — | One published post (`X-Cache`) |
| PATCH | `/api/posts/:id` | ✓ | Author only |
| DELETE | `/api/posts/:id` | ✓ | Author only + cascade comments |

### Comments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/posts/:id/comments` | ✓ | On published posts |
| GET | `/api/posts/:id/comments` | — | Paginated; first page cached |
| DELETE | `/api/comments/:id` | ✓ | Comment author or post author |

### Stats

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/stats` | — | One `$facet` aggregation (`X-Cache`) |

---

## Redis keys

All keys are prefixed with `blog_ayush:`.

| Key (without prefix) | Type | TTL | Set when | Deleted / invalidated when |
|----------------------|------|-----|----------|----------------------------|
| `session:<token>` | String (userId) | until `expiresAt` | login | logout, logout-all, expired |
| `user:<userId>:sessions` | Set of tokens | 7 days (refreshed on login) | login | logout (SREM), logout-all (DEL set) |
| `user:<userId>` | JSON String | 1 hour | GET `/users/me` miss | PATCH `/users/me` |
| `login:fail:<email>` | String counter | 15 min (from first fail) | failed login | successful login |
| `login:fail:ip:<ip>` | String counter | 15 min | failed login | successful login |
| `post:<id>` | JSON String | 10 min | GET published post miss | PATCH/DELETE post, comment add/delete |
| `posts:list:version` | String number | none | created as `0`, INCR on changes | never deleted (version bump) |
| `posts:list:v…:p…:l…:s…:t…:o…` | JSON String | 60 s | GET `/posts` miss | ignored after version INCR; TTL expiry |
| `stats` | JSON String | 5 min | GET `/stats` miss | post/comment changes (DEL) |
| `post:<id>:comments:version` | String number | ~1 hour (refreshed on change) | first comments cache / INCR | INCR on comment add/delete |
| `post:<id>:comments:v…:p…:l…` | JSON String | 60 s | GET comments (page 1) miss | ignored after version INCR |

### Cache rules

- MongoDB is always written first; Redis keys are deleted (never hand-patched).
- If Redis is down, the API continues on MongoDB (rate limit may be skipped).
- Cached GETs send `X-Cache: HIT` or `X-Cache: MISS` (body unchanged).
- Never uses Redis `KEYS` (only explicit keys / SET members).

### Why stats can be ~5 minutes old

Stats are expensive (`$facet` + `$lookup`). They are dashboard-style metrics, not transactional reads. A 5-minute TTL keeps the aggregation from running on every request while staying fresh enough for overview charts.

---

## Error format

```json
{ "success": false, "message": "..." }
```

---

## Scripts

```bash
docker compose up -d   # Redis
npm run dev
npm run build && npm start
```
