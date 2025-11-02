import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { MedusaError } from "@medusajs/framework/utils";
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/types";
import axios, { AxiosInstance } from "axios";
import type {
  PaystackCIVOptions,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaystackWebhookEvent,
} from "../types";

class PaystackCIVProvider extends AbstractPaymentProvider<PaystackCIVOptions> {
  static identifier = "paystack-civ";
  private client: AxiosInstance;
  private options: PaystackCIVOptions;

  constructor(container: Record<string, unknown>, options: PaystackCIVOptions) {
    super(container, options);
    this.options = options;

    // Base URL for Paystack API
    const baseURL = "https://api.paystack.co";

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${options.secret_key}`,
        "Content-Type": "application/json",
      },
    });
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const reference = input.data?.reference as string | undefined;

    if (!reference) {
      return {
        status: "error",
        data: {},
      };
    }

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${reference}`
      );

      const { data } = response.data;

      let status: "authorized" | "pending" | "requires_more" | "error" | "canceled" = "error";
      
      if (data.status === "success") {
        status = "authorized";
      } else if (data.status === "pending") {
        status = "pending";
      }

      return {
        status,
        data: {
          reference: data.reference,
          status: data.status,
        },
      };
    } catch (error) {
      return {
        status: "error",
        data: {},
      };
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { currency_code, amount, context: paymentContext } = input;

    try {
      // Generate unique reference
      const reference = `medusa_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Convert amount to kobo (Paystack's smallest currency unit for Naira) or smallest unit for XOF
      // XOF doesn't have decimals, so we keep the amount as is
      const amountValue = typeof amount === "string" ? parseFloat(amount) : Number(amount);
      const amount_in_smallest_unit = currency_code?.toUpperCase() === "XOF" 
        ? Math.round(amountValue)
        : Math.round(amountValue * 100); // For currencies with decimals like NGN

      const payload = {
        email: paymentContext?.customer?.email || "customer@example.com",
        amount: amount_in_smallest_unit,
        reference,
        currency: currency_code?.toUpperCase() || "XOF", // XOF for West African CFA franc (Côte d'Ivoire)
        callback_url: input.data?.success_url as string | undefined || input.data?.return_url as string | undefined,
        metadata: {
          order_id: input.data?.id as string | undefined,
          customer_id: paymentContext?.customer?.id,
          cart_id: input.data?.cart_id as string | undefined,
        },
        channels: [
          "card",
          "bank",
          "ussd",
          "qr",
          "mobile_money",
          "bank_transfer",
        ],
      };

      const response = await this.client.post<PaystackInitializeResponse>(
        "/transaction/initialize",
        payload
      );

      if (!response.data.status) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Failed to initialize payment: ${response.data.message}`
        );
      }

      return {
        id: response.data.data.reference,
        status: "pending",
        data: {
          reference: response.data.data.reference,
          access_code: response.data.data.access_code,
          authorization_url: response.data.data.authorization_url,
        },
      };
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error;
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error initiating payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const reference = input.data?.reference as string | undefined;

    if (!reference) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reference is missing"
      );
    }

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${reference}`
      );

      const { data } = response.data;

      if (data.status === "success") {
        // Convert amount back from smallest unit
        const amount = data.currency === "XOF" 
          ? data.amount 
          : data.amount / 100;

        return {
          status: "authorized",
          data: {
            reference: data.reference,
            authorization_code: data.authorization?.authorization_code,
            gateway_response: data.gateway_response,
            amount,
            currency: data.currency,
            paid_at: data.paid_at || data.transaction_date,
          },
        };
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        data.gateway_response || "Transaction failed"
      );
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error;
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error authorizing payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    // Paystack doesn't have a direct cancel endpoint for pending transactions
    // The payment will expire naturally or can be handled via webhook
    return {
      data: {
        reference: input.data?.reference as string,
        status: "canceled",
      },
    };
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // Paystack captures payment automatically on successful transaction
    // This method verifies the payment status
    const reference = input.data?.reference as string | undefined;

    if (!reference) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reference is missing"
      );
    }

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${reference}`
      );

      const { data } = response.data;

      if (data.status === "success") {
        // Convert amount back from smallest unit
        const amount = data.currency === "XOF" 
          ? data.amount 
          : data.amount / 100;

        return {
          data: {
            reference: data.reference,
            authorization_code: data.authorization?.authorization_code,
            gateway_response: data.gateway_response,
            amount,
            currency: data.currency,
            paid_at: data.paid_at || data.transaction_date,
          },
        };
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        data.gateway_response || "Transaction not successful"
      );
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error;
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error capturing payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    // Paystack doesn't require explicit deletion
    return {
      data: {},
    };
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const reference = input.data?.reference as string | undefined;
    const authorizationCode = input.data?.authorization_code as string | undefined;
    const refundAmount = typeof input.amount === "string" 
      ? parseFloat(input.amount) 
      : Number(input.amount);

    if (!reference && !authorizationCode) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reference or authorization code required"
      );
    }

    try {
      const currency = (input.data?.currency as string) || "XOF";
      // Convert to smallest unit for refund
      const amount_in_smallest_unit = currency === "XOF" 
        ? Math.round(refundAmount)
        : Math.round(refundAmount * 100);

      const payload: any = {
        transaction: reference || authorizationCode,
        amount: amount_in_smallest_unit,
        currency,
      };

      const response = await this.client.post("/refund", payload);

      if (!response.data.status) {
        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Refund failed: ${response.data.message}`
        );
      }

      return {
        data: {
          reference: response.data.data.transaction.reference,
          refund_id: response.data.data.id.toString(),
          refund_amount: refundAmount,
          status: "refunded",
        },
      };
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error;
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error refunding payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const reference = input.data?.reference as string | undefined;

    if (!reference) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reference is missing"
      );
    }

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${reference}`
      );

      const { data } = response.data;
      
      // Convert amount back from smallest unit
      const amount = data.currency === "XOF" 
        ? data.amount 
        : data.amount / 100;

      return {
        data: {
          reference: data.reference,
          authorization_code: data.authorization?.authorization_code,
          gateway_response: data.gateway_response,
          amount,
          currency: data.currency,
          status: data.status,
          paid_at: data.paid_at || data.transaction_date,
          created_at: data.created_at || data.transaction_date,
          channel: data.channel,
        },
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Error retrieving payment: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Paystack doesn't support updating transactions, so we initiate a new one
    // But we need to adapt the input format
    const initiateInput: InitiatePaymentInput = {
      amount: input.amount,
      currency_code: input.currency_code,
      context: input.context,
      data: input.data,
    };
    
    const result = await this.initiatePayment(initiateInput);
    
    return {
      status: result.status,
      data: result.data,
    };
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const event = payload as unknown as PaystackWebhookEvent;

    if (event.event === "charge.success") {
      const data = event.data;

      // Convert amount back from smallest unit
      const amount = data.currency === "XOF" 
        ? data.amount 
        : data.amount / 100;

      return {
        action: "authorized",
        data: {
          session_id: data.reference,
          amount: amount,
        },
      };
    }

    if (event.event === "charge.failed") {
      return {
        action: "failed",
        data: {
          session_id: event.data.reference,
          amount: 0,
        },
      };
    }

    return {
      action: "not_supported",
    };
  }
}

export default PaystackCIVProvider;
