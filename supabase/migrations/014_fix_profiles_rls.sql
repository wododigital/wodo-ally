-- Fix #22: Require authentication for profiles SELECT policy
-- Previously used USING (true) which allowed unauthenticated reads via anon key
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);
