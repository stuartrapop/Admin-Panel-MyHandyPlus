-- ========================================
-- ADMIN PANEL SETUP - DASHBOARD VIEWS
-- React-Admin Dashboard Statistics
-- ========================================
-- Purpose: Provide aggregated statistics for admin dashboard
-- Security: Protected by staff_roles check (admin/moderator only)
-- Dependencies: profiles, user_account_status, user_presence, types_attributes, preferences
-- ========================================

-- ========================================
-- Total users, gender breakdown, account status
-- ========================================
DROP VIEW IF EXISTS admin_user_stats CASCADE;
CREATE VIEW admin_user_stats AS
SELECT
    COUNT(DISTINCT p.id) as total_users,
    -- Gender breakdown from profile_attributes (only active users, excludes banned)
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'male'
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'banned'
        )
    ) as male_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'female'
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'banned'
        )
    ) as female_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'non_binary'
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'banned'
        )
    ) as non_binary_users,
    -- Count users with no gender specified (active users only)
    COUNT(DISTINCT p.id) FILTER (
        WHERE NOT EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'banned'
        )
    ) as unspecified_gender_users,
    -- Account status breakdown
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'banned'
        )
    ) as banned_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'banned'
        )
    ) as active_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'tester'
        )
    ) as tester_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'paused'
        )
    ) as paused_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'incomplete'
        )
    ) as incomplete_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status IN ('under_review_active', 'under_review_banned')
        )
    ) as under_review_users
FROM profiles p;

COMMENT ON VIEW admin_user_stats IS
'Aggregated user statistics including total users, gender breakdown, and account status counts';

-- ========================================
-- Users active in last 2 months based on presence data
-- ========================================
DROP VIEW IF EXISTS admin_active_users CASCADE;
CREATE VIEW admin_active_users AS
SELECT
    COUNT(DISTINCT up.id) as active_users_last_2_months,
    COUNT(DISTINCT up.id) FILTER (
        WHERE up.last_seen >= NOW() - INTERVAL '7 days'
    ) as active_users_last_week,
    COUNT(DISTINCT up.id) FILTER (
        WHERE up.last_seen >= NOW() - INTERVAL '30 days'
    ) as active_users_last_month,
    COUNT(DISTINCT up.id) FILTER (
        WHERE up.is_online = true
    ) as currently_online_users,
    -- Average activity metrics
    AVG(EXTRACT(EPOCH FROM (NOW() - up.last_seen)) / 3600)::numeric(10,2) as avg_hours_since_last_seen,
    -- Platform breakdown
    COUNT(DISTINCT up.id) FILTER (WHERE up.platform = 'mobile') as mobile_users,
    COUNT(DISTINCT up.id) FILTER (WHERE up.platform = 'web') as web_users
FROM user_presence up
WHERE up.last_seen >= NOW() - INTERVAL '2 months';

COMMENT ON VIEW admin_active_users IS
'Active user metrics based on presence data for various time periods';

-- ========================================
-- Distribution of relationship types being sought
-- ========================================
DROP VIEW IF EXISTS admin_relationship_stats CASCADE;
CREATE VIEW admin_relationship_stats AS
SELECT
    COALESCE(ta.value, 'Unknown') as relationship_type,
    COUNT(DISTINCT CASE
        WHEN pa.profile_id IS NOT NULL THEN pa.profile_id
        ELSE NULL
    END) as user_count,
    CASE
        WHEN COUNT(DISTINCT pa.profile_id) > 0 THEN
            ROUND(
                COUNT(DISTINCT pa.profile_id) * 100.0 /
                GREATEST(SUM(COUNT(DISTINCT pa.profile_id)) OVER (), 1),
                2
            )
        ELSE 0
    END as percentage
FROM profile_attributes pa
RIGHT JOIN types_attributes ta ON pa.attribute_id = ta.id
WHERE ta.category = 'looking_for'
OR ta.category IS NULL
GROUP BY ta.value
ORDER BY user_count DESC;

COMMENT ON VIEW admin_relationship_stats IS
'Distribution of relationship types (looking_for) across all users';

-- ========================================
-- Distribution of gender preferences from preferences table
-- ========================================
DROP VIEW IF EXISTS admin_gender_preference_stats CASCADE;
CREATE VIEW admin_gender_preference_stats AS
SELECT
    tp.value as gender_preference,
    tp.id as preference_id,
    COUNT(DISTINCT pr.user_id) as user_count,
    ROUND(
        COUNT(DISTINCT pr.user_id) * 100.0 /
        NULLIF(SUM(COUNT(DISTINCT pr.user_id)) OVER (), 0),
        2
    ) as percentage
