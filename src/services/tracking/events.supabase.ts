import { createServiceRoleClient } from "@/lib/supabase";
import type { EventsService } from "./events";

/**
 * Supabase adapter — inserts a batch of events into `public.events`.
 * Server-only. Uses the service role client which bypasses RLS.
 */
export function createSupabaseEventsService(): EventsService {
  const db = createServiceRoleClient();

  return {
    async insertBatch(events) {
      if (events.length === 0) return;
      const rows = events.map((e) => ({
        session_id: e.sessionId,
        event_type: e.eventType,
        event_data: e.eventData,
        path: e.path,
        referrer: e.referrer,
        utm_source: e.utmSource,
        utm_medium: e.utmMedium,
        utm_campaign: e.utmCampaign,
        user_agent: e.userAgent,
        viewport_width: e.viewportWidth,
        viewport_height: e.viewportHeight,
      }));
      const { error } = await db.from("events").insert(rows);
      if (error) throw error;
    },
  };
}
