/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Need an admin client with service_role key to bypass RLS for schema creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createReviewsTable() {
  console.log('Creating reviews table...')

  const { error } = await supabaseAdmin.rpc('run_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(property_id, user_id)
      );

      -- Enable RLS
      ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

      -- Policies
      -- Anyone can read reviews
      CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
        FOR SELECT USING (true);

      -- Authenticated students can insert reviews
      CREATE POLICY "Authenticated users can create reviews" ON public.reviews
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      -- Users can update their own reviews
      CREATE POLICY "Users can update their own reviews" ON public.reviews
        FOR UPDATE USING (auth.uid() = user_id);

      -- Users can delete their own reviews
      CREATE POLICY "Users can delete their own reviews" ON public.reviews
        FOR DELETE USING (auth.uid() = user_id);
    `,
  })

  if (error) {
    console.error('Failed to create reviews table:', error)
  } else {
    console.log('Successfully created reviews table and policies!')
  }
}

createReviewsTable()
