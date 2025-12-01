-- ========================================
-- ESSENTIAL DASHBOARD VIEWS
-- Run this in Supabase SQL Editor to create required views
-- ========================================

-- 1. Relationship Stats View
CREATE OR REPLACE VIEW admin_relationship_stats AS
SELECT
    ta.value as relationship_type,
    COUNT(*) as user_count,
    ROUND(
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM preferences WHERE relationship_type_id IS NOT NULL)),
        2
    ) as percentage
FROM preferences p
JOIN types_attributes ta ON p.relationship_type_id = ta.id
WHERE ta.category = 'relationship_type'
GROUP BY ta.value
ORDER BY user_count DESC;

GRANT SELECT ON admin_relationship_stats TO authenticated;

-- 2. Profiles by Month View
CREATE OR REPLACE VIEW admin_profiles_by_month AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as profiles_created,
    COUNT(*) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = profiles.id
            AND ta.category = 'gender'
            AND ta.value = 'male'
        )
    ) as male_profiles,
    COUNT(*) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = profiles.id
            AND ta.category = 'gender'
            AND ta.value = 'female'
        )
    ) as female_profiles,
    COUNT(*) FILTER (
        WHERE NOT EXISTS (
            SELECT 1 FROM profile_attributes pa
            JOIN types_attributes ta ON pa.attribute_id = ta.id
            WHERE pa.profile_id = profiles.id
            AND ta.category = 'gender'
            AND ta.value IN ('male', 'female')
        )
    ) as other_profiles
FROM profiles
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

GRANT SELECT ON admin_profiles_by_month TO authenticated;

-- 3. Dashboard Overview View
CREATE OR REPLACE VIEW admin_dashboard_overview AS
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
    -- Account status counts
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status = 'banned'
        )
    ) as banned_users,
    COUNT(DISTINCT p.id) FILTER (
        WHERE NOT EXISTS (
            SELECT 1 FROM user_account_status uas
            WHERE uas.user_id = p.id AND uas.status != 'active'
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
    ) as under_review_users,
    -- Activity stats (simplified)
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.updated_at >= NOW() - INTERVAL '2 months'
    ) as active_last_2_months,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.updated_at >= NOW() - INTERVAL '1 week'
    ) as active_last_week,
    COUNT(DISTINCT p.id) FILTER (
        WHERE p.updated_at >= NOW() - INTERVAL '1 month'
    ) as active_last_month,
    0 as currently_online, -- Placeholder
    0 as avg_hours_since_last_seen, -- Placeholder
    0 as total_matches, -- Placeholder
    0 as total_messages, -- Placeholder
    (SELECT COUNT(*) FROM user_photos) as total_photos,
    COUNT(DISTINCT p.id) FILTER (
        WHERE EXISTS (
            SELECT 1 FROM user_photos up
            WHERE up.user_id = p.id
        )
    ) as users_with_avatar,
    50.0 as like_rate_percentage, -- Placeholder
    NOW() as generated_at
FROM profiles p;

GRANT SELECT ON admin_dashboard_overview TO authenticated;

-- Set security invoker for RLS
ALTER VIEW admin_relationship_stats SET (security_invoker = true);
ALTER VIEW admin_profiles_by_month SET (security_invoker = true);
ALTER VIEW admin_dashboard_overview SET (security_invoker = true);