import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell } from "lucide-react";

const Onboarding = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    goal: "",
    health_issues: "",
    days_per_week: "",
    hours_per_day: "",
    experience_level: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        name: formData.name,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        gender: formData.gender,
        goal: formData.goal,
        health_issues: formData.health_issues || null,
        days_per_week: parseInt(formData.days_per_week),
        hours_per_day: parseFloat(formData.hours_per_day),
        experience_level: formData.experience_level,
      });

      if (error) throw error;

      toast({
        title: "Perfil criado com sucesso!",
        description: "Gerando seu plano de treinos personalizado...",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao criar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="h-12 w-12 text-primary" />
            <span className="text-4xl font-black">KINGFIT</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete seu perfil</h1>
          <p className="text-muted-foreground">
            Vamos personalizar seus treinos com base nas suas informações
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                placeholder="João Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  required
                  min="14"
                  max="100"
                  placeholder="25"
                />
              </div>

              <div>
                <Label htmlFor="gender">Sexo</Label>
                <Select value={formData.gender} onValueChange={(value) => updateField("gender", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  required
                  placeholder="70.5"
                />
              </div>

              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => updateField("height", e.target.value)}
                  required
                  placeholder="175"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="goal">Qual é o seu objetivo?</Label>
              <Input
                id="goal"
                value={formData.goal}
                onChange={(e) => updateField("goal", e.target.value)}
                required
                placeholder="Ex: Perder peso, ganhar massa, melhorar condicionamento"
              />
            </div>

            <div>
              <Label htmlFor="experience_level">Nível de experiência</Label>
              <Select value={formData.experience_level} onValueChange={(value) => updateField("experience_level", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="days_per_week">Dias por semana</Label>
                <Select value={formData.days_per_week} onValueChange={(value) => updateField("days_per_week", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Quantos dias?" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day} {day === 1 ? "dia" : "dias"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hours_per_day">Horas por dia</Label>
                <Select value={formData.hours_per_day} onValueChange={(value) => updateField("hours_per_day", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Quanto tempo?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">30 min</SelectItem>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="1.5">1h 30min</SelectItem>
                    <SelectItem value="2">2 horas</SelectItem>
                    <SelectItem value="2.5">2h 30min</SelectItem>
                    <SelectItem value="3">3 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="health_issues">Possui algum problema de saúde ou restrição física?</Label>
              <Textarea
                id="health_issues"
                value={formData.health_issues}
                onChange={(e) => updateField("health_issues", e.target.value)}
                placeholder="Descreva qualquer problema de saúde, lesão ou restrição física (opcional)"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Criando perfil..." : "Criar Perfil e Gerar Treinos"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
