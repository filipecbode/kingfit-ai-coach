-- Create evolution_records table
CREATE TABLE public.evolution_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC NOT NULL,
  front_photo_url TEXT,
  side_photo_url TEXT,
  back_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.evolution_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own evolution records"
ON public.evolution_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own evolution records"
ON public.evolution_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evolution records"
ON public.evolution_records
FOR UPDATE
USING (auth.uid() = user_id);

-- Create storage bucket for evolution photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('evolution-photos', 'evolution-photos', true);

-- Create policies for evolution photos
CREATE POLICY "Users can view their own evolution photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'evolution-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own evolution photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'evolution-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own evolution photos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'evolution-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own evolution photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'evolution-photos' AND auth.uid()::text = (storage.foldername(name))[1]);