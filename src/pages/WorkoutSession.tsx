import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, ChevronRight, Clock, Dumbbell } from "lucide-react";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest?: string;
}

interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  completed: boolean;
  day_of_week: number;
}

const WorkoutSession = () => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const { toast } = useToast();

  const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: workoutData, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", workoutId)
        .single();

      if (error) throw error;

      const parsedWorkout = {
        ...workoutData,
        exercises: workoutData.exercises as unknown as Exercise[]
      };

      setWorkout(parsedWorkout);
      setCompletedExercises(new Array(parsedWorkout.exercises.length).fill(false));
    } catch (error: any) {
      toast({
        title: "Erro ao carregar treino",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = () => {
    setStarted(true);
  };

  const handleCompleteExercise = () => {
    const newCompleted = [...completedExercises];
    newCompleted[currentExerciseIndex] = true;
    setCompletedExercises(newCompleted);

    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }, 300);
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    try {
      const { error } = await supabase
        .from("workouts")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", workoutId);

      if (error) throw error;

      toast({
        title: "Treino concluído! 🎉",
        description: "Parabéns! Você completou o treino de hoje.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao concluir treino",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const progress = workout
    ? (completedExercises.filter(Boolean).length / workout.exercises.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (!workout) return null;

  const currentExercise = workout.exercises[currentExerciseIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold">KINGFIT</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!started ? (
          <Card className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{workout.title}</h1>
            <p className="text-muted-foreground mb-6">{weekDays[workout.day_of_week]}</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Total de exercícios</span>
                <span className="text-2xl font-bold text-primary">{workout.exercises.length}</span>
              </div>
            </div>

            <div className="space-y-3 mb-8 text-left">
              {workout.exercises.map((exercise, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets} séries x {exercise.reps} repetições
                  </p>
                </div>
              ))}
            </div>

            <Button onClick={handleStartWorkout} size="lg" className="w-full">
              Começar Treino
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Progresso do treino</span>
                <span>{completedExercises.filter(Boolean).length} de {workout.exercises.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <Card className="p-8">
              <div className="text-center mb-6">
                <span className="text-sm text-muted-foreground">
                  Exercício {currentExerciseIndex + 1} de {workout.exercises.length}
                </span>
                <h2 className="text-3xl font-bold mt-2">{currentExercise.name}</h2>
              </div>

              <div className="aspect-video bg-muted rounded-lg mb-6 flex items-center justify-center">
                <div className="text-center">
                  <Dumbbell className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Imagem/vídeo ilustrativo</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Séries</span>
                  <span className="text-2xl font-bold text-primary">{currentExercise.sets}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium">Repetições</span>
                  <span className="text-2xl font-bold text-primary">{currentExercise.reps}</span>
                </div>
                {currentExercise.rest && (
                  <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Tempo de descanso</p>
                      <p className="text-sm text-muted-foreground">{currentExercise.rest}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCompleteExercise}
                size="lg"
                className="w-full"
                disabled={completedExercises[currentExerciseIndex]}
              >
                {completedExercises[currentExerciseIndex] ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Concluído
                  </>
                ) : currentExerciseIndex === workout.exercises.length - 1 ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Finalizar Treino
                  </>
                ) : (
                  <>
                    Concluir Exercício
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkoutSession;
