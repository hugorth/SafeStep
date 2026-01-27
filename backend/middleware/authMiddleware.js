const AuthService = require('../services/authService');
const User = require('../models/User');

// Protect Routes - Require Authentication
exports.protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = AuthService.verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    // 3. Check if token is access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type'
      });
    }

    // 4. Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists'
      });
    }

    // 5. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated'
      });
    }

    // 6. Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: 'Password was changed recently. Please login again.'
      });
    }

    // 7. Grant access to protected route
    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Optional Authentication (for routes that work with or without auth)
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyToken(token);

    if (decoded.type === 'access') {
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id.toString();
      }
    }

    next();
  } catch (error) {
    // Si erreur, continuer sans authentification
    next();
  }
};

// Check if user owns resource
exports.checkOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    const userId = req.userId;

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check ownership
    if (resourceId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

// Rate limiting per user
exports.userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.userId;
    const now = Date.now();

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    next();
  };
};

// Verify Email Required
exports.requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Please verify your email address to access this feature'
    });
  }
  next();
};

// Check Device Ownership
exports.checkDeviceOwnership = async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId || req.body.deviceId;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }

    // Admin can access all devices
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if device belongs to user
    if (req.user.deviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this device'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Device ownership verification failed'
    });
  }
};
