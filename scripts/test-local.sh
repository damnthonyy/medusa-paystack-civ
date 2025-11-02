#!/bin/bash

# Script pour tester le module localement dans un projet Medusa

echo "🧪 Test du module Paystack CIV"
echo "================================"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: package.json introuvable. Exécutez ce script depuis la racine du projet."
  exit 1
fi

# Étape 1: Build
echo "📦 Étape 1: Build du module..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors du build"
  exit 1
fi

echo "✅ Build réussi"
echo ""

# Étape 2: Créer un lien npm
echo "🔗 Étape 2: Création du lien npm..."
npm link

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la création du lien npm"
  exit 1
fi

echo "✅ Lien npm créé"
echo ""
echo "📝 Instructions:"
echo "   Dans votre projet Medusa, exécutez:"
echo "   npm link @medusa-payment/paystack-civ"
echo ""
echo "   Puis ajoutez le provider dans votre medusa-config.ts:"
echo "   import { PaystackCIVProvider } from '@medusa-payment/paystack-civ';"
echo ""
echo "   Et dans paymentProviders:"
echo "   {"
echo "     resolve: PaystackCIVProvider,"
echo "     options: {"
echo "       secret_key: process.env.PAYSTACK_SECRET_KEY!,"
echo "       public_key: process.env.PAYSTACK_PUBLIC_KEY!,"
echo "       test_mode: true,"
echo "     },"
echo "   }"

