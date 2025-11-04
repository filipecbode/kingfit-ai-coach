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
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [beforeRecord, setBeforeRecord] = useState<string>("");
  const [afterRecord, setAfterRecord] = useState<string>("");

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

      // Load all evolution records
      const { data: records } = await supabase
        .from("evolution_records")
        .select("*")
        .eq("user_id", user.id)
        .order("record_date", { ascending: false });

      if (records && records.length > 0) {
        setAllRecords(records);
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

      {allRecords.length >= 2 && !showComparison && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Comparação de Evolução</h2>
          <p className="text-muted-foreground mb-4">
            Compare duas evoluções para ver seu progresso!
          </p>
          <Button onClick={() => setShowComparison(true)} className="w-full">
            Ver Antes e Depois
          </Button>
        </Card>
      )}

      {showComparison && allRecords.length >= 2 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Antes e Depois</CardTitle>
              <CardDescription>
                Compare sua evolução ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="before">Antes (Registro Antigo)</Label>
                      <select
                        id="before"
                        className="w-full mt-2 p-2 border rounded-md"
                        value={beforeRecord}
                        onChange={(e) => setBeforeRecord(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {allRecords.map((record) => (
                          <option key={record.id} value={record.id}>
                            {new Date(record.record_date).toLocaleDateString('pt-BR')} - {record.weight}kg
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="after">Depois (Registro Recente)</Label>
                      <select
                        id="after"
                        className="w-full mt-2 p-2 border rounded-md"
                        value={afterRecord}
                        onChange={(e) => setAfterRecord(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {allRecords.map((record) => (
                          <option key={record.id} value={record.id}>
                            {new Date(record.record_date).toLocaleDateString('pt-BR')} - {record.weight}kg
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {beforeRecord && afterRecord && (() => {
                    const before = allRecords.find(r => r.id === beforeRecord);
                    const after = allRecords.find(r => r.id === afterRecord);
                    
                    if (!before || !after) return null;
                    
                    const weightDiff = after.weight - before.weight;
                    
                    return (
                      <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Antes</CardTitle>
                              <CardDescription>
                                {new Date(before.record_date).toLocaleDateString('pt-BR')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold mb-4">{before.weight} kg</p>
                              {before.notes && (
                                <p className="text-sm text-muted-foreground">{before.notes}</p>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Depois</CardTitle>
                              <CardDescription>
                                {new Date(after.record_date).toLocaleDateString('pt-BR')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-2xl font-bold mb-4">{after.weight} kg</p>
                              {after.notes && (
                                <p className="text-sm text-muted-foreground">{after.notes}</p>
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        <Card className={`${weightDiff < 0 ? 'border-green-500/50' : weightDiff > 0 ? 'border-yellow-500/50' : ''}`}>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-2">Diferença</p>
                              <p className={`text-3xl font-bold ${weightDiff < 0 ? 'text-green-600' : weightDiff > 0 ? 'text-yellow-600' : ''}`}>
                                {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="space-y-4">
                          <h4 className="font-semibold">Fotos da Evolução</h4>
                          
                          {(before.front_photo_url || after.front_photo_url) && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Frente</p>
                              <div className="grid grid-cols-2 gap-4">
                                {before.front_photo_url ? (
                                  <img src={before.front_photo_url} alt="Antes - Frente" className="w-full h-48 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Sem foto</div>
                                )}
                                {after.front_photo_url ? (
                                  <img src={after.front_photo_url} alt="Depois - Frente" className="w-full h-48 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Sem foto</div>
                                )}
                              </div>
                            </div>
                          )}

                          {(before.side_photo_url || after.side_photo_url) && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Lado</p>
                              <div className="grid grid-cols-2 gap-4">
                                {before.side_photo_url ? (
                                  <img src={before.side_photo_url} alt="Antes - Lado" className="w-full h-48 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Sem foto</div>
                                )}
                                {after.side_photo_url ? (
                                  <img src={after.side_photo_url} alt="Depois - Lado" className="w-full h-48 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Sem foto</div>
                                )}
                              </div>
                            </div>
                          )}

                          {(before.back_photo_url || after.back_photo_url) && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Costas</p>
                              <div className="grid grid-cols-2 gap-4">
                                {before.back_photo_url ? (
                                  <img src={before.back_photo_url} alt="Antes - Costas" className="w-full h-48 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Sem foto</div>
                                )}
                                {after.back_photo_url ? (
                                  <img src={after.back_photo_url} alt="Depois - Costas" className="w-full h-48 object-cover rounded-lg" />
                                ) : (
                                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">Sem foto</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <Button 
                    variant="outline" 
                    onClick={() => setShowComparison(false)}
                    className="w-full"
                  >
                    Fechar Comparação
                  </Button>
                </div>
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