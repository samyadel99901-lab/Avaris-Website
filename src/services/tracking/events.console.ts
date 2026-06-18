import type { EventsService } from "./events";

/**
 * Dev / no-Supabase fallback. Logs each event to the server console
 * so we can see the tracking pipeline working without a database.
 */
export function createConsoleEventsService(): EventsService {
  return {
    async insertBatch(events) {
      for (const ev of events) {
        // eslint-disable-next-line no-console
        console.log("[tracking]", ev.eventType, {
          path: ev.path,
          session: ev.sessionId,
          data: ev.eventData,
        });
      }
    },
  };
}
