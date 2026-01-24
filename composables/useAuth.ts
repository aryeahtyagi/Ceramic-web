export type User = {
  id: number
  username: string
  phoneNumber: string
  email: string
  address: string
  pincode: string
}

const STORAGE_KEY = 'ceramic_user_v1'

export function useAuth() {
  const user = useState<User | null>('auth-user', () => null)
  const initialized = useState<boolean>('auth-initialized', () => false)

  // Initialize from localStorage once (client-only)
  if (process.client && !initialized.value) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.id === 'number' && parsed.phoneNumber) {
          user.value = {
            id: Number(parsed.id),
            username: String(parsed.username || ''),
            phoneNumber: String(parsed.phoneNumber || ''),
            email: String(parsed.email || ''),
            address: String(parsed.address || ''),
            pincode: String(parsed.pincode || '')
          }
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      initialized.value = true
    }
  }

  const isAuthenticated = computed(() => Boolean(user.value?.id))

  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

  const login = async (phoneNumber: string): Promise<User | null> => {
    if (!phoneNumber || !phoneNumber.trim()) {
      throw new Error('Phone number is required')
    }

    try {
      const url = `${apiBase}/user/login?phoneNumber=${encodeURIComponent(phoneNumber.trim())}`
      const response = await $fetch<User>(url, {
        method: 'POST',
        headers: { accept: '*/*' }
      })

      if (response && response.id) {
        user.value = response
        if (process.client) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(response))
          } catch {
            // ignore storage errors
          }
        }
        return response
      }

      return null
    } catch (error: any) {
      // If 404 or empty response, user doesn't exist
      if (error?.statusCode === 404 || error?.status === 404) {
        return null
      }
      throw error
    }
  }

  const signup = async (data: {
    username: string
    phoneNumber: string
    email: string
    address: string
    pincode: string
  }): Promise<User> => {
    if (!data.phoneNumber || !data.phoneNumber.trim()) {
      throw new Error('Phone number is required')
    }
    if (!data.username || !data.username.trim()) {
      throw new Error('Username is required')
    }
    if (!data.email || !data.email.trim()) {
      throw new Error('Email is required')
    }

    try {
      const params = new URLSearchParams({
        id: '0',
        username: data.username.trim(),
        phoneNumber: data.phoneNumber.trim(),
        email: data.email.trim(),
        address: (data.address || '').trim(),
        pincode: (data.pincode || '').trim()
      })

      const url = `${apiBase}/user/create?${params.toString()}`
      const response = await $fetch<User>(url, {
        method: 'POST',
        headers: { accept: '*/*' }
      })

      if (response && response.id) {
        user.value = response
        if (process.client) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(response))
          } catch {
            // ignore storage errors
          }
        }
        return response
      }

      throw new Error('Failed to create user')
    } catch (error: any) {
      throw error
    }
  }

  const logout = () => {
    user.value = null
    if (process.client) {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore storage errors
      }
    }
  }

  return {
    user: readonly(user),
    isAuthenticated,
    login,
    signup,
    logout
  }
}
