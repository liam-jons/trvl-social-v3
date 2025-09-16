import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, Users, DollarSign, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useRealTimeMetrics } from '../../hooks/useRealTimeMetrics';

/**
 * Real-Time Metrics Component
 * Displays live metrics with WebSocket updates
 */
const RealTimeMetrics = ({ className = "" }) => {
  const { metrics, isConnected, lastUpdated, refreshMetrics } = useRealTimeMetrics(null, 15000);

  if (!metrics) {
    return (
      <div className={`real-time-metrics ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Activity className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">Loading real-time metrics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`real-time-metrics space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-Time Metrics</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-500">
            Updated: {formatTime(lastUpdated)}
          </span>
        </div>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <LiveMetricCard
          title="Active Users Now"
          value={metrics.realTime.activeUsersNow}
          icon={<Users className="w-4 h-4" />}
          color="blue"
          pulse={true}
        />
        <LiveMetricCard
          title="New Bookings Today"
          value={metrics.realTime.newBookingsToday}
          icon={<Activity className="w-4 h-4" />}
          color="green"
          pulse={true}
        />
        <LiveMetricCard
          title="Revenue Today"
          value={`$${metrics.realTime.revenueToday.toLocaleString()}`}
          icon={<DollarSign className="w-4 h-4" />}
          color="purple"
          pulse={true}
        />
        <LiveMetricCard
          title="Avg Session Time"
          value={formatDuration(metrics.realTime.averageSessionTime)}
          icon={<Clock className="w-4 h-4" />}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Top Pages (Live)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.realTime.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <span className="font-medium">{page.page}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{page.visitors}</span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.alerts && metrics.alerts.length > 0 ? (
              <div className="space-y-3">
                {metrics.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className={`w-4 h-4 mt-0.5 ${
                      alert.severity === 'high' ? 'text-red-500' :
                      alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{alert.message}</div>
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No active alerts</p>
                <p className="text-xs mt-1">System operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(metrics.realTime.bounceRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Bounce Rate</div>
              <div className={`w-2 h-2 mx-auto mt-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(metrics.kpis.conversionRate).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Conversion Rate</div>
              <div className={`w-2 h-2 mx-auto mt-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.realTime.activeUsersNow}
              </div>
              <div className="text-sm text-gray-500">Peak Today</div>
              <div className={`w-2 h-2 mx-auto mt-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Live Metric Card Component
const LiveMetricCard = ({ title, value, icon, color = "blue", pulse = false }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-full ${colorClasses[color]} relative`}>
            {icon}
            {pulse && (
              <div className={`absolute inset-0 rounded-full ${colorClasses[color]} animate-ping opacity-20`} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMetrics;