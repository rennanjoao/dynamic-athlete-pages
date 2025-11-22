import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useMeasurements } from "@/hooks/useMeasurements";
import { Ruler } from "lucide-react";

export const MeasurementsForm = () => {
  const { addBodyMeasurement } = useMeasurements();
  const [formData, setFormData] = useState({
    weight: "",
    waist: "",
    hip: "",
    arm: "",
    thigh: "",
    chest: "",
    back: "",
    calf: "",
    forearm: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const measurement = {
      weight: formData.weight ? parseFloat(formData.weight) : null,
      waist: formData.waist ? parseFloat(formData.waist) : null,
      hip: formData.hip ? parseFloat(formData.hip) : null,
      arm: formData.arm ? parseFloat(formData.arm) : null,
      thigh: formData.thigh ? parseFloat(formData.thigh) : null,
      chest: formData.chest ? parseFloat(formData.chest) : null,
      back: formData.back ? parseFloat(formData.back) : null,
      calf: formData.calf ? parseFloat(formData.calf) : null,
      forearm: formData.forearm ? parseFloat(formData.forearm) : null,
      body_fat_percentage: null,
    };

    await addBodyMeasurement(measurement);
    
    // Reset form
    setFormData({
      weight: "",
      waist: "",
      hip: "",
      arm: "",
      thigh: "",
      chest: "",
      back: "",
      calf: "",
      forearm: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Ruler className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Modo Amador - Medidas Corporais</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => handleChange("weight", e.target.value)}
              placeholder="Ex: 70.5"
            />
          </div>

          <div>
            <Label htmlFor="waist">Cintura (cm) - logo abaixo do umbigo</Label>
            <Input
              id="waist"
              type="number"
              step="0.1"
              value={formData.waist}
              onChange={(e) => handleChange("waist", e.target.value)}
              placeholder="Ex: 80"
            />
          </div>

          <div>
            <Label htmlFor="hip">Quadril (cm) - maior circunferência</Label>
            <Input
              id="hip"
              type="number"
              step="0.1"
              value={formData.hip}
              onChange={(e) => handleChange("hip", e.target.value)}
              placeholder="Ex: 95"
            />
          </div>

          <div>
            <Label htmlFor="arm">Braço (cm) - contraído</Label>
            <Input
              id="arm"
              type="number"
              step="0.1"
              value={formData.arm}
              onChange={(e) => handleChange("arm", e.target.value)}
              placeholder="Ex: 35"
            />
          </div>

          <div>
            <Label htmlFor="thigh">Coxa (cm)</Label>
            <Input
              id="thigh"
              type="number"
              step="0.1"
              value={formData.thigh}
              onChange={(e) => handleChange("thigh", e.target.value)}
              placeholder="Ex: 55"
            />
          </div>

          <div>
            <Label htmlFor="chest">Peitoral (cm)</Label>
            <Input
              id="chest"
              type="number"
              step="0.1"
              value={formData.chest}
              onChange={(e) => handleChange("chest", e.target.value)}
              placeholder="Ex: 100"
            />
          </div>

          <div>
            <Label htmlFor="back">Dorsal (cm)</Label>
            <Input
              id="back"
              type="number"
              step="0.1"
              value={formData.back}
              onChange={(e) => handleChange("back", e.target.value)}
              placeholder="Ex: 90"
            />
          </div>

          <div>
            <Label htmlFor="calf">Panturrilha (cm)</Label>
            <Input
              id="calf"
              type="number"
              step="0.1"
              value={formData.calf}
              onChange={(e) => handleChange("calf", e.target.value)}
              placeholder="Ex: 38"
            />
          </div>

          <div>
            <Label htmlFor="forearm">Antebraço (cm)</Label>
            <Input
              id="forearm"
              type="number"
              step="0.1"
              value={formData.forearm}
              onChange={(e) => handleChange("forearm", e.target.value)}
              placeholder="Ex: 28"
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Registrar Medidas
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-4">
        💡 Dica: Tire as medidas sempre no mesmo horário e nas mesmas condições para melhor acompanhamento.
      </p>
    </Card>
  );
};
