/**
 * Content Moderation Service
 * Handles automated content filtering, reporting, and moderation workflows
 */

import { supabase } from '../lib/supabase';

class ContentModerationService {
  constructor() {
    this.profanityFilter = this.initializeProfanityFilter();
    this.spamPatterns = this.initializeSpamPatterns();
    this.toxicityThreshold = 0.7;
    this.automatedActionThreshold = 0.85;
  }

  // Initialize profanity filter with common inappropriate words
  initializeProfanityFilter() {
    return new Set([
      // Add profanity words here - keeping family-friendly for demo
      'spam', 'scam', 'fake', 'bot', 'virus', 'malware'
    ]);
  }

  // Initialize spam detection patterns
  initializeSpamPatterns() {
    return [
      /\b(click here|visit now|buy now|limited time|act fast)\b/gi,
      /\b(free money|make money fast|guaranteed income)\b/gi,
      /\b(viagra|cialis|pharmacy|pills)\b/gi,
      /\b(casino|gambling|poker|slots)\b/gi,
      /(https?:\/\/[^\s]+){3,}/gi, // Multiple URLs
      /(.)\1{10,}/gi, // Repeated characters
      /[A-Z]{20,}/gi, // Excessive caps
      /(\b\w+\b.*?){0,5}\b(bitcoin|crypto|investment|trading)\b/gi
    ];
  }

  /**
   * Analyze content for various types of violations
   */
  async analyzeContent(content, metadata = {}) {
    const analysis = {
      text: content,
      violations: [],
      scores: {
        profanity: 0,
        spam: 0,
        toxicity: 0,
        overall: 0
      },
      recommendations: [],
      autoAction: null
    };

    try {
      // Check for profanity
      analysis.scores.profanity = this.checkProfanity(content);

      // Check for spam patterns
      analysis.scores.spam = this.checkSpamPatterns(content);

      // Simulate toxicity detection (in real app, use ML service)
      analysis.scores.toxicity = await this.detectToxicity(content);

      // Calculate overall risk score
      analysis.scores.overall = Math.max(
        analysis.scores.profanity,
        analysis.scores.spam,
        analysis.scores.toxicity
      );

      // Determine violations and recommendations
      this.evaluateViolations(analysis);

      // Determine automatic actions
      this.determineAutoActions(analysis);

      return analysis;
    } catch (error) {
      console.error('Content analysis failed:', error);
      return {
        ...analysis,
        error: 'Analysis failed',
        recommendations: ['Manual review required']
      };
    }
  }

  /**
   * Check content for profanity
   */
  checkProfanity(content) {
    const words = content.toLowerCase().split(/\s+/);
    const profaneWords = words.filter(word =>
      this.profanityFilter.has(word.replace(/[^a-z]/g, ''))
    );

    return Math.min(profaneWords.length / words.length * 5, 1);
  }

  /**
   * Check content for spam patterns
   */
  checkSpamPatterns(content) {
    let spamScore = 0;
    const patternMatches = this.spamPatterns.reduce((acc, pattern) => {
      const matches = content.match(pattern);
      return acc + (matches ? matches.length : 0);
    }, 0);

    // Calculate spam score based on pattern matches
    spamScore = Math.min(patternMatches / 3, 1);

    // Additional spam indicators
    const urlCount = (content.match(/https?:\/\/[^\s]+/gi) || []).length;
    if (urlCount > 2) spamScore += 0.3;

    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5) spamScore += 0.2;

