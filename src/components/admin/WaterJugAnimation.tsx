import { useEffect, useState } from "react";

interface WaterJugAnimationProps {
  waterAmountLiters: number;
  className?: string;
}

export const WaterJugAnimation = ({ waterAmountLiters, className = "" }: WaterJugAnimationProps) => {
  const [currentFill, setCurrentFill] = useState(0);
  const maxLiters = 10;
  const fillPercentage = Math.min((waterAmountLiters / maxLiters) * 100, 100);

  useEffect(() => {
    // Animate fill on mount and when waterAmountLiters changes
    const timer = setTimeout(() => {
      setCurrentFill(fillPercentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [fillPercentage]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative w-32 h-48">
        <svg
          viewBox="0 0 100 150"
          className="w-full h-full"
          role="img"
          aria-label={`Galão de água com ${waterAmountLiters.toFixed(1)} litros`}
        >
          <title>Galão de água de 10 litros</title>
          <desc>Indicador visual mostrando {waterAmountLiters.toFixed(1)} litros de 10 litros</desc>
          
          {/* Jug outline */}
          <path
            d="M 30 20 L 30 10 L 70 10 L 70 20 L 75 20 L 75 145 L 25 145 L 25 20 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
          
          {/* Handle */}
          <path
            d="M 75 40 Q 85 50 85 65 Q 85 80 75 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-border"
          />
          
          {/* Water fill - animated */}
          <rect
            x="27"
            y={145 - (currentFill * 1.25)}
            width="46"
            height={currentFill * 1.25}
            className="text-primary transition-all duration-1000 ease-out motion-reduce:transition-none"
            fill="currentColor"
            opacity="0.6"
          />
          
          {/* Scale marks */}
          {[0, 2, 4, 6, 8, 10].map((mark) => {
            const y = 145 - (mark / maxLiters) * 125;
            return (
              <g key={mark}>
                <line
                  x1="20"
                  y1={y}
                  x2="25"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-muted-foreground"
                />
                <text
                  x="15"
                  y={y + 3}
                  fontSize="8"
                  textAnchor="end"
                  className="fill-muted-foreground"
                >
                  {mark}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {waterAmountLiters.toFixed(1)} L
        </p>
        <p className="text-xs text-muted-foreground">
          {fillPercentage.toFixed(0)}% de 10 L
        </p>
      </div>
    </div>
  );
};
