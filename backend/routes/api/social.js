const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      friends: 12,
      challenges: 3,
      messages: 5
    }
  });
});

module.exports = router;