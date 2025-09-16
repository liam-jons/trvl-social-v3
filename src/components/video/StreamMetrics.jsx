import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  ClockIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import useVideoStreamStore from '../../stores/videoStreamStore';
import { analyticsService } from '../../services/analytics-service';
import GlassCard from '../ui/GlassCard';

const StreamMetrics = ({ streamId, vendorId, className = "" }) => {
  const [realTimeData, setRealTimeData] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [timeRange, setTimeRange] = useState('24h'); // 24h, 7d, 30d
  const [isLoading, setIsLoading] = useState(false);

  const { streamMetrics } = useVideoStreamStore();

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const dataPoint = {
        timestamp: now.toISOString(),
        viewers: streamMetrics.viewerCount + Math.floor(Math.random() * 10 - 5),
        engagement: streamMetrics.engagement + Math.floor(Math.random() * 20 - 10),
        chatMessages: Math.floor(Math.random() * 5),
        likes: Math.floor(Math.random() * 3)
      };

      setRealTimeData(prev => {
        const updated = [...prev, dataPoint];
        return updated.slice(-30); // Keep last 30 data points
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [streamMetrics]);

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from your analytics API
        const mockHistoricalData = generateMockHistoricalData(timeRange);
        setHistoricalData(mockHistoricalData);
      } catch (error) {
        console.error('Failed to fetch historical data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [timeRange, streamId]);

  // Generate mock historical data
  const generateMockHistoricalData = (range) => {
    const data = [];
    const points = range === '24h' ? 24 : range === '7d' ? 7 : 30;
    const baseViewers = 50;

    for (let i = 0; i < points; i++) {
      data.push({
        time: range === '24h' ? `${i}:00` : `Day ${i + 1}`,
        viewers: baseViewers + Math.floor(Math.random() * 100),
        engagement: 60 + Math.floor(Math.random() * 40),
        chatMessages: Math.floor(Math.random() * 50),
        likes: Math.floor(Math.random() * 20),
        watchTime: 15 + Math.floor(Math.random() * 45) // minutes
      });
    }

    return data;
  };

  // Calculate trends
  const calculateTrend = (data, metric) => {
    if (data.length < 2) return 0;

    const recent = data.slice(-5).reduce((sum, item) => sum + item[metric], 0) / 5;
    const previous = data.slice(-10, -5).reduce((sum, item) => sum + item[metric], 0) / 5;

    return ((recent - previous) / previous) * 100;
  };

  // Metric card component
  const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
    const trendUp = trend > 0;
    const colorClasses = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      purple: 'text-purple-500',
      orange: 'text-orange-500'
    };

    return (
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${colorClasses[color]}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend !== undefined && (
              <div className="flex items-center mt-2">
                {trendUp ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-current bg-opacity-10 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </GlassCard>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <ChartBarIcon className="h-8 w-8" />
          <span>Stream Analytics</span>
        </h2>

        <div className="flex items-center space-x-2">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Live Viewers"
          value={streamMetrics.viewerCount}
          icon={EyeIcon}
          trend={calculateTrend(realTimeData, 'viewers')}
          color="blue"
        />

        <MetricCard
          title="Total Views"
          value={streamMetrics.totalViews}
          icon={ArrowTrendingUpIcon}
          trend={15.3}
          color="green"
        />

        <MetricCard
          title="Avg. Watch Time"
          value={`${Math.round(streamMetrics.averageWatchTime)}m`}
          icon={ClockIcon}
          trend={8.7}
          color="purple"
        />

        <MetricCard
          title="Engagement Rate"
          value={`${Math.round(streamMetrics.engagement)}%`}
          icon={HeartIcon}
          trend={-2.1}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Viewer Trend Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Viewer Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.3)" />
              <XAxis
                dataKey="time"
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line
                type="monotone"
                dataKey="viewers"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Engagement Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.3)" />
              <XAxis
                dataKey="time"
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Bar dataKey="chatMessages" fill="#8B5CF6" name="Chat Messages" />
              <Bar dataKey="likes" fill="#F59E0B" name="Likes" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Detailed Statistics */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-600 dark:text-gray-300">Audience</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Peak Concurrent Viewers</span>
                <span className="font-semibold">127</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Unique Viewers</span>
                <span className="font-semibold">342</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Return Viewers</span>
                <span className="font-semibold">68%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-600 dark:text-gray-300">Engagement</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Chat Messages</span>
                <span className="font-semibold">1,284</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Likes/Reactions</span>
                <span className="font-semibold">456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Shares</span>
                <span className="font-semibold">23</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-600 dark:text-gray-300">Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Stream Duration</span>
                <span className="font-semibold">2h 15m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Quality Score</span>
                <span className="font-semibold">98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Buffering Events</span>
                <span className="font-semibold">3</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Top Moments */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Moments</h3>
        <div className="space-y-4">
          {[
            { time: '0:45:23', event: 'Peak viewers reached (127)', engagement: 89 },
            { time: '1:12:15', event: 'High chat activity spike', engagement: 76 },
            { time: '1:58:30', event: 'Most likes received', engagement: 82 },
            { time: '2:05:45', event: 'Highest engagement moment', engagement: 91 }
          ].map((moment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
            >
              <div>
                <div className="font-medium">{moment.event}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">at {moment.time}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-blue-500">{moment.engagement}%</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">engagement</div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default StreamMetrics;