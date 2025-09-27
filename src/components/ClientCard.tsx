import { Client } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Car, DollarSign, User, Hash, Percent } from "lucide-react";

interface ClientCardProps {
  client: Client;
  onDelete: (id: string) => void;
}

export const ClientCard = ({ client, onDelete }: ClientCardProps) => {
  const salary = (client.amount * client.percentage) / 100;

  return (
    <div className="glass-heavy rounded-xl p-6 space-y-4 hover:shadow-[0_0_60px_hsl(271_91%_65%/0.4)] transition-all duration-300 hover:scale-[1.02] hover:translate-y-[-4px]">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xl font-bold">
            <User className="w-5 h-5 text-primary" />
            <span className="text-glow">{client.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="w-4 h-4" />
            <span>{client.carBrand}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="w-4 h-4" />
            <span>{client.licensePlate}</span>
          </div>
        </div>
        <Button
          variant="glass"
          size="icon"
          onClick={() => onDelete(client.id)}
          className="hover:bg-destructive/20 hover:border-destructive/50"
        >
          <span className="text-xl">×</span>
        </Button>
      </div>
      
      <div className="pt-4 border-t border-primary/20 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Сумма договора:
          </span>
          <span className="font-semibold text-primary">₽{client.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Percent className="w-4 h-4" />
            Процент:
          </span>
          <span className="font-semibold">{client.percentage}%</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-primary/10">
          <span className="text-sm font-medium">Зарплата:</span>
          <span className="font-bold text-lg text-accent text-glow">₽{salary.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-right">
        {new Date(client.createdAt).toLocaleDateString('ru-RU')}
      </div>
    </div>
  );
};