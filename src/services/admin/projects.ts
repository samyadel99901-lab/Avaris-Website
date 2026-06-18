import type {
  Project,
  ProjectFilters,
  ProjectListResult,
  ProjectStats,
} from "@/types/projects";

/**
 * Read API for projects. Backed by Supabase (production) or mocks
 * (local dev). Read-only — projects live on Monday.
 */
export interface ProjectsService {
  list(filters?: ProjectFilters): Promise<ProjectListResult>;
  getById(id: string): Promise<Project | null>;
  getStats(): Promise<ProjectStats>;
  /** Distinct status labels (for filter dropdown). */
  listStatuses(): Promise<string[]>;
  /** Distinct invoice_status labels (for filter dropdown). */
  listInvoiceStatuses(): Promise<string[]>;
}
