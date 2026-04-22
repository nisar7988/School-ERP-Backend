# ERP NestJS - Educational Management System

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  A comprehensive Enterprise Resource Planning (ERP) system for educational institutions built with NestJS.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/erp-nesjs" target="_blank"><img src="https://img.shields.io/npm/v/erp-nesjs.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/erp-nesjs" target="_blank"><img src="https://img.shields.io/npm/l/erp-nesjs.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/erp-nesjs" target="_blank"><img src="https://img.shields.io/npm/dm/erp-nesjs.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/your-username/erp-nesjs/actions" target="_blank"><img src="https://github.com/your-username/erp-nesjs/workflows/CI/badge.svg" alt="CI" /></a>
  <a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
</p>

## Description

**ERP NestJS** is a full-featured Enterprise Resource Planning (ERP) application designed specifically for educational institutions. It provides a robust backend API built with NestJS that manages students, teachers, classes, attendance, fees, and academic subjects. The system is engineered to streamline administrative and academic operations for schools, colleges, and other educational institutions, offering role-based access control and comprehensive data management capabilities.

## Features

- **User Management**: Secure role-based access control (Admin, Teacher, Student)
- **Student Management**: Complete student profiles with admission tracking and enrollment management
- **Teacher Management**: Teacher information, qualifications, and subject assignments
- **Class Management**: Educational class organization and structure management
- **Subject Management**: Subject assignment to classes and teachers
- **Attendance Tracking**: Daily attendance management with multiple status options
- **Fee Management**: Student fee records with payment tracking and financial reporting
- **Authentication**: JWT-based secure authentication system
- **Authorization**: Role-based access guards and custom decorators
- **API Documentation**: Integrated Swagger/OpenAPI documentation
- **Database Management**: Prisma ORM with PostgreSQL support
- **Data Validation**: Comprehensive input validation using class-validator
- **Response Formatting**: Consistent API response structure with custom interceptors

## Technology Stack

### Backend Framework
- **Runtime**: Node.js
- **Framework**: NestJS 11.0.1
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

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/erp-nesjs.git
cd erp-nesjs
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and configure the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/erp_db"
JWT_SECRET="your-jwt-secret-key"
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database with initial data
npm run seed
```

## Running the Application

### Development
```bash
# Start in development mode with hot reload
npm run start:dev
```

### Production
```bash
# Build the application
npm run build

# Start the production server
npm run start:prod
```

The application will be available at `http://localhost:3000`.

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:
`http://localhost:3000/api`

The documentation provides interactive endpoints for all available API routes, including request/response examples and authentication requirements.

## Database

This project uses Prisma as the ORM with PostgreSQL as the database. The database schema is defined in `prisma/schema.prisma`.

### Database Commands

```bash
# View database in Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name your-migration-name

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

## Deployment

For production deployment, ensure you have:

1. Set up a PostgreSQL database
2. Configured environment variables
3. Built the application with `npm run build`
4. Use a process manager like PM2 for production

Refer to the [NestJS Deployment Documentation](https://docs.nestjs.com/deployment) for detailed deployment guides.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## Code Quality

```bash
# Lint the code
npm run lint

# Format code with Prettier
npm run format
```

## License

This project is proprietary and not licensed for public use.

## Support

For support, please contact the development team or create an issue in the repository.

## Stay in Touch

- Project Repository: [GitHub](https://github.com/your-username/erp-nesjs)
- NestJS Framework: [https://nestjs.com](https://nestjs.com)
- NestJS Documentation: [https://docs.nestjs.com](https://docs.nestjs.com)
