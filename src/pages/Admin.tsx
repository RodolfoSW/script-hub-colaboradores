import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, LogOut, History, User, Edit, Calendar } from "lucide-react";

// Mock data para usuários e logs
const mockUsers = [
  { id: "1", username: "agente", name: "João Silva", role: "Agente", createdAt: "2024-01-15" },
  { id: "2", username: "agente2", name: "Maria Santos", role: "Agente", createdAt: "2024-01-20" },
];

const mockScriptLogs = [
  {
    id: "1",
    scriptTitle: "Script de Atendimento Inicial",
    agentName: "João Silva",
    action: "Editou conteúdo",
    timestamp: "2024-01-25 14:30:00",
    changes: "Alterou saudação inicial"
  },
  {
    id: "2",
    scriptTitle: "Script de Suporte Técnico",
    agentName: "Maria Santos",
    action: "Adicionou palavra-chave",
    timestamp: "2024-01-25 13:15:00",
    changes: "Adicionou palavra-chave: 'roteador'"
  },
  {
    id: "3",
    scriptTitle: "Script de Vendas",
    agentName: "João Silva",
    action: "Editou conteúdo",
    timestamp: "2024-01-25 10:45:00",
    changes: "Atualizou informações de preços"
  },
];

const Admin = () => {
  const [newUser, setNewUser] = useState({ username: "", name: "", password: "" });
  const [users, setUsers] = useState(mockUsers);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.name || !newUser.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const userExists = users.some(user => user.username === newUser.username);
    if (userExists) {
      toast({
        title: "Erro",
        description: "Usuário já existe.",
        variant: "destructive",
      });
      return;
    }

    const user = {
      id: Date.now().toString(),
      username: newUser.username,
      name: newUser.name,
      role: "Agente",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, user]);
    setNewUser({ username: "", name: "", password: "" });
    
    toast({
      title: "Usuário criado com sucesso!",
      description: `Agente ${newUser.name} foi adicionado ao sistema.`,
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Painel Administrativo</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Logs de Scripts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Criar Novo Usuário
                </CardTitle>
                <CardDescription>
                  Adicione novos agentes ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de usuário</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="ex: agente3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="ex: Carlos Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Digite uma senha"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full md:w-auto">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Usuário
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Usuários Cadastrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{user.role}</Badge>
                        <div className="text-xs text-muted-foreground">
                          Criado em: {user.createdAt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Alterações nos Scripts
                </CardTitle>
                <CardDescription>
                  Acompanhe todas as modificações feitas pelos agentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockScriptLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{log.scriptTitle}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            {log.agentName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {log.timestamp}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Edit className="w-3 h-3" />
                          {log.action}
                        </Badge>
                      </div>
                      
                      <div className="text-sm bg-muted/50 p-3 rounded border-l-2 border-primary/20">
                        <strong>Alteração:</strong> {log.changes}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;