-- Criar tabela para sessões de alongamento
CREATE TABLE IF NOT EXISTS public.stretching_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  stretches JSONB NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stretching_sessions ENABLE ROW LEVEL SECURITY;

-- Policies para stretching_sessions
CREATE POLICY "Users can view their own stretching sessions" 
ON public.stretching_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workout_plans wp
    JOIN workouts w ON w.plan_id = wp.id
    WHERE w.id = stretching_sessions.workout_id
    AND wp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own stretching sessions" 
ON public.stretching_sessions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_plans wp
    JOIN workouts w ON w.plan_id = wp.id
    WHERE w.id = stretching_sessions.workout_id
    AND wp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own stretching sessions" 
ON public.stretching_sessions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM workout_plans wp
    JOIN workouts w ON w.plan_id = wp.id
    WHERE w.id = stretching_sessions.workout_id
    AND wp.user_id = auth.uid()
  )
);

-- Adicionar campo para rastrear quando o treino foi completado
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS completed_date DATE;