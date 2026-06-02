/**
 * SplashScreen.tsx
 * Tela de abertura animada com logo + barra de progresso.
 * Dura ~2s e depois chama onFinish() para liberar o app.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Incrementa a barra em ~16ms frames até 100%
    let frame: number;
    const duration = 1800; // ms total do splash
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        // Pequeno delay depois de 100% antes de sumir
        setTimeout(onFinish, 300);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
    >
      {/* Logo animado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-5 mb-12"
      >
        {/* Ícone */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary blur-2xl opacity-50 scale-110" />
          <div className="relative w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
            <Dumbbell className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
        </div>

        {/* Nome */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-none">
            Performance
          </h1>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary leading-none">
            Protocol
          </h1>
        </div>

        <p className="text-sm text-white/40 tracking-widest uppercase">
          Carregando
        </p>
      </motion.div>

      {/* Barra de progresso */}
      <div className="w-48 h-[3px] rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
