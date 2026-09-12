/**
 * Production client telemetry and audit instrumentation for LootLedger.
 * Tracks user engagement and operational metrics without storing PII.
 */

export type TelemetryEvent =
  | { name: 'app_initialized'; data: { version: string; isOnline: boolean } }
  | { name: 'auth_sign_in'; data: { method: 'google' | 'guest'; uid?: string } }
  | { name: 'auth_sign_out'; data: {} }
  | { name: 'appraisal_started'; data: { category?: string; hasMarks: boolean; price: number } }
  | { name: 'appraisal_completed'; data: { verdict: string; confidence: number; risk: number; durationMs: number } }
  | { name: 'appraisal_failed'; data: { error: string; code?: string } }
  | { name: 'inventory_item_saved'; data: { itemId: string; status: string; netProfit: number } }
  | { name: 'inventory_item_updated'; data: { itemId: string; newStatus: string } }
  | { name: 'inventory_item_deleted'; data: { itemId: string } }
  | { name: 'inventory_exported_csv'; data: { itemCount: number } }
  | { name: 'listing_copied'; data: { platform: string; field: 'title' | 'description' | 'all' } }
  | { name: 'settings_updated'; data: { defaultMarketplace: string; feePercent: number } };

class TelemetryService {
  private isDev = Boolean((import.meta as any)?.env?.DEV);

  track(event: TelemetryEvent) {
    const payload = {
      ...event,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
    };

    if (this.isDev) {
      console.log(`[Telemetry] ${event.name}`, payload.data);
    }

    // In a production setup, dispatch to analytics beacon or endpoint
    try {
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push(payload);
      }
    } catch {
      // safe fallback
    }
  }
}

export const telemetry = new TelemetryService();
