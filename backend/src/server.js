const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
  } catch (err) {
    logger.warn('Database connection test failed on startup. Server will still run to accept requests.', err);
  }

  app.listen(env.port, () => {
    logger.info(`AssetFlow server running on port ${env.port} [${env.nodeEnv}]`);
    logger.info(`API base URL: http://localhost:${env.port}/api/v1`);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', reason instanceof Error ? reason : { reason });
  process.exit(1);
});

startServer();
