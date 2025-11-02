/**
 * Exemple de configuration pour @medusa-payment/paystack-civ
 * 
 * Copiez ce contenu dans votre fichier medusa-config.ts
 */

import { defineConfig } from '@medusajs/framework/utils';
import { PaystackCIVProvider } from '@medusa-payment/paystack-civ';

export default defineConfig({
  projectConfig: {
    // ... votre configuration existante
    databaseUrl: process.env.DATABASE_URL!,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET!,
      cookieSecret: process.env.COOKIE_SECRET!,
    },
  },
  
  // Ajouter le provider Paystack CIV
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

/**
 * Variables d'environnement nécessaires (.env) :
 * 
 * PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
 * PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
 * PAYSTACK_TEST_MODE=true
 */
