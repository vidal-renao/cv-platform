const API_URL = '/api';

export const fetchWithAuth = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API Request Failed');
  }

  return response.json();
};

export const login = async (email, password) => {
  const data = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
};

export const getCurrentUser = async () => {
  const data = await fetchWithAuth('/auth/me');
  return data.user;
};

export const register = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Registration failed');
  }
  return response.json();
};

export const logout = () => {
  return fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'same-origin',
  }).catch(() => {});
};
