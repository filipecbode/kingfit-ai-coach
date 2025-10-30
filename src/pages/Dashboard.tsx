import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, LogOut, Calendar, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        navigate("/onboarding");
        return;
      }

      setProfile(profileData);

      const { data: planData } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setWorkoutPlan(planData);

      if (planData) {
        const { data: workoutsData } = await supabase
          .from("workouts")
          .select("*")
          .eq("plan_id", planData.id)
          .order("day_of_week", { ascending: true });

        setWorkouts(workoutsData || []);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWorkoutPlan = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: { profile },
      });

      if (error) throw error;

      toast({
        title: "Plano gerado com sucesso!",
        description: "Seu plano de treinos personalizado está pronto.",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao gerar plano",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-2xl font-black">KINGFIT</span>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">Olá, {profile?.name}! 💪</h1>
          <p className="text-muted-foreground">
            Objetivo: {profile?.goal}
          </p>
        </div>

        {!workoutPlan ? (
          <Card className="p-8 text-center">
            <Calendar className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Gerar Plano de Treinos</h2>
            <p className="text-muted-foreground mb-6">
              Vamos criar um plano personalizado baseado no seu perfil!
            </p>
            <Button onClick={generateWorkoutPlan} disabled={generating} size="lg">
              {generating ? "Gerando..." : "Gerar Plano Mensal"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{workoutPlan.title}</h2>
                  <p className="text-muted-foreground">{workoutPlan.description}</p>
                </div>
                <Button onClick={generateWorkoutPlan} disabled={generating}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {generating ? "Gerando..." : "Novo Plano"}
                </Button>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Início: {new Date(workoutPlan.start_date).toLocaleDateString("pt-BR")}
                </span>
                <span className="text-muted-foreground">
                  Fim: {new Date(workoutPlan.end_date).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workouts.map((workout) => (
                <Card key={workout.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{weekDays[workout.day_of_week]}</h3>
                    {workout.completed && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Concluído
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold mb-3">{workout.title}</h4>
                  <div className="space-y-2">
                    {workout.exercises.map((exercise: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {exercise.sets} séries x {exercise.reps} repetições
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
