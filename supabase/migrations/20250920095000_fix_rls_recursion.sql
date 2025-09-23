-- Fix RLS Policy Infinite Recursion Issues
-- This migration fixes the infinite recursion in group_members RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;

-- Create non-recursive policies for group_members
-- Allow users to see their own membership
CREATE POLICY "Users can view own membership"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);

-- Allow group owners to view all members
CREATE POLICY "Group owners can view all members"
  ON group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  ));

-- Allow users to join groups (insert their own membership)
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow group owners and admins to insert members
CREATE POLICY "Group owners and admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  ));

-- Allow users to update their own membership (leave group, etc.)
CREATE POLICY "Users can update own membership"
  ON group_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow group owners to update member roles
CREATE POLICY "Group owners can update member roles"
  ON group_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  ));

-- Allow users to delete their own membership
CREATE POLICY "Users can delete own membership"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Allow group owners to remove members
CREATE POLICY "Group owners can remove members"
  ON group_members FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  ));

-- Update the groups policy to avoid recursion as well
-- Drop the existing policy
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON groups;

-- Create simpler policies
CREATE POLICY "Public groups are viewable by everyone"
  ON groups FOR SELECT
  USING (privacy = 'public');

CREATE POLICY "Group owners can view their private groups"
  ON groups FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Group members can view their groups via function"
  ON groups FOR SELECT
  USING (
    privacy != 'public'
    AND id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.is_active = true
    )
  );

-- Comment explaining the fix
COMMENT ON TABLE group_members IS 'RLS policies updated to avoid infinite recursion by using direct owner checks instead of recursive member lookups';