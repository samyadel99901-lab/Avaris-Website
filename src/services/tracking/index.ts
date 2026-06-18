import { env } from "@/lib/env";
import { createConsoleEventsService } from "./events.console";
import { createSupabaseEventsService } from "./events.supabase";
import type { EventsService } from "./events";

/**
 * Factory: returns the Supabase adapter when env is configured,
 * otherwise the console adapter (dev / partial setup).
 */
export function createEventsService(): EventsService {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseEventsService();
  }
  return createConsoleEventsService();
}

export type { EventsService } from "./events";
