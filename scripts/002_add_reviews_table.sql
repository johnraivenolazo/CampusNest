-- Migration: Add Reviews Table
-- Description: Creates the reviews table for property listings and sets up RLS policies.

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, user_id) -- One review per user per property
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view reviews" ON public.reviews 
  FOR SELECT USING (TRUE);

CREATE POLICY "Students can post reviews" ON public.reviews 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (SELECT id FROM public.profiles WHERE user_type = 'student')
  );

CREATE POLICY "Users can manage their own reviews" ON public.reviews 
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_property ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
