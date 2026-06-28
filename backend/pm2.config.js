module.exports = {
  apps: [
    {
      name: 'lovewish',
      script: 'app.js',
      instances: 1,        // SQLite does not support multiple writers — keep at 1
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
