-- Migration: Set Up Group and Compatibility Tables
-- Description: Create tables for group formation and compatibility scoring systems

-- Create group privacy enum
CREATE TYPE group_privacy AS ENUM ('public', 'private', 'invite_only');

-- Create group member role enum
CREATE TYPE group_member_role AS ENUM ('owner', 'admin', 'member');

-- Create groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  privacy group_privacy DEFAULT 'public',
  max_members INTEGER DEFAULT 10,
  current_members INTEGER DEFAULT 1,
  avatar_url TEXT,
  cover_image_url TEXT,
  location TEXT,
  interests TEXT[],
  age_range INT4RANGE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role group_member_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  invitation_accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(group_id, user_id)
);

-- Create personality assessments table
CREATE TABLE personality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  openness DECIMAL(3, 2) CHECK (openness >= 0 AND openness <= 1),
  conscientiousness DECIMAL(3, 2) CHECK (conscientiousness >= 0 AND conscientiousness <= 1),
  extraversion DECIMAL(3, 2) CHECK (extraversion >= 0 AND extraversion <= 1),
  agreeableness DECIMAL(3, 2) CHECK (agreeableness >= 0 AND agreeableness <= 1),
  neuroticism DECIMAL(3, 2) CHECK (neuroticism >= 0 AND neuroticism <= 1),
  adventure_style TEXT CHECK (adventure_style IN ('thrill_seeker', 'explorer', 'relaxer', 'cultural', 'social')),
  budget_preference TEXT CHECK (budget_preference IN ('budget', 'moderate', 'luxury', 'flexible')),
  planning_style TEXT CHECK (planning_style IN ('spontaneous', 'flexible', 'structured', 'detailed')),
  group_preference TEXT CHECK (group_preference IN ('solo', 'couple', 'small_group', 'large_group')),
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create assessment responses table
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  response_value INTEGER CHECK (response_value >= 1 AND response_value <= 5),
  response_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, question_id)
);

-- Create group compatibility scores table
CREATE TABLE group_compatibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  compatibility_score DECIMAL(5, 2) CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  personality_match DECIMAL(5, 2),
  interest_match DECIMAL(5, 2),
  style_match DECIMAL(5, 2),
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Create compatibility algorithms table
CREATE TABLE compatibility_algorithms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  weight_personality DECIMAL(3, 2) DEFAULT 0.40,
  weight_interests DECIMAL(3, 2) DEFAULT 0.30,
  weight_style DECIMAL(3, 2) DEFAULT 0.30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create group invitations table
CREATE TABLE group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES profiles(id),
  invited_email TEXT,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invitation_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_groups_privacy ON groups(privacy);
CREATE INDEX idx_groups_active ON groups(is_active);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);

CREATE INDEX idx_personality_assessments_user_id ON personality_assessments(user_id);
CREATE INDEX idx_assessment_responses_user_id ON assessment_responses(user_id);

CREATE INDEX idx_group_compatibility_scores_group_id ON group_compatibility_scores(group_id);
CREATE INDEX idx_group_compatibility_scores_user_id ON group_compatibility_scores(user_id);
CREATE INDEX idx_group_compatibility_scores_score ON group_compatibility_scores(compatibility_score DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personality_assessments_updated_at
  BEFORE UPDATE ON personality_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compatibility_algorithms_updated_at
  BEFORE UPDATE ON compatibility_algorithms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_algorithms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Public groups are viewable by everyone"
  ON groups FOR SELECT
  USING (privacy = 'public' OR EXISTS (
    SELECT 1 FROM group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = owner_id);

-- RLS Policies for group_members
CREATE POLICY "Group members are viewable by group members"
  ON group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Group admins can manage members"
  ON group_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role IN ('owner', 'admin')
  ));

-- RLS Policies for personality_assessments
CREATE POLICY "Users can view own assessment"
  ON personality_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assessment"
  ON personality_assessments FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for assessment_responses
CREATE POLICY "Users can view own responses"
  ON assessment_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own responses"
  ON assessment_responses FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for group_compatibility_scores
CREATE POLICY "Scores viewable by group members"
  ON group_compatibility_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM group_members WHERE group_members.group_id = group_compatibility_scores.group_id AND group_members.user_id = auth.uid()
  ));

-- RLS Policies for group_invitations
CREATE POLICY "Invitations viewable by relevant parties"
  ON group_invitations FOR SELECT
  USING (invited_user_id = auth.uid() OR invited_by = auth.uid());