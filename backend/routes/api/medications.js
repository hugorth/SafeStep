const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      { name: 'Aspirin', dosage: '100mg', frequency: 'Daily', time: '08:00' },
      { name: 'Vitamin D', dosage: '1000 IU', frequency: 'Daily', time: '08:00' }
    ]
  });
});

module.exports = router;