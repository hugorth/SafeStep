/**
 * deviceService.js
 * Stocke les dernières données reçues de la vraie chaussure en mémoire.
 * Fournit un hook pour broadcaster via WebSocket et track l'état BLE.
 */

let latestSensorData = null;
let broadcastFn = null;
let getConnectedUserIdsFn = null;
let bleConnected = false;
let disconnectTimer = null;

// Si aucune donnée reçue depuis X ms → on considère la chaussure déconnectée
const BLE_TIMEOUT_MS = 15000;

function scheduleDisconnectTimeout() {
  if (disconnectTimer) clearTimeout(disconnectTimer);
  disconnectTimer = setTimeout(() => {
    if (bleConnected) {
      bleConnected = false;
      console.log('⏱️  Timeout BLE — aucune donnée depuis 15s, chaussure déconnectée');
      if (broadcastFn) broadcastFn(null, { __type: 'bluetooth_disconnected' });
    }
  }, BLE_TIMEOUT_MS);
}

module.exports = {
  /**
   * Enregistre les nouvelles données capteurs reçues du navigateur (via BLE → frontend → API)
   * et les diffuse via WebSocket si un client est connecté.
   */
  setData(data, userId) {
    const wasConnected = bleConnected;
    bleConnected = true;

    latestSensorData = {
      ...data,
      source: 'real',
      timestamp: new Date()
    };

    // Remet le timer de timeout à zéro
    scheduleDisconnectTimeout();

    if (broadcastFn) {
      // Première connexion → notifier le front que la chaussure est connectée
      if (!wasConnected) {
        console.log('🔵 Chaussure BLE connectée — notification frontend');
        broadcastFn(null, { __type: 'bluetooth_connected' });
      }
      broadcastFn(userId, latestSensorData);
    }
  },

  /**
   * Marque la chaussure comme déconnectée et notifie le frontend.
   * Appelé explicitement par le gateway ou en cas de timeout.
   */
  setDisconnected() {
    if (disconnectTimer) clearTimeout(disconnectTimer);
    if (bleConnected) {
      bleConnected = false;
      console.log('🔴 Chaussure BLE déconnectée — notification frontend');
      if (broadcastFn) broadcastFn(null, { __type: 'bluetooth_disconnected' });
    }
  },

  /** Retourne true si la chaussure est actuellement connectée via BLE */
  isBleConnected() {
    return bleConnected;
  },

  /** Retourne la dernière donnée réelle, ou null si aucune n'a été reçue */
  getData() {
    return latestSensorData;
  },

  /** Enregistre la fonction de broadcast WebSocket (appelée depuis server.js) */
  setBroadcast(fn) {
    broadcastFn = fn;
  },

  /** Retourne la fonction de broadcast WebSocket */
  getBroadcast() {
    return broadcastFn;
  },

  /** Enregistre une fonction qui retourne les userId des clients WS connectés */
  setGetConnectedUserIds(fn) {
    getConnectedUserIdsFn = fn;
  },

  /** Retourne les userId des clients WS actuellement connectés */
  getConnectedUserIds() {
    return getConnectedUserIdsFn ? getConnectedUserIdsFn() : [];
  }
};
