import { pageTitles } from '@/config/navigation';
import type { Page } from './types';

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

export function buildBreadcrumb(
  page: Page,
  ticketId?: string,
  employeeId?: string,
  licenseId?: string
): BreadcrumbCrumb[] {
  const meta = pageTitles[page] ?? { title: 'RAISE', subtitle: '' };
  const crumbs: BreadcrumbCrumb[] = [{ label: 'Home', href: '#' }];

  if (page === 'asset-detail') {
    crumbs.push({ label: 'Asset Management', href: '#' });
    crumbs.push({ label: 'Asset Details' });
  } else if (page === 'employee-detail') {
    crumbs.push({ label: 'Employee Management', href: '#' });
    crumbs.push({ label: 'Employee Details' });
  } else if (page === 'license-detail') {
    crumbs.push({ label: 'Software Licenses', href: '#' });
    crumbs.push({ label: 'License Details' });
  } else if (page === 'ticket-detail') {
    crumbs.push({ label: 'IT Service', href: '#' });
    crumbs.push({ label: 'Tickets', href: '#' });
    crumbs.push({ label: ticketId || 'REQ-2026-0042' });
  } else if (page === 'create-asset') {
    crumbs.push({ label: 'Asset Management', href: '#' });
    crumbs.push({ label: 'Create Asset' });
  } else if (page === 'user-management' || page === 'role-management') {
    crumbs.push({ label: 'Administration', href: '#' });
    crumbs.push({ label: meta.title });
  } else {
    crumbs.push({ label: meta.title });
  }

  return crumbs;
}
