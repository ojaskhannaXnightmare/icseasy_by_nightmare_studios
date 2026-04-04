import { useStore } from '@/store/useStore'

/**
 * Authenticated fetch wrapper that adds JWT token from Zustand store.
 * Use this for all API calls that require authentication.
 */
export function getAuthHeaders(): HeadersInit {
  const { token } = useStore.getState()
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { token } = useStore.getState()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, { ...options, headers })
}
