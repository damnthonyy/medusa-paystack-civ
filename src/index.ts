import PaystackCIVProvider from "./providers/paystack-civ";

// Export the provider directly for Medusa v2.x payment module integration
// Payment providers should be exported directly, not wrapped in ModuleProvider
export default PaystackCIVProvider;
export { PaystackCIVProvider };
export * from "./types";
