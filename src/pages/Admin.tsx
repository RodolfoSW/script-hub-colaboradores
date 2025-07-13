import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, LogOut, History, User, Edit, Calendar, Trash2, Save, X } from "lucide-react";

// Função para gerenciar usuários no localStorage
const getUsersFromStorage = () => {
  const stored = localStorage.getItem("system_users");
  if (stored) {
    return JSON.parse(stored);
  }
  // Usuários padrão se não houver nada no localStorage
  const defaultUsers = [
    { id: "1", username: "agente", name: "João Silva", role: "N1 Callcenter", createdAt: "2024-01-15", password: "123456" },
  ];
  localStorage.setItem("system_users", JSON.stringify(defaultUsers));
  return defaultUsers;
};

const saveUsersToStorage = (users: any[]) => {
  localStorage.setItem("system_users", JSON.stringify(users));
};

// Função para buscar logs do localStorage
const getScriptLogsFromStorage = () => {
  const stored = localStorage.getItem("script_logs");
  return stored ? JSON.parse(stored) : [];
};

const Admin = () => {
  const [newUser, setNewUser] = useState({ username: "", name: "", password: "", role: "" });
  const [users, setUsers] = useState(getUsersFromStorage());
  const [scriptLogs, setScriptLogs] = useState(getScriptLogsFromStorage());
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUser, setEditUser] = useState({ username: "", name: "", password: "", role: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.name || !newUser.password || !newUser.role) {
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
      password: newUser.password,
      role: newUser.role,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
    setNewUser({ username: "", name: "", password: "", role: "" });
    
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

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(user => user.id === userId);
    if (!userToDelete) return;

    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);

    toast({
      title: "Usuário removido",
      description: `${userToDelete.name} foi removido do sistema.`,
    });
  };

  const handleEditUser = (userId: string) => {
    const userToEdit = users.find(user => user.id === userId);
    if (!userToEdit) return;

    setEditUser({
      username: userToEdit.username,
      name: userToEdit.name,
      password: userToEdit.password,
      role: userToEdit.role
    });
    setEditingUser(userId);
  };

  const handleSaveUser = (userId: string) => {
    if (!editUser.username || !editUser.name || !editUser.password || !editUser.role) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, username: editUser.username, name: editUser.name, password: editUser.password, role: editUser.role }
        : user
    );

    setUsers(updatedUsers);
    saveUsersToStorage(updatedUsers);
    setEditingUser(null);

    toast({
      title: "Usuário atualizado",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUser({ username: "", name: "", password: "", role: "" });
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="role">Cargo</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N1 Callcenter">N1 Callcenter</SelectItem>
                          <SelectItem value="N2 Callcenter">N2 Callcenter</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <div key={user.id} className="border rounded-lg p-4">
                      {editingUser === user.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-username-${user.id}`}>Nome de usuário</Label>
                              <Input
                                id={`edit-username-${user.id}`}
                                value={editUser.username}
                                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                                placeholder="ex: agente3"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-name-${user.id}`}>Nome completo</Label>
                              <Input
                                id={`edit-name-${user.id}`}
                                value={editUser.name}
                                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                                placeholder="ex: Carlos Silva"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-password-${user.id}`}>Senha</Label>
                              <Input
                                id={`edit-password-${user.id}`}
                                type="password"
                                value={editUser.password}
                                onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                placeholder="Digite uma senha"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-role-${user.id}`}>Cargo</Label>
                              <Select value={editUser.role} onValueChange={(value) => setEditUser({ ...editUser, role: value })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="N1 Callcenter">N1 Callcenter</SelectItem>
                                  <SelectItem value="N2 Callcenter">N2 Callcenter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => handleSaveUser(user.id)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <Badge variant="secondary" className="mb-1">{user.role}</Badge>
                              <div className="text-xs text-muted-foreground">
                                Criado em: {user.createdAt}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditUser(user.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
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
                  {scriptLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma alteração registrada ainda.</p>
                      <p className="text-sm">As alterações aparecerão aqui quando os agentes editarem scripts.</p>
                    </div>
                  ) : (
                    scriptLogs.map((log) => (
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
                  )))}
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