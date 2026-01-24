import { computed, watch } from 'vue'

export type CartItem = {
  id: number
  name: string
  price: number
  qty: number
  image?: string
  slug?: string
}

const STORAGE_KEY = 'ceramic_cart_v1'

export function useCart() {
  const items = useState<CartItem[]>('cart-items', () => [])
  const initialized = useState<boolean>('cart-initialized', () => false)
  const auth = useAuth()
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')

  // Initialize from localStorage once (client-only)
  if (process.client && !initialized.value) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          items.value = parsed
            .map((x: any) => ({
              id: Number(x?.id),
              name: String(x?.name || ''),
              price: Number(x?.price || 0),
              qty: Math.max(1, Number(x?.qty || 1)),
              image: x?.image ? String(x.image) : undefined,
              slug: x?.slug ? String(x.slug) : undefined
            }))
            .filter((x) => Number.isFinite(x.id) && x.id > 0 && x.name)
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      initialized.value = true
    }
  }

  // Persist on change (client-only)
  if (process.client) {
    watch(
      items,
      (v) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
        } catch {
          // ignore quota/storage errors
        }
      },
      { deep: true }
    )
  }

  const totalQty = computed(() => items.value.reduce((sum, i) => sum + (i.qty || 0), 0))
  const subtotal = computed(() => items.value.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0))

  const getQty = (id: number) => items.value.find((i) => i.id === id)?.qty || 0

  // Sync cart item with backend API - returns true on success, false on failure
  const syncCartItem = async (productId: number, quantity: number): Promise<boolean> => {
    // Only sync if user is authenticated
    if (!auth.isAuthenticated.value || !auth.user.value?.id) {
      return false
    }

    try {
      const params = new URLSearchParams({
        id: '0',
        userId: String(auth.user.value.id),
        productId: String(productId),
        quantity: String(Math.max(0, quantity))
      })

      const url = `${apiBase}/user/cart?${params.toString()}`
      await $fetch(url, {
        method: 'POST',
        headers: { accept: '*/*' }
      })
      return true
    } catch (error) {
      console.warn('Failed to sync cart item with backend:', error)
      return false
    }
  }

  const addItem = async (item: Omit<CartItem, 'qty'>, qty = 1): Promise<boolean> => {
    const q = Math.max(1, Number(qty || 1))
    const existing = items.value.find((i) => i.id === item.id)
    
    if (existing) {
      const newQty = existing.qty + q
      const success = await syncCartItem(item.id, newQty)
      if (success) {
        existing.qty = newQty
        return true
      }
      return false
    }
    
    const success = await syncCartItem(item.id, q)
    if (success) {
      items.value.push({ ...item, qty: q })
      return true
    }
    return false
  }

  const setQty = async (id: number, qty: number): Promise<boolean> => {
    const q = Math.max(0, Number(qty || 0))
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx === -1) return false
    
    const success = await syncCartItem(id, q)
    if (!success) {
      return false
    }
    
    if (q <= 0) {
      items.value.splice(idx, 1)
      return true
    }
    items.value[idx].qty = q
    return true
  }

  const inc = async (id: number, by = 1): Promise<boolean> => {
    const newQty = getQty(id) + Math.max(1, Number(by || 1))
    return await setQty(id, newQty)
  }

  const dec = async (id: number, by = 1): Promise<boolean> => {
    const newQty = getQty(id) - Math.max(1, Number(by || 1))
    return await setQty(id, newQty)
  }

  const clear = async () => {
    // Sync all items to 0 quantity before clearing
    if (auth.isAuthenticated.value && auth.user.value?.id) {
      const syncPromises = items.value.map((item) => syncCartItem(item.id, 0))
      await Promise.all(syncPromises).catch(() => {
        // Ignore errors
      })
    }
    items.value = []
  }

  return {
    items,
    totalQty,
    subtotal,
    getQty,
    addItem,
    setQty,
    inc,
    dec,
    clear
  }
}

