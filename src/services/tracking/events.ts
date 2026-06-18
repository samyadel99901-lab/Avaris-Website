import type { EventInput } from "@/types/tracking";

/**
 * Events service interface — port for the tracking ingest pipeline.
 * `events.console.ts` is used during dev (logs only). `events.supabase.ts`
 * inserts into the production table when env is configured.
 */
export interface EventsService {
  insertBatch(events: EventInput[]): Promise<void>;
}
