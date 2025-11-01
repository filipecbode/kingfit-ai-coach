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
    const { profile } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header to identify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error("User not found");

    // Generate workout plan with AI
    const goalDescriptions: Record<string, string> = {
      'hipertrofia': 'ganhar massa muscular e hipertrofia',
      'emagrecimento': 'perder peso e emagrecer',
      'saude': 'melhorar saúde e bem-estar geral',
      'condicionamento': 'melhorar condicionamento físico',
      'forca': 'ganhar força muscular'
    };

    const bodyPreferencesText = profile.body_part_preferences && profile.body_part_preferences.length > 0
      ? profile.body_part_preferences.includes("corpo-todo")
        ? "Treino equilibrado para corpo todo"
        : `IMPORTANTE: Dar mais ênfase e volume para: ${profile.body_part_preferences.join(", ")}`
      : "";

    const prompt = `Você é um personal trainer profissional. Crie um plano de treinos mensal personalizado para:

Nome: ${profile.name}
Idade: ${profile.age} anos
Peso: ${profile.weight}kg
Altura: ${profile.height}cm
Sexo: ${profile.gender}
Objetivo: ${goalDescriptions[profile.goal] || profile.goal}
Nível: ${profile.experience_level}
Dias por semana: ${profile.days_per_week}
Horas por dia: ${profile.hours_per_day}h
${profile.health_issues ? `Restrições: ${profile.health_issues}` : ""}
${bodyPreferencesText ? `Preferências: ${bodyPreferencesText}` : ""}

Crie um plano distribuído em ${profile.days_per_week} dias por semana começando pela segunda-feira. Para cada dia, forneça:
- Título do treino (ex: "Treino de Peito e Tríceps")
- Lista de 4-6 exercícios com nome, séries, repetições e tempo de descanso

IMPORTANTE: 
- Use day_of_week: 1 para segunda, 2 para terça, 3 para quarta, 4 para quinta, 5 para sexta, 6 para sábado, 7 para domingo
- Sempre comece pela segunda-feira (day_of_week: 1)
- Os valores de day_of_week devem estar entre 1 e 7 (nunca use 0)
- Inclua sempre o tempo de descanso (rest) para cada exercício em formato legível (ex: "60 segundos", "1-2 minutos")

Responda APENAS com JSON válido neste formato:
{
  "title": "Plano de Treino Personalizado",
  "description": "Descrição breve do plano",
  "workouts": [
    {
      "day_of_week": 1,
      "title": "Nome do Treino",
      "exercises": [
        {"name": "Nome do Exercício", "sets": 3, "reps": "12", "rest": "60 segundos"}
      ]
    }
  ]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("Failed to generate workout plan");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    if (content.includes("```json")) {
      jsonContent = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonContent = content.split("```")[1].split("```")[0].trim();
    }
    
    const workoutData = JSON.parse(jsonContent);

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Delete old workout plans for this user to avoid duplicate key error
    const { error: deleteError } = await supabase
      .from("workout_plans")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting old plans:", deleteError);
      // Continue anyway - the unique constraint will prevent duplicates
    }

    // Create workout plan
    const { data: plan, error: planError } = await supabase
      .from("workout_plans")
      .insert({
        user_id: user.id,
        title: workoutData.title,
        description: workoutData.description,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (planError) throw planError;

    // Create workouts
    const workoutsToInsert = workoutData.workouts.map((workout: any) => ({
      plan_id: plan.id,
      day_of_week: workout.day_of_week,
      title: workout.title,
      exercises: workout.exercises,
    }));

    const { error: workoutsError } = await supabase
      .from("workouts")
      .insert(workoutsToInsert);

    if (workoutsError) throw workoutsError;

    return new Response(JSON.stringify({ success: true, plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
