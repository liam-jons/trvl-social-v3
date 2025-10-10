# Fix for Infinite Recurring 400 Errors from Supabase REST API

## Date: 2025-10-10
## Issue: 400 Bad Request errors on `/rest/v1/trip_requests` endpoint

---

## Root Cause Analysis

The 400 errors were caused by **missing database columns** that the application queries were trying to access:

### 1. Missing Columns in `vendors` Table
The query was trying to select these non-existent columns:
- `avatar_url` - Vendor business logo/profile picture
- `specialties` - Array of vendor specialties/services
- `certifications` - Array of certification names

### 2. Missing Column in `trip_requests` Table
- `title` - Short trip request title for display (only had `description` and `destination`)

### 3. Wrong Column Name Usage
- Code used: `group_size`
- Schema has: `participants_count`

### 4. Infinite Loop Cause
The `useEffect` hook in `OfferManagementPage.jsx` had `loadUserTripRequests` in its dependency array, causing it to re-trigger on every error, creating an infinite loop.

---

## Files Fixed

### Migration Created
**File:** `/Users/liamj/Documents/development/trvl-social-v3/supabase/migrations/20251010150000_fix_vendors_trip_requests_schema.sql`

Adds the missing columns:
- `vendors.avatar_url` (TEXT)
- `vendors.specialties` (TEXT[])
- `vendors.certifications` (TEXT[])
- `trip_requests.title` (TEXT NOT NULL)

Also populates existing `trip_requests` records with auto-generated titles from their descriptions.

### Code Files Updated

1. **`/Users/liamj/Documents/development/trvl-social-v3/src/stores/offerManagementStore.js`**
   - Added console.error logging for better debugging
   - Fixed `setTripRequests` to actually use the parameter (was missing)
   - Query now correctly references the new columns that will exist after migration

2. **`/Users/liamj/Documents/development/trvl-social-v3/src/pages/OfferManagementPage.jsx`**
   - Fixed infinite loop by using `useCallback` to memoize the load function
   - Changed dependency array to only depend on `user?.id` instead of the function itself
   - Updated retry handler to use the memoized function

3. **Column Name Fixes (group_size → participants_count):**
   - `src/components/offers/SavedOffers.jsx`
   - `src/components/offers/OfferActionModal.jsx`
   - `src/components/offers/OfferCard.jsx`
   - `src/components/offers/OfferComparison.jsx`
   - `src/components/vendor/TripRequestCard.jsx`
   - `src/components/vendor/BidSubmissionModal.jsx`

---

## Testing Required

### 1. Run the Migration
```bash
# Apply the migration to add missing columns
supabase db push

# Or if using migration files directly:
psql -h [host] -U [user] -d [database] -f supabase/migrations/20251010150000_fix_vendors_trip_requests_schema.sql
```

### 2. Verify Schema Changes
```sql
-- Check vendors table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vendors'
  AND column_name IN ('avatar_url', 'specialties', 'certifications');

-- Check trip_requests has title
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trip_requests'
  AND column_name = 'title';
```

### 3. Test Application Pages
- **Offers Page** (`/offers`) - Should load without 400 errors
- **Social Search** - Check trip requests display correctly
- **Adventures Page** - Verify vendor data loads properly
- **Saved Offers** - Test saved offers functionality

### 4. Check for Errors
Open browser DevTools console and verify:
- No 400 errors from `/rest/v1/trip_requests`
- No infinite request loops
- Data displays correctly with titles and participant counts

---

## Expected Behavior After Fix

### Before Fix
- Continuous 400 errors in console
- Infinite loop of failed requests
- Empty/broken offer displays
- Pages: Offers, Social Search, Adventures affected

### After Fix
- Clean query execution
- Single request per page load
- Proper display of:
  - Trip request titles
  - Participant counts (not "group size")
  - Vendor avatars (when set)
  - Vendor specialties (when set)
- No infinite loops

---

## Future Considerations

### 1. Populate Vendor Data
After migration, vendors should update their profiles with:
```sql
-- Example: Update vendor with avatar and specialties
UPDATE vendors
SET
  avatar_url = 'https://example.com/logo.jpg',
  specialties = ARRAY['hiking', 'cultural tours', 'food & wine'],
  certifications = ARRAY['First Aid Certified', 'Tour Guide License']
WHERE id = 'vendor-uuid';
```

### 2. Form Updates
Update vendor profile forms to allow editing:
- Avatar URL upload/input
- Specialty selection (checkboxes or multi-select)
- Certification management

### 3. Trip Request Creation
Update trip request forms to include:
- Title field (required, max 100 chars recommended)
- Auto-generate title from destination if not provided

---

## Related Tables & Foreign Keys

### Verified Working
- `profiles.avatar_url` - EXISTS (used for user avatars)
- `trip_requests_user_id_fkey` - VALID foreign key to profiles(id)
- `vendor_bids_vendor_id_fkey` - VALID foreign key to vendors(id)
- `vendor_bids_trip_request_id_fkey` - VALID foreign key to trip_requests(id)

### Schema Differences
- `trip_requests.participants_count` (in DB) vs `group_size` (in old code) - NOW FIXED
- `vendor_certifications` table exists separately for detailed cert records
- New columns are intentionally TEXT[] for flexibility

---

## Rollback Plan

If issues occur after migration:

```sql
-- Rollback: Remove added columns
ALTER TABLE vendors
  DROP COLUMN IF EXISTS avatar_url,
  DROP COLUMN IF EXISTS specialties,
  DROP COLUMN IF EXISTS certifications;

ALTER TABLE trip_requests
  DROP COLUMN IF EXISTS title;
```

Then revert code changes:
```bash
git checkout HEAD~1 -- src/stores/offerManagementStore.js
git checkout HEAD~1 -- src/pages/OfferManagementPage.jsx
# Revert other files as needed
```

---

## Contact & Support

For issues with this fix:
1. Check Supabase logs for migration errors
2. Verify all files were updated (see list above)
3. Clear browser cache and localStorage
4. Check browser console for any remaining errors

Migration file: `supabase/migrations/20251010150000_fix_vendors_trip_requests_schema.sql`
