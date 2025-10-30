import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ArrowLeft, TrendingUp } from "lucide-react";

const motivationalMessages = [
  "Cada foto é uma prova do seu progresso! Continue firme! 💪",
  "Você está construindo a melhor versão de si mesmo! 🔥",
  "O caminho pode ser longo, mas cada passo conta! 🚀",
  "Seu esforço de hoje é o corpo dos seus sonhos amanhã! ⭐",
  "Evolução é sobre consistência, não perfeição! 🎯",
  "Você já percorreu tanto, olhe onde chegou! 👏",
];

export default function Evolution() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [motivationalMessage] = useState(
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );
  const [previousRecords, setPreviousRecords] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    checkLastRecord();
    loadPreviousRecords();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const checkLastRecord = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: records } = await supabase
      .from("evolution_records")
      .select("record_date")
      .eq("user_id", user.id)
      .order("record_date", { ascending: false })
      .limit(1);

    if (!records || records.length === 0) {
      setCanRecord(true);
      return;
    }

    const lastRecordDate = new Date(records[0].record_date);
    const today = new Date();
    const nextAllowedDate = new Date(lastRecordDate);
    nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1);

    if (today >= nextAllowedDate) {
      setCanRecord(true);
    } else {
      const diffTime = nextAllowedDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    }
  };

  const loadPreviousRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: records } = await supabase
      .from("evolution_records")
      .select("*")
      .eq("user_id", user.id)
      .order("record_date", { ascending: false })
      .limit(6);

    if (records) {
      setPreviousRecords(records);
    }
  };

  const uploadPhoto = async (file: File, type: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${type}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('evolution-photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('evolution-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!weight || !frontPhoto || !sidePhoto || !backPhoto) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o peso e adicione as 3 fotos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const frontUrl = await uploadPhoto(frontPhoto, 'front');
      const sideUrl = await uploadPhoto(sidePhoto, 'side');
      const backUrl = await uploadPhoto(backPhoto, 'back');

      if (!frontUrl || !sideUrl || !backUrl) {
        throw new Error('Erro ao fazer upload das fotos');
      }

      const { error } = await supabase
        .from('evolution_records')
        .insert({
          user_id: user.id,
          weight: parseFloat(weight),
          front_photo_url: frontUrl,
          side_photo_url: sideUrl,
          back_photo_url: backUrl,
          notes: notes || null,
        });

      if (error) throw error;

      // Update profile weight
      await supabase
        .from('profiles')
        .update({ weight: parseFloat(weight) })
        .eq('id', user.id);

      toast({
        title: "Evolução registrada! 🎉",
        description: "Que tal gerar um novo plano de treino adaptado ao seu progresso?",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error('Error saving evolution:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível registrar sua evolução. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2" /> Voltar
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Evolução
          </h1>
          <p className="text-muted-foreground italic">{motivationalMessage}</p>
        </div>

        {!canRecord ? (
          <Card className="p-8 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">Aguarde um pouco mais!</h2>
            <p className="text-muted-foreground mb-4">
              Você poderá registrar sua próxima evolução em:
            </p>
            <div className="text-5xl font-bold text-primary mb-2">
              {daysRemaining}
            </div>
            <p className="text-muted-foreground">
              {daysRemaining === 1 ? "dia" : "dias"}
            </p>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="weight">Peso Atual (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ex: 75.5"
                />
              </div>

              <div>
                <Label>Foto de Frente *</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFrontPhoto(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <Label>Foto de Lado *</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSidePhoto(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <Label>Foto de Costas *</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBackPhoto(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Como você está se sentindo? Alguma conquista especial?"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2" />
                    Registrar Evolução
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {previousRecords.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Histórico de Evolução</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previousRecords.map((record) => (
                <Card key={record.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        {new Date(record.record_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-2xl font-bold text-primary">{record.weight} kg</p>
                    </div>
                  </div>
                  {record.notes && (
                    <p className="text-sm text-muted-foreground mb-3">{record.notes}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    {record.front_photo_url && (
                      <img
                        src={record.front_photo_url}
                        alt="Frente"
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                    {record.side_photo_url && (
                      <img
                        src={record.side_photo_url}
                        alt="Lado"
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                    {record.back_photo_url && (
                      <img
                        src={record.back_photo_url}
                        alt="Costas"
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}