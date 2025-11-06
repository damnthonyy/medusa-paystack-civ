import { AbstractPaymentProvider, MedusaError, PaymentSessionStatus } from "@medusajs/framework/utils";
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
    const paystackTxRef = (input.data as any)?.paystackTxRef as string | undefined;

    if (!paystackTxRef) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: {},
      };
    }

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${paystackTxRef}`
      );

      const { data } = response.data;

      let status: PaymentSessionStatus;
      
      switch (data.status) {
        case "success":
          status = PaymentSessionStatus.CAPTURED;
          break;
        case "pending":
          status = PaymentSessionStatus.PENDING;
          break;
        case "failed":
          status = PaymentSessionStatus.ERROR;
          break;
        default:
          status = PaymentSessionStatus.ERROR;
      }

      return {
        status,
        data: {
          paystackTxRef: data.reference,
          status: data.status,
        },
      };
    } catch (error) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: {},
      };
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { currency_code, amount, context: paymentContext, data: inputData } = input;
    const email = (inputData as any)?.email || paymentContext?.customer?.email;

    if (!email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Email is required to initiate a Paystack payment. Ensure you are providing the email in the data object when calling `initiatePaymentSession` in your Medusa storefront"
      );
    }

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
        email,
        amount: amount_in_smallest_unit,
        reference,
        currency: currency_code?.toUpperCase() || "XOF", // XOF for West African CFA franc (Côte d'Ivoire)
        callback_url: input.data?.success_url as string | undefined || input.data?.return_url as string | undefined,
        metadata: {
          session_id: (inputData as any)?.session_id,
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
        status: PaymentSessionStatus.PENDING,
        data: {
          paystackTxRef: response.data.data.reference,
          paystackTxAccessCode: response.data.data.access_code,
          paystackTxAuthorizationUrl: response.data.data.authorization_url,
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
    const paystackTxRef = (input.data as any)?.paystackTxRef as string | undefined;

    if (!paystackTxRef) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing paystackTxRef in payment data."
      );
    }

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${paystackTxRef}`
      );

      const { data } = response.data;

      switch (data.status) {
        case "success":
          // Successful transaction - Paystack captures automatically
          return {
            status: PaymentSessionStatus.CAPTURED,
            data: {
              ...(input.data || {}),
              paystackTxRef: data.reference,
              paystackTxData: data as any,
            },
          };
        case "failed":
          // Failed transaction
          return {
            status: PaymentSessionStatus.ERROR,
            data: {
              ...(input.data || {}),
              paystackTxRef: data.reference,
              paystackTxData: data as any,
            },
          };
        default:
          // Pending transaction
          return {
            status: PaymentSessionStatus.PENDING,
            data: {
              ...(input.data || {}),
              paystackTxRef: data.reference,
              paystackTxData: data as any,
            },
          };
      }
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
    const paystackTxRef = (input.data as any)?.paystackTxRef as string | undefined;
    return {
      data: {
        paystackTxRef: paystackTxRef || "",
      },
    };
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    // Paystack captures payment automatically on successful transaction
    // This method verifies the payment status - same as authorizePayment
    const authorizeResult = await this.authorizePayment({
      data: input.data,
    } as AuthorizePaymentInput);

    return {
      data: authorizeResult.data,
    };
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
    const paystackTxRef = (input.data as any)?.paystackTxRef as string | undefined;
    const paystackTxData = (input.data as any)?.paystackTxData as any;
    const authorizationCode = paystackTxData?.authorization?.authorization_code as string | undefined;
    
    const refundAmount = typeof input.amount === "string" 
      ? parseFloat(input.amount) 
      : Number(input.amount);

    if (!paystackTxRef && !authorizationCode) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Reference or authorization code required"
      );
    }

    try {
      const currency = (input.data?.currency as string) || paystackTxData?.currency || "XOF";
      // Convert to smallest unit for refund
      const amount_in_smallest_unit = currency === "XOF" 
        ? Math.round(refundAmount)
        : Math.round(refundAmount * 100);

      const payload: any = {
        transaction: paystackTxRef || authorizationCode,
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
          paystackTxRef: response.data.data.transaction.reference,
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
    const paystackTxRef = (input.data as any)?.paystackTxRef as string | undefined;

    if (!paystackTxRef) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing paystackTxRef in payment data."
      );
    }

    try {
      const response = await this.client.get<PaystackVerifyResponse>(
        `/transaction/verify/${paystackTxRef}`
      );

      const { data } = response.data;
      
      // Convert amount back from smallest unit
      const amount = data.currency === "XOF" 
        ? data.amount 
        : data.amount / 100;

      return {
        data: {
          paystackTxRef: data.reference,
          paystackTxData: data as any,
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
