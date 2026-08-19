// Dashboard summary types (Wave 2)
export interface DashboardCountGroup {
  label: string;
  count: number;
}

export interface DashboardSummary {
  totalAssets: number;
  activeAssets: number;
  idleAssets: number;
  byCategory: DashboardCountGroup[];
  byLocation: DashboardCountGroup[];
  byDepartment: DashboardCountGroup[];
}
