import { supabase } from '../lib/supabase';
/**
 * Vendor Performance Service - Comprehensive tracking and management system
 * Handles KPIs, ratings, benchmarking, and performance reporting
 */
export const vendorPerformanceService = {
  // CORE PERFORMANCE METRICS CALCULATION
  /**
   * Calculate comprehensive vendor performance metrics
   */
  async calculatePerformanceMetrics(vendorId, timeRange = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRange * 24 * 60 * 60 * 1000);
      // Get all relevant data in parallel
      const [
        bookingsResult,
        reviewsResult,
        responseTimeResult,
        cancellationResult,
        revenueResult
      ] = await Promise.all([
        this.getBookingMetrics(vendorId, startDate, endDate),
        this.getReviewMetrics(vendorId, startDate, endDate),
        this.getResponseTimeMetrics(vendorId, startDate, endDate),
        this.getCancellationMetrics(vendorId, startDate, endDate),
        this.getRevenueMetrics(vendorId, startDate, endDate)
      ]);
      // Calculate composite performance score
      const performanceScore = this.calculateCompositeScore({
        bookingCompletion: bookingsResult.data?.completionRate || 0,
        customerSatisfaction: reviewsResult.data?.averageRating || 0,
        responseTime: responseTimeResult.data?.averageResponseTime || 0,
        cancellationRate: cancellationResult.data?.cancellationRate || 0,
        revenueGrowth: revenueResult.data?.growthRate || 0
      });
      return {
        data: {
          performanceScore,
          period: { startDate, endDate, days: timeRange },
          metrics: {
            bookings: bookingsResult.data,
            reviews: reviewsResult.data,
            responseTime: responseTimeResult.data,
            cancellations: cancellationResult.data,
            revenue: revenueResult.data
          },
          timestamp: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get booking completion and fulfillment metrics
   */
  async getBookingMetrics(vendorId, startDate, endDate) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          booking_date,
          total_amount,
          created_at,
          adventures!inner(vendor_id)
        `)
        .eq('adventures.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (error) throw error;
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      const confirmationRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
      // Calculate booking velocity (bookings per day)
      const daysDiff = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
      const bookingVelocity = totalBookings / daysDiff;
      return {
        data: {
          totalBookings,
          completedBookings,
          confirmedBookings,
          cancelledBookings,
          completionRate,
          confirmationRate,
          bookingVelocity,
          averageBookingValue: totalBookings > 0 ?
            bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / totalBookings : 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get customer review and satisfaction metrics
   */
  async getReviewMetrics(vendorId, startDate, endDate) {
    try {
      const { data: reviews, error } = await supabase
        .from('adventure_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          adventures!inner(vendor_id)
        `)
        .eq('adventures.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (error) throw error;
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 ?
        reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
      // Rating distribution
      const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: reviews.filter(r => r.rating === rating).length,
        percentage: totalReviews > 0 ?
          (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 : 0
      }));
      // Customer satisfaction categories
      const excellentReviews = reviews.filter(r => r.rating >= 4.5).length;
      const goodReviews = reviews.filter(r => r.rating >= 3.5 && r.rating < 4.5).length;
      const poorReviews = reviews.filter(r => r.rating < 3.5).length;
      const satisfactionRate = totalReviews > 0 ?
        ((excellentReviews + goodReviews) / totalReviews) * 100 : 0;
      // Review velocity
      const daysDiff = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
      const reviewVelocity = totalReviews / daysDiff;
      return {
        data: {
          totalReviews,
          averageRating,
          ratingDistribution,
          satisfactionRate,
          excellentReviews,
          goodReviews,
          poorReviews,
          reviewVelocity
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get response time metrics for communications
   */
  async getResponseTimeMetrics(vendorId, startDate, endDate) {
    try {
      // This would typically track message response times
      // For now, we'll simulate with booking confirmation times
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          confirmed_at,
          adventures!inner(vendor_id)
        `)
        .eq('adventures.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('confirmed_at', 'is', null);
      if (error) throw error;
      const responseTimes = bookings.map(booking => {
        const createdTime = new Date(booking.created_at);
        const confirmedTime = new Date(booking.confirmed_at);
        return (confirmedTime - createdTime) / (1000 * 60 * 60); // hours
      });
      const averageResponseTime = responseTimes.length > 0 ?
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
      const medianResponseTime = responseTimes.length > 0 ?
        this.calculateMedian(responseTimes) : 0;
      // Response time categories
      const quickResponses = responseTimes.filter(time => time <= 2).length; // 2 hours
      const moderateResponses = responseTimes.filter(time => time > 2 && time <= 24).length; // 24 hours
      const slowResponses = responseTimes.filter(time => time > 24).length;
      const quickResponseRate = responseTimes.length > 0 ?
        (quickResponses / responseTimes.length) * 100 : 0;
      return {
        data: {
          totalResponses: responseTimes.length,
          averageResponseTime,
          medianResponseTime,
          quickResponses,
          moderateResponses,
          slowResponses,
          quickResponseRate
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get cancellation and reliability metrics
   */
  async getCancellationMetrics(vendorId, startDate, endDate) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          cancelled_at,
          cancellation_reason,
          adventures!inner(vendor_id)
        `)
        .eq('adventures.vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (error) throw error;
      const totalBookings = bookings.length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
      const vendorCancellations = cancelledBookings.filter(b =>
        b.cancellation_reason === 'vendor_initiated' ||
        b.cancellation_reason === 'vendor_unavailable'
      );
      const customerCancellations = cancelledBookings.filter(b =>
        b.cancellation_reason === 'customer_initiated'
      );
      const cancellationRate = totalBookings > 0 ?
        (cancelledBookings.length / totalBookings) * 100 : 0;
      const vendorCancellationRate = totalBookings > 0 ?
        (vendorCancellations.length / totalBookings) * 100 : 0;
      const customerCancellationRate = totalBookings > 0 ?
        (customerCancellations.length / totalBookings) * 100 : 0;
      const reliabilityScore = 100 - vendorCancellationRate;
      return {
        data: {
          totalBookings,
          totalCancellations: cancelledBookings.length,
          vendorCancellations: vendorCancellations.length,
          customerCancellations: customerCancellations.length,
          cancellationRate,
          vendorCancellationRate,
          customerCancellationRate,
          reliabilityScore
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get revenue and financial performance metrics
   */
  async getRevenueMetrics(vendorId, startDate, endDate) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          total_amount,
          created_at,
          booking_date,
          adventures!inner(vendor_id)
        `)
        .eq('adventures.vendor_id', vendorId)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (error) throw error;
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
      // Calculate growth rate (compare with previous period)
      const previousStartDate = new Date(startDate.getTime() - (endDate - startDate));
      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('adventures.vendor_id', vendorId)
        .eq('status', 'completed')
        .gte('created_at', previousStartDate.toISOString())
        .lte('created_at', startDate.toISOString());
      const previousRevenue = previousBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const growthRate = previousRevenue > 0 ?
        ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      // Revenue by day for trending
      const revenueByDay = this.groupRevenueByDay(bookings, startDate, endDate);
      return {
        data: {
          totalRevenue,
          averageBookingValue,
          totalBookings: bookings.length,
          growthRate,
          previousPeriodRevenue: previousRevenue,
          revenueByDay
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // PERFORMANCE SCORING AND BENCHMARKING
  /**
   * Calculate composite performance score (0-100)
   */
  calculateCompositeScore(metrics) {
    const weights = {
      bookingCompletion: 0.25,
      customerSatisfaction: 0.30,
      responseTime: 0.20,
      cancellationRate: 0.15,
      revenueGrowth: 0.10
    };
    // Normalize metrics to 0-100 scale
    const normalizedMetrics = {
      bookingCompletion: Math.min(100, metrics.bookingCompletion),
      customerSatisfaction: (metrics.customerSatisfaction / 5) * 100,
      responseTime: Math.max(0, 100 - (metrics.responseTime * 2)), // Lower is better
      cancellationRate: Math.max(0, 100 - metrics.cancellationRate), // Lower is better
      revenueGrowth: Math.min(100, Math.max(0, metrics.revenueGrowth + 50)) // -50 to +50 becomes 0-100
    };
    const score = Object.entries(weights).reduce((total, [metric, weight]) => {
      return total + (normalizedMetrics[metric] * weight);
    }, 0);
    return Math.round(score);
  },
  /**
   * Get industry benchmarks for comparison
   */
  async getIndustryBenchmarks() {
    try {
      // In a real implementation, these would be calculated from all vendors
      // For now, we'll use industry standard benchmarks
      return {
        data: {
          averageRating: 4.2,
          completionRate: 85,
          responseTime: 6, // hours
          cancellationRate: 8,
          satisfactionRate: 78,
          bookingVelocity: 2.5, // per day
          averageBookingValue: 150
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Compare vendor performance against benchmarks
   */
  async getBenchmarkComparison(vendorId, timeRange = 30) {
    try {
      const [performanceResult, benchmarkResult] = await Promise.all([
        this.calculatePerformanceMetrics(vendorId, timeRange),
        this.getIndustryBenchmarks()
      ]);
      if (performanceResult.error || benchmarkResult.error) {
        throw new Error('Failed to get performance or benchmark data');
      }
      const performance = performanceResult.data.metrics;
      const benchmarks = benchmarkResult.data;
      const comparison = {
        overallScore: performanceResult.data.performanceScore,
        comparisons: {
          averageRating: {
            vendor: performance.reviews.averageRating,
            benchmark: benchmarks.averageRating,
            percentile: this.calculatePercentile(performance.reviews.averageRating, benchmarks.averageRating),
            status: this.getPerformanceStatus(performance.reviews.averageRating, benchmarks.averageRating)
          },
          completionRate: {
            vendor: performance.bookings.completionRate,
            benchmark: benchmarks.completionRate,
            percentile: this.calculatePercentile(performance.bookings.completionRate, benchmarks.completionRate),
            status: this.getPerformanceStatus(performance.bookings.completionRate, benchmarks.completionRate)
          },
          responseTime: {
            vendor: performance.responseTime.averageResponseTime,
            benchmark: benchmarks.responseTime,
            percentile: this.calculatePercentile(benchmarks.responseTime, performance.responseTime.averageResponseTime, true), // Reverse for lower is better
            status: this.getPerformanceStatus(benchmarks.responseTime, performance.responseTime.averageResponseTime, true)
          },
          cancellationRate: {
            vendor: performance.cancellations.cancellationRate,
            benchmark: benchmarks.cancellationRate,
            percentile: this.calculatePercentile(benchmarks.cancellationRate, performance.cancellations.cancellationRate, true),
            status: this.getPerformanceStatus(benchmarks.cancellationRate, performance.cancellations.cancellationRate, true)
          }
        }
      };
      return { data: comparison, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // PERFORMANCE TRACKING AND HISTORY
  /**
   * Save performance snapshot for historical tracking
   */
  async savePerformanceSnapshot(vendorId, performanceData) {
    try {
      const { data, error } = await supabase
        .from('vendor_performance_snapshots')
        .insert([{
          vendor_id: vendorId,
          performance_score: performanceData.performanceScore,
          metrics: performanceData.metrics,
          period_start: performanceData.period.startDate,
          period_end: performanceData.period.endDate,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  /**
   * Get performance history and trends
   */
  async getPerformanceHistory(vendorId, months = 12) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      const { data: snapshots, error } = await supabase
        .from('vendor_performance_snapshots')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Calculate trends
      const trends = this.calculateTrends(snapshots);
      return {
        data: {
          snapshots,
          trends,
          summary: {
            totalSnapshots: snapshots.length,
            dateRange: {
              start: snapshots[0]?.created_at,
              end: snapshots[snapshots.length - 1]?.created_at
            }
          }
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },
  // ALERTS AND NOTIFICATIONS
  /**
   * Check for performance alerts and thresholds
   */
  async checkPerformanceAlerts(vendorId, performanceData) {
    const alerts = [];
    // Define alert thresholds
    const thresholds = {
      lowRating: 3.5,
      lowCompletionRate: 70,
      highResponseTime: 24, // hours
      highCancellationRate: 15,
      lowPerformanceScore: 60
    };
    const metrics = performanceData.metrics;
    // Check various alert conditions
    if (metrics.reviews.averageRating < thresholds.lowRating) {
      alerts.push({
        type: 'low_rating',
        severity: 'high',
        message: `Average rating (${metrics.reviews.averageRating.toFixed(1)}) is below ${thresholds.lowRating}`,
        recommendation: 'Focus on improving customer experience and addressing negative feedback'
      });
    }
    if (metrics.bookings.completionRate < thresholds.lowCompletionRate) {
      alerts.push({
        type: 'low_completion',
        severity: 'medium',
        message: `Booking completion rate (${metrics.bookings.completionRate.toFixed(1)}%) is below ${thresholds.lowCompletionRate}%`,
        recommendation: 'Review booking processes and reduce cancellation factors'
      });
    }
    if (metrics.responseTime.averageResponseTime > thresholds.highResponseTime) {
      alerts.push({
        type: 'slow_response',
        severity: 'medium',
        message: `Average response time (${metrics.responseTime.averageResponseTime.toFixed(1)} hours) exceeds ${thresholds.highResponseTime} hours`,
        recommendation: 'Implement faster communication processes and set up automated responses'
      });
    }
    if (metrics.cancellations.cancellationRate > thresholds.highCancellationRate) {
      alerts.push({
        type: 'high_cancellation',
        severity: 'high',
        message: `Cancellation rate (${metrics.cancellations.cancellationRate.toFixed(1)}%) exceeds ${thresholds.highCancellationRate}%`,
        recommendation: 'Analyze cancellation reasons and improve booking reliability'
      });
    }
    if (performanceData.performanceScore < thresholds.lowPerformanceScore) {
      alerts.push({
        type: 'low_performance',
        severity: 'high',
        message: `Overall performance score (${performanceData.performanceScore}) is below ${thresholds.lowPerformanceScore}`,
        recommendation: 'Review all performance metrics and create improvement plan'
      });
    }
    return alerts;
  },
  // IMPROVEMENT RECOMMENDATIONS
  /**
   * Generate personalized improvement recommendations
   */
  async generateImprovementRecommendations(vendorId, performanceData, benchmarkData) {
    const recommendations = [];
    const metrics = performanceData.metrics;
    const benchmarks = benchmarkData.comparisons;
    // Rating improvement recommendations
    if (benchmarks.averageRating.status === 'below') {
      recommendations.push({
        category: 'customer_satisfaction',
        priority: 'high',
        title: 'Improve Customer Satisfaction',
        description: 'Your average rating is below industry benchmark',
        actions: [
          'Respond to all customer reviews, especially negative ones',
          'Implement post-booking follow-up surveys',
          'Train guides on customer service best practices',
          'Review and improve adventure quality standards'
        ],
        impact: 'High',
        effort: 'Medium',
        timeline: '2-3 months'
      });
    }
    // Response time recommendations
    if (benchmarks.responseTime.status === 'below') {
      recommendations.push({
        category: 'communication',
        priority: 'medium',
        title: 'Faster Response Times',
        description: 'Your response time is slower than industry average',
        actions: [
          'Set up automated acknowledgment messages',
          'Implement mobile notifications for new inquiries',
          'Create response time targets for your team',
          'Use templates for common questions'
        ],
        impact: 'Medium',
        effort: 'Low',
        timeline: '1 month'
      });
    }
    // Completion rate recommendations
    if (benchmarks.completionRate.status === 'below') {
      recommendations.push({
        category: 'operations',
        priority: 'high',
        title: 'Reduce Cancellations',
        description: 'Your booking completion rate needs improvement',
        actions: [
          'Implement better weather contingency plans',
          'Improve equipment maintenance and backup systems',
          'Create clear booking terms and expectations',
          'Offer alternative dates for weather cancellations'
        ],
        impact: 'High',
        effort: 'Medium',
        timeline: '1-2 months'
      });
    }
    // Growth recommendations
    if (metrics.revenue.growthRate < 0) {
      recommendations.push({
        category: 'business_growth',
        priority: 'medium',
        title: 'Revenue Growth Strategies',
        description: 'Focus on growing your business revenue',
        actions: [
          'Analyze popular adventure types and expand offerings',
          'Optimize pricing based on demand patterns',
          'Implement seasonal promotions and packages',
          'Improve adventure descriptions and photos'
        ],
        impact: 'High',
        effort: 'High',
        timeline: '3-6 months'
      });
    }
    return recommendations;
  },
  // HELPER METHODS
  calculateMedian(array) {
    const sorted = array.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  },
  calculatePercentile(value, benchmark, reverse = false) {
    if (reverse) {
      return value <= benchmark ? 75 : value <= benchmark * 1.5 ? 50 : 25;
    }
    return value >= benchmark ? 75 : value >= benchmark * 0.8 ? 50 : 25;
  },
  getPerformanceStatus(value, benchmark, reverse = false) {
    if (reverse) {
      if (value <= benchmark * 0.8) return 'excellent';
      if (value <= benchmark) return 'above';
      if (value <= benchmark * 1.2) return 'average';
      return 'below';
    }
    if (value >= benchmark * 1.2) return 'excellent';
    if (value >= benchmark) return 'above';
    if (value >= benchmark * 0.8) return 'average';
    return 'below';
  },
  groupRevenueByDay(bookings, startDate, endDate) {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const revenueByDay = Array(days).fill(0);
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.created_at);
      const dayIndex = Math.floor((bookingDate - startDate) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < days) {
        revenueByDay[dayIndex] += booking.total_amount || 0;
      }
    });
    return revenueByDay.map((revenue, index) => ({
      date: new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue
    }));
  },
  calculateTrends(snapshots) {
    if (snapshots.length < 2) return null;
    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    return {
      performanceScore: {
        current: latest.performance_score,
        previous: previous.performance_score,
        change: latest.performance_score - previous.performance_score,
        trend: latest.performance_score > previous.performance_score ? 'up' :
               latest.performance_score < previous.performance_score ? 'down' : 'stable'
      }
    };
  }
};
export default vendorPerformanceService;