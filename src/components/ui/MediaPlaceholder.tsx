import { cn } from "@/lib/utils";

type Tone = "dark" | "light";
type Aspect = "video" | "square" | "portrait" | "auto";

type MediaPlaceholderProps = {
  /** Asset name — shown to make missing media obvious during dev. */
  label: string;
  className?: string;
  /** Match the surface this placeholder sits on. */
  tone?: Tone;
  aspect?: Aspect;
};

const tones: Record<Tone, string> = {
  dark: "bg-elevated/40 border-hairline-strong text-ink-faint",
  light: "bg-zinc-100 border-zinc-300 text-zinc-500",
};

const aspects: Record<Aspect, string> = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  auto: "",
};

/**
 * Reusable rectangle for any image / video / logo we don't have yet.
 * Always rendered with a visible label so the layout reads as
 * "asset will live here" rather than "broken thing".
 *
 * Swap with a real `next/image` (or `<video>`) once the asset lands.
 */
export function MediaPlaceholder({
  label,
  className,
  tone = "dark",
  aspect = "auto",
}: MediaPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${label} (placeholder)`}
      className={cn(
        "flex w-full select-none items-center justify-center rounded-md border border-dashed font-body text-xs uppercase tracking-wider",
        aspects[aspect],
        tones[tone],
        className,
      )}
    >
      {label}
    </div>
  );
}
