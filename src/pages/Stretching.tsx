import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Dumbbell } from "lucide-react";

const Stretching = () => {
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentStretch, setCurrentStretch] = useState(0);
  const [completedStretches, setCompletedStretches] = useState<boolean[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadTodayWorkout();
  }, []);

  const loadTodayWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Buscar plano ativo
      const { data: plan } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!plan) {
        toast({
          title: "Nenhum plano encontrado",
          description: "Crie um plano de treinos primeiro",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Buscar treino de hoje
      const today = new Date().getDay();
      const dayOfWeek = today === 0 ? 7 : today;

      const { data: workout } = await supabase
        .from("workouts")
        .select("*")
        .eq("plan_id", plan.id)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();

      if (!workout) {
        toast({
          title: "Sem treino hoje",
          description: "Não há treino programado para hoje",
        });
        navigate("/dashboard");
        return;
      }

      setTodayWorkout(workout);

      // Verificar se já existe sessão de alongamento para hoje
      const todayDate = new Date().toISOString().split('T')[0];
      const { data: existingSession } = await supabase
        .from("stretching_sessions")
        .select("*")
        .eq("workout_id", workout.id)
        .gte("created_at", `${todayDate}T00:00:00`)
        .lte("created_at", `${todayDate}T23:59:59`)
        .maybeSingle();

      if (existingSession) {
        setSession(existingSession);
        const stretches = existingSession.stretches as any[];
        setCompletedStretches(new Array(stretches.length).fill(existingSession.completed));
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

  const generateStretching = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-stretching", {
        body: { workoutId: todayWorkout.id },
      });

      if (error) throw error;

      setSession(data.session);
      setCompletedStretches(new Array(data.session.stretches.length).fill(false));

      toast({
        title: "Alongamentos gerados!",
        description: "Sua sessão de alongamento está pronta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar alongamentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleStartStretching = () => {
    setStarted(true);
    setCurrentStretch(0);
  };

  const handleCompleteStretch = async () => {
    const newCompleted = [...completedStretches];
    newCompleted[currentStretch] = true;
    setCompletedStretches(newCompleted);

    if (currentStretch < session.stretches.length - 1) {
      setCurrentStretch(currentStretch + 1);
    } else {
      // Marcar sessão como concluída
      await supabase
        .from("stretching_sessions")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", session.id);

      toast({
        title: "Parabéns! 🎉",
        description: "Você concluiu a sessão de alongamento!",
      });

      setTimeout(() => navigate("/dashboard"), 2000);
    }
  };

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

  const weekDays = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold">Alongamento</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!session ? (
          <Card className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Alongamento de Hoje</h1>
            <p className="text-muted-foreground mb-2">{weekDays[todayWorkout?.day_of_week]}</p>
            <p className="text-lg font-semibold mb-6">{todayWorkout?.title}</p>
            
            <p className="text-muted-foreground mb-6">
              Vamos gerar alongamentos específicos para o seu treino de hoje
            </p>

            <Button onClick={generateStretching} disabled={generating} size="lg">
              {generating ? "Gerando Alongamentos..." : "Gerar Alongamentos"}
            </Button>
          </Card>
        ) : !started || session.completed ? (
          <Card className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Alongamento de Hoje</h1>
            <p className="text-muted-foreground mb-2">{weekDays[todayWorkout?.day_of_week]}</p>
            <p className="text-lg font-semibold mb-6">{todayWorkout?.title}</p>

            {session.completed && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-primary font-bold text-lg">✅ Alongamento Concluído!</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              {session.stretches.map((stretch: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="text-left flex-1">
                    <p className="font-semibold">{stretch.name}</p>
                    <p className="text-sm text-muted-foreground">{stretch.duration}s</p>
                  </div>
                </div>
              ))}
            </div>

            {!session.completed && (
              <Button onClick={handleStartStretching} size="lg" className="w-full">
                Iniciar Alongamento
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    Alongamento {currentStretch + 1} de {session.stretches.length}
                  </span>
                  <span className="text-sm font-semibold">
                    {completedStretches.filter(Boolean).length}/{session.stretches.length} concluídos
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${((currentStretch + 1) / session.stretches.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4">
                {session.stretches[currentStretch].name}
              </h2>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-2">Como fazer:</p>
                  <p className="text-sm">{session.stretches[currentStretch].description}</p>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Duração</p>
                  <p className="text-3xl font-bold text-primary">
                    {session.stretches[currentStretch].duration}s
                  </p>
                </div>
              </div>

              <Button onClick={handleCompleteStretch} size="lg" className="w-full">
                {currentStretch < session.stretches.length - 1 ? "Próximo Alongamento" : "Concluir Sessão"}
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Stretching;