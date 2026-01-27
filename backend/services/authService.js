const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Generate Access Token (courte durée)
  static generateAccessToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
  }

  // Generate Refresh Token (longue durée)
  static generateRefreshToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
  }

  // Generate Both Tokens
  static generateTokens(user) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return {
      accessToken: this.generateAccessToken(payload.userId, payload.email, payload.role),
      refreshToken: this.generateRefreshToken(payload.userId, payload.email, payload.role)
    };
  }

  // Verify Token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  // Store Refresh Token in Database
  static async storeRefreshToken(userId, refreshToken, deviceInfo = {}) {
    const decoded = this.verifyToken(refreshToken);
    const expiresAt = new Date(decoded.exp * 1000);

    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: {
          token: refreshToken,
          expiresAt,
          deviceInfo
        }
      }
    });
  }

  // Revoke Refresh Token
  static async revokeRefreshToken(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: {
        refreshTokens: { token: refreshToken }
      }
    });
  }

  // Revoke All Refresh Tokens (logout all devices)
  static async revokeAllRefreshTokens(userId) {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] }
    });
  }

  // Validate Refresh Token
  static async validateRefreshToken(refreshToken) {
    const decoded = this.verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Check if token exists in database
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      throw new Error('Invalid refresh token');
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      throw new Error('Password was changed. Please login again.');
    }

    return user;
  }

  // Extract Token from Header
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided');
    }
    return authHeader.split(' ')[1];
  }

  // Validate Password Strength
  static validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Hash Password Reset Token
  static hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Generate Random Token
  static generateRandomToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = AuthService;
