import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, TrendingUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AiChat } from "@/components/AiChat";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const motivationalMessages = [
  "Sua jornada de transformação está apenas começando! 💪",
  "Cada dia é uma nova oportunidade de evoluir! 🌟",
  "O progresso é feito de pequenas vitórias diárias! 🎯",
  "Você está mais forte do que ontem! 🔥",
  "A consistência é a chave do sucesso! ⭐",
  "Acredite no processo, os resultados virão! 🚀",
  "Você está construindo a melhor versão de si mesmo! 💎",
];

export default function Evolution() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [lastRecord, setLastRecord] = useState<any>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [daysUntilNext, setDaysUntilNext] = useState(0);
  const [motivationalMessage] = useState(
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // Load last evolution record
      const { data: records } = await supabase
        .from("evolution_records")
        .select("*")
        .eq("user_id", user.id)
        .order("record_date", { ascending: false })
        .limit(1);

      if (records && records.length > 0) {
        setLastRecord(records[0]);
        
        // Check if can submit new record (7 days since last)
        const lastDate = new Date(records[0].record_date);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Show warning if more than 30 days without logging
        if (daysDiff >= 30) {
          setShowWarning(true);
        }
        
        if (daysDiff >= 7) {
          setCanSubmit(true);
          setDaysUntilNext(0);
        } else {
          setCanSubmit(false);
          setDaysUntilNext(7 - daysDiff);
        }
      } else {
        setCanSubmit(true);
        setDaysUntilNext(0);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File, type: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${type}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('evolution-photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading photo:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('evolution-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu peso atual.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload photos
      const frontPhotoUrl = frontPhoto ? await uploadPhoto(frontPhoto, "front") : null;
      const sidePhotoUrl = sidePhoto ? await uploadPhoto(sidePhoto, "side") : null;
      const backPhotoUrl = backPhoto ? await uploadPhoto(backPhoto, "back") : null;

      // Insert record
      const { error } = await supabase
        .from("evolution_records")
        .insert({
          user_id: user.id,
          weight: parseFloat(weight),
          front_photo_url: frontPhotoUrl,
          side_photo_url: sidePhotoUrl,
          back_photo_url: backPhotoUrl,
          notes: notes,
        });

      if (error) throw error;

      // Update profile weight
      await supabase
        .from("profiles")
        .update({ weight: parseFloat(weight) })
        .eq("id", user.id);

      toast({
        title: "Evolução registrada! 🎉",
        description: "Seu progresso foi salvo. Que tal gerar um novo plano de treino adaptado?",
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting evolution:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar sua evolução.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-2xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              {motivationalMessage}
            </CardTitle>
          </CardHeader>
        </Card>

        {!canSubmit ? (
          <Card>
            <CardHeader>
              <CardTitle>Próxima Evolução em {daysUntilNext} dias</CardTitle>
              <CardDescription>
                Você poderá registrar sua próxima evolução em breve!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={((7 - daysUntilNext) / 7) * 100} className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Continue firme nos treinos! Em {daysUntilNext} dias você poderá registrar sua evolução semanal.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Registre Sua Evolução</CardTitle>
              <CardDescription>
                Acompanhe seu progresso com fotos e medidas semanais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="weight">Peso Atual (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={profile?.weight || "Ex: 75.5"}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <Label>Fotos da Evolução</Label>
                  <p className="text-sm text-muted-foreground">
                    Envie 3 fotos para melhor acompanhamento
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="front-photo" className="cursor-pointer">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary transition-colors text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Foto de Frente</p>
                          {frontPhoto && <p className="text-xs text-primary mt-1">✓ Selecionada</p>}
                        </div>
                      </Label>
                      <Input
                        id="front-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setFrontPhoto(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="side-photo" className="cursor-pointer">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary transition-colors text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Foto de Lado</p>
                          {sidePhoto && <p className="text-xs text-primary mt-1">✓ Selecionada</p>}
                        </div>
                      </Label>
                      <Input
                        id="side-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setSidePhoto(e.target.files?.[0] || null)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="back-photo" className="cursor-pointer">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary transition-colors text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Foto de Costas</p>
                          {backPhoto && <p className="text-xs text-primary mt-1">✓ Selecionada</p>}
                        </div>
                      </Label>
                      <Input
                        id="back-photo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setBackPhoto(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Como você está se sentindo? Houve mudanças na alimentação ou rotina?"
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={uploading}>
                  {uploading ? "Salvando..." : "Registrar Evolução"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {lastRecord && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Último Registro</CardTitle>
              <CardDescription>
                {new Date(lastRecord.record_date).toLocaleDateString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                <strong>Peso:</strong> {lastRecord.weight} kg
              </p>
              {lastRecord.notes && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Observações:</strong> {lastRecord.notes}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Lembrete de Evolução
            </AlertDialogTitle>
            <AlertDialogDescription>
              Já faz mais de 30 dias desde seu último registro de evolução! 
              Acompanhar seu progresso regularmente é importante para alcançar seus objetivos. 
              Que tal registrar sua evolução agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarning(false)}>
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AiChat />
    </div>
  );
}