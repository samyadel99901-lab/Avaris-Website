import { connection } from "next/server";
import { Card } from "@/components/admin/ui/Card";
import { Pagination } from "@/components/admin/ui/Pagination";
import { ProjectsFilters } from "@/components/admin/projects/ProjectsFilters";
import { ProjectsTable } from "@/components/admin/projects/ProjectsTable";
import { getProjectsService } from "@/services/admin";
import type {
  ProjectClass,
  ProjectFilters,
  ProjectVideoType,
} from "@/types/projects";

export const metadata = { title: "Projects" };

const VALID_CLASSES: ProjectClass[] = ["A", "B", "C"];
const VALID_VIDEO_TYPES: ProjectVideoType[] = [
  "reel_short",
  "reel_long",
  "video_short",
  "video_long",
  "photo",
  "other",
];

function parseFilters(
  params: Record<string, string | string[] | undefined>,
): ProjectFilters {
  const get = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };
  const clsRaw = get("class");
  const vtRaw = get("vt");
  const scammer = get("scammer");
  const page = Number.parseInt(get("page") ?? "1", 10) || 1;
  return {
    search: get("q"),
    status: get("status"),
    class:
      clsRaw && (VALID_CLASSES as string[]).includes(clsRaw)
        ? (clsRaw as ProjectClass)
        : undefined,
    videoType:
      vtRaw && (VALID_VIDEO_TYPES as string[]).includes(vtRaw)
        ? (vtRaw as ProjectVideoType)
        : undefined,
    invoiceStatus: get("invoice"),
    scammer:
      scammer === "scammer" || scammer === "valid"
        ? (scammer as "valid" | "scammer")
        : undefined,
    sortBy: "monday_updated_at",
    sortDir: "desc",
    page,
    pageSize: 50,
  };
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const filters = parseFilters(params);

  const service = getProjectsService();
  const [list, statuses, invoiceStatuses] = await Promise.all([
    service.list(filters),
    service.listStatuses(),
    service.listInvoiceStatuses(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Projects
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          {list.total.toLocaleString("en-US")} projects · synced from Monday.com
        </p>
      </header>

      <Card>
        <ProjectsFilters
          statuses={statuses}
          invoiceStatuses={invoiceStatuses}
        />
        <ProjectsTable items={list.items} />
        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
        />
      </Card>
    </div>
  );
}
