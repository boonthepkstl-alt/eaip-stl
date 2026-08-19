import type { ReactNode } from 'react';

interface PlaceholderPageProps {
  title: string;
  icon: ReactNode;
  onNavigate: (id: string) => void;
}

/* Reusable placeholder page for nav items without a dedicated build yet */
export function PlaceholderPage({ title, icon }: PlaceholderPageProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-sm">
        <div className="h-14 w-14 rounded-full bg-surface-100 flex items-center justify-center text-surface-400 mx-auto mb-4">{icon}</div>
        <h3 className="text-title font-semibold text-surface-900">{title}</h3>
        <p className="text-body text-surface-500 mt-1">This module is part of the RAISE platform design. Connect a backend to activate full functionality.</p>
      </div>
    </div>
  );
}
