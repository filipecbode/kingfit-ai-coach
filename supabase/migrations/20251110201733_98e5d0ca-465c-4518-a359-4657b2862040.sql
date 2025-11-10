-- Criar tabela para armazenar imagens dos exercícios
CREATE TABLE IF NOT EXISTS public.exercise_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id TEXT NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.exercise_images ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos vejam as imagens
CREATE POLICY "Todos podem ver imagens de exercícios"
  ON public.exercise_images
  FOR SELECT
  USING (true);

-- Política para permitir inserção apenas por usuários autenticados
CREATE POLICY "Usuários autenticados podem adicionar imagens"
  ON public.exercise_images
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para permitir atualização apenas por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar imagens"
  ON public.exercise_images
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_exercise_images_updated_at
  BEFORE UPDATE ON public.exercise_images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();