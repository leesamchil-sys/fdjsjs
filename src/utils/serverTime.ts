/**
 * Server Time & KST Synchronization Utility
 * 
 * Guarantees that the entire application operates strictly on Korean Standard Time (KST, UTC+9)
 * served by the server clock.
 * 
 * Monotonic clock (`performance.now()`) anchor guarantees that changing the local device/OS
 * time does NOT alter application time calculations.
 */

let serverTimeAnchorMs = Date.now();
let anchorPerfMs = performance.now();
let isServerTimeSynced = false;
let isApiProxyTimeAvailable: boolean | null = null; // Track if /api/proxy/time exists on backend

type SyncListener = () => void;
const listeners: Set<SyncListener> = new Set();

export function subscribeServerTimeSync(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Fetch authoritative server time from `/api/proxy/time` or static resource Date header
 * and calibrate local monotonic anchor.
 */
export async function syncServerTime(): Promise<number> {
  const startPerf = performance.now();

  // 1. Try Express API Endpoint if available
  if (isApiProxyTimeAvailable !== false) {
    try {
      const res = await fetch('/api/proxy/time', { cache: 'no-store' });
      const endPerf = performance.now();
      const rtt = endPerf - startPerf;

      if (res.ok) {
        const data = await res.json();
        if (typeof data.unixtime === 'number') {
          isApiProxyTimeAvailable = true;
          const serverNowMs = data.unixtime + Math.round(rtt / 2);
          anchorPerfMs = endPerf;
          serverTimeAnchorMs = serverNowMs;
          isServerTimeSynced = true;
          listeners.forEach(fn => fn());
          return getServerTimeMs();
        }
      } else if (res.status === 404) {
        // Backend express proxy route does not exist (e.g., Static SPA deployment)
        isApiProxyTimeAvailable = false;
      }
    } catch {
      // Network failure or CORS error
    }
  }

  // 2. Fallback for Static Hosting: Use HEAD request to /version.json or / to read server 'Date' header
  if (isApiProxyTimeAvailable === false || !isServerTimeSynced) {
    try {
      const res = await fetch('/version.json?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      const endPerf = performance.now();
      const rtt = endPerf - startPerf;

      const dateHeader = res.headers.get('date');
      if (dateHeader) {
        const headerTime = new Date(dateHeader).getTime();
        if (!isNaN(headerTime) && headerTime > 0) {
          anchorPerfMs = endPerf;
          serverTimeAnchorMs = headerTime + Math.round(rtt / 2);
          isServerTimeSynced = true;
          listeners.forEach(fn => fn());
          return getServerTimeMs();
        }
      }
    } catch {
      // Ignore fallback failures
    }
  }

  return getServerTimeMs();
}

/**
 * Returns current server time in epoch milliseconds (UTC).
 * Resistant to local OS clock modification.
 */
export function getServerTimeMs(): number {
  const elapsed = performance.now() - anchorPerfMs;
  return serverTimeAnchorMs + elapsed;
}

/**
 * Converts epoch UTC milliseconds into a Date object shifted so that standard
 * Date getters (.getHours(), .getDate(), .getMonth(), .getFullYear(), .getDay(), format())
 * strictly reflect Korean Standard Time (KST, UTC+9) regardless of browser timezone or local device clock.
 */
export function getKSTDateFromMs(utcMs: number): Date {
  const date = new Date(utcMs);
  const localOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const kstOffsetMs = 9 * 60 * 60 * 1000; // +9 hours
  return new Date(utcMs + localOffsetMs + kstOffsetMs);
}

/**
 * Returns the current server time as a KST Date object.
 */
export function getServerTimeKST(): Date {
  return getKSTDateFromMs(getServerTimeMs());
}

/**
 * Indicates whether server time has been successfully synchronized with the server endpoint.
 */
export function isSynced(): boolean {
  return isServerTimeSynced;
}

// Global auto-sync setup
if (typeof window !== 'undefined') {
  syncServerTime();

  const handleSyncTrigger = () => { syncServerTime(); };
  window.addEventListener('focus', handleSyncTrigger);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncServerTime();
    }
  });
  window.addEventListener('online', handleSyncTrigger);

  // Periodic background sync every 3 minutes
  setInterval(syncServerTime, 180000);
}
