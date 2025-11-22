import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useStudentProfile, AvatarCustomization as AvatarCustomizationType } from "@/hooks/useStudentProfile";
import { Palette } from "lucide-react";

export const AvatarCustomization = () => {
  const { customization, profile, updateCustomization } = useStudentProfile();
  const [formData, setFormData] = useState<AvatarCustomizationType>({
    skin_color: "#f5d0b0",
    eye_color: "#8B4513",
    hair_color: "#2C1810",
    hair_style: "short",
    clothing_color: "#000000",
    nail_color: null,
    shoe_color: "#FFFFFF",
    shoe_accent_color: "#FF0000",
    water_bottle_color: "#4A90E2",
  });

  useEffect(() => {
    if (customization) {
      setFormData(customization);
    }
  }, [customization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCustomization(formData);
  };

  const handleColorChange = (field: keyof AvatarCustomizationType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const presetSkinColors = ["#f5d0b0", "#ddb896", "#c68562", "#8d5524", "#5c3b20"];
  const presetHairColors = ["#000000", "#2C1810", "#654321", "#B8860B", "#FFA500", "#FF6347"];
  const presetShoeColors = ["#FFFFFF", "#000000", "#4169E1", "#32CD32", "#FF1493"];

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Palette className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Personalizar Avatar</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Skin Color */}
        <div>
          <Label>Cor da Pele</Label>
          <div className="flex gap-2 mt-2">
            {presetSkinColors.map(color => (
              <button
                key={color}
                type="button"
                className={`w-12 h-12 rounded-full border-2 ${
                  formData.skin_color === color ? "border-primary scale-110" : "border-border"
                } transition-transform`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange("skin_color", color)}
              />
            ))}
          </div>
        </div>

        {/* Hair Color */}
        <div>
          <Label>Cor do Cabelo</Label>
          <div className="flex gap-2 mt-2">
            {presetHairColors.map(color => (
              <button
                key={color}
                type="button"
                className={`w-12 h-12 rounded-full border-2 ${
                  formData.hair_color === color ? "border-primary scale-110" : "border-border"
                } transition-transform`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange("hair_color", color)}
              />
            ))}
          </div>
        </div>

        {/* Eye Color */}
        <div>
          <Label htmlFor="eye_color">Cor dos Olhos</Label>
          <input
            id="eye_color"
            type="color"
            value={formData.eye_color}
            onChange={(e) => handleColorChange("eye_color", e.target.value)}
            className="w-full h-12 rounded-md cursor-pointer"
          />
        </div>

        {/* Clothing Color */}
        <div>
          <Label htmlFor="clothing_color">Cor da Roupa</Label>
          <input
            id="clothing_color"
            type="color"
            value={formData.clothing_color}
            onChange={(e) => handleColorChange("clothing_color", e.target.value)}
            className="w-full h-12 rounded-md cursor-pointer"
          />
        </div>

        {/* Nail Color (Female only) */}
        {profile?.gender === "female" && (
          <div>
            <Label htmlFor="nail_color">Cor da Unha</Label>
            <input
              id="nail_color"
              type="color"
              value={formData.nail_color || "#FF69B4"}
              onChange={(e) => handleColorChange("nail_color", e.target.value)}
              className="w-full h-12 rounded-md cursor-pointer"
            />
          </div>
        )}

        {/* Shoe Color */}
        <div>
          <Label>Cor do Tênis Nike</Label>
          <div className="flex gap-2 mt-2">
            {presetShoeColors.map(color => (
              <button
                key={color}
                type="button"
                className={`w-12 h-12 rounded-full border-2 ${
                  formData.shoe_color === color ? "border-primary scale-110" : "border-border"
                } transition-transform`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange("shoe_color", color)}
              />
            ))}
          </div>
        </div>

        {/* Shoe Accent Color */}
        <div>
          <Label htmlFor="shoe_accent_color">Detalhes do Tênis (Swoosh)</Label>
          <input
            id="shoe_accent_color"
            type="color"
            value={formData.shoe_accent_color}
            onChange={(e) => handleColorChange("shoe_accent_color", e.target.value)}
            className="w-full h-12 rounded-md cursor-pointer"
          />
        </div>

        {/* Water Bottle Color */}
        <div>
          <Label htmlFor="water_bottle_color">Cor da Garrafa de Água</Label>
          <input
            id="water_bottle_color"
            type="color"
            value={formData.water_bottle_color}
            onChange={(e) => handleColorChange("water_bottle_color", e.target.value)}
            className="w-full h-12 rounded-md cursor-pointer"
          />
        </div>

        <Button type="submit" className="w-full">
          Salvar Personalização
        </Button>
      </form>
    </Card>
  );
};
