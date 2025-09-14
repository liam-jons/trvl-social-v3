# TRVL Social V3 Database Schema

## Overview
Complete Supabase database schema for TRVL Social application with all tables, relationships, and security policies.

## Migration Files Created

### 1. `20240914_001_create_user_tables.sql`
- **profiles**: User profiles extending auth.users
- **user_preferences**: Notification and privacy settings
- Includes RLS policies and triggers

### 2. `20240914_002_create_vendor_adventure_tables.sql`
- **vendors**: Vendor business profiles
- **adventures**: Adventure listings
- **adventure_availability**: Schedule and capacity
- **adventure_media**: Images and videos
- **vendor_certifications**: Professional certifications
- **vendor_insurance**: Insurance documentation

### 3. `20240914_003_create_booking_payment_tables.sql`
- **bookings**: Main booking records
- **booking_payments**: Payment transactions
- **booking_participants**: Group booking participants
- **payment_splits**: Group payment management
- **booking_modifications**: Change history
- **reviews**: User reviews and ratings

### 4. `20240914_004_create_group_compatibility_tables.sql`
- **groups**: Travel groups
- **group_members**: Group membership
- **personality_assessments**: User personality profiles
- **assessment_responses**: Quiz responses
- **group_compatibility_scores**: Match scores
- **compatibility_algorithms**: Scoring configuration
- **group_invitations**: Group invites

### 5. `20240914_005_create_community_social_tables.sql`
- **community_posts**: Social posts
- **community_connections**: User connections
- **vendor_forums**: Vendor discussion forums
- **post_reactions**: Post likes/reactions
- **post_comments**: Comments on posts
- **connection_requests**: Friend requests
- **engagement_scores**: User activity metrics
- **trip_requests**: Custom trip requests
- **vendor_bids**: Vendor proposals
- **bid_messages**: Bid negotiation
- **request_invitations**: Vendor invites

### 6. `20240914_006_create_functions_triggers.sql`
Database functions:
- `calculate_compatibility_score()`: Calculate user compatibility
- `get_adventure_availability()`: Check availability
- `update_engagement_scores()`: Update user engagement
- `process_group_payment()`: Handle group payments
- `search_adventures()`: Full-text search
- `get_vendor_analytics()`: Vendor performance metrics

Triggers:
- Auto-update timestamps
- Update vendor ratings
- Update group member counts
- Update connection strength
- Real-time subscriptions configuration

## Key Features

### Security
- Row Level Security (RLS) on all tables
- Role-based access control (traveler, vendor, admin)
- Secure policy definitions for CRUD operations

### Performance
- Comprehensive indexes on foreign keys and frequently queried columns
- Composite indexes for complex queries
- Full-text search indexes for content discovery

### Real-time
- Enabled for community posts, comments, reactions
- Booking status updates
- Group member changes
- Bid messages

### Data Integrity
- Foreign key constraints
- Check constraints for enums and valid data
- Cascade deletes where appropriate
- Unique constraints to prevent duplicates

## Database Relationships

```
auth.users
    └── profiles
        ├── user_preferences
        ├── vendors
        │   ├── adventures
        │   │   ├── adventure_availability
        │   │   ├── adventure_media
        │   │   └── bookings
        │   ├── vendor_certifications
        │   └── vendor_insurance
        ├── bookings
        │   ├── booking_payments
        │   ├── booking_participants
        │   ├── payment_splits
        │   ├── booking_modifications
        │   └── reviews
        ├── groups (as owner)
        ├── group_members
        ├── personality_assessments
        │   └── assessment_responses
        ├── community_posts
        │   ├── post_reactions
        │   └── post_comments
        ├── community_connections
        ├── trip_requests
        │   └── vendor_bids
        │       └── bid_messages
        └── engagement_scores
```

## Enums Created

- `user_role`: traveler, vendor, admin
- `vendor_status`: pending, active, suspended, inactive
- `adventure_category`: hiking, water_sports, cultural, etc.
- `difficulty_level`: easy, moderate, challenging, extreme
- `booking_status`: pending, confirmed, cancelled, completed, refunded, expired
- `payment_status`: pending, processing, completed, failed, refunded
- `payment_method`: stripe, paypal, bank_transfer, cash, other
- `group_privacy`: public, private, invite_only
- `group_member_role`: owner, admin, member
- `post_visibility`: public, friends, group, private
- `connection_status`: pending, accepted, blocked, declined
- `bid_status`: draft, submitted, accepted, rejected, withdrawn, expired

## Usage Instructions

### Running Migrations

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Initialize Supabase (if not already done):
```bash
supabase init
```

3. Link to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

4. Run migrations:
```bash
supabase db push
```

### Local Development

1. Start Supabase locally:
```bash
supabase start
```

2. Apply migrations:
```bash
supabase db reset
```

3. Access local dashboard:
```
http://localhost:54323
```

## Testing

The schema includes comprehensive test strategies:
- Unit tests for RLS policies
- Integration tests for CRUD operations
- Performance testing for complex queries
- Real-time subscription testing
- Data integrity constraint verification

## Next Steps

1. Create seed data for development
2. Implement database backup strategy
3. Set up monitoring and alerting
4. Create database documentation
5. Implement API endpoints for database operations