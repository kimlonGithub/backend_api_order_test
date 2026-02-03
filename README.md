# NestJS + Prisma + PostgreSQL Project

A modern NestJS application with Prisma ORM and PostgreSQL database integration, featuring complete User CRUD operations.

## 🚀 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v11
- **ORM**: [Prisma](https://www.prisma.io/) v7
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Package Manager**: npm
- **Validation**: class-validator, class-transformer

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v12 or higher)
- **Git** (optional)

## 🛠️ Installation

### 1. Clone the repository (if applicable)

```bash
git clone <repository-url>
cd project-name
```

### 2. Install dependencies

```bash
npm install
```

This will automatically generate Prisma Client after installation (via `postinstall` script).

### 3. Database Setup

#### Option A: Using existing PostgreSQL instance

1. Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE nest_db;

# Exit PostgreSQL
\q
```

#### Option B: Using Docker (optional)

```bash
docker run --name postgres-nest \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=nest_db \
  -p 5432:5432 \
  -d postgres:latest
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123456
DB_NAME=nest_db
DB_SYNCHRONIZE=true

# Prisma Database URL
# Format: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://postgres:123456@localhost:5432/nest_db"

# Application Port (optional)
PORT=5000
```

**⚠️ Important**: Update the database credentials to match your PostgreSQL setup.

### 5. Run Database Migrations

Generate and apply the initial database migration:

```bash
npm run prisma:migrate:dev -- --name init
```

This will:

- Create migration files in `prisma/migrations/`
- Apply the migration to your database
- Generate Prisma Client

## 🏃 Running the Application

### Development Mode

```bash
npm run start:dev
# or
npm run dev:start
```

The application will start on `http://localhost:5000` (or the port specified in `.env`) with hot-reload enabled.

### Production Mode

```bash
# Build the application
npm run build

# Run in production mode
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📚 Swagger UI

Interactive API documentation is available at **`/api`** when the app is running.

- **URL:** `http://localhost:5000/api` (or your `PORT`)
- **Features:** Try endpoints (Users, Orders, Health), see request/response schemas, and run requests from the browser.

Start the app with `npm run start:dev`, then open the URL above.

---

## 📚 API Endpoints

### Health Check

- **GET** `/` - Hello World message
- **GET** `/test-db` - Test database connection

### User CRUD Operations

#### Create User

```bash
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-01-27T10:00:00.000Z",
  "updatedAt": "2026-01-27T10:00:00.000Z"
}
```

#### Get All Users

```bash
GET /users
```

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-01-27T10:00:00.000Z",
    "updatedAt": "2026-01-27T10:00:00.000Z"
  }
]
```

#### Get User by ID

```bash
GET /users/:user_id
```

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-01-27T10:00:00.000Z",
  "updatedAt": "2026-01-27T10:00:00.000Z"
}
```

**Error (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "User with ID 999 not found",
  "error": "Not Found"
}
```

#### Update User

```bash
PATCH /users/:user_id
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Note:** Both `name` and `email` are optional. You can update one or both fields.

**Response (200 OK):**

```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "createdAt": "2026-01-27T10:00:00.000Z",
  "updatedAt": "2026-01-27T10:00:01.000Z"
}
```

#### Delete User

```bash
DELETE /users/:user_id
```

**Response (204 No Content):** Empty response body

**Error (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "User with ID 999 not found",
  "error": "Not Found"
}
```

### Orders API & WebSocket (admin notifications)

- **POST** `/orders` - Create order (body: `{ "total": number, "customerId"?: number }`). On success, the backend emits a **WebSocket** event `new_order` to the **admin** namespace.
- **GET** `/orders` - List all orders (includes `customer`).
- **GET** `/orders/:order_id` - Get one order by ID.
- **DELETE** `/orders/:order_id` - Delete an order.

Admin clients connect to the Socket.IO **admin** namespace and listen for the **`new_order`** event to show real-time notifications.

- **Testing & usage:** [docs/ORDERS_WEBSOCKET.md](docs/ORDERS_WEBSOCKET.md) (curl, WebSocket test, admin panel).
- **Backend implementation:** [docs/BACKEND_WEBSOCKET_IMPLEMENTATION.md](docs/BACKEND_WEBSOCKET_IMPLEMENTATION.md) (code and pattern for endpoint + WebSocket).
- **Front-end implementation:** [docs/FRONTEND_WEBSOCKET_AND_USERS.md](docs/FRONTEND_WEBSOCKET_AND_USERS.md) (WebSocket hook, select user in form and notifications).

## 🧪 Testing

### Manual Testing with cURL

#### Create a User

```bash
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

#### Get All Users

```bash
curl http://localhost:5000/users
```

#### Get User by ID

```bash
curl http://localhost:5000/users/1
```

#### Update User

```bash
curl -X PATCH http://localhost:5000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'
```

#### Delete User

```bash
curl -X DELETE http://localhost:5000/users/1
```

