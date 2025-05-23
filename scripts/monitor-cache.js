#!/usr/bin/env node

/**
 * This script monitors Redis cache usage and provides metrics
 * Usage: node scripts/monitor-cache.js
 */

const Redis = require('redis');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to Redis
const client = Redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Redis');

    // Print cache statistics every 5 seconds
    setInterval(async () => {
      try {
        // Get Redis info
        const info = await client.info();
        
        // Parse the info string
        const infoObj = info.split('\r\n').reduce((obj, line) => {
          const parts = line.split(':');
          if (parts.length === 2) {
            obj[parts[0]] = parts[1];
          }
          return obj;
        }, {});

        // Extract relevant metrics
        const metrics = {
          usedMemory: infoObj.used_memory_human,
          peakMemory: infoObj.used_memory_peak_human,
          clients: infoObj.connected_clients,
          totalKeys: await getKeyCount(client),
          keysByPrefix: await getKeysByPrefix(client),
          uptime: formatUptime(infoObj.uptime_in_seconds),
        };

        // Clear console and display metrics
        console.clear();
        console.log('=== Redis Cache Monitor ===');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Memory Usage: ${metrics.usedMemory} (Peak: ${metrics.peakMemory})`);
        console.log(`Connected Clients: ${metrics.clients}`);
        console.log(`Total Keys: ${metrics.totalKeys}`);
        console.log(`Uptime: ${metrics.uptime}`);
        
        console.log('\nKeys by Prefix:');
        Object.entries(metrics.keysByPrefix).forEach(([prefix, count]) => {
          console.log(`  ${prefix}: ${count}`);
        });
        
      } catch (error) {
        console.error('Error fetching Redis metrics:', error);
      }
    }, 5000);

  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
}

async function getKeyCount(client) {
  const keys = await client.keys('*');
  return keys.length;
}

async function getKeysByPrefix(client) {
  const keys = await client.keys('*');
  const prefixes = {};
  
  keys.forEach(key => {
    const prefix = key.split(':')[0];
    prefixes[prefix] = (prefixes[prefix] || 0) + 1;
  });
  
  return prefixes;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing Redis connection...');
  await client.quit();
  process.exit(0);
});

main();
