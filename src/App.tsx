import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { ToastProvider } from '@/components/ui';
import {
  type Page,
  buildBreadcrumb,
  renderPage,
  renderStandalonePage,
  isStandalonePage,
} from '@/routes';

function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [assetId, setAssetId] = useState<string | undefined>();
  const [ticketId, setTicketId] = useState<string | undefined>();
  const [employeeId, setEmployeeId] = useState<string | undefined>();
  const [licenseId, setLicenseId] = useState<string | undefined>();

  const navigate = (id: string, aid?: string) => {
    if (id === 'ticket-detail') {
      if (aid) setTicketId(aid);
    } else if (id === 'employee-detail') {
      if (aid) setEmployeeId(aid);
    } else if (id === 'license-detail') {
      if (aid) setLicenseId(aid);
    } else if (aid) {
      setAssetId(aid);
    }
    setPage(id as Page);
    window.scrollTo(0, 0);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auth pages & standalone error pages — no shell
  if (isStandalonePage(page)) {
    return (
      <ToastProvider>
        {renderStandalonePage(page, navigate)}
      </ToastProvider>
    );
  }

  // Breadcrumb builder
  const breadcrumb = buildBreadcrumb(page, ticketId, employeeId, licenseId);

  return (
    <ToastProvider>
      <AppShell current={page} onNavigate={navigate} breadcrumb={breadcrumb}>
        {renderPage(page, navigate, { assetId, ticketId, employeeId, licenseId })}
      </AppShell>
    </ToastProvider>
  );
}

export default App;
