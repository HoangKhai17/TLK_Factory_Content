export type ProjectStatus = "active" | "archived";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}
