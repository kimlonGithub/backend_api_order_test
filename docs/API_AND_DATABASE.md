# API Endpoints and Database

This document describes how the main API endpoints interact with the database, and how to interpret the health check vs. user endpoints.

---

## Base URL

- Local: `http://localhost:3000` (or the `PORT` in your `.env`)
- Production: use your deployed base URL (e.g. `{{pro_url}}` in Postman)
- Swagger: `http://localhost:3000/api` when the app is running

---

## Database (PostgreSQL)

The app uses **PostgreSQL** with **Prisma** as the ORM.

- **Connection:** Configured via `DATABASE_URL` in the environment (e.g. on Render: **order_db**, PostgreSQL 18).
- **Free tier note:** If using Render’s free PostgreSQL instance, it will expire on the date shown in the dashboard (e.g. March 6, 2026). After that, the database is deleted unless you upgrade; all endpoints that use the DB will fail.

---

## How Each Endpoint Uses the Database

| Endpoint          | Method | Uses DB? | How                                                                                                            |
| ----------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `/`               | GET    | No       | Returns a greeting from `AppService`.                                                                          |
| `/test-db`        | GET    | Yes      | Runs a **raw SQL** query (`SELECT NOW(), version()`) to verify connectivity. Does **not** depend on any table. |
| `/users`          | GET    | Yes      | Uses Prisma to read from the **`users`** table (`user.findMany()`).                                            |
| `/users`          | POST   | Yes      | Uses Prisma to insert into the **`users`** table (`user.create()`).                                            |
| `/users/:user_id` | GET    | Yes      | Reads one row from **`users`** by ID.                                                                          |
| `/users/:user_id` | PATCH  | Yes      | Updates one row in **`users`**.                                                                                |
| `/users/:user_id` | DELETE | Yes      | Deletes one row from **`users`**.                                                                              |

So:

- **`/test-db`** only checks that the app can run a raw query against PostgreSQL. It does **not** check that your schema (e.g. `users` table) exists.
- **`/users`** (and other user routes) depend on the **`users`** table and the rest of the schema. If migrations have not been run on that database, these endpoints will fail (typically with **500 Internal Server Error**).

---

## Test Database Connection

**`GET /test-db`**

Verifies that the app can connect to PostgreSQL and run a query. It does **not** require the `users` or any other application table to exist.

**Response (200 OK) — success**

```json
{
  "status": "success",
  "message": "Database connection successful",
  "data": {
    "current_time": "2026-02-09T04:58:12.587Z",
    "pg_version": "PostgreSQL 18.1 (Debian 18.1-1.pgdg12+2) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14+deb12u1) 12.2.0, 64-bit"
  }
}
```

**Response (200 OK) — connection failed**

The handler catches errors and still returns 200 with a body like:

```json
{
  "status": "error",
  "message": "Database connection failed",
  "error": "<error message>"
}
```

Use this endpoint to confirm that `DATABASE_URL` is correct and the database server is reachable.

---

## Users Endpoints

All user endpoints use the **`users`** table via Prisma. If you get **500 Internal Server Error** on these routes while `/test-db` returns success, the usual cause is that **migrations have not been applied** to that database (so the `users` table or other tables do not exist).

### Create user

**`POST /users`**

Creates a new user. Request body (JSON):

| Field   | Type   | Required | Description     |
| ------- | ------ | -------- | --------------- |
| `name`  | string | Yes      | User's name.    |
| `email` | string | Yes      | Must be unique. |

**Example request body**

```json
{
  "name": "B123",
  "email": "C123@example.com"
}
```

**Success (201 Created):** Response body is the created user (e.g. `id`, `name`, `email`, `createdAt`, `updatedAt`).

**Errors**

- **409 Conflict** — A user with that email already exists.
- **500 Internal Server Error** — Server-side failure. Common cause: database schema not applied (e.g. missing `users` table). Check server logs and ensure migrations have been run against the same database as `DATABASE_URL`.

**Example error response (500)**

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

### List users

**`GET /users`**

Returns all users, ordered by `createdAt` descending.

**Success (200 OK):** Array of user objects.

**Errors**

- **500 Internal Server Error** — Same as above; often due to missing or incompatible schema. Fix by running migrations and checking server logs.

---

### Get user by ID

**`GET /users/:user_id`**

- **Success (200):** One user object.
- **404:** User with that ID not found.
- **400:** `user_id` is not a valid integer.

---

### Update user

**`PATCH /users/:user_id`**

Body can include `name` and/or `email` (partial update). Email must remain unique.

- **200:** Updated user.
- **404:** User not found.
- **409:** Email already in use by another user.

---

### Delete user

**`DELETE /users/:user_id`**

- **204 No Content:** User deleted.
- **404:** User not found.

---

## Why `/test-db` Works but `/users` Returns 500

1. **`/test-db`** runs raw SQL (`SELECT NOW(), version()`). It only needs a valid PostgreSQL connection; no application tables are required.
2. **`/users`** uses Prisma’s `user` model, which expects a **`users`** table created by your Prisma migrations.

If the database (e.g. Render **order_db**) has never had migrations run against it, the `users` table will not exist. Then:

- `GET /test-db` → **200** (connection and raw query succeed).
- `GET /users` or `POST /users` → **500** (Prisma fails when accessing the missing table).

**Fix:** Run Prisma migrations against the same database used in production:

```bash
# Ensure DATABASE_URL in .env points to your production DB (e.g. Render order_db)
npx prisma migrate deploy
```

After migrations are applied, the users endpoints should work (assuming no other configuration or code errors). For any remaining 500s, check the Nest/Node server logs for the exact Prisma or database error.
