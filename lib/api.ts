/**
 * API utility functions for interacting with the backend
 */

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to get headers
const getHeaders = () => {
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
async function fetchApi(
  url: string,
  options: RequestInit = {}
): Promise<any> {
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
    const data = await fetchApi(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      setToken(data.token);
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
    const response = await fetchApi(NOTIFICATION_ENDPOINTS.NOTIFICATIONS, {
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
    const response = await fetchApi(NOTIFICATION_ENDPOINTS.UNREAD_COUNT, {
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
    getPlans: async () => {
      const response = await fetch(`${API_URL}/api/subscriptions`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch subscription plans');
      }
      return responseData;
    },
    
    getPlanFeatures: async () => {
      const response = await fetch(`${API_URL}/api/subscriptions/features`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch plan features');
      }
      return responseData;
    },
    
    subscribe: async (subscriptionData: SubscriptionData) => {
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
    
    cancel: async () => {
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
    
    getCurrentSubscription: async () => {
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
    getMe: () => fetch(`${API_URL}/api/users/me`, {
      headers: getHeaders()
    }).then(res => res.json()),
    
    updateMe: (data: any) => fetch(`${API_URL}/api/users/update-me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    
    updatePassword: (data: any) => fetch(`${API_URL}/api/users/update-password`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),
    
    updateNotifications: (data: any) => fetch(`${API_URL}/api/users/update-notifications`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    }).then(res => res.json()),

    getProfile: async () => {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch profile');
      }
      return responseData;
    },
    
    updateProfile: async (data: UpdateProfileData) => {
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
    
    updateAvatar: async (formData: FormData) => {
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
    login: async (data: LoginData) => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (responseData.token) {
        setToken(responseData.token);
      }
      return responseData;
    },
    
    signup: async (data: SignupData) => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const responseData = await response.json();
      if (responseData.token) {
        setToken(responseData.token);
      }
      return responseData;
    },
    
    verifyEmail: async (token: string) => {
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
    
    resendVerification: async (email: string) => {
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
    
    forgotPassword: async (email: string) => {
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
    
    resetPassword: async (token: string, data: ResetPasswordData) => {
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
    
    updatePassword: async (data: UpdatePasswordData) => {
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
    
    logout: () => {
      removeToken();
    },
  },

  payments: {
    createPayment: async (data: PaymentData) => {
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
    
    verifyPayment: async (paymentId: string) => {
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
    
    getPaymentHistory: async () => {
      const response = await fetch(`${API_URL}/api/payments/history`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch payment history');
      }
      return responseData;
    },
  },

  tradingPairs: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/api/trading-pairs`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch trading pairs');
      }
      return responseData;
    },

    getSelected: async () => {
      const response = await fetch(`${API_URL}/api/trading-pairs/selected`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch selected trading pairs');
      }
      return responseData;
    },

    add: async (pair: string) => {
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

    remove: async (pair: string) => {
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

    update: async (pairs: string[]) => {
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
    getAll: async () => {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch notifications');
      }
      return responseData.data?.notifications || [];
    },

    markAsRead: async (id: string) => {
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

    markAllAsRead: async () => {
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

    delete: async (id: string) => {
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

    getUnreadCount: async () => {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to get unread notifications count');
      }
      return responseData.data?.count || 0;
    },
  },

  countries: {
    getAll: async () => {
      const response = await fetch(`${API_URL}/api/countries`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch countries');
      }
      return responseData.data?.countries || [];
    },

    search: async (query: string) => {
      const response = await fetch(`${API_URL}/api/countries/search?query=${query}`, {
        headers: getHeaders()
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to search countries');
      }
      return responseData.data?.countries || [];
    },
  },
};

export default api;
