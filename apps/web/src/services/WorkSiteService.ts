import { WorkSite } from "@/types/worksite";

export class WorkSiteService {
  private workSites: WorkSite[];

  constructor(initialWorkSites: WorkSite[]) {
    this.workSites = initialWorkSites;
  }

  addWorkSite(workSite: WorkSite) {
    this.workSites.push(workSite);
    return this.workSites;
  }

  updateWorkSite(updatedWorkSite: WorkSite) {
    const index = this.workSites.findIndex((r) => r.id === updatedWorkSite.id);
    if (index !== -1) {
      this.workSites[index] = { ...this.workSites[index], ...updatedWorkSite };
    }
    return this.workSites;
  }

  removeWorkSite(id: number) {
    this.workSites = this.workSites.filter((r) => r.id !== id);
    return this.workSites;
  }

  getWorkSites() {
    return [...this.workSites];
  }
}
