-- ========================================
-- QUICK DIAGNOSIS & FIX
-- Run this in Supabase SQL Editor
-- ========================================

-- 1️⃣ CHECK FOR ORPHANED RECORDS
-- ========================================
SELECT
    'DIAGNOSIS' as step,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM user_presence) as total_presence_records,
    (SELECT COUNT(*) FROM user_presence WHERE id NOT IN (SELECT id FROM profiles)) as orphaned_presence_records,
    CASE
        WHEN (SELECT COUNT(*) FROM user_presence WHERE id NOT IN (SELECT id FROM profiles)) > 0
        THEN '⚠️ ORPHANED RECORDS FOUND - Need cleanup'
        ELSE '✅ No orphaned records'
    END as status;

-- 2️⃣ CHECK CURRENT CASCADE DELETE STATUS
-- ========================================
SELECT
    'CONSTRAINTS' as step,
    tc.table_name,
    kcu.column_name,
    kcu.referenced_table_name,
    rc.delete_rule,
    CASE
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Good'
        ELSE '⚠️ Missing CASCADE DELETE'
    END as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND kcu.referenced_table_name = 'profiles'
AND tc.table_name IN ('user_presence', 'user_account_status', 'user_photos')
ORDER BY tc.table_name;

-- 3️⃣ CLEANUP ORPHANED RECORDS (OPTIONAL - REVIEW FIRST!)
-- ========================================
-- ⚠️ Uncomment the lines below to delete orphaned records
-- WARNING: This will permanently delete orphaned data

-- DELETE FROM user_presence WHERE id NOT IN (SELECT id FROM profiles);
-- DELETE FROM user_account_status WHERE user_id NOT IN (SELECT id FROM profiles);
-- DELETE FROM user_photos WHERE user_id NOT IN (SELECT id FROM profiles);
-- DELETE FROM messages WHERE sender_id NOT IN (SELECT id FROM profiles);
-- DELETE FROM swipes WHERE swiper_id NOT IN (SELECT id FROM profiles);

-- 4️⃣ ADD CASCADE DELETE CONSTRAINT
-- ========================================
-- ⚠️ Uncomment the lines below to add CASCADE DELETE

-- user_presence
-- DO $$
-- BEGIN
--     ALTER TABLE user_presence DROP CONSTRAINT IF EXISTS user_presence_id_fkey;
--     ALTER TABLE user_presence
--     ADD CONSTRAINT user_presence_id_fkey
--     FOREIGN KEY (id) REFERENCES profiles(id) ON DELETE CASCADE;
-- END $$;

-- user_account_status
-- DO $$
-- BEGIN
--     ALTER TABLE user_account_status DROP CONSTRAINT IF EXISTS user_account_status_user_id_fkey;
--     ALTER TABLE user_account_status
--     ADD CONSTRAINT user_account_status_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
-- END $$;

-- user_photos
-- DO $$
-- BEGIN
--     ALTER TABLE user_photos DROP CONSTRAINT IF EXISTS user_photos_user_id_fkey;
--     ALTER TABLE user_photos
--     ADD CONSTRAINT user_photos_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
-- END $$;

-- 5️⃣ VERIFY FIX
-- ========================================
-- Run this after cleanup and constraint addition
SELECT
    'VERIFICATION' as step,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM user_presence) as total_presence_records,
    (SELECT COUNT(*) FROM user_presence WHERE id NOT IN (SELECT id FROM profiles)) as orphaned_records,
    CASE
        WHEN (SELECT COUNT(*) FROM user_presence WHERE id NOT IN (SELECT id FROM profiles)) = 0
        THEN '✅ All clean!'
        ELSE '❌ Still have orphaned records'
    END as status;

-- ========================================
-- INSTRUCTIONS:
-- ========================================
-- 1. Run sections 1 & 2 first (diagnosis)
-- 2. Review the orphaned records count
-- 3. Uncomment section 3 to cleanup (if needed)
-- 4. Uncomment section 4 to add CASCADE DELETE
-- 5. Run section 5 to verify fix
-- ========================================
