const env = require('../config/env');

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = env.isDev ? LOG_LEVELS.debug : LOG_LEVELS.info;

const timestamp = () => new Date().toISOString();

const formatMessage = (level, message, meta) => {
  const base = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  if (meta && Object.keys(meta).length > 0) {
    // Never log sensitive fields
    const safe = { ...meta };
    delete safe.password;
    delete safe.password_hash;
    delete safe.token;
    delete safe.secret;
    return `${base} ${JSON.stringify(safe)}`;
  }
  return base;
};

const logger = {
  error: (message, meta = {}) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, meta instanceof Error ? { error: meta.message, stack: meta.stack } : meta));
    }
  },
  warn: (message, meta = {}) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  info: (message, meta = {}) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, meta));
    }
  },
  debug: (message, meta = {}) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(formatMessage('debug', message, meta));
    }
  },
};

module.exports = logger;
