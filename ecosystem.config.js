module.exports = {
    apps: [{
      name: 'nestjs-middleware',
      script: 'dist/main.js',
      instances: 'max',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: '.env',
    }]
  };