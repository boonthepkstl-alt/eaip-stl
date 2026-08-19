import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const mfaVerifySchema = z.object({
  code: z
    .string()
    .length(6, 'กรุณากรอกรหัส 6 หลัก')
    .regex(/^\d{6}$/, 'รหัสต้องเป็นตัวเลข 6 หลัก'),
});

export type MfaVerifyFormValues = z.infer<typeof mfaVerifySchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'รหัสผ่านใหม่ไม่ตรงกัน',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'กรุณากรอกรหัส 6 หลัก')
    .regex(/^\d{6}$/, 'รหัสต้องเป็นตัวเลข 6 หลัก'),
});

export type MfaCodeFormValues = z.infer<typeof mfaCodeSchema>;
