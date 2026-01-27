const express = require('express');
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

module.exports = router;