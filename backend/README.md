# AssetFlow — Military Asset Management System (Backend)

## Overview
AssetFlow is a production-grade military asset management system backend built with Node.js, Express.js, and PostgreSQL. It provides comprehensive asset lifecycle management including purchasing, transfers, assignments, expense tracking, and full audit trail.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Joi
- **Security**: helmet, cors, express-rate-limit

## Architecture
```
Modular Monolith (Routes → Middleware → Controllers → Services → Models → PostgreSQL)
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- A PostgreSQL database named `assetflow`

### Installation
```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start development server
npm run dev
```

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@assetflow.mil | password123 |
| Base Commander | mitchell@assetflow.mil | password123 |
| Logistics Officer | brown@assetflow.mil | password123 |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login |
| GET | /api/v1/auth/me | Get current user |
| POST | /api/v1/auth/logout | Logout |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/assets | List assets |
| POST | /api/v1/assets | Create asset |
| GET | /api/v1/assets/:id | Get asset |
| PUT | /api/v1/assets/:id | Update asset |
| DELETE | /api/v1/assets/:id | Delete asset |
| GET | /api/v1/assets/:id/history | Asset audit history |
| GET | /api/v1/assets/:id/assignments | Asset assignments |
| GET | /api/v1/assets/:id/transfers | Asset transfers |
| GET | /api/v1/assets/:id/expenses | Asset expenses |

### Purchases, Transfers, Assignments, Expenses, Transactions, Users, Reports
See full API documentation in the route files.

## Roles & Permissions
- **ADMIN**: Full system access
- **BASE_COMMANDER**: Base-scoped access with approval authority
- **LOGISTICS_OFFICER**: Day-to-day logistics operations

## Security
- JWT-based authentication
- bcrypt password hashing
- Role-based access control
- Base-level data isolation
- Parameterized SQL queries
- Rate limiting
- CORS configuration
- Helmet security headers
