import { Button } from "@/components/ui/button";
import { Dumbbell, MessageSquare, PlayCircle, Sparkles, Clock, Video } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/20 px-5 py-2.5 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider text-accent">
                Inteligência Artificial 24/7
              </span>
            </div>
            
            <h1 className="mb-6 text-5xl font-black tracking-tight md:text-7xl lg:text-8xl">
              TRANSFORME SEU CORPO{" "}
              <span className="bg-gradient-cta bg-clip-text text-transparent">
                COM IA
              </span>
            </h1>
            
            <p className="mb-8 text-xl text-gray-300 md:text-2xl">
              <strong>Coach Virtual 24/7</strong> responde suas dúvidas instantaneamente sobre treinos, 
              nutrição e técnicas. Nunca treine sozinho novamente!
            </p>

            {/* Price CTA */}
            <div className="mb-10 rounded-2xl border-2 border-accent bg-gradient-cta p-8 shadow-intense">
              <div className="mb-3 text-sm font-bold uppercase tracking-widest">
                🔥 OFERTA EXCLUSIVA
              </div>
              <div className="mb-2 text-6xl font-black md:text-7xl">
                R$ 19,90
                <span className="text-2xl font-normal text-white/90">/mês</span>
              </div>
              <p className="text-lg font-medium">
                Acesso total ao seu personal trainer de IA
              </p>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button 
                size="lg" 
                className="h-14 gap-3 bg-primary text-lg font-bold shadow-glow hover:scale-105 hover:shadow-intense transition-all"
              >
                <Dumbbell className="h-6 w-6" />
                COMEÇAR AGORA
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 border-2 border-white/30 bg-white/10 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20"
              >
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
        
        {/* Gradient decoration */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/20 via-secondary/10 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      </section>

      {/* AI Coach Highlight */}
      <section className="border-y border-accent/30 bg-black/50 py-12 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <MessageSquare className="h-10 w-10 text-accent" />
              <h2 className="text-3xl font-black md:text-4xl">
                AGENTE DE IA DISPONÍVEL 24 HORAS
              </h2>
            </div>
            <p className="text-lg text-gray-300 md:text-xl">
              Converse com seu coach inteligente a qualquer momento. 
              Tire dúvidas sobre execução de exercícios, alimentação, suplementação e muito mais. 
              <strong className="text-accent"> Respostas instantâneas, sempre que precisar!</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-4xl font-black md:text-5xl">
            TUDO QUE VOCÊ PRECISA
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Dumbbell className="h-10 w-10" />}
              title="Treinos Personalizados"
              description="IA analisa seus objetivos e cria rotinas perfeitas para você ganhar massa ou emagrecer"
            />
            <FeatureCard
              icon={<Video className="h-10 w-10" />}
              title="Vídeos dos Aparelhos"
              description="Aprenda a usar cada aparelho da academia com vídeos e imagens detalhadas de execução"
            />
            <FeatureCard
              icon={<MessageSquare className="h-10 w-10" />}
              title="Coach IA 24/7"
              description="Tire dúvidas sobre treinos, nutrição e técnicas instantaneamente, qualquer hora do dia"
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10" />}
              title="Acompanhamento Inteligente"
              description="Sistema adapta seus treinos automaticamente conforme sua evolução e feedback"
            />
            <FeatureCard
              icon={<PlayCircle className="h-10 w-10" />}
              title="Tutoriais Completos"
              description="Biblioteca com demonstrações de como executar cada exercício corretamente"
            />
            <FeatureCard
              icon={<Sparkles className="h-10 w-10" />}
              title="Resultados Reais"
              description="Método comprovado combinando tecnologia de IA com ciência do treinamento esportivo"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-3xl border-4 border-accent bg-gradient-secondary p-12 text-center shadow-intense">
            <h2 className="mb-4 text-4xl font-black md:text-5xl">
              APENAS R$ 19,90/MÊS
            </h2>
            <p className="mb-8 text-xl font-medium">
              Menos que um lanche, mais que um personal trainer tradicional.
              <br />
              <strong>Comece sua transformação hoje!</strong>
            </p>
            <Button 
              size="lg" 
              className="h-16 gap-3 bg-black px-12 text-xl font-black text-white shadow-glow hover:scale-105 transition-all"
            >
              <Sparkles className="h-6 w-6" />
              GARANTIR MINHA VAGA
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="group rounded-2xl border-2 border-white/10 bg-black/40 p-8 backdrop-blur-sm transition-all hover:border-accent hover:shadow-glow hover:scale-105">
      <div className="mb-6 inline-flex rounded-xl bg-gradient-secondary p-4 text-white shadow-elegant transition-all group-hover:scale-110 group-hover:shadow-glow">
        {icon}
      </div>
      <h3 className="mb-3 text-2xl font-black">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default Index;
