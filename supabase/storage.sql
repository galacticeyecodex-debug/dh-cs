-- Create storage bucket for character avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('character-avatars', 'character-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for character avatars
-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload character avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own images
CREATE POLICY "Users can update their character avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their character avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'character-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all character avatars
CREATE POLICY "Character avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'character-avatars');
