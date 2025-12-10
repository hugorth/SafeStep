// SafeStep API Client
// Configuration de l'API backend

const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  WS_URL: 'ws://localhost:3001'
};

// WebSocket singleton
let wsConnection = null;
let wsCallbacks = {
  onRealtimeUpdate: null,
  onFallDetected: null,
  onNewAlert: null,
  onSOSActivated: null,
  onMedicationTaken: null
};

// Initialize WebSocket connection
function initWebSocket() {
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    return wsConnection;
  }

  wsConnection = new WebSocket(API_CONFIG.WS_URL);

  wsConnection.onopen = () => {
    console.log('✅ Connected to SafeStep backend');
  };

  wsConnection.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'realtime_update':
          if (wsCallbacks.onRealtimeUpdate) {
            wsCallbacks.onRealtimeUpdate(data.data);
          }
          break;
        case 'fall_detected':
          if (wsCallbacks.onFallDetected) {
            wsCallbacks.onFallDetected(data.data);
          }
          break;
        case 'new_alert':
          if (wsCallbacks.onNewAlert) {
            wsCallbacks.onNewAlert(data.data);
          }
          break;
        case 'sos_activated':
          if (wsCallbacks.onSOSActivated) {
            wsCallbacks.onSOSActivated(data.data);
          }
          break;
        case 'medication_taken':
          if (wsCallbacks.onMedicationTaken) {
            wsCallbacks.onMedicationTaken(data.data);
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  wsConnection.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };

  wsConnection.onclose = () => {
    console.log('❌ Disconnected from backend');
    // Reconnect after 5 seconds
    setTimeout(initWebSocket, 5000);
  };

  return wsConnection;
}

// API Helper function
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// API Methods
const SafeStepAPI = {
  // WebSocket
  connect: () => initWebSocket(),
  
  onRealtimeUpdate: (callback) => {
    wsCallbacks.onRealtimeUpdate = callback;
  },
  
  onFallDetected: (callback) => {
    wsCallbacks.onFallDetected = callback;
  },
  
  onNewAlert: (callback) => {
    wsCallbacks.onNewAlert = callback;
  },
  
  onSOSActivated: (callback) => {
    wsCallbacks.onSOSActivated = callback;
  },
  
  onMedicationTaken: (callback) => {
    wsCallbacks.onMedicationTaken = callback;
  },

  // User
  getUser: () => apiRequest('/user'),
  updateUser: (userData) => apiRequest('/user', {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),

  // Device
  getDeviceStatus: () => apiRequest('/device/status'),

  // Activity
  getActivity: () => apiRequest('/activity'),
  getWeeklyActivity: () => apiRequest('/activity/weekly'),
  getActivityHeatmap: () => apiRequest('/activity/heatmap'),

  // Health
  getHealth: () => apiRequest('/health'),
  getHeartRateHistory: () => apiRequest('/health/heartrate/history'),

  // Fall Risk
  getFallRisk: () => apiRequest('/fallrisk'),

  // Alerts
  getAlerts: (type = 'all', limit = null) => {
    let query = `?type=${type}`;
    if (limit) query += `&limit=${limit}`;
    return apiRequest(`/alerts${query}`);
  },
  createAlert: (alertData) => apiRequest('/alerts', {
    method: 'POST',
    body: JSON.stringify(alertData)
  }),

  // Falls
  getFalls: () => apiRequest('/falls'),
  getFallDetails: (fallId) => apiRequest(`/falls/${fallId}`),

  // Medications
  getMedications: () => apiRequest('/medications'),
  takeMedication: (medId, time) => apiRequest(`/medications/${medId}/take`, {
    method: 'POST',
    body: JSON.stringify({ time })
  }),

  // Exercises
  getExercises: () => apiRequest('/exercises'),
  completeExercise: (exerciseId, dayIndex) => apiRequest(`/exercises/${exerciseId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ dayIndex })
  }),

  // Weather
  getWeather: () => apiRequest('/weather'),

  // Social
  getSocial: () => apiRequest('/social'),

  // Achievements
  getAchievements: () => apiRequest('/achievements'),

  // Settings
  getSettings: () => apiRequest('/settings'),
  updateSettings: (settings) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),

  // Emergency
  activateSOS: () => apiRequest('/emergency/sos', {
    method: 'POST'
  }),

  // Dashboard (all data)
  getDashboard: () => apiRequest('/dashboard'),

  // Location
  getLocation: () => apiRequest('/location')
};

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.SafeStepAPI = SafeStepAPI;
}
