import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ Role'),
  description: z.string().optional(),
  permissionKeys: z.array(z.string()).min(0),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
