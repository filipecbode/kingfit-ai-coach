import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Dumbbell, Upload, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import exerciseCatalog from "@/data/exercise-catalog.json";
import stretchesCatalog from "@/data/stretches-catalog.json";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ExerciseCatalog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });

  // Carregar imagens dos exercícios
  useEffect(() => {
    const loadImages = async () => {
      const { data } = await supabase
        .from("exercise_images")
        .select("exercise_id, image_url");
      
      if (data) {
        const imagesMap: Record<string, string> = {};
        data.forEach(img => {
          imagesMap[img.exercise_id] = img.image_url;
        });
        setExerciseImages(imagesMap);
      }
    };
    loadImages();
  }, []);

  // Exercícios do catálogo grande (sem alongamentos)
  const allExercises = (exerciseCatalog.exercises || []).filter((ex: any) => {
    const id = ex.id || "";
    return !id.includes("st-");
  });
  
  // Alongamentos do catálogo específico
  const allStretches = stretchesCatalog.stretches || [];

  const categories = ["todos", "perna", "costas", "bíceps", "abdômen", "peito", "ombro", "tríceps"];

  const filterExercises = (items: any[]) => {
    return items.filter((item: any) => {
      // Busca
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.name?.toLowerCase().includes(searchLower) ||
        item.description_short?.toLowerCase().includes(searchLower);
      
      // Filtro de categoria - normalizar comparações
      if (selectedCategory === "todos") {
        return matchesSearch;
      }
      
      const itemCategory = (item.category || "").toLowerCase().trim();
      const itemBodyPart = (item.body_part || "").toLowerCase().trim();
      const selectedCat = selectedCategory.toLowerCase().trim();
      
      const matchesCategory = itemCategory === selectedCat || itemBodyPart === selectedCat;
      
      return matchesSearch && matchesCategory;
    });
  };

  const exercises = filterExercises(allExercises);
  const stretches = filterExercises(allStretches);

  const handleImageUpload = async (exerciseId: string, file: File) => {
    setUploadingImage(exerciseId);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('upload-exercise-image', {
          body: { exerciseId, imageBase64: base64String }
        });

        if (error) throw error;

        toast({
          title: "Imagem adicionada!",
          description: "A imagem do exercício foi salva com sucesso.",
        });

        // Atualizar o estado local
        setExerciseImages(prev => ({
          ...prev,
          [exerciseId]: data.imageUrl
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const generateAllImages = async () => {
    // Pegar apenas exercícios que não têm imagem
    const exercisesWithoutImages = allExercises.filter((ex: any) => !exerciseImages[ex.id]);
    
    if (exercisesWithoutImages.length === 0) {
      toast({
        title: "Tudo pronto!",
        description: "Todos os exercícios já têm imagens.",
      });
      return;
    }

    setGeneratingImages(true);
    setGenerationProgress({ current: 0, total: exercisesWithoutImages.length });

    let successCount = 0;
    let errorCount = 0;

    // Gerar imagens de forma sequencial para não sobrecarregar
    for (let i = 0; i < exercisesWithoutImages.length; i++) {
      const exercise = exercisesWithoutImages[i];
      setGenerationProgress({ current: i + 1, total: exercisesWithoutImages.length });

      try {
        const { data, error } = await supabase.functions.invoke('generate-exercise-images', {
          body: { 
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            equipment: exercise.equipment
          }
        });

        if (error) throw error;

        if (data?.success && data?.imageUrl) {
          setExerciseImages(prev => ({
            ...prev,
            [exercise.id]: data.imageUrl
          }));
          successCount++;
        }

        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Erro ao gerar imagem para ${exercise.name}:`, error);
        errorCount++;
      }
    }

    setGeneratingImages(false);
    setGenerationProgress({ current: 0, total: 0 });

    toast({
      title: "Geração concluída!",
      description: `${successCount} imagens geradas com sucesso. ${errorCount > 0 ? `${errorCount} erros.` : ''}`,
    });
  };


  const renderExerciseCard = (exercise: any) => (
    <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        {exerciseImages[exercise.id] && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img 
              src={exerciseImages[exercise.id]} 
              alt={exercise.name}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{exercise.name}</CardTitle>
            <CardDescription className="mt-1">
              {exercise.description_short}
            </CardDescription>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(exercise.id, file);
              }}
              disabled={uploadingImage === exercise.id}
            />
            <Button 
              size="icon" 
              variant="outline"
              disabled={uploadingImage === exercise.id}
              asChild
            >
              <span>
                <Upload className="h-4 w-4" />
              </span>
            </Button>
          </label>
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
                  {allExercises.length} exercícios • {allStretches.length} alongamentos
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

        {/* Botão de Geração Automática de Imagens */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Gerar Imagens com IA</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Gera automaticamente imagens otimizadas e leves de aparelhos para todos os exercícios
              </p>
              {!generatingImages && (
                <p className="text-xs text-muted-foreground mt-1">
                  {allExercises.filter((ex: any) => !exerciseImages[ex.id]).length} exercícios sem imagem
                </p>
              )}
            </div>
            <Button 
              onClick={generateAllImages}
              disabled={generatingImages || allExercises.filter((ex: any) => !exerciseImages[ex.id]).length === 0}
              className="gap-2 whitespace-nowrap"
              size="lg"
            >
              <Sparkles className="h-4 w-4" />
              {generatingImages 
                ? `${generationProgress.current}/${generationProgress.total}` 
                : 'Gerar Imagens'
              }
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="exercises">
              Exercícios ({exercises.length})
            </TabsTrigger>
            <TabsTrigger value="stretches">
              Alongamentos ({stretches.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map(renderExerciseCard)}
            </div>
            {exercises.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum exercício encontrado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stretches" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stretches.map(renderStretchCard)}
            </div>
            {stretches.length === 0 && (
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
