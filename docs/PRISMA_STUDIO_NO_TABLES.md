# Prisma Studio: "No Tables Found" — Fix

Prisma Studio shows **"No database tables found"** when the database it connects to has no tables. It reads from the DB (using `DATABASE_URL`), not from `schema.prisma`.

## Fix

1. **Apply migrations** so the database has tables (users, orders, translate_regions, translate_region_locales):

   ```bash
   npm run prisma:migrate:deploy
   ```

   Or for local development (creates migration history and applies):

   ```bash
   npm run prisma:migrate:dev
   ```

2. **Use a reachable database**
   - If `DATABASE_URL` points to a remote host (e.g. Render), ensure the server is running and your network can reach it.
   - For local development, you can point to a local PostgreSQL in `.env`:
     ```env
     DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/nest_db"
     ```
     Then run `npm run prisma:migrate:dev` so all migrations (including translate_regions) run against that DB.

3. **Restart Prisma Studio** after migrations succeed:
   ```bash
   npm run prisma:studio
   ```
   Open the **Tables** view or **Visualizer** — the tables should appear.

## Optional: Seed translate regions

After the translate_regions migration is applied, you can seed example data:

```bash
# Replace with your connection details if needed
psql "$DATABASE_URL" -f prisma/seed-translate-regions.sql
```

Or run the SQL in `prisma/seed-translate-regions.sql` in your DB client.
