-- Enable UUID extension if not already enabled (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create saved_properties table
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure a user can only save a specific property once
  UNIQUE(user_id, property_id)
);

-- Turn on Row Level Security
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own saved properties
CREATE POLICY "Users can view own saved properties"
  ON saved_properties
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own saved properties
CREATE POLICY "Users can insert own saved properties"
  ON saved_properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own saved properties
CREATE POLICY "Users can delete own saved properties"
  ON saved_properties
  FOR DELETE
  USING (auth.uid() = user_id);
