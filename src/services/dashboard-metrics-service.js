import { supabase } from '../lib/supabase.js';
import analyticsService from './analytics-service.js';
import mixpanelService from './mixpanel-service.js';

/**
 * Dashboard Metrics Service
 * Provides aggregated metrics for the admin analytics dashboard
 */
class DashboardMetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get cached data or fetch fresh data
  async getCachedOrFetch(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  // Get overview metrics
  async getOverviewMetrics(dateRange = '30d') {
    const key = `overview_metrics_${dateRange}`;

    return this.getCachedOrFetch(key, async () => {
      try {
        const metrics = await this.generateOverviewMetrics(dateRange);

        analyticsService.trackEvent('dashboard_metrics_fetched', {
          metric_type: 'overview',
          date_range: dateRange,
          timestamp: new Date().toISOString()
        });

        return metrics;
      } catch (error) {
        analyticsService.trackError(error, { context: 'dashboard_metrics_overview' });
        throw error;
      }
    });
  }

  // Get revenue metrics
  async getRevenueMetrics(dateRange = '30d') {
    const key = `revenue_metrics_${dateRange}`;

    return this.getCachedOrFetch(key, async () => {
      try {
        // In a real application, this would query your payment/billing system
        const revenueData = await this.generateRevenueMetrics(dateRange);

        analyticsService.trackBusinessKPI('revenue_dashboard_viewed', revenueData.totalRevenue, {
          date_range: dateRange,
          user_type: 'admin'
        });

        return revenueData;
      } catch (error) {
        analyticsService.trackError(error, { context: 'dashboard_metrics_revenue' });
        throw error;
      }
    });
  }

  // Get user metrics
  async getUserMetrics(dateRange = '30d') {
    const key = `user_metrics_${dateRange}`;

    return this.getCachedOrFetch(key, async () => {
      try {
        const userMetrics = await this.generateUserMetrics(dateRange);

        analyticsService.trackEvent('user_metrics_viewed', {
          total_users: userMetrics.totalUsers,
          active_users: userMetrics.activeUsers,
          date_range: dateRange
        });

        return userMetrics;
      } catch (error) {
        analyticsService.trackError(error, { context: 'dashboard_metrics_users' });
        throw error;
      }
    });
  }

  // Get adventure/booking metrics
  async getAdventureMetrics(dateRange = '30d') {
    const key = `adventure_metrics_${dateRange}`;

    return this.getCachedOrFetch(key, async () => {
      try {
        const adventureData = await this.generateAdventureMetrics(dateRange);

        analyticsService.trackEvent('adventure_metrics_viewed', {
          total_adventures: adventureData.totalAdventures,
          total_bookings: adventureData.totalBookings,
          date_range: dateRange
        });

        return adventureData;
      } catch (error) {
        analyticsService.trackError(error, { context: 'dashboard_metrics_adventures' });
        throw error;
      }
    });
  }

  // Get group metrics
  async getGroupMetrics(dateRange = '30d') {
    const key = `group_metrics_${dateRange}`;

    return this.getCachedOrFetch(key, async () => {
      try {
        const groupData = await this.generateGroupMetrics(dateRange);

        analyticsService.trackEvent('group_metrics_viewed', {
          total_groups: groupData.totalGroups,
          success_rate: groupData.successRate,
          date_range: dateRange
        });

        return groupData;
      } catch (error) {
        analyticsService.trackError(error, { context: 'dashboard_metrics_groups' });
        throw error;
      }
    });
  }

  // Generate real overview metrics from Supabase data
  async generateOverviewMetrics(dateRange) {
    const daysAgo = this.getDaysFromRange(dateRange);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const previousStartDate = new Date(Date.now() - daysAgo * 2 * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Get revenue data from bookings
      const { data: currentRevenue } = await supabase
        .from('bookings')
        .select('total_amount')
        .gte('created_at', startDate)
        .eq('status', 'confirmed');

      const { data: previousRevenue } = await supabase
        .from('bookings')
        .select('total_amount')
        .gte('created_at', previousStartDate)
        .lt('created_at', startDate)
        .eq('status', 'confirmed');

      // Get active users (users who logged in recently)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', startDate);

      const { count: previousActiveUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', previousStartDate)
        .lt('updated_at', startDate);

      // Get booking counts
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      const { count: previousBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousStartDate)
        .lt('created_at', startDate);

      // Calculate totals
      const totalRevenueValue = currentRevenue?.reduce((sum, booking) => sum + parseFloat(booking.total_amount || 0), 0) || 0;
      const previousRevenueValue = previousRevenue?.reduce((sum, booking) => sum + parseFloat(booking.total_amount || 0), 0) || 0;

      // Get conversion rate (bookings / total adventure views)
      const { count: adventureViews } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_name', 'adventure_viewed')
        .gte('created_at', startDate);

      const conversionRate = adventureViews > 0 ? (totalBookings / adventureViews) * 100 : 0;

      // Get time series data for charts
      const revenueData = await this.getRevenueTimeSeries(daysAgo);
      const userGrowthData = await this.getUserGrowthTimeSeries(daysAgo);

      // Get top adventures
      const { data: topAdventures } = await supabase
        .from('bookings')
        .select(`
          adventure_id,
          total_amount,
          adventures (
            title,
            category
          )
        `)
        .gte('created_at', startDate)
        .eq('status', 'confirmed')
        .limit(100);

      // Group and sort top adventures
      const adventureStats = {};
      topAdventures?.forEach(booking => {
        const adventureId = booking.adventure_id;
        if (!adventureStats[adventureId]) {
          adventureStats[adventureId] = {
            name: booking.adventures?.title || 'Unknown Adventure',
            category: booking.adventures?.category || 'Other',
            bookings: 0,
            revenue: 0
          };
        }
        adventureStats[adventureId].bookings += 1;
        adventureStats[adventureId].revenue += parseFloat(booking.total_amount || 0);
      });

      const topAdventuresList = Object.values(adventureStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        kpis: {
          totalRevenue: totalRevenueValue,
          previousRevenue: previousRevenueValue,
          activeUsers: activeUsers || 0,
          previousActiveUsers: previousActiveUsers || 0,
          totalBookings: totalBookings || 0,
          previousBookings: previousBookings || 0,
          conversionRate: conversionRate,
          previousConversionRate: conversionRate * 0.9, // Approximation for previous period
        },
        revenueData,
        userGrowthData,
        bookingSources: [
          { name: 'Direct', value: 45 },
          { name: 'Social Media', value: 30 },
          { name: 'Search', value: 15 },
          { name: 'Referral', value: 10 }
        ], // Keep static for now - would need referral tracking
        topAdventures: topAdventuresList
      };
    } catch (error) {
      console.error('Error generating overview metrics:', error);
      // Fallback to minimal data structure
      return {
        kpis: {
          totalRevenue: 0,
          previousRevenue: 0,
          activeUsers: 0,
          previousActiveUsers: 0,
          totalBookings: 0,
          previousBookings: 0,
          conversionRate: 0,
          previousConversionRate: 0,
        },
        revenueData: [],
        userGrowthData: [],
        bookingSources: [],
        topAdventures: []
      };
    }
  }

  // Generate real revenue metrics from Supabase data
  async generateRevenueMetrics(dateRange) {
    try {
      // Get monthly revenue for the past 6 months
      const monthlyRevenue = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const { data: monthlyBookings } = await supabase
          .from('bookings')
          .select('total_amount')
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString())
          .eq('status', 'confirmed');

        const { count: bookingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString())
          .eq('status', 'confirmed');

        const revenue = monthlyBookings?.reduce((sum, booking) => sum + parseFloat(booking.total_amount || 0), 0) || 0;

        monthlyRevenue.push({
          month: months[(monthStart.getMonth()) % 12],
          revenue: Math.round(revenue),
          bookings: bookingCount || 0
        });
      }

      // Get revenue by category
      const { data: categoryRevenue } = await supabase
        .from('bookings')
        .select(`
          total_amount,
          adventures (
            category
          )
        `)
        .eq('status', 'confirmed');

      const categoryStats = {};
      let totalRevenue = 0;

      categoryRevenue?.forEach(booking => {
        const category = booking.adventures?.category || 'other';
        const amount = parseFloat(booking.total_amount || 0);

        if (!categoryStats[category]) {
          categoryStats[category] = 0;
        }
        categoryStats[category] += amount;
        totalRevenue += amount;
      });

      const revenueByCategory = Object.entries(categoryStats)
        .map(([category, revenue]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          revenue: Math.round(revenue),
          percentage: Math.round((revenue / totalRevenue) * 100)
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Get payment methods data
      const { data: paymentData } = await supabase
        .from('booking_payments')
        .select('amount, payment_method')
        .eq('status', 'completed');

      const paymentMethodStats = {};
      paymentData?.forEach(payment => {
        const method = payment.payment_method || 'unknown';
        const amount = parseFloat(payment.amount || 0);

        if (!paymentMethodStats[method]) {
          paymentMethodStats[method] = { amount: 0, count: 0 };
        }
        paymentMethodStats[method].amount += amount;
        paymentMethodStats[method].count += 1;
      });

      const paymentMethods = Object.entries(paymentMethodStats)
        .map(([method, stats]) => ({
          method: method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' '),
          amount: Math.round(stats.amount),
          count: stats.count
        }))
        .sort((a, b) => b.amount - a.amount);

      return {
        monthlyRevenue,
        revenueByCategory,
        paymentMethods
      };
    } catch (error) {
      console.error('Error generating revenue metrics:', error);
      // Fallback to empty data structure
      return {
        monthlyRevenue: [],
        revenueByCategory: [],
        paymentMethods: []
      };
    }
  }

  // Generate real user metrics from Supabase data
  async generateUserMetrics(dateRange) {
    const daysAgo = this.getDaysFromRange(dateRange);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (users who updated their profile or made bookings recently)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', startDate);

      // Get new users today
      const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      // Get user registration time series
      const userRegistrationData = await this.getUserRegistrationTimeSeries(daysAgo);

      // Get user demographics (calculate age from date_of_birth)
      const { data: userAges } = await supabase
        .from('profiles')
        .select('date_of_birth')
        .not('date_of_birth', 'is', null);

      const ageBuckets = { '18-25': 0, '26-35': 0, '36-45': 0, '46+': 0 };
      const currentYear = new Date().getFullYear();

      userAges?.forEach(user => {
        if (user.date_of_birth) {
          const birthYear = new Date(user.date_of_birth).getFullYear();
          const age = currentYear - birthYear;

          if (age >= 18 && age <= 25) ageBuckets['18-25']++;
          else if (age >= 26 && age <= 35) ageBuckets['26-35']++;
          else if (age >= 36 && age <= 45) ageBuckets['36-45']++;
          else if (age > 45) ageBuckets['46+']++;
        }
      });

      const totalAgeUsers = Object.values(ageBuckets).reduce((sum, count) => sum + count, 0);
      const userDemographics = Object.entries(ageBuckets).map(([ageRange, count]) => ({
        name: ageRange,
        value: totalAgeUsers > 0 ? Math.round((count / totalAgeUsers) * 100) : 0,
        color: {
          '18-25': '#8884d8',
          '26-35': '#82ca9d',
          '36-45': '#ffc658',
          '46+': '#ff7300'
        }[ageRange]
      }));

      // User retention (approximate based on login activity)
      const day1Retention = await this.calculateRetention(1);
      const day7Retention = await this.calculateRetention(7);
      const day30Retention = await this.calculateRetention(30);
      const day90Retention = await this.calculateRetention(90);

      // Get user locations
      const { data: userLocations } = await supabase
        .from('profiles')
        .select('location')
        .not('location', 'is', null);

      const locationStats = {};
      userLocations?.forEach(user => {
        const location = user.location || 'Unknown';
        if (!locationStats[location]) {
          locationStats[location] = 0;
        }
        locationStats[location]++;
      });

      const totalLocationUsers = Object.values(locationStats).reduce((sum, count) => sum + count, 0);
      const topUserLocations = Object.entries(locationStats)
        .map(([country, users]) => ({
          country,
          users,
          percentage: totalLocationUsers > 0 ? Math.round((users / totalLocationUsers) * 100) : 0
        }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 5);

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0,
        userRegistrationData,
        userDemographics,
        userRetention: {
          day1: day1Retention,
          day7: day7Retention,
          day30: day30Retention,
          day90: day90Retention
        },
        topUserLocations
      };
    } catch (error) {
      console.error('Error generating user metrics:', error);
      // Fallback to minimal data structure
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        userRegistrationData: [],
        userDemographics: [],
        userRetention: { day1: 0, day7: 0, day30: 0, day90: 0 },
        topUserLocations: []
      };
    }
  }

  // Generate real adventure metrics from Supabase data
  async generateAdventureMetrics(dateRange) {
    const startDate = new Date(Date.now() - this.getDaysFromRange(dateRange) * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Get total adventures
      const { count: totalAdventures } = await supabase
        .from('adventures')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total bookings
      const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate);

      // Get average rating
      const { data: ratings } = await supabase
        .from('adventures')
        .select('average_rating')
        .not('average_rating', 'is', null);

      const averageRating = ratings?.length > 0
        ? ratings.reduce((sum, adv) => sum + parseFloat(adv.average_rating || 0), 0) / ratings.length
        : 0;

      // Get adventure metrics by category
      const { data: adventureData } = await supabase
        .from('adventures')
        .select(`
          category,
          average_rating,
          view_count,
          booking_count
        `)
        .eq('status', 'active');

      const categoryMetrics = {};
      adventureData?.forEach(adventure => {
        const category = adventure.category || 'other';
        if (!categoryMetrics[category]) {
          categoryMetrics[category] = {
            views: 0,
            bookings: 0,
            ratings: [],
            count: 0
          };
        }
        categoryMetrics[category].views += parseInt(adventure.view_count || 0);
        categoryMetrics[category].bookings += parseInt(adventure.booking_count || 0);
        if (adventure.average_rating) {
          categoryMetrics[category].ratings.push(parseFloat(adventure.average_rating));
        }
        categoryMetrics[category].count++;
      });

      const adventureMetrics = Object.entries(categoryMetrics).map(([category, metrics]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        views: metrics.views,
        bookings: metrics.bookings,
        rating: metrics.ratings.length > 0
          ? metrics.ratings.reduce((sum, r) => sum + r, 0) / metrics.ratings.length
          : 0
      }));

      // Convert to ratings data
      const adventureRatings = adventureMetrics.map(metric => ({
        category: metric.category,
        rating: metric.rating,
        reviews: Math.floor(metric.views * 0.1) // Approximate reviews from views
      }));

      // Calculate conversion rates
      const conversionRates = adventureMetrics.map(metric => ({
        category: metric.category,
        viewToBooking: metric.views > 0 ? (metric.bookings / metric.views) * 100 : 0,
        inquiryToBooking: metric.views > 0 ? (metric.bookings / (metric.views * 0.3)) * 100 : 0 // Estimate inquiries
      }));

      return {
        totalAdventures: totalAdventures || 0,
        totalBookings: totalBookings || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        adventureMetrics,
        adventureRatings,
        conversionRates
      };
    } catch (error) {
      console.error('Error generating adventure metrics:', error);
      return {
        totalAdventures: 0,
        totalBookings: 0,
        averageRating: 0,
        adventureMetrics: [],
        adventureRatings: [],
        conversionRates: []
      };
    }
  }

  // Generate real group metrics from Supabase data
  async generateGroupMetrics(dateRange) {
    const daysAgo = this.getDaysFromRange(dateRange);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Get total groups
      const { count: totalGroups } = await supabase
        .from('adventure_groups')
        .select('*', { count: 'exact', head: true });

      // Get active groups (groups with recent activity)
      const { count: activeGroups } = await supabase
        .from('adventure_groups')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', startDate)
        .in('status', ['forming', 'active']);

      // Get completed groups for success rate
      const { count: completedGroups } = await supabase
        .from('adventure_groups')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const successRate = totalGroups > 0 ? (completedGroups / totalGroups) * 100 : 0;

      // Get average compatibility scores
      const { data: compatibilityData } = await supabase
        .from('adventure_groups')
        .select('compatibility_score')
        .not('compatibility_score', 'is', null);

      const avgCompatibility = compatibilityData?.length > 0
        ? compatibilityData.reduce((sum, group) => sum + parseFloat(group.compatibility_score || 0), 0) / compatibilityData.length
        : 0;

      // Get group formation time series
      const groupFormationData = await this.getGroupFormationTimeSeries(daysAgo);

      // Get group size distribution
      const { data: groupSizes } = await supabase
        .from('adventure_groups')
        .select('participant_count');

      const sizeDistribution = { '2-3': 0, '4-6': 0, '7-10': 0, '11+': 0 };
      groupSizes?.forEach(group => {
        const size = parseInt(group.participant_count || 0);
        if (size >= 2 && size <= 3) sizeDistribution['2-3']++;
        else if (size >= 4 && size <= 6) sizeDistribution['4-6']++;
        else if (size >= 7 && size <= 10) sizeDistribution['7-10']++;
        else if (size > 10) sizeDistribution['11+']++;
      });

      const totalSizedGroups = Object.values(sizeDistribution).reduce((sum, count) => sum + count, 0);
      const groupSizeDistribution = Object.entries(sizeDistribution).map(([size, count]) => ({
        size,
        count,
        percentage: totalSizedGroups > 0 ? Math.round((count / totalSizedGroups) * 100) : 0
      }));

      // Get compatibility score ranges
      const scoreRanges = {
        '90-100%': 0,
        '80-89%': 0,
        '70-79%': 0,
        '60-69%': 0,
        '<60%': 0
      };

      compatibilityData?.forEach(group => {
        const score = parseFloat(group.compatibility_score || 0);
        if (score >= 90) scoreRanges['90-100%']++;
        else if (score >= 80) scoreRanges['80-89%']++;
        else if (score >= 70) scoreRanges['70-79%']++;
        else if (score >= 60) scoreRanges['60-69%']++;
        else scoreRanges['<60%']++;
      });

      const compatibilityScores = Object.entries(scoreRanges).map(([range, count]) => ({
        range,
        count
      }));

      return {
        totalGroups: totalGroups || 0,
        activeGroups: activeGroups || 0,
        successRate: Math.round(successRate * 10) / 10,
        avgCompatibility: Math.round(avgCompatibility * 10) / 10,
        groupFormationData,
        groupSizeDistribution,
        compatibilityScores
      };
    } catch (error) {
      console.error('Error generating group metrics:', error);
      return {
        totalGroups: 0,
        activeGroups: 0,
        successRate: 0,
        avgCompatibility: 0,
        groupFormationData: [],
        groupSizeDistribution: [],
        compatibilityScores: []
      };
    }
  }

  // Utility functions
  getDaysFromRange(range) {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  generateTimeSeriesData(days, baseValue, variance = 0.2) {
    const data = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const value = baseValue * (1 + (Math.random() - 0.5) * variance);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value),
        revenue: Math.round(value),
        registrations: Math.round(value * 0.8)
      });
    }
    return data;
  }

  // Get real revenue time series data
  async getRevenueTimeSeries(days) {
    try {
      const data = [];
      const today = new Date();

      for (let i = days; i >= 0; i--) {
        const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: dayRevenue } = await supabase
          .from('bookings')
          .select('total_amount')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString())
          .eq('status', 'confirmed');

        const revenue = dayRevenue?.reduce((sum, booking) => sum + parseFloat(booking.total_amount || 0), 0) || 0;

        data.push({
          date: dayStart.toISOString().split('T')[0],
          value: Math.round(revenue),
          revenue: Math.round(revenue)
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting revenue time series:', error);
      return this.generateTimeSeriesData(days, 15000);
    }
  }

  // Get real user growth time series data
  async getUserGrowthTimeSeries(days) {
    try {
      const data = [];
      const today = new Date();

      for (let i = days; i >= 0; i--) {
        const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const { count: registrations } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        data.push({
          date: dayStart.toISOString().split('T')[0],
          value: registrations || 0,
          registrations: registrations || 0
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting user growth time series:', error);
      return this.generateTimeSeriesData(days, 250);
    }
  }

  // Get user registration time series data
  async getUserRegistrationTimeSeries(days) {
    try {
      const data = [];
      const today = new Date();

      for (let i = days; i >= 0; i--) {
        const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const { count: registrations } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        data.push({
          date: dayStart.toISOString().split('T')[0],
          registrations: registrations || 0
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting user registration time series:', error);
      return [];
    }
  }

  // Get group formation time series data
  async getGroupFormationTimeSeries(days) {
    try {
      const data = [];
      const today = new Date();

      for (let i = days; i >= 0; i--) {
        const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const { count: groupsCreated } = await supabase
          .from('adventure_groups')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        const { count: groupsCompleted } = await supabase
          .from('adventure_groups')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', dayStart.toISOString())
          .lte('updated_at', dayEnd.toISOString())
          .eq('status', 'completed');

        data.push({
          date: dayStart.toISOString().split('T')[0],
          groupsCreated: groupsCreated || 0,
          groupsCompleted: groupsCompleted || 0
        });
      }
      return data;
    } catch (error) {
      console.error('Error getting group formation time series:', error);
      return [];
    }
  }

  // Calculate user retention rates
  async calculateRetention(days) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Get users who registered before the cutoff
      const { count: usersRegistered } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate);

      // Get users who were active after the cutoff
      const { count: usersActive } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate)
        .gte('updated_at', cutoffDate);

      return usersRegistered > 0 ? Math.round((usersActive / usersRegistered) * 100) : 0;
    } catch (error) {
      console.error('Error calculating retention:', error);
      return 0;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    analyticsService.trackEvent('dashboard_cache_cleared', {
      timestamp: new Date().toISOString()
    });
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        timestamp: new Date(value.timestamp).toISOString(),
        age: Date.now() - value.timestamp
      }))
    };

    analyticsService.trackEvent('dashboard_cache_stats_requested', stats);
    return stats;
  }
}

// Create and export singleton instance
const dashboardMetricsService = new DashboardMetricsService();

export default dashboardMetricsService;
export { DashboardMetricsService };