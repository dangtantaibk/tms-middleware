# Middleware API Testing Guide

This document provides guidance on testing the TMS Middleware API using common HTTP client tools.

## Prerequisites

- The middleware service is running (locally or in Docker)
- You have a valid JWT token (can be generated using `scripts/generate-test-token.js`)

## Common Endpoints

### Authentication

```
# Login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}

# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

# Change password (requires authentication)
POST /api/auth/change-password
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

### Users

```
# Get all users (admin only)
GET /api/users

# Get user by ID
GET /api/users/:id

# Create user (admin only)
POST /api/users
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "customer"
}

# Update user (admin only)
PATCH /api/users/:id
{
  "firstName": "Updated",
  "lastName": "Name",
  "role": "manager"
}

# Delete user (admin only)
DELETE /api/users/:id
```

### Orders

```
# Get all orders
GET /api/orders

# Get order by ID
GET /api/orders/:id

# Get orders by customer
GET /api/orders/customer/:customerId

# Create order
POST /api/orders
{
  "customerId": "uuid-here",
  "pickupAddress": {
    "street": "123 Pickup St",
    "city": "Pickup City",
    "state": "PS",
    "zipCode": "12345",
    "country": "USA"
  },
  "deliveryAddress": {
    "street": "456 Delivery St",
    "city": "Delivery City",
    "state": "DS",
    "zipCode": "67890",
    "country": "USA"
  }
}

# Update order status
PATCH /api/orders/:id/status
{
  "status": "in_transit"
}

# Update payment status
PATCH /api/orders/:id/payment
{
  "paymentStatus": "paid"
}
```

### Health Checks

```
# Basic health check
GET /api/health

# Detailed health check
GET /api/health/detailed
```

## Testing with cURL

### Login and save token

```bash
TOKEN=$(curl -s -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.accessToken')

echo $TOKEN
```

### Make authenticated request

```bash
curl -X GET http://localhost:3500/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## Testing with Postman

1. Set up an environment variable for the token
2. Create a collection for TMS Middleware
3. Add a pre-request script to the collection to automatically add the token:

```javascript
pm.request.headers.add({
  key: 'Authorization',
  value: 'Bearer ' + pm.environment.get('token')
});
```
