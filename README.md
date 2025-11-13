# Crew Fireworks - Backend API

Express.js REST API for the Crew Fireworks e-commerce platform, built with TypeScript, Prisma ORM, and PostgreSQL.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## 🛠 Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **Payment Processing**: Helcim SDK
- **Email**: Nodemailer with IMAP support
- **Package Manager**: npm or bun

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **bun** - Comes with Node.js
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ha-rcacheC0/ecommerce-shop-backend.git
cd ecommerce-shop-backend
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual values (see [Environment Variables](#environment-variables) section below).

### 4. Set Up the Database

#### Create a PostgreSQL Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE crew_fireworks;

# Create user (optional, if not using default postgres user)
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE crew_fireworks TO your_user;

# Exit psql
\q
```

#### Update DATABASE_URL in .env

```
DATABASE_URL="postgres://your_user:your_password@localhost:5432/crew_fireworks"
```

#### Run Database Migrations

```bash
npm run db:migrate:dev
```

This will:
- Apply all Prisma migrations to create the database schema
- Generate the Prisma Client for TypeScript types

#### (Optional) Seed the Database

```bash
npm run db:seed:dev
```

### 5. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## 🔐 Environment Variables

Create a `.env` file in the root directory with these variables:

### Required Variables

```env
# Database
DATABASE_URL="postgres://postgres:password@localhost:5432/crew-fireworks"

# Application
NODE_ENV="development"
PORT=4000

# Authentication
JWT_SECRET="your-64-character-secret-key-here"
SESSION_SECRET="your-session-secret"

# Payment Processing
HELCIM_API_TOKEN="your-helcim-production-token"
TESTING_HELCIM_API_TOKEN="your-helcim-test-token"

# Email Configuration
SEND_EMAIL_USER_EMAIL="your-email@example.com"
SEND_EMAIL_USER_PASS="your-email-password"
SEND_EMAIL_STMP_HOST="smtp.titan.email"
SEND_EMAIL_WAREHOUSE_EMAIL="warehouse@example.com"
SEND_EMAIL_INVENTORY_EMAIL="inventory@example.com"
```

### Generating JWT_SECRET

Generate a secure random key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Email Configuration

The application uses SMTP for sending order confirmation and notification emails. You'll need:
- A valid email account with SMTP access
- SMTP server hostname (e.g., smtp.gmail.com, smtp.titan.email)
- Email credentials (username/password or app-specific password)

### Helcim Payment Integration

To process payments, you need:
1. A Helcim account - [Sign up](https://www.helcim.com/)
2. API tokens from your Helcim dashboard
   - Production token for live transactions
   - Test token for development/testing

## 🗄 Database Setup

### Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name description_of_changes

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# View current database status
npx prisma migrate status
```

### Database Schema

The database includes these main models:
- **User** & **UserProfile**: User authentication and profile data
- **Product**: Fireworks products catalog
- **ProductVariant**: Apparel size/color combinations
- **Show**: Fireworks show packages
- **Cart** & **CartProduct**: Shopping cart management
- **PurchaseRecord** & **PurchaseItem**: Order history
- **Address**: Shipping and billing addresses
- **ApprovedTerminal**: Shipping terminals for wholesale orders

## 💻 Development

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Build TypeScript for production
npm run build

# Start production server
npm start

# Run database migrations
npm run db:migrate:dev

# Seed the database
npm run db:seed:dev

# Generate Prisma Client
npm run db:generate

# Deploy migrations to production
npm run db:migrate:deploy

# Code quality commands
npm run lint           # Check for linting errors
npm run lint:fix       # Auto-fix linting errors
npm run type-check     # Run TypeScript type checking
```

### Code Quality & Pre-Commit Hooks

This project uses **Husky** and **lint-staged** to automatically enforce code quality standards.

#### What Runs Automatically

Every time you commit code, the following checks run automatically:

1. **ESLint** - Lints all staged `.ts` files and auto-fixes issues
   - Warns about `any` types, unused variables, and console.logs
   - Enforces consistent code style
   - Auto-fixes formatting where possible

If the linting fails, your commit will be blocked until you fix the errors.

#### Manual Code Quality Checks

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix

# Run TypeScript type checking
npm run type-check
```

#### Bypassing Pre-Commit Hooks

**⚠️ Not recommended**, but if you absolutely need to bypass the hooks:

```bash
git commit --no-verify -m "your message"
```

Only use this in emergencies. Your code should pass all checks before committing.

#### ESLint Configuration

The ESLint configuration is in [`.eslintrc.json`](./.eslintrc.json). Key rules:
- Warns on `any` types and non-null assertions
- Allows `console.warn`, `console.error`, `console.info`
- Enforces `===` over `==`
- Requires curly braces for all control statements
- Allows `declare global` namespace for Express type augmentation

See [ESLINT_SETUP.md](./ESLINT_SETUP.md) for detailed ESLint documentation.

### Development Workflow

1. **Make code changes** in `src/` directory
2. **Server auto-reloads** (nodemon watches for changes)
3. **Update database schema** in `prisma/schema.prisma` if needed
4. **Create migration**: `npx prisma migrate dev --name your_change`
5. **Test endpoints** using tools like Postman or curl

## 📚 API Documentation

### Base URL

- Development: `http://localhost:4000/api`
- Production: `https://crew-fireworks-api.fly.dev/api`

### Main Endpoints

#### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (requires auth)

#### Products
- `GET /api/products` - List all products (with pagination & filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin only)
- `PATCH /api/products/:id` - Update product (admin only)

#### Apparel
- `GET /api/apparel` - List apparel products
- `GET /api/apparel/:id` - Get apparel product with variants

#### Shows
- `GET /api/shows` - List fireworks shows
- `GET /api/shows/:id` - Get show details with included products

#### Cart
- `GET /api/cart/:cartId` - Get cart contents
- `POST /api/cart/:cartId/items` - Add item to cart
- `PATCH /api/cart/:cartId/items/:itemId` - Update cart item quantity
- `DELETE /api/cart/:cartId/items/:itemId` - Remove item from cart

#### Purchase
- `POST /api/cart/:cartId/purchase` - Create Helcim checkout token
- `POST /api/purchase/complete` - Complete purchase and create order

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer your-jwt-token-here
```

## 📁 Project Structure

```
ecommerce-shop-backend/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── migrations/        # Database migration history
│   └── seed.ts           # Database seeding script
├── src/
│   ├── routes/           # API route handlers
│   │   ├── user.router.ts
│   │   ├── products.router.ts
│   │   ├── apparel.router.ts
│   │   ├── shows.router.ts
│   │   ├── cart.router.ts
│   │   ├── purchase.router.ts
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   ├── email-utils.ts
│   │   ├── auth.ts
│   │   └── ...
│   └── index.ts          # Application entry point
├── .env                  # Environment variables (DO NOT COMMIT)
├── .env.example          # Example environment variables
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🐛 Troubleshooting

### Port Already in Use

If port 4000 is already in use:
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=4001
```

### Database Connection Errors

**Error: "database does not exist"**
```bash
# Create the database
createdb crew_fireworks
```

**Error: "password authentication failed"**
- Check your DATABASE_URL credentials
- Ensure PostgreSQL is running: `pg_isready`
- Verify user permissions in PostgreSQL

### Prisma Errors

**Error: "Prisma schema not found"**
```bash
# Regenerate Prisma Client
npx prisma generate
```

**Error: "Migration failed"**
```bash
# Reset database (⚠️ deletes data)
npx prisma migrate reset

# Or manually fix conflicts in migrations
```

### TypeScript Errors

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🚢 Deployment

The application is deployed on Fly.io. To deploy:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
fly auth login

# Deploy
fly deploy
```

### Environment Variables on Fly.io

Set secrets using Fly CLI:
```bash
fly secrets set DATABASE_URL="your-production-db-url"
fly secrets set JWT_SECRET="your-production-jwt-secret"
fly secrets set HELCIM_API_TOKEN="your-production-token"
# ... add all other secrets
```

## 📝 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Helcim API Docs](https://docs.helcim.com/)
- [Fly.io Deployment Guide](https://fly.io/docs/)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests (when available)
4. Commit with descriptive messages
5. Push and create a pull request

## 📄 License

See LICENSE file for details.

## 👥 Support

For questions or issues:
- Create an issue in the GitHub repository
- Contact the development team
