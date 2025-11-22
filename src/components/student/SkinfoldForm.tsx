import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMeasurements } from "@/hooks/useMeasurements";
import { Activity } from "lucide-react";

export const SkinfoldForm = () => {
  const { addSkinfoldMeasurement } = useMeasurements();
  const [protocol, setProtocol] = useState<"jackson_pollock_3" | "jackson_pollock_4" | "jackson_pollock_7">("jackson_pollock_3");
  const [formData, setFormData] = useState({
    weight: "",
    triceps: "",
    subscapular: "",
    suprailiac: "",
    abdominal: "",
    thigh: "",
    biceps: "",
    chest: "",
    midaxillary: "",
    calf: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const measurement = {
      weight: formData.weight ? parseFloat(formData.weight) : null,
      triceps: formData.triceps ? parseFloat(formData.triceps) : null,
      subscapular: formData.subscapular ? parseFloat(formData.subscapular) : null,
      suprailiac: formData.suprailiac ? parseFloat(formData.suprailiac) : null,
      abdominal: formData.abdominal ? parseFloat(formData.abdominal) : null,
      thigh: formData.thigh ? parseFloat(formData.thigh) : null,
      biceps: formData.biceps ? parseFloat(formData.biceps) : null,
      chest: formData.chest ? parseFloat(formData.chest) : null,
      midaxillary: formData.midaxillary ? parseFloat(formData.midaxillary) : null,
      calf: formData.calf ? parseFloat(formData.calf) : null,
    };

    await addSkinfoldMeasurement(measurement, protocol);
    
    // Reset form
    setFormData({
      weight: "",
      triceps: "",
      subscapular: "",
      suprailiac: "",
      abdominal: "",
      thigh: "",
      biceps: "",
      chest: "",
      midaxillary: "",
      calf: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Modo Profissional - Dobras Cutâneas</h2>
      </div>

      <div className="mb-4">
        <Label>Protocolo de Avaliação</Label>
        <Select value={protocol} onValueChange={(value: any) => setProtocol(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jackson_pollock_3">Jackson & Pollock - 3 Dobras</SelectItem>
            <SelectItem value="jackson_pollock_4">Jackson & Pollock - 4 Dobras</SelectItem>
            <SelectItem value="jackson_pollock_7">Jackson & Pollock - 7 Dobras</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Pontos Essenciais</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="triceps">Tricipital (mm)</Label>
              <Input
                id="triceps"
                type="number"
                step="0.1"
                value={formData.triceps}
                onChange={(e) => handleChange("triceps", e.target.value)}
                placeholder="Ex: 12.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="subscapular">Subescapular (mm)</Label>
              <Input
                id="subscapular"
                type="number"
                step="0.1"
                value={formData.subscapular}
                onChange={(e) => handleChange("subscapular", e.target.value)}
                placeholder="Ex: 15.0"
                required
              />
            </div>

            <div>
              <Label htmlFor="suprailiac">Suprailíaca (mm)</Label>
              <Input
                id="suprailiac"
                type="number"
                step="0.1"
                value={formData.suprailiac}
                onChange={(e) => handleChange("suprailiac", e.target.value)}
                placeholder="Ex: 18.0"
                required
              />
            </div>

            <div>
              <Label htmlFor="abdominal">Abdominal (mm)</Label>
              <Input
                id="abdominal"
                type="number"
                step="0.1"
                value={formData.abdominal}
                onChange={(e) => handleChange("abdominal", e.target.value)}
                placeholder="Ex: 20.0"
                required
              />
            </div>

            <div>
              <Label htmlFor="thigh">Coxa (mm)</Label>
              <Input
                id="thigh"
                type="number"
                step="0.1"
                value={formData.thigh}
                onChange={(e) => handleChange("thigh", e.target.value)}
                placeholder="Ex: 22.0"
                required
              />
            </div>
          </div>
        </div>

        {protocol === "jackson_pollock_7" && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pontos Adicionais (Protocolo 7 Dobras)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="biceps">Bicipital (mm)</Label>
                <Input
                  id="biceps"
                  type="number"
                  step="0.1"
                  value={formData.biceps}
                  onChange={(e) => handleChange("biceps", e.target.value)}
                  placeholder="Ex: 8.0"
                />
              </div>

              <div>
                <Label htmlFor="chest">Peitoral/Torácica (mm)</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.1"
                  value={formData.chest}
                  onChange={(e) => handleChange("chest", e.target.value)}
                  placeholder="Ex: 10.0"
                />
              </div>

              <div>
                <Label htmlFor="midaxillary">Axilar Média (mm)</Label>
                <Input
                  id="midaxillary"
                  type="number"
                  step="0.1"
                  value={formData.midaxillary}
                  onChange={(e) => handleChange("midaxillary", e.target.value)}
                  placeholder="Ex: 12.0"
                />
              </div>

              <div>
                <Label htmlFor="calf">Panturrilha Medial (mm)</Label>
                <Input
                  id="calf"
                  type="number"
                  step="0.1"
                  value={formData.calf}
                  onChange={(e) => handleChange("calf", e.target.value)}
                  placeholder="Ex: 14.0"
                />
              </div>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full">
          Registrar Dobras Cutâneas
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-4">
        ⚠️ Importante: As medidas de dobras cutâneas devem ser realizadas por um profissional qualificado (Educador Físico ou Nutricionista) com adipômetro calibrado.
      </p>
    </Card>
  );
};
