import { useEffect, useState } from "react";
import { AvatarCustomization } from "@/hooks/useStudentProfile";
import { BodyMeasurement } from "@/hooks/useMeasurements";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Avatar3DProps {
  gender: "male" | "female";
  customization: AvatarCustomization;
  latestMeasurement?: BodyMeasurement;
  avatarUrl?: string | null;
  onAvatarGenerated?: (url: string) => void;
}

export const Avatar3D = ({ 
  gender, 
  customization, 
  latestMeasurement, 
  avatarUrl,
  onAvatarGenerated 
}: Avatar3DProps) => {
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(avatarUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (avatarUrl) {
      setGeneratedAvatar(avatarUrl);
    }
  }, [avatarUrl]);

  const generateAvatar = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-avatar", {
        body: {
          gender,
          skinColor: customization.skin_color,
          hairColor: customization.hair_color,
          bodyFat: latestMeasurement?.body_fat_percentage || 20,
          weight: latestMeasurement?.weight || 70,
          customization,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.imageUrl) {
        setGeneratedAvatar(data.imageUrl);
        if (onAvatarGenerated) {
          onAvatarGenerated(data.imageUrl);
        }
        toast.success("Avatar 3D realista gerado com sucesso!");
      }
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      toast.error(error.message || "Erro ao gerar avatar. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getMotivationalMessage = () => {
    const bodyFat = latestMeasurement?.body_fat_percentage;
    if (!bodyFat) return "Registre suas medidas para ver seu progresso!";
    
    if (bodyFat < 15) return "Excelente! Você está em ótima forma! 💪";
    if (bodyFat < 20) return "Muito bem! Continue assim! 🌟";
    if (bodyFat < 25) return "Bom progresso! Você está no caminho certo! 👍";
    return "Vamos lá! Cada passo conta! 🚀";
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Avatar Display */}
      {generatedAvatar ? (
        <div className="relative w-full max-w-md">
          <img
            src={generatedAvatar}
            alt="Avatar 3D Realista"
            className="w-full h-auto drop-shadow-2xl"
            style={{ maxHeight: "600px", objectFit: "contain" }}
          />
          <Button
            onClick={generateAvatar}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-background/80 backdrop-blur"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerar
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="aspect-[2/3] bg-background/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border/50">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">🧍</div>
              <p className="text-muted-foreground mb-4">
                Seu avatar 3D realista ainda não foi gerado
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Será criado um modelo 3D ultra-realista baseado nas suas características e medidas corporais usando IA
              </p>
              <Button
                onClick={generateAvatar}
                disabled={isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Avatar 3D...
                  </>
                ) : (
                  "Gerar Avatar 3D Realista"
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                ⚡ A geração pode levar alguns segundos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats and Feedback */}
      <div className="text-center space-y-2 w-full">
        <p className="text-lg font-semibold text-foreground">
          {getMotivationalMessage()}
        </p>
        
        {latestMeasurement?.body_fat_percentage && (
          <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
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

            {latestMeasurement.waist && (
              <div className="bg-primary/10 px-4 py-2 rounded-lg">
                <span className="text-muted-foreground">Cintura</span>
                <p className="text-2xl font-bold text-primary">
                  {latestMeasurement.waist.toFixed(1)} cm
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
