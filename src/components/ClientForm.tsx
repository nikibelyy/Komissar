import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Client } from "@/types/client";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface ClientFormProps {
  onAddClient: (client: Omit<Client, "id" | "createdAt">) => void;
}

export const ClientForm = ({ onAddClient }: ClientFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    carBrand: "",
    licensePlate: "",
    amount: "",
    percentage: "10",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.carBrand || !formData.licensePlate || !formData.amount) {
      toast.error("Заполните все поля");
      return;
    }

    onAddClient({
      name: formData.name,
      carBrand: formData.carBrand,
      licensePlate: formData.licensePlate,
      amount: Number(formData.amount),
      percentage: Number(formData.percentage),
    });

    setFormData({
      name: "",
      carBrand: "",
      licensePlate: "",
      amount: "",
      percentage: "10",
    });

    toast.success("Клиент добавлен!");
  };

  return (
    <form onSubmit={handleSubmit} className="glass-heavy rounded-xl p-6 space-y-4">
      <h2 className="text-2xl font-bold text-glow mb-4">Добавить клиента</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm text-muted-foreground">
            Имя клиента
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-background/50 border-primary/30 focus:border-primary"
            placeholder="Иван Иванов"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="carBrand" className="text-sm text-muted-foreground">
            Марка авто
          </Label>
          <Input
            id="carBrand"
            value={formData.carBrand}
            onChange={(e) => setFormData({ ...formData, carBrand: e.target.value })}
            className="bg-background/50 border-primary/30 focus:border-primary"
            placeholder="Toyota Camry"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="licensePlate" className="text-sm text-muted-foreground">
            Гос. номер
          </Label>
          <Input
            id="licensePlate"
            value={formData.licensePlate}
            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
            className="bg-background/50 border-primary/30 focus:border-primary"
            placeholder="А123БВ777"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm text-muted-foreground">
            Сумма договора (₽)
          </Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="bg-background/50 border-primary/30 focus:border-primary"
            placeholder="100000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="percentage" className="text-sm text-muted-foreground">
            Процент (%)
          </Label>
          <Input
            id="percentage"
            type="number"
            min="0"
            max="100"
            value={formData.percentage}
            onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
            className="bg-background/50 border-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" variant="glow" className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Добавить клиента
        </Button>
      </div>
    </form>
  );
};