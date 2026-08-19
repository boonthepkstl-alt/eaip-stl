import { z } from 'zod';

export const createAssetSchema = z.object({
  assetTag: z.string().min(1, 'กรุณากรอกรหัสครุภัณฑ์ (Asset Tag)'),
  name: z.string().min(1, 'กรุณากรอกชื่อ Asset'),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  locationId: z.string().min(1, 'กรุณาเลือกสถานที่'),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  vendorId: z.string().optional(),
  warrantyExpiryDate: z.string().optional(),
});

export type CreateAssetFormValues = z.infer<typeof createAssetSchema>;
