
-- This is a partial SQL file containing just the RLS policy for stores table

-- Enable Row Level Security on stores table
ALTER TABLE IF EXISTS "public"."stores" ENABLE ROW LEVEL SECURITY;

-- Create policy that allows inserting stores
CREATE POLICY "Allow users to create stores" 
  ON "public"."stores"
  FOR INSERT 
  WITH CHECK (true);  -- Anyone authenticated can create a store

-- Create policy that allows users to see their own stores
CREATE POLICY "Allow users to see stores they belong to" 
  ON "public"."stores"
  FOR SELECT
  USING ((id IN (SELECT store_id FROM profiles WHERE profiles.id = auth.uid())));

-- Create policy that allows users to update their own stores
CREATE POLICY "Allow users to update their own stores" 
  ON "public"."stores"
  FOR UPDATE
  USING ((id IN (SELECT store_id FROM profiles WHERE profiles.id = auth.uid())))
  WITH CHECK ((id IN (SELECT store_id FROM profiles WHERE profiles.id = auth.uid())));

-- Create policy that allows users to delete their own stores
CREATE POLICY "Allow users to delete their own stores" 
  ON "public"."stores"
  FOR DELETE
  USING ((id IN (SELECT store_id FROM profiles WHERE profiles.id = auth.uid())));
