# Production-Level Coding Rules: ERP NestJS

## 1. Financial Data Integrity
- **Precision**: NEVER use native JavaScript `Number` for financial calculations. Use `decimal.js` (Prisma's `Decimal` type).
- **Arithmetic**: All currency math (addition, subtraction, percentage) must be performed using `.plus()`, `.minus()`, `.mul()`, `.div()`.
- **Formatting**: Format currency to strings/numbers only at the final API response layer if necessary, but keep as `Decimal` within service logic.

## 2. Database & Performance
- **Avoid N+1**: Never perform database queries (`findUnique`, `create`, `update`, `delete`) inside a loop (`forEach`, `map`, `for...of`).
- **Bulk Operations**: Use `prisma.model.createMany()` or `prisma.model.updateMany()` for multi-row operations.
- **Transactions**: Any operation that modifies multiple tables or multiple rows in a critical way must be wrapped in a `this.prisma.$transaction()`.
- **Indexing**: Always add indexes to fields used in `@unique` or frequently used in `where` clauses (e.g., `email`, `admissionNo`, `studentId`).

## 3. Architecture & Service Layer
- **Responsibility**: 
  - **Controllers**: Handle HTTP-specific logic, DTO validation, and calling services.
  - **Services**: Contain 100% of the business logic. No raw Prisma calls should happen in Controllers.
- **DTOs**: Every request MUST have a DTO with strict validation using `class-validator`. Every response should ideally be typed.
- **Naming**: Use clear, descriptive names. Avoid generic names like `data` or `item`. Use `studentProfile`, `feeStructure`, etc.

## 4. Error Handling & Security
- **Fail Fast**: Validate data as early as possible.
- **Exceptions**: Use built-in NestJS exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`).
- **Generic Errors**: Never return raw database error strings to the client. Use the `PrismaExceptionFilter` to map codes to human-readable messages.
- **RBAC**: Every controller or method must have a `@Roles()` decorator unless it is explicitly `@Public()`.

## 5. Documentation (Swagger)
- **Metadata**: Every endpoint should have `@ApiOperation`, `@ApiResponse`, and `@ApiTags`.
- **DTOs**: Use `@ApiProperty` on all DTO fields so the frontend team knows the expected types and examples.

## 6. Testing
- **Coverage**: Every service method should have a corresponding unit test in its `.spec.ts` file.
- **Mocks**: Mock the `PrismaService` in unit tests to avoid hitting the real database.

---
**Adherence to these rules is mandatory for Production stability.**
