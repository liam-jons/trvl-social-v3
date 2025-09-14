-- Migration: Database Functions, Triggers, and Real-time Subscriptions
-- Description: Create complex database functions, triggers, and set up real-time subscriptions

-- Function to calculate compatibility score
CREATE OR REPLACE FUNCTION calculate_compatibility_score(
  p_user1_id UUID,
  p_user2_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  v_score DECIMAL(5, 2) := 0;
  v_personality_score DECIMAL(5, 2) := 0;
  v_style_score DECIMAL(5, 2) := 0;
  v_user1_assessment personality_assessments;
  v_user2_assessment personality_assessments;
BEGIN
  -- Get assessments
  SELECT * INTO v_user1_assessment FROM personality_assessments WHERE user_id = p_user1_id;
  SELECT * INTO v_user2_assessment FROM personality_assessments WHERE user_id = p_user2_id;

  IF v_user1_assessment IS NULL OR v_user2_assessment IS NULL THEN
    RETURN 50; -- Default score if no assessment
  END IF;

  -- Calculate personality match (Big Five traits)
  v_personality_score := 100 - (
    ABS(COALESCE(v_user1_assessment.openness, 0.5) - COALESCE(v_user2_assessment.openness, 0.5)) * 20 +
    ABS(COALESCE(v_user1_assessment.conscientiousness, 0.5) - COALESCE(v_user2_assessment.conscientiousness, 0.5)) * 20 +
    ABS(COALESCE(v_user1_assessment.extraversion, 0.5) - COALESCE(v_user2_assessment.extraversion, 0.5)) * 20 +
    ABS(COALESCE(v_user1_assessment.agreeableness, 0.5) - COALESCE(v_user2_assessment.agreeableness, 0.5)) * 20 +
    ABS(COALESCE(v_user1_assessment.neuroticism, 0.5) - COALESCE(v_user2_assessment.neuroticism, 0.5)) * 20
  );

  -- Calculate style match
  IF v_user1_assessment.adventure_style = v_user2_assessment.adventure_style THEN
    v_style_score := v_style_score + 25;
  END IF;
  IF v_user1_assessment.budget_preference = v_user2_assessment.budget_preference THEN
    v_style_score := v_style_score + 25;
  END IF;
  IF v_user1_assessment.planning_style = v_user2_assessment.planning_style THEN
    v_style_score := v_style_score + 25;
  END IF;
  IF v_user1_assessment.group_preference = v_user2_assessment.group_preference THEN
    v_style_score := v_style_score + 25;
  END IF;

  -- Weighted average
  v_score := (v_personality_score * 0.6) + (v_style_score * 0.4);

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get adventure availability
CREATE OR REPLACE FUNCTION get_adventure_availability(
  p_adventure_id UUID,
  p_date_from DATE,
  p_date_to DATE
) RETURNS TABLE (
  availability_id UUID,
  date DATE,
  start_time TIME,
  end_time TIME,
  available_spots INTEGER,
  price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    aa.id,
    aa.date,
    aa.start_time,
    aa.end_time,
    aa.available_spots - aa.booked_spots,
    COALESCE(aa.price_override, a.price)
  FROM adventure_availability aa
  JOIN adventures a ON a.id = aa.adventure_id
  WHERE aa.adventure_id = p_adventure_id
    AND aa.date BETWEEN p_date_from AND p_date_to
    AND aa.is_available = true
    AND (aa.available_spots - aa.booked_spots) > 0
  ORDER BY aa.date, aa.start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to update engagement scores
CREATE OR REPLACE FUNCTION update_engagement_scores(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_posts_count INTEGER;
  v_comments_count INTEGER;
  v_reactions_count INTEGER;
  v_connections_count INTEGER;
  v_score DECIMAL(10, 2);
BEGIN
  -- Count activities
  SELECT COUNT(*) INTO v_posts_count FROM community_posts WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_comments_count FROM post_comments WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_reactions_count FROM post_reactions WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_connections_count FROM community_connections WHERE user_id = p_user_id AND status = 'accepted';

  -- Calculate weighted score
  v_score := (v_posts_count * 10) + (v_comments_count * 5) + (v_reactions_count * 2) + (v_connections_count * 20);

  -- Update or insert engagement score
  INSERT INTO engagement_scores (
    user_id, total_posts, total_comments, total_reactions, total_connections, engagement_score
  ) VALUES (
    p_user_id, v_posts_count, v_comments_count, v_reactions_count, v_connections_count, v_score
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_posts = v_posts_count,
    total_comments = v_comments_count,
    total_reactions = v_reactions_count,
    total_connections = v_connections_count,
    engagement_score = v_score,
    last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to process group payment
CREATE OR REPLACE FUNCTION process_group_payment(
  p_booking_id UUID,
  p_split_type TEXT DEFAULT 'equal' -- 'equal', 'custom'
) RETURNS VOID AS $$
DECLARE
  v_booking bookings;
  v_participant_count INTEGER;
  v_amount_per_person DECIMAL(10, 2);
BEGIN
  -- Get booking details
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Count participants
  SELECT COUNT(*) INTO v_participant_count FROM booking_participants WHERE booking_id = p_booking_id;

  IF p_split_type = 'equal' THEN
    v_amount_per_person := v_booking.total_amount / v_participant_count;

    -- Create payment splits for each participant
    INSERT INTO payment_splits (booking_id, user_id, amount_owed, payment_deadline)
    SELECT
      p_booking_id,
      bp.user_id,
      v_amount_per_person,
      NOW() + INTERVAL '7 days'
    FROM booking_participants bp
    WHERE bp.booking_id = p_booking_id
      AND bp.user_id IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to search adventures
CREATE OR REPLACE FUNCTION search_adventures(
  p_search_text TEXT DEFAULT NULL,
  p_category adventure_category DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_date DATE DEFAULT NULL
) RETURNS TABLE (
  adventure_id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL,
  rating DECIMAL,
  vendor_name TEXT,
  location_name TEXT,
  relevance_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.short_description,
    a.price,
    a.rating,
    v.business_name,
    a.location_name,
    CASE
      WHEN p_search_text IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', a.title || ' ' || COALESCE(a.description, '')),
          plainto_tsquery('english', p_search_text)
        )
      ELSE 1.0
    END AS relevance_score
  FROM adventures a
  JOIN vendors v ON v.id = a.vendor_id
  WHERE a.is_active = true
    AND v.status = 'active'
    AND (p_category IS NULL OR a.category = p_category)
    AND (p_min_price IS NULL OR a.price >= p_min_price)
    AND (p_max_price IS NULL OR a.price <= p_max_price)
    AND (p_location IS NULL OR a.location_name ILIKE '%' || p_location || '%')
    AND (p_date IS NULL OR EXISTS (
      SELECT 1 FROM adventure_availability aa
      WHERE aa.adventure_id = a.id
        AND aa.date = p_date
        AND aa.is_available = true
        AND aa.available_spots > aa.booked_spots
    ))
    AND (p_search_text IS NULL OR
      to_tsvector('english', a.title || ' ' || COALESCE(a.description, '')) @@
      plainto_tsquery('english', p_search_text)
    )
  ORDER BY relevance_score DESC, a.rating DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to get vendor analytics
CREATE OR REPLACE FUNCTION get_vendor_analytics(p_vendor_id UUID)
RETURNS TABLE (
  total_bookings INTEGER,
  total_revenue DECIMAL,
  average_rating DECIMAL,
  conversion_rate DECIMAL,
  popular_adventure UUID,
  peak_booking_hour INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(b.id)::INTEGER AS total_bookings,
    SUM(b.vendor_payout) AS total_revenue,
    AVG(r.rating) AS average_rating,
    (COUNT(DISTINCT b.user_id)::DECIMAL / NULLIF(COUNT(DISTINCT aa.id), 0)) * 100 AS conversion_rate,
    (SELECT adventure_id FROM bookings WHERE vendor_id = p_vendor_id GROUP BY adventure_id ORDER BY COUNT(*) DESC LIMIT 1) AS popular_adventure,
    EXTRACT(HOUR FROM (SELECT start_time FROM bookings WHERE vendor_id = p_vendor_id GROUP BY start_time ORDER BY COUNT(*) DESC LIMIT 1))::INTEGER AS peak_booking_hour
  FROM bookings b
  LEFT JOIN reviews r ON r.booking_id = b.id
  LEFT JOIN adventure_availability aa ON aa.adventure_id = b.adventure_id
  WHERE b.vendor_id = p_vendor_id
    AND b.status IN ('confirmed', 'completed');
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vendor rating on new review
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET rating = (
    SELECT AVG(r.rating)
    FROM reviews r
    WHERE r.vendor_id = NEW.vendor_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;

  UPDATE adventures
  SET rating = (
    SELECT AVG(r.rating)
    FROM reviews r
    WHERE r.adventure_id = NEW.adventure_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM reviews r
    WHERE r.adventure_id = NEW.adventure_id
  )
  WHERE id = NEW.adventure_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();

-- Trigger to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE groups
  SET current_members = (
    SELECT COUNT(*)
    FROM group_members
    WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
      AND is_active = true
  )
  WHERE id = COALESCE(NEW.group_id, OLD.group_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_member_count
AFTER INSERT OR UPDATE OR DELETE ON group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_member_count();

-- Trigger to update connection strength
CREATE OR REPLACE FUNCTION update_connection_strength()
RETURNS TRIGGER AS $$
BEGIN
  -- Update interaction count and last interaction
  UPDATE community_connections
  SET
    interaction_count = interaction_count + 1,
    last_interaction = NOW(),
    connection_strength = LEAST(1.0, connection_strength + 0.05)
  WHERE
    (user_id = NEW.user_id AND connected_user_id IN (
      SELECT user_id FROM post_comments WHERE post_id = NEW.post_id
    ))
    OR
    (connected_user_id = NEW.user_id AND user_id IN (
      SELECT user_id FROM post_comments WHERE post_id = NEW.post_id
    ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_connection_strength
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_connection_strength();

-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE bid_messages;

-- Create composite indexes for performance
CREATE INDEX idx_bookings_composite ON bookings(vendor_id, status, created_at DESC);
CREATE INDEX idx_adventures_search ON adventures USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_community_posts_search ON community_posts USING gin(to_tsvector('english', content));
CREATE INDEX idx_adventure_availability_composite ON adventure_availability(adventure_id, date, is_available) WHERE available_spots > booked_spots;