-- Storage policies for bucket: ait-images
-- Ensure authenticated users can upload/manage their own AIT images under path: <user_id>/filename

DO $$
BEGIN
  -- SELECT
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'AIT images are publicly accessible'
  ) THEN
    EXECUTE 'DROP POLICY "AIT images are publicly accessible" ON storage.objects';
  END IF;

  -- INSERT
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can upload AIT images'
  ) THEN
    EXECUTE 'DROP POLICY "Users can upload AIT images" ON storage.objects';
  END IF;

  -- UPDATE
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can update their AIT images'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update their AIT images" ON storage.objects';
  END IF;

  -- DELETE
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can delete their AIT images'
  ) THEN
    EXECUTE 'DROP POLICY "Users can delete their AIT images" ON storage.objects';
  END IF;
END $$;

-- Public read (bucket is public, but policy still required)
CREATE POLICY "AIT images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ait-images');

-- Upload (own folder) or admin/moderador
CREATE POLICY "Users can upload AIT images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ait-images'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1])
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderador'::app_role)
  )
);

-- Update (own folder) or admin/moderador
CREATE POLICY "Users can update their AIT images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ait-images'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1])
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderador'::app_role)
  )
)
WITH CHECK (
  bucket_id = 'ait-images'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1])
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderador'::app_role)
  )
);

-- Delete (own folder) or admin/moderador
CREATE POLICY "Users can delete their AIT images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ait-images'
  AND (
    (auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1])
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderador'::app_role)
  )
);
