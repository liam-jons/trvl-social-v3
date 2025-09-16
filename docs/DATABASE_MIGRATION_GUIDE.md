# Database Migration Guide - TRVL Social v3

## Overview

This guide documents the complete database migration strategy for the TRVL Social v3 platform, built on Supabase PostgreSQL. The database supports a comprehensive travel social platform with advanced features including AI-powered group compatibility, payment processing, and real-time communication.

## Supabase Project Information

- **Project URL**: https://vhecnqaejsukulaktjob.supabase.co
- **Project ID**: vhecnqaejsukulaktjob
- **Database**: PostgreSQL 15+
- **Total Migrations**: 25 files
- **Migration Date Range**: 2024-09-14 to 2025-09-15

## Migration Files Overview

### Phase 1: Core Foundation (2024-09-14)

#### 001_create_user_tables.sql
**Purpose**: Foundational user authentication and profile system
**Critical Tables**:
- `profiles` - User profiles extending Supabase auth
- `user_preferences` - User settings and preferences

**Key Features**:
- User role enum (`traveler`, `vendor`, `admin`)
- Automatic profile creation trigger
- RLS policies for data security
- Updated timestamp triggers

#### 002_create_vendor_adventure_tables.sql
**Purpose**: Vendor management and adventure listings
**Critical Tables**:
- `vendors` - Vendor business profiles
- `adventures` - Adventure/experience listings
- `adventure_availability` - Scheduling system
- `adventure_media` - Media attachments
- `vendor_certifications` - Professional certifications
- `vendor_insurance` - Insurance documentation

**Key Features**:
- Vendor status workflow (`pending`, `active`, `suspended`, `inactive`)
- Adventure categorization and difficulty levels
- Geographic location support
- Stripe Connect integration ready

#### 003_create_booking_payment_tables.sql
**Purpose**: Booking system with payment processing
**Critical Tables**:
- `bookings` - Main booking records
- `booking_payments` - Payment transactions
- `booking_participants` - Individual participants
- `payment_splits` - Group payment splitting
- `booking_modifications` - Change tracking
- `reviews` - Customer feedback system

**Key Features**:
- Complex booking status workflow
- Multi-payment method support
- Group booking capabilities
- Comprehensive audit trail

#### 004_create_group_compatibility_tables.sql
**Purpose**: AI-powered group formation and compatibility
**Critical Tables**:
- `groups` - Group definitions
- `group_members` - Membership management
- `personality_assessments` - Big Five personality model
- `compatibility_scores` - AI-generated compatibility
- `travel_preferences` - Travel style preferences

**Key Features**:
- Big Five personality assessment
- Dynamic compatibility scoring
- Group privacy controls
- Interest-based matching

### Phase 2: Social Features (2024-09-14)

#### 005_create_community_social_tables.sql
**Purpose**: Social networking and community features
**Critical Tables**:
- `user_connections` - Friend/connection system
- `posts` - User-generated content
- `post_likes` - Engagement tracking
- `comments` - Comment system
- `comment_likes` - Comment engagement
- `community_feed_items` - Algorithmic feed

**Key Features**:
- Connection status management
- Content interaction tracking
- Feed algorithm support
- Privacy controls

#### 005_add_personality_assessment_indexes.sql
**Purpose**: Performance optimization for personality system
**Additions**:
- Composite indexes for personality scoring
- Geospatial indexes for location-based matching
- Performance optimization for compatibility algorithms

#### 006_create_functions_triggers.sql
**Purpose**: Database functions and automated triggers
**Key Features**:
- Automatic profile creation
- Statistics update triggers
- Data validation functions
- Cleanup procedures

#### 007_create_ml_model_tables.sql
**Purpose**: Machine learning and algorithm support
**Critical Tables**:
- `model_training_data` - Training datasets
- `compatibility_model_versions` - Model versioning
- `user_behavior_data` - Behavioral analytics

### Phase 3: Payment Integration (2024-09-14 to 2025-09-15)

#### 008_create_stripe_connect_tables.sql
**Purpose**: Stripe Connect integration for vendor payments
**Critical Tables**:
- `stripe_accounts` - Vendor Stripe accounts
- `stripe_account_onboarding` - Onboarding status
- `stripe_products` - Product catalog
- `stripe_prices` - Pricing structures
- `stripe_payment_intents` - Payment processing

### Phase 4: Communication System (2025-09-14)

#### 009_create_notification_tables.sql
**Purpose**: Comprehensive notification system
**Critical Tables**:
- `notifications` - Notification records
- `notification_settings` - User preferences

#### 010_create_whatsapp_tables.sql
**Purpose**: WhatsApp Business API integration
**Critical Tables**:
- `whatsapp_conversations` - Conversation management
- `whatsapp_messages` - Message storage
- `whatsapp_contacts` - Contact management
- `whatsapp_webhooks` - Webhook processing

### Phase 5: Advanced Features (2025-09-15)

#### 001_create_media_storage.sql
**Purpose**: Advanced media management
**Critical Tables**:
- `media_files` - File metadata
- `media_thumbnails` - Thumbnail generation
- `media_metadata` - Rich metadata

