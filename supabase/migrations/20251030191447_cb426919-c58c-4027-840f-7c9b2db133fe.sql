-- Create table to store replaced exercises
CREATE TABLE IF NOT EXISTS public.exercise_replacements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  original_exercise JSONB NOT NULL,
  new_exercise JSONB NOT NULL,
  original_index INTEGER NOT NULL,
  replaced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.exercise_replacements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own exercise replacements"
  ON public.exercise_replacements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise replacements"
  ON public.exercise_replacements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise replacements"
  ON public.exercise_replacements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise replacements"
  ON public.exercise_replacements
  FOR DELETE
  USING (auth.uid() = user_id);