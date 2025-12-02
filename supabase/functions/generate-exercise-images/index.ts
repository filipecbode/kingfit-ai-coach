import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseId, exerciseName, equipment } = await req.json();
    
    if (!exerciseId || !exerciseName) {
      throw new Error("exerciseId e exerciseName são obrigatórios");
    }

    console.log(`Gerando imagem para: ${exerciseName} (${equipment})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Criar prompt otimizado para geração de imagem de aparelho de academia
    const prompt = `Professional gym equipment photography: ${exerciseName} ${equipment ? `(${equipment})` : ''} in a modern fitness center. Clean, well-lit, high quality commercial gym setting. Equipment should be the main focus, shown from a clear angle that demonstrates its use. Professional lighting, neutral background. Ultra high resolution.`;

    // Gerar imagem usando Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro da API Lovable AI:", response.status, errorText);
      throw new Error(`Erro ao gerar imagem: ${response.status}`);
    }

    const data = await response.json();
    const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageBase64) {
      throw new Error("Imagem não foi gerada pela IA");
    }

    console.log("Imagem gerada, fazendo upload...");

    // Upload para Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Converter base64 para bytes
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Fazer upload para o storage
    const fileName = `${exerciseId}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('exercise-images')
      .upload(fileName, imageBytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('exercise-images')
      .getPublicUrl(fileName);

    // Salvar ou atualizar no banco
    const { error: dbError } = await supabase
      .from("exercise_images")
      .upsert({
        exercise_id: exerciseId,
        image_url: publicUrl,
      }, {
        onConflict: 'exercise_id'
      });

    if (dbError) {
      console.error("Erro ao salvar no banco:", dbError);
      throw dbError;
    }

    console.log(`✓ Imagem salva: ${exerciseName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        exerciseId,
        exerciseName 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