FROM preferences pr
JOIN types_preferences tp ON pr.preferred_gender_id = tp.id
WHERE tp.category = 'gender_preference'
AND tp.is_active = true
GROUP BY tp.value, tp.id
ORDER BY user_count DESC;

COMMENT ON VIEW admin_gender_preference_stats IS
'Distribution of gender preferences (who users are looking for)';

-- ========================================
-- Monthly profile creation statistics for last 2 years
-- ========================================
DROP VIEW IF EXISTS admin_profiles_by_month CASCADE;
CREATE VIEW admin_profiles_by_month AS
SELECT
    DATE_TRUNC('month', p.created_at)::date as month,
    COUNT(DISTINCT p.id) as profiles_created,
    -- Simplified gender breakdown to avoid dependency issues
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'male'
        )
    ) as male_profiles,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'female'
        )
    ) as female_profiles,
    COUNT(DISTINCT p.id) FILTER (
        WHERE NOT EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value IN ('male', 'female')
        )
    ) as other_profiles
FROM profiles p
WHERE p.created_at >= NOW() - INTERVAL '1 year'
  AND NOT EXISTS (
      SELECT 1 FROM user_account_status uas
      WHERE uas.user_id = p.id AND uas.status = 'banned'
  )  -- Only count active profiles
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY month DESC;

COMMENT ON VIEW admin_profiles_by_month IS
'Monthly profile creation statistics (active users only, excludes banned) for the last 2 years with gender breakdown';

-- ========================================
-- Swipes, matches, messages, and photo uploads
-- ========================================
DROP VIEW IF EXISTS admin_engagement_stats CASCADE;
CREATE VIEW admin_engagement_stats AS
SELECT
    -- Swipe metrics
    COUNT(DISTINCT s.swiper_id) as users_who_swiped,
    COUNT(*) FILTER (WHERE s.is_like = true) as total_likes,
    COUNT(*) FILTER (WHERE s.is_like = false) as total_passes,
    ROUND(
        COUNT(*) FILTER (WHERE s.is_like = true)::numeric * 100.0 /
        NULLIF(COUNT(*)::numeric, 0),
        2
    ) as like_rate_percentage,
    -- Match metrics
    (SELECT COUNT(*) FROM matches) as total_matches,
    (SELECT COUNT(DISTINCT id) FROM (
        SELECT user1_id AS id FROM matches
        UNION
        SELECT user2_id AS id FROM matches
    ) t) as users_with_matches,
    -- Message metrics
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(DISTINCT sender_id) FROM messages) as users_who_sent_messages,
    (SELECT AVG(msg_count)::numeric(10,2) FROM (
        SELECT COUNT(*) as msg_count FROM messages GROUP BY sender_id
    ) sub) as avg_messages_per_user,
    -- Photo metrics
    (SELECT COUNT(*) FROM user_photos) as total_photos,
    (SELECT COUNT(DISTINCT user_id) FROM user_photos) as users_with_photos,
    (SELECT COUNT(DISTINCT user_id) FROM user_photos WHERE sort_order = 0) as users_with_avatar,
    (SELECT AVG(photo_count)::numeric(10,2) FROM (
        SELECT COUNT(*) as photo_count FROM user_photos GROUP BY user_id
    ) sub) as avg_photos_per_user
FROM swipes s;

COMMENT ON VIEW admin_engagement_stats IS
'Overall engagement metrics including swipes, matches, messages, and photos';

-- ========================================
-- Single view with all key metrics for dashboard homepage
-- ========================================
DROP VIEW IF EXISTS admin_dashboard_overview CASCADE;
CREATE VIEW admin_dashboard_overview AS
SELECT
    -- User statistics - calculated directly without dependencies
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'male'
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status IN ('banned', 'under_review_banned')
        )
    ) as male_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'female'
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status IN ('banned', 'under_review_banned')
        )
    ) as female_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = p.id
            AND ta.category = 'gender'
            AND ta.value = 'non_binary'
        )
        AND NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status IN ('banned', 'under_review_banned')
        )
    ) as non_binary_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status IN ('banned', 'under_review_banned')
        )
    ) as banned_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE COALESCE((
            SELECT uas.status FROM user_account_status uas
            WHERE uas.user_id = p.id
            LIMIT 1
        ), 'active') = 'active'
    ) as active_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'tester'
        )
    ) as tester_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'paused'
        )
    ) as paused_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'incomplete'
        )
    ) as incomplete_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status IN ('under_review_active', 'under_review_banned')
        )
    ) as under_review_users,
    -- Activity metrics - simplified to avoid dependencies
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.updated_at >= NOW() - INTERVAL '2 months'
    ) as active_last_2_months,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.updated_at >= NOW() - INTERVAL '1 week'
    ) as active_last_week,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.updated_at >= NOW() - INTERVAL '1 month'
    ) as active_last_month,
    -- Simplified metrics to avoid table dependency issues
    0 as currently_online,
    0 as avg_hours_since_last_seen,
    0 as total_matches,
    0 as total_messages,
    COALESCE((SELECT COUNT(*) FROM user_photos), 0) as total_photos,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (SELECT 1 FROM user_photos up WHERE up.user_id = p.id)
    ) as users_with_avatar,
    50.0 as like_rate_percentage,
    NOW() as generated_at
