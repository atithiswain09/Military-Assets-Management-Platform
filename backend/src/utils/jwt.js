const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Generate a JWT token with the given payload.
 * @param {{ userId: string, role: string, baseId: string|null }} payload
 * @returns {string}
 */
const generateToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

module.exports = { generateToken, verifyToken };
