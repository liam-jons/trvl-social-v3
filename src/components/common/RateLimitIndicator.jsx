import { useState, useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import rateLimiter from '../../services/rate-limiter';
import GlassCard from '../ui/GlassCard';

const RateLimitIndicator = ({ endpoint = 'default', showDetails = false }) => {
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const updateInfo = () => {
      const info = rateLimiter.getRateLimitInfo(endpoint);
      setRateLimitInfo(info);

      // Show warning if less than 20% capacity remaining
      const percentageRemaining = (info.available / info.limit) * 100;
      setIsWarning(percentageRemaining < 20);
    };

    updateInfo();
    const interval = setInterval(updateInfo, 1000);

    return () => clearInterval(interval);
  }, [endpoint]);

  if (!rateLimitInfo) return null;

  const percentageUsed = ((rateLimitInfo.limit - rateLimitInfo.available) / rateLimitInfo.limit) * 100;
  const resetIn = Math.max(0, Math.ceil((rateLimitInfo.reset - new Date()) / 1000));

  // Don't show if plenty of capacity and not in detail mode
  if (!showDetails && !isWarning) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <GlassCard className={`p-3 ${isWarning ? 'border-yellow-500 dark:border-yellow-400' : ''}`}>
        <div className="flex items-center gap-3">
          {isWarning ? (
            <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
          ) : (
            <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          )}

          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              API Rate Limit
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {rateLimitInfo.available}/{rateLimitInfo.limit} requests
            </div>

            {showDetails && (
              <>
                <div className="mt-2 space-y-1 text-xs">
                  <div>Endpoint: {endpoint}</div>
                  <div>Reset in: {resetIn}s</div>
                  <div>Global: {rateLimitInfo.globalAvailable}/{rateLimitInfo.globalLimit}</div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isWarning
                        ? 'bg-yellow-500 dark:bg-yellow-400'
                        : 'bg-blue-500 dark:bg-blue-400'
                    }`}
                    style={{ width: `${100 - percentageUsed}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default RateLimitIndicator;