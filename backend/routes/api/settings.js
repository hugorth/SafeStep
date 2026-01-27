const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: req.user.preferences || {}
  });
});

router.put('/', async (req, res) => {
  try {
    req.user.preferences = { ...req.user.preferences, ...req.body };
    await req.user.save();
    res.json({ success: true, data: req.user.preferences });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;