const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      { name: 'Balance Exercise', duration: 10, completed: true },
      { name: 'Strength Training', duration: 15, completed: false }
    ]
  });
});

module.exports = router;