const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuthService = require('../services/authService');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  resetPasswordValidation,
  emailValidation,
  validate
} = require('../middleware/validation');

// ==================== PUBLIC ROUTES ====================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', registerValidation, validate, async (req, res) => {
  try {
    const { email, password, name, age, weight, height, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      age,
      weight,
      height,
      gender
    });

    // Generate tokens
    const tokens = AuthService.generateTokens(user);

    // Store refresh token
    await AuthService.storeRefreshToken(
      user._id,
      tokens.refreshToken,
      {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    );

    // Log registration
    await user.addLoginHistory(req.ip, req.headers['user-agent'], true);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toSafeObject(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and validate credentials
    const user = await User.findByCredentials(email, password);

    // Generate tokens
    const tokens = AuthService.generateTokens(user);

    // Store refresh token
    await AuthService.storeRefreshToken(
      user._id,
      tokens.refreshToken,
      {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    );

    // Log login
    await user.addLoginHistory(req.ip, req.headers['user-agent'], true);

    // Clean expired tokens
    await user.cleanExpiredTokens();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Log failed attempt if user exists
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      await user.addLoginHistory(req.ip, req.headers['user-agent'], false);
    }

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Validate refresh token
    const user = await AuthService.validateRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = AuthService.generateAccessToken(
      user._id.toString(),
      user.email,
      user.role
    );

    res.json({
      success: true,
      data: {
        accessToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', emailValidation, validate, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, isActive: true });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In production, send email here
    // await sendPasswordResetEmail(user.email, resetToken);

    console.log('📧 Password reset token:', resetToken);
    console.log('🔗 Reset link: http://localhost:3001/reset-password/' + resetToken);

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
      // Remove in production!
      debug: {
        resetToken,
        resetLink: `http://localhost:3001/reset-password/${resetToken}`
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process request'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token', resetPasswordValidation, validate, async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = AuthService.hashToken(req.params.token);

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    
    // Revoke all refresh tokens (logout all devices)
    user.refreshTokens = [];
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// ==================== PROTECTED ROUTES ====================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private
 */
router.post('/logout', protect, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await AuthService.revokeRefreshToken(req.userId, refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', protect, async (req, res) => {
  try {
    await AuthService.revokeAllRefreshTokens(req.userId);

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout from all devices'
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and get current user
 * @access  Private
 */
router.get('/verify', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', protect, changePasswordValidation, validate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    
    // Revoke all refresh tokens (logout all devices)
    user.refreshTokens = [];
    
    await user.save();

    // Generate new tokens
    const tokens = AuthService.generateTokens(user);
    await AuthService.storeRefreshToken(
      user._id,
      tokens.refreshToken,
      {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions (devices)
 * @access  Private
 */
router.get('/sessions', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const sessions = user.refreshTokens.map(token => ({
      deviceInfo: token.deviceInfo,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      isExpired: token.expiresAt < Date.now()
    }));

    res.json({
      success: true,
      data: {
        sessions,
        total: sessions.length
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

/**
 * @route   GET /api/auth/login-history
 * @desc    Get login history
 * @access  Private
 */
router.get('/login-history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    res.json({
      success: true,
      data: {
        history: user.loginHistory,
        total: user.loginHistory.length
      }
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get login history'
    });
  }
});

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete account (soft delete)
 * @access  Private
 */
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    // Soft delete
    user.isActive = false;
    user.refreshTokens = [];
    await user.save();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

module.exports = router;
