import { useEffect, useState } from 'react'

/**
 * Keeps the screen on while `active`. Returns false when the browser can't
 * (no API, or the request was refused), so the caller can show the auto-lock tip.
 */
export function useWakeLock(active: boolean): boolean {
  const [ok, setOk] = useState(() => 'wakeLock' in navigator)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      if (document.visibilityState !== 'visible' || (sentinel && !sentinel.released)) return
      try {
        const s = await navigator.wakeLock.request('screen')
        if (cancelled) void s.release()
        else {
          sentinel = s
          setOk(true)
        }
      } catch {
        if (!cancelled) setOk(false)
      }
    }

    // The lock is dropped whenever the page is hidden; ask again when it comes back.
    document.addEventListener('visibilitychange', request)
    void request()
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      void sentinel?.release()
    }
  }, [active])

  return ok
}
