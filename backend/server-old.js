const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// ==================== AUTH CONFIG ====================

const JWT_SECRET = 'safestep-secret-key-2024-ultra-secure'; // En production, utilisez une variable d'environnement
const JWT_EXPIRES_IN = '7d';

// Base de données utilisateurs simulée (en production, utilisez MongoDB/PostgreSQL)
let usersDatabase = [
  {
    id: 'user_001',
    email: 'marie.joubert@email.com',
    password: '$2a$10$XQVzLqP3L6KZ3lFqZr.LCO.EJ6B0K3qGZ0P9L4H.0O5QZN.0G0XBW', // "Password123!"
    name: 'Marie Joubert',
    avatar: 'MJ',
    age: 72,
    weight: 65,
    height: 165,
    medicalConditions: ['Parkinson\'s Disease', 'Hypertension'],
    emergencyContacts: [
      { name: 'Dr. Laurent', phone: '+33 6 12 34 56 78', type: 'doctor' },
      { name: 'Sophie (Daughter)', phone: '+33 6 98 76 54 32', type: 'family' }
    ],
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date()
  },
  {
    id: 'user_002',
    email: 'demo@safestep.com',
    password: '$2a$10$XQVzLqP3L6KZ3lFqZr.LCO.EJ6B0K3qGZ0P9L4H.0O5QZN.0G0XBW', // "Password123!"
    name: 'Demo User',
    avatar: 'DU',
    age: 68,
    weight: 70,
    height: 170,
    medicalConditions: ['Arthritis'],
    emergencyContacts: [
      { name: 'Emergency Services', phone: '112', type: 'emergency' }
    ],
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date()
  }
];

// Sessions actives (en production, utilisez Redis)
let activeSessions = new Map();

// ==================== AUTH MIDDLEWARE ====================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  });
}

// ==================== SIMULATION DATA ====================

// User data (now linked to authenticated user)
let userData = {
  id: 'user_001',
  name: 'Marie Joubert',
  email: 'marie.joubert@email.com',
  avatar: 'MJ',
  age: 72,
  weight: 65, // kg
  height: 165, // cm
  medicalConditions: ['Parkinson\'s Disease', 'Hypertension'],
  emergencyContacts: [
    { name: 'Dr. Laurent', phone: '+33 6 12 34 56 78', type: 'doctor' },
    { name: 'Sophie (Daughter)', phone: '+33 6 98 76 54 32', type: 'family' }
  ]
};

// Device status
let deviceStatus = {
  connected: true,
  battery: 78,
  lastSync: new Date(),
  firmware: '2.4.1',
  model: 'SafeStep Pro v2',
  leftShoe: {
    battery: 78,
    sensors: {
      pressure: [45, 62, 38, 71, 55, 49],
      accelerometer: { x: 0.02, y: 0.98, z: 0.15 },
      gyroscope: { x: 0.5, y: -0.3, z: 0.1 },
      temperature: 22.5
    }
  },
  rightShoe: {
    battery: 76,
    sensors: {
      pressure: [48, 59, 42, 68, 52, 51],
      accelerometer: { x: 0.01, y: 0.97, z: 0.18 },
      gyroscope: { x: 0.4, y: -0.2, z: 0.15 },
      temperature: 22.8
    }
  }
};

// Real-time activity data
let activityData = {
  steps: 3847,
  distance: 2.89, // km
  calories: 187,
  activeMinutes: 142,
  cadence: 112, // steps per minute
  gaitSpeed: 1.2, // m/s
  strideLength: 0.65, // meters
  symmetry: 87, // percentage
  stability: 82 // percentage
};

// Location data
let locationData = {
  latitude: 48.8566,
  longitude: 2.3522,
  accuracy: 12,
  address: 'Living Room',
  lastUpdate: new Date()
};

// Health metrics
let healthMetrics = {
  heartRate: 72,
  bloodPressure: { systolic: 120, diastolic: 80 },
  bloodOxygen: 98,
  temperature: 36.8,
  stressLevel: 'low',
  lastUpdate: new Date()
};

