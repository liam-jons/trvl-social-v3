-- Emergency RLS Policy Fix - Remove ALL potentially recursive policies
-- This migration completely removes and recreates RLS policies to eliminate infinite recursion

-- Disable RLS temporarily
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on these tables
DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members CASCADE;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members CASCADE;
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON groups CASCADE;
DROP POLICY IF EXISTS "Group members can view their groups via function" ON groups CASCADE;
DROP POLICY IF EXISTS "Group owners can view their private groups" ON groups CASCADE;
DROP POLICY IF EXISTS "Users can view own membership" ON group_members CASCADE;
DROP POLICY IF EXISTS "Group owners can view all members" ON group_members CASCADE;
DROP POLICY IF EXISTS "Users can join groups" ON group_members CASCADE;
DROP POLICY IF EXISTS "Group owners and admins can add members" ON group_members CASCADE;
DROP POLICY IF EXISTS "Users can update own membership" ON group_members CASCADE;
DROP POLICY IF EXISTS "Group owners can update member roles" ON group_members CASCADE;
DROP POLICY IF EXISTS "Users can delete own membership" ON group_members CASCADE;
DROP POLICY IF EXISTS "Group owners can remove members" ON group_members CASCADE;

-- Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for groups table
CREATE POLICY "groups_public_read"
  ON groups FOR SELECT
  USING (privacy = 'public');

CREATE POLICY "groups_owner_all"
  ON groups FOR ALL
  USING (auth.uid() = owner_id);

-- Create simple, non-recursive policies for group_members table
CREATE POLICY "group_members_own_read"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "group_members_own_insert"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "group_members_own_update"
  ON group_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "group_members_own_delete"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE groups IS 'RLS policies simplified to prevent infinite recursion - emergency fix applied';
COMMENT ON TABLE group_members IS 'RLS policies simplified to prevent infinite recursion - emergency fix applied';