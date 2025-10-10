# Storage Buckets Setup Guide

## Overview
Due to schema variations in Supabase storage.buckets table across different versions, storage buckets must be created via the Supabase Dashboard or API rather than SQL migrations.

## Required Buckets

### 1. community-media
**Purpose:** User-uploaded media (images, videos) for community posts and profiles

**Settings:**
- **Name:** `community-media`
- **Public:** `true` (allows public viewing of community content)
- **File Size Limit:** 100MB (104857600 bytes)
- **Allowed MIME Types:**
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`
  - `video/mp4`
  - `video/webm`
  - `video/quicktime`

**Creation via Dashboard:**
1. Navigate to Storage in Supabase Dashboard
2. Click "Create a new bucket"
3. Enter name: `community-media`
4. Set as Public bucket
5. Configure file size limit: 100MB
6. Set allowed MIME types as listed above

**Creation via JavaScript:**
```javascript
const { data, error } = await supabase.storage.createBucket('community-media', {
  public: true,
  fileSizeLimit: '100MB',
  allowedMimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime']
});
```

**RLS Policies:** Defined in migration `20250915010000_create_media_storage.sql`

---

### 2. dispute-evidence
**Purpose:** Admin-only storage for payment dispute evidence files

**Settings:**
- **Name:** `dispute-evidence`
- **Public:** `false` (private, admin-only access)
- **File Size Limit:** 10MB recommended
- **Allowed MIME Types:** All document and image types

**Creation via Dashboard:**
1. Navigate to Storage in Supabase Dashboard
2. Click "Create a new bucket"
3. Enter name: `dispute-evidence`
4. Keep as Private bucket
5. Configure file size limit: 10MB

**Creation via JavaScript:**
```javascript
const { data, error } = await supabase.storage.createBucket('dispute-evidence', {
  public: false,
  fileSizeLimit: '10MB'
});
```

**RLS Policies:** Defined in migration `20250915180000_create_refund_dispute_tables.sql`

---

### 3. dispute-documents
**Purpose:** User and vendor uploaded documents for dispute resolution

**Settings:**
- **Name:** `dispute-documents`
- **Public:** `false` (private, admin/vendor access)
- **File Size Limit:** 10MB recommended
- **Allowed MIME Types:** Documents and images

**Creation via Dashboard:**
1. Navigate to Storage in Supabase Dashboard
2. Click "Create a new bucket"
3. Enter name: `dispute-documents`
4. Keep as Private bucket
5. Configure file size limit: 10MB

**Creation via JavaScript:**
```javascript
const { data, error } = await supabase.storage.createBucket('dispute-documents', {
  public: false,
  fileSizeLimit: '10MB'
});
```

**RLS Policies:** Defined in migration `20250915220000_create_modification_tables.sql`

---

## Deployment Checklist

### For Production Database:
- [ ] Create `community-media` bucket (public, 100MB limit)
- [ ] Create `dispute-evidence` bucket (private, 10MB limit)
- [ ] Create `dispute-documents` bucket (private, 10MB limit)
- [ ] Verify RLS policies are applied after running migrations
- [ ] Test upload functionality for each bucket

### For Staging Database:
- [ ] Create `community-media` bucket (public, 100MB limit)
- [ ] Create `dispute-evidence` bucket (private, 10MB limit)
- [ ] Create `dispute-documents` bucket (private, 10MB limit)
- [ ] Verify RLS policies are applied after running migrations
- [ ] Test upload functionality for each bucket

---

## Migration History

The following migrations were updated to remove direct SQL bucket creation:
- `20250915010000_create_media_storage.sql` - community-media bucket
- `20250915180000_create_refund_dispute_tables.sql` - dispute-evidence bucket
- `20250915220000_create_modification_tables.sql` - dispute-documents bucket

**Reason:** The `public` column was removed from `storage.buckets` schema in recent Supabase versions, causing migration failures. Bucket creation is now handled via Dashboard or API.

---

## Verification

After creating buckets, verify they exist:

```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('community-media', 'dispute-evidence', 'dispute-documents');
```

Expected output:
- community-media: public=true, file_size_limit=104857600
- dispute-evidence: public=false
- dispute-documents: public=false

---

## Troubleshooting

### Bucket creation fails
- Check Supabase project quota limits
- Verify you have admin access to the project
- Check for naming conflicts with existing buckets

### RLS policies not working
- Ensure migrations have been applied after bucket creation
- Verify user authentication is working
- Check policy conditions match user roles

### Upload failures
- Verify file size is under limit
- Check MIME type is in allowed list
- Confirm user has appropriate RLS permissions

---

**Last Updated:** 2025-10-01
**Task:** 43 - Production Database Migration
