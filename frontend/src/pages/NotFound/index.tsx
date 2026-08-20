import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

const NotFound: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 p-6">
      <EmptyState
        icon={<FileQuestion className="h-6 w-6" />}
        title="404 — Page not found"
        description="The page you're looking for doesn't exist or hasn't been migrated yet."
        action={
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
};

export default NotFound;
