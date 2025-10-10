# Database Index Optimization Strategy

## Overview

This document outlines the comprehensive index optimization strategy for TRVL Social V3 production database. The strategy is implemented in migration `20251001190000_optimize_production_indexes.sql`.

## Optimization Goals

1. **Query Performance**: Target < 50ms for critical queries
2. **User Experience**: Fast page loads and responsive UI
3. **Scalability**: Support growing user base without degradation
4. **Resource Efficiency**: Balance index benefits vs storage/write overhead

## Index Strategy

### Phase 1: Critical Indexes (User & Core Features)

**Target**: Most frequently accessed data
**Impact**: Immediate performance improvement for 80% of queries

#### User Authentication & Profiles
- `idx_profiles_username`: O(1) username lookups for login
- `idx_profiles_email`: O(1) email lookups for authentication
- `idx_profiles_role`: Role-based access control queries
- `idx_profiles_active_created`: Active user listings

#### Adventure Discovery (Public-Facing)
- `idx_adventures_category`: Category-based search
- `idx_adventures_location`: Location-based search
- `idx_adventures_active_rating`: Sorted adventure listings
- `idx_adventures_vendor_id`: Vendor adventure management

#### Booking System (Core Business Logic)
- `idx_bookings_user_id`: User booking history
- `idx_bookings_vendor_id`: Vendor booking management
- `idx_bookings_adventure_id`: Adventure booking analytics
- `idx_bookings_status_date`: Status-based filtering
- `idx_booking_payments_booking_id`: Payment lookups
- `idx_booking_payments_status`: Payment status tracking
- `idx_booking_payments_stripe_intent`: Stripe integration

### Phase 2: Social Features

**Target**: Social engagement queries
**Impact**: Improved social feed and interaction performance

#### Connection System
- `idx_user_connections_user_id`: User's connections list
- `idx_user_connections_connected_user_id`: Reverse connection lookups
- `idx_user_connections_status_created`: Active connections

#### Content & Engagement
- `idx_posts_author_id`: User's posts
- `idx_posts_created_at`: Chronological feed
- `idx_post_likes_post_id`: Post engagement metrics
- `idx_comments_post_id`: Post comments
- `idx_community_feed_user_id`: Personalized feed
- `idx_community_feed_relevance`: Relevance-sorted feed

### Phase 3: Notifications & Messaging

**Target**: Real-time communication features
**Impact**: Fast notification delivery and message sync

#### Notifications
- `idx_notifications_user_id_unread`: Unread notification queries (partial index)
- `idx_notifications_type`: Notification type filtering

#### WhatsApp Integration
- `idx_whatsapp_conversations_user_id`: User conversations
- `idx_whatsapp_messages_conversation_id`: Message history
- `idx_whatsapp_messages_status`: Pending message tracking

### Phase 4: Vendor & Business Operations

**Target**: Vendor dashboard and management
**Impact**: Efficient vendor operations

#### Vendor Management
- `idx_vendors_user_id`: Vendor account lookups
- `idx_vendors_status`: Vendor status filtering
- `idx_vendor_certifications_vendor_id`: Certification tracking

#### Adventure Management
- `idx_adventure_availability_adventure_id`: Availability calendar
- `idx_adventure_media_adventure_id`: Media gallery
- `idx_reviews_adventure_id_rating`: Review analytics

### Phase 5: Group & Compatibility

**Target**: AI-powered matching and group formation
**Impact**: Faster compatibility calculations

#### Groups
- `idx_groups_owner_id`: User's groups
- `idx_group_members_group_id`: Group membership

#### Personality & Matching
- `idx_personality_assessments_user_id`: User assessments
- `idx_personality_traits`: Multi-dimensional matching queries
- `idx_compatibility_scores_user_id`: Compatibility lookups

### Phase 6: Payment & Financial

**Target**: Financial operations and reporting
**Impact**: Fast payment processing and reconciliation

#### Payment Processing
- `idx_stripe_accounts_vendor_id`: Vendor Stripe accounts
- `idx_payment_splits_booking_id`: Group payment tracking
- `idx_payment_splits_deadline`: Payment reminder queries
- `idx_invoices_vendor_id`: Invoice management
- `idx_refund_requests_status`: Refund processing

### Phase 7: Moderation & Compliance

**Target**: Content safety and legal compliance
**Impact**: Efficient moderation workflows

#### Content Moderation
- `idx_content_reports_status`: Pending report queue
- `idx_age_verification_logs_user_id`: COPPA compliance
- `idx_compliance_logs_event_type`: Audit trails

### Phase 8: Analytics & Tracking

**Target**: Business intelligence and analytics
**Impact**: Fast reporting and insights

#### Engagement Analytics
- `idx_engagement_metrics_user_id`: User engagement tracking
- `idx_user_activity_logs_activity_type`: Activity analysis
- `idx_content_views_content_id`: Content performance

### Phase 9: Vendor Forum & Community

**Target**: Vendor community features
**Impact**: Improved forum performance

#### Forum System
- `idx_forum_topics_category_id`: Topic browsing
- `idx_forum_posts_topic_id`: Thread viewing
- `idx_forum_posts_author_id`: User contributions

## Index Types Used

### B-tree Indexes (Default)
Used for equality and range queries. Most common index type.

**Example**:
```sql
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
```

