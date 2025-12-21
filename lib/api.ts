/**
 * API utility functions for interacting with the backend
 */

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Type Definitions
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  subscription?: Subscription;
  selectedAssets?: string[];
  preferences?: {
    emailNotifications?: boolean;
  };
}

interface Subscription {
  _id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  price: number;
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer';
  selectedAssets?: string[];
}

interface SubscriptionPlan {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  isOnSale: boolean;
  saleEndsAt?: string;
  saleDescription?: string;
  isActive: boolean;
  assetCount: number;
  assetType?: string | string[];
  maxTradingPairs?: number;
  unlimitedTradingPairs?: boolean;
  includesTelegramGroup?: boolean;
  duration?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface Country {
  name: string;
  code: string;
  phoneCode: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  referralCode?: string;
  phoneNumber: {
    countryCode: string;
    number: string;
  };
}

interface ResetPasswordData {
  password: string;
  passwordConfirm: string;
}

interface UpdatePasswordData {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: {
    countryCode: string;
    number: string;
  };
}

interface PaymentData {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  walletAddress: string;
  network: string;
  status: string;
  message: string;
}

interface PaymentCreateData {
  planName: string;
  planPrice: number;
  userId: string;
  selectedPairs: string[];
  senderAddress?: string;
  network?: string;
  currency?: string;
  walletAddress?: string;
  planImages?: Array<{
    url: string;
    filename: string;
    originalName: string;
    uploadedAt: string;
  }>;
}

interface ScreenshotUploadData {
  screenshotUrl: string;
  transactionHash?: string;
  senderAddress?: string;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

// Auth endpoints
const AUTH_ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  SIGNUP: `${API_URL}/auth/signup`,
  FORGOT_PASSWORD: `${API_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_URL}/auth/reset-password`,
};

// User endpoints
const USER_ENDPOINTS = {
  ME: `${API_URL}/users/me`,
};

// Notification endpoints
const NOTIFICATION_ENDPOINTS = {
  NOTIFICATIONS: `${API_URL}/notifications`,
  MARK_AS_READ: (id: string) => `${API_URL}/notifications/${id}/read`,
  MARK_ALL_AS_READ: `${API_URL}/notifications/read-all`,
  UNREAD_COUNT: `${API_URL}/notifications/unread-count`,
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to get headers
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Get the JWT token from localStorage
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

/**
 * Set the JWT token in localStorage
 */
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

/**
 * Remove the JWT token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
};

/**
 * Check if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

/**
 * Base fetch function with authentication and error handling
 */
async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();
  
  // Set default headers
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  // Add authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Parse the JSON response
  const data = await response.json();
  
  // Handle error responses
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
}

/**
 * Authentication API functions
 */
export const authApi = {
  // Login user
  login: async (email: string, password: string) => {
    const data = await fetchApi<{ token: string }>(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.data?.token) {
      setToken(data.data.token);
    }
    
    return data;
  },
  
  // Register a new user
  signup: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirm: string;
    referralCode?: string;
  }) => {
    return fetchApi(AUTH_ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // Request password reset
  forgotPassword: async (email: string) => {
    return fetchApi(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  // Reset password with token
  resetPassword: async (token: string, password: string, passwordConfirm: string) => {
    return fetchApi(AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ token, password, passwordConfirm }),
    });
  },
  
  // Logout user
  logout: () => {
    removeToken();
  },
};

/**
 * Notification API functions
 */
