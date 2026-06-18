import { connection } from "next/server";
import { Card } from "@/components/admin/ui/Card";
import { Pagination } from "@/components/admin/ui/Pagination";
import { ClientsFilters } from "@/components/admin/clients/ClientsFilters";
import { ClientsTable } from "@/components/admin/clients/ClientsTable";
import { getClientsService } from "@/services/admin";
import type { ClientFilters, ClientStatus } from "@/types/clients";

export const metadata = { title: "Clients" };

const VALID_STATUSES: ClientStatus[] = [
  "new",
  "to_review",
  "important",
  "active",
  "quiet",
  "not_found",
  "upset",
  "inactive",
];

function parseFilters(
  params: Record<string, string | string[] | undefined>,
): ClientFilters {
  const get = (k: string) => {
    const v = params[k];
    return typeof v === "string" ? v : undefined;
  };
  const status = get("status");
  const special = get("special");
  const followup = get("followup");
  const page = Number.parseInt(get("page") ?? "1", 10) || 1;
  return {
    search: get("q"),
    status:
      status && (VALID_STATUSES as string[]).includes(status)
        ? (status as ClientStatus)
        : undefined,
    country: get("country"),
    hasSpecialDeal: special === "1" ? true : special === "0" ? false : undefined,
    needsFollowup: followup === "1" ? true : undefined,
    sortBy: "last_project_at",
    sortDir: "desc",
    page,
    pageSize: 50,
  };
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Page reads searchParams → must be dynamic.
  await connection();
  const params = await searchParams;
  const filters = parseFilters(params);

  const service = getClientsService();
  const [list, countries] = await Promise.all([
    service.list(filters),
    service.listCountries(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wide text-ink">
          Clients
        </h1>
        <p className="mt-1 font-body text-sm text-ink-muted">
          {list.total.toLocaleString("en-US")} clients · synced from Monday.com
        </p>
      </header>

      <Card>
        <ClientsFilters countries={countries} />
        <ClientsTable items={list.items} />
        <Pagination
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
        />
      </Card>
    </div>
  );
}
