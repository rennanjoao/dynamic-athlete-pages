import { useEffect, useState } from "react";
import { AvatarCustomization } from "@/hooks/useStudentProfile";
import { BodyMeasurement } from "@/hooks/useMeasurements";

interface Avatar3DProps {
  gender: "male" | "female";
  customization: AvatarCustomization;
  latestMeasurement?: BodyMeasurement;
}

export const Avatar3D = ({ gender, customization, latestMeasurement }: Avatar3DProps) => {
  const [bodyShape, setBodyShape] = useState({
    shoulderWidth: 100,
    waistWidth: 80,
    hipWidth: 95,
    armThickness: 15,
    legThickness: 20,
  });

  useEffect(() => {
    if (latestMeasurement) {
      // Adjust body shape based on measurements
      const waist = latestMeasurement.waist || 80;
      const hip = latestMeasurement.hip || 95;
      const arm = latestMeasurement.arm || 30;
      
      setBodyShape({
        shoulderWidth: gender === "male" ? 100 : 90,
        waistWidth: waist * 0.8, // Scale for SVG
        hipWidth: hip * 0.75,
        armThickness: arm * 0.4,
        legThickness: (latestMeasurement.thigh || 50) * 0.35,
      });
    }
  }, [latestMeasurement, gender]);

  const getMotivationalMessage = () => {
    const bodyFat = latestMeasurement?.body_fat_percentage;
    if (!bodyFat) return "Registre suas medidas para ver seu progresso!";
    
    if (bodyFat < 15) return "Excelente! Você está em ótima forma! 💪";
    if (bodyFat < 20) return "Muito bem! Continue assim! 🌟";
    if (bodyFat < 25) return "Bom progresso! Você está no caminho certo! 👍";
    return "Vamos lá! Cada passo conta! 🚀";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-b from-background to-muted rounded-lg">
      {/* Avatar SVG */}
      <svg
        viewBox="0 0 200 400"
        className="w-full max-w-xs h-auto"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
      >
        {/* Head */}
        <ellipse
          cx="100"
          cy="50"
          rx="30"
          ry="35"
          fill={customization.skin_color}
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
        
        {/* Eyes */}
        <circle cx="90" cy="45" r="4" fill={customization.eye_color} />
        <circle cx="110" cy="45" r="4" fill={customization.eye_color} />
        
        {/* Hair */}
        <path
          d={gender === "male" 
            ? "M 70 35 Q 100 20 130 35" 
            : "M 65 30 Q 100 15 135 30 L 135 60 Q 100 65 65 60 Z"
          }
          fill={customization.hair_color}
        />
        
        {/* Torso */}
        <path
          d={`M ${100 - bodyShape.shoulderWidth / 2} 85 
              L ${100 - bodyShape.waistWidth / 2} 200
              Q 100 210 ${100 + bodyShape.waistWidth / 2} 200
              L ${100 + bodyShape.shoulderWidth / 2} 85
              Q 100 75 ${100 - bodyShape.shoulderWidth / 2} 85 Z`}
          fill={customization.clothing_color}
        />
        
        {/* Arms */}
        <rect
          x={100 - bodyShape.shoulderWidth / 2 - bodyShape.armThickness}
          y="85"
          width={bodyShape.armThickness}
          height="100"
          rx="8"
          fill={customization.skin_color}
        />
        <rect
          x={100 + bodyShape.shoulderWidth / 2}
          y="85"
          width={bodyShape.armThickness}
          height="100"
          rx="8"
          fill={customization.skin_color}
        />
        
        {/* Legs */}
        <rect
          x={100 - bodyShape.legThickness - 5}
          y="200"
          width={bodyShape.legThickness}
          height="150"
          rx="10"
          fill={customization.clothing_color === "#000000" ? "#2C2C2C" : customization.clothing_color}
        />
        <rect
          x={100 + 5}
          y="200"
          width={bodyShape.legThickness}
          height="150"
          rx="10"
          fill={customization.clothing_color === "#000000" ? "#2C2C2C" : customization.clothing_color}
        />
        
        {/* Shoes */}
        <ellipse
          cx={100 - bodyShape.legThickness / 2 - 5}
          cy="360"
          rx={bodyShape.legThickness}
          ry="12"
          fill={customization.shoe_color}
          stroke={customization.shoe_accent_color}
          strokeWidth="2"
        />
        <ellipse
          cx={100 + bodyShape.legThickness / 2 + 5}
          cy="360"
          rx={bodyShape.legThickness}
          ry="12"
          fill={customization.shoe_color}
          stroke={customization.shoe_accent_color}
          strokeWidth="2"
        />
        
        {/* Water Bottle */}
        <rect
          x={100 + bodyShape.shoulderWidth / 2 + bodyShape.armThickness + 5}
          y="140"
          width="15"
          height="40"
          rx="3"
          fill={customization.water_bottle_color}
          opacity="0.8"
        />
      </svg>

      {/* Stats and Feedback */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">
          {getMotivationalMessage()}
        </p>
        
        {latestMeasurement?.body_fat_percentage && (
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="bg-primary/10 px-4 py-2 rounded-lg">
              <span className="text-muted-foreground">% Gordura</span>
              <p className="text-2xl font-bold text-primary">
                {latestMeasurement.body_fat_percentage.toFixed(1)}%
              </p>
            </div>
            
            {latestMeasurement.weight && (
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <span className="text-muted-foreground">Peso</span>
                <p className="text-2xl font-bold text-primary">
                  {latestMeasurement.weight.toFixed(1)} kg
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
