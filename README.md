# 🚀 Routegna - Multi-Fleet Management System

A comprehensive, full-stack fleet management platform built with **TypeScript**, **React**, and **Node.js**. Manage multiple organizations, drivers, vehicles, routes, attendance, and automated payroll calculations in one unified system.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Core Modules](#core-modules)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Database Schema](#database-schema)
- [Development](#development)
- [Testing](#testing)

---

## 🎯 Overview

This is an enterprise-grade fleet management system designed to handle complex multi-organization operations. It provides:

- **Multi-tenant architecture** with organization isolation
- **Role-based access control** (Superadmin, Owner, Admin, Manager, Driver, Employee)
- **Real-time vehicle tracking** and route optimization
- **Automated payroll generation** with 18+ calculation rules
- **Attendance management** with performance metrics
- **Route optimization** using advanced algorithms
- **Service provider management** for third-party logistics

Perfect for companies managing multiple fleets across different regions and organizations.

---

## ✨ Key Features

### 🚗 Fleet Management
- ✅ Multi-vehicle fleet tracking and management
- ✅ Vehicle categorization and capacity management
- ✅ Real-time vehicle availability tracking
- ✅ Maintenance and vehicle request workflows
- ✅ Vehicle-driver assignment and scheduling

### 👥 Workforce Management
- ✅ Driver and employee profile management
- ✅ Department and shift management
- ✅ Service provider integration
- ✅ Multi-role permission system
- ✅ Organization member invitations and onboarding

### 📍 Route & Stop Management
- ✅ Create and optimize routes
- ✅ Intelligent route sequencing with bearing optimization
- ✅ Stop management and assignment
- ✅ Geographic coordinate tracking
- ✅ Integration with clustering algorithm for route optimization

### 📊 Attendance & Tracking
- ✅ Daily attendance record creation
- ✅ Hours worked, trips completed, kilometers covered tracking
- ✅ Fuel and toll expense logging
- ✅ Bulk attendance import
- ✅ Summary metrics by driver and vehicle

### 💰 Automated Payroll System
The system automatically calculates payroll with 18+ rules:

**For Employees:**
- Base salary or hourly pay
- Overtime (1.5x for hours > 160)
- Performance bonus ($5 per trip over 50)
- Punctuality bonus ($100 if 95%+ attendance)
- Efficiency bonus ($50 if >10 km/h avg speed)
- TDS deduction (10%)
- Late penalties ($20/day if <8h)

**For Service Providers:**
- Monthly + per-trip + per-km rates
- Fuel & toll reimbursements
- Quality bonus (>200 trips)
- GST TDS (2%)
- Performance penalties

### 🎨 Advanced Features
- **Real-time notifications** for fleet operations
- **AI-powered assistance** for fleet management
- **KPI dashboards** and analytics
- **Search functionality** across entities
- **Caching layer** for performance optimization
- **Clustering algorithm** for route assignment optimization

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework with modern hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS + Radix UI** - Styling and component library
- **TanStack React Table** - Advanced data tables
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **Better Auth** - Authentication library

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type-safe backend
- **Prisma ORM** - Database abstraction
- **PostgreSQL** - Primary database
- **Redis + BullMQ** - Job queue and caching
- **Better Auth** - Authentication system
- **Socket.io** - Real-time communication
- **Pino** - Structured logging

### DevTools
- **pnpm** - Package manager (monorepo support)
- **Vitest** - Unit testing framework
- **ESLint** - Code linting
- **tsx/ts-node** - TypeScript execution
- **Nodemon** - Development server auto-reload

### Additional Services
- **Google Generative AI** - AI assistance
- **Resend** - Email service
- **PDFKit** - PDF generation

---

## 📂 Project Structure

```
multi-fleet-managment/
├── packages/
│   ├── client/                      # React frontend
│   │   ├── src/
│   │   │   ├── components/          # Reusable components
│   │   │   ├── pages/               # Page components
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── lib/                 # Utilities and helpers
│   │   │   ├── api/                 # API integration
│   │   │   ├── config/              # Configuration files
│   │   │   └── App.jsx              # Root component
│   │   └── vite.config.ts
│   │
│   ├── server/                      # Express backend
│   │   ├── src/
│   │   │   ├── routes/              # API route handlers
│   │   │   │   ├── vehicles.ts
│   │   │   │   ├── drivers.ts
│   │   │   │   ├── routes.ts
│   │   │   │   ├── attendance.ts
│   │   │   │   ├── payroll-periods.ts
│   │   │   │   ├── organization.ts
│   │   │   │   └── ...
│   │   │   ├── middleware/          # Auth & validation middleware
│   │   │   ├── utils/               # Utilities and helpers
│   │   │   ├── db.ts                # Database client
│   │   │   ├── index.ts             # Server entry point
│   │   │   └── lib/                 # Libraries
│   │   ├── prisma/
│   │   │   └── schema.prisma        # Database schema
│   │   └── tsconfig.json
│   │
│   └── shared/                      # Shared types & utilities
│       └── src/
│           ├── permissions.ts       # Role-based permissions
│           ├── types/               # Shared types
│           └── utils/               # Shared utilities
│
├── clustering/                      # Python route optimization
│   ├── src/
│   │   ├── main.py                  # FastAPI server
│   │   ├── assign_routes.py         # Route assignment algorithm
│   │   └── dependencies.py
│   └── requirements.txt
│
├── docs/                            # Documentation
│   ├── api/                         # API documentation
│   ├── DEVELOPMENT.md
│   └── ...
│
└── package.json                     # Root workspace config
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **pnpm** 10+
- **PostgreSQL** 12+
- **Redis** (for job queue and caching)
- **Python** 3.8+ (for clustering microservice)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kidusm001/routegna.git
cd routegna
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment variables**

Create `.env.local` files in both `packages/server` and `packages/client`:

**packages/server/.env.local**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fleet_db"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
AUTH_SECRET="your-secret-key"
BETTER_AUTH_SECRET="your-better-auth-secret"

# Services
GOOGLE_API_KEY="your-google-api-key"
RESEND_API_KEY="your-resend-api-key"

# Logging
LOG_LEVEL="error"
ENABLE_HTTP_LOGGING="false"

# Node
NODE_ENV="development"
```

**packages/client/.env.local**
```bash
VITE_API_URL="http://localhost:5000/api"
VITE_AUTH_URL="http://localhost:5000"
```

4. **Setup database**
```bash
# Generate Prisma client
cd packages/server
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

5. **Start development servers**
```bash
# From root directory
pnpm dev

# This will start:
# - Frontend: http://localhost:5173 (Vite)
# - Backend: http://localhost:5000 (Express)
```

---

## 📦 Core Modules

### 🚗 Vehicles Module
**File:** `packages/server/src/routes/vehicles.ts`

Manages vehicle creation, updates, categorization, and soft deletion.

**Key Endpoints:**
- `GET /vehicles` - List vehicles
- `POST /vehicles` - Create vehicle
- `PUT /vehicles/:id` - Update vehicle
- `DELETE /vehicles/:id` - Soft delete vehicle
- `GET /vehicles/:id` - Get vehicle details

**Features:**
- Vehicle categorization (capacity, type)
- Driver assignment
- Maintenance tracking
- Service provider integration

---

### 👨‍💼 Drivers Module
**File:** `packages/server/src/routes/drivers.ts`

Manages driver profiles, licenses, salary, and assignments.

**Key Endpoints:**
- `GET /drivers` - List drivers
- `POST /drivers` - Create driver
- `PUT /drivers/:id` - Update driver
- `GET /drivers/:id/schedule` - Get driver's schedule
- `GET /drivers/:id/payroll-summary` - Get earnings summary

**Features:**
- License number validation
- Salary and hourly rate management
- Performance rating system
- Vehicle assignment tracking

---

### 📍 Routes Module
**File:** `packages/server/src/routes/routes.ts`

Manages transportation routes with stops and assignments.

**Key Endpoints:**
- `GET /routes` - List routes
- `POST /routes` - Create route
- `PUT /routes/:id` - Update route
- `POST /routes/:id/assign-employees` - Assign employees to route

**Features:**
- Multi-stop route management
- Employee assignment
- Route status tracking
- Vehicle capacity validation

---

### 📋 Attendance Module
**File:** `packages/server/src/routes/attendance.ts`

Tracks daily work records including hours, trips, and expenses.

**Key Endpoints:**
- `GET /attendance` - List attendance records
- `POST /attendance` - Create attendance record
- `PUT /attendance/:id` - Update record
- `GET /attendance/summary/driver/:driverId` - Driver summary
- `GET /attendance/summary/vehicle/:vehicleId` - Vehicle summary
- `POST /attendance/bulk` - Bulk import

**Data Tracked:**
- Hours worked
- Trips completed
- Kilometers covered
- Fuel and toll costs
- Late penalties

---

### 💰 Payroll Module
**File:** `packages/server/src/routes/payroll-periods.ts`

Generates automated payroll with 18+ calculation rules.

**Key Endpoints:**
- `GET /payroll-periods` - List payroll periods
- `POST /payroll-periods` - Create period
- `POST /payroll-periods/:id/generate` - Generate payroll
- `GET /payroll-periods/:id/details` - Get payroll breakdown
- `PUT /payroll-periods/:id/approve` - Approve payroll
- `PUT /payroll-periods/:id/process` - Process payment

**Calculations:**
- Base salary/hourly pay
- Overtime (1.5x multiplier)
- Performance bonuses
- Punctuality bonuses
- Efficiency bonuses
- Tax deductions (TDS)
- Late penalties

---

### 🏢 Organization Module
**File:** `packages/server/src/routes/organization.ts`

Multi-tenant organization management with isolation.

**Key Endpoints:**
- `GET /organization/my-organizations` - List user's organizations
- `POST /organization` - Create organization
- `PUT /organization/:id` - Update organization
- `POST /organization/:id/invite-member` - Invite member
- `GET /organization/:id/members` - List members

**Features:**
- Organization creation and management
- Member role assignment
- Invitation workflows
- Organization-scoped data isolation

---

### 📊 Additional Modules

| Module | File | Purpose |
|--------|------|---------|
| **Stops** | `stops.ts` | Manage route stops |
| **Departments** | `departments.ts` | Department management |
| **Shifts** | `shifts.ts` | Work shift scheduling |
| **Service Providers** | `service-providers.ts` | Third-party logistics |
| **Notifications** | `notifications.ts` | Real-time alerts |
| **AI Assistant** | `ai.ts` | Google AI integration |
| **Search** | `search.ts` | Cross-entity search |
| **KPI Dashboard** | `payroll-kpi.ts` | Analytics & metrics |

---

## 🔌 API Endpoints

### Authentication
```
POST   /auth/signup              - Register new user
POST   /auth/login               - Login user
POST   /auth/logout              - Logout user
GET    /auth/session             - Get current session
```

### Vehicles
```
GET    /vehicles                 - List all vehicles
POST   /vehicles                 - Create vehicle
GET    /vehicles/:id             - Get vehicle details
PUT    /vehicles/:id             - Update vehicle
DELETE /vehicles/:id             - Delete vehicle
```

### Drivers
```
GET    /drivers                  - List all drivers
POST   /drivers                  - Create driver
GET    /drivers/:id              - Get driver details
PUT    /drivers/:id              - Update driver
DELETE /drivers/:id              - Delete driver
GET    /drivers/:id/schedule     - Get schedule
```

### Routes
```
GET    /routes                   - List routes
POST   /routes                   - Create route
GET    /routes/:id               - Get route details
PUT    /routes/:id               - Update route
DELETE /routes/:id               - Delete route
POST   /routes/:id/assign        - Assign employees
```

### Attendance
```
GET    /attendance               - List records
POST   /attendance               - Create record
PUT    /attendance/:id           - Update record
GET    /attendance/summary/*     - Get summaries
POST   /attendance/bulk          - Bulk import
```

### Payroll
```
GET    /payroll-periods          - List periods
POST   /payroll-periods          - Create period
POST   /payroll-periods/:id/generate - Generate payroll
GET    /payroll-periods/:id      - Get details
PUT    /payroll-periods/:id/approve - Approve
```

### Organization
```
GET    /organization             - List organizations
POST   /organization             - Create organization
GET    /organization/:id/members - Get members
POST   /organization/:id/invite  - Invite member
```

---

## 🔐 Authentication & Authorization

### Authentication
- **System:** Better Auth with cookie-based sessions
- **Location:** `packages/server/src/middleware/auth.ts`
- **Features:**
  - Secure password hashing with bcrypt
  - Session-based authentication
  - Cookie management
  - CORS support

### Authorization
- **Pattern:** Role-Based Access Control (RBAC)
- **Roles:**
  - **Superadmin** - Full system access
  - **Owner** - Organization owner
  - **Admin** - Organization administrator
  - **Manager** - Department/team manager
  - **Driver** - Driver portal access
  - **Employee** - Employee portal access
  - **Member** - Basic organization member

- **Permissions:** Defined in `packages/shared/src/permissions.ts`
  ```typescript
  admin: {
    vehicle: ["create", "read", "update", "delete", "assign"],
    driver: ["create", "read", "update", "delete", "assign"],
    payroll: ["create", "read", "update", "process", "approve"],
    // ... more permissions
  }
  ```

### Organization Isolation
- All data queries automatically filtered by `activeOrganizationId`
- Multi-tenant support with complete data isolation
- Cross-organization access prevented

---

## 📊 Database Schema

**Key Models:**

```prisma
// User & Organization
User
  - id, email, name, password
  - organizations (M-M via UserOrganization)
  - role, createdAt, updatedAt

Organization
  - id, name, description
  - members, vehicles, drivers, routes
  - createdAt, updatedAt

// Fleet
Vehicle
  - id, plateNumber, model, make, type
  - categoryId, driverId, organizationId
  - dailyRate, status, deleted
  - routes, attendanceRecords, payrollReports

Driver
  - id, name, email, licenseNumber
  - baseSalary, hourlyRate, organizationId
  - assignedVehicle, attendanceRecords
  - payrollReports, payrollEntries

VehicleCategory
  - id, name, capacity, description

// Operations
Route
  - id, name, organizationId
  - stops, assignedEmployees, vehicle
  - status, createdAt, updatedAt

Stop
  - id, routeId, location
  - sequence, status

AttendanceRecord
  - id, driverId, vehicleId, organizationId, date
  - hoursWorked, tripsCompleted, kmsCovered
  - fuelCost, tollCost

// Payroll
PayrollPeriod
  - id, organizationId, startDate, endDate
  - status, generatedAt, approvedAt

PayrollEntry
  - id, driverId, vehicleId, periodId
  - baseSalary, overtime, bonuses
  - deductions, netPay, status

PayrollReport
  - id, periodId, organizationId
  - totalGross, totalDeductions, totalNet
  - generatedAt, approvedAt
```

---

## 💻 Development

### Available Commands

```bash
# Start development servers (client + server)
pnpm dev

# Build all packages
pnpm build

# Start production servers
pnpm start

# Run tests
pnpm test

# Watch tests
pnpm test:watch

# Lint code
pnpm lint

# Fix lint issues
pnpm lint:fix

# Generate Prisma client
cd packages/server && npx prisma generate

# Run migrations
cd packages/server && npx prisma migrate dev

# Open Prisma Studio
cd packages/server && npx prisma studio

# List users (client)
cd packages/client && pnpm list-users
```

### Code Style Guidelines

- **TypeScript:** Strict mode, ES2020 (server) / ES2022 (client)
- **Naming:** camelCase (vars/functions), PascalCase (types), SCREAMING_SNAKE_CASE (constants)
- **Modules:** CommonJS (server), ESNext (client)
- **Files:** kebab-case naming
- **Error Handling:** Try/catch with typed errors
- **Comments:** JSDoc for public APIs

### Environment Variables

**Server** (`packages/server/.env.local`)
```bash
DATABASE_URL                    # PostgreSQL connection string
REDIS_URL                       # Redis connection URL
NODE_ENV                        # development/production
LOG_LEVEL                       # error/warn/info/debug
ENABLE_HTTP_LOGGING             # true/false
AUTH_SECRET                     # Auth secret key
GOOGLE_API_KEY                  # Google AI API key
RESEND_API_KEY                  # Email service API key
```

**Client** (`packages/client/.env.local`)
```bash
VITE_API_URL                    # Backend API URL
VITE_AUTH_URL                   # Auth server URL
```

---

## 🧪 Testing

### Test Framework
- **Vitest** for unit testing
- **Supertest** for API testing
- **jest-mock-extended** for mocking

### Running Tests

```bash
# Run all server tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
npx vitest run src/routes/vehicles.test.ts

# Run with coverage
npx vitest run --coverage
```

### Test Structure
```
packages/server/
├── src/
│   ├── routes/
│   │   ├── vehicles.ts
│   │   └── vehicles.test.ts
│   └── utils/
│       ├── payrollCalculations.ts
│       └── payrollCalculations.test.ts
```

### Testing Guide
See **TESTING_GUIDE.md** and **ATTENDANCE_TEST_GUIDE.md** for comprehensive testing documentation.

---

## 🗂️ Route Optimization (Clustering)

The system includes a Python microservice for intelligent route optimization.

**Location:** `clustering/` directory

**Features:**
- Google OR-Tools route optimization
- Vehicle capacity constraints
- Geographic bearing consideration
- Haversine distance calculation

**API:**
```
POST /clustering                 - Assign routes to shuttles
GET  /route-map                  - View optimized routes
```

See `clustering/README.md` for detailed documentation.

---

## 📈 Performance Optimization

### Caching Layer
- Redis integration via BullMQ
- Query result caching
- Session storage
- Job queue for async tasks

### Database Optimization
- Prisma ORM with query optimization
- Indexed foreign keys
- Lazy loading relationships
- Batch operations support

### Frontend Optimization
- Code splitting with React.lazy()
- Vite build optimization
- Suspense boundaries
- Memoization with React.memo

---

## 🚨 Logging

The system includes structured logging with Pino.

**Configuration:**
```bash
# Minimal logging (development default)
LOG_LEVEL=error

# Enable HTTP logging
ENABLE_HTTP_LOGGING=true

# HTTP logging levels
HTTP_LOG_LEVEL=simple|detailed|verbose
```

---

## 📚 Documentation

Comprehensive documentation available in `/docs`:

- **API Documentation**
  - `api/vehicles.md` - Vehicle management
  - `api/drivers.md` - Driver management
  - `api/attendance.md` - Attendance tracking
  - `api/payroll-periods.md` - Payroll generation

- **Guides**
  - `DEVELOPMENT.md` - Development setup
  - `TESTING_GUIDE.md` - Testing procedures
  - `ATTENDANCE_TEST_GUIDE.md` - Attendance testing

- **Architecture**
  - `organization-scoped-patterns.md` - Multi-tenant patterns
  - `organization-client.md` - Client integration

---

## 🤝 Contributing

1. **Create a feature branch** from `develop`
2. **Follow code style guidelines** (see Development section)
3. **Write tests** for new features
4. **Update documentation** as needed
5. **Submit a pull request** with detailed description

---

## 📝 License

ISC License - See LICENSE file for details

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Verify PostgreSQL is running
psql -h localhost -U user -d fleet_db

# Check connection string in .env.local
# Verify DATABASE_URL format
```

### Redis Connection Issues
```bash
# Verify Redis is running
redis-cli ping

# Check REDIS_URL in .env.local
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
cd packages/server && npx prisma generate
```

### Tests Failing
```bash
# Run with verbose output
npx vitest run --reporter=verbose

# Check test logs and stack traces
pnpm test 2>&1 | less
```

---

## 📞 Support

For issues, questions, or suggestions:
1. Check existing documentation in `/docs`
2. Review API documentation for endpoint details
3. Check test files for usage examples
4. Open an issue on GitHub

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Repository:** https://github.com/kidusm001/routegna
**Project Name:** Routegna
