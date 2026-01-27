const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      temperature: Math.round(15 + Math.random() * 10),
      condition: 'Partly Cloudy',
      humidity: Math.round(50 + Math.random() * 30),
      windSpeed: Math.round(5 + Math.random() * 10)
    }
  });
});

module.exports = router;