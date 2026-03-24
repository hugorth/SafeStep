# 👟 SafeStep

SafeStep est une application mobile pensée pour les personnes âgées portant des **chaussures connectées**. L'idée de départ est simple : comment aider quelqu'un à rester autonome tout en donnant à ses proches la certitude qu'en cas de problème, ils seront alertés immédiatement ?

Le résultat, c'est une app qui tourne en temps réel — elle reçoit les données des capteurs intégrés dans les chaussures (capteurs de pression, accéléromètre, GPS) et les présente de manière claire, aussi bien pour l'utilisateur que pour sa famille ou son médecin.

---

## Pourquoi ce projet ?

Les chutes sont la première cause d'accidents graves chez les personnes âgées. Pourtant, dans beaucoup de cas, le problème n'est pas la chute en elle-même — c'est le temps qui passe avant que quelqu'un intervienne.

SafeStep cherche à résoudre ça. Dès qu'une chute est détectée, les contacts d'urgence sont notifiés avec la localisation GPS en temps réel. Et en amont, l'app surveille la démarche pour signaler si le risque de chute augmente, avant que l'accident arrive.

---

## Ce que ça fait concrètement

- **Détection de chutes** automatique, avec analyse de la sévérité et timeline de l'événement (vitesse au moment de la chute, force d'impact, temps au sol)
- **SOS en un tap** — un bouton d'urgence avec 5 secondes pour annuler, qui déclenche un appel aux secours et envoie un SMS de localisation aux contacts enregistrés
- **Suivi de la démarche** — score de risque de chute hebdomadaire, graphique de stabilité, conseils personnalisés
- **Constantes vitales** — fréquence cardiaque, tension, SpO2, température
- **Rappels médicaments** — planning quotidien avec confirmation de prise
- **Localisation GPS live** — position affichée sur une carte, partagée en cas d'urgence
- **Météo & sécurité extérieure** — l'app prévient si les conditions dehors augmentent le risque (sol glissant, faible visibilité...)
- **Programme d'exercices** — séances adaptées avec suivi de progression sur la semaine
- **Classement entre amis** — un petit côté gamification pour encourager à marcher plus

---

## Stack technique

Le frontend est un **fichier HTML unique** — pas de bundler, pas de `npm install`, on ouvre dans le navigateur et ça tourne. Sous le capot c'est React 18 avec Tailwind CSS, compilé à la volée par Babel.

Le backend tourne en Node.js sur le port 3001 et expose une API REST + un serveur WebSocket pour les mises à jour en temps réel.

```
Frontend  →  React 18 + Tailwind CSS (single HTML file)
Backend   →  Node.js + Express + WebSocket
Auth      →  JWT (access token 15min + refresh token)
Realtime  →  WebSocket (mise à jour toutes les 30s + alertes instantanées)
```

---

## Lancer le projet

```bash
# 1. Cloner
git clone https://github.com/your-org/safestep.git
cd safestep

# 2. Démarrer le backend
cd backend && npm install && npm start

# 3. Ouvrir le frontend
open frontend/index.html
# ou : npx serve frontend/
```

Un compte de démo est disponible si le backend est seedé :

```
Email    : marie.joubert@email.com
Mot de passe : Password123!
```

---

## Configuration

Si le backend tourne ailleurs qu'en local, deux lignes à changer dans `index.html` :

```js
const API_CONFIG = {
  BASE_URL: 'http://localhost:3001/api',
  WS_URL:   'ws://localhost:3001'
};
```

---

## Structure du projet

```
safestep/
├── frontend/
│   └── index.html       # Toute l'app React
└── backend/
    ├── routes/           # auth, dashboard, health, alerts, emergency...
    └── server.js         # Express + WebSocket
```

---

C'est un projet en cours. Les PR sont les bienvenues.