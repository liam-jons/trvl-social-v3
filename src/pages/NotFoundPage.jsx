import { Link } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <GlassCard className="max-w-md w-full text-center p-8">
        <div className="text-8xl mb-4">404</div>
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-3">
          <Link to="/" className="block">
            <GlassButton variant="primary" className="w-full">
              Go to Homepage
            </GlassButton>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="w-full"
          >
            <GlassButton variant="ghost" className="w-full">
              Go Back
            </GlassButton>
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default NotFoundPage;