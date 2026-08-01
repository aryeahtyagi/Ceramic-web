const ADMIN_KEY_STORAGE = 'ceramic_admin_key_v1'

export function useAdminAuth() {
  const adminKey = useState<string>('admin-key', () => '')
  const isAuthorized = useState<boolean>('admin-authorized', () => false)
  const verifying = useState<boolean>('admin-verifying', () => false)
  const authError = useState<string>('admin-auth-error', () => '')
  const autoVerifyAttempted = useState<boolean>('admin-auto-verify-attempted', () => false)

  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

  function authHeaders() {
    return { 'X-Admin-Key': adminKey.value }
  }

  async function verify(key: string): Promise<boolean> {
    if (!key) return false
    verifying.value = true
    authError.value = ''
    try {
      await $fetch(`${apiBase}/admin/ping`, { headers: { 'X-Admin-Key': key } })
      adminKey.value = key
      isAuthorized.value = true
      if (import.meta.client) {
        try {
          localStorage.setItem(ADMIN_KEY_STORAGE, key)
        } catch {
          /* ignore storage errors */
        }
      }
      return true
    } catch (err: any) {
      isAuthorized.value = false
      const status = err?.response?.status || err?.statusCode
      authError.value = status === 401 ? 'Invalid admin key.' : 'Could not reach the server.'
      if (import.meta.client) {
        try {
          localStorage.removeItem(ADMIN_KEY_STORAGE)
        } catch {
          /* ignore storage errors */
        }
      }
      return false
    } finally {
      verifying.value = false
    }
  }

  function logout() {
    adminKey.value = ''
    isAuthorized.value = false
    if (import.meta.client) {
      try {
        localStorage.removeItem(ADMIN_KEY_STORAGE)
      } catch {
        /* ignore storage errors */
      }
    }
  }

  /** Call once from the admin layout on mount — silently signs back in with a previously saved key. */
  function tryAutoVerify() {
    if (!import.meta.client || autoVerifyAttempted.value) return
    autoVerifyAttempted.value = true
    let stored = ''
    try {
      stored = localStorage.getItem(ADMIN_KEY_STORAGE) || ''
    } catch {
      /* ignore storage errors */
    }
    if (stored) verify(stored)
  }

  return {
    adminKey: readonly(adminKey),
    isAuthorized: readonly(isAuthorized),
    verifying: readonly(verifying),
    authError: readonly(authError),
    authHeaders,
    verify,
    logout,
    tryAutoVerify
  }
}