    return Math.min(spamScore, 1);
  }

  /**
   * Simulate toxicity detection (replace with actual ML service)
   */
  async detectToxicity(content) {
    // Simulate API call to toxicity detection service
    const toxicWords = ['hate', 'kill', 'die', 'stupid', 'idiot', 'moron'];
    const words = content.toLowerCase().split(/\s+/);
    const toxicCount = words.filter(word => toxicWords.includes(word)).length;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return Math.min(toxicCount / words.length * 3, 1);
  }

  /**
   * Evaluate violations based on scores
   */
  evaluateViolations(analysis) {
    if (analysis.scores.profanity > 0.3) {
      analysis.violations.push({
        type: 'profanity',
        severity: analysis.scores.profanity > 0.7 ? 'high' : 'medium',
        description: 'Content contains inappropriate language'
      });
    }

    if (analysis.scores.spam > 0.4) {
      analysis.violations.push({
        type: 'spam',
        severity: analysis.scores.spam > 0.8 ? 'high' : 'medium',
        description: 'Content appears to be spam or promotional'
      });
    }

    if (analysis.scores.toxicity > 0.5) {
      analysis.violations.push({
        type: 'toxicity',
        severity: analysis.scores.toxicity > 0.8 ? 'high' : 'medium',
        description: 'Content contains toxic or harmful language'
      });
    }

    // Generate recommendations
    if (analysis.violations.length === 0) {
      analysis.recommendations.push('Content appears safe for publication');
    } else {
      analysis.recommendations.push('Content requires moderation review');
      if (analysis.scores.overall > this.automatedActionThreshold) {
        analysis.recommendations.push('Recommend automatic action');
      }
    }
  }

  /**
   * Determine automatic actions based on analysis
   */
  determineAutoActions(analysis) {
    if (analysis.scores.overall > this.automatedActionThreshold) {
      analysis.autoAction = 'block';
    } else if (analysis.scores.overall > this.toxicityThreshold) {
      analysis.autoAction = 'flag_for_review';
    } else if (analysis.violations.length > 0) {
      analysis.autoAction = 'warn_user';
    } else {
      analysis.autoAction = 'approve';
    }
  }

  /**
   * Submit content report
   */
  async submitReport(reportData) {
    try {
      const { data, error } = await supabase
        .from('content_reports')
        .insert({
          content_id: reportData.contentId,
          content_type: reportData.contentType,
          reporter_id: reportData.reporterId,
          report_reason: reportData.reason,
          report_category: reportData.category,
          description: reportData.description,
          severity: reportData.severity || 'medium',
          status: 'pending',
          metadata: reportData.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create moderation queue entry
      await this.addToModerationQueue({
        contentId: reportData.contentId,
        contentType: reportData.contentType,
        reportId: data.id,
        priority: this.calculatePriority(reportData),
        reason: 'user_report'
      });

      // Update content status
      await this.updateContentStatus(
        reportData.contentId,
        reportData.contentType,
        'under_review'
      );

      return { success: true, reportId: data.id };
    } catch (error) {
      console.error('Failed to submit report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add content to moderation queue
   */
  async addToModerationQueue(queueData) {
    try {
      const { data, error } = await supabase
        .from('moderation_queue')
        .insert({
          content_id: queueData.contentId,
          content_type: queueData.contentType,
          report_id: queueData.reportId,
          priority: queueData.priority,
          reason: queueData.reason,
          status: 'pending',
          assigned_moderator: null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to add to moderation queue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate priority for moderation queue
   */
  calculatePriority(reportData) {
    let priority = 'medium';

    if (reportData.severity === 'high' ||
        ['harassment', 'threats', 'illegal'].includes(reportData.category)) {
      priority = 'high';
    } else if (reportData.severity === 'low' ||
               ['spam', 'off_topic'].includes(reportData.category)) {
      priority = 'low';
    }

    return priority;
  }

  /**
   * Update content moderation status
   */
  async updateContentStatus(contentId, contentType, status) {
    try {
      const tableName = this.getContentTable(contentType);
      const { error } = await supabase
        .from(tableName)
        .update({
          moderation_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to update content status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get table name for content type
   */
  getContentTable(contentType) {
    const tableMap = {
      'post': 'posts',
      'comment': 'comments',
      'message': 'messages',
      'review': 'reviews',
      'adventure': 'adventures'
    };
    return tableMap[contentType] || 'posts';
  }

  /**
   * Process automated actions
   */
  async processAutomatedAction(contentId, contentType, action, reason) {
    try {
      switch (action) {
        case 'block':
          await this.blockContent(contentId, contentType, reason);
          break;
        case 'flag_for_review':
          await this.flagForReview(contentId, contentType, reason);
          break;
        case 'warn_user':
          await this.warnUser(contentId, contentType, reason);
          break;
        case 'approve':
          await this.approveContent(contentId, contentType);
          break;
      }

      // Log moderation action
      await this.logModerationAction({
        contentId,
        contentType,
        action,
        reason,
        moderatorId: 'system',
        automated: true
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to process automated action:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Block content
   */
  async blockContent(contentId, contentType, reason) {
    await this.updateContentStatus(contentId, contentType, 'blocked');

    // Hide from public view
    const tableName = this.getContentTable(contentType);
    await supabase
      .from(tableName)
      .update({
        visibility: 'hidden',
        blocked_reason: reason,
        blocked_at: new Date().toISOString()
      })
      .eq('id', contentId);
  }

  /**
   * Flag content for manual review
   */
  async flagForReview(contentId, contentType, reason) {
    await this.updateContentStatus(contentId, contentType, 'flagged');
    await this.addToModerationQueue({
      contentId,
      contentType,
      priority: 'medium',
      reason: 'automated_flag'
    });
  }

  /**
   * Warn user about content
   */
  async warnUser(contentId, contentType, reason) {
    // Get content owner
    const tableName = this.getContentTable(contentType);
    const { data: content } = await supabase
      .from(tableName)
      .select('user_id')
      .eq('id', contentId)
      .single();

    if (content) {
      await this.issueUserWarning(content.user_id, {
        contentId,
        contentType,
        reason,
        severity: 'low'
      });
    }
  }

  /**
   * Approve content
   */
  async approveContent(contentId, contentType) {
    await this.updateContentStatus(contentId, contentType, 'approved');
  }

  /**
   * Issue warning to user
   */
  async issueUserWarning(userId, warningData) {
    try {
      const { error } = await supabase
        .from('user_warnings')
        .insert({
          user_id: userId,
          content_id: warningData.contentId,
          content_type: warningData.contentType,
          reason: warningData.reason,
          severity: warningData.severity,
          issued_by: 'system',
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (error) throw error;

      // Check if user should be restricted
      await this.checkUserRestrictions(userId);

      return { success: true };
    } catch (error) {
      console.error('Failed to issue warning:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user should face restrictions
   */
  async checkUserRestrictions(userId) {
    try {
      // Count active warnings
      const { data: warnings } = await supabase
        .from('user_warnings')
        .select('*')
        .eq('user_id', userId)
        .gte('expires_at', new Date().toISOString());

      const warningCount = warnings?.length || 0;

      // Apply restrictions based on warning count
      if (warningCount >= 5) {
        await this.restrictUser(userId, 'suspended', 7); // 7 days
      } else if (warningCount >= 3) {
        await this.restrictUser(userId, 'limited', 3); // 3 days
      }
    } catch (error) {
      console.error('Failed to check user restrictions:', error);
    }
  }

  /**
   * Restrict user account
   */
  async restrictUser(userId, restrictionType, days) {
    try {
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('user_restrictions')
        .insert({
          user_id: userId,
          restriction_type: restrictionType,
          reason: 'Multiple content violations',
          restricted_by: 'system',
          restricted_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          active: true
        });

      if (error) throw error;

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          account_status: restrictionType,
          restriction_expires: expiresAt.toISOString()
        })
        .eq('id', userId);

      return { success: true };
    } catch (error) {
      console.error('Failed to restrict user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log moderation action
   */
  async logModerationAction(actionData) {
    try {
      const { error } = await supabase
        .from('moderation_logs')
        .insert({
          content_id: actionData.contentId,
          content_type: actionData.contentType,
          action: actionData.action,
          reason: actionData.reason,
          moderator_id: actionData.moderatorId,
          automated: actionData.automated || false,
          metadata: actionData.metadata || {},
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to log moderation action:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get moderation queue
   */
  async getModerationQueue(filters = {}) {
    try {
      let query = supabase
        .from('moderation_queue')
        .select(`
          *,
          content_reports (
            id,
            report_reason,
            report_category,
            description,
            reporter_id,
            profiles!content_reports_reporter_id_fkey (
              username,
              avatar_url
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.contentType) {
        query = query.eq('content_type', filters.contentType);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_moderator', filters.assignedTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Failed to get moderation queue:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(dateRange = 7) {
    try {
      const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

      const [
        reportsCount,
        actionsCount,
        queueCount,
        warningsCount
      ] = await Promise.all([
        supabase
          .from('content_reports')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),

        supabase
          .from('moderation_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),

        supabase
          .from('moderation_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),

        supabase
          .from('user_warnings')
          .select('*', { count: 'exact', head: true })
          .gte('issued_at', startDate.toISOString())
      ]);

      return {
        success: true,
        data: {
          reportsReceived: reportsCount.count || 0,
          actionsProcessed: actionsCount.count || 0,
          pendingReviews: queueCount.count || 0,
          warningsIssued: warningsCount.count || 0,
          dateRange
        }
      };
    } catch (error) {
      console.error('Failed to get moderation stats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ContentModerationService();