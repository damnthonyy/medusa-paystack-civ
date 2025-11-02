# Guide de Test pour @medusa-payment/paystack-civ

Ce guide explique comment tester le module Paystack CIV dans différents environnements.

## 🧪 Tests Locaux

### 1. Test du Build

Vérifiez que le code compile correctement :

```bash
npm run build
```

Cela devrait créer un dossier `dist/` avec les fichiers compilés sans erreurs.

### 2. Test dans un Projet Medusa

#### A. Préparation

1. **Dans votre projet Medusa** (celui qui utilise ce module), créez un lien symbolique :

```bash
# Dans le répertoire du module paystack-civ
npm link

# Dans votre projet Medusa
npm link @medusa-payment/paystack-civ
```

**OU** installez directement depuis le chemin local :

```bash
# Dans votre projet Medusa
npm install /Users/user/Documents/medusa-paystack-civ
```

2. **Configurez votre `medusa-config.ts`** :

```typescript
import { defineConfig } from '@medusajs/framework/utils';
import { PaystackCIVProvider } from '@medusa-payment/paystack-civ';

export default defineConfig({
  projectConfig: {
    // ... votre configuration
  },
  paymentProviders: [
    {
      resolve: PaystackCIVProvider,
      options: {
        secret_key: process.env.PAYSTACK_SECRET_KEY!,
        public_key: process.env.PAYSTACK_PUBLIC_KEY!,
        test_mode: process.env.PAYSTACK_TEST_MODE === "true",
      },
    },
  ],
});
```

3. **Ajoutez les variables d'environnement** dans votre `.env` :

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_TEST_MODE=true
```

#### B. Test via le Dashboard Admin

1. Démarrez votre serveur Medusa :
```bash
npm run dev
```

2. Connectez-vous au dashboard : `http://localhost:9000/app`

3. Allez dans **Settings** → **Payment Providers**

4. Trouvez **Paystack CIV** et activez-le

5. Configurez les clés API si nécessaire

#### C. Test via l'API

1. **Créer un panier** :
```bash
curl -X POST http://localhost:9000/store/carts \
  -H "Content-Type: application/json" \
  -d '{
    "region_id": "VOTRE_REGION_ID"
  }'
```

2. **Ajouter des produits au panier**

3. **Créer une session de paiement avec Paystack** :
```bash
curl -X POST http://localhost:9000/store/carts/{cart_id}/payment-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": "paystack-civ"
  }'
```

4. **Récupérer l'URL d'autorisation** :
```bash
curl http://localhost:9000/store/carts/{cart_id}/payment-session
```

5. **Tester le paiement** :
   - Utilisez les [cartes de test Paystack](https://paystack.com/docs/payments/test-payments)
   - Exemple pour une transaction réussie :
     - Numéro de carte : `4084084084084081`
     - CVV : `408`
     - Expiration : n'importe quelle date future

## 🔬 Tests Unitaires

### Installation des dépendances de test

```bash
npm install --save-dev jest @types/jest ts-jest
```

### Création des tests

Créez un fichier `src/providers/paystack-civ.test.ts` :

```typescript
import PaystackCIVProvider from './paystack-civ';

describe('PaystackCIVProvider', () => {
  const mockOptions = {
    secret_key: 'sk_test_xxxxxxxxxxxxx',
    public_key: 'pk_test_xxxxxxxxxxxxx',
    test_mode: true,
  };

  const mockContainer = {};

  let provider: PaystackCIVProvider;

  beforeEach(() => {
    provider = new PaystackCIVProvider(mockContainer, mockOptions);
  });

  test('should have correct identifier', () => {
    expect(PaystackCIVProvider.identifier).toBe('paystack-civ');
  });

  // Ajoutez d'autres tests ici
});
```

### Lancer les tests

```bash
npm test
```

## 🌐 Tests avec Webhooks

### 1. Utiliser ngrok pour les webhooks locaux

```bash
# Installer ngrok
npm install -g ngrok

# Exposer votre serveur local
ngrok http 9000
```

### 2. Configurer le webhook dans Paystack

1. Allez dans votre [Dashboard Paystack](https://dashboard.paystack.com/)
2. **Settings** → **API Keys & Webhooks**
3. Ajoutez l'URL : `https://xxxx.ngrok.io/webhooks/paystack-civ`
4. Sélectionnez les événements :
   - `charge.success`
   - `charge.failed`

### 3. Tester le webhook

Utilisez [Paystack's webhook tester](https://dashboard.paystack.com/#/settings/webhooks) ou créez une transaction de test et vérifiez que le webhook est reçu.

## ✅ Checklist de Tests

- [ ] Le build fonctionne sans erreurs
- [ ] Le provider s'enregistre correctement dans Medusa
- [ ] Le provider apparaît dans le dashboard admin
- [ ] Création d'une session de paiement réussie
- [ ] Récupération de l'URL d'autorisation Paystack
- [ ] Test d'un paiement réussi avec une carte de test
- [ ] Test d'un paiement échoué
- [ ] Vérification du statut d'une transaction
- [ ] Test d'un remboursement
- [ ] Réception et traitement d'un webhook `charge.success`
- [ ] Réception et traitement d'un webhook `charge.failed`

## 🐛 Débogage

### Activer les logs détaillés

Dans votre `medusa-config.ts`, vous pouvez ajouter un logger :

```typescript
import { Logger } from '@medusajs/framework/types';

// Dans votre provider ou votre code de test
const logger = container.logger;
logger.info('Paystack CIV Provider initialized');
```

### Vérifier les erreurs courantes

1. **Erreur "Provider not found"** :
   - Vérifiez que le module est bien installé
   - Vérifiez que le provider est bien enregistré dans `medusa-config.ts`

2. **Erreur "Invalid API key"** :
   - Vérifiez vos clés API dans le `.env`
   - Assurez-vous d'utiliser les clés de test en mode développement

3. **Erreur "Transaction not found"** :
   - Vérifiez que la référence de transaction est correcte
   - Assurez-vous que la transaction existe dans Paystack

## 📚 Ressources

- [Documentation Paystack - Test Payments](https://paystack.com/docs/payments/test-payments)
- [Documentation Medusa - Payment Providers](https://docs.medusajs.com/resources/commerce-modules/payment)
- [Cartes de test Paystack](https://paystack.com/docs/payments/test-payments)

