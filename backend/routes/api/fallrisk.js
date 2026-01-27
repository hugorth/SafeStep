const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      riskLevel: 'low',
      riskScore: Math.round(20 + Math.random() * 15),
      factors: [
        { name: 'Gait Stability', score: Math.round(75 + Math.random() * 15), status: 'good' },
        { name: 'Balance', score: Math.round(70 + Math.random() * 15), status: 'good' },
        { name: 'Reaction Time', score: Math.round(65 + Math.random() * 15), status: 'moderate' },
        { name: 'Strength', score: Math.round(65 + Math.random() * 15), status: 'moderate' }
      ],
      recommendations: [
        'Your cadence is steadily improving. Keep up your daily exercises.',
        'Stay hydrated during your morning walks.',
        '5000 step goal reached 5 days this week!'
      ]
    }
  });
});

module.exports = router;