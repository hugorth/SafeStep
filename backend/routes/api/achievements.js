const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: '5000 Steps', icon: '🏆', unlocked: true },
      { id: 2, name: '1 Week Streak', icon: '🔥', unlocked: true },
      { id: 3, name: '10000 Steps', icon: '⭐', unlocked: false }
    ]
  });
});

module.exports = router;