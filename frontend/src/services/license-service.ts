import { initialSoftwareLicenses } from '@/data/fixtures/licenseData';
import { assetService } from '@/services/asset-service';
import { employeeService } from '@/services/employee-service';
import { MockSoftwareLicenseRepository, type SoftwareLicenseRepository } from '@/services/license-repository';
import type { AllocateSeatInput, CreateLicenseInput, LicenseListQuery, RenewLicenseInput, SoftwareLicense, UpdateLicenseInput } from '@/types/license';

const repository: SoftwareLicenseRepository = new MockSoftwareLicenseRepository(initialSoftwareLicenses);

/**
 * The stable frontend contract for the Software License vertical slice (pages/Licenses,
 * pages/LicenseDetail). License is its own domain — this file depends on
 * assetService/employeeService one-way (to resolve employeeId/assetId into a seat's display
 * snapshot), and neither of those services imports anything from here. See
 * SOFTWARE-LICENSE-MIGRATION.md "Cross-domain relationships".
 */
export const licenseService = {
  listLicenses: (query: LicenseListQuery = {}) => repository.list(query),
  getLicense: (idOrCode: string) => repository.getById(idOrCode),

  createLicense: async (input: CreateLicenseInput): Promise<SoftwareLicense> => {
    const seq = (await repository.list({})).total + 1;
    const code = `LIC-${input.vendor.slice(0, 4).toUpperCase()}-${seq.toString().padStart(3, '0')}`;
    const license: SoftwareLicense = {
      id: `lic-${Date.now()}`,
      licenseCode: code,
      product: input.product,
      edition: input.edition || 'Standard Enterprise',
      vendor: input.vendor,
      vendorWebsite: 'https://admin.portal.com',
      vendorSupportEmail: `support@${input.vendor.toLowerCase().replace(/\s+/g, '')}.com`,
      vendorSupportPhone: '+1 (800) 555-0199',
      category: input.category,
      type: input.type,
      status: 'Active',
      complianceStatus: 'Compliant',
      seatsPurchased: input.seatsPurchased,
      seatsUsed: 0,
      seatsReserved: 0,
      annualCost: input.annualCost,
      costPerSeat: Math.round(input.annualCost / input.seatsPurchased),
      billingFrequency: 'Annual',
      currency: 'USD',
      poNumber: input.poNumber || `PO-2026-${Date.now().toString().slice(-4)}`,
      contractNumber: `CT-${Date.now().toString().slice(-6)}`,
      costCenter: 'CC-IT-GLOBAL',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: input.expiryDate,
      autoRenew: input.autoRenew ?? true,
      renewalNoticeDays: 45,
      supportTier: 'Enterprise Business Support',
      licenseKey: input.licenseKey || `${code}-KEY-AUTO-GENERATED`,
      isKeyMasked: true,
      activationMethod: 'SSO / SAML 2.0',
      description: `${input.product} subscription managed via RAISE Software Asset Management.`,
      departmentAllocations: [],
      allocatedSeats: [],
      installedAssets: [],
      history: [
        {
          id: `lh-${Date.now()}`,
          licenseId: `lic-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Contract Renewal',
          title: 'License Registered in System',
          description: `Registered ${input.product} (${code}) with ${input.seatsPurchased} seats.`,
          actor: 'Current Admin',
          badge: 'New',
        },
      ],
      auditLogs: [],
      linkedTicketCodes: [],
    };
    return repository.create(license);
  },

  updateLicense: (id: string, input: UpdateLicenseInput) => repository.update(id, input),
  renewLicense: (id: string, input: RenewLicenseInput) => repository.renew(id, input),

  allocateSeat: async (id: string, input: AllocateSeatInput): Promise<SoftwareLicense> => {
    const employee = await employeeService.getEmployee(input.employeeId);
    if (!employee) throw new Error(`Employee ${input.employeeId} not found`);
    const asset = input.assetId ? await assetService.getAsset(input.assetId) : null;

    return repository.allocateSeat(id, {
      id: `seat-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.employeeCode,
      employeeEmail: employee.email,
      department: employee.department,
      jobTitle: employee.jobTitle,
      assetId: asset?.id,
      assetCode: asset?.code,
      assetName: asset?.name,
      allocatedDate: new Date().toISOString().split('T')[0],
      lastActiveDate: new Date().toISOString().split('T')[0],
      usageStatus: 'Daily Active',
      allocationRole: input.allocationRole,
    });
  },

  releaseSeat: (id: string, seatId: string) => repository.releaseSeat(id, seatId),
};
