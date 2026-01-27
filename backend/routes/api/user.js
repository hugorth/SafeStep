const express = require('express');
const router = express.Router();
const User = require('../../models/User');

/**
 * @route   GET /api/user
 * @desc    Get current user data
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const user = req.user.toSafeObject();
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
});

module.exports = router;
