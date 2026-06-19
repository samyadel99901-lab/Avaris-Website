import { redirect } from "next/navigation";

// Overview merged into Analytics: its unique widgets (the Visitors KPI +
// Recent activity feed) now live on /admin/analytics, and the Monday-sourced
// KPIs (clients/projects/revenue) moved out to automation-standalone.
export default function OverviewPage() {
  redirect("/admin/analytics");
}