#### 010_create_split_payment_tables.sql
**Purpose**: Advanced payment splitting
**Enhanced Features**:
- Complex payment splitting algorithms
- Payment deadline management
- Automated reminders

#### 010_enhance_webhook_system.sql
**Purpose**: Robust webhook management
**Critical Tables**:
- `webhook_logs` - Event logging
- `webhook_events` - Event definitions
- `webhook_failures` - Error handling

#### 010_optimize_compatibility_indexes.sql
**Purpose**: Performance optimization
**Enhancements**:
- Advanced indexing strategies
- Query optimization
- Database performance tuning

### Phase 6: Business Operations (2025-09-15)

#### 011_add_payment_tokens_table.sql
**Purpose**: Secure payment token management

#### 011_create_invoice_tables.sql
**Purpose**: Invoicing and billing system
**Critical Tables**:
- `invoices` - Invoice records
- `invoice_items` - Line items

#### 011_create_moderation_system.sql
**Purpose**: Content moderation and safety
**Critical Tables**:
- `content_reports` - User reports
- `moderation_actions` - Admin actions
- `automated_moderation_rules` - AI moderation

#### 011_create_payment_reconciliation_tables.sql
**Purpose**: Financial reconciliation
**Critical Tables**:
- `payment_reconciliations` - Reconciliation records

#### 011_create_payout_system_tables.sql
**Purpose**: Vendor payout management
**Critical Tables**:
- `payout_schedules` - Payout timing
- `payout_transactions` - Payout records

#### 011_create_refund_dispute_tables.sql
**Purpose**: Refund and dispute management
**Critical Tables**:
- `refund_requests` - Refund processing
- `dispute_cases` - Dispute resolution

#### 011_create_vendor_forum_tables.sql
**Purpose**: Vendor community forum
**Critical Tables**:
- `forum_categories` - Forum organization
- `forum_topics` - Discussion topics
- `forum_posts` - Forum posts
- `forum_post_votes` - Community voting

#### 011_enhance_connection_system.sql
**Purpose**: Enhanced social connections

### Phase 7: Analytics & Monitoring (2025-09-15)

#### 012_create_engagement_tracking_tables.sql
**Purpose**: Comprehensive analytics
**Critical Tables**:
- `engagement_metrics` - Engagement tracking
- `user_activity_logs` - Activity monitoring
- `content_views` - Content analytics
- `user_interactions` - Interaction tracking

#### 020_create_modification_tables.sql
**Purpose**: System modification tracking

## Critical Dependencies

### Foreign Key Relationships

1. **User System**:
   - `profiles.id` → `auth.users.id`
   - `user_preferences.user_id` → `profiles.id`

2. **Vendor System**:
   - `vendors.user_id` → `profiles.id`
   - `adventures.vendor_id` → `vendors.id`
   - `adventure_availability.adventure_id` → `adventures.id`

3. **Booking System**:
   - `bookings.user_id` → `profiles.id`
   - `bookings.vendor_id` → `vendors.id`
   - `bookings.adventure_id` → `adventures.id`
   - `booking_payments.booking_id` → `bookings.id`

4. **Social System**:
   - `groups.owner_id` → `profiles.id`
   - `group_members.user_id` → `profiles.id`
   - `group_members.group_id` → `groups.id`

## Execution Order

### Critical Execution Sequence

1. **Foundation** (Must be first):
   - 001_create_user_tables.sql
   - 002_create_vendor_adventure_tables.sql

2. **Core Business Logic**:
   - 003_create_booking_payment_tables.sql
   - 004_create_group_compatibility_tables.sql

3. **Social Features**:
   - 005_create_community_social_tables.sql
   - 005_add_personality_assessment_indexes.sql

4. **System Functions**:
   - 006_create_functions_triggers.sql
   - 007_create_ml_model_tables.sql

5. **Payment Integration**:
   - 008_create_stripe_connect_tables.sql

6. **Communication**:
   - 009_create_notification_tables.sql
   - 010_create_whatsapp_tables.sql

7. **Advanced Features** (Can be run in parallel):
   - All 2025-09-15 migrations

## Row Level Security (RLS)

### Enabled Tables
All tables have RLS enabled with specific policies:

- **Public Read**: `profiles`, `adventures`, `adventure_media`, `reviews`
- **Owner Access**: `user_preferences`, `bookings`, `booking_payments`
- **Vendor Access**: `vendors`, `adventures`, `adventure_availability`
- **Admin Access**: `vendor_insurance`, sensitive business data

### Key RLS Policies

1. **Profile Access**:
   ```sql
   CREATE POLICY "Public profiles are viewable by everyone"
     ON profiles FOR SELECT USING (true);

   CREATE POLICY "Users can update own profile"
     ON profiles FOR UPDATE USING (auth.uid() = id);
   ```

2. **Booking Security**:
   ```sql
   CREATE POLICY "Users can view own bookings"
     ON bookings FOR SELECT
     USING (auth.uid() = user_id OR EXISTS (
       SELECT 1 FROM vendors WHERE vendors.id = bookings.vendor_id
       AND vendors.user_id = auth.uid()
     ));
   ```