### Composite Indexes
Multiple columns in single index for complex queries.

**Example**:
```sql
CREATE INDEX idx_adventures_active_rating
ON adventures(is_active, rating DESC, created_at DESC)
WHERE is_active = true;
```

### Partial Indexes
Index subset of rows meeting condition (saves space).

**Example**:
```sql
CREATE INDEX idx_notifications_user_id_unread
ON notifications(user_id, created_at DESC)
WHERE is_read = false;
```

### CONCURRENTLY Option
All indexes created with `CONCURRENTLY` to avoid locking tables during creation.

## Performance Targets

### Query Performance Benchmarks

| Query Type | Target | Current | Status |
|------------|--------|---------|--------|
| User Login | < 20ms | TBD | ⏳ Pending |
| Adventure Search | < 50ms | TBD | ⏳ Pending |
| Booking List | < 30ms | TBD | ⏳ Pending |
| Notification Feed | < 25ms | TBD | ⏳ Pending |
| Payment Lookup | < 15ms | TBD | ⏳ Pending |

### Index Usage Monitoring

Monitor index effectiveness with:

```sql
-- Index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Unused Index Detection

Identify indexes that aren't being used:

```sql
-- Find unused indexes (after 1 week of production traffic)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
AND indexname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Trade-offs & Considerations

### Benefits
- **Faster Queries**: O(log n) lookups vs O(n) table scans
- **Better UX**: Responsive UI, faster page loads
- **Scalability**: Performance maintained as data grows
- **Resource Efficiency**: Reduced CPU for query execution

### Costs
- **Storage**: ~10-15% additional disk space
- **Write Performance**: Small overhead on INSERT/UPDATE/DELETE
- **Maintenance**: Indexes need periodic reindexing
- **Memory**: Indexes cached in RAM (less space for data cache)

### Optimization Decisions

**Why Composite Indexes?**
- Single index can satisfy multiple query patterns
- Example: `idx_bookings_status_date` handles both status filtering AND date sorting

**Why Partial Indexes?**
- Smaller index size (only relevant rows)
- Example: `idx_notifications_user_id_unread` only indexes unread notifications
- Benefit: Faster queries, less storage, better cache utilization

**Why CONCURRENTLY?**
- Avoids table locking during index creation
- Production deployment can happen without downtime
- Trade-off: Takes longer to create, but doesn't block writes

## Maintenance Schedule

### Weekly
- Monitor index usage statistics
- Check for bloated indexes
- Review slow query logs

### Monthly
- Analyze table statistics
- Reindex frequently updated tables if needed
- Review and remove unused indexes

### Quarterly
- Full index performance review
- Add indexes for new query patterns
- Optimize composite indexes based on actual usage

## Verification Procedures

### After Migration

1. **Verify Index Creation**:
```sql
SELECT count(*)
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
```
Expected: 90+ custom indexes

2. **Check Index Sizes**:
```sql
SELECT
  schemaname || '.' || tablename AS table,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

3. **Test Query Performance**:
```sql
EXPLAIN ANALYZE
SELECT * FROM adventures
WHERE is_active = true
ORDER BY rating DESC
LIMIT 10;
```
Check for "Index Scan" instead of "Seq Scan"

### Performance Testing

Run these test queries to verify optimization:

```sql
-- Test 1: User authentication (should use idx_profiles_username)
EXPLAIN ANALYZE
SELECT * FROM profiles WHERE username = 'testuser';

-- Test 2: Adventure search (should use idx_adventures_active_rating)
EXPLAIN ANALYZE
SELECT * FROM adventures
WHERE is_active = true
ORDER BY rating DESC
LIMIT 20;

-- Test 3: User bookings (should use idx_bookings_user_id)
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE user_id = 'some-uuid'
ORDER BY booking_date DESC;

-- Test 4: Unread notifications (should use idx_notifications_user_id_unread)
EXPLAIN ANALYZE
SELECT * FROM notifications
WHERE user_id = 'some-uuid' AND is_read = false
ORDER BY created_at DESC;
```

## Rollback Procedure

If indexes cause issues:

```sql
-- Drop specific index
DROP INDEX CONCURRENTLY IF EXISTS idx_name;

-- Drop all custom indexes (NUCLEAR OPTION - avoid)
DO $$
DECLARE
  idx RECORD;
BEGIN
  FOR idx IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
  LOOP
    EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS ' || idx.indexname;
  END LOOP;
END $$;
```

## Future Optimization Opportunities

### Potential Additions (Based on Usage)

1. **Full-Text Search Indexes**:
```sql
CREATE INDEX idx_adventures_search
ON adventures USING GIN(to_tsvector('english', title || ' ' || description));
```

2. **Geospatial Indexes** (if using PostGIS):
```sql
CREATE INDEX idx_adventures_location_gist
ON adventures USING GIST(location_coordinates);
```

3. **BRIN Indexes** (for very large time-series tables):
```sql
CREATE INDEX idx_user_activity_logs_brin
ON user_activity_logs USING BRIN(activity_timestamp);
```

## Related Documentation

- [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) - Overall migration strategy
- [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) - Migration execution guide
- PostgreSQL Index Documentation: https://www.postgresql.org/docs/current/indexes.html

---

**Document Version**: 1.0
**Last Updated**: October 1, 2025
**Next Review**: November 1, 2025
