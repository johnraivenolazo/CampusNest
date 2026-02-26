-- Create a new storage bucket for property images
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

-- Set up Row Level Security (RLS) policies for the bucket

-- Allow public access to read property images
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'property-images' );

-- Allow authenticated users (landlords) to upload images
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'property-images' );

-- Allow authenticated users to update their own images
create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'property-images' and auth.uid() = owner );

-- Allow authenticated users to delete their own images
create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'property-images' and auth.uid() = owner );