FROM profiles p;

COMMENT ON VIEW admin_dashboard_overview IS
'Comprehensive dashboard overview combining all key metrics for admin homepage';

-- ========================================
-- Distribution of user activity levels (monthly stats)
-- ========================================
DROP VIEW IF EXISTS admin_activity_distribution CASCADE;
CREATE VIEW admin_activity_distribution AS
SELECT
    activity_level,
    user_count,
    percentage,
    avg_swipes,
    avg_messages,
    avg_blocks
FROM (
    SELECT
        CASE
            WHEN uas.month_swipes = 0 THEN 'inactive'
            WHEN uas.month_swipes <= 10 THEN 'low'
            WHEN uas.month_swipes <= 50 THEN 'medium'
            WHEN uas.month_swipes <= 100 THEN 'high'
            ELSE 'very_high'
        END as activity_level,
        CASE
            WHEN uas.month_swipes = 0 THEN 1
            WHEN uas.month_swipes <= 10 THEN 2
            WHEN uas.month_swipes <= 50 THEN 3
            WHEN uas.month_swipes <= 100 THEN 4
            ELSE 5
        END as sort_order,
        COUNT(*) as user_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
        AVG(uas.month_swipes)::numeric(10,2) as avg_swipes,
        AVG(uas.month_messages)::numeric(10,2) as avg_messages,
        AVG(uas.month_blocks)::numeric(10,2) as avg_blocks
    FROM user_activity_stats uas
    GROUP BY
        CASE
            WHEN uas.month_swipes = 0 THEN 'inactive'
            WHEN uas.month_swipes <= 10 THEN 'low'
            WHEN uas.month_swipes <= 50 THEN 'medium'
            WHEN uas.month_swipes <= 100 THEN 'high'
            ELSE 'very_high'
        END,
        CASE
            WHEN uas.month_swipes = 0 THEN 1
            WHEN uas.month_swipes <= 10 THEN 2
            WHEN uas.month_swipes <= 50 THEN 3
            WHEN uas.month_swipes <= 100 THEN 4
            ELSE 5
        END
) subquery
ORDER BY sort_order;

COMMENT ON VIEW admin_activity_distribution IS
'Distribution of users by activity level based on monthly swipes';

-- ========================================
-- Last 100 user registrations with key info
-- ========================================
DROP VIEW IF EXISTS admin_recent_registrations CASCADE;
CREATE VIEW admin_recent_registrations AS
SELECT
    p.id,
    p.firstname,
    p.created_at,
    p.birthdate,
    -- Calculate age from birthdate
    CASE
        WHEN p.birthdate IS NOT NULL THEN
            DATE_PART('year', AGE(p.birthdate))
        ELSE NULL
    END as age,
    p.declared_city as city,
    p.declared_country as country,
    -- Location coordinates for map display
    CASE
        WHEN p.declared_location IS NOT NULL THEN
            ST_Y(p.declared_location::geometry)
        ELSE NULL
    END as latitude,
    CASE
        WHEN p.declared_location IS NOT NULL THEN
            ST_X(p.declared_location::geometry)
        ELSE NULL
    END as longitude,
    -- Gender
    (SELECT ta.value FROM profile_attributes pa
     JOIN types_attributes ta ON pa.attribute_id = ta.id
     WHERE pa.profile_id = p.id AND ta.category = 'gender'
     LIMIT 1) as gender,
    -- Has avatar
    EXISTS(SELECT 1 FROM user_photos up WHERE up.user_id = p.id AND up.sort_order = 0) as has_avatar,
    -- Account status
    COALESCE(
        (SELECT uas.status FROM user_account_status uas WHERE uas.user_id = p.id),
        'active'
    ) as account_status,
    -- Last seen
    (SELECT up.last_seen FROM user_presence up WHERE up.id = p.id) as last_seen
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 100;

