import { stripe } from "@/lib/stripe";

export interface CreateSubscriptionData {
  guardianId: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "yearly";
  description: string;
  startDate: Date;
}

export interface UpdateSubscriptionData {
  subscriptionId: string;
  status: "active" | "paused" | "cancelled";
}

export interface EditSubscriptionData {
  subscriptionId: string;
  amount?: number;
  frequency?: "monthly" | "quarterly" | "yearly";
  description?: string;
}

export interface CustomerData {
  guardianId: string;
  email: string;
  name: string;
  phone?: string;
}

// lib/services/billing-service.ts
export const billingService = {
  // Create or get a Stripe customer for a guardian
  async createOrGetCustomer(data: CustomerData) {
    const response = await fetch('/api/billing/customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create/get customer');
    }
    
    return response.json();
  },

  // Check if a guardian has a Stripe customer
  async checkCustomerExists(guardianId: string) {
    const response = await fetch(`/api/billing/customer?guardianId=${guardianId}`)
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to check customer status');
    }
    
    return response.json();
  },

  async createSubscription(data: any) {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create subscription');
    }
    
    return response.json()
  },

  // Update subscription status
  async updateSubscription(data: UpdateSubscriptionData) {
    const response = await fetch("/api/billing", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update subscription");
    }

    return response.json();
  },

  // Edit subscription details (amount, frequency, description)
  async editSubscription(data: EditSubscriptionData) {
    const response = await fetch("/api/billing/edit", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to edit subscription");
    }

    return response.json();
  },

  // Delete subscription
  async deleteSubscription(subscriptionId: string) {
    const response = await fetch(`/api/billing/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete subscription");
    }

    return response.json();
  },

  // Get payment history for a subscription
  async getPaymentHistory(subscriptionId: string) {
    const response = await fetch(`/api/billing/payments?subscriptionId=${subscriptionId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch payment history");
    }

    return response.json();
  },

  // Get all subscriptions from Stripe
  async getSubscriptions() {
    const response = await fetch('/api/billing/subscriptions');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch subscriptions");
    }

    return response.json();
  },

  // Get all transactions from Stripe
  async getTransactions() {
    const response = await fetch('/api/billing/transactions');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch transactions");
    }

    return response.json();
  },

  // Get billing analytics and metrics
  async getAnalytics() {
    const response = await fetch('/api/billing/analytics');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch analytics");
    }

    return response.json();
  },

  // Get revenue history for charts
  async getRevenueHistory(months: number = 6) {
    const response = await fetch(`/api/billing/revenue-history?months=${months}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch revenue history");
    }

    return response.json();
  },

  // Get failed payments analysis
  async getFailedPayments() {
    const response = await fetch('/api/billing/failed-payments');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch failed payments");
    }

    return response.json();
  },

  // Get growth metrics
  async getGrowthMetrics() {
    const response = await fetch('/api/billing/growth-metrics');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch growth metrics");
    }

    return response.json();
  },

  // Test Stripe connectivity
  async testStripeConnection() {
    const response = await fetch('/api/billing/test-stripe');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to test Stripe connection");
    }

    return response.json();
  }
}; 