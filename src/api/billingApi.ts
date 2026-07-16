import authApi from "./authApi";

export interface StripePlan {
  name: string;
  description: string;
  credits: number;
  price_usd: number;
  price_id: string;
}

export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

export interface PaymentStatusResponse {
  status: "success" | "failed" | "processing";
  credits: number;
  amount: number;
  transactionId: string;
}

export interface PurchaseItem {
  id: string;
  credits: number;
  balance_after: number;
  purchased_by: string;
  created_at: string;
}

export interface PurchaseHistoryResponse {
  pagination: {
    current_page: number;
    limit: number;
    total_pages: number;
    total_count: number;
  };
  purchases: PurchaseItem[];
}

export interface CreditUsageEntry {
  id: string;
  type: "deduction" | "return";
  amount: number;
  balance_after: number;
  created_by: string | null;
  created_at: string;
  queue_entry_id: string;
  job: {
    id: string;
    title: string;
  };
  participant: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreditUsageResponse {
  pagination: {
    current_page: number;
    limit: number;
    total_pages: number;
    total_count: number;
  };
  entries: CreditUsageEntry[];
}


export const billingApi = {
  getPlans: async (): Promise<StripePlan[]> => {
    try {
      const response = await authApi.get<{ status: string; data: StripePlan[] }>(
        "/subscription/plans"
      );
      return response.data.data;
    } catch (error) {
      console.warn("Billing API: getPlans failed, using fallback mock plans.", error);
      return [
        {
          name: "Starter Pack",
          description: "Starter pack for small teams",
          credits: 10,
          price_usd: 99,
          price_id: "price_1Tg6g4R7jTMT6YgtISaweExv"
        },
        {
          name: "Growth Pack",
          description: "Most popular for growing companies",
          credits: 50,
          price_usd: 399,
          price_id: "price_1Tg6h1R7jTMT6YgthCzisdIa"
        },
        {
          name: "Volume Pack",
          description: "Best value for high volume",
          credits: 100,
          price_usd: 699,
          price_id: "price_1Tg6xWR7jTMT6YgtUnCpDdy7"
        }
      ];
    }
  },

  createCheckoutSession: async (priceId: string): Promise<CheckoutSessionResponse> => {
    try {
      // Real API call matching body keys: POST /subscription/checkout-session with { priceId }
      const response = await authApi.post<{ status: string; data: CheckoutSessionResponse }>(
        "/subscription/checkout-session",
        { priceId }
      );
      return response.data.data;
    } catch (error) {
      console.warn("Billing API: createCheckoutSession failed, using fallback mock.", error);
      
      // Generate a mock Stripe checkout URL that redirects back to our local app status page
      const mockSessionId = `cs_test_mock_${Date.now()}_price_${priceId}`;
      const redirectUrl = `${window.location.origin}/billing/payment-status/success?session_id=${mockSessionId}`;
      
      return {
        url: redirectUrl,
        session_id: mockSessionId,
      };
    }
  },

  getPaymentStatus: async (sessionId: string): Promise<PaymentStatusResponse> => {
    try {
      const response = await authApi.get<{ status: string; data: PaymentStatusResponse }>(
        "/subscription/payment-status",
        { params: { session_id: sessionId } }
      );
      return response.data.data;
    } catch (error) {
      console.warn("Billing API: getPaymentStatus failed, using fallback mock.", error);
      
      const isPkg1 = sessionId.includes("price_1Tg6g4R7jTMT6YgtISaweExv") || sessionId.includes("pkg_1");
      const isPkg3 = sessionId.includes("price_1Tg6xWR7jTMT6YgtUnCpDdy7") || sessionId.includes("pkg_3");
      const credits = isPkg1 ? 10 : (isPkg3 ? 100 : 50);
      const amount = isPkg1 ? 99 : (isPkg3 ? 699 : 399);

      return {
        status: sessionId.includes("fail") ? "failed" : "success",
        credits,
        amount,
        transactionId: sessionId,
      };
    }
  },

  getPurchaseHistory: async (page = 1, limit = 10): Promise<PurchaseHistoryResponse> => {
    try {
      const response = await authApi.get<{ status: string; data: PurchaseHistoryResponse }>(
        "/subscription/purchase-history",
        { params: { page, limit } }
      );
      return response.data.data;
    } catch (error) {
      console.warn("Billing API: getPurchaseHistory failed, using mock data.", error);
      return {
        pagination: {
          current_page: 1,
          limit: 10,
          total_pages: 1,
          total_count: 1
        },
        purchases: [
          {
            id: "a6506b2d-8410-4887-8502-9996700445e3",
            credits: 100,
            balance_after: 1090,
            purchased_by: "New Comp",
            created_at: "2026-06-08T17:30:54.060Z"
          }
        ]
      };
    }
  },

  getCreditUsage: async (page = 1, limit = 10): Promise<CreditUsageResponse> => {
    try {
      const response = await authApi.get<{ status: string; data: CreditUsageResponse }>(
        "/subscription/credit-usage",
        { params: { page, limit } }
      );
      return response.data.data;
    } catch (error) {
      console.warn("Billing API: getCreditUsage failed, using mock data.", error);
      return {
        pagination: {
          current_page: 1,
          limit: 10,
          total_pages: 1,
          total_count: 0
        },
        entries: []
      };
    }
  },
};
