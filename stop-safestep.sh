#!/bin/bash

# 🛑 SafeStep Stop Script
# Ce script arrête proprement le backend SafeStep

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🛑 SafeStep - Stop Server                              ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Trouver le processus Node.js sur le port 3001
echo "🔍 Recherche du processus SafeStep..."

# Méthode 1: Par port
PID=$(lsof -t -i:3001 2>/dev/null)

if [ -n "$PID" ]; then
    echo "✅ Processus trouvé (PID: $PID)"
    echo "🛑 Arrêt du serveur..."
    kill $PID
    sleep 2
    
    # Vérifier si le processus est toujours actif
    if kill -0 $PID 2>/dev/null; then
        echo "⚠️  Arrêt forcé..."
        kill -9 $PID
    fi
    
    echo "✅ Serveur arrêté avec succès!"
else
    echo "ℹ️  Aucun serveur SafeStep en cours d'exécution sur le port 3001"
fi

# Nettoyer les processus Node.js orphelins liés à SafeStep
echo ""
echo "🧹 Nettoyage des processus Node.js liés à SafeStep..."

# Chercher les processus node qui exécutent server.js dans le dossier backend
PIDS=$(pgrep -f "node.*server.js" 2>/dev/null)

if [ -n "$PIDS" ]; then
    echo "🔧 Nettoyage des processus orphelins..."
    for pid in $PIDS; do
        # Vérifier si le PID existe encore
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null && echo "  ✓ Processus $pid arrêté"
        fi
    done
    echo "✅ Processus nettoyés"
else
    echo "ℹ️  Aucun processus à nettoyer"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ✅ Arrêt terminé!                                      ║"
echo "║                                                           ║"
echo "║   💡 Pour redémarrer:                                    ║"
echo "║      ./start-safestep.sh                                 ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
