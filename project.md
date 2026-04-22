# ERP NestJS - Educational Management System

## Project Overview

**ERP NestJS** is a full-featured Enterprise Resource Planning (ERP) application designed for educational institutions. It provides a comprehensive backend API built with NestJS that manages students, teachers, classes, attendance, fees, and academic subjects. The system is designed to streamline administrative and academic operations for schools, colleges, and other educational institutions.

### Key Features
- **User Management**: Role-based access control (Admin, Teacher, Student)
- **Student Management**: Complete student profiles with admission tracking
- **Teacher Management**: Teacher information and qualifications
- **Class Management**: Educational class organization and structure
- **Subject Management**: Subject assignment to classes and teachers
- **Attendance Tracking**: Daily attendance management with multiple status options
- **Fee Management**: Student fee records with payment tracking
- **Authentication**: JWT-based secure authentication
- **Authorization**: Role-based access guards and decorators
- **API Documentation**: Swagger/OpenAPI integration

---

## Technology Stack

### Backend Framework
- **Runtime**: Node.js
- **Framework**: NestJS 11.0.1 (Progressive TypeScript framework)
- **Language**: TypeScript 5.7.3

### Database & ORM
- **Database**: PostgreSQL
- **ORM**: Prisma 7.7.0
- **Database Adapter**: @prisma/adapter-pg

### Authentication & Security
- **JWT**: @nestjs/jwt 11.0.2
- **Passport**: passport 0.7.0 + passport-jwt 4.0.1
- **Password Hashing**: bcrypt 6.0.0

### Data Validation & Transformation
- **Class Validator**: class-validator 0.14.0
- **Class Transformer**: class-transformer 0.5.1

### Documentation & Testing
- **API Documentation**: @nestjs/swagger 11.2.6
- **Test Framework**: Jest 30.3.0
- **E2E Testing**: Jest + Supertest 7.0.0
- **Code Quality**: ESLint + Prettier

### Configuration
- **Environment Variables**: dotenv 17.3.1
- **Config Management**: @nestjs/config 4.0.3

---

## Project Architecture

### Directory Structure

```
erp-nesjs/
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma         # Prisma data models
│   ├── seed.ts               # Database seeding script
│   └── migrations/           # Database migration history
├── src/
│   ├── main.ts               # Application entry point
│   ├── app.module.ts         # Root application module
│   ├── app.controller.ts     # Root controller
│   ├── app.service.ts        # Root service
│   ├── common/               # Shared utilities and decorators
│   │   ├── decorators/       # Custom decorators (@Public, @Roles)
│   │   ├── dto/              # Shared DTOs (QueryDto)
│   │   ├── enums/            # Shared enums (UserRole, etc.)
│   │   ├── filters/          # Exception filters (HTTPException, PrismaException)
│   │   ├── guards/           # Guard implementations (RolesGuard)
│   │   ├── interceptors/     # Response interceptors
│   │   └── utils/            # Utility functions (pagination, response formatting)
│   ├── modules/              # Feature modules
│   │   ├── auth/             # Authentication module
│   │   ├── users/            # User management module
│   │   ├── student/          # Student management module
│   │   ├── teacher/          # Teacher management module
│   │   ├── class/            # Class management module
│   │   ├── subject/          # Subject management module
│   │   ├── attendance/       # Attendance tracking module
│   │   └── fees/             # Fee management module
│   └── prisma/               # Prisma service configuration
├── test/                      # E2E tests
├── package.json              # NPM dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── nest-cli.json             # NestJS CLI configuration
```

### Module Architecture

Each feature module follows a standard structure:
- **Module File** (`*.module.ts`): Declares module and its imports/exports
- **Controller** (`*.controller.ts`): HTTP request handlers
- **Service** (`*.service.ts`): Business logic implementation
- **DTOs** (`dto/` folder): Data transfer objects for request/response validation
- **Specs** (`*.spec.ts`): Unit tests using Jest

---

## Core Data Models

