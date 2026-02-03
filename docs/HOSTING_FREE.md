# Free Hosting Guide (Testing)

This guide covers how to host this NestJS + Prisma + PostgreSQL project on free tiers for testing. The app exposes REST API, Swagger at `/api`, and WebSocket (Socket.IO) for order events.

## What You Need to Deploy

| Requirement        | Used for                                         |
| ------------------ | ------------------------------------------------ |
| **Node.js** (v18+) | Runtime (provided by hosts)                      |
| **PostgreSQL**     | Prisma database (use host’s DB or free Postgres) |
| **Env vars**       | `DATABASE_URL`, optionally `PORT`                |

**Build:** `npm run build`  
**Start:** `node dist/main`  
**Migrations (production):** `npx prisma migrate deploy`

---

## Option 1: Render (Web Service + PostgreSQL)

[Render](https://render.com) offers a free Web Service and a free PostgreSQL instance (with limits; good for testing).

### 1. Prepare the repo

- Push the project to GitHub (or GitLab).
- Ensure `package.json` has:
  - `"engines": { "node": ">=18" }` (optional but recommended).

### 2. Create PostgreSQL database

1. [Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**.
2. Name it (e.g. `project-name-db`), choose **Free** plan, **Create**.
3. Copy the **Internal Database URL** (use this for `DATABASE_URL` on Render).

### 3. Create Web Service

1. **New** → **Web Service**.
2. Connect your repo and select this project.
3. Configure:
   - **Name:** e.g. `project-name-api`
   - **Region:** closest to you
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node dist/main`
   - **Instance Type:** Free

### 4. Environment variables

In the Web Service → **Environment**:

| Key            | Value                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Paste the **Internal Database URL** from the PostgreSQL service                                   |
| `PORT`         | `5000` (or leave unset; Render sets `PORT` automatically—ensure your app uses `process.env.PORT`) |

The app already uses `process.env.PORT ?? 5000` in `main.ts`, so Render’s `PORT` will be used.

### 5. Deploy

Click **Create Web Service**. Render will build and deploy. Your API will be at `https://<service-name>.onrender.com`. Swagger: `https://<service-name>.onrender.com/api`.

**Note:** Free Web Services spin down after inactivity; the first request may be slow (cold start). Free Postgres has size and connection limits; fine for testing.

---

## Option 2: Railway (App + PostgreSQL)

[Railway](https://railway.app) gives a monthly free credit; enough for a small app + Postgres for testing.

### 1. Install CLI (optional)

```bash
npm i -g @railway/cli
railway login
```

Or use the [Railway Dashboard](https://railway.app/dashboard) in the browser.

### 2. New project from repo

1. **New Project** → **Deploy from GitHub** (connect repo and select this project).
2. Add a **PostgreSQL** plugin: **New** → **Database** → **PostgreSQL**. Railway creates the DB and exposes `DATABASE_URL`.

### 3. Configure the service

1. Open the **Service** (your repo).
2. **Settings** → **Build**:
   - **Build Command:** `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node dist/main`
3. **Variables:** `DATABASE_URL` is usually added automatically from the Postgres plugin. Add `PORT` only if you need a fixed value (Railway sets `PORT`).

### 4. Deploy

Push to the connected branch or trigger a deploy from the dashboard. Railway assigns a URL like `https://<project>.up.railway.app`. Swagger: `https://<project>.up.railway.app/api`.

---

## Option 3: Fly.io (App) + Neon (Free PostgreSQL)

[Fly.io](https://fly.io) runs the app; [Neon](https://neon.tech) provides free serverless PostgreSQL.

### 1. Free PostgreSQL with Neon

1. Sign up at [Neon](https://neon.tech).
2. Create a project and a database.
3. Copy the connection string (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`). Use it as `DATABASE_URL`.

### 2. Fly.io app

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and run `fly auth login`.
2. In the project root, create `Dockerfile` (see below) and `fly.toml` (or run `fly launch` and adjust).

**Minimal `Dockerfile`:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
ENV NODE_ENV=production
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
```

Ensure `main.ts` uses `process.env.PORT ?? 8080` (Fly uses 8080 by default), or set `PORT=8080` in Fly.

**Create app and set secret:**

```bash
fly launch
# Follow prompts; do not add Postgres if using Neon.
fly secrets set DATABASE_URL="postgresql://..."
fly deploy
```

Your API will be at `https://<app-name>.fly.dev`. Swagger: `https://<app-name>.fly.dev/api`.

---

## Option 4: Koyeb (Web Service + External DB)

[Koyeb](https://www.koyeb.com) free tier can run a Node service. Use Koyeb for the app and Neon (or Render Postgres) for the database.

1. **Create App** → **GitHub** → select repo.
2. **Build:** `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
3. **Run:** `node dist/main`
4. Add `DATABASE_URL` (from Neon or another free Postgres) in **Environment variables**.
5. Deploy. URL format: `https://<app>.koyeb.app`.

---

## Environment Variables Summary

| Variable       | Required | Description                                                                                                 |
| -------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/dbname?sslmode=require` for cloud DBs) |
| `PORT`         | No       | Server port (most hosts set this automatically)                                                             |

---

## Running Migrations in Production

All options run migrations as part of the **build** or **start** command so the DB schema is up to date:

- **Render / Railway / Koyeb:**  
  `npx prisma migrate deploy` in the build step (before `node dist/main`).
- **Fly.io:**  
  `npx prisma migrate deploy` in the container `CMD` before starting the app.

Never use `prisma migrate dev` in production; use `prisma migrate deploy` only.

---

## WebSockets (Socket.IO)

This app uses Socket.IO for real-time order events. Behavior on free tiers:

- **Render / Railway / Fly / Koyeb:** WebSockets are supported on the same URL as the API. Clients can connect to `wss://<your-host>/` (or the path your Socket.IO server uses). No extra config for basic testing.
- If you later use a serverless or edge platform (e.g. Vercel serverless), long-lived WebSockets may not be supported; stick to a Node process (Render, Railway, Fly, Koyeb) for WebSocket testing.

---

## Quick Comparison

| Platform    | App host | Database                   | Free tier notes                       |
| ----------- | -------- | -------------------------- | ------------------------------------- |
| **Render**  | Yes      | Free Postgres add-on       | Services sleep when idle; cold starts |
| **Railway** | Yes      | Free Postgres add-on       | Monthly credit; simple setup          |
| **Fly.io**  | Yes      | Bring your own (e.g. Neon) | No sleep; need Dockerfile             |
| **Koyeb**   | Yes      | Bring your own (e.g. Neon) | Free tier limits                      |
| **Neon**    | No       | Free Postgres only         | Use with any app host above           |

For the quickest free setup for testing: use **Render** (Web Service + PostgreSQL) or **Railway** (App + Postgres), set `DATABASE_URL`, and use the build/start commands above.
