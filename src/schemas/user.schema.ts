import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3, 'กรุณากรอก Username อย่างน้อย 3 ตัวอักษร'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  roleId: z.string().min(1, 'กรุณาเลือก Role'),
  departmentId: z.string().min(1, 'กรุณาเลือกแผนก'),
  employeeId: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
