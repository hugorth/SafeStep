const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const alerts = [
    {
      id: 'alert_001',
      type: 'warning',
      title: 'Low Battery',
      description: 'Right shoe battery below 20%',
      time: new Date(Date.now() - 30 * 60 * 1000),
      severity: 'medium',
      acknowledged: false
    },
    {
      id: 'alert_002',
      type: 'info',
      title: 'Daily Goal Achieved',
      description: '5000 steps completed!',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: 'low',
      acknowledged: true
    }
  ];
  res.json({ success: true, data: alerts });
});

module.exports = router;