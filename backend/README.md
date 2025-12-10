# SafeStep Backend - Simulateur ESP32

Backend complet simulant les données de la chaussure SafeStep et de l'ESP32.

## 🚀 Démarrage rapide

### Installation
```bash
cd backend
npm install
```

### Lancement du serveur
```bash
npm start
```

Le serveur démarre sur `http://localhost:3001`

### Mode développement (avec auto-reload)
```bash
npm run dev
```

## 📡 API Endpoints

### Utilisateur
- `GET /api/user` - Informations utilisateur
- `PUT /api/user` - Mettre à jour l'utilisateur

### Appareil
- `GET /api/device/status` - Statut de l'appareil (batterie, capteurs, etc.)

### Activité
- `GET /api/activity` - Données d'activité en temps réel
- `GET /api/activity/weekly` - Données hebdomadaires
- `GET /api/activity/heatmap` - Carte de chaleur d'activité

### Santé
- `GET /api/health` - Métriques de santé
- `GET /api/health/heartrate/history` - Historique du rythme cardiaque (24h)

### Risque de chute
- `GET /api/fallrisk` - Évaluation du risque de chute

### Alertes
- `GET /api/alerts?type=all&limit=10` - Liste des alertes
- `POST /api/alerts` - Créer une nouvelle alerte

### Chutes
- `GET /api/falls` - Historique des chutes
- `GET /api/falls/:id` - Détails d'une chute spécifique

### Médicaments
- `GET /api/medications` - Liste des médicaments
- `POST /api/medications/:id/take` - Marquer un médicament comme pris

### Exercices
- `GET /api/exercises` - Programme d'exercices
- `POST /api/exercises/:id/complete` - Marquer un exercice comme terminé

### Météo
- `GET /api/weather` - Données météo et alertes environnementales

### Social
- `GET /api/social` - Classement et communauté

### Accomplissements
- `GET /api/achievements` - Liste des accomplissements

### Paramètres
- `GET /api/settings` - Paramètres utilisateur
- `PUT /api/settings` - Mettre à jour les paramètres

### Urgence
- `POST /api/emergency/sos` - Activer l'alerte SOS

### Dashboard
- `GET /api/dashboard` - Toutes les données clés en un seul appel

## 🔌 WebSocket

Le serveur WebSocket est disponible sur `ws://localhost:3001`

### Messages reçus automatiquement :
- `realtime_update` - Mises à jour toutes les 2 secondes (activité, capteurs, santé)
- `fall_detected` - Alerte de chute détectée
- `new_alert` - Nouvelle alerte
- `sos_activated` - SOS activé
- `medication_taken` - Médicament pris

### Messages à envoyer :
```javascript
// Ping
{ "type": "ping" }

// Demander une mise à jour
{ "type": "request_update" }
```

## 🎯 Données simulées

Le backend simule en temps réel :

### 📊 Capteurs de la chaussure
- **Capteurs de pression** (6 zones par chaussure)
- **Accéléromètre** (x, y, z)
- **Gyroscope** (x, y, z)
- **Température**
- **Batterie** (drainage progressif)

### 🚶 Activité
- **Pas** (incrémentation aléatoire)
- **Distance** (calculée)
- **Calories** (calculées)
- **Cadence** (pas/minute)
- **Vitesse de marche**
- **Longueur de foulée**
- **Symétrie**
- **Stabilité**

### ❤️ Santé
- **Rythme cardiaque** (variation réaliste)
- **Pression artérielle**
- **Oxygène sanguin**
- **Température corporelle**
- **Niveau de stress**

### ⚠️ Détection de chute
- Détection automatique aléatoire (très rare)
- Impact en G-force
- Temps au sol
- Timeline complète
- Réponse d'urgence

### 💊 Médicaments
- 4 médicaments avec horaires
- Suivi des prises
- Rappels automatiques

### 🏋️ Exercices
- 4 programmes d'exercices
- Suivi hebdomadaire
- Difficulté et durée

### 🌤️ Météo
- Conditions actuelles
- Prévisions
- Alertes environnementales

### 🏆 Gamification
- Classement entre amis
- Accomplissements
- Progression

## 📱 Exemple d'utilisation avec le frontend

```javascript
// Connexion WebSocket
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'realtime_update':
      // Mettre à jour l'interface
      updateUI(data.data);
      break;
      
    case 'fall_detected':
      // Afficher alerte de chute
      showFallAlert(data.data);
      break;
  }
};

// Récupérer les données du dashboard
fetch('http://localhost:3001/api/dashboard')
  .then(res => res.json())
  .then(data => {
    console.log('Dashboard data:', data);
  });

// Activer SOS
fetch('http://localhost:3001/api/emergency/sos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(res => res.json())
  .then(data => {
    console.log('SOS activated:', data);
  });
```

## 🔧 Configuration

Le serveur utilise le port **3001** par défaut. Pour changer :

```bash
PORT=8080 npm start
```

## 📝 Notes

- Les données sont réinitialisées à chaque redémarrage du serveur
- La détection de chute est simulée aléatoirement (très rare pour éviter les fausses alertes)
- Les mises à jour en temps réel sont envoyées toutes les 2 secondes via WebSocket
- L'historique du rythme cardiaque est conservé pour 24h (144 points)
- La batterie se décharge lentement de manière réaliste

## 🎨 Intégration avec le frontend

Le backend est conçu pour fonctionner parfaitement avec `safestepV3.html`. 

### Prochaines étapes :
1. Modifier le frontend pour appeler les API au lieu d'utiliser des données statiques
2. Intégrer WebSocket pour les mises à jour en temps réel
3. Remplacer les données fictives par les appels API

Une fois la vraie chaussure SafeStep connectée, il suffira de remplacer les données simulées par les vraies données de l'ESP32, sans changer l'API !