### User Model
```typescript
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  password   String
  role       UserRole @default(STUDENT)
  firstName  String
  lastName   String
  phone      String?
  isActive   Boolean  @default(true)
  
  studentProfile Student?
  teacherProfile Teacher?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
**Roles**: ADMIN, TEACHER, STUDENT

### Student Model
```typescript
model Student {
  id               String
  admissionNo      String @unique
  rollNo           String?
  dateOfBirth      DateTime
  address          String?
  fatherName       String?
  motherName       String?
  emergencyContact String?
  
  userId String @unique          # Link to User
  classId String                 # Link to SchoolClass
  
  attendance Attendance[]        # One-to-many attendance records
  fees       FeeRecord[]         # One-to-many fee records
}
```

### Teacher Model
```typescript
model Teacher {
  id            String
  employeeId    String @unique
  qualification String
  
  userId String @unique                    # Link to User
  
  subjects       Subject[]                 # Subjects taught
  classTeacherOf SchoolClass?              # Class they manage
}
```

### SchoolClass Model
```typescript
model SchoolClass {
  id      String
  name    String
  section String
  
  students Student[]                      # Students in class
  subjects Subject[]                      # Subjects in class
  teacherId String? @unique               # Class teacher
  classTeacher Teacher?
}
```

### Subject Model
```typescript
model Subject {
  id   String
  name String
  code String @unique
  
  classId String                          # Class subject belongs to
  teacherId String                        # Teacher teaching subject
}
```

### Attendance Model
```typescript
model Attendance {
  id      String
  date    DateTime        @db.Date
  status  AttendanceStatus                # PRESENT, ABSENT, LATE, EXCUSED
  remarks String?
  
  studentId String                        # Student attendance for
}
```

### FeeRecord Model
```typescript
model FeeRecord {
  id       String
  amount   Decimal   @db.Decimal(10, 2)
  dueDate  DateTime
  paidDate DateTime?
  status   FeeStatus                      # PAID, PENDING, OVERDUE, PARTIAL
  
  studentId String                        # Student this fee is for
}
```

---

## Feature Modules

### 1. Auth Module
**Purpose**: User authentication and JWT token management

**Key Features**:
- User login with email and password
- JWT token generation and validation
- Password encryption with bcrypt
- Session management

**Files**:
- `auth.controller.ts`: Login endpoint
- `auth.service.ts`: Token creation and validation logic
- `auth.module.ts`: Auth module setup
- `dto/login.dto.ts`: Login request validation
- `strategy/`: Passport JWT strategy implementation
- `guards/`: JWT authentication guards

### 2. Users Module
**Purpose**: User account management

**Key Features**:
- User CRUD operations
- User profile management
- Role assignment
- Active/Inactive status management

**Files**:
- `users.controller.ts`: User endpoints
- `users.service.ts`: User business logic
- `users.module.ts`: Module configuration

### 3. Student Module
**Purpose**: Student information and profile management

**Key Features**:
- Student record creation and updates
- Student profile retrieval
- Student listing with pagination
- Admission number management
- Parent/Guardian information

**Files**:
- `student.controller.ts`: Student endpoints
- `student.service.ts`: Student operations
- `student.module.ts`: Module setup
- `dto/`: Student request/response DTOs

### 4. Teacher Module
**Purpose**: Teacher information and qualification management

**Key Features**:
- Teacher profile management
- Employee ID tracking
- Qualification records
- Subject assignment

**Files**:
- `teacher.controller.ts`: Teacher endpoints
- `teacher.service.ts`: Teacher operations
- `teacher.module.ts`: Module configuration

### 5. Class Module
**Purpose**: Educational class organization

**Key Features**:
- Class creation and management
- Section management (e.g., A, B, C)
- Class-teacher assignment
- Student enrollment in classes

**Files**:
- `class.controller.ts`: Class endpoints
- `class.service.ts`: Class operations
- `class.module.ts`: Module setup

### 6. Subject Module
**Purpose**: Subject management and assignment

**Key Features**:
- Subject creation and management
- Subject code tracking
- Subject-to-class assignment
- Teacher-subject assignment

**Files**:
- `subject.module.ts`: Module configuration
- `dto/`: Subject DTOs

### 7. Attendance Module
**Purpose**: Student attendance tracking

**Key Features**:
- Daily attendance marking
- Attendance status tracking (Present, Absent, Late, Excused)
- Attendance reports by student
- Attendance history

**Attendance Statuses**:
- `PRESENT`: Student attended
- `ABSENT`: Student did not attend
- `LATE`: Student arrived late
- `EXCUSED`: Authorized absence

**Files**:
- `attendance.controller.ts`: Attendance endpoints
- `attendance.service.ts`: Attendance operations
- `attendance.module.ts`: Module configuration

### 8. Fees Module
**Purpose**: Fee management and payment tracking

**Key Features**:
- Fee record creation
- Payment tracking
- Due date management
- Fee status monitoring

**Fee Statuses**:
- `PAID`: Full payment received
- `PENDING`: Payment awaited
- `OVERDUE`: Payment overdue
- `PARTIAL`: Partial payment received

**Files**:
- `fees.controller.ts`: Fee endpoints
- `fees.service.ts`: Fee operations
- `fees.module.ts`: Module setup

---

## Common Utilities & Features

### Decorators
- **@Public()**: Allow unauthenticated access to endpoints
- **@Roles(...roles)**: Restrict endpoint access by user role

### Guards
- **RolesGuard**: Validates user role permissions
- **JwtAuthGuard**: Validates JWT token authenticity

### Filters
- **HttpExceptionFilter**: Handles and formats HTTP exceptions
- **PrismaExceptionFilter**: Handles Prisma database exceptions

### Interceptors
- **ResponseInterceptor**: Standardizes API response format

### Utilities
- **PaginationUtil**: Handles pagination logic
- **ResponseUtil**: Formats response structures

---

## API Response Format

All API responses follow a standardized format:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    // Response data
  },
  "timestamp": "2026-04-17T10:30:00Z"
}
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequest"
}
```

