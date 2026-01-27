const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toSafeObject(),
      summary: {
        steps: Math.round(3000 + Math.random() * 2000),
        heartRate: Math.round(65 + Math.random() * 15),
        battery: Math.round(70 + Math.random() * 20),
        alerts: Math.floor(Math.random() * 3)
      }
    }
  });
});

module.exports = router;