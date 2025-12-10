#!/bin/bash

# 🚀 SafeStep Quick Start Guide
# Ce script lance le backend et ouvre le frontend

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🦿 SafeStep - Quick Start                              ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé."
    echo "📥 Installez Node.js depuis https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Aller dans le dossier backend
cd "$(dirname "$0")/backend"

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo ""
fi

# Démarrer le serveur en arrière-plan
echo "🚀 Démarrage du backend SafeStep..."
node server.js &
SERVER_PID=$!

# Attendre que le serveur démarre
sleep 3

# Vérifier que le serveur est en cours
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Backend démarré avec succès!"
    echo "🌐 API: http://localhost:3001"
    echo "🔌 WebSocket: ws://localhost:3001"
    echo ""
    echo "📱 Ouverture du frontend..."
    sleep 1
    
    # Ouvrir le frontend
    cd ..
    open safestepV3-connected.html
    
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║   ✨ SafeStep est maintenant en cours d'exécution!       ║"
    echo "║                                                           ║"
    echo "║   👉 Regardez le badge en haut à droite :                ║"
    echo "║      🟢 Backend Connected = Tout fonctionne!             ║"
    echo "║                                                           ║"
    echo "║   📊 Les données se mettent à jour en temps réel         ║"
    echo "║   🚨 La détection de chute est active                    ║"
    echo "║   🆘 Le bouton SOS est fonctionnel                       ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "📝 Pour arrêter le serveur, tapez: kill $SERVER_PID"
    echo "   ou fermez ce terminal"
    echo ""
    
    # Garder le script en cours pour voir les logs
    wait $SERVER_PID
else
    echo "❌ Erreur lors du démarrage du serveur"
    exit 1
fi