// Fall risk assessment
let fallRiskData = {
  riskLevel: 'low', // low, medium, high
  riskScore: 25, // 0-100
  factors: [
    { name: 'Gait Stability', score: 82, status: 'good' },
    { name: 'Balance', score: 78, status: 'good' },
    { name: 'Reaction Time', score: 71, status: 'moderate' },
    { name: 'Strength', score: 69, status: 'moderate' }
  ],
  recommendations: [
    'Your cadence is steadily improving. Keep up your daily exercises.',
    'Stay hydrated during your morning walks.',
    '5000 step goal reached 5 days this week!'
  ]
};

// Alerts history
let alertsHistory = [
  {
    id: 'alert_001',
    type: 'fall',
    title: 'Fall Detected',
    description: 'High impact detected - Emergency services notified',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    location: 'Living Room',
    severity: 'high',
    response: {
      time: 120, // seconds
      helped: true,
      responder: 'Sophie (Daughter)'
    },
    metrics: {
      impact: 4.2, // G-force
      timeOnGround: 47, // seconds
      recovered: true
    }
  },
  {
    id: 'alert_002',
    type: 'warning',
    title: 'Low Battery',
    description: 'Right shoe battery below 20%',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    location: null,
    severity: 'medium'
  },
  {
    id: 'alert_003',
    type: 'info',
    title: 'Goal Reached',
    description: '5000 steps goal achieved',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000 - 6.5 * 60 * 60 * 1000),
    location: null,
    severity: 'low'
  },
  {
    id: 'alert_004',
    type: 'fall',
    title: 'Motor Block Detected',
    description: 'Freezing of gait episode detected',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000 - 2.33 * 60 * 60 * 1000),
    location: 'Kitchen',
    severity: 'medium'
  },
  {
    id: 'alert_005',
    type: 'warning',
    title: 'Prolonged Inactivity',
    description: 'No movement detected for 3 hours',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    location: null,
    severity: 'medium'
  }
];

// Fall history with detailed events
let fallHistory = [
  {
    id: 'fall_001',
    date: new Date(),
    location: { lat: 48.8566, lng: 2.3522, name: 'Living Room' },
    severity: 'moderate',
    impact: 4.2,
    timeOnGround: 47,
    responseTime: 120,
    helped: true,
    timeline: [
      { time: 0, event: 'Normal Walking', speed: 0.8, tilt: 2 },
      { time: 3, event: 'Imbalance Detected', speed: 0.6, tilt: 35 },
      { time: 4, event: 'Fall Confirmed', speed: 0, tilt: 85, impact: 4.2 },
      { time: 126, event: 'Assistance Arrived', speed: 0, tilt: 85 }
    ],
    videoAvailable: true
  },
  {
    id: 'fall_002',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000 + 9.25 * 60 * 60 * 1000),
    location: { lat: 48.8568, lng: 2.3525, name: 'Kitchen' },
    severity: 'minor',
    impact: 2.8,
    timeOnGround: 12,
    responseTime: 300,
    helped: false,
    timeline: [
      { time: 0, event: 'Normal Walking', speed: 0.7, tilt: 3 },
      { time: 2, event: 'Imbalance Detected', speed: 0.4, tilt: 28 },
      { time: 3, event: 'Fall Confirmed', speed: 0, tilt: 75, impact: 2.8 },
      { time: 15, event: 'Self-Recovery', speed: 0, tilt: 15 }
    ],
    videoAvailable: true
  }
];

