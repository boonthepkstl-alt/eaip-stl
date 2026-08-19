import { z } from 'zod';

export const assetInventoryReportFilterSchema = z.object({
  categoryId: z.string().optional(),
  locationId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export type AssetInventoryReportFilterFormValues = z.infer<typeof assetInventoryReportFilterSchema>;

export const assetAssignmentReportFilterSchema = z.object({
  departmentId: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type AssetAssignmentReportFilterFormValues = z.infer<typeof assetAssignmentReportFilterSchema>;
