-- CampusNest Comprehensive Database Schema
-- Consolidates all tables, triggers, and storage buckets into a single file

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'landlord', 'admin')),
  profile_image_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verification_document_url TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  price_per_month DECIMAL(10, 2) NOT NULL,
  bedrooms INT NOT NULL,
  bathrooms INT NOT NULL,
  amenities TEXT[], -- Store as array of strings
  rules TEXT,
  property_images TEXT[], -- URLs of images
  lease_duration TEXT, -- e.g., "3 months", "1 year"
  room_type TEXT NOT NULL CHECK (room_type IN ('studio', 'single', 'double', 'apartment')),
  utilities_included BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'taken')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (TRUE);
CREATE POLICY "Landlords can create properties" ON public.properties FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE user_type = 'landlord')
);
CREATE POLICY "Landlords can update their own properties" ON public.properties FOR UPDATE USING (
  auth.uid() = landlord_id
);
CREATE POLICY "Landlords can delete their own properties" ON public.properties FOR DELETE USING (
  auth.uid() = landlord_id
);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_landlord ON public.properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- 3. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Students can post reviews" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  auth.uid() IN (SELECT id FROM public.profiles WHERE user_type = 'student')
);
CREATE POLICY "Users can manage their own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_property ON public.reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 4. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  phone_number TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);
CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING (
  auth.uid() = receiver_id OR auth.uid() = sender_id
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property ON public.messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 5. Inquiries table
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'interested', 'rejected', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, property_id)
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for inquiries
CREATE POLICY "Students can view their own inquiries" ON public.inquiries FOR SELECT USING (
  auth.uid() = student_id
);
CREATE POLICY "Landlords can view inquiries on their properties" ON public.inquiries FOR SELECT USING (
  property_id IN (SELECT id FROM public.properties WHERE landlord_id = auth.uid())
);
CREATE POLICY "Students can create inquiries" ON public.inquiries FOR INSERT WITH CHECK (
  auth.uid() = student_id
);
CREATE POLICY "Students can update their own inquiries" ON public.inquiries FOR UPDATE USING (
  auth.uid() = student_id
);
CREATE POLICY "Students can delete their own inquiries" ON public.inquiries FOR DELETE USING (
  auth.uid() = student_id
);

-- Indexes for inquiries
CREATE INDEX IF NOT EXISTS idx_inquiries_student ON public.inquiries(student_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON public.inquiries(property_id);

-- 6. Verification requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies for verification requests
CREATE POLICY "Admins can view all verification requests" ON public.verification_requests FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE user_type = 'admin')
);
CREATE POLICY "Landlords can view their own verification requests" ON public.verification_requests FOR SELECT USING (
  auth.uid() = landlord_id
);
CREATE POLICY "Admins can update verification requests" ON public.verification_requests FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE user_type = 'admin')
);

-- Indexes for verification requests
CREATE INDEX IF NOT EXISTS idx_verification_requests_landlord ON public.verification_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

-- 7. Auth Trigger (Auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', null),
    COALESCE(new.raw_user_meta_data ->> 'user_type', 'student')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'property-images' );

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'property-images' );

DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'property-images' and auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'property-images' and auth.uid() = owner );