// Medication schedule
let medications = [
  {
    id: 'med_001',
    name: 'Levodopa',
    dose: '100mg',
    frequency: 'Every 6 hours',
    times: ['08:00', '14:00', '20:00', '02:00'],
    taken: [
      { time: '08:00', taken: true, timestamp: new Date() },
      { time: '14:00', taken: false, timestamp: null }
    ],
    nextDose: '14:00',
    sideEffects: ['Nausea', 'Dizziness'],
    instructions: 'Take with food'
  },
  {
    id: 'med_002',
    name: 'Carbidopa',
    dose: '25mg',
    frequency: 'Every 6 hours',
    times: ['08:00', '14:00', '20:00', '02:00'],
    taken: [
      { time: '08:00', taken: true, timestamp: new Date() },
      { time: '14:00', taken: false, timestamp: null }
    ],
    nextDose: '14:00'
  },
  {
    id: 'med_003',
    name: 'Aspirin',
    dose: '75mg',
    frequency: 'Once daily',
    times: ['20:00'],
    taken: [{ time: '20:00', taken: false, timestamp: null }],
    nextDose: '20:00'
  },
  {
    id: 'med_004',
    name: 'Vitamin D',
    dose: '1000 IU',
    frequency: 'Once daily',
    times: ['08:00'],
    taken: [{ time: '08:00', taken: true, timestamp: new Date() }],
    nextDose: 'Tomorrow 08:00'
  }
];

// Exercise program
let exerciseProgram = [
  {
    id: 'ex_001',
    name: 'Morning Walk',
    duration: 15,
    difficulty: 'easy',
    completed: 3,
    total: 7,
    weekProgress: [true, true, true, false, false, false, false],
    instructions: 'Walk at a comfortable pace for 15 minutes',
    benefits: ['Cardiovascular health', 'Mood improvement', 'Joint mobility']
  },
  {
    id: 'ex_002',
    name: 'Standing Balance',
    duration: 10,
    difficulty: 'medium',
    completed: 5,
    total: 7,
    weekProgress: [true, true, false, true, true, true, false],
    instructions: 'Stand on one foot for 30 seconds, alternate',
    benefits: ['Balance', 'Core strength', 'Fall prevention']
  },
  {
    id: 'ex_003',
    name: 'Stretching',
    duration: 8,
    difficulty: 'easy',
    completed: 7,
    total: 7,
    weekProgress: [true, true, true, true, true, true, true],
    instructions: 'Gentle full-body stretching routine',
    benefits: ['Flexibility', 'Range of motion', 'Relaxation']
  },
  {
    id: 'ex_004',
    name: 'Strength Training',
    duration: 12,
    difficulty: 'hard',
    completed: 2,
    total: 7,
    weekProgress: [true, false, false, true, false, false, false],
    instructions: 'Light resistance exercises with bands',
    benefits: ['Muscle strength', 'Bone density', 'Metabolism']
  }
];

// Activity heatmap (hour x day)
let activityHeatmap = generateActivityHeatmap();

// Weekly stability data
let weeklyStability = [
  { day: 'Mon', value: 65, steps: 4200, falls: 0 },
  { day: 'Tue', value: 78, steps: 5100, falls: 0 },
  { day: 'Wed', value: 58, steps: 3800, falls: 1 },
  { day: 'Thu', value: 82, steps: 5400, falls: 0 },
  { day: 'Fri', value: 72, steps: 4700, falls: 0 },
  { day: 'Sat', value: 45, steps: 2900, falls: 0 },
  { day: 'Sun', value: 88, steps: 5800, falls: 0 }
];

// Heart rate history (24h)
let heartRateHistory = generateHeartRateHistory();

// Weather data
let weatherData = {
  current: {
    temperature: 18,
    condition: 'Sunny',
    humidity: 45,
    windSpeed: 12,
    uvIndex: 4,
    visibility: 'Excellent',
    location: 'Paris'
  },
  alerts: [
    { type: 'info', message: 'Ideal Conditions', description: 'Perfect for a walk' },
    { type: 'warning', message: 'Rain expected at 4 PM', description: 'Avoid going out after 3:30 PM' }
  ],
  forecast: [
    { hour: '14:00', temp: 18, condition: 'Sunny', precipitation: 0 },
    { hour: '15:00', temp: 19, condition: 'Partly Cloudy', precipitation: 0 },
    { hour: '16:00', temp: 17, condition: 'Rain', precipitation: 80 },
    { hour: '17:00', temp: 16, condition: 'Rain', precipitation: 70 }
  ]
};

