import { ModuleProvider } from "@medusajs/framework/utils";
import { Modules } from "@medusajs/utils";
import PaystackCIVProvider from "./providers/paystack-civ";

// Export using ModuleProvider for Medusa v2.x payment module integration
const PaystackCIVModuleProvider = ModuleProvider(Modules.PAYMENT, {
  services: [PaystackCIVProvider],
});

export default PaystackCIVModuleProvider;
export { PaystackCIVProvider };
export * from "./types";
