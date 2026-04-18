const rawBase = import.meta.env.VITE_API_BASE_URL?.trim() || ''
const API_BASE = rawBase ? rawBase.replace(/\/+$/, '') : ''

export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return API_BASE ? `${API_BASE}${normalized}` : normalized
}

export function fitbitCallbackUrl() {
  if (API_BASE) {
    try {
      return `${new URL(API_BASE).origin}/fitbit/callback`
    } catch {
      return 'https://your-backend-domain/fitbit/callback'
    }
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/fitbit/callback`
  }
  return 'http://localhost:3001/fitbit/callback'
}
