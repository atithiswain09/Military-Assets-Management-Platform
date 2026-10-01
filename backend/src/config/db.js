const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');
const { queryMemoryDb } = require('./memoryDb');

let isMongoAvailable = false;
let isPgAvailable = false;
let pgPool = null;

// Initialize PostgreSQL pool if DATABASE_URL is configured
if (env.databaseUrl) {
  try {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: env.databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });
    pgPool.on('error', (err) => {
      logger.warn('PostgreSQL pool error:', err.message);
      isPgAvailable = false;
    });
  } catch (err) {
    logger.warn('PostgreSQL client initialization skipped:', err.message);
  }
}

/**
 * Connect to MongoDB Atlas via Mongoose
 */
const connectMongo = async () => {
  if (!env.mongodbUri || env.mongodbUri.includes('your_mongodb_atlas_connection_string')) {
    logger.warn('MONGODB_URI is not set or contains placeholder. Active mode: In-Memory Database Fallback.');
    isMongoAvailable = false;
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isMongoAvailable = true;
    logger.info(`Successfully connected to MongoDB Atlas database: "${mongoose.connection.name}"`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isMongoAvailable = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection lost. Falling back to Memory DB.');
      isMongoAvailable = false;
    });

    return true;
  } catch (err) {
    logger.warn(`Failed to connect to MongoDB Atlas (${err.message}). Falling back to In-Memory DB.`);
    isMongoAvailable = false;
    return false;
  }
};

/**
 * Execute query against MongoDB / Postgres / Memory DB fallback
 */
const query = async (text, params) => {
  if (isMongoAvailable) {
    // Legacy raw query call when MongoDB is primary — returns empty row format if invoked directly
    return { rows: [], rowCount: 0 };
  }

  if (isPgAvailable && pgPool) {
    try {
      const start = Date.now();
      const result = await pgPool.query(text, params);
      const duration = Date.now() - start;
      if (env.isDev && duration > 500) {
        logger.warn(`Slow query (${duration}ms): ${text.substring(0, 80)}...`);
      }
      return result;
    } catch (err) {
      logger.warn(`PostgreSQL error (${err.message}). Switching to In-Memory fallback.`);
      isPgAvailable = false;
    }
  }

  return queryMemoryDb(text, params);
};

/**
 * Execute operations within a database transaction (Mongoose Session or Memory fallback)
 */
const transaction = async (callback) => {
  if (isMongoAvailable && mongoose.connection.readyState === 1) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  // Fallback for memory client
  const memClient = {
    query: (text, params) => queryMemoryDb(text, params),
    release: () => {},
  };
  return callback(memClient);
};

/**
 * Test connections on startup
 */
const testConnection = async () => {
  const mongoSuccess = await connectMongo();
  if (mongoSuccess) return;

  if (pgPool) {
    try {
      const res = await pgPool.query('SELECT NOW()');
      isPgAvailable = true;
      logger.info(`PostgreSQL connected: ${res.rows[0].now}`);
    } catch (err) {
      isPgAvailable = false;
      logger.warn('PostgreSQL offline. Active mode: In-Memory Database Fallback.');
    }
  }
};

/**
 * Graceful shutdown handler
 */
const closeConnections = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info('MongoDB Atlas connection closed.');
  }
  if (pgPool) {
    await pgPool.end();
    logger.info('PostgreSQL pool ended.');
  }
};

process.on('SIGINT', async () => {
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnections();
  process.exit(0);
});

module.exports = {
  mongoose,
  connectMongo,
  query,
  transaction,
  testConnection,
  closeConnections,
  get isMongoAvailable() {
    return isMongoAvailable && mongoose.connection.readyState === 1;
  },
};
