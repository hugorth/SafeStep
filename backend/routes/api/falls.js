const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      totalFalls: 2,
      lastFall: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      fallsThisMonth: 0,
      fallsThisYear: 2,
      history: []
    }
  });
});

module.exports = router;