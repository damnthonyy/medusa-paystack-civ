# medusa-paystack-civ

Module de paiement Paystack pour **Medusa.js v2.x** avec support spécifique pour la Côte d'Ivoire.

> ⚠️ **Important** : Ce module utilise le système de **modules** de Medusa v2.x.

## 🚀 Installation

```bash
npm install medusa-paystack-civ
# ou
yarn add medusa-paystack-civ
```

## 📋 Prérequis

- Medusa.js v2.11 ou supérieur
- Compte Paystack avec clés API (Secret Key et Public Key)
- Node.js >= 20

## ⚙️ Configuration

### 1. Ajouter le provider dans votre configuration Medusa

**Important** : Medusa v2.x utilise le système de **modules** au lieu des plugins. Modifiez votre fichier `medusa-config.ts` :

```typescript
import { defineConfig } from '@medusajs/framework/utils';
import { PaystackCIVProvider } from 'medusa-paystack-civ';

export default defineConfig({
  projectConfig: {
    // ... votre configuration existante
  },
  // Enregistrer le provider via le système de modules (Medusa v2.x)
  modules: [
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: PaystackCIVProvider,
            options: {
              secret_key: process.env.PAYSTACK_SECRET_KEY!,
              public_key: process.env.PAYSTACK_PUBLIC_KEY!,
              test_mode: process.env.PAYSTACK_TEST_MODE === "true", // true pour le mode test
            },
          },
        ],
      },
    },
    // ... autres modules de votre projet
  ],
});
```

### 2. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxx  # Votre clé secrète Paystack
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx  # Votre clé publique Paystack
PAYSTACK_TEST_MODE=true            # true pour le mode test, false pour la production
```

### 3. Obtenir vos clés API Paystack

1. Connectez-vous à votre [dashboard Paystack](https://dashboard.paystack.com/)
2. Allez dans **Settings** → **API Keys & Webhooks**
3. Copiez votre **Secret Key** et votre **Public Key**
4. Pour le mode test, utilisez les clés de test (commencent par `sk_test_` et `pk_test_`)
5. Pour la production, utilisez les clés live (commencent par `sk_live_` et `pk_live_`)

## 🔗 Configuration des Webhooks

Pour que Medusa reçoive les notifications de paiement de Paystack :

1. Dans votre dashboard Paystack, allez dans **Settings** → **API Keys & Webhooks**
2. Ajoutez une nouvelle URL de webhook :
   ```
   https://votre-domaine.com/webhooks/paystack-civ
   ```
3. Sélectionnez les événements suivants :
   - `charge.success`
   - `charge.failed`

### Configuration locale (développement)

Pour tester les webhooks en local, utilisez un service comme [ngrok](https://ngrok.com/) :

```bash
ngrok http 9000
```

Puis utilisez l'URL ngrok générée dans votre configuration Paystack :
```
https://xxxx.ngrok.io/webhooks/paystack-civ
```

## 💳 Modes de paiement supportés

Ce module supporte tous les canaux de paiement Paystack disponibles en Côte d'Ivoire :

- 💳 **Cartes bancaires** (Visa, Mastercard, etc.)
- 🏦 **Virements bancaires**
- 📱 **Mobile Money** (Orange Money, MTN Mobile Money, Moov Money)
- 📱 **USSD**
- 📱 **QR Code**

## 📝 Utilisation

### Activer le provider dans le Dashboard Admin

1. Connectez-vous à votre dashboard Medusa : `http://localhost:9000/app`
2. Allez dans **Settings** → **Payment Providers**
3. Trouvez **Paystack CIV** dans la liste
4. Cliquez sur **Enable**
5. Configurez les options si nécessaire

### Utilisation dans votre storefront

Le provider est automatiquement disponible via l'API Medusa. Lors de la création d'un panier, vous pouvez spécifier le provider :

```typescript
import Medusa from "@medusajs/medusa-js";

const medusa = new Medusa({ baseUrl: "http://localhost:9000" });

// Créer un panier avec Paystack comme méthode de paiement
const { cart } = await medusa.carts.create({
  region_id: "reg_xxxxx",
});

// Ajouter une méthode de paiement
await medusa.carts.setPaymentSession(cart.id, {
  provider_id: "paystack-civ",
});
```

## 🔍 Vérification des transactions

Vous pouvez vérifier le statut d'une transaction via l'API Paystack ou directement dans votre dashboard Paystack.

## 🛠️ Développement

### Installation des dépendances

```bash
npm install
```

### Build

```bash
npm run build
```

### Mode watch (développement)

```bash
npm run watch
```

## 🧪 Test Local dans un Projet Medusa

**Méthode rapide avec npm link :**

```bash
# 1. Dans ce repo, créer le lien
npm run build
npm link

# 2. Dans votre projet Medusa
npm link medusa-paystack-civ

# 3. Configurer dans medusa-config.ts
# 4. Redémarrer le serveur
```

## 🧪 Tests

### Tests Unitaires

```bash
# Lancer les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

### Tests d'Intégration

Les tests d'intégration doivent être effectués dans votre projet Medusa en utilisant l'API et le dashboard admin.

## 📚 Documentation Paystack

- [Documentation officielle Paystack](https://paystack.com/docs)
- [API Reference](https://paystack.com/docs/api)
- [Webhooks](https://paystack.com/docs/payments/webhooks)

## 📚 Documentation Medusa

- [Documentation Medusa v2 - Modules](https://docs.medusajs.com/learn/fundamentals/modules/overview)
- [Documentation Medusa v2 - Payment Module](https://docs.medusajs.com/resources/commerce-modules/payment)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

MIT

## 👤 Auteur

### Antoine Mahassadi / Halianx studio

## 🙏 Remerciements

- [Medusa.js](https://www.medusajs.com/) pour le framework e-commerce
- [Paystack](https://paystack.com/) pour la plateforme de paiement

## 🐛 Signaler un bug

Si vous rencontrez un problème, veuillez ouvrir une [issue](https://github.com/yourusername/medusa-paystack-civ/issues) sur GitHub.

## 💡 Support

Pour toute question ou assistance :
- Ouvrez une issue sur GitHub
- Consultez la [documentation Medusa](https://docs.medusajs.com/)
- Consultez la [documentation Paystack](https://paystack.com/docs)

---

**Note** : Ce module est spécialement conçu pour fonctionner avec les paiements en Côte d'Ivoire. Assurez-vous que votre compte Paystack est configuré pour accepter les paiements depuis la Côte d'Ivoire.
