import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, LogOut, Calendar, TrendingUp, Activity, User } from "lucide-react";
import { AiChat } from "@/components/AiChat";
import { GoalSelectionDialog } from "@/components/GoalSelectionDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
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

        // Resetar status de concluído se passou 24h
        if (workoutsData) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          
          const updatedWorkouts = await Promise.all(
            workoutsData.map(async (workout) => {
              if (workout.completed && workout.completed_date) {
                const completedDate = new Date(workout.completed_date);
                completedDate.setHours(0, 0, 0, 0);
                
                const daysDiff = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysDiff >= 1) {
                  await supabase
                    .from("workouts")
                    .update({ 
                      completed: false, 
                      completed_at: null, 
                      completed_date: null,
                      completed_exercises_indices: []
                    })
                    .eq("id", workout.id);
                  return { 
                    ...workout, 
                    completed: false, 
                    completed_at: null, 
                    completed_date: null,
                    completed_exercises_indices: []
                  };
                }
              }
              return workout;
            })
          );
          setWorkouts(updatedWorkouts);
          
          // Encontrar treino de hoje
          const today = new Date().getDay();
          const todayDayOfWeek = today === 0 ? 7 : today;
          const todayWorkoutData = updatedWorkouts.find(w => w.day_of_week === todayDayOfWeek);
          setTodayWorkout(todayWorkoutData || null);
        }
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

  const generateWorkoutPlan = async (newGoal?: string, bodyParts?: string[]) => {
    setGenerating(true);
    try {
      // Se tem novo objetivo, atualizar o perfil primeiro
      let updatedProfile = profile;
      if (newGoal) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ 
              goal: newGoal,
              body_part_preferences: bodyParts || []
            })
            .eq("id", user.id);

          if (updateError) throw updateError;
          
          updatedProfile = { ...profile, goal: newGoal, body_part_preferences: bodyParts };
          setProfile(updatedProfile);
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: { profile: updatedProfile },
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

  const handleNewPlanClick = () => {
    setShowGoalDialog(true);
  };

  const handleGoalConfirm = (goal: string, bodyParts: string[]) => {
    generateWorkoutPlan(goal, bodyParts);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const weekDays = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/catalog")}>
              <Dumbbell className="h-4 w-4 mr-2" />
              FAQ
            </Button>
            <Button variant="ghost" onClick={() => navigate("/evolution")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Evolução
            </Button>
            <Button variant="ghost" onClick={() => navigate("/stretching")}>
              <Activity className="h-4 w-4 mr-2" />
              Alongamento
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Dados Pessoais
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            <Button onClick={() => generateWorkoutPlan()} disabled={generating} size="lg">
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
                <Button onClick={handleNewPlanClick} disabled={generating}>
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

            {/* Treino de Hoje */}
            {todayWorkout ? (
              <Card className="p-8 bg-gradient-to-br from-primary/10 via-background to-background border-2 border-primary">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-primary">TREINO DE HOJE</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-1">{todayWorkout.title}</h2>
                  <p className="text-lg text-muted-foreground">{weekDays[todayWorkout.day_of_week]}</p>
                </div>

                {todayWorkout.completed && (
                  <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-primary font-bold text-lg">✅ Treino Concluído Hoje!</p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {todayWorkout.exercises.map((exercise: any, idx: number) => (
                    <div key={idx} className="p-4 bg-background border border-border rounded-lg">
                      <p className="font-semibold mb-1">{exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets} séries x {exercise.reps} repetições
                      </p>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(`/workout/${todayWorkout.id}`)}
                >
                  {todayWorkout.completed ? 'Ver Detalhes' : 'Iniciar Treino'}
                </Button>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Sem treino hoje</h3>
                <p className="text-muted-foreground">
                  Hoje é dia de descanso! Veja outros treinos abaixo.
                </p>
              </Card>
            )}

            {/* Botão para ver todos os treinos */}
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setShowAllWorkouts(!showAllWorkouts)}
                className="w-full md:w-auto"
              >
                {showAllWorkouts ? 'Ocultar Outros Treinos' : 'Ver Todos os Treinos da Semana'}
              </Button>
            </div>

            {/* Outros treinos */}
            {showAllWorkouts && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workouts
                  .filter(w => w.id !== todayWorkout?.id)
                  .map((workout) => (
                    <Card 
                      key={workout.id} 
                      className="p-6 cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => navigate(`/workout/${workout.id}`)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">{weekDays[workout.day_of_week]}</h3>
                        {workout.completed && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Concluído
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold mb-3">{workout.title}</h4>
                      <div className="space-y-2 mb-4">
                        {workout.exercises.slice(0, 3).map((exercise: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {exercise.sets} séries x {exercise.reps} repetições
                            </p>
                          </div>
                        ))}
                        {workout.exercises.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{workout.exercises.length - 3} exercícios
                          </p>
                        )}
                      </div>
                      <Button className="w-full" size="sm">
                        {workout.completed ? 'Ver Treino' : 'Iniciar Treino'}
                      </Button>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      <GoalSelectionDialog
        open={showGoalDialog}
        onClose={() => setShowGoalDialog(false)}
        onConfirm={handleGoalConfirm}
        currentGoal={profile?.goal}
      />
      
      <AiChat />
    </div>
  );
};

export default Dashboard;
