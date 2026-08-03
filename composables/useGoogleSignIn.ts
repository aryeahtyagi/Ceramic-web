// Shared "Sign in with Google" (Google Identity Services) helper — used by /login and
// any admin-enabled popup that opts into showing the Google button.

let scriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    // @ts-expect-error injected by the Google script at runtime
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.querySelector('script[data-google-gsi]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleGsi = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function useGoogleSignIn() {
  async function renderGoogleButton(
    el: HTMLElement,
    clientId: string,
    callback: (response: { credential: string }) => void,
    options: Record<string, unknown> = {}
  ) {
    if (!clientId || !el) return
    await loadGoogleScript()
    // @ts-expect-error injected by the Google script at runtime
    window.google.accounts.id.initialize({ client_id: clientId, callback })
    const width = el.clientWidth || 300
    // @ts-expect-error injected by the Google script at runtime
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width,
      ...options
    })
  }

  return { loadGoogleScript, renderGoogleButton }
}
