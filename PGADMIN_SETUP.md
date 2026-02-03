# pgAdmin Setup Guide for NestJS

This guide will walk you through setting up pgAdmin and connecting it to your NestJS application with PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Install PostgreSQL](#install-postgresql)
3. [Install pgAdmin](#install-pgadmin)
4. [Create Database in PostgreSQL](#create-database-in-postgresql)
5. [Configure Server Connection in pgAdmin](#configure-server-connection-in-pgadmin)
6. [Configure NestJS Application](#configure-nestjs-application)
7. [Test the Connection](#test-the-connection)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js and npm installed
- NestJS project initialized
- Basic knowledge of PostgreSQL

---

## Step 1: Install PostgreSQL

### For Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password for postgres user
sudo -u postgres psql
ALTER USER postgres PASSWORD '123456';
\q
```

### For macOS

```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Set password
psql postgres
ALTER USER postgres PASSWORD '123456';
\q
```

### For Windows

1. Download PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user (default username)
4. Make sure PostgreSQL service is running in Services

### Verify PostgreSQL Installation

```bash
# Check PostgreSQL version
psql --version

# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
# or check Services on Windows
```

---

## Step 2: Install pgAdmin

### For Linux

```bash
# Add pgAdmin repository
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub | sudo gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg

# Add repository to sources
sudo sh -c 'echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" > /etc/apt/sources.list.d/pgadmin4.list'

# Update and install
sudo apt update
sudo apt install pgadmin4

# Or install desktop version
sudo apt install pgadmin4-desktop
```

### For macOS

```bash
# Using Homebrew
brew install --cask pgadmin4
```

### For Windows

1. Download pgAdmin from [https://www.pgadmin.org/download/pgadmin-4-windows/](https://www.pgadmin.org/download/pgadmin-4-windows/)
2. Run the installer and follow the setup wizard
3. Launch pgAdmin 4 from the Start menu

### Launch pgAdmin

- **Linux**: Run `pgadmin4` from terminal or find it in applications
- **macOS**: Open pgAdmin 4 from Applications
- **Windows**: Launch from Start menu

On first launch, you'll be prompted to set a master password for pgAdmin.

---

## Step 3: Create Database in PostgreSQL

### Option A: Using Command Line (Recommended for First Setup)

```bash
# Connect to PostgreSQL as postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE nest_db;

# Verify database creation
\l

# Exit psql
\q
```

### Option B: Using pgAdmin (After Connection Setup)

1. Right-click on "Databases" in the left panel
2. Select "Create" → "Database..."
3. Enter database name: `nest_db`
4. Click "Save"

---

## Step 4: Configure Server Connection in pgAdmin

### Step 4.1: Register a New Server

1. **Open pgAdmin 4**
2. In the left sidebar, right-click on **"Servers"**
3. Select **"Register"** → **"Server..."**

### Step 4.2: General Tab

1. **Name**: Enter a descriptive name (e.g., `NestJS Local Server` or `nest_db`)
2. **Server group**: Leave as default
3. **Comments**: Optional description

### Step 4.3: Connection Tab

Fill in the following details:

| Field | Value | Description |
|-------|-------|-------------|
| **Host name/address** | `localhost` | Database server address |
| **Port** | `5432` | Default PostgreSQL port |
| **Maintenance database** | `postgres` | Default database to connect to |
| **Username** | `postgres` | PostgreSQL username |
| **Password** | `123456` | Your PostgreSQL password |
| **Save password?** | ✅ **Yes** | Check this to save password |

**Important Settings:**
- ✅ Enable **"Save password?"** to avoid entering password each time
- Leave **"Role"** and **"Service"** fields empty (unless you have specific requirements)

### Step 4.4: Advanced Tab (Optional)

- **DB restriction**: Leave empty to see all databases, or specify `nest_db` to restrict view

### Step 4.5: Save Connection

1. Click **"Save"** button at the bottom
2. The server should appear in the left sidebar under "Servers"
3. Click on the server name to expand and view databases

### Step 4.6: Verify Connection

1. Expand your server in the left sidebar
2. Expand **"Databases"**
3. You should see:
   - `postgres` (default database)
   - `nest_db` (your application database)
   - Other system databases

If you see the databases, your connection is successful! ✅

---

## Step 5: Configure NestJS Application

### Step 5.1: Verify Dependencies

Make sure you have the required packages installed:

```bash
npm install @nestjs/config @nestjs/typeorm typeorm pg
```

### Step 5.2: Environment Variables

Your `.env` file should contain:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123456
DB_NAME=nest_db
DB_SYNCHRONIZE=true
```

**Security Note:** 
- Never commit `.env` file to version control
- Use different credentials for production
- Consider using environment-specific files (`.env.development`, `.env.production`)

### Step 5.3: App Module Configuration

Your `src/app.module.ts` should be configured as follows:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env',
    }),
    // Configure TypeORM with environment variables
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME', 'nest_db'),
        entities: [], // Add your entity classes here later
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

---

## Step 6: Test the Connection

### Step 6.1: Start Your NestJS Application

```bash
# Development mode with watch
npm run start:dev

# Or production mode
npm run start:prod
```

### Step 6.2: Check Application Logs

If the connection is successful, you should see:
- No database connection errors
- Application starts successfully
- TypeORM connection established message

### Step 6.3: Verify in pgAdmin

1. Open pgAdmin
2. Navigate to your server → Databases → `nest_db`
3. Expand `nest_db` → **Schemas** → **public** → **Tables**
4. If `synchronize: true` is enabled and you have entities, tables should appear here

### Step 6.4: Test Database Query (Optional)

Create a simple test endpoint in `app.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private connection: Connection,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-db')
  async testDatabase() {
    try {
      const result = await this.connection.query('SELECT NOW() as current_time, version() as pg_version');
      return {
        status: 'success',
        message: 'Database connection successful',
        data: result[0],
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }
}
```

Then test it:
```bash
curl http://localhost:3000/test-db
```

---

## Step 7: Troubleshooting

### Issue: Cannot connect to PostgreSQL server

**Symptoms:**
- Error: `connection refused` or `could not connect to server`

**Solutions:**
1. **Check if PostgreSQL is running:**
   ```bash
   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   
   # macOS
   brew services list
   brew services start postgresql@14
   ```

2. **Check PostgreSQL port:**
   ```bash
   sudo netstat -tulpn | grep 5432
   # or
   sudo ss -tulpn | grep 5432
   ```

3. **Verify PostgreSQL configuration:**
   - Check `postgresql.conf` for `listen_addresses`
   - Check `pg_hba.conf` for authentication settings

### Issue: Authentication failed

**Symptoms:**
- Error: `password authentication failed for user "postgres"`

**Solutions:**
1. **Reset PostgreSQL password:**
   ```bash
   sudo -u postgres psql
   ALTER USER postgres PASSWORD '123456';
   \q
   ```

2. **Update `.env` file** with correct password

3. **Check pg_hba.conf** authentication method (should be `md5` or `scram-sha-256`)

### Issue: Database does not exist

**Symptoms:**
- Error: `database "nest_db" does not exist`

**Solutions:**
1. **Create the database:**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE nest_db;
   \q
   ```

2. **Or create via pgAdmin:**
   - Right-click "Databases" → Create → Database
   - Name: `nest_db`

### Issue: pgAdmin connection timeout

**Symptoms:**
- pgAdmin cannot connect to server
- Connection times out

**Solutions:**
1. **Check firewall settings:**
   ```bash
   # Linux - allow PostgreSQL port
   sudo ufw allow 5432/tcp
   ```

2. **Verify host and port** in pgAdmin connection settings

3. **Check if PostgreSQL is listening on correct interface:**
   ```bash
   sudo netstat -tulpn | grep 5432
   ```

### Issue: TypeORM synchronize warnings

**Symptoms:**
- Warnings about `synchronize: true` in production

**Solutions:**
1. **For development:** Keep `DB_SYNCHRONIZE=true` in `.env`
2. **For production:** Set `DB_SYNCHRONIZE=false` and use migrations:
   ```bash
   npm run typeorm migration:generate -- -n InitialMigration
   npm run typeorm migration:run
   ```

### Issue: Module not found errors

**Symptoms:**
- `Cannot find module '@nestjs/config'`

**Solutions:**
```bash
# Install missing dependencies
npm install @nestjs/config @nestjs/typeorm typeorm pg

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Additional Resources

### Useful PostgreSQL Commands

```bash
# Connect to PostgreSQL
psql -U postgres -d nest_db

# List all databases
\l

# Connect to specific database
\c nest_db

# List all tables
\dt

# Describe table structure
\d table_name

# Exit psql
\q
```

### Useful pgAdmin Features

1. **Query Tool**: Right-click database → Query Tool
   - Execute SQL queries
   - View query results
   - Export data

2. **Backup/Restore**: Right-click database → Backup/Restore
   - Create database backups
   - Restore from backup files

3. **ERD Tool**: Tools → ERD Tool
   - Visualize database relationships
   - Generate entity relationship diagrams

### Security Best Practices

1. **Change default PostgreSQL password**
2. **Use strong passwords** for production
3. **Limit database user permissions** (create specific users for applications)
4. **Use SSL connections** in production
5. **Regular backups** of your database
6. **Keep PostgreSQL and pgAdmin updated**

---

## Quick Reference

### Connection Details Summary

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Username | `postgres` |
| Password | `123456` (change in production!) |
| Database | `nest_db` |

### Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123456
DB_NAME=nest_db
DB_SYNCHRONIZE=true
```

### Common Commands

```bash
# Start NestJS app
npm run start:dev

# Check PostgreSQL status (Linux)
sudo systemctl status postgresql

# Connect to PostgreSQL
psql -U postgres -d nest_db

# Create database
createdb -U postgres nest_db
```

---

## Next Steps

After successful setup:

1. ✅ Create your first entity (e.g., `User` entity)
2. ✅ Add entities to `TypeOrmModule.forRootAsync` entities array
3. ✅ Create repositories for database operations
4. ✅ Set up database migrations for production
5. ✅ Implement CRUD operations in your services

---

## Support

If you encounter issues not covered in this guide:

1. Check [PostgreSQL Documentation](https://www.postgresql.org/docs/)
2. Check [pgAdmin Documentation](https://www.pgadmin.org/docs/)
3. Check [NestJS TypeORM Documentation](https://docs.nestjs.com/techniques/database)
4. Review application logs for detailed error messages

---

**Last Updated:** January 2026
**Version:** 1.0
