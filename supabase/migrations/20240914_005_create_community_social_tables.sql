-- Migration: Build Community and Social Tables
-- Description: Implement community features including posts, connections, forums, and trip requests

-- Create post visibility enum
CREATE TYPE post_visibility AS ENUM ('public', 'friends', 'group', 'private');

-- Create connection status enum
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'blocked', 'declined');

-- Create bid status enum
CREATE TYPE bid_status AS ENUM ('draft', 'submitted', 'accepted', 'rejected', 'withdrawn', 'expired');

-- Community posts table
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  group_id UUID REFERENCES groups(id),
  content TEXT NOT NULL,
  visibility post_visibility DEFAULT 'public',
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  media_urls TEXT[],
  mentioned_users UUID[],
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Community connections table
CREATE TABLE community_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  connected_user_id UUID NOT NULL REFERENCES profiles(id),
  status connection_status DEFAULT 'pending',
  connection_strength DECIMAL(3, 2) DEFAULT 0.5,
  interaction_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, connected_user_id),
  CHECK (user_id != connected_user_id)
);

-- Vendor forums table
CREATE TABLE vendor_forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  posts_count INTEGER DEFAULT 0,
  members_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Post reactions table
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'helpful', 'wow', 'sad')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  parent_comment_id UUID REFERENCES post_comments(id),
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Connection requests table
CREATE TABLE connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(requester_id, recipient_id)
);

-- Engagement scores table
CREATE TABLE engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  total_posts INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  total_connections INTEGER DEFAULT 0,
  engagement_score DECIMAL(10, 2) DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trip requests table
CREATE TABLE trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  participants_count INTEGER DEFAULT 1,
  description TEXT NOT NULL,
  requirements TEXT[],
  preferred_activities adventure_category[],
  is_flexible_dates BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed', 'matched', 'cancelled')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'vendors_only', 'invited_only')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Vendor bids table
CREATE TABLE vendor_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES trip_requests(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  proposed_price DECIMAL(10, 2) NOT NULL,
  proposed_itinerary JSONB NOT NULL,
  included_services TEXT[],
  excluded_services TEXT[],
  terms_conditions TEXT,
  validity_period INTEGER DEFAULT 7,
  status bid_status DEFAULT 'draft',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trip_request_id, vendor_id)
);

-- Bid messages table
CREATE TABLE bid_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES vendor_bids(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  attachments TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Request invitations table
CREATE TABLE request_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES trip_requests(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trip_request_id, vendor_id)
);

-- Create indexes
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_group_id ON community_posts(group_id);
CREATE INDEX idx_community_posts_visibility ON community_posts(visibility);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);

CREATE INDEX idx_community_connections_user_id ON community_connections(user_id);
CREATE INDEX idx_community_connections_connected_user_id ON community_connections(connected_user_id);
CREATE INDEX idx_community_connections_status ON community_connections(status);

CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON post_reactions(user_id);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

CREATE INDEX idx_trip_requests_user_id ON trip_requests(user_id);
CREATE INDEX idx_trip_requests_status ON trip_requests(status);
CREATE INDEX idx_trip_requests_dates ON trip_requests(start_date, end_date);

CREATE INDEX idx_vendor_bids_trip_request_id ON vendor_bids(trip_request_id);
CREATE INDEX idx_vendor_bids_vendor_id ON vendor_bids(vendor_id);
CREATE INDEX idx_vendor_bids_status ON vendor_bids(status);

-- Create triggers for updated_at
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_connections_updated_at
  BEFORE UPDATE ON community_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_forums_updated_at
  BEFORE UPDATE ON vendor_forums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_engagement_scores_updated_at
  BEFORE UPDATE ON engagement_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_requests_updated_at
  BEFORE UPDATE ON trip_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_bids_updated_at
  BEFORE UPDATE ON vendor_bids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
CREATE POLICY "Public posts are viewable by everyone"
  ON community_posts FOR SELECT
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can create own posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for trip_requests
CREATE POLICY "Public requests are viewable"
  ON trip_requests FOR SELECT
  USING (visibility = 'public' OR user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM vendors WHERE vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own requests"
  ON trip_requests FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for vendor_bids
CREATE POLICY "Bids viewable by parties"
  ON vendor_bids FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trip_requests WHERE trip_requests.id = vendor_bids.trip_request_id AND trip_requests.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_bids.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Vendors can manage own bids"
  ON vendor_bids FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_bids.vendor_id AND vendors.user_id = auth.uid()
  ));