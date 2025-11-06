import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import PaystackCIVProvider from "./providers/paystack-civ";

// Export using ModuleProvider for Medusa v2.x payment module integration
// This matches the official medusa-payment-paystack implementation
export default ModuleProvider(Modules.PAYMENT, {
  services: [PaystackCIVProvider],
});

export { PaystackCIVProvider };
export type { PaystackCIVOptions as PluginOptions } from "./types";