### Using Prisma Studio (Database GUI)

Open Prisma Studio to visually interact with your database:

```bash
npm run prisma:studio
```

This will open a web interface at `http://localhost:5555` where you can:

- View all tables and data
- Create, update, and delete records
- Explore relationships

### Automated Testing

#### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

#### End-to-End (E2E) Tests

```bash
npm run test:e2e
```

The E2E tests include:

- User creation
- User retrieval (all and by ID)
- User update
- User deletion
- Validation error handling
- Error cases (404, 400)

#### Debug Tests

```bash
npm run test:debug
```

## 📁 Project Structure

```
project-name/
├── prisma/
│   ├── schema.prisma          # Prisma schema definition
│   ├── migrations/             # Database migration files
│   └── prisma.config.ts        # Prisma configuration
├── src/
│   ├── prisma/
│   │   ├── prisma.service.ts   # Prisma service (database client)
│   │   └── prisma.module.ts    # Prisma module
│   ├── users/
│   │   ├── users.controller.ts # User CRUD controller
│   │   ├── users.service.ts    # User business logic
│   │   └── users.module.ts     # Users module
│   ├── dto/
│   │   ├── create-user.dto.ts  # Create user DTO with validation
│   │   └── update-user.dto.ts  # Update user DTO with validation
│   ├── app.controller.ts       # Main application controller
│   ├── app.service.ts          # Main application service
│   ├── app.module.ts           # Root application module
│   └── main.ts                 # Application entry point
├── test/                       # E2E tests
├── .env                        # Environment variables (not committed)
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## 📜 Available Scripts

### Application Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with watch
- `npm run dev:start` - Alias for start:dev
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application

### Prisma Scripts

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate:dev` - Create and apply migrations (development)
- `npm run prisma:migrate:deploy` - Apply migrations (production)
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run prisma:format` - Format the Prisma schema
- `npm run prisma:validate` - Validate the Prisma schema

### Testing Scripts

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:debug` - Run tests in debug mode

### Code Quality Scripts

- `npm run lint` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier

## 🗄️ Database Schema

The current schema includes a `User` model:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### Modifying the Schema

1. Edit `prisma/schema.prisma`
2. Create a migration: `npm run prisma:migrate:dev -- --name <migration-name>`
3. Prisma Client will be automatically regenerated

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Application port (default: 5000)
- `DB_HOST` - Database host (optional, for reference)
- `DB_PORT` - Database port (optional, for reference)
- `DB_USERNAME` - Database username (optional, for reference)
- `DB_PASSWORD` - Database password (optional, for reference)
- `DB_NAME` - Database name (optional, for reference)

### Validation

The application uses `class-validator` for DTO validation:

- **CreateUserDto**: Requires `name` (min 2 characters) and `email` (valid email format)
- **UpdateUserDto**: Both fields are optional, but must be valid if provided

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

**Solutions**:

1. Verify PostgreSQL is running:

   ```bash
   # Linux
   sudo systemctl status postgresql

   # macOS
   brew services list
   ```

2. Check connection string in `.env` file
3. Verify database exists: `psql -U postgres -l`

**Error**: `password authentication failed`

**Solutions**:

1. Verify password in `.env` matches PostgreSQL password
2. Reset PostgreSQL password if needed:
   ```bash
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'your_password';
   ```

### Prisma Client Not Found

**Error**: `Cannot find module '../generated/prisma/client'`

**Solution**:

```bash
npm run prisma:generate
```

### Migration Issues

**Error**: Migration conflicts

**Solution**:

```bash
# Reset database (⚠️ WARNING: This deletes all data)
npm run prisma:migrate:reset

# Or create a new migration
npm run prisma:migrate:dev -- --name <migration-name>
```

### Validation Errors

**Error**: `Validation failed`

**Solutions**:

- Ensure request body matches DTO requirements
- Check that `name` is at least 2 characters
- Verify `email` is in valid email format
- Ensure Content-Type header is `application/json`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:

```bash
# Change PORT in .env file
PORT=3000

# Or kill the process using port 5000
# Linux
sudo lsof -ti:5000 | xargs kill -9

# macOS
lsof -ti:5000 | xargs kill -9
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [class-validator Documentation](https://github.com/typestack/class-validator)

## 📝 Example Usage

### Complete User CRUD Flow

```bash
# 1. Create a user
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Response: {"id": 1, "name": "John Doe", "email": "john@example.com", ...}

# 2. Get all users
curl http://localhost:5000/users

# 3. Get user by ID
curl http://localhost:5000/users/1

# 4. Update user
curl -X PATCH http://localhost:5000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'

# 5. Delete user
curl -X DELETE http://localhost:5000/users/1
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:

- Check the [Troubleshooting](#-troubleshooting) section
- Review [NestJS Documentation](https://docs.nestjs.com)
- Review [Prisma Documentation](https://www.prisma.io/docs)

---

**Happy Coding! 🎉**
