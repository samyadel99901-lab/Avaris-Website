import { FilterSelect } from "@/components/admin/ui/FilterSelect";
import { SearchInput } from "@/components/admin/ui/SearchInput";
import { PROJECT_VIDEO_TYPE_LABELS } from "@/lib/admin/format";
import type { ProjectVideoType } from "@/types/projects";

const VIDEO_TYPE_OPTIONS = (
  Object.keys(PROJECT_VIDEO_TYPE_LABELS) as ProjectVideoType[]
).map((value) => ({ value, label: PROJECT_VIDEO_TYPE_LABELS[value] }));

const CLASS_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
];

const SCAMMER_OPTIONS = [
  { value: "valid", label: "Valid only" },
  { value: "scammer", label: "Scammers only" },
];

export function ProjectsFilters({
  statuses,
  invoiceStatuses,
}: {
  statuses: string[];
  invoiceStatuses: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3">
      <SearchInput
        param="q"
        placeholder="Search project, code, client…"
        className="w-full max-w-xs"
      />
      <FilterSelect
        param="status"
        label="Status"
        options={statuses.map((s) => ({ value: s, label: s }))}
      />
      <FilterSelect param="class" label="Class" options={CLASS_OPTIONS} />
      <FilterSelect
        param="vt"
        label="Type"
        options={VIDEO_TYPE_OPTIONS}
      />
      <FilterSelect
        param="invoice"
        label="Invoice"
        options={invoiceStatuses.map((s) => ({ value: s, label: s }))}
      />
      <FilterSelect
        param="scammer"
        label="Trust"
        options={SCAMMER_OPTIONS}
      />
    </div>
  );
}