// Social/Community data
let socialData = {
  userRank: 3,
  friends: [
    { name: 'Jean Martin', steps: 5234, avatar: 'JM', rank: 1 },
    { name: 'Marie Dubois', steps: 4892, avatar: 'MD', rank: 2 },
    { name: 'Pierre Laurent', steps: 3847, avatar: 'PL', rank: 3, isMe: true },
    { name: 'Sophie Bernard', steps: 3621, avatar: 'SB', rank: 4 },
    { name: 'Luc Petit', steps: 3105, avatar: 'LP', rank: 5 }
  ]
};

// Achievements
let achievements = [
  { id: 'ach_001', name: 'First Steps', description: 'Connect your shoes', unlocked: true, unlockedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  { id: 'ach_002', name: '1000 Steps', description: 'Reach 1000 steps in one day', unlocked: true, unlockedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
  { id: 'ach_003', name: 'Full Week', description: '7 days of activity', unlocked: true, unlockedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  { id: 'ach_004', name: 'Marathonien', description: 'Walk 42 km', unlocked: false, progress: 23.7 },
  { id: 'ach_005', name: 'Early Riser', description: 'Activity before 7 AM for 5 days', unlocked: true, unlockedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: 'ach_006', name: 'Explorer', description: 'Visit 10 different locations', unlocked: false, progress: 6 }
];

// Settings
let settings = {
  notifications: true,
  vibration: true,
  autoSOS: true,
  voiceCommands: false,
  fallDetectionSensitivity: 'medium', // low, medium, high
  emergencyContactsNotify: true,
  dataSharing: true,
  language: 'fr'
};

// ==================== HELPER FUNCTIONS ====================

function generateActivityHeatmap() {
  const heatmap = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  days.forEach((day, dayIndex) => {
    const dayData = { day, hours: [] };
    for (let hour = 0; hour < 24; hour++) {
      // More activity during day hours (7-22)
      let level = 0;
      if (hour >= 7 && hour <= 22) {
        level = Math.floor(Math.random() * 5);
        // Peak hours (9-11, 14-16, 19-21)
        if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16) || (hour >= 19 && hour <= 21)) {
          level = Math.min(4, level + 1);
        }
      }
      dayData.hours.push({ hour, level });
    }
    heatmap.push(dayData);
  });
  
  return heatmap;
}

function generateHeartRateHistory() {
  const history = [];
  const now = Date.now();
  
  for (let i = 0; i < 144; i++) { // 24 hours, every 10 minutes
    const time = new Date(now - (143 - i) * 10 * 60 * 1000);
    const hour = time.getHours();
    
    // Lower heart rate during night (0-6), higher during day
    let baseRate = 72;
    if (hour >= 0 && hour < 6) baseRate = 60;
    else if (hour >= 6 && hour < 12) baseRate = 70;
    else if (hour >= 12 && hour < 18) baseRate = 75;
    else baseRate = 68;
    
    const variation = Math.random() * 10 - 5;
    const rate = Math.round(baseRate + variation);
    
    history.push({ time, rate });
  }
  
  return history;
}

function simulateRealtimeData() {
  // Simulate steps increment
  if (Math.random() > 0.7) {
    activityData.steps += Math.floor(Math.random() * 3);
    activityData.distance = (activityData.steps * 0.75) / 1000; // rough km calculation
    activityData.calories = Math.floor(activityData.steps * 0.04);
  }
  
  // Simulate sensor data changes
  deviceStatus.leftShoe.sensors.pressure = deviceStatus.leftShoe.sensors.pressure.map(
    p => Math.max(0, Math.min(100, p + (Math.random() * 10 - 5)))
  );
  deviceStatus.rightShoe.sensors.pressure = deviceStatus.rightShoe.sensors.pressure.map(
    p => Math.max(0, Math.min(100, p + (Math.random() * 10 - 5)))
  );
  
  // Simulate accelerometer/gyroscope
  deviceStatus.leftShoe.sensors.accelerometer = {
    x: (Math.random() - 0.5) * 0.1,
    y: 0.95 + (Math.random() - 0.5) * 0.1,
    z: (Math.random() - 0.5) * 0.2
  };
  
  // Simulate heart rate variation
  healthMetrics.heartRate = Math.max(60, Math.min(100, healthMetrics.heartRate + (Math.random() * 4 - 2)));
  
  // Simulate battery drain
  if (Math.random() > 0.95) {
    deviceStatus.leftShoe.battery = Math.max(0, deviceStatus.leftShoe.battery - 1);
    deviceStatus.rightShoe.battery = Math.max(0, deviceStatus.rightShoe.battery - 1);
    deviceStatus.battery = Math.min(deviceStatus.leftShoe.battery, deviceStatus.rightShoe.battery);
  }
  
  // Random fall detection (very rare)
  if (Math.random() > 0.9995) {
    simulateFallDetection();
  }
  
  deviceStatus.lastSync = new Date();
}

function simulateFallDetection() {
  const newAlert = {
    id: `alert_${Date.now()}`,
    type: 'fall',
    title: 'Fall Detected',
    description: 'High impact detected - Emergency services notified',
    time: new Date(),
    location: ['Living Room', 'Kitchen', 'Bathroom', 'Bedroom'][Math.floor(Math.random() * 4)],
    severity: ['minor', 'moderate', 'severe'][Math.floor(Math.random() * 3)],
    metrics: {
      impact: (Math.random() * 3 + 2).toFixed(1),
      timeOnGround: Math.floor(Math.random() * 60 + 10),
      recovered: Math.random() > 0.3
    }
  };
  
  alertsHistory.unshift(newAlert);
  
  // Broadcast to all connected clients
  broadcastToClients({
    type: 'fall_detected',
    data: newAlert
  });
}

function broadcastToClients(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// ==================== API ROUTES ====================

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, age, weight, height } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
      age: age || null,
      weight: weight || null,
      height: height || null,
      medicalConditions: [],
      emergencyContacts: [],
      createdAt: new Date(),
      lastLogin: new Date()
    };

    usersDatabase.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session
    activeSessions.set(token, {
      userId: newUser.id,
      email: newUser.email,
      loginTime: new Date()
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during registration' 
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Store session
    activeSessions.set(token, {
      userId: user.id,
      email: user.email,
      loginTime: new Date()
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    console.log('✅ User logged in:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during login' 
    });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (token) {
    activeSessions.delete(token);
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  const user = usersDatabase.find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      error: 'User not found' 
    });
  }

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      valid: true
    }
  });
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: 'Current and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'New password must be at least 8 characters long' 
      });
    }

    const user = usersDatabase.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Current password is incorrect' 
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ==================== PROTECTED ROUTES ====================

