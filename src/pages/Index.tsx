import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Plus, Dumbbell, UtensilsCrossed, ArrowRight, Zap, Shield, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { InfoChatBot } from "@/components/landing/InfoChatBot";
import RankingTeaser from "@/components/gamification/RankingTeaser";

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

const StatBlock = ({ value, label, noTranslate }: { value: string; label: string; noTranslate?: boolean }) => (
  <div className="text-center">
    <p className="text-3xl font-extrabold text-gradient" translate={noTranslate ? "no" : undefined}>{value}</p>
    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90 dark:opacity-100" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(350_89%_50%/0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(350_89%_50%/0.06),transparent_50%)]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground dark:text-white/80">Rennan João · Performance Coaching</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-foreground dark:text-white mb-10 tracking-tighter">
              Elite Lab <span className="text-primary">Hub</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground dark:text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Plataforma de acompanhamento técnico para alunos em busca de evolução real em treino, nutrição e saúde.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2 rounded-xl px-8 h-12 text-base glow-primary">
                  <Users className="w-5 h-5" />
                  Área do Aluno
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

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="glass rounded-2xl p-8 mt-16 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-8">
              <StatBlock value="10+" label="Modalidades" />
              <StatBlock value="100%" label="Personalizado" />
          <StatBlock value="24/7" label="Acesso" noTranslate />            </div>
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Recursos Premium</h2>
          <p className="text-muted-foreground">Tudo que você precisa para resultados de elite</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard icon={Dumbbell} title="Treinos Inteligentes" description="Protocolos com RPE, cadência, séries e descanso. Modalidades de Bodybuilding, Triathlon, BJJ e mais." delay={0.1} />
          <FeatureCard icon={UtensilsCrossed} title="Estratégias Nutricionais" description="Diretrizes e recomendações alimentares para apoiar seus objetivos de emagrecimento, saúde e performance." delay={0.2} />
          <FeatureCard icon={TrendingUp} title="Painel de Evolução" description="Visualize sua evolução através de métricas corporais, registros fotográficos e indicadores de performance ao longo do processo." delay={0.3} />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto">
          <RankingTeaser />
        </motion.div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="glass rounded-2xl p-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Dados protegidos com criptografia e Row Level Security</span>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Elite Lab Hub — Rennan João</p>
      </footer>

      <InfoChatBot />
    </div>
  );
};

export default Index;