---

## Authentication & Authorization

### JWT Authentication Flow
1. User logs in with email and password
2. Server validates credentials
3. Server generates JWT token
4. Client includes token in `Authorization` header
5. Server validates token on each request

### Authorization Levels
- **ADMIN**: Full system access
- **TEACHER**: Access to student, class, subject, and attendance management
- **STUDENT**: Read-only access to their own information

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with database credentials

# Run database migrations
npx prisma migrate dev

# Seed database with initial data
npm run seed
```

### Running the Application

```bash
# Development mode (with auto-reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

### Testing

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Run ESLint and auto-fix issues
npm run lint

# Format code with Prettier
npm run format
```

---

## Database Management

### Prisma Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Reset database (destructive)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (GUI for database)
npx prisma studio

# Seed database
npm run seed
```

### Database Migrations

Located in `prisma/migrations/`:
- `0_init/`: Initial schema setup
- `20260326055737_fix_1to1_relation/`: Fixed 1-to-1 relationships
- `20260326062358_init/`: Initial data model definitions

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/erp_nesjs

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=24h

# Server
PORT=3000
NODE_ENV=development
```

### NestJS Configuration

- **Config Module**: Global configuration management
- **Environment-based**: Supports development, staging, and production configurations

---

## API Documentation

API documentation is available via Swagger/OpenAPI integration:

```bash
# After running the application
# Visit: http://localhost:3000/api/docs
```

---

## Project Statistics

- **Modules**: 8 feature modules
- **Models**: 7 data models
- **Controllers**: 8 controllers with multiple endpoints
- **Services**: 8 services with business logic
- **Test Coverage**: Unit and E2E tests for all major features
- **Lines of Code**: ~2500+ lines of production code

---

## Development Patterns

### Service Layer Pattern
Each module contains a service with business logic following the Single Responsibility Principle.

### DTO Validation
All incoming requests are validated using class-validator decorators on DTOs.

### Error Handling
Standardized exception handling through global filters and guards.

### Middleware & Interceptors
Request/response transformation through interceptors and middleware.

---

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access Control**: Guard-based authorization
- **Input Validation**: Request validation with class-validator
- **CORS**: Cross-Origin Resource Sharing configuration
- **Exception Handling**: Global exception filters prevent information leakage

---

## Performance Considerations

- **Database Indexing**: Indexes on frequently queried fields
- **Pagination**: Implemented for list endpoints
- **Lazy Loading**: Selective relation loading in Prisma
- **Caching**: Can be implemented at service level
- **Connection Pooling**: PostgreSQL connection pool configuration

---

## Future Enhancements

- [ ] Frontend application (React/Vue/Angular)
- [ ] Mobile application (React Native/Flutter)
- [ ] Advanced reporting and analytics
- [ ] Notification system (Email/SMS)
- [ ] File upload management
- [ ] Exam and grade management
- [ ] Parent dashboard
- [ ] Online class portal
- [ ] Payment gateway integration
- [ ] Audit logging

---

## Deployment

### Docker Support (Can be added)
- Containerized NestJS application
- PostgreSQL database container
- Docker Compose for multi-container setup

### Deployment Platforms
- Heroku
- AWS (EC2, ECS, Lambda)
- DigitalOcean
- Google Cloud Platform
- Azure
- Railway

---

## Troubleshooting

### Common Issues

**Database Connection Error**
- Verify DATABASE_URL in .env
- Ensure PostgreSQL is running
- Check database credentials

**JWT Token Expired**
- Regenerate token by logging in again
- Adjust JWT_EXPIRATION in .env if needed

**Migration Conflicts**
- Run `npx prisma migrate reset` (development only)
- Check migration files for syntax errors

---

## Contributing Guidelines

1. Create feature branch from `main`
2. Follow TypeScript best practices
3. Add unit tests for new features
4. Run linting and formatting before commit
5. Create pull request with description

---

## License

UNLICENSED - Proprietary software

---

## Support & Contact

For issues, feature requests, or questions:
- Create an issue in the repository
- Contact development team

---

## Version History

- **v0.0.1** (Current): Initial release with core ERP features
  - User authentication and authorization
  - Student, Teacher, and Class management
  - Attendance tracking
  - Fee management
  - Subject management

---

**Last Updated**: April 17, 2026
**Project Status**: Active Development
