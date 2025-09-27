import { useState, useEffect } from "react";
import { AnimatedTitle } from "@/components/AnimatedTitle";
import { ThreeDShapes } from "@/components/ThreeDShapes";
import { ClientForm } from "@/components/ClientForm";
import { ClientCard } from "@/components/ClientCard";
import { Stats } from "@/components/Stats";
import { Client } from "@/types/client";
import { toast } from "sonner";

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]);

  // Load clients from localStorage on mount
  useEffect(() => {
    const savedClients = localStorage.getItem("crm-clients");
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }
  }, []);

  // Save clients to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("crm-clients", JSON.stringify(clients));
  }, [clients]);

  const handleAddClient = (clientData: Omit<Client, "id" | "createdAt">) => {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setClients([...clients, newClient]);
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter((client) => client.id !== id));
    toast.success("Клиент удален");
  };

  return (
    <div className="min-h-screen relative">
      {/* 3D Background Shapes */}
      <ThreeDShapes />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Animated Title */}
        <AnimatedTitle />
        
        {/* Stats Dashboard */}
        <Stats clients={clients} />
        
        {/* Add Client Form */}
        <div className="mb-8">
          <ClientForm onAddClient={handleAddClient} />
        </div>
        
        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onDelete={handleDeleteClient}
            />
          ))}
        </div>
        
        {clients.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-muted-foreground">
              Нет клиентов. Добавьте первого клиента!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
