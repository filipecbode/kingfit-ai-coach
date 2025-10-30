import { Button } from "@/components/ui/button";
import { Dumbbell, Zap, Users, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Powered by AI
              </span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
              Seu treino perfeito,{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                criado por IA
              </span>
            </h1>
            
            <p className="mb-10 text-lg text-muted-foreground md:text-xl">
              Treinos personalizados, coach virtual 24/7 e acompanhamento inteligente.
              Atinja seus objetivos com tecnologia de ponta.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 shadow-elegant">
                <Dumbbell className="h-5 w-5" />
                Começar agora
              </Button>
              <Button size="lg" variant="outline">
                Ver como funciona
              </Button>
            </div>
          </div>
        </div>
        
        {/* Gradient decoration */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Dumbbell className="h-8 w-8" />}
              title="Treinos Personalizados"
              description="IA cria seu treino ideal baseado em seus objetivos, nível e preferências"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Coach Virtual 24/7"
              description="Tire dúvidas sobre treinos, nutrição e suplementação a qualquer momento"
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Evolução Constante"
              description="Acompanhe seu progresso e receba ajustes automáticos no seu treino"
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
    <div className="group rounded-lg border bg-card p-6 transition-all hover:shadow-elegant">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
