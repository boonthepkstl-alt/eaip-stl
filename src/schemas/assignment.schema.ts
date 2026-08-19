import { z } from 'zod';

// Assignment & Lifecycle schemas — Wave 4 (Epic: Assignment & Lifecycle (ASSIGN), FR-30..FR-33
// + Epic: Workflow & Approval (WF), FR-38..FR-44). Same pattern as src/schemas/asset.schema.ts.

export const assignAssetSchema = z.object({
  assetId: z.string().min(1, 'กรุณาเลือก Asset'),
  employeeId: z.string().min(1, 'กรุณาเลือกพนักงาน'),
  assignedDate: z.string().min(1, 'กรุณาระบุวันที่มอบหมาย'),
  // FR-40 (due date) — optional field only, ห้าม enforce
  expectedReturnDate: z.string().optional(),
});
export type AssignAssetFormValues = z.infer<typeof assignAssetSchema>;

export const transferAssetSchema = z.object({
  assetId: z.string().min(1, 'กรุณาเลือก Asset'),
  fromEmployeeId: z.string().min(1, 'กรุณาระบุผู้ถือครองเดิม'),
  toEmployeeId: z.string().min(1, 'กรุณาเลือกผู้ถือครองใหม่'),
  transferDate: z.string().min(1, 'กรุณาระบุวันที่โอนย้าย'),
  reason: z.string().optional(),
});
export type TransferAssetFormValues = z.infer<typeof transferAssetSchema>;

export const checkOutSchema = z.object({
  assetId: z.string().min(1, 'กรุณาเลือก Asset'),
  employeeId: z.string().min(1, 'กรุณาเลือกพนักงาน'),
  checkOutDate: z.string().min(1, 'กรุณาระบุวันที่ยืม'),
  // FR-40 (due date) — expectedReturnDate ต้อง optional เสมอ ห้าม enforce
  expectedReturnDate: z.string().optional(),
});
export type CheckOutFormValues = z.infer<typeof checkOutSchema>;

export const checkInSchema = z.object({
  assignmentId: z.string().min(1, 'กรุณาระบุรายการที่ต้องการคืน'),
  checkInDate: z.string().min(1, 'กรุณาระบุวันที่คืน'),
  note: z.string().optional(),
});
export type CheckInFormValues = z.infer<typeof checkInSchema>;

export const approvalActionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comment: z.string().optional(),
});
export type ApprovalActionFormValues = z.infer<typeof approvalActionSchema>;