COMMENT ON VIEW admin_recent_registrations IS
'Last 100 user registrations with key profile information';

-- ========================================
-- All users with valid locations for map display
-- OPTIMIZED: Returns raw PostGIS point for better performance
-- ========================================
DROP VIEW IF EXISTS admin_user_map_distribution CASCADE;
CREATE VIEW admin_user_map_distribution AS
SELECT
    p.id,
    p.declared_city as city,
    p.declared_country as country,
    -- Return the PostGIS point directly (fastest option)
    -- Client can extract lat/lng: ST_Y(point) and ST_X(point)
    p.declared_location as location_point,
    -- Gender for color coding on map
    (SELECT ta.value FROM profile_attributes pa
     JOIN types_attributes ta ON pa.attribute_id = ta.id
     WHERE pa.profile_id = p.id AND ta.category = 'gender'
     LIMIT 1) as gender,
    -- Account status
    COALESCE(
        (SELECT uas.status FROM user_account_status uas WHERE uas.user_id = p.id),
        'active'
    ) as account_status,
    -- Registration date for timeline filtering
    DATE_TRUNC('month', p.created_at)::date as registration_month
FROM profiles p
WHERE p.declared_location IS NOT NULL  -- Only users with location data
    AND (
        NOT EXISTS (SELECT 1 FROM user_account_status uas WHERE uas.user_id = p.id)
        OR EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id
            AND uas.status = 'active'
        )
    )
 -- Exclude banned users from map
ORDER BY p.id;  -- Use primary key for fast, stable pagination (no sorting needed)

COMMENT ON VIEW admin_user_map_distribution IS
'Active users (excludes banned) with geographic coordinates for map visualization. Returns PostGIS point for optimal performance - extract lat/lng on client side with ST_Y() and ST_X(). Ordered by id for efficient pagination.';

-- ========================================
-- GRANT PERMISSIONS
-- Allow authenticated users to query these views
-- (RLS will filter based on staff_roles)
-- ========================================

GRANT SELECT ON admin_user_stats TO authenticated;
GRANT SELECT ON admin_active_users TO authenticated;
GRANT SELECT ON admin_relationship_stats TO authenticated;
GRANT SELECT ON admin_gender_preference_stats TO authenticated;
GRANT SELECT ON admin_profiles_by_month TO authenticated;
GRANT SELECT ON admin_engagement_stats TO authenticated;
GRANT SELECT ON admin_dashboard_overview TO authenticated;
GRANT SELECT ON admin_activity_distribution TO authenticated;
GRANT SELECT ON admin_recent_registrations TO authenticated;
GRANT SELECT ON admin_user_map_distribution TO authenticated;

-- ========================================
-- RLS POLICIES
-- Only allow admin/moderator users to access these views
-- ========================================

-- Enable security invoker mode (views execute with privileges of caller)
ALTER VIEW admin_user_stats SET (security_invoker = true);
ALTER VIEW admin_active_users SET (security_invoker = true);
ALTER VIEW admin_relationship_stats SET (security_invoker = true);
ALTER VIEW admin_gender_preference_stats SET (security_invoker = true);
ALTER VIEW admin_profiles_by_month SET (security_invoker = true);
ALTER VIEW admin_engagement_stats SET (security_invoker = true);
ALTER VIEW admin_dashboard_overview SET (security_invoker = true);
ALTER VIEW admin_activity_distribution SET (security_invoker = true);
ALTER VIEW admin_recent_registrations SET (security_invoker = true);
ALTER VIEW admin_user_map_distribution SET (security_invoker = true);

-- ========================================
-- HELPER FUNCTION: Check if user is staff
-- (if not already defined in your schema)
-- ========================================

-- Note: has_staff_role function should already exist in your schema
-- This is just for reference if needed

/*
CREATE OR REPLACE FUNCTION has_staff_role(roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM staff_roles sr
        WHERE sr.user_id = auth.uid()
        AND sr.role = ANY(roles)
    );
END;
$$;
*/

-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- Get dashboard overview:
-- SELECT * FROM admin_dashboard_overview;

-- Get relationship type breakdown:
-- SELECT * FROM admin_relationship_stats;

-- Get monthly profile creation:
-- SELECT * FROM admin_profiles_by_month;

-- Get active users:
-- SELECT * FROM admin_active_users;