// User endpoints
app.get('/api/user', authenticateToken, (req, res) => {
  const user = usersDatabase.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
});

app.put('/api/user', authenticateToken, (req, res) => {
  const user = usersDatabase.find(u => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  // Update allowed fields
  const allowedFields = ['name', 'age', 'weight', 'height', 'medicalConditions', 'emergencyContacts'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  const { password: _, ...userWithoutPassword } = user;
  res.json({ success: true, data: userWithoutPassword });
});

// Device status
app.get('/api/device/status', authenticateToken, (req, res) => {
  res.json({ success: true, data: deviceStatus });
});

// Activity data
app.get('/api/activity', authenticateToken, (req, res) => {
  res.json({ success: true, data: activityData });
});

app.get('/api/activity/weekly', authenticateToken, (req, res) => {
  res.json({ success: true, data: weeklyStability });
});

app.get('/api/activity/heatmap', authenticateToken, (req, res) => {
  res.json({ success: true, data: activityHeatmap });
});

// Location
app.get('/api/location', authenticateToken, (req, res) => {
  res.json({ success: true, data: locationData });
});

// Health metrics
app.get('/api/health', authenticateToken, (req, res) => {
  res.json({ success: true, data: healthMetrics });
});

app.get('/api/health/heartrate/history', authenticateToken, (req, res) => {
  res.json({ success: true, data: heartRateHistory });
});

// Fall risk
app.get('/api/fallrisk', authenticateToken, (req, res) => {
  res.json({ success: true, data: fallRiskData });
});

// Alerts
app.get('/api/alerts', authenticateToken, (req, res) => {
  const { type, limit } = req.query;
  let filtered = alertsHistory;
  
  if (type && type !== 'all') {
    filtered = alertsHistory.filter(alert => alert.type === type);
  }
  
  if (limit) {
    filtered = filtered.slice(0, parseInt(limit));
  }
  
  res.json({ success: true, data: filtered });
});

app.post('/api/alerts', authenticateToken, (req, res) => {
  const newAlert = {
    id: `alert_${Date.now()}`,
    ...req.body,
    time: new Date()
  };
  alertsHistory.unshift(newAlert);
  
  broadcastToClients({
    type: 'new_alert',
    data: newAlert
  });
  
  res.json({ success: true, data: newAlert });
});

// Fall history
app.get('/api/falls', authenticateToken, (req, res) => {
  res.json({ success: true, data: fallHistory });
});

app.get('/api/falls/:id', authenticateToken, (req, res) => {
  const fall = fallHistory.find(f => f.id === req.params.id);
  if (fall) {
    res.json({ success: true, data: fall });
  } else {
    res.status(404).json({ success: false, error: 'Fall event not found' });
  }
});

// Medications
app.get('/api/medications', authenticateToken, (req, res) => {
  res.json({ success: true, data: medications });
});

app.post('/api/medications/:id/take', authenticateToken, (req, res) => {
  const med = medications.find(m => m.id === req.params.id);
  if (med) {
    const { time } = req.body;
    const takenEntry = med.taken.find(t => t.time === time);
    if (takenEntry) {
      takenEntry.taken = true;
      takenEntry.timestamp = new Date();
    }
    res.json({ success: true, data: med });
    
    broadcastToClients({
      type: 'medication_taken',
      data: med
    });
  } else {
    res.status(404).json({ success: false, error: 'Medication not found' });
  }
});

// Exercises
app.get('/api/exercises', authenticateToken, (req, res) => {
  res.json({ success: true, data: exerciseProgram });
});

app.post('/api/exercises/:id/complete', authenticateToken, (req, res) => {
  const exercise = exerciseProgram.find(e => e.id === req.params.id);
  if (exercise) {
    const { dayIndex } = req.body;
    if (dayIndex !== undefined) {
      exercise.weekProgress[dayIndex] = true;
      exercise.completed = exercise.weekProgress.filter(Boolean).length;
    }
    res.json({ success: true, data: exercise });
  } else {
    res.status(404).json({ success: false, error: 'Exercise not found' });
  }
});

// Weather
app.get('/api/weather', authenticateToken, (req, res) => {
  res.json({ success: true, data: weatherData });
});

// Social
app.get('/api/social', authenticateToken, (req, res) => {
  res.json({ success: true, data: socialData });
});

// Achievements
app.get('/api/achievements', authenticateToken, (req, res) => {
  res.json({ success: true, data: achievements });
});

// Settings
app.get('/api/settings', authenticateToken, (req, res) => {
  res.json({ success: true, data: settings });
});

app.put('/api/settings', authenticateToken, (req, res) => {
  settings = { ...settings, ...req.body };
  res.json({ success: true, data: settings });
});

// Emergency SOS
app.post('/api/emergency/sos', authenticateToken, (req, res) => {
  const sosAlert = {
    id: `sos_${Date.now()}`,
    type: 'emergency',
    title: 'Emergency SOS Activated',
    description: 'User manually activated emergency alert',
    time: new Date(),
    location: locationData,
    severity: 'critical',
    status: 'active'
  };
  
  alertsHistory.unshift(sosAlert);
  
  broadcastToClients({
    type: 'sos_activated',
    data: sosAlert
  });
  
  // Simulate emergency service notification
  console.log('🚨 EMERGENCY SOS ACTIVATED');
  console.log('📍 Location:', locationData);
  console.log('📞 Notifying emergency contacts...');
  
  res.json({ success: true, data: sosAlert, message: 'Emergency services notified' });
});

// Dashboard summary (all key data in one call)
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: userData,
      device: deviceStatus,
      activity: activityData,
      location: locationData,
      health: healthMetrics,
      fallRisk: fallRiskData,
      recentAlerts: alertsHistory.slice(0, 5),
      weather: weatherData.current
    }
  });
});

