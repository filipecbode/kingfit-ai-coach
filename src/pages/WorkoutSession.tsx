import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, ChevronRight, Clock, Dumbbell, RefreshCw } from "lucide-react";
import { AiChat } from "@/components/AiChat";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

interface ReplacedExercise {
  id: string;
  original_index: number;
  original_exercise: any;
  new_exercise: any;
  completed: boolean;
}

const WorkoutSession = () => {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseOrder, setExerciseOrder] = useState<number[]>([]);
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]);
  const [replacedExercises, setReplacedExercises] = useState<ReplacedExercise[]>([]);
  const [replacing, setReplacing] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const { workoutId } = useParams();
  const { toast } = useToast();

  const weekDays = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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

      // Load replaced exercises
      const { data: replacements } = await supabase
        .from("exercise_replacements")
        .select("*")
        .eq("workout_id", workoutId);

      const parsedWorkout = {
        ...workoutData,
        exercises: [...(workoutData.exercises as unknown as Exercise[])]
      };

      // Initialize completed exercises array
      const initialCompleted = new Array(parsedWorkout.exercises.length).fill(false);
      
      // Check if all exercises are completed based on completed_exercises_indices
      const completedIndices = workoutData.completed_exercises_indices || [];
      const allExercisesCompleted = completedIndices.length === parsedWorkout.exercises.length;
      
      // If all exercises completed but workout not marked as completed, update it
      if (allExercisesCompleted && !workoutData.completed) {
        const now = new Date();
        const todayDate = now.toISOString().split('T')[0];
        await supabase
          .from("workouts")
          .update({ 
            completed: true,
            completed_at: now.toISOString(),
            completed_date: todayDate
          })
          .eq("id", workoutId);
        
        workoutData.completed = true;
      }
      
      // If workout is completed, mark all as completed
      if (workoutData.completed || allExercisesCompleted) {
        initialCompleted.fill(true);
      } else {
        // Load completed exercises from saved indices
        completedIndices.forEach((idx: number) => {
          if (idx < initialCompleted.length) {
            initialCompleted[idx] = true;
          }
        });
        
        // Mark replaced/completed exercises
        if (replacements && replacements.length > 0) {
          replacements.forEach(replacement => {
            // Mark replaced exercises as completed if they were completed
            if (replacement.completed && replacement.original_index < initialCompleted.length) {
              initialCompleted[replacement.original_index] = true;
            }
            // Update exercise with replacement
            if (replacement.original_index < parsedWorkout.exercises.length) {
              parsedWorkout.exercises[replacement.original_index] = replacement.new_exercise as unknown as Exercise;
            }
          });
        }
      }

      setWorkout(parsedWorkout);
      setReplacedExercises(replacements || []);
      setCompletedExercises(initialCompleted);
      
      // Only set exercise order if not started yet or starting fresh
      // Remove already completed and replaced exercises from the order
      const activeExercises = Array.from({ length: parsedWorkout.exercises.length }, (_, i) => i)
        .filter(i => {
          const isCompleted = initialCompleted[i];
          const isReplaced = (replacements || []).some((r: ReplacedExercise) => r.original_index === i);
          return !isCompleted && !isReplaced;
        });
      
      setExerciseOrder(activeExercises);
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
    // Filter to show only exercises that are not completed and not replaced (status "livre")
    const pendingExercises = exerciseOrder.filter(idx => {
      const isCompleted = completedExercises[idx];
      const isReplaced = replacedExercises.some(r => r.original_index === idx);
      return !isCompleted && !isReplaced;
    });
    setExerciseOrder(pendingExercises);
    setStarted(true);
  };

  const handleCompleteExercise = async () => {
    const currentRealIndex = exerciseOrder[0];
    const newCompleted = [...completedExercises];
    newCompleted[currentRealIndex] = true;

    // Start transition animation
    setTransitioning(true);

    // Update workout with completed exercise index
    const completedIndices = newCompleted
      .map((completed, idx) => completed ? idx : -1)
      .filter(idx => idx !== -1);
    
    // Check if this was the last exercise
    const allExercisesCompleted = completedIndices.length === workout!.exercises.length;
    
    try {
      // Update replacement as completed if it exists
      const replacement = replacedExercises.find(r => r.original_index === currentRealIndex);
      if (replacement) {
        await supabase
          .from('exercise_replacements')
          .update({ completed: true })
          .eq('id', replacement.id);
      }

      const now = new Date();
      const todayDate = now.toISOString().split('T')[0];

      // Always update the database with the latest state
      const { error } = await supabase
        .from("workouts")
        .update({ 
          completed: allExercisesCompleted,
          completed_at: allExercisesCompleted ? now.toISOString() : null,
          completed_date: allExercisesCompleted ? todayDate : null,
          completed_exercises_indices: completedIndices
        })
        .eq("id", workoutId);

      if (error) throw error;

      // If all exercises completed, show success and navigate
      if (allExercisesCompleted) {
        toast({
          title: "Treino concluído! 🎉",
          description: "Parabéns! Você completou o treino de hoje.",
        });

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
      } else {
        // Wait for fade-out animation
        setTimeout(() => {
          // Update local state for next exercise
          setCompletedExercises(newCompleted);
          const newOrder = exerciseOrder.slice(1);
          setExerciseOrder(newOrder);
          
          toast({
            title: "Exercício concluído!",
            description: `Faltam ${newOrder.length} exercícios`,
          });

          // End transition after update
          setTimeout(() => {
            setTransitioning(false);
          }, 50);
        }, 300);
      }
    } catch (error: any) {
      console.error("Error completing exercise:", error);
      setTransitioning(false);
      toast({
        title: "Erro ao atualizar treino",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReplaceExercise = () => {
    setShowReplaceDialog(true);
  };

  const executeReplaceExercise = async (replaceScope: 'day' | 'month') => {
    const currentRealIndex = exerciseOrder[0];
    const currentExercise = workout!.exercises[currentRealIndex];
    
    setReplacing(true);
    setShowReplaceDialog(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get original exercise name before replacement
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('exercises, plan_id, day_of_week')
        .eq('id', workoutId)
        .single();

      if (!workoutData) throw new Error("Workout not found");

      const originalExercises = workoutData.exercises as unknown as Exercise[];
      const originalExercise = originalExercises[currentRealIndex];

      const { data, error } = await supabase.functions.invoke('replace-exercise', {
        body: { exercise: currentExercise }
      });

      if (error) throw error;

      const newExercise = data.newExercise;

      if (replaceScope === 'day') {
        // Trocar apenas este exercício no treino atual
        const { error: insertError } = await supabase
          .from('exercise_replacements')
          .insert({
            workout_id: workoutId,
            user_id: user.id,
            original_exercise: originalExercise as any,
            new_exercise: newExercise as any,
            original_index: currentRealIndex,
            completed: false
          } as any);

        if (insertError) throw insertError;
      } else {
        // Trocar este exercício em todos os treinos do mesmo dia da semana no mês
        const { data: workoutsToUpdate } = await supabase
          .from('workouts')
          .select('id')
          .eq('plan_id', workoutData.plan_id)
          .eq('day_of_week', workoutData.day_of_week);

        if (workoutsToUpdate) {
          for (const w of workoutsToUpdate) {
            await supabase
              .from('exercise_replacements')
              .insert({
                workout_id: w.id,
                user_id: user.id,
                original_exercise: originalExercise as any,
                new_exercise: newExercise as any,
                original_index: currentRealIndex,
                completed: false
              } as any);
          }
        }
      }

      await loadWorkout();

      toast({
        title: "Exercício trocado!",
        description: replaceScope === 'day' 
          ? `${currentExercise.name} foi substituído por ${newExercise.name} apenas hoje`
          : `${currentExercise.name} foi substituído por ${newExercise.name} em todos os treinos deste dia da semana no mês`,
      });
    } catch (error: any) {
      console.error('Error replacing exercise:', error);
      toast({
        title: "Erro ao trocar exercício",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setReplacing(false);
    }
  };

  const handleSkipExercise = () => {
    const currentRealIndex = exerciseOrder[0];
    const newOrder = [...exerciseOrder.slice(1)];
    
    // Encontra a posição do primeiro exercício concluído ou trocado
    const firstBlockedIndex = newOrder.findIndex(idx => {
      const isCompleted = completedExercises[idx];
      const isReplaced = replacedExercises.some(r => r.original_index === idx);
      return isCompleted || isReplaced;
    });
    
    // Se não há exercícios bloqueados (concluídos/trocados), adiciona no final
    // Se há exercícios bloqueados, adiciona antes deles
    if (firstBlockedIndex === -1) {
      newOrder.push(currentRealIndex);
    } else {
      newOrder.splice(firstBlockedIndex, 0, currentRealIndex);
    }
    
    setExerciseOrder(newOrder);
    
    toast({
      title: "Exercício pulado",
      description: "O exercício foi movido para fazer daqui a pouco.",
    });
  };


  const progress = workout
    ? (completedExercises.filter(Boolean).length / workout.exercises.length) * 100
    : 0;

  const currentExerciseRealIndex = exerciseOrder[0];
  const currentExercise = workout?.exercises[currentExerciseRealIndex];
  const isExerciseReplaced = replacedExercises.some(r => r.original_index === currentExerciseRealIndex);

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

  // Se o treino está completo e não há exercícios pendentes, mostrar apenas a visualização
  const workoutCompleted = workout.completed || (exerciseOrder.length === 0 && completedExercises.every(Boolean));
  
  if (!currentExercise && !workoutCompleted) return null;

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
        {!started || workoutCompleted ? (
          <Card className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-2">{workout.title}</h1>
            <p className="text-muted-foreground mb-6">{weekDays[workout.day_of_week]}</p>
            
            {workoutCompleted && (
              <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-primary font-bold text-lg">✅ Treino Concluído!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Confira abaixo os exercícios realizados
                </p>
              </div>
            )}
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Total de exercícios</span>
                <span className="text-2xl font-bold text-primary">{workout.exercises.length}</span>
              </div>
            </div>

            <div className="space-y-3 mb-8 text-left">
              {workout.exercises.map((exercise, idx) => {
                const isCompleted = completedExercises[idx];
                const isReplaced = replacedExercises.some(r => r.original_index === idx);
                const isPending = !isCompleted && !isReplaced;
                const isBlocked = isCompleted || isReplaced;
                
                return (
                  <div key={idx} className={`p-4 border border-border rounded-lg ${isBlocked ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{exercise.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {exercise.sets} séries x {exercise.reps} repetições
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {isCompleted && (
                          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium min-w-[60px]">
                            <span>✅</span>
                          </div>
                        )}
                        {isReplaced && !isCompleted && (
                          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-medium min-w-[90px]">
                            <span>Trocado 💱</span>
                          </div>
                        )}
                        {isPending && (
                          <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium min-w-[60px]">
                            <span>Livre</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!workoutCompleted && (
              <Button onClick={handleStartWorkout} size="lg" className="w-full">
                Começar Treino
              </Button>
            )}
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

            <Card className={`p-8 transition-all duration-300 ${transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-fade-in'}`}>
              <div className="text-center mb-6">
                <span className="text-sm text-muted-foreground">
                  Faltam {exerciseOrder.length} exercícios
                </span>
                <h2 className="text-3xl font-bold mt-2">{currentExercise.name}</h2>
                <div className="mt-2 flex items-center justify-center gap-2">
                  {completedExercises[currentExerciseRealIndex] && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      <Check className="h-4 w-4" />
                      Concluído
                    </div>
                  )}
                  {isExerciseReplaced && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-sm font-medium">
                      <RefreshCw className="h-4 w-4" />
                      Trocado
                    </div>
                  )}
                </div>
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

              <div className="space-y-3">
                <Button
                  onClick={handleCompleteExercise}
                  size="lg"
                  className="w-full"
                  disabled={completedExercises[currentExerciseRealIndex]}
                >
                  {completedExercises[currentExerciseRealIndex] ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Concluído
                    </>
                  ) : exerciseOrder.length === 1 ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Finalizar Treino
                    </>
                  ) : (
                    <>
                      Concluir Aparelho
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                
                {!completedExercises[currentExerciseRealIndex] && exerciseOrder.length > 1 && (
                  <>
                    <Button
                      onClick={handleSkipExercise}
                      size="lg"
                      variant="outline"
                      className="w-full"
                    >
                      Pular Exercício (fazer daqui a pouco)
                    </Button>
                    
                    <Button
                      onClick={handleReplaceExercise}
                      size="lg"
                      variant="secondary"
                      className="w-full"
                      disabled={replacing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${replacing ? 'animate-spin' : ''}`} />
                      {replacing ? 'Trocando...' : 'Trocar Exercício/Aparelho'}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
      
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar exercício</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja trocar este exercício apenas no treino de hoje ou em todos os treinos deste dia da semana no mês?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => executeReplaceExercise('day')}>
              Só hoje
            </AlertDialogAction>
            <AlertDialogAction onClick={() => executeReplaceExercise('month')}>
              Todo o mês
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AiChat />
    </div>
  );
};

export default WorkoutSession;
