/**
 * Visitor tracking types.
 *
 * `EventDataIn` is a discriminated union typed only on the way *in* —
 * what client code passes to `track()`. After hitting `/api/track` the
 * `type` discriminator becomes `event_type` (the column) and the rest
 * is stored as `event_data` jsonb. Read paths re-narrow from jsonb
 * where they need typed access.
 */

export type EventType =
  | "page_view"
  | "video_play"
  | "video_progress"
  | "cta_click"
  | "scroll_depth"
  | "external_link";

export type EventDataIn =
  | { type: "page_view" }
  | { type: "video_play"; videoSrc: string; videoLabel: string }
  | { type: "video_progress"; videoSrc: string; percent: 25 | 50 | 75 | 100 }
  | {
      type: "cta_click";
      ctaLabel: string;
      location: string;
      destination: string;
    }
  | {
      type: "scroll_depth";
      percent: 25 | 50 | 75 | 100;
      sectionId?: string;
    }
  | { type: "external_link"; href: string; label?: string };

export interface TrackingContext {
  sessionId: string;
  path: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  userAgent: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
}

export interface EventInput {
  sessionId: string;
  eventType: EventType;
  eventData: Record<string, unknown>;
  path: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  userAgent: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
}

export interface EventRecord extends EventInput {
  id: string;
  createdAt: string;
}