export const notificationApi = {
  // Get all notifications for the current user
  getNotifications: async (): Promise<Notification[]> => {
    const response = await fetchApi<{ notifications: Notification[] }>(NOTIFICATION_ENDPOINTS.NOTIFICATIONS, {
      method: 'GET',
    });
    return response.data?.notifications || [];
  },

  // Mark a notification as read
  markAsRead: async (id: string): Promise<void> => {
    await fetchApi(NOTIFICATION_ENDPOINTS.MARK_AS_READ(id), {
      method: 'PATCH',
    });
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await fetchApi(NOTIFICATION_ENDPOINTS.MARK_ALL_AS_READ, {
      method: 'PATCH',
    });
  },

  // Get unread notifications count
  getUnreadCount: async (): Promise<number> => {
    const response = await fetchApi<{ count: number }>(NOTIFICATION_ENDPOINTS.UNREAD_COUNT, {
      method: 'GET',
    });
    return response.data?.count || 0;
  },

  // Delete a notification
  deleteNotification: async (id: string): Promise<void> => {
    await fetchApi(`${NOTIFICATION_ENDPOINTS.NOTIFICATIONS}/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * User API functions
 */
export const userApi = {
  // Get current user profile
  getProfile: async () => {
    return fetchApi(USER_ENDPOINTS.ME, {
      method: 'GET',
    });
  },
  
  // Update user profile
  updateProfile: async (userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    return fetchApi(USER_ENDPOINTS.ME, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
  
  // Update notification preferences
  updateNotifications: async (notifications: {
    marketing?: boolean;
    assetAnalysis?: boolean;
    priceAlerts?: boolean;
  }) => {
    return fetchApi(USER_ENDPOINTS.ME, {
      method: 'PATCH',
      body: JSON.stringify({ notifications }),
    });
  },
};

// API endpoints
export const api = {
  // Subscription endpoints
  subscriptions: {
    getPlans: async (): Promise<ApiResponse<{ plans: SubscriptionPlan[] }>> => {
      const response = await fetch(`${API_URL}/api/subscriptions`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch subscription plans');
      }
      return responseData;
    },

    getAll: async (): Promise<ApiResponse<{ subscriptions: Subscription[] }>> => {
      const response = await fetch(`${API_URL}/api/subscriptions`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch subscriptions');
      }
      return responseData;
    },

    adminActivate: async (userId: string, data: { planId: string; selectedAssets: string[] }): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/subscriptions/admin-activate/${userId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to activate subscription');
      }
      return responseData;
    },
    
    getPlanFeatures: async (): Promise<ApiResponse<{ features: any[] }>> => {
      const response = await fetch(`${API_URL}/api/subscriptions/features`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch plan features');
      }
      return responseData;
    },
    
    subscribe: async (subscriptionData: { planId: string }): Promise<ApiResponse<{ subscription: Subscription }>> => {
      const response = await fetch(`${API_URL}/api/subscriptions/subscribe/${subscriptionData.planId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to subscribe to plan');
      }
      return responseData;
    },
    
    cancel: async (): Promise<ApiResponse<{ subscription: Subscription }>> => {
      const response = await fetch(`${API_URL}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to cancel subscription');
      }
      return responseData;
    },
    
    getCurrentSubscription: async (): Promise<ApiResponse<{ subscription: Subscription }>> => {
      const response = await fetch(`${API_URL}/api/subscriptions/my-subscription`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch subscription');
      }
      return responseData;
    },
  },

  // User endpoints
  users: {
    getMe: async (): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch user profile');
      }
      return responseData;
    },
    
    updateMe: async (data: UpdateProfileData): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/users/update-me`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update profile');
      }
      return responseData;
    },
    
    updatePassword: async (data: UpdatePasswordData): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/users/update-password`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update password');
      }
      return responseData;
    },
    
    updateNotifications: async (data: { notifications: { marketing?: boolean; assetAnalysis?: boolean; priceAlerts?: boolean } }): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/users/update-notifications`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update notifications');
      }
      return responseData;
    },

    getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch profile');
      }
      return responseData;
    },
    
    updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update profile');
      }
      return responseData;
    },
    
    updateAvatar: async (formData: FormData): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetch(`${API_URL}/api/users/avatar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update avatar');
      }
      return responseData;
    },
  },
  
  // Auth endpoints
  auth: {
    login: async (data: LoginData): Promise<ApiResponse<{ token: string; user: User }>> => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to login');
      }
      const typedResponse = responseData as ApiResponse<{ token: string; user: User }>;
      if (typedResponse.status === 'success' && typedResponse.data?.token) {
        setToken(typedResponse.data.token);
      }
      return typedResponse;
    },
    
    signup: async (data: SignupData): Promise<ApiResponse<{ token: string; user: User }>> => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to signup');
      }
      const typedResponse = responseData as ApiResponse<{ token: string; user: User }>;
      if (typedResponse.status === 'success' && typedResponse.data?.token) {
        setToken(typedResponse.data.token);
      }
      return typedResponse;
    },
    
    verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
      const response = await fetch(`${API_URL}/api/auth/verify-email/${token}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to verify email');
      }
      return responseData;
    },
    
    resendVerification: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email })
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to resend verification email');
      }
      return responseData;
    },
    
    forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email })
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to request password reset');
      }
      return responseData;
    },
    
    resetPassword: async (token: string, data: ResetPasswordData): Promise<ApiResponse<{ message: string }>> => {
      const response = await fetch(`${API_URL}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to reset password');
      }
      return responseData;
    },
    
    updatePassword: async (data: UpdatePasswordData): Promise<ApiResponse<{ message: string }>> => {
      const response = await fetch(`${API_URL}/api/auth/update-password`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update password');
      }
      return responseData;
    },
    
    logout: (): void => {
      removeToken();
    },
  },

  payments: {
    createPayment: async (data: PaymentCreateData): Promise<ApiResponse<{
      payment: {
        _id: string;
        orderId: string;
        amount: number;
        currency: string;
        status: string;
        selectedPairs: string[];
        manualPayment: {
          walletAddress: string;
          network: string;
          senderAddress?: string;
          screenshotUrl?: string;
          originalScreenshotUrl?: string;
        };
      };
      paymentId: string;
      orderId: string;
      amount: number;
      currency: string;
      walletAddress: string;
      network: string;
      status: string;
      message: string;
    }>> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token is missing');
        }

        const response = await fetch(`${API_URL}/api/payments/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to create payment');
        }
        return responseData;
      } catch (error) {
        console.error('Payment creation error:', error);
        throw error;
      }
    },
    
    uploadScreenshot: async (paymentId: string, formData: FormData): Promise<ApiResponse<{
      paymentId: string;
      status: string;
      message: string;
    }>> => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token is missing');
        }

        // Don't set Content-Type header - let the browser set it with the correct boundary
        const response = await fetch(`${API_URL}/api/payments/${paymentId}/upload-screenshot`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to upload screenshot');
        }
        return responseData;
      } catch (error) {
        console.error('Screenshot upload error:', error);
        throw error;
      }
    },
    
    verifyPayment: async (paymentId: string): Promise<ApiResponse<{ payment: any }>> => {
      const response = await fetch(`${API_URL}/api/payments/verify/${paymentId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to verify payment');
      }
      return responseData;
    },
    
    getPaymentHistory: async (): Promise<ApiResponse<{ payments: any[] }>> => {
      const response = await fetch(`${API_URL}/api/payments/history`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch payment history');
      }
      return responseData;
    },

    getScreenshot: (paymentId: string) => 
      fetchApi(`${API_URL}/api/payments/screenshot/${paymentId}`),
    
    getPaymentStatus: (paymentId: string) => 
      fetchApi(`${API_URL}/api/payments/status/${paymentId}`),
  },

  tradingPairs: {
    getAll: async (): Promise<ApiResponse<{
      forex: Array<{ symbol: string; name: string; category: string }>;
      indices: Array<{ symbol: string; name: string; category: string }>;
      commodities: Array<{ symbol: string; name: string; category: string }>;
      crypto: Array<{ symbol: string; name: string; category: string }>;
    }>> => {
      const response = await fetch(`${API_URL}/api/trading-pairs`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch trading pairs');
      }
      return responseData;
    },

    getSelected: async (): Promise<ApiResponse<{ pairs: string[] }>> => {
      const response = await fetch(`${API_URL}/api/trading-pairs/selected`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch selected trading pairs');
      }
      return responseData;
    },

    add: async (pair: string): Promise<ApiResponse<{ pairs: string[] }>> => {
      const response = await fetch(`${API_URL}/api/trading-pairs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ pair })
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to add trading pair');
      }
      return responseData;
    },

    remove: async (pair: string): Promise<ApiResponse<{ pairs: string[] }>> => {
      const response = await fetch(`${API_URL}/api/trading-pairs/${pair}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to remove trading pair');
      }
      return responseData;
    },

    update: async (pairs: string[]): Promise<ApiResponse<{ pairs: string[] }>> => {
      const response = await fetch(`${API_URL}/api/trading-pairs`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ pairs })
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to update trading pairs');
      }
      return responseData;
    },
  },

  notifications: {
    getAll: async (): Promise<ApiResponse<{ notifications: Notification[] }>> => {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch notifications');
      }
      const typedResponse = responseData as ApiResponse<{ notifications: Notification[] }>;
      return {
        status: 'success',
        data: {
          notifications: typedResponse.data?.notifications || []
        }
      };
    },

    markAsRead: async (id: string): Promise<ApiResponse<{ notification: Notification }>> => {
      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to mark notification as read');
      }
      return responseData;
    },

    markAllAsRead: async (): Promise<ApiResponse<{ message: string }>> => {
      const response = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to mark all notifications as read');
      }
      return responseData;
    },

    delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to delete notification');
      }
      return responseData;
    },

    getUnreadCount: async (): Promise<number> => {
      const response = await fetchApi<{ count: number }>(NOTIFICATION_ENDPOINTS.UNREAD_COUNT, {
        method: 'GET',
      });
      return response.data?.count || 0;
    },
  },

  countries: {
    getAll: async (): Promise<ApiResponse<{ countries: Country[] }>> => {
      const response = await fetch(`${API_URL}/api/countries`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch countries');
      }
      return responseData;
    },

    search: async (query: string): Promise<ApiResponse<{ countries: Country[] }>> => {
      const response = await fetch(`${API_URL}/api/countries/search?query=${query}`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to search countries');
      }
      return responseData;
    },
  },
};

export default api;
