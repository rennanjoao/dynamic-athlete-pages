import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Users, Plus, Calendar, Activity, Dumbbell, UtensilsCrossed, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { InfoChatBot } from "@/components/landing/InfoChatBot";

interface Aluno {
  id: string;
  nome: string;
  descricao: string;
  dataInicio: string;
}

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="glass rounded-2xl p-6 card-hover group"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-primary transition-all duration-500">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="font-bold text-lg text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </motion.div>
);

const StatBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <p className="text-3xl font-extrabold text-gradient">{value}</p>
    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
  </div>
);

const Index = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlunos = async () => {
      try {
        const response = await fetch("/data/alunos.json");
        if (!response.ok) throw new Error("Erro ao carregar alunos");
        const data = await response.json();
        setAlunos(data);
      } catch (error) {
        toast.error("Erro ao carregar lista de alunos");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadAlunos();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(350_89%_50%/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(350_89%_50%/0.06),transparent_50%)]" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground dark:text-white/80">Elite Performance Platform</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-foreground dark:text-white mb-6 tracking-tighter">
              Elite Athlete
              <span className="text-gradient block">Hub</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground dark:text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Plataforma de gestão de performance esportiva com tecnologia de ponta para atletas e treinadores de elite.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2 rounded-xl px-8 h-12 text-base glow-primary">
                  <Users className="w-5 h-5" />
                  Área do Atleta
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/fitness">
                <Button size="lg" className="gap-2 rounded-xl px-8 h-12 text-base bg-secondary hover:bg-secondary/80 text-foreground">
                  <Activity className="w-5 h-5" />
                  Painel Fitness
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/admin-login">
                <Button variant="outline" size="lg" className="gap-2 rounded-xl px-8 h-12 text-base border-border/50 hover:bg-primary/10 hover:border-primary/30">
                  <Plus className="w-5 h-5" />
                  Área do Treinador
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glass rounded-2xl p-8 mt-16 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-3 gap-8">
              <StatBlock value="10+" label="Templates" />
              <StatBlock value="100%" label="Personalizado" />
              <StatBlock value="24/7" label="Acesso" />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Recursos Premium</h2>
          <p className="text-muted-foreground">Tudo que você precisa para resultados de elite</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Dumbbell}
            title="Treinos Inteligentes"
            description="Protocolos com RPE, cadência, séries e descanso. Templates de Bodybuilding, Triathlon, BJJ e mais."
            delay={0.1}
          />
          <FeatureCard
            icon={UtensilsCrossed}
            title="Nutrição Avançada"
            description="Planos alimentares detalhados com macros, suplementação e horários otimizados."
            delay={0.2}
          />
          <FeatureCard
            icon={TrendingUp}
            title="Analytics de Performance"
            description="Gráficos de evolução com dados de composição corporal, dobras cutâneas e medidas."
            delay={0.3}
          />
        </div>
      </section>

      {/* Athletes List */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Atletas</h2>
            <p className="text-sm text-muted-foreground">Gerencie seus atletas cadastrados</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alunos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Nenhum atleta cadastrado</h3>
            <p className="text-muted-foreground mb-8">Comece criando o primeiro plano personalizado</p>
            <Link to="/admin-login">
              <Button className="gap-2 rounded-xl px-8">
                <Plus className="w-5 h-5" />
                Criar Primeiro Atleta
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alunos.map((aluno, idx) => (
              <motion.div
                key={aluno.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <div className="glass rounded-2xl p-6 card-hover group hover:border-primary/20">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:glow-primary transition-all duration-500">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(aluno.dataInicio).toLocaleDateString("pt-BR")}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">{aluno.nome}</h3>
                  <p className="text-sm text-muted-foreground mb-5 line-clamp-2">{aluno.descricao}</p>

                  <Link to={`/student?id=${aluno.id}`}>
                    <Button className="w-full gap-2 rounded-xl" size="sm">
                      Ver Plano
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Security Badge */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="glass rounded-2xl p-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Dados protegidos com criptografia e Row Level Security</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
        <p className="text-xs text-muted-foreground">© 2024 Elite Athlete Hub — Performance Management Platform</p>
      </footer>

      <InfoChatBot />
    </div>
  );
};

export default Index;
