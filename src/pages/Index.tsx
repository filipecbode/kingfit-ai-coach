import { Button } from "@/components/ui/button";
import { Dumbbell, MessageSquare, PlayCircle, Sparkles, Clock, Video, Check } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-2xl font-black">KINGFIT</span>
          </div>
          <Button variant="outline" className="border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20">
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/20 px-5 py-2.5 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="text-sm font-bold uppercase tracking-wider text-accent">
                  Inteligência Artificial
                </span>
              </div>
              
              <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
                Mais resultados e{" "}
                <span className="relative">
                  <span className="bg-gradient-cta bg-clip-text text-transparent">
                    economia
                  </span>
                </span>
                {" "}para quem importa:{" "}
                <span className="relative inline-block rounded-2xl bg-primary px-6 py-2 shadow-glow">
                  VOCÊ.
                </span>
              </h1>
              
              <p className="mb-8 text-xl text-gray-300">
                Coach de IA 24/7, treinos personalizados e vídeos dos aparelhos.
                Tudo que você precisa em um só lugar.
              </p>
              
              <Button 
                size="lg" 
                className="h-16 gap-3 bg-gradient-secondary px-8 text-lg font-bold shadow-intense hover:scale-105 transition-all"
              >
                COMEÇAR TESTE GRÁTIS
              </Button>
              
              <p className="mt-4 text-sm text-gray-400">
                <strong className="text-accent">Teste gratuitamente por 7 dias.</strong> Cobrança apenas a partir do 8º dia.
              </p>
            </div>
            
            <div className="relative">
              <div className="relative z-10 mx-auto max-w-md">
                <div className="aspect-[9/16] rounded-3xl border-8 border-white/10 bg-gradient-to-br from-primary/20 to-secondary/20 p-8 shadow-intense backdrop-blur-sm">
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <Dumbbell className="h-20 w-20 text-accent" />
                    <p className="text-xl font-bold">App KingFit</p>
                    <p className="text-sm text-gray-300">Preview em breve</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -left-10 bottom-10 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-full w-1/3">
          <div className="flex h-full flex-col justify-evenly">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent"
                style={{ width: `${100 - i * 10}%`, marginLeft: 'auto' }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-y border-white/10 bg-black/40 py-16 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4 text-lg text-gray-300">
            Você quer transformar seu corpo.
          </p>
          <h2 className="mb-6 text-4xl font-black md:text-5xl">
            O KingFit quer <span className="bg-gradient-cta bg-clip-text text-transparent">transformar sua jornada.</span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-300">
            Otimizamos sua rotina fitness com IA para você ter mais resultados e gastar menos tempo planejando.
            Personal trainer, nutricionista e coach - tudo em um app.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-4xl font-black md:text-5xl">
              PLANO ÚNICO
            </h2>
            <p className="mb-12 text-center text-xl text-gray-300">
              Sem taxas escondidas. Sem complicação. Apenas resultados.
            </p>
            
            <div className="rounded-3xl border-4 border-accent bg-gradient-to-br from-black/60 to-black/40 p-10 shadow-intense backdrop-blur-sm md:p-12">
              <div className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/20 px-5 py-2.5">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span className="text-sm font-bold uppercase tracking-wider text-accent">
                    7 dias grátis
                  </span>
                </div>
                
                <div className="mb-4">
                  <span className="text-2xl font-medium text-gray-400 line-through">R$ 49,90</span>
                </div>
                
                <div className="mb-4 text-7xl font-black md:text-8xl">
                  R$ 19,90
                  <span className="text-2xl font-normal text-gray-400">/mês</span>
                </div>
                
                <p className="text-lg font-medium text-accent">
                  Menos de R$ 0,70 por dia
                </p>
              </div>
              
              <div className="mb-8 space-y-4">
                <BenefitItem text="Treinos personalizados por IA" />
                <BenefitItem text="Coach virtual disponível 24/7" />
                <BenefitItem text="Vídeos e imagens de todos os aparelhos" />
                <BenefitItem text="Acompanhamento de progresso inteligente" />
                <BenefitItem text="Dicas de nutrição e suplementação" />
                <BenefitItem text="Atualizações constantes de treinos" />
                <BenefitItem text="Suporte prioritário" />
              </div>
              
              <Button 
                size="lg" 
                className="h-16 w-full gap-3 bg-gradient-cta text-xl font-black shadow-glow hover:scale-105 transition-all"
              >
                <Sparkles className="h-6 w-6" />
                COMEÇAR AGORA - 7 DIAS GRÁTIS
              </Button>
              
              <p className="mt-4 text-center text-sm text-gray-400">
                Cancele quando quiser. Sem multas. Sem burocracia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-4xl font-black md:text-5xl">
            TUDO QUE VOCÊ PRECISA
          </h2>
          <p className="mb-12 text-center text-xl text-gray-300">
            Tecnologia de ponta para maximizar seus resultados
          </p>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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

interface BenefitItemProps {
  text: string;
}

const BenefitItem = ({ text }: BenefitItemProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 rounded-full bg-accent/20 p-1">
        <Check className="h-5 w-5 text-accent" />
      </div>
      <span className="text-lg font-medium">{text}</span>
    </div>
  );
};

export default Index;
