-- ⚠️ CAUTION: THIS WILL DELETE ALL DATA IN THE PUBLIC SCHEMA
-- Use this in the Supabase SQL Editor to wipe the database before re-running schema.sql

-- 1. Drop Tables (in reverse dependency order)
DROP TABLE IF EXISTS public.verification_requests CASCADE;
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Drop Auth Triggers & Functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Cleanup Storage (Optional: Uncomment to also wipe images)
-- DELETE FROM storage.objects WHERE bucket_id = 'property-images';
-- DELETE FROM storage.buckets WHERE id = 'property-images';

-- 4. Verify Cleanup
-- After running this, copy and paste the entire contents of `scripts/schema.sql` 
-- into the SQL Editor and run it to rebuild everything fresh.
