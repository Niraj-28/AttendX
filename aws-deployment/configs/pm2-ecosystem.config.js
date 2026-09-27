// PM2 Ecosystem Configuration for AttendX Backend
// Save this as: ecosystem.config.js in backend root

module.exports = {
  apps: [{
    name: 'attendx-backend',
    script: './src/server.js',
    
    // Instances
    instances: 1,  // Single instance for t2.micro
    exec_mode: 'fork',  // Use 'cluster' for multiple instances
    
    // Auto-restart configuration
    autorestart: true,
    watch: false,  // Disable in production (use CI/CD instead)
    max_memory_restart: '500M',  // Restart if memory exceeds 500MB
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,  // Prefix logs with time
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced features
    min_uptime: '10s',  // Min uptime before considered started
    max_restarts: 10,  // Max restarts within 1 minute
    
    // Graceful shutdown
    kill_timeout: 5000,  // Time to wait for graceful shutdown
    wait_ready: true,  // Wait for app to emit 'ready' event
    listen_timeout: 10000,
    
    // Monitoring
    instance_var: 'INSTANCE_ID',
    
    // Post-deployment
    post_update: ['npm install', 'echo "Deployment complete"']
  }]
};

// Usage:
// pm2 start ecosystem.config.js --env production
// pm2 restart attendx-backend
// pm2 stop attendx-backend
// pm2 delete attendx-backend
// pm2 logs attendx-backend
// pm2 monit
