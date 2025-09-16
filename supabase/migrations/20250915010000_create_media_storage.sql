-- Create community-media bucket for storing user uploaded media
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
  'community-media',
  'community-media',
  true,
  false,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ],
  104857600 -- 100MB limit
);

-- Create RLS policies for community-media bucket

-- Policy for authenticated users to upload files
CREATE POLICY "Authenticated users can upload media" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'community-media');

-- Policy for authenticated users to update/delete their own files
CREATE POLICY "Users can manage their own media" ON storage.objects
FOR ALL TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Policy for all users to view media files (public bucket)
CREATE POLICY "Anyone can view media files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'community-media');

-- Create table for tracking media metadata
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for media_files table
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Policy for users to view all media files
CREATE POLICY "Anyone can view media metadata" ON public.media_files
FOR SELECT TO public
USING (true);

-- Policy for authenticated users to insert their own media
CREATE POLICY "Authenticated users can create media records" ON public.media_files
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update/delete their own media
CREATE POLICY "Users can manage their own media records" ON public.media_files
FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON public.media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON public.media_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_file_type ON public.media_files(file_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_files_updated_at
    BEFORE UPDATE ON public.media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();