import { z } from 'zod';

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อพนักงาน'),
  departmentId: z.string().min(1, 'กรุณาเลือกแผนก'),
  positionTitle: z.string().optional(),
  costCenter: z.string().optional(),
  directManagerId: z.string().optional(),
});

export type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;
