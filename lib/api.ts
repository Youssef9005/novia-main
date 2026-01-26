const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchClient(endpoint: string, options: RequestInit = {}) {
  // Check for token in localStorage (client-side only)
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return { status: 'success', data: null };
    }

    const text = await response.text();
    let data;
    try {
      const cleanText = text.trim();
      data = cleanText ? JSON.parse(cleanText) : {};

      // If 200 OK but empty response (and not 204), it's likely an error for endpoints expecting JSON
      if (response.ok && response.status !== 204 && Object.keys(data).length === 0) {
         return { 
          status: 'error', 
          message: 'Server returned empty response' 
        };
      }
    } catch (e) {
      console.error('Failed to parse JSON response:', text);
      if (!response.ok) {
        return { 
          status: 'error', 
          message: `Server Error (${response.status}): ${text.slice(0, 100) || response.statusText}` 
        };
      }
      // If 200 OK but invalid JSON
      return { 
          status: 'error', 
          message: `Invalid JSON response from server (${response.status})` 
      };
    }

    if (!response.ok) {
      // If 401 Unauthorized, maybe clear token?
      if (response.status === 401 && typeof window !== 'undefined') {
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        // window.location.href = '/login'; 
        // Don't auto redirect here, let the caller handle it or use an interceptor
      }
      
      // If data is empty but we have an error status
      if (Object.keys(data).length === 0) {
        return { 
          status: 'error', 
          message: `Request failed with status ${response.status} (${response.statusText})` 
        };
      }
      
      // Return the error response structure if possible, or throw
      // The backend returns { status: 'error' | 'fail', message: '...' }
      return data; 
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    return { status: 'error', message: error instanceof Error ? error.message : 'Network error' };
  }
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  wallet?: string;
  [key: string]: unknown;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  passwordConfirm?: string;
  [key: string]: unknown;
}

export interface CreatePaymentData {
  planName: string;
  planPrice: number;
  userId: string;
  selectedPairs?: string[];
  senderAddress?: string;
  network?: string;
  currency?: string;
  walletAddress?: string;
}

export const api = {
  users: {
    me: () => fetchClient('/users/me'),
    updateMe: (data: UpdateUserData) => fetchClient('/users/update-me', { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
    changePassword: (current: string, newPass: string) => fetchClient('/users/update-password', { 
      method: 'PATCH', 
      body: JSON.stringify({ 
        passwordCurrent: current, 
        password: newPass, 
        passwordConfirm: newPass 
      }) 
    }),
    updateNotifications: (data: Record<string, unknown>) => fetchClient('/users/update-notifications', { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
  },
  wallets: {
    active: () => fetchClient('/wallets/active'),
  },
  plans: {
    getAll: () => fetchClient('/subscriptions/plans'),
    getMySubscription: () => fetchClient('/subscriptions/my-subscription'),
  },
  auth: {
    login: (email: string, password?: string) => fetchClient('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify({ email, password }) 
    }),
    register: (data: RegisterData) => fetchClient('/auth/signup', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
    forgotPassword: (email: string) => fetchClient('/auth/forgotPassword', { 
      method: 'POST', 
      body: JSON.stringify({ email }) 
    }),
    resetPassword: (token: string, p1: string, p2: string) => fetchClient(`/auth/resetPassword/${token}`, { 
      method: 'PATCH', 
      body: JSON.stringify({ password: p1, passwordConfirm: p2 }) 
    }),
    verifyEmail: (token: string) => fetchClient(`/auth/verifyEmail/${token}`, { 
      method: 'PATCH' 
    }),
  },
  signals: {
    getAll: () => fetchClient('/signals'),
  },
  referrals: {
    getStats: () => fetchClient('/referrals/stats'),
    getAll: () => fetchClient('/referrals'),
    getHistory: () => fetchClient('/referrals/history'),
  },
  payments: {
    create: (data: CreatePaymentData) => fetchClient('/payments/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    uploadScreenshot: (paymentId: string, formData: FormData) => fetchClient(`/payments/${paymentId}/upload-screenshot`, {
      method: 'POST',
      body: formData
    }),
    getStatus: (paymentId: string) => fetchClient(`/payments/status/${paymentId}`),
  }
};
