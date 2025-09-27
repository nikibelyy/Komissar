import { Client } from "@/types/client";
import { TrendingUp, Users, DollarSign, Calculator } from "lucide-react";

interface StatsProps {
  clients: Client[];
}

export const Stats = ({ clients }: StatsProps) => {
  const totalAmount = clients.reduce((sum, client) => sum + client.amount, 0);
  const totalSalary = clients.reduce((sum, client) => sum + (client.amount * client.percentage) / 100, 0);
  const averagePercentage = clients.length > 0 
    ? clients.reduce((sum, client) => sum + client.percentage, 0) / clients.length 
    : 0;

  const stats = [
    {
      label: "Всего клиентов",
      value: clients.length,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Общая сумма",
      value: `₽${totalAmount.toLocaleString()}`,
      icon: DollarSign,
      color: "text-accent",
    },
    {
      label: "Общая зарплата",
      value: `₽${totalSalary.toLocaleString()}`,
      icon: Calculator,
      color: "text-secondary",
    },
    {
      label: "Средний процент",
      value: `${averagePercentage.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass rounded-xl p-4 hover:shadow-[0_0_40px_hsl(271_91%_65%/0.3)] transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className={`text-2xl font-bold ${stat.color} text-glow`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
};