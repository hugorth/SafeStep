const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes', 'api');

// Templates for each route file
const templates = {
  health: `const express = require('express');
const router = express.Router();

function generateHealthData() {
  const variance = (base, range) => base + (Math.random() - 0.5) * range;
  
  return {
    heartRate: Math.round(variance(72, 10)),
    bloodPressure: {
      systolic: Math.round(variance(120, 10)),
      diastolic: Math.round(variance(80, 5))
    },
    bloodOxygen: Math.round(variance(98, 2)),
    temperature: +(variance(36.8, 0.5)).toFixed(1),
    stressLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
    lastUpdate: new Date()
  };
}

router.get('/', (req, res) => {
  res.json({ success: true, data: generateHealthData() });
});

router.get('/heartrate/history', (req, res) => {
  const history = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    value: Math.round(65 + Math.random() * 20)
  }));
  res.json({ success: true, data: history });
});

module.exports = router;`,

  fallrisk: `const express = require('express');
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

module.exports = router;`,

  alerts: `const express = require('express');
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

module.exports = router;`,

  falls: `const express = require('express');
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

module.exports = router;`,

  medications: `const express = require('express');
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

module.exports = router;`,

  exercises: `const express = require('express');
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

module.exports = router;`,

  weather: `const express = require('express');
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

module.exports = router;`,

  social: `const express = require('express');
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

module.exports = router;`,

  achievements: `const express = require('express');
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

module.exports = router;`,

  settings: `const express = require('express');
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

module.exports = router;`,

  dashboard: `const express = require('express');
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

module.exports = router;`,

  emergency: `const express = require('express');
const router = express.Router();

router.post('/sos', async (req, res) => {
  try {
    console.log('🚨 SOS ACTIVATED for user:', req.userId);
    console.log('📍 Location:', req.body.location);
    console.log('📞 Notifying emergency contacts...');
    
    // In production, send real notifications here
    const contacts = req.user.emergencyContacts;
    
    res.json({
      success: true,
      message: 'Emergency services notified',
      data: {
        timestamp: new Date(),
        contactsNotified: contacts.length,
        estimatedResponseTime: '5-10 minutes'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;`
};

// Create each route file
console.log('📝 Generating API route files...\n');

Object.entries(templates).forEach(([name, content]) => {
  const filePath = path.join(routesDir, `${name}.js`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Created: routes/api/${name}.js`);
});

console.log('\n🎉 All API routes generated successfully!');