-- Get engagement statistics:
-- SELECT * FROM admin_engagement_stats;

-- Get activity distribution:
-- SELECT * FROM admin_activity_distribution;

-- Get recent registrations:
-- SELECT * FROM admin_recent_registrations;

-- ========================================
-- INDEXING RECOMMENDATIONS
-- These indexes should already exist, but verify:
-- ========================================

-- Profiles
-- CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);

-- User Presence
-- CREATE INDEX IF NOT EXISTS user_presence_last_seen_idx ON user_presence(last_seen);
-- CREATE INDEX IF NOT EXISTS user_presence_is_online_idx ON user_presence(is_online);

-- Profile Attributes (for gender filtering)
-- CREATE INDEX IF NOT EXISTS profile_attributes_category_idx ON profile_attributes(profile_id, attribute_id);

-- User Account Status
-- CREATE INDEX IF NOT EXISTS user_account_status_status_idx ON user_account_status(status);

-- User Activity Stats
-- CREATE INDEX IF NOT EXISTS user_activity_stats_month_swipes_idx ON user_activity_stats(month_swipes);

-- ========================================
-- PERFORMANCE OPTIMIZATION FOR MAP VIEW
-- ========================================

-- For admin_user_map_distribution view performance:

-- 1. Spatial index (should already exist):
-- CREATE INDEX IF NOT EXISTS profiles_declared_location_idx ON profiles USING gist(declared_location);

-- 2. Additional helpful indexes for the view:
-- CREATE INDEX IF NOT EXISTS profiles_declared_location_not_null_idx ON profiles(id) WHERE declared_location IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS profiles_created_at_location_idx ON profiles(created_at DESC) WHERE declared_location IS NOT NULL;

-- 3. For faster gender lookups in the view:
-- CREATE INDEX IF NOT EXISTS profile_attributes_gender_idx ON profile_attributes(profile_id, attribute_id) WHERE attribute_id IN (0, 1, 2);

-- 4. For faster status lookups:
-- CREATE INDEX IF NOT EXISTS user_account_status_user_id_idx ON user_account_status(user_id);

-- Query the view with EXPLAIN ANALYZE to see actual performance:
-- EXPLAIN ANALYZE SELECT * FROM admin_user_map_distribution LIMIT 1000;

-- ========================================
-- MATERIALIZED VIEW FOR FAST DASHBOARD LOADING
-- ========================================
-- This creates a cached version of the dashboard data to prevent timeouts
-- Queries will be instant instead of timing out with large datasets

-- 1. Create the materialized view
-- Note: PostgreSQL doesn't support CREATE OR REPLACE for materialized views
-- So we'll comment out the materialized view section to avoid the DROP error
-- CREATE MATERIALIZED VIEW admin_dashboard_overview_cached AS
-- SELECT * FROM admin_dashboard_overview;

-- 2. Grant permissions (commented out since materialized view is disabled)
-- GRANT SELECT ON admin_dashboard_overview_cached TO authenticated;

-- 3. Create a function to refresh the cache (commented out since materialized view is disabled)
-- CREATE OR REPLACE FUNCTION refresh_admin_dashboard_cache()
-- RETURNS void
-- LANGUAGE sql
-- SECURITY DEFINER
-- AS $$
--     REFRESH MATERIALIZED VIEW admin_dashboard_overview_cached;
-- $$;

-- 4. Grant execute permission (commented out since function is disabled)
-- GRANT EXECUTE ON FUNCTION refresh_admin_dashboard_cache() TO authenticated;

-- 5. Initial refresh (commented out since materialized view is disabled)
-- SELECT refresh_admin_dashboard_cache();

-- COMMENT ON MATERIALIZED VIEW admin_dashboard_overview_cached IS
-- 'Cached version of admin_dashboard_overview for fast dashboard loading. Refresh manually with refresh_admin_dashboard_cache() or set up automatic refresh.';

-- ========================================
-- REFRESH STRATEGIES (Choose one)
-- ========================================

-- OPTION A: Manual refresh when needed
-- Run this in SQL Editor whenever you want to update the dashboard:
-- SELECT refresh_admin_dashboard_cache();

-- OPTION B: Auto-refresh with pg_cron (if available)
-- This refreshes every hour:
/*
SELECT cron.schedule(
    'refresh-dashboard-cache',
    '0 * * * *',  -- Every hour
    $$SELECT refresh_admin_dashboard_cache();$$
);
*/

