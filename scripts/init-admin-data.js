#!/usr/bin/env node

/**
 * This script initializes the application with essential data:
 * - Admin role with permissions
 * - Admin user
 * 
 * Usage: node scripts/init-admin-data.js
 */

const { createConnection } = require('typeorm');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Database connection options from environment
const connectionOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'tms_middleware',
  synchronize: false,
  entities: [
    path.join(__dirname, '../dist/**/*.entity.js')
  ]
};

// Admin user data
const adminUser = {
  email: 'admin@example.com',
  password: 'Admin@123',
  firstName: 'System',
  lastName: 'Admin',
  isActive: true
};

// Admin role data with permissions
const adminRole = {
  name: 'admin',
  description: 'System Administrator with full access',
  permissions: [
    // User management permissions
    'user:create', 'user:read', 'user:update', 'user:delete', 'user:list',
    // Role management permissions
    'role:create', 'role:read', 'role:update', 'role:delete', 'role:list',
    // Order management permissions
    'order:create', 'order:read', 'order:update', 'order:delete', 'order:list',
    // System management permissions
    'system:access', 'system:config', 'system:logs',
    // All possible actions for future modules
    'all:create', 'all:read', 'all:update', 'all:delete'
  ]
};

// Manager role with limited permissions
const managerRole = {
  name: 'manager',
  description: 'Manager with access to most features except system configuration',
  permissions: [
    // User management (limited)
    'user:read', 'user:list',
    // Role management (limited)
    'role:read', 'role:list',
    // Order management (full)
    'order:create', 'order:read', 'order:update', 'order:list',
    // System (limited)
    'system:access'
  ]
};

// Dispatcher role
const dispatcherRole = {
  name: 'dispatcher',
  description: 'Dispatcher responsible for order management',
  permissions: [
    // Order management
    'order:create', 'order:read', 'order:update', 'order:list'
  ]
};

// Driver role
const driverRole = {
  name: 'driver',
  description: 'Driver with access to assigned orders',
  permissions: [
    // Order management (limited)
    'order:read', 'order:update'
  ]
};

// Customer role
const customerRole = {
  name: 'customer',
  description: 'Customer with access to their own orders',
  permissions: [
    // Order management (very limited)
    'order:create', 'order:read'
  ]
};

async function initializeData() {
  let connection;

  try {
    console.log('Connecting to database...');
    connection = await createConnection(connectionOptions);
    console.log('Connected to database successfully');

    // Get repositories
    const roleRepository = connection.getRepository('Role');
    const userRepository = connection.getRepository('User');

    // Create roles if they don't exist
    const roles = [adminRole, managerRole, dispatcherRole, driverRole, customerRole];
    const createdRoles = [];

    for (const roleData of roles) {
      // Check if role exists
      let role = await roleRepository.findOne({ where: { name: roleData.name } });
      
      if (!role) {
        console.log(`Creating ${roleData.name} role...`);
        role = roleRepository.create(roleData);
        role = await roleRepository.save(role);
        console.log(`${roleData.name} role created successfully`);
      } else {
        console.log(`${roleData.name} role already exists, updating permissions...`);
        // Update permissions
        role.permissions = roleData.permissions;
        role = await roleRepository.save(role);
        console.log(`${roleData.name} role updated successfully`);
      }
      
      createdRoles.push(role);
    }

    // Create admin user if doesn't exist
    let adminUserEntity = await userRepository.findOne({ 
      where: { email: adminUser.email },
      relations: ['roles'] 
    });

    if (!adminUserEntity) {
      console.log('Creating admin user...');
      // Hash password
      const hashedPassword = await bcrypt.hash(adminUser.password, 10);
      
      // Create user
      adminUserEntity = userRepository.create({
        ...adminUser,
        password: hashedPassword,
        roles: [createdRoles[0]] // Admin role
      });
      
      adminUserEntity = await userRepository.save(adminUserEntity);
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists, ensuring it has admin role...');
      
      // Make sure admin user has admin role
      const adminRoleEntity = createdRoles[0];
      const hasAdminRole = adminUserEntity.roles.some(role => role.id === adminRoleEntity.id);
      
      if (!hasAdminRole) {
        adminUserEntity.roles = [...adminUserEntity.roles, adminRoleEntity];
        await userRepository.save(adminUserEntity);
        console.log('Added admin role to existing admin user');
      } else {
        console.log('Admin user already has admin role');
      }
    }

    console.log('\n========== INITIALIZATION COMPLETED ==========');
    console.log('The following roles have been created/updated:');
    for (const role of roles) {
      console.log(`- ${role.name}: ${role.description}`);
    }
    
    console.log('\nAdmin user credentials:');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);
    console.log('\nYou can now log in to the system using these credentials.');

  } catch (error) {
    console.error('Error initializing data:', error);
  } finally {
    if (connection) {
      await connection.close();
      console.log('Database connection closed');
    }
  }
}

// Run the initialization
initializeData();