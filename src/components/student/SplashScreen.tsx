import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Trava a rolagem da página por baixo
    document.body.style.overflow = "hidden";
    
    // Auto-destruição em 6 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = "auto";
    }, 6000);
    
    return () => {
      document.body.style.overflow = "auto";
      clearTimeout(timer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      onClick={() => { setIsVisible(false); document.body.style.overflow = "auto"; }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999, backgroundColor: "#0B0B0C", color: "#F5F5F5",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "32px", textAlign: "center", cursor: "pointer",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#B11226", marginBottom: "24px" }}>
        Elite Hub
      </div>
      
      <div style={{ width: "1px", height: "48px", backgroundColor: "#B11226", marginBottom: "32px" }} />

      <h1 style={{ fontFamily: "serif", fontWeight: 700, fontSize: "clamp(2rem, 8vw, 3.5rem)", lineHeight: 1.1, margin: 0 }}>
        Bem-vindo à sua
      </h1>
      <h2 style={{ fontFamily: "serif", fontWeight: 700, fontStyle: "italic", color: "#B11226", fontSize: "clamp(2rem, 8vw, 3.5rem)", lineHeight: 1.1, marginBottom: "32px" }}>
        nova fase.
      </h2>

      <p style={{ fontSize: "14px", color: "#8B8B92", lineHeight: 1.6, maxWidth: "340px", marginBottom: "48px" }}>
        Este é o ponto de partida para uma transformação construída com estratégia, acompanhamento e comprometimento.
        <br /><br />
        Nós fornecemos o caminho. Você constrói o resultado.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#55555C" }}>
        <Sparkles size={16} color="#B11226" />
        Toque para começar
        <div style={{ width: "28px", height: "1px", backgroundColor: "#55555C" }} />
      </div>

      <div style={{ position: "absolute", bottom: "32px", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#55555C" }}>
        By Rennan João
      </div>
    </div>
  );
};
