const express = require('express');
const router = express.Router();

// Simulate device status
function generateDeviceStatus() {
  const variance = (base, range) => base + (Math.random() - 0.5) * range;
  
  return {
    connected: true,
    battery: Math.round(variance(78, 10)),
    lastSync: new Date(),
    firmware: '2.4.1',
    model: 'SafeStep Pro v2',
    leftShoe: {
      battery: Math.round(variance(78, 10)),
      sensors: {
        pressure: Array.from({ length: 6 }, () => Math.round(variance(50, 30))),
        accelerometer: {
          x: +(variance(0.02, 0.1)).toFixed(2),
          y: +(variance(0.98, 0.1)).toFixed(2),
          z: +(variance(0.15, 0.1)).toFixed(2)
        },
        gyroscope: {
          x: +(variance(0.5, 0.5)).toFixed(2),
          y: +(variance(-0.3, 0.3)).toFixed(2),
          z: +(variance(0.1, 0.2)).toFixed(2)
        },
        temperature: +(variance(22.5, 2)).toFixed(1)
      }
    },
    rightShoe: {
      battery: Math.round(variance(76, 10)),
      sensors: {
        pressure: Array.from({ length: 6 }, () => Math.round(variance(50, 30))),
        accelerometer: {
          x: +(variance(0.01, 0.1)).toFixed(2),
          y: +(variance(0.97, 0.1)).toFixed(2),
          z: +(variance(0.18, 0.1)).toFixed(2)
        },
        gyroscope: {
          x: +(variance(0.4, 0.4)).toFixed(2),
          y: +(variance(-0.2, 0.3)).toFixed(2),
          z: +(variance(0.15, 0.2)).toFixed(2)
        },
        temperature: +(variance(22.8, 2)).toFixed(1)
      }
    }
  };
}

/**
 * @route   GET /api/device/status
 * @desc    Get device status
 * @access  Private
 */
router.get('/status', (req, res) => {
  try {
    const deviceStatus = generateDeviceStatus();
    
    res.json({
      success: true,
      data: deviceStatus
    });
  } catch (error) {
    console.error('Get device status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device status'
    });
  }
});

module.exports = router;
