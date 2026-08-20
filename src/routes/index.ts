export type { Page, NavigateFunction, PageParams } from './types';
export { STANDALONE_PAGES, isStandalonePage } from './types';
export { buildBreadcrumb, type BreadcrumbCrumb } from './breadcrumbs';
export {
  renderPage,
  renderStandalonePage,
  Placeholder,
  ProcurementPlaceholder,
  AuditPlaceholder,
  DocumentsPlaceholder,
  ApprovalsPlaceholder,
  AnalyticsPlaceholder,
} from './pageRoutes';
