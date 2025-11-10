import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Dumbbell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import exerciseCatalog from "@/data/exercise-catalog.json";

const ExerciseCatalog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");

  // Separar exercícios e alongamentos
  const exercises = exerciseCatalog.exercises.filter((ex: any) => !ex.id.startsWith("st-"));
  const stretches = exerciseCatalog.exercises.filter((ex: any) => ex.id.startsWith("st-"));

  const categories = ["todos", "perna", "costas", "bíceps", "abdômen", "peito", "ombro", "tríceps"];

  const filterExercises = (items: any[]) => {
    return items.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description_short?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "todos" || 
        item.category === selectedCategory || 
        item.body_part === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredExercises = filterExercises(exercises);
  const filteredStretches = filterExercises(stretches);

  const renderExerciseCard = (exercise: any) => (
    <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{exercise.name}</CardTitle>
            <CardDescription className="mt-1">
              {exercise.description_short}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {exercise.equipment && (
            <Badge variant="outline">{exercise.equipment}</Badge>
          )}
          {exercise.difficulty && (
            <Badge variant="secondary">{exercise.difficulty}</Badge>
          )}
          {exercise.category && (
            <Badge>{exercise.category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {exercise.primary_muscles && exercise.primary_muscles.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Músculos primários:</p>
            <div className="flex flex-wrap gap-1">
              {exercise.primary_muscles.map((muscle: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {muscle}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {exercise.objectives && exercise.objectives.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Objetivos:</p>
            <div className="flex flex-wrap gap-1">
              {exercise.objectives.map((obj: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {obj}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {exercise.cues && exercise.cues.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-1">Dicas de execução:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {exercise.cues.map((cue: string, idx: number) => (
                <li key={idx}>{cue}</li>
              ))}
            </ul>
          </div>
        )}
        {exercise.contraindications && (
          <div className="mt-3 p-2 bg-destructive/10 rounded-md">
            <p className="text-xs text-destructive font-medium">
              ⚠️ {exercise.contraindications}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStretchCard = (stretch: any) => (
    <Card key={stretch.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{stretch.name}</CardTitle>
            <CardDescription className="mt-1">
              {stretch.description_short}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {stretch.body_part && (
            <Badge>{stretch.body_part}</Badge>
          )}
          {stretch.when && (
            <Badge variant="outline">{stretch.when}</Badge>
          )}
          {stretch.duration_seconds && (
            <Badge variant="secondary">{stretch.duration_seconds}s × {stretch.reps || 1}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {stretch.contraindications && (
          <div className="mt-3 p-2 bg-destructive/10 rounded-md">
            <p className="text-xs text-destructive font-medium">
              ⚠️ {stretch.contraindications}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-black">Catálogo de Exercícios</h1>
                <p className="text-sm text-muted-foreground">
                  {exercises.length} exercícios • {stretches.length} alongamentos
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar exercícios ou alongamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exercises">
              Exercícios ({filteredExercises.length})
            </TabsTrigger>
            <TabsTrigger value="stretches">
              Alongamentos ({filteredStretches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map(renderExerciseCard)}
            </div>
            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum exercício encontrado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stretches" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStretches.map(renderStretchCard)}
            </div>
            {filteredStretches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum alongamento encontrado</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            ⚠️ {exerciseCatalog.meta.disclaimer}
          </p>
        </div>
      </main>
    </div>
  );
};

export default ExerciseCatalog;
