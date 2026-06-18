import { FilterSelect } from "@/components/admin/ui/FilterSelect";
import { SearchInput } from "@/components/admin/ui/SearchInput";
import { CLIENT_STATUS_LABELS } from "@/lib/admin/format";
import type { ClientStatus } from "@/types/clients";

const STATUS_OPTIONS = (
  Object.keys(CLIENT_STATUS_LABELS) as ClientStatus[]
).map((value) => ({ value, label: CLIENT_STATUS_LABELS[value] }));

export function ClientsFilters({
  countries,
}: {
  countries: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3">
      <SearchInput
        param="q"
        placeholder="Search name, email, code…"
        className="w-full max-w-xs"
      />
      <FilterSelect param="status" label="Status" options={STATUS_OPTIONS} />
      <FilterSelect
        param="country"
        label="Country"
        options={countries.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        param="special"
        label="Deal"
        options={[
          { value: "1", label: "Special only" },
          { value: "0", label: "Standard only" },
        ]}
      />
      <FilterSelect
        param="followup"
        label="Follow up"
        options={[{ value: "1", label: "Needs follow up" }]}
      />
    </div>
  );
}
