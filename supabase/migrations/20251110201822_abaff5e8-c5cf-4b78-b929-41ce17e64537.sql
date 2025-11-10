-- Criar bucket para imagens de exercícios
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de acesso ao bucket
CREATE POLICY "Todos podem ver imagens de exercícios"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'exercise-images');

CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Usuários autenticados podem atualizar"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'exercise-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Usuários autenticados podem deletar"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'exercise-images' 
    AND auth.uid() IS NOT NULL
  );