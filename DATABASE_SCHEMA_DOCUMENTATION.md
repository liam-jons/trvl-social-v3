# Database Schema Documentation

## ACTUAL Database Schema Analysis
Based on analysis of successfully applied migration files, this document outlines the ACTUAL table structures and column names.

## Core Tables

### `profiles` Table
- **Primary Key**: `id` UUID (references auth.users.id)
- **Columns**:
  - `id` UUID (NOT user_id)
  - `username` TEXT
  - `full_name` TEXT (NOT first_name/last_name)
  - `avatar_url` TEXT
  - `bio` TEXT
  - `location` TEXT
  - `role` user_role (enum: 'traveler', 'vendor', 'admin')
  - `is_verified` BOOLEAN
  - `email_verified` BOOLEAN
  - `phone_verified` BOOLEAN
  - `phone_number` TEXT
  - `date_of_birth` DATE (NOT age)
  - `created_at` TIMESTAMPTZ
  - `updated_at` TIMESTAMPTZ

### `user_preferences` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**: `user_id` UUID → profiles(id)
- **Columns**: Standard preference fields + notification settings

### `vendors` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**: `user_id` UUID → profiles(id)
- **Columns**: Business information, verification status, ratings

### `adventures` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**: `vendor_id` UUID → vendors(id)

### `bookings` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**:
  - `adventure_id` UUID → adventures(id)
  - `user_id` UUID → profiles(id)
  - `vendor_id` UUID → vendors(id)

### `booking_payments` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**:
  - `booking_id` UUID → bookings(id)
  - `user_id` UUID → profiles(id)
  - `vendor_stripe_account_id` UUID → vendor_stripe_accounts(id) (added later)

### `groups` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**: `owner_id` UUID → profiles(id)

### `group_members` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**:
  - `group_id` UUID → groups(id)
  - `user_id` UUID → profiles(id)
- **Key Column**: `joined_at` TIMESTAMPTZ (NOT created_at)

### `vendor_stripe_accounts` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**:
  - `user_id` UUID → profiles(id)
  - `vendor_id` UUID → vendors(id)
- **Unique**: `stripe_account_id` TEXT

### `payment_refunds` Table (from split payment migration)
- **Primary Key**: `id` UUID
- **Foreign Keys**:
  - `individual_payment_id` UUID → individual_payments(id)
  - `split_payment_id` UUID → split_payments(id)
- **Key Column**: Uses `individual_payment_id` NOT `payment_id`

### `community_posts` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**: `user_id` UUID → profiles(id)

### `community_connections` Table
- **Primary Key**: `id` UUID
- **Foreign Keys**:
  - `user_id` UUID → profiles(id)
  - `connected_user_id` UUID → profiles(id)

## Critical Schema Issues Found

### 1. Profile Table Structure
- ❌ **WRONG**: `profiles.user_id` (doesn't exist)
- ✅ **CORRECT**: `profiles.id` (primary key referencing auth.users.id)
- ❌ **WRONG**: `profiles.age` (doesn't exist)
- ✅ **CORRECT**: `profiles.date_of_birth` DATE
- ❌ **WRONG**: `profiles.first_name` / `profiles.last_name` (don't exist)
- ✅ **CORRECT**: `profiles.full_name` TEXT

### 2. Group Members Table
- ❌ **WRONG**: `group_members.created_at` (doesn't exist)
- ✅ **CORRECT**: `group_members.joined_at` TIMESTAMPTZ

### 3. Payment Refunds Table
- ❌ **WRONG**: `payment_refunds.payment_id` (doesn't exist)
- ✅ **CORRECT**: `payment_refunds.individual_payment_id` UUID

### 4. Reference Issues
- Many migrations reference `users` table instead of `profiles` table
- Some migrations use `auth.users(id)` instead of `profiles(id)` for user references
- PostgreSQL system view column references need verification

## Migration Files Requiring Fixes

1. **20250915160000_create_payment_reconciliation_tables.sql** - ✅ LOOKS OK
2. **20250915170000_create_payout_system_tables.sql** - ❌ Needs column reference fixes
3. **20250915180000_create_refund_dispute_tables.sql** - ❌ References wrong tables/columns
4. **20250915190000_create_vendor_forum_tables.sql** - ❌ References wrong tables
5. **20250915200000_enhance_connection_system.sql** - ❌ Wrong table/column references
6. **20250915210000_create_engagement_tracking_tables.sql** - ✅ LOOKS OK
7. **20250915220000_create_modification_tables.sql** - ❌ References wrong tables

## Standard Patterns
- All tables use `id` UUID as primary key with `gen_random_uuid()` default
- User references should use `profiles(id)` not `users(id)` or `auth.users(id)`
- Timestamp columns: `created_at`, `updated_at` TIMESTAMPTZ
- All tables have RLS enabled
- Update triggers use `update_updated_at_column()` function