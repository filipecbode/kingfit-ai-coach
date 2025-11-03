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
    const { workoutId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Não autorizado");
    }

    // Buscar o treino do dia
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*, plan:workout_plans(*)")
      .eq("id", workoutId)
      .single();

    if (workoutError || !workout) {
      throw new Error("Treino não encontrado");
    }

    // Verificar se já existe uma sessão de alongamento para hoje
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSession } = await supabase
      .from("stretching_sessions")
      .select("*")
      .eq("workout_id", workoutId)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .maybeSingle();

    if (existingSession) {
      return new Response(
        JSON.stringify({ session: existingSession }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrair grupos musculares do treino
    const muscleGroups = workout.title;
    const exercises = workout.exercises;

    const prompt = `Você é um personal trainer especializado em alongamento. Crie uma sessão de alongamento ESPECÍFICA para quem acabou de treinar ${muscleGroups}.

Baseando-se nos exercícios do treino (${exercises.map((e: any) => e.name).join(', ')}), crie 3-5 alongamentos específicos para esses grupos musculares.

REGRAS IMPORTANTES:
- Cada alongamento deve ter: nome, descrição detalhada de como fazer, duração em segundos (30-60s)
- Os alongamentos devem ser ESPECÍFICOS para os músculos trabalhados
- Devem ajudar na recuperação muscular e prevenir lesões
- Linguagem clara e objetiva

Retorne APENAS um JSON válido no seguinte formato:
{
  "stretches": [
    {
      "name": "Nome do Alongamento",
      "description": "Descrição detalhada de como executar o alongamento",
      "duration": 45
    }
  ]
}`;

    console.log("Gerando alongamentos para:", muscleGroups);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um personal trainer especializado em alongamento. Retorne APENAS JSON válido." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Erro na API da IA:", aiResponse.status, errorText);
      throw new Error("Erro ao gerar alongamentos");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    console.log("Resposta da IA:", content);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Resposta da IA não contém JSON válido");
    }

    const stretchingPlan = JSON.parse(jsonMatch[0]);

    // Criar sessão de alongamento
    const { data: session, error: sessionError } = await supabase
      .from("stretching_sessions")
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        stretches: stretchingPlan.stretches,
        completed: false,
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Erro ao criar sessão:", sessionError);
      throw sessionError;
    }

    return new Response(
      JSON.stringify({ session }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});