## Storage Buckets

### Required Buckets
- `avatars` - User profile images
- `adventure-media` - Adventure photos/videos
- `vendor-documents` - Business documents
- `user-uploads` - General user content
- `system-media` - Platform assets

## Performance Considerations

### Critical Indexes

1. **User Lookups**:
   - `idx_profiles_username`
   - `idx_profiles_role`
   - `idx_profiles_location`

2. **Adventure Search**:
   - `idx_adventures_category`
   - `idx_adventures_location`
   - `idx_adventures_rating`

3. **Booking Performance**:
   - `idx_bookings_user_id`
   - `idx_bookings_adventure_id`
   - `idx_bookings_booking_date`

4. **Compatibility Algorithms**:
   - Composite indexes on personality traits
   - Geospatial indexes for location matching

## Verification Process

### Automated Verification

Use the migration verification script:

```bash
# Run verification
node src/utils/verify-migrations.js

# Expected output:
# ✅ Database connection successful
# ✅ All critical tables present
# ✅ RLS policies configured
# ✅ Storage buckets configured
```

### Manual Verification Checklist

1. **Connection Test**:
   ```sql
   SELECT count(*) FROM profiles;
   ```

2. **Table Existence**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

3. **RLS Status**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = true;
   ```

4. **Enum Types**:
   ```sql
   SELECT typname FROM pg_type WHERE typtype = 'e';
   ```

## Rollback Procedures

### Emergency Rollback

**⚠️ WARNING**: Rollback procedures will result in data loss. Only use in emergency situations.

1. **Backup Current State**:
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Selective Table Rollback**:
   ```sql
   -- Example: Remove latest migration tables
   DROP TABLE IF EXISTS engagement_metrics CASCADE;
   DROP TABLE IF EXISTS user_activity_logs CASCADE;
   ```

3. **Complete Schema Reset** (Nuclear option):
   ```sql
   -- ⚠️ THIS WILL DELETE ALL DATA
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

### Safe Migration Retry

If migrations fail:

1. **Check Failed Migration**:
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations;
   ```

2. **Manual Fix and Retry**:
   - Fix the specific issue
   - Re-run the migration
   - Verify with verification script

## Post-Migration Verification Steps

### 1. Basic Functionality Test
```bash
# Run the verification script
node src/utils/verify-migrations.js
```

### 2. Performance Baseline
```sql
-- Check query performance on critical tables
EXPLAIN ANALYZE SELECT * FROM adventures
WHERE category = 'hiking' AND is_active = true
ORDER BY rating DESC LIMIT 10;
```

### 3. RLS Policy Test
```sql
-- Test RLS without authentication (should be restricted)
SET ROLE anon;
SELECT * FROM booking_payments LIMIT 1; -- Should fail or return empty
```

### 4. Storage Bucket Test
```javascript
// Test file upload capability
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('test.jpg', file);
```

### 5. Trigger Verification
```sql
-- Insert test user and verify profile creation
-- (This should be done in development environment only)
```

## Common Issues and Solutions

### Issue 1: Migration Order Errors
**Symptom**: Foreign key constraint violations
**Solution**: Ensure migrations run in chronological order (001, 002, 003, etc.)

### Issue 2: RLS Policy Conflicts
**Symptom**: Access denied errors in application
**Solution**: Verify RLS policies match application authentication flow

### Issue 3: Storage Bucket Missing
**Symptom**: File upload failures
**Solution**: Manually create buckets via Supabase dashboard or API

### Issue 4: Index Performance
**Symptom**: Slow query performance
**Solution**: Run `ANALYZE` on tables, check index usage with `EXPLAIN`

### Issue 5: Enum Type Conflicts
**Symptom**: Migration fails with enum type errors
**Solution**: Drop and recreate enum types if necessary

## Production Deployment

### Pre-Production Checklist
- [ ] All migrations tested in development
- [ ] Performance benchmarks established
- [ ] RLS policies verified
- [ ] Storage buckets configured
- [ ] Webhook endpoints configured
- [ ] API keys and secrets configured

### Production Migration Process
1. **Maintenance Window**: Schedule during low-traffic period
2. **Backup**: Full database backup before migration
3. **Migration**: Run migrations in sequence
4. **Verification**: Full verification script execution
5. **Monitoring**: Watch for errors in first 24 hours

### Monitoring and Alerts
- Database performance metrics
- Query error rates
- RLS policy violations
- Storage usage
- Connection pool status

## Support and Maintenance

### Regular Maintenance Tasks
- **Weekly**: Performance monitoring review
- **Monthly**: Storage cleanup and optimization
- **Quarterly**: Index optimization review
- **Annually**: Schema review and optimization

### Emergency Contacts
- Database Administrator: [Contact Info]
- Supabase Support: [Support Channels]
- Development Team: [Team Contacts]

---

**Last Updated**: September 15, 2025
**Version**: 1.0
**Next Review**: October 15, 2025