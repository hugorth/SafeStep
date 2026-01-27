const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo, checkOwnership } = require('../middleware/authMiddleware');
const {
  updateProfileValidation,
  emergencyContactValidation,
  deviceValidation,
  validate
} = require('../middleware/validation');

// ==================== USER ROUTES ====================

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me', protect, updateProfileValidation, validate, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'age', 'weight', 'height', 'gender',
      'medicalConditions', 'allergies', 'avatar'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

/**
 * @route   PUT /api/users/me/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/me/preferences', protect, async (req, res) => {
  try {
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { preferences },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * @route   GET /api/users/me/emergency-contacts
 * @desc    Get emergency contacts
 * @access  Private
 */
router.get('/me/emergency-contacts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        contacts: user.emergencyContacts
      }
    });
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get emergency contacts'
    });
  }
});

/**
 * @route   POST /api/users/me/emergency-contacts
 * @desc    Add emergency contact
 * @access  Private
 */
router.post('/me/emergency-contacts', protect, emergencyContactValidation, validate, async (req, res) => {
  try {
    const { name, phone, relation, isPrimary } = req.body;

    const user = await User.findById(req.userId);

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      user.emergencyContacts.forEach(contact => {
        contact.isPrimary = false;
      });
    }

    user.emergencyContacts.push({
      name,
      phone,
      relation,
      isPrimary: isPrimary || false
    });

    await user.save();

    res.json({
      success: true,
      message: 'Emergency contact added successfully',
      data: {
        contacts: user.emergencyContacts
      }
    });
  } catch (error) {
    console.error('Add emergency contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add emergency contact'
    });
  }
});

/**
 * @route   PUT /api/users/me/emergency-contacts/:contactId
 * @desc    Update emergency contact
 * @access  Private
 */
router.put('/me/emergency-contacts/:contactId', protect, emergencyContactValidation, validate, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { name, phone, relation, isPrimary } = req.body;

    const user = await User.findById(req.userId);
    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Emergency contact not found'
      });
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      user.emergencyContacts.forEach(c => {
        if (c._id.toString() !== contactId) {
          c.isPrimary = false;
        }
      });
    }

    contact.name = name || contact.name;
    contact.phone = phone || contact.phone;
    contact.relation = relation || contact.relation;
    contact.isPrimary = isPrimary !== undefined ? isPrimary : contact.isPrimary;

    await user.save();

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      data: {
        contacts: user.emergencyContacts
      }
    });
  } catch (error) {
    console.error('Update emergency contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update emergency contact'
    });
  }
});

/**
 * @route   DELETE /api/users/me/emergency-contacts/:contactId
 * @desc    Delete emergency contact
 * @access  Private
 */
router.delete('/me/emergency-contacts/:contactId', protect, async (req, res) => {
  try {
    const { contactId } = req.params;

    const user = await User.findById(req.userId);
    const contact = user.emergencyContacts.id(contactId);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Emergency contact not found'
      });
    }

    contact.deleteOne();
    await user.save();

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully',
      data: {
        contacts: user.emergencyContacts
      }
    });
  } catch (error) {
    console.error('Delete emergency contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete emergency contact'
    });
  }
});

/**
 * @route   PUT /api/users/me/device
 * @desc    Link device to user
 * @access  Private
 */
router.put('/me/device', protect, deviceValidation, validate, async (req, res) => {
  try {
    const { deviceId, deviceModel } = req.body;

    // Check if device is already linked to another user
    const existingDevice = await User.findOne({ deviceId, _id: { $ne: req.userId } });
    if (existingDevice) {
      return res.status(400).json({
        success: false,
        error: 'Device is already linked to another account'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        deviceId,
        deviceModel,
        lastDeviceSync: Date.now()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Device linked successfully',
      data: {
        deviceId: user.deviceId,
        deviceModel: user.deviceModel,
        lastDeviceSync: user.lastDeviceSync
      }
    });
  } catch (error) {
    console.error('Link device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link device'
    });
  }
});

/**
 * @route   DELETE /api/users/me/device
 * @desc    Unlink device from user
 * @access  Private
 */
router.delete('/me/device', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $unset: { deviceId: 1, deviceModel: 1, lastDeviceSync: 1 }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Device unlinked successfully'
    });
  } catch (error) {
    console.error('Unlink device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink device'
    });
  }
});

/**
 * @route   GET /api/users/me/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/me/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const stats = {
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
      totalLogins: user.loginHistory.length,
      successfulLogins: user.loginHistory.filter(l => l.success).length,
      failedLogins: user.loginHistory.filter(l => !l.success).length,
      lastLogin: user.lastLogin,
      activeSessions: user.refreshTokens.filter(t => t.expiresAt > Date.now()).length,
      emergencyContacts: user.emergencyContacts.length,
      isDeviceLinked: !!user.deviceId,
      bmi: user.bmi
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password -refreshTokens')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private/Admin
 */
router.get('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
router.put('/:id/role', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'caregiver', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role'
    });
  }
});

/**
 * @route   PUT /api/users/:id/status
 * @desc    Activate/Deactivate user (Admin only)
 * @access  Private/Admin
 */
router.put('/:id/status', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Revoke all tokens if deactivating
    if (!isActive) {
      user.refreshTokens = [];
      await user.save();
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

module.exports = router;
