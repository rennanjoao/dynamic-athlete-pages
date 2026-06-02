import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Fecha automaticamente após 6 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      closeSplash();
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const closeSplash = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 700); // Tempo da animação de saída
  };

  if (!isVisible) return null;

  return (
    <div
      onClick={closeSplash}
      className={`fixed inset-0 z-[1000] bg-[#0B0B0C] text-white flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isAnimatingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <div className="text-[0.6rem] font-semibold tracking-[0.3em] uppercase text-[#B11226] mb-5 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        Elite Hub
      </div>
      
      <div className="w-px h-12 bg-[#B11226] mb-8 animate-fade-in-up" style={{ animationDelay: '0.35s', animationFillMode: 'both' }} />

      <h1 className="font-serif font-bold text-4xl md:text-6xl leading-tight mb-2 animate-fade-in-up" style={{ animationDelay: '0.55s', animationFillMode: 'both' }}>
        Bem-vindo à sua
      </h1>
      <h2 className="font-serif font-bold italic text-[#B11226] text-4xl md:text-6xl leading-tight mb-8 animate-fade-in-up" style={{ animationDelay: '0.78s', animationFillMode: 'both' }}>
        nova fase.
      </h2>

      <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-md animate-fade-in-up" style={{ animationDelay: '1.1s', animationFillMode: 'both' }}>
        Este é o ponto de partida para uma transformação construída com estratégia, acompanhamento e comprometimento.
        <br /><br />
        Nós fornecemos o caminho. Você constrói o resultado.
      </p>

      <div className="mt-12 flex items-center gap-3 text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-gray-500 animate-fade-in-up" style={{ animationDelay: '1.5s', animationFillMode: 'both' }}>
        <Sparkles className="w-4 h-4 text-[#B11226]" />
        Toque para começar
        <div className="w-7 h-px bg-gray-500" />
      </div>

      <div className="absolute bottom-8 text-[0.6rem] tracking-[0.2em] uppercase text-gray-600 animate-fade-in-up" style={{ animationDelay: '1.8s', animationFillMode: 'both' }}>
        By Rennan João
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s ease forwards;
        }
      `}</style>
    </div>
  );
};
