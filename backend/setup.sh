#!/bin/bash

# 🚀 SafeStep Authentication System - Setup Script

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🔐 SafeStep - Authentication System Setup               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé."
    echo "📥 Installez Node.js depuis https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

echo "📦 Installation des dépendances npm..."
npm install

echo ""
echo "✅ Installation terminée!"
echo ""
echo "Pour démarrer:"
echo "  $ npm start"
echo ""
