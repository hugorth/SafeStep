#!/bin/bash

# SafeStep - Script de Démarrage Rapide
# Ce script démarre le serveur de développement

echo "🚀 Démarrage de SafeStep..."
echo ""

# Vérifier si Python est installé
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 détecté"
    echo "📂 Démarrage du serveur sur http://localhost:8000"
    echo ""
    echo "🌐 Ouvrez votre navigateur à l'adresse:"
    echo "   http://localhost:8000/index-modular.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    python3 -m http.server 8000
    
elif command -v python &> /dev/null; then
    echo "✅ Python détecté"
    echo "📂 Démarrage du serveur sur http://localhost:8000"
    echo ""
    echo "🌐 Ouvrez votre navigateur à l'adresse:"
    echo "   http://localhost:8000/index-modular.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    python -m SimpleHTTPServer 8000
    
else
    echo "❌ Python n'est pas installé"
    echo ""
    echo "Options alternatives:"
    echo "1. Installez Python: https://www.python.org/downloads/"
    echo "2. Utilisez Node.js: npx http-server -p 8000"
    echo "3. Utilisez VS Code Live Server extension"
    exit 1
fi