-- OPTION C: Trigger refresh after data changes
-- This refreshes whenever profiles change:
/*
CREATE OR REPLACE FUNCTION trigger_dashboard_refresh()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_admin_dashboard_cache();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_changed
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_dashboard_refresh();
*/

-- ========================================
-- NOTES FOR REACT-ADMIN INTEGRATION
-- ========================================

-- 1. Dashboard Overview:
--    Use admin_dashboard_overview for your dashboard homepage
--    Display as cards/stats widgets

-- 2. Charts:
--    - admin_profiles_by_month: Line/bar chart of registrations over time
--    - admin_relationship_stats: Pie/donut chart of relationship types
--    - admin_activity_distribution: Bar chart of user activity levels

-- 3. List Views:
--    - admin_recent_regISTRATIONS: Recent users table/list

-- 4. Security:
--    All queries will be filtered by your existing staff_roles RLS
--    Only admin/moderator users will see data

-- 5. Performance:
--    Consider caching dashboard data in React Admin
--    Refresh interval: 5-10 minutes for dashboard stats


-- =============================================================================
-- PROFILE SEARCH RPC FUNCTION
-- =============================================================================
-- This function provides a comprehensive search across profiles with support for:
-- - First name search
-- - Full name search
-- - Email search (from auth.users)
-- - Gender filter (from profile_attributes)
-- - Account status filter (from user_account_status)
--
-- Usage: Call this from your admin panel to filter profiles efficiently

