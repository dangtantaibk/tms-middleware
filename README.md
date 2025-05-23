# TMS Middleware Service

This middleware service acts as an API gateway between clients and the Transportation Management System (TMS) backend, with a focus on users, authentication, and role management. It includes Redis caching to improve performance.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **API Gateway**: Proxies requests to the TMS backend
- **Caching**: Redis-based caching for improved performance
- **Error Handling**: Consistent error responses
- **Logging & Monitoring**: Built-in request logging
- **Message Broker**: Kafka integration for event-driven architecture

## Technology Stack

- **NestJS**: Progressive Node.js framework
- **TypeORM**: ORM for database interaction
- **PostgreSQL**: Primary database
- **Redis**: Caching layer
- **Kafka**: Message broker for event handling
- **Docker**: Containerization

## Project Structure

The project follows a modular architecture:

```
src/
│
├── main.ts                     # Entry point
├── app.module.ts               # Root module
│
├── config/                     # Configuration
│
├── shared/                     # Shared modules/utilities
│   ├── dto/
│   ├── interceptors/
│   ├── filters/
│   ├── guards/
│   └── decorators/
│
├── common/                     # Constants, Enums, Interfaces
│
├── modules/                    # Business logic modules
│   ├── user/
│   ├── auth/
│   └── order/
│
└── infrastructure/             # External integrations
    ├── database/
    ├── cache/
    ├── http/
    └── kafka/
```

## Installation

```bash
# Install dependencies
npm install
```

## Running the app

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```

## Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# App
PORT=3020
NODE_ENV=development
API_PREFIX=/api

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=tms_middleware

# JWT
JWT_SECRET=your-middleware-secret
JWT_EXPIRATION=1d

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=3600
```

## API Documentation

The API documentation is available at `/api/docs` when the application is running.

## Cache Structure

The middleware uses the following cache key structure:

```
users:${userId}           # User details
users:email:${email}      # User lookup by email
roles:${roleId}           # Role details
permissions:${userId}     # User permissions
auth:token:${token}       # Token validation cache
```
