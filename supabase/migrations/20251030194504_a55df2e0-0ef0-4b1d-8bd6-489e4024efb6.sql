-- Add body_part_preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN body_part_preferences text[] DEFAULT ARRAY[]::text[];