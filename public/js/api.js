// public/js/api.js
// SIPAD – API helper
// FASE 3.3.C.2 – JWT + Refresh Token frontend
// Compatible con backend endurecido (FASE 3.3.C)

const ACCESS_TOKEN_KEY = 'sipad_token';
const REFRESH_TOKEN_KEY = 'sipad_refresh_token';

/* =========================
   TOKEN MANAGEMENT
========================= */

export function setAccessToken(token) {
  if (typeof token !== 'string' || !token) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function setRefreshToken(token) {
  if (typeof token !== 'string' || !token) return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearSession() {
  clearAccessToken();
  clearRefreshToken();
}

/* =========================
   AUTH API
========================= */

export async function login(username, password) {
  let res;

  try {
    res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
  } catch (err) {
    throw new Error('NetworkError');
  }

  if (!res.ok) {
    let errMsg = 'AuthError';
    try {
      const err = await res.json();
      errMsg = err.error || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const data = await res.json();

  // 🔐 Guardar tokens
  setAccessToken(data.token);
  setRefreshToken(data.refreshToken);

  return data.user;
}

export function logout() {
  clearSession();
}

/* =========================
   REFRESH TOKEN API
========================= */

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('NoRefreshToken');
  }

  let res;

  try {
    res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
  } catch (err) {
    throw new Error('NetworkError');
  }

  if (!res.ok) {
    clearSession();
    throw new Error('RefreshFailed');
  }

  const data = await res.json();

  // 🔁 Actualizar access token
  setAccessToken(data.token);

  return data.token;
}

/* =========================
   SYNC API
========================= */

export async function pushSync(item) {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;

  try {
    res = await fetch('/api/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify(item)
    });
  } catch (err) {
    throw new Error('NetworkError');
  }

  if (res.status === 401) {
    throw new Error('Unauthorized');
  }

  if (res.status === 403) {
    throw new Error('Forbidden');
  }

  if (!res.ok) {
    throw new Error('ServerError');
  }

  return true;
}
