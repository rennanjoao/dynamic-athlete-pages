import { Card } from "@/components/ui/card";

interface WaterBottle2DProps {
  waterAmountLiters: number;
  className?: string;
}

export const WaterBottle2D = ({ waterAmountLiters, className = "" }: WaterBottle2DProps) => {
  const maxLiters = 10;
  const fillPercentage = Math.min((waterAmountLiters / maxLiters) * 100, 100);

  // Medidas da garrafa (em litros)
  const measurements = [0, 2, 4, 6, 8, 10];

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <Card className="relative w-48 h-96 bg-gradient-to-b from-background to-muted rounded-lg p-4 overflow-hidden">
        {/* Garrafa de Academia - Contorno */}
        <svg
          viewBox="0 0 100 300"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
        >
          {/* Tampa */}
          <rect x="35" y="5" width="30" height="15" fill="#DC2626" rx="2" />
          <rect x="40" y="15" width="20" height="5" fill="#B91C1C" />
          
          {/* Gargalo */}
          <rect x="40" y="20" width="20" height="15" fill="url(#bottleGradient)" opacity="0.3" stroke="#DC2626" strokeWidth="2" />
          
          {/* Corpo Principal da Garrafa */}
          <path
            d="M 35 35 Q 30 40 30 50 L 30 270 Q 30 280 40 285 L 60 285 Q 70 280 70 270 L 70 50 Q 70 40 65 35 Z"
            fill="url(#bottleGradient)"
            opacity="0.3"
            stroke="#DC2626"
            strokeWidth="2.5"
          />

          {/* Água dentro da garrafa */}
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="bottleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#EF4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Nível da água */}
          <clipPath id="bottleClip">
            <path d="M 30 50 L 30 270 Q 30 280 40 285 L 60 285 Q 70 280 70 270 L 70 50 Z" />
          </clipPath>

          <rect
            x="30"
            y={285 - (fillPercentage * 2.35)}
            width="40"
            height={fillPercentage * 2.35}
            fill="url(#waterGradient)"
            clipPath="url(#bottleClip)"
          />

          {/* Ondas na superfície da água */}
          {fillPercentage > 5 && (
            <g opacity="0.5">
              <ellipse
                cx="50"
                cy={285 - (fillPercentage * 2.35)}
                rx="18"
                ry="3"
                fill="#60A5FA"
              />
            </g>
          )}

          {/* Marcações de medida */}
          {measurements.map((liter) => {
            const yPos = 285 - ((liter / maxLiters) * 235);
            return (
              <g key={liter}>
                {/* Linha de marcação */}
                <line
                  x1="25"
                  y1={yPos}
                  x2="30"
                  y2={yPos}
                  stroke="#DC2626"
                  strokeWidth="1.5"
                />
                <line
                  x1="70"
                  y1={yPos}
                  x2="75"
                  y2={yPos}
                  stroke="#DC2626"
                  strokeWidth="1.5"
                />
                {/* Texto da medida */}
                <text
                  x="15"
                  y={yPos + 3}
                  fontSize="10"
                  fill="#DC2626"
                  fontWeight="bold"
                >
                  {liter}L
                </text>
              </g>
            );
          })}

          {/* Reflexos/brilho na garrafa */}
          <ellipse
            cx="45"
            cy="100"
            rx="8"
            ry="40"
            fill="white"
            opacity="0.2"
          />
        </svg>
      </Card>

      {/* Informações abaixo da garrafa */}
      <div className="text-center space-y-1">
        <p className="text-2xl font-bold text-foreground">
          {waterAmountLiters.toFixed(1)} L
        </p>
        <p className="text-sm text-muted-foreground">
          {fillPercentage.toFixed(0)}% de 10L
        </p>
        <div className="flex gap-2 items-center justify-center mt-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">Hidratação</span>
        </div>
      </div>
    </div>
  );
};
