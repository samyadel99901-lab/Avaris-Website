import type {
  Project,
  ProjectFilters,
  ProjectListResult,
  ProjectStats,
} from "@/types/projects";
import type { ProjectsService } from "./projects";

const NOW = new Date("2026-05-10T00:00:00Z").toISOString();
function dAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
function dFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}
function dDate(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

const MOCK_PROJECTS: Project[] = [
  proj(1, "Bennett tower walkthrough", "mock_001", "Olivia Bennett", "A", "video_long", "In progress", 28, 14, 250000, 50000, false),
  proj(2, "Reyes Hospitality launch reel", "mock_003", "Sofia Reyes", "A", "reel_short", "In progress", 12, 7, 80000, 0, false),
  proj(3, "Chen Group brand film", "mock_002", "Marcus Chen", "B", "video_long", "Revisions", 45, 3, 120000, 30000, false),
  proj(4, "Williams + Co listing series", "mock_006", "Noah Williams", "A", "video_short", "In progress", 8, 21, 60000, 15000, false),
  proj(5, "Aboud RE quarterly highlights", null, "Tariq Aboud", "B", "reel_long", "Ready For Approval", 35, 2, 95000, 25000, false),
  proj(6, "Foster Group pitch deck reel", null, "Liam Foster", "A", "reel_short", "Done", 60, -5, 75000, 75000, false),
  proj(7, "Patel Estates aerial pack", "mock_005", "Aisha Patel", "C", "photo", "Waiting", 50, null, 40000, 10000, false),
  proj(8, "Hassan Holdings teaser", null, "Lia Hassan", "A", "video_short", "In progress", 18, 10, 110000, 25000, false),
  proj(9, "Suspicious quick-edit job", null, "Unknown", "C", "other", "Archived", 90, null, 0, 0, true),
  proj(10, "Cruz Studios product launch", "mock_009", "Amelia Cruz", "B", "video_long", "Internal revisions", 22, 5, 180000, 40000, false),
];

function proj(
  i: number,
  name: string,
  clientId: string | null,
  clientName: string,
  cls: "A" | "B" | "C",
  videoType: Project["videoType"],
  status: string,
  startDays: number,
  dueDays: number | null,
  paypalCents: number,
  depositCents: number,
  scammer: boolean,
): Project {
  return {
    id: `mockp_${String(i).padStart(3, "0")}`,
    mondayItemId: 9000 + i,
    name,
    code: `PRJ${String(1000 + i).padStart(4, "0")}`,
    clientId,
    clientName,
    mondayClientItemId: clientId ? 1000 + Number(clientId.split("_")[1]) : null,
    class: cls,
    videoType,
    videoTypeRaw: videoType ?? "Photo Editing",
    status,
    invoiceStatus: status === "Done" ? "Paid" : "Pendeing",
    editorPayStatus: status === "Done" ? "Paid" : "Pendeing",
    deliveryStatus: status === "Done" ? "Sent" : "—",
    timelineStart: dDate(startDays),
    timelineEnd: dueDays !== null ? dFromNow(dueDays) : null,
    financials: {
      paypalIncomeCents: paypalCents,
      depositCents: depositCents,
      samyPaypalCents: Math.round(paypalCents * 0.7),
      editorCostEgp: Math.round(paypalCents / 50), // rough mock
      bonusEgp: status === "Done" ? 500 : 0,
    },
    isScammer: scammer,
    clientEta: "5 business days",
    footageLink: scammer ? null : "https://drive.google.com/example",
    finalVideoLink: status === "Done" ? "https://drive.google.com/final" : null,
    mondayUpdatedAt: dAgo(2),
    syncedAt: NOW,
    createdAt: dAgo(startDays + 5),
  };
}

export function createMockProjectsService(): ProjectsService {
  return {
    async list(filters: ProjectFilters = {}): Promise<ProjectListResult> {
      let items = [...MOCK_PROJECTS];

      if (filters.status) items = items.filter((p) => p.status === filters.status);
      if (filters.class && filters.class !== "all") {
        items = items.filter((p) => p.class === filters.class);
      }
      if (filters.videoType && filters.videoType !== "all") {
        items = items.filter((p) => p.videoType === filters.videoType);
      }
      if (filters.invoiceStatus) {
        items = items.filter((p) => p.invoiceStatus === filters.invoiceStatus);
      }
      if (filters.scammer === "scammer") items = items.filter((p) => p.isScammer);
      else if (filters.scammer === "valid") items = items.filter((p) => !p.isScammer);
      if (filters.clientId) items = items.filter((p) => p.clientId === filters.clientId);
      if (filters.search?.trim()) {
        const t = filters.search.trim().toLowerCase();
        items = items.filter(
          (p) =>
            p.name.toLowerCase().includes(t) ||
            p.code?.toLowerCase().includes(t) ||
            p.clientName?.toLowerCase().includes(t),
        );
      }
      if (filters.timelineFrom) {
        items = items.filter(
          (p) =>
            p.timelineStart !== null && p.timelineStart >= filters.timelineFrom!,
        );
      }
      if (filters.timelineTo) {
        items = items.filter(
          (p) =>
            p.timelineStart !== null && p.timelineStart <= filters.timelineTo!,
        );
      }

      const sortBy = filters.sortBy ?? "monday_updated_at";
      const sortDir = filters.sortDir ?? "desc";
      items.sort((a, b) => {
        const av = sortValue(a, sortBy);
        const bv = sortValue(b, sortBy);
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });

      const total = items.length;
      const page = Math.max(1, filters.page ?? 1);
      const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50));
      const start = (page - 1) * pageSize;
      return {
        items: items.slice(start, start + pageSize),
        total,
        page,
        pageSize,
      };
    },

    async getById(id: string): Promise<Project | null> {
      return MOCK_PROJECTS.find((p) => p.id === id) ?? null;
    },

    async getStats(): Promise<ProjectStats> {
      const active = MOCK_PROJECTS.filter((p) =>
        ["Waiting", "In progress", "Revisions", "Ready For Approval", "Internal revisions"].includes(
          p.status ?? "",
        ),
      ).length;
      const done = MOCK_PROJECTS.filter((p) => p.status === "Done").length;
      const scammer = MOCK_PROJECTS.filter((p) => p.isScammer).length;
      const revenue = MOCK_PROJECTS.reduce(
        (s, p) => s + (p.financials.paypalIncomeCents ?? 0),
        0,
      );
      return {
        totalActive: active,
        totalDone: done,
        scammerCount: scammer,
        totalRevenueCentsThisMonth: revenue,
      };
    },

    async listStatuses(): Promise<string[]> {
      return Array.from(
        new Set(MOCK_PROJECTS.map((p) => p.status).filter(Boolean) as string[]),
      ).sort();
    },

    async listInvoiceStatuses(): Promise<string[]> {
      return Array.from(
        new Set(
          MOCK_PROJECTS.map((p) => p.invoiceStatus).filter(Boolean) as string[],
        ),
      ).sort();
    },
  };
}

function sortValue(
  p: Project,
  key: NonNullable<ProjectFilters["sortBy"]>,
): string | number {
  switch (key) {
    case "timeline_start":
      return p.timelineStart ?? "";
    case "monday_updated_at":
      return p.mondayUpdatedAt ?? "";
    case "paypal_income":
      return p.financials.paypalIncomeCents ?? 0;
  }
}
