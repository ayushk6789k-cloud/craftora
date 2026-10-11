// In Google AI Studio preview, Vite and Express run on the same origin (port 3000 behind Cloud Run reverse proxy)
// The correct base URL is relative '/api' (or import.meta.env.VITE_API_BASE_URL)
const RAW_BASE = import.meta.env.VITE_API_BASE_URL;
const API_BASE = (RAW_BASE !== undefined && RAW_BASE.trim() !== '' ? RAW_BASE.trim() : '/api').replace(/\/$/, '');

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const token = localStorage.getItem('craftora_token');
  let sessionId = localStorage.getItem('craftora_session_id');

  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('craftora_session_id', sessionId);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Prevent duplicate /api if both API_BASE and cleanEndpoint start with /api
  const finalUrl = (API_BASE === '/api' && cleanEndpoint.startsWith('/api/'))
    ? cleanEndpoint
    : `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(finalUrl, {
      ...options,
      headers,
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    return {
      success: false,
      error: err.message || 'Network request failed',
    };
  }
}