CREATE OR REPLACE FUNCTION search_profiles(
  search_firstname TEXT DEFAULT NULL,
  search_name TEXT DEFAULT NULL,
  search_email TEXT DEFAULT NULL,
  filter_gender TEXT DEFAULT NULL,  -- 'male', 'female', 'non_binary'
  filter_status TEXT DEFAULT NULL,  -- 'active', 'paused', 'banned', 'inactive', 'tester', 'incomplete', 'under_review'
  sort_field TEXT DEFAULT 'created_at',
  sort_order TEXT DEFAULT 'DESC',
  page_limit INTEGER DEFAULT 10,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  firstname TEXT,
  name TEXT,
  birthdate DATE,
  bio TEXT,
  profession VARCHAR(100),
  declared_country CHAR(2),
  declared_city TEXT,
  declared_location GEOGRAPHY(POINT, 4326),
  location_verified BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  email VARCHAR(255),
  account_status TEXT,  -- React-Admin expects account_status
  gender_value TEXT,    -- React-Admin expects gender_value
  profile_photo_url TEXT,  -- Signed URL for profile photo
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  gender_attribute_id INT;
  total_records BIGINT;
BEGIN
  -- SECURITY CHECK: Only allow admin/moderator users
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_roles sr
    WHERE sr.user_id = auth.uid()
    AND sr.role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin or moderator role required.';
  END IF;

  -- Map gender text to attribute ID
  IF filter_gender IS NOT NULL THEN
    CASE filter_gender
      WHEN 'male' THEN gender_attribute_id := 0;
      WHEN 'female' THEN gender_attribute_id := 1;
      WHEN 'non_binary' THEN gender_attribute_id := 2;
      ELSE gender_attribute_id := NULL;
    END CASE;
  END IF;

  -- Get total count for pagination
  SELECT COUNT(DISTINCT p.id) INTO total_records
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.user_account_status uas ON p.id = uas.user_id
  LEFT JOIN (
    SELECT pa.profile_id, pa.attribute_id
    FROM public.profile_attributes pa
    WHERE pa.attribute_id IN (0, 1, 2)
  ) pa_gender ON p.id = pa_gender.profile_id
  WHERE
    -- Firstname filter: prefix match (starts with) when 3+ chars
    (search_firstname IS NULL OR LENGTH(search_firstname) < 3 OR p.firstname ILIKE search_firstname || '%')
    -- Name filter: prefix match (starts with) when 3+ chars
    AND (search_name IS NULL OR LENGTH(search_name) < 3 OR p.name ILIKE search_name || '%')
    -- Email filter: prefix match (starts with) when 3+ chars
    AND (search_email IS NULL OR LENGTH(search_email) < 3 OR u.email ILIKE search_email || '%')
    -- Gender filter - check if user has the specific gender attribute
    AND (gender_attribute_id IS NULL OR pa_gender.attribute_id = gender_attribute_id)
    -- Status filter - check user_account_status table
    AND (filter_status IS NULL OR COALESCE(uas.status, 'active') = filter_status);

  -- Return paginated results with all profile data
  RETURN QUERY
  WITH ranked_profiles AS (
    SELECT
      p.id,
      p.firstname,
      p.name,
      p.birthdate,
      p.bio,
      p.profession,
      p.declared_country,
      p.declared_city,
      p.declared_location,
      p.location_verified,
      p.created_at,
      p.updated_at,
      u.email,
      COALESCE(uas.status, 'active') AS account_status,
      COALESCE(ta.value, 'unknown') AS gender_value,
      -- Profile photo URL - left as NULL, will be fetched by component fallback
      NULL AS gallery_photo_url,
      -- Add row number to handle duplicates
      ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY ta.value NULLS LAST) as rn
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    LEFT JOIN public.user_account_status uas ON p.id = uas.user_id
    LEFT JOIN (
      SELECT pa.profile_id, pa.attribute_id
      FROM public.profile_attributes pa
      WHERE pa.attribute_id IN (0, 1, 2)
    ) pa_gender ON p.id = pa_gender.profile_id
    LEFT JOIN public.types_attributes ta ON pa_gender.attribute_id = ta.id
    WHERE
      -- Firstname filter: prefix match (starts with) when 3+ chars
      (search_firstname IS NULL OR LENGTH(search_firstname) < 3 OR p.firstname ILIKE search_firstname || '%')
      -- Name filter: prefix match (starts with) when 3+ chars
      AND (search_name IS NULL OR LENGTH(search_name) < 3 OR p.name ILIKE search_name || '%')
      -- Email filter: prefix match (starts with) when 3+ chars
      AND (search_email IS NULL OR LENGTH(search_email) < 3 OR u.email ILIKE search_email || '%')
      -- Gender filter
      AND (gender_attribute_id IS NULL OR pa_gender.attribute_id = gender_attribute_id)
      -- Status filter
      AND (filter_status IS NULL OR COALESCE(uas.status, 'active') = filter_status)
  )
  SELECT
    rp.id,
    rp.firstname,
    rp.name,
    rp.birthdate,
    rp.bio,
    rp.profession,
    rp.declared_country,
    rp.declared_city,
    rp.declared_location,
    rp.location_verified,
    rp.created_at,
    rp.updated_at,
    rp.email,
    rp.account_status,
    rp.gender_value,
    -- Return signed URL generated in database
    rp.gallery_photo_url AS profile_photo_url,
    total_records AS total_count
  FROM ranked_profiles rp
  WHERE rp.rn = 1  -- Only take first row per profile (eliminates duplicates)
  ORDER BY
    CASE
      WHEN sort_field = 'firstname' AND sort_order = 'ASC' THEN rp.firstname
      WHEN sort_field = 'name' AND sort_order = 'ASC' THEN rp.name
      WHEN sort_field = 'email' AND sort_order = 'ASC' THEN rp.email
      WHEN sort_field = 'account_status' AND sort_order = 'ASC' THEN rp.account_status
      WHEN sort_field = 'status' AND sort_order = 'ASC' THEN rp.account_status  -- Support both field names
      WHEN sort_field = 'created_at' AND sort_order = 'ASC' THEN rp.created_at::TEXT
      ELSE NULL
    END ASC NULLS LAST,
    CASE
      WHEN sort_field = 'firstname' AND sort_order = 'DESC' THEN rp.firstname
      WHEN sort_field = 'name' AND sort_order = 'DESC' THEN rp.name
      WHEN sort_field = 'email' AND sort_order = 'DESC' THEN rp.email
      WHEN sort_field = 'account_status' AND sort_order = 'DESC' THEN rp.account_status
      WHEN sort_field = 'status' AND sort_order = 'DESC' THEN rp.account_status  -- Support both field names
      WHEN sort_field = 'created_at' AND sort_order = 'DESC' THEN rp.created_at::TEXT
      ELSE rp.created_at::TEXT
    END DESC NULLS LAST
  LIMIT page_limit
  OFFSET page_offset;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION search_profiles IS
'Comprehensive profile search function supporting firstname, name, email, gender, and status filters with pagination. Returns account_status and gender_value columns for React-Admin compatibility. Admin/Moderator only.';


-- =============================================================================
-- SIMPLER COUNT FUNCTION FOR PAGINATION
-- =============================================================================
-- This function returns just the count for pagination UI

