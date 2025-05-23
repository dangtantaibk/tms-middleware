#!/usr/bin/env node

/**
 * This script generates test data for local development
 * Usage: node scripts/generate-test-data.js
 */

const axios = require('axios');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3500}${process.env.API_PREFIX || '/api'}`;
const JWT_SECRET = process.env.JWT_SECRET || 'your-middleware-secret';

// Admin token for authorization
const adminToken = jwt.sign({
  sub: faker.string.uuid(),
  email: 'admin@example.com',
  role: 'admin',
}, JWT_SECRET, { expiresIn: '1h' });

// HTTP client with admin auth
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
});

// Number of items to generate
const NUM_USERS = 10;
const NUM_ORDERS = 20;

async function generateTestData() {
  console.log('Generating test data...');

  try {
    // 1. Create users
    console.log(`Creating ${NUM_USERS} users...`);
    const users = [];
    
    // Create admin user first
    const adminUser = {
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    };
    
    try {
      const adminResponse = await apiClient.post('/users', adminUser);
      users.push(adminResponse.data);
      console.log(`Created admin user: ${adminUser.email}`);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log(`Admin user already exists: ${adminUser.email}`);
      } else {
        throw error;
      }
    }
    
    // Create regular users
    for (let i = 0; i < NUM_USERS - 1; i++) {
      const userRole = faker.helpers.arrayElement(['manager', 'dispatcher', 'driver', 'customer']);
      const user = {
        email: faker.internet.email().toLowerCase(),
        password: 'password123',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: userRole,
      };
      
      try {
        const response = await apiClient.post('/users', user);
        users.push(response.data);
        console.log(`Created user: ${user.email} (${user.role})`);
      } catch (error) {
        if (error.response && error.response.status === 409) {
          console.log(`User already exists: ${user.email}`);
        } else {
          throw error;
        }
      }
    }

    // 2. Create orders
    console.log(`\nCreating ${NUM_ORDERS} orders...`);
    const customers = users.filter(user => user.role === 'customer');
    const drivers = users.filter(user => user.role === 'driver');
    
    // If no customers were created, add some
    if (customers.length === 0) {
      console.log('No customers found, creating some...');
      for (let i = 0; i < 3; i++) {
        const customer = {
          email: faker.internet.email().toLowerCase(),
          password: 'password123',
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: 'customer',
        };
        
        try {
          const response = await apiClient.post('/users', customer);
          customers.push(response.data);
          console.log(`Created customer: ${customer.email}`);
        } catch (error) {
          if (error.response && error.response.status === 409) {
            console.log(`Customer already exists: ${customer.email}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    for (let i = 0; i < NUM_ORDERS; i++) {
      const customer = faker.helpers.arrayElement(customers);
      const driver = drivers.length > 0 ? faker.helpers.arrayElement(drivers) : null;
      
      const order = {
        customerId: customer.id,
        driverId: driver ? driver.id : undefined,
        pickupAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: 'USA',
          latitude: parseFloat(faker.location.latitude()),
          longitude: parseFloat(faker.location.longitude()),
        },
        deliveryAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: 'USA',
          latitude: parseFloat(faker.location.latitude()),
          longitude: parseFloat(faker.location.longitude()),
        },
      };
      
      try {
        const response = await apiClient.post('/orders', order);
        console.log(`Created order: ${response.data.id}`);
      } catch (error) {
        console.error(`Failed to create order: ${error.message}`);
      }
    }
    
    console.log('\nTest data generation completed!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Test users: (email shown above) / password123');
    
  } catch (error) {
    console.error('Error generating test data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

generateTestData();