// ==================== WEBSOCKET ====================

wss.on('connection', (ws) => {
  console.log('✅ New WebSocket client connected');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to SafeStep backend',
    timestamp: new Date()
  }));
  
  // Send current status
  ws.send(JSON.stringify({
    type: 'device_status',
    data: deviceStatus
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data);
      
      // Handle different message types
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
          break;
        case 'request_update':
          ws.send(JSON.stringify({
            type: 'full_update',
            data: {
              device: deviceStatus,
              activity: activityData,
              health: healthMetrics
            }
          }));
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });
});

// ==================== SIMULATION LOOP ====================

// Update real-time data every 2 seconds
setInterval(() => {
  simulateRealtimeData();
  
  // Broadcast updated data to all clients
  broadcastToClients({
    type: 'realtime_update',
    data: {
      activity: activityData,
      device: deviceStatus,
      health: healthMetrics,
      timestamp: new Date()
    }
  });
}, 2000);

// Update heart rate history every 10 minutes
setInterval(() => {
  heartRateHistory.push({
    time: new Date(),
    rate: healthMetrics.heartRate
  });
  
  // Keep only last 144 entries (24 hours)
  if (heartRateHistory.length > 144) {
    heartRateHistory.shift();
  }
}, 10 * 60 * 1000);

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🦿 SafeStep Backend Server with Authentication         ║
║                                                           ║
║   🌐 Server running on: http://localhost:${PORT}          ║
║   🔌 WebSocket available on: ws://localhost:${PORT}       ║
║                                                           ║
║   📡 Simulating ESP32 & Smart Shoe Data                  ║
║   🔐 JWT Authentication Enabled                          ║
║   ✅ Ready to connect with frontend                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  console.log('\n🔐 Authentication Endpoints:');
  console.log('   POST /api/auth/register - Create new account');
  console.log('   POST /api/auth/login - Login');
  console.log('   POST /api/auth/logout - Logout');
  console.log('   GET  /api/auth/verify - Verify token');
  console.log('   POST /api/auth/change-password - Change password');
  
  console.log('\n📋 Available API Endpoints (Protected):');
  console.log('   GET  /api/user');
  console.log('   GET  /api/device/status');
  console.log('   GET  /api/activity');
  console.log('   GET  /api/activity/weekly');
  console.log('   GET  /api/activity/heatmap');
  console.log('   GET  /api/health');
  console.log('   GET  /api/health/heartrate/history');
  console.log('   GET  /api/fallrisk');
  console.log('   GET  /api/alerts');
  console.log('   GET  /api/falls');
  console.log('   GET  /api/medications');
  console.log('   GET  /api/exercises');
  console.log('   GET  /api/weather');
  console.log('   GET  /api/social');
  console.log('   GET  /api/achievements');
  console.log('   GET  /api/settings');
  console.log('   GET  /api/dashboard (all data)');
  console.log('   POST /api/emergency/sos');
  console.log('\n🔄 Real-time updates via WebSocket every 2 seconds');
  console.log('\n👤 Demo Credentials:');
  console.log('   Email: marie.joubert@email.com');
  console.log('   Email: demo@safestep.com');
  console.log('   Password: Password123!\n');
});
