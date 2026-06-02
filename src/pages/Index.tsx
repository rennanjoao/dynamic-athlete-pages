import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Plus, Dumbbell, UtensilsCrossed, ArrowRight, Zap, Shield, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const StatBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="text-center">
    <p className="text-3xl font-extrabold text-gradient">{value}</p>
    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
  </div>
);

const Index = () => {
  // ESTADO QUE CONTROLA O SPLASH SCREEN
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Trava o scroll da página enquanto o splash estiver visível
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Auto-fecha após 6 segundos
    const timer = setTimeout(() => setShowSplash(false), 6000);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'unset';
    };
  }, [showSplash]);

  return (
    <div className="min-h-screen bg-background">
      
      {/* ─── INÍCIO DO SPLASH SCREEN EMBUTIDO ─── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => setShowSplash(false)}
            className="fixed inset-0 z-[999999] bg-[#0B0B0C] text-[#F5F5F5] flex flex-col items-center justify-center p-8 text-center cursor-pointer"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}
              className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#B11226] mb-6"
            >
              Elite Hub
            </motion.div>
            
            <motion.div 
              initial={{ height: 0 }} animate={{ height: 48 }} transition={{ delay: 0.35, duration: 0.5 }}
              className="w-px bg-[#B11226] mb-8" 
            />

            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.7 }}
              className="font-serif font-bold text-4xl md:text-6xl leading-tight mb-2"
            >
              Bem-vindo à sua
            </motion.h1>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78, duration: 0.7 }}
              className="font-serif font-bold italic text-[#B11226] text-4xl md:text-6xl leading-tight mb-8"
            >
              nova fase.
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }}
              className="text-sm md:text-base text-[#8B8B92] leading-relaxed max-w-sm mb-12"
            >
              Este é o ponto de partida para uma transformação construída com estratégia, acompanhamento e comprometimento.
              <br /><br />
              Nós fornecemos o caminho. Você constrói o resultado.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.7 }}
              className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#55555C]"
            >
              <Sparkles className="w-4 h-4 text-[#B11226]" />
              Toque para começar
              <div className="w-7 h-px bg-[#55555C]" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.7 }}
              className="absolute bottom-8 text-[10px] tracking-[0.2em] uppercase text-[#55555C]"
            >
              By Rennan João
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ─── FIM DO SPLASH SCREEN ─── */}

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
              <span className="text-xs font-medium text-foreground dark:text-white/80">Rennan João · Performance Coaching</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-foreground dark:text-white mb-3 tracking-tighter">
              Elite Lab <span className="text-primary">Hub</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground dark:text-white/50 mb-6 uppercase tracking-widest">
              Rennan João
            </p>

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

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="glass rounded-2xl p-8 mt-16 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-3 gap-8">
              <StatBlock value="10+" label="Modalidades" />
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
            description="Protocolos com RPE, cadência, séries e descanso. Modalidades de Bodybuilding, Triathlon, BJJ e mais."
            delay={0.1}
          />
          <FeatureCard
            icon={UtensilsCrossed}
            title="Estratégias Nutricionais"
            description="Diretrizes e recomendações alimentares para apoiar seus objetivos de emagrecimento, saúde e performance."
            delay={0.2}
          />
