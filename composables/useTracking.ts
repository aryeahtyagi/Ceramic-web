type TrackEventPayload = {
  sessionId: string
  userId: string | null
  eventType: string
  pagePath: string
  referrer: string
  metadata: string
}

const SESSION_KEY = 'ceramic_session_id_v1'
const FLUSH_INTERVAL_MS = 10_000
const MAX_QUEUE_SIZE = 20

// Module-scoped so the queue/timer/listeners are shared and set up once, not per component instance.
let queue: TrackEventPayload[] = []
let flushTimerId: ReturnType<typeof setInterval> | null = null
let listenersAttached = false
let cachedSessionId: string | null = null

function getSessionId(): string {
  if (cachedSessionId) return cachedSessionId
  if (typeof localStorage === 'undefined') return 'server'
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(SESSION_KEY, id)
    }
    cachedSessionId = id
    return id
  } catch {
    return 'unknown'
  }
}

export function useTracking() {
  const config = useRuntimeConfig()
  const apiBase = String(config.public.apiBase || '').replace(/\/$/, '')
  const route = useRoute()
  const { user } = useAuth()

  function flush(useBeacon = false) {
    if (!import.meta.client || queue.length === 0) return
    const batch = queue
    queue = []
    const url = `${apiBase}/events/batch`
    const body = JSON.stringify(batch)

    if (useBeacon && navigator.sendBeacon) {
      // 'text/plain' is CORS-safelisted, so this stays a simple request across origins (frontend/backend
      // run on different ports even in dev). 'application/json' would force a preflight, which sendBeacon
      // handles unreliably — browsers can silently drop the beacon rather than perform it. Body is still
      // valid JSON text; the backend reads it as a raw string and parses it regardless of this header.
      const blob = new Blob([body], { type: 'text/plain' })
      const sent = navigator.sendBeacon(url, blob)
      if (!sent) {
        // Beacon queue full or rejected — fall back to a best-effort fetch so the event isn't just lost.
        $fetch(url, { method: 'POST', body: batch }).catch(() => {})
      }
      return
    }

    $fetch(url, { method: 'POST', body: batch }).catch(() => {
      // best-effort telemetry — never let a failed flush surface to the UI
    })
  }

  function ensureListeners() {
    if (listenersAttached || !import.meta.client) return
    listenersAttached = true
    flushTimerId = window.setInterval(() => flush(false), FLUSH_INTERVAL_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush(true)
    })
    window.addEventListener('pagehide', () => flush(true))
  }

  function track(eventType: string, metadata: Record<string, any> = {}, opts: { immediate?: boolean; beacon?: boolean } = {}) {
    if (!import.meta.client) return
    ensureListeners()
    queue.push({
      sessionId: getSessionId(),
      userId: user.value?.id ? String(user.value.id) : null,
      eventType,
      pagePath: route.fullPath,
      referrer: document.referrer || '',
      metadata: JSON.stringify(metadata || {})
    })
    if (opts.beacon) {
      flush(true)
    } else if (opts.immediate || queue.length >= MAX_QUEUE_SIZE) {
      flush(false)
    }
  }

  return { track }
}
