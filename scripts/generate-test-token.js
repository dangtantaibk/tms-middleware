#!/usr/bin/env node

/**
 * This script generates a JWT token for testing purposes.
 * Usage: node scripts/generate-test-token.js
 */

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { UserRole } = require('../dist/common/enums/app.enums');

// Load environment variables
dotenv.config();

// Default secret from .env or use a test secret
const secret = process.env.JWT_SECRET || 'test-secret';
const expiresIn = process.env.JWT_EXPIRATION || '1d';

// Create a sample payload
const payload = {
  sub: '550e8400-e29b-41d4-a716-446655440000', // Example UUID
  email: 'admin@example.com',
  role: UserRole.ADMIN,
};

// Sign the token
const token = jwt.sign(payload, secret, { expiresIn });

console.log('Generated JWT Token:');
console.log(token);
console.log('\nPayload:');
console.log(payload);
console.log('\nUse this token in Authorization header:');
console.log(`Bearer ${token}`);
