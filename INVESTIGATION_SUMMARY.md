# User Registration Issue - Investigation Summary
**Date**: 2025-10-10
**Status**: In Progress

## Issues Addressed

### ✅ Issue 1: Datadog 403 Errors - FIXED

**Problem**: Infinite 403 errors in browser console from Datadog SDK attempting connections with placeholder credentials.

**Root Cause**: `src/services/analytics-service.js:40` unconditionally initialized Datadog even though:
- Datadog was not in the enabled services array
- Environment variables contained placeholders (`your_datadog_app_id`)
- Datadog is not being used

**Solution Implemented**:
- Modified `src/services/analytics-service.js` to make Datadog initialization conditional
- Only initializes if `VITE_DATADOG_APPLICATION_ID` is set AND not equal to 'your_datadog_app_id'

**File Changed**: `src/services/analytics-service.js:35-51`

---

### ⚠️ Issue 2: User Registration Failing - INVESTIGATING

**Error Message**:
```
ERROR: current transaction is aborted, commands ignored until end of transaction block (SQLSTATE 25P02):
ERROR: relation "profiles" does not exist (SQLSTATE 42P01)
```

**Source**: `https://trvl-social-v3-tw-group.vercel.app/` (Vercel deployment)

**Investigation Findings**:

1. ✅ **Profiles table DOES exist** in production database
   - Confirmed via direct Supabase query
   - Database: `vhecnqaejsukulaktjob.supabase.co`
   - Table is empty but structure is correct

2. ✅ **Correct database is linked**
   - Supabase CLI shows project `vhecnqaejsukulaktjob` is linked
   - Vercel logs show same database host

3. ⚠️ **Migration sync issues**
   - Three local migrations not applied to production:
     - `20251001190000_optimize_production_indexes.sql` (has errors - non-existent columns)
     - `20251001200000_add_gdpr_consent_and_anonymization.sql`
     - `20251001200000_update_age_requirement_18.sql`

4. ⚠️ **Connection pooler issues**
   - Supabase CLI connection attempts timing out
   - May be temporary infrastructure issue

## Key Insights

The error "current transaction is aborted" is critical - it means:
1. An earlier error in the transaction caused it to abort
2. The "profiles does not exist" error is likely a **secondary symptom**, not the root cause
3. The actual failure happens earlier in the `handle_new_user` trigger function

## Possible Root Causes

### Theory 1: Trigger Function Column Mismatch
The `handle_new_user` function (in migration `20250916000000_fix_auth_trigger_schema_qualification.sql`) attempts to insert into columns:
- `account_status`
- `warning_count`
- `reputation_score`

These columns were added in migration `20250915150000_create_moderation_system.sql`, which **has been applied** to production.

**However**, if the trigger function in production is an older version that doesn't match the current schema, this could cause the transaction to fail.

### Theory 2: Vercel Environment Variables
The Vercel deployment might be:
- Using cached/stale database connection
- Missing the correct Supabase service role key
- Not properly configured after GitHub integration connection

### Theory 3: RLS Policy Issues
Row Level Security policies might be preventing the trigger from inserting into the profiles table, even with SECURITY DEFINER.

## Recommended Next Steps

### Immediate Actions

1. **Verify Vercel Environment Variables**
   ```bash
   # Check Vercel dashboard for:
   - VITE_SUPABASE_URL=https://vhecnqaejsukulaktjob.supabase.co
   - VITE_SUPABASE_PUBLISHABLE_KEY=[correct anon key]
   - SUPABASE_SERVICE_ROLE_KEY=[correct service role key]
   ```

2. **Check Production Trigger Function**
   - Access Supabase SQL Editor
   - Run: `SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';`
   - Verify it matches the version in `20250916000000_fix_auth_trigger_schema_qualification.sql`

3. **Test User Registration Directly via Supabase**
   - Go to Supabase Dashboard > Authentication > Users
   - Create a test user manually
   - Check if profile is created automatically
   - Review logs for any errors

4. **Check Supabase Logs**
   - Supabase Dashboard > Logs > Postgres Logs
   - Filter for recent errors around user creation
   - Look for the actual first error in the transaction

### Migration Strategy

The problematic `20251001190000_optimize_production_indexes.sql` migration has multiple issues:
- References non-existent columns (`email` in profiles, `location` in adventures)
- Was using `CREATE INDEX CONCURRENTLY` which doesn't work in transactions

**Options**:
1. **Option A**: Fix the migration file to only create indexes for columns that exist
2. **Option B**: Delete this migration entirely and recreate it after schema is stable
3. **Option C**: Apply it manually via Supabase SQL Editor (recommended for production)

The other two migrations should be safe to apply once connection issues are resolved.

## Questions for User

1. When you connected the Supabase/GitHub integration, did you verify which Supabase project it connected to?
2. Can you access the Vercel dashboard to check environment variables?
3. Have you tried creating a user directly in the Supabase dashboard to test if the trigger works?
4. Are there any other Supabase projects that might have been confused with the production one?

## Files Modified

- ✅ `src/services/analytics-service.js` - Datadog conditional initialization
- ⚠️ `supabase/migrations/20251001190000_optimize_production_indexes.sql` - Removed CONCURRENTLY, still has column issues

## Status

- Datadog issue: **RESOLVED**
- User registration issue: **NEEDS MANUAL VERIFICATION**
  - Profiles table exists
  - Migrations partially out of sync
  - Root cause still unclear - requires access to Supabase logs and Vercel env vars
