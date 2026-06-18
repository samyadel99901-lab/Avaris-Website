"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/admin/ui/Button";
import { downloadCsv, toCsv } from "@/lib/csv";

/**
 * Renders a "Export CSV" button. Pre-built CSV approach: the parent
 * passes already-shaped rows, we just write + download. No re-fetch.
 */
export function ExportButton({
  filename,
  headers,
  rows,
  disabled,
}: {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  disabled?: boolean;
}) {
  const onClick = () => {
    const csv = toCsv(headers, rows);
    downloadCsv(filename.endsWith(".csv") ? filename : `${filename}.csv`, csv);
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title="Export to CSV"
    >
      <Download size={14} strokeWidth={1.75} /> CSV
    </Button>
  );
}