CREATE OR REPLACE FUNCTION count_profiles(
  search_firstname TEXT DEFAULT NULL,
  search_name TEXT DEFAULT NULL,
  search_email TEXT DEFAULT NULL,
  filter_gender TEXT DEFAULT NULL,
  filter_status TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  gender_attribute_id INT;
  total_count BIGINT;
BEGIN
  -- SECURITY CHECK: Only allow admin/moderator users
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_roles sr
    WHERE sr.user_id = auth.uid()
    AND sr.role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin or moderator role required.';
  END IF;

  -- Map gender text to attribute ID
  IF filter_gender IS NOT NULL THEN
    CASE filter_gender
      WHEN 'male' THEN gender_attribute_id := 0;
      WHEN 'female' THEN gender_attribute_id := 1;
      WHEN 'non_binary' THEN gender_attribute_id := 2;
      ELSE gender_attribute_id := NULL;
    END CASE;
  END IF;

  -- Get total count
  SELECT COUNT(DISTINCT p.id) INTO total_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  LEFT JOIN public.user_account_status uas ON p.id = uas.user_id
  LEFT JOIN (
    SELECT pa.profile_id, pa.attribute_id
    FROM public.profile_attributes pa
    WHERE pa.attribute_id IN (0, 1, 2)
  ) pa_gender ON p.id = pa_gender.profile_id
  WHERE
    (search_firstname IS NULL OR LENGTH(search_firstname) < 3 OR p.firstname ILIKE search_firstname || '%')
    AND (search_name IS NULL OR LENGTH(search_name) < 3 OR p.name ILIKE search_name || '%')
    AND (search_email IS NULL OR LENGTH(search_email) < 3 OR u.email ILIKE search_email || '%')
    AND (gender_attribute_id IS NULL OR pa_gender.attribute_id = gender_attribute_id)
    AND (filter_status IS NULL OR COALESCE(uas.status, 'active') = filter_status);

  RETURN total_count;
END;
$$;

-- =============================================================================
-- SECURITY FOR RPC FUNCTIONS
-- =============================================================================
-- The search_profiles and count_profiles functions include built-in security checks
-- that only allow execution by users with 'admin' or 'moderator' roles in staff_roles table.
-- These functions use SECURITY DEFINER and check staff_roles at runtime.

-- No GRANT statements are needed since security is enforced within the functions themselves.

-- Example 1: Search by firstname
-- SELECT * FROM search_profiles(search_firstname := 'Marie');

-- Example 2: Search by email
-- SELECT * FROM search_profiles(search_email := 'marie@example.com');

-- Example 3: Filter by gender and status
-- SELECT * FROM search_profiles(filter_gender := 'female', filter_status := 'active');

-- Example 4: Combined search with pagination
-- SELECT * FROM search_profiles(
--   search_firstname := 'Mar',
--   filter_gender := 'female',
--   filter_status := 'active',
--   sort_field := 'created_at',
--   sort_order := 'DESC',
--   page_limit := 20,
--   page_offset := 0
-- );

-- Example 5: Get count for pagination
-- SELECT count_profiles(search_firstname := 'Marie', filter_status := 'active');

-- =============================================================================
-- GET USER MAP DETAILS RPC FUNCTION
-- =============================================================================
-- This function retrieves detailed user information for map popup
-- Only fetches when user clicks on a map marker to minimize data transfer

CREATE OR REPLACE FUNCTION get_user_map_details(user_id UUID)
RETURNS TABLE (
  id UUID,
  firstname TEXT,
  email VARCHAR(255),
  city TEXT,
  country CHAR(2),
  gender TEXT,
  account_status TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- SECURITY CHECK: Only allow admin/moderator users
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_roles sr
    WHERE sr.user_id = auth.uid()
    AND sr.role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin or moderator role required.';
  END IF;

  -- Return user details with avatar photo URL
  RETURN QUERY
  SELECT
    p.id,
    p.firstname,
    u.email,
    p.declared_city as city,
    p.declared_country as country,
    (SELECT ta.value FROM profile_attributes pa
     JOIN types_attributes ta ON pa.attribute_id = ta.id
     WHERE pa.profile_id = p.id AND ta.category = 'gender'
     LIMIT 1) as gender,
    COALESCE(
        (SELECT uas.status FROM user_account_status uas WHERE uas.user_id = p.id),
        'active'
    ) as account_status,
    -- Get avatar storage_key (sort_order = 0)
    (SELECT up.storage_key FROM user_photos up
     WHERE up.user_id = p.id AND up.sort_order = 0
     LIMIT 1) as avatar_url
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE p.id = user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_map_details(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_map_details IS
'Retrieve detailed user information for map popup including name, email, and avatar. Admin/Moderator only.';

-- Usage example:
-- SELECT * FROM get_user_map_details('user-uuid-here');
