import PaystackCIVProvider from '../paystack-civ';
import type { PaystackCIVOptions } from '../../types';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaystackCIVProvider', () => {
  const mockOptions: PaystackCIVOptions = {
    secret_key: 'sk_test_xxxxxxxxxxxxx',
    public_key: 'pk_test_xxxxxxxxxxxxx',
    test_mode: true,
  };

  const mockContainer: Record<string, unknown> = {};

  let provider: PaystackCIVProvider;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock axios.create
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };
    mockedAxios.create = jest.fn(() => mockAxiosInstance as any);
    mockedAxios.isAxiosError = jest.fn((payload: any) => false) as any;

    provider = new PaystackCIVProvider(mockContainer, mockOptions);
  });

  describe('Initialization', () => {
    it('should have correct identifier', () => {
      expect(PaystackCIVProvider.identifier).toBe('paystack-civ');
    });

    it('should initialize with options', () => {
      expect(provider).toBeInstanceOf(PaystackCIVProvider);
    });
  });

  describe('initiatePayment', () => {
    it('should initialize payment successfully', async () => {
      const mockResponse = {
        data: {
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://paystack.com/pay/test',
            access_code: 'test_access_code',
            reference: 'test_reference',
          },
        },
      };

      // Get the axios instance from the provider
      const axiosInstance = (provider as any).client;
      axiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      const input = {
        amount: 1000,
        currency_code: 'XOF',
        context: {
          customer: {
            id: 'cus_test_123',
            email: 'test@example.com',
          },
        },
        data: {},
      };

      const result = await provider.initiatePayment(input);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'pending');
      expect(result.data).toHaveProperty('authorization_url');
    });
  });

  // Ajoutez d'autres tests selon vos besoins
});

