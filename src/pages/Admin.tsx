import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, LogOut, History, User, Edit, Calendar, Trash2, Save, X, FileText, Plus, Copy, Hash, Router, Image, Link } from "lucide-react";
import {
  getUsersFromStorage,
  saveUsersToStorage,
  getScriptsFromStorage,
  saveScriptsToStorage,
  getONUsFromStorage,
  saveONUsToStorage,
  getProtocolsFromStorage,
  saveProtocolsToStorage,
  getScriptLogsFromStorage
} from "@/services/googleSheets";

interface Script {
  id: string;
  title: string;
  description: string;
  category: "support" | "financial" | "other";
  content: string;
  tags: string[];
  createdAt: string;
}

interface Protocol {
  id: string;
  number: string;
  agentName: string;
  timestamp: string;
}

interface ONU {
  id: string;
  model: string;
  brand: string;
  images: string[];
  descriptions: string[];
  manualLink?: string;
  createdAt: string;
}

// Scripts padrão
const defaultScripts: Script[] = [
  {
    id: "1",
    title: "Conexão lenta",
    description: "Cliente reportou lentidão na conexão",
    category: "support",
    content: `CLIENTE REPORTOU LENTIDÃO NA CONEXÃO.

ONU ATIVA E OPERACIONAL.
STATUS DE CONEXÃO: ESTABELECIDO.
EXECUTADOS TESTES DE LATÊNCIA (PING).
REINICIALIZAÇÃO DO EQUIPAMENTO (REBOOT) REALIZADA COM SUCESSO.
NOVOS TESTES DE LATÊNCIA EFETUADOS APÓS REINICIALIZAÇÃO.
CLIENTE CONFIRMA RESTABELECIMENTO DO ACESSO APÓS INTERVENÇÃO.`,
    tags: ["lentidão", "conexão", "ping", "latência", "reboot"],
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    title: "Potência fora do padrão",
    description: "Verificação e correção de problemas de potência na ONU",
    category: "support", 
    content: `VERIFICADO EM TESTES QUE O CLIENTE TEM SINAL BAIXO POTÊNCIA NA ONU FORA DO PADRÃO

INFORMATIVO ENCAMINHADO VIA CHAT ATIVO

POTÊNCIA NA ONU   -25.23 dBm    /  POTÊNCIA NA -30.0 
REALIZAR A LEITURA DE POTÊNCIA NA PORTA DO CLIENTE NA CTO E NA PTO E TAMBÉM A LIMPEZA DOS CONECTORES E/OU SUBSTITUIÇÃO 
- OBSERVAR CURVAS NO DROP DE FIBRA), ATENDIMENTO ABERTO DE FORMA PROATIVA.`,
    tags: ["potência", "sinal", "onu", "cto", "pto", "drop", "fibra"],
    createdAt: "2024-01-15"
  },
  {
    id: "3",
    title: "Consulta de Débitos",
    description: "Verificar débitos pendentes do cliente",
    category: "financial",
    content: "SELECT * FROM debitos WHERE cliente_id = ?",
    tags: ["débitos", "financeiro", "consulta"],
    createdAt: "2024-01-15"
  }
];

// Função para buscar logs do localStorage (fallback)
const getScriptLogsFromLocalStorage = () => {
  const stored = localStorage.getItem("script_logs");
  return stored ? JSON.parse(stored) : [];
};

// Função para converter links do Google Drive para URLs diretas de imagem
const convertGoogleDriveLink = (url: string): string => {
  if (!url) return url;
  
  // Verifica se é um link do Google Drive
  const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch) {
    const fileId = googleDriveMatch[1];
    // Tenta diferentes formatos para acessar as imagens do Google Drive
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return url;
};


const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signOut } = useAuth();
  
  // Estados para profile do usuário
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Estados existentes
  const [newUser, setNewUser] = useState({ username: "", name: "", password: "", role: "" });
  const [users, setUsers] = useState<any[]>([]);
  const [scriptLogs, setScriptLogs] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUser, setEditUser] = useState({ username: "", name: "", password: "", role: "" });
  
  // Estados para scripts
  const [scripts, setScripts] = useState<Script[]>([]);
  const [newScript, setNewScript] = useState({ 
    title: "", 
    description: "", 
    category: "support" as "support" | "financial" | "other", 
    content: "", 
    tags: "" 
  });
  const [editingScript, setEditingScript] = useState<string | null>(null);
  const [editScript, setEditScript] = useState({ 
    title: "", 
    description: "", 
    category: "support" as "support" | "financial" | "other", 
    content: "", 
    tags: "" 
  });
  
  // Estados para ONUs
  const [onus, setOnus] = useState<ONU[]>([]);
  const [newOnu, setNewOnu] = useState({ 
    model: "", 
    brand: "", 
    images: ["", "", "", ""], 
    descriptions: ["", "", "", ""], 
    manualLink: "" 
  });
  const [editingOnu, setEditingOnu] = useState<string | null>(null);
  const [editOnu, setEditOnu] = useState({ 
    model: "", 
    brand: "", 
    images: ["", "", "", ""], 
    descriptions: ["", "", "", ""], 
    manualLink: "" 
  });
  
  // Estados para controlar carregamento
  const [isLoading, setIsLoading] = useState(false);

  // Verificar autenticação e carregar perfil
  const checkAuth = useCallback(async () => {
    if (loading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (!data || data.role !== 'admin') {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar o painel administrativo.",
          variant: "destructive",
        });
        navigate("/portal");
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      navigate("/portal");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user, loading, navigate, toast]);

  // Função para carregar dados do Supabase
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, scriptsData, onusData, logsData] = await Promise.all([
        getUsersFromStorage(),
        getScriptsFromStorage(),
        getONUsFromStorage(),
        getScriptLogsFromStorage()
      ]);
      
      setUsers(usersData);
      setScripts(scriptsData.length > 0 ? scriptsData : defaultScripts);
      setOnus(onusData);
      setScriptLogs(logsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      // Fallback para dados locais se falhar
      const localUsers = localStorage.getItem("admin_users");
      const localScripts = localStorage.getItem("admin_scripts");
      const localOnus = localStorage.getItem("admin_onus");
      const localLogs = localStorage.getItem("script_logs");
      
      setUsers(localUsers ? JSON.parse(localUsers) : []);
      setScripts(localScripts ? JSON.parse(localScripts) : defaultScripts);
      setOnus(localOnus ? JSON.parse(localOnus) : []);
      setScriptLogs(localLogs ? JSON.parse(localLogs) : []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Carregar dados quando o componente for montado - only after auth is verified
  useEffect(() => {
    if (!loading && userProfile && userProfile.role === 'admin') {
      loadData();
    }
  }, [userProfile, loading, loadData]);

  // Se ainda estiver carregando ou não for admin, mostrar loading
  if (loading || isLoadingProfile || !userProfile || userProfile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }


  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.name || !newUser.password || !newUser.role) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.username)) {
      toast({
        title: "Erro",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar usuário usando edge function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.username,
          password: newUser.password,
          full_name: newUser.name,
          username: newUser.username,
          role: newUser.role
        }
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Atualizar a lista local de usuários
      await loadData();
      
      setNewUser({ username: "", name: "", password: "", role: "" });
      
      toast({
        title: "Usuário criado com sucesso!",
        description: `Agente ${newUser.name} foi adicionado ao sistema e pode fazer login.`,
      });
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Erro ao criar usuário no sistema de autenticação.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(user => user.id === userId);
    if (!userToDelete) return;

    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    
    try {
      await saveUsersToStorage(updatedUsers);
      toast({
        title: "Usuário removido",
        description: `${userToDelete.name} foi removido do sistema.`,
      });
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: "Erro ao remover",
        description: "Erro ao salvar no Google Sheets. Alteração salva localmente.",
        variant: "destructive",
      });
    }
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

  const handleSaveUser = async (userId: string) => {
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
    setEditingUser(null);
    
    try {
      await saveUsersToStorage(updatedUsers);
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar no Google Sheets. Dados salvos localmente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUser({ username: "", name: "", password: "", role: "" });
  };

  // Funções para gerenciar scripts
  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newScript.title || !newScript.description || !newScript.content) {
      toast({
        title: "Erro",
        description: "Título, descrição e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const script: Script = {
      id: Date.now().toString(),
      title: newScript.title,
      description: newScript.description,
      category: newScript.category,
      content: newScript.content,
      tags: newScript.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedScripts = [...scripts, script];
    setScripts(updatedScripts);
    
    try {
      await saveScriptsToStorage(updatedScripts);
      setNewScript({ title: "", description: "", category: "support", content: "", tags: "" });
      
      toast({
        title: "Script criado com sucesso!",
        description: `Script "${newScript.title}" foi adicionado ao sistema.`,
      });
    } catch (error) {
      console.error('Erro ao salvar script:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar no Google Sheets. Dados salvos localmente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    const scriptToDelete = scripts.find(script => script.id === scriptId);
    if (!scriptToDelete) return;

    const updatedScripts = scripts.filter(script => script.id !== scriptId);
    setScripts(updatedScripts);
    
    try {
      await saveScriptsToStorage(updatedScripts);
      toast({
        title: "Script removido",
        description: `"${scriptToDelete.title}" foi removido do sistema.`,
      });
    } catch (error) {
      console.error('Erro ao remover script:', error);
      toast({
        title: "Erro ao remover",
        description: "Erro ao salvar no Google Sheets. Alteração salva localmente.",
        variant: "destructive",
      });
    }
  };

  const handleEditScript = (scriptId: string) => {
    const scriptToEdit = scripts.find(script => script.id === scriptId);
    if (!scriptToEdit) return;

    setEditScript({
      title: scriptToEdit.title,
      description: scriptToEdit.description,
      category: scriptToEdit.category,
      content: scriptToEdit.content,
      tags: scriptToEdit.tags.join(', ')
    });
    setEditingScript(scriptId);
  };

  const handleSaveScript = async (scriptId: string) => {
    if (!editScript.title || !editScript.description || !editScript.content) {
      toast({
        title: "Erro",
        description: "Título, descrição e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const updatedScripts = scripts.map(script => 
      script.id === scriptId 
        ? { 
            ...script, 
            title: editScript.title, 
            description: editScript.description, 
            category: editScript.category,
            content: editScript.content,
            tags: editScript.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          }
        : script
    );

    setScripts(updatedScripts);
    setEditingScript(null);
    
    try {
      await saveScriptsToStorage(updatedScripts);
      toast({
        title: "Script atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar script:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar no Google Sheets. Dados salvos localmente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelScriptEdit = () => {
    setEditingScript(null);
    setEditScript({ title: "", description: "", category: "support", content: "", tags: "" });
  };

  const copyScriptToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Script copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  // Funções para gerenciar ONUs
  const handleCreateOnu = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newOnu.model || !newOnu.brand) {
      toast({
        title: "Erro",
        description: "Modelo e marca são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const onu: ONU = {
      id: Date.now().toString(),
      model: newOnu.model,
      brand: newOnu.brand,
      images: newOnu.images.filter(img => img.trim() !== ""),
      descriptions: newOnu.descriptions.filter(desc => desc.trim() !== ""),
      manualLink: newOnu.manualLink || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedOnus = [...onus, onu];
    setOnus(updatedOnus);
    
    try {
      await saveONUsToStorage(updatedOnus);
      setNewOnu({ model: "", brand: "", images: ["", "", "", ""], descriptions: ["", "", "", ""], manualLink: "" });
      
      toast({
        title: "ONU criada com sucesso!",
        description: `ONU "${newOnu.model}" foi adicionada ao sistema.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar no Google Sheets. Dados salvos localmente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOnu = (onuId: string) => {
    const onuToDelete = onus.find(onu => onu.id === onuId);
    if (!onuToDelete) return;

    const updatedOnus = onus.filter(onu => onu.id !== onuId);
    setOnus(updatedOnus);
    saveONUsToStorage(updatedOnus);

    toast({
      title: "ONU removida",
      description: `"${onuToDelete.model}" foi removida do sistema.`,
    });
  };

  const handleEditOnu = (onuId: string) => {
    const onuToEdit = onus.find(onu => onu.id === onuId);
    if (!onuToEdit) return;

    setEditOnu({
      model: onuToEdit.model,
      brand: onuToEdit.brand,
      images: [...onuToEdit.images, "", "", "", ""].slice(0, 4),
      descriptions: [...onuToEdit.descriptions, "", "", "", ""].slice(0, 4),
      manualLink: onuToEdit.manualLink || ""
    });
    setEditingOnu(onuId);
  };

  const handleSaveOnu = (onuId: string) => {
    if (!editOnu.model || !editOnu.brand) {
      toast({
        title: "Erro",
        description: "Modelo e marca são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const updatedOnus = onus.map(onu => 
      onu.id === onuId 
        ? { 
            ...onu, 
            model: editOnu.model, 
            brand: editOnu.brand,
            images: editOnu.images.filter(img => img.trim() !== ""),
            descriptions: editOnu.descriptions.filter(desc => desc.trim() !== ""),
            manualLink: editOnu.manualLink || undefined
          }
        : onu
    );

    setOnus(updatedOnus);
    saveONUsToStorage(updatedOnus);
    setEditingOnu(null);

    toast({
      title: "ONU atualizada",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const handleCancelOnuEdit = () => {
    setEditingOnu(null);
    setEditOnu({ model: "", brand: "", images: ["", "", "", ""], descriptions: ["", "", "", ""], manualLink: "" });
  };

  const updateNewOnuImage = (index: number, value: string) => {
    const newImages = [...newOnu.images];
    newImages[index] = value;
    setNewOnu({ ...newOnu, images: newImages });
  };

  const updateNewOnuDescription = (index: number, value: string) => {
    const newDescriptions = [...newOnu.descriptions];
    newDescriptions[index] = value;
    setNewOnu({ ...newOnu, descriptions: newDescriptions });
  };

  const updateEditOnuImage = (index: number, value: string) => {
    const newImages = [...editOnu.images];
    newImages[index] = value;
    setEditOnu({ ...editOnu, images: newImages });
  };

  const updateEditOnuDescription = (index: number, value: string) => {
    const newDescriptions = [...editOnu.descriptions];
    newDescriptions[index] = value;
    setEditOnu({ ...editOnu, descriptions: newDescriptions });
  };

  // Funções para gerenciar protocolos
  const getProtocolsFromStorage = (): Protocol[] => {
    const stored = localStorage.getItem("system_protocols");
    return stored ? JSON.parse(stored) : [];
  };

  const protocols = getProtocolsFromStorage();

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
          <TabsList className="grid w-full max-w-6xl grid-cols-5">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Scripts
            </TabsTrigger>
            <TabsTrigger value="onus" className="flex items-center gap-2">
              <Router className="w-4 h-4" />
              ONUs ({onus.length})
            </TabsTrigger>
            <TabsTrigger value="protocols" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Protocolos ({protocols.length})
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
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="ex: agente@email.com"
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
                              <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                              <Input
                                id={`edit-email-${user.id}`}
                                type="email"
                                value={editUser.username}
                                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                                placeholder="ex: agente@email.com"
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
                            <div className="text-sm text-muted-foreground">{user.username}</div>
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

          <TabsContent value="scripts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Novo Script
                </CardTitle>
                <CardDescription>
                  Adicione novos scripts ao sistema para os agentes utilizarem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateScript} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="script-title">Título</Label>
                      <Input
                        id="script-title"
                        value={newScript.title}
                        onChange={(e) => setNewScript({ ...newScript, title: e.target.value })}
                        placeholder="ex: Conexão lenta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="script-category">Categoria</Label>
                      <Select value={newScript.category} onValueChange={(value) => setNewScript({ ...newScript, category: value as "support" | "financial" | "other" })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="support">Suporte</SelectItem>
                          <SelectItem value="financial">Financeiro</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="script-description">Descrição</Label>
                    <Input
                      id="script-description"
                      value={newScript.description}
                      onChange={(e) => setNewScript({ ...newScript, description: e.target.value })}
                      placeholder="ex: Cliente reportou lentidão na conexão"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="script-content">Conteúdo do Script</Label>
                    <Textarea
                      id="script-content"
                      value={newScript.content}
                      onChange={(e) => setNewScript({ ...newScript, content: e.target.value })}
                      placeholder="Digite o conteúdo do script..."
                      className="min-h-[150px] font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="script-tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="script-tags"
                      value={newScript.tags}
                      onChange={(e) => setNewScript({ ...newScript, tags: e.target.value })}
                      placeholder="ex: lentidão, conexão, ping, latência"
                    />
                  </div>
                  <Button type="submit" className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Script
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Scripts Cadastrados ({scripts.length})
                </CardTitle>
                <CardDescription>
                  Gerencie todos os scripts disponíveis para os agentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scripts.map((script) => (
                    <div key={script.id} className="border rounded-lg p-4">
                      {editingScript === script.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-script-title-${script.id}`}>Título</Label>
                              <Input
                                id={`edit-script-title-${script.id}`}
                                value={editScript.title}
                                onChange={(e) => setEditScript({ ...editScript, title: e.target.value })}
                                placeholder="Título do script"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-script-category-${script.id}`}>Categoria</Label>
                              <Select value={editScript.category} onValueChange={(value) => setEditScript({ ...editScript, category: value as "support" | "financial" | "other" })}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="support">Suporte</SelectItem>
                                  <SelectItem value="financial">Financeiro</SelectItem>
                                  <SelectItem value="other">Outros</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-script-description-${script.id}`}>Descrição</Label>
                            <Input
                              id={`edit-script-description-${script.id}`}
                              value={editScript.description}
                              onChange={(e) => setEditScript({ ...editScript, description: e.target.value })}
                              placeholder="Descrição do script"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-script-content-${script.id}`}>Conteúdo</Label>
                            <Textarea
                              id={`edit-script-content-${script.id}`}
                              value={editScript.content}
                              onChange={(e) => setEditScript({ ...editScript, content: e.target.value })}
                              className="min-h-[150px] font-mono"
                              placeholder="Conteúdo do script"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`edit-script-tags-${script.id}`}>Tags</Label>
                            <Input
                              id={`edit-script-tags-${script.id}`}
                              value={editScript.tags}
                              onChange={(e) => setEditScript({ ...editScript, tags: e.target.value })}
                              placeholder="Tags separadas por vírgula"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => handleSaveScript(script.id)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancelScriptEdit}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium text-lg">{script.title}</h3>
                                <Badge 
                                  variant={script.category === "support" ? "default" : 
                                          script.category === "financial" ? "secondary" : "outline"}
                                >
                                  {script.category === "support" ? "Suporte" : 
                                   script.category === "financial" ? "Financeiro" : "Outros"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{script.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {script.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground mb-2">
                                Criado em: {script.createdAt}
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyScriptToClipboard(script.content)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditScript(script.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteScript(script.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded border-l-2 border-primary/20">
                            <div className="text-sm font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {script.content}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {scripts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum script cadastrado ainda.</p>
                      <p className="text-sm">Crie o primeiro script para começar.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onus" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Nova ONU
                </CardTitle>
                <CardDescription>
                  Adicione novas ONUs ao sistema com imagens, descrições e manual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOnu} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="onu-model">Modelo</Label>
                      <Input
                        id="onu-model"
                        value={newOnu.model}
                        onChange={(e) => setNewOnu({ ...newOnu, model: e.target.value })}
                        placeholder="ex: AC1200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onu-brand">Marca</Label>
                      <Input
                        id="onu-brand"
                        value={newOnu.brand}
                        onChange={(e) => setNewOnu({ ...newOnu, brand: e.target.value })}
                        placeholder="ex: Intelbras"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="onu-manual">Link do Manual (opcional)</Label>
                    <Input
                      id="onu-manual"
                      value={newOnu.manualLink}
                      onChange={(e) => setNewOnu({ ...newOnu, manualLink: e.target.value })}
                      placeholder="ex: https://link-do-manual.com"
                      type="url"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Imagens (até 4)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {newOnu.images.map((image, index) => (
                        <div key={index} className="space-y-2">
                          <Label htmlFor={`onu-image-${index}`}>Imagem {index + 1}</Label>
                          <Input
                            id={`onu-image-${index}`}
                            value={image}
                            onChange={(e) => updateNewOnuImage(index, e.target.value)}
                            placeholder="URL da imagem"
                            type="url"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Descrições (até 4)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {newOnu.descriptions.map((description, index) => (
                        <div key={index} className="space-y-2">
                          <Label htmlFor={`onu-description-${index}`}>Descrição {index + 1}</Label>
                          <Textarea
                            id={`onu-description-${index}`}
                            value={description}
                            onChange={(e) => updateNewOnuDescription(index, e.target.value)}
                            placeholder="Descrição da ONU"
                            className="min-h-[80px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar ONU
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Router className="w-5 h-5" />
                  ONUs Cadastradas ({onus.length})
                </CardTitle>
                <CardDescription>
                  Gerencie todas as ONUs disponíveis no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {onus.map((onu) => (
                    <div key={onu.id} className="border rounded-lg p-4">
                      {editingOnu === onu.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-onu-model-${onu.id}`}>Modelo</Label>
                              <Input
                                id={`edit-onu-model-${onu.id}`}
                                value={editOnu.model}
                                onChange={(e) => setEditOnu({ ...editOnu, model: e.target.value })}
                                placeholder="Modelo da ONU"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-onu-brand-${onu.id}`}>Marca</Label>
                              <Input
                                id={`edit-onu-brand-${onu.id}`}
                                value={editOnu.brand}
                                onChange={(e) => setEditOnu({ ...editOnu, brand: e.target.value })}
                                placeholder="Marca da ONU"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`edit-onu-manual-${onu.id}`}>Link do Manual</Label>
                            <Input
                              id={`edit-onu-manual-${onu.id}`}
                              value={editOnu.manualLink}
                              onChange={(e) => setEditOnu({ ...editOnu, manualLink: e.target.value })}
                              placeholder="Link do manual"
                              type="url"
                            />
                          </div>

                          <div className="space-y-4">
                            <Label className="text-base font-medium">Imagens</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {editOnu.images.map((image, index) => (
                                <div key={index} className="space-y-2">
                                  <Label htmlFor={`edit-onu-image-${onu.id}-${index}`}>Imagem {index + 1}</Label>
                                  <Input
                                    id={`edit-onu-image-${onu.id}-${index}`}
                                    value={image}
                                    onChange={(e) => updateEditOnuImage(index, e.target.value)}
                                    placeholder="URL da imagem"
                                    type="url"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label className="text-base font-medium">Descrições</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {editOnu.descriptions.map((description, index) => (
                                <div key={index} className="space-y-2">
                                  <Label htmlFor={`edit-onu-description-${onu.id}-${index}`}>Descrição {index + 1}</Label>
                                  <Textarea
                                    id={`edit-onu-description-${onu.id}-${index}`}
                                    value={description}
                                    onChange={(e) => updateEditOnuDescription(index, e.target.value)}
                                    placeholder="Descrição da ONU"
                                    className="min-h-[80px]"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => handleSaveOnu(onu.id)}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Salvar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={handleCancelOnuEdit}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium text-lg">{onu.model}</h3>
                                <Badge variant="secondary">{onu.brand}</Badge>
                              </div>
                              {onu.manualLink && (
                                <a 
                                  href={onu.manualLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <Link className="w-3 h-3" />
                                  Manual
                                </a>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground mb-2">
                                Criado em: {onu.createdAt}
                              </div>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditOnu(onu.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDeleteOnu(onu.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {onu.images.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Imagens:</Label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                 {onu.images.map((image, index) => (
                                   <div key={index} className="aspect-square bg-muted rounded border overflow-hidden relative">
                                     <img 
                                       src={convertGoogleDriveLink(image)} 
                                       alt={`${onu.model} - Imagem ${index + 1}`}
                                       className="w-full h-full object-cover"
                                       onError={(e) => {
                                         const target = e.currentTarget;
                                         target.style.display = 'none';
                                         const parent = target.parentElement;
                                         if (parent) {
                                           parent.innerHTML = `<div class="flex items-center justify-center h-full text-xs text-muted-foreground">Imagem ${index + 1}<br/>não carregou</div>`;
                                         }
                                       }}
                                     />
                                   </div>
                                 ))}
                              </div>
                            </div>
                          )}
                          
                          {onu.descriptions.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Descrições:</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {onu.descriptions.map((description, index) => (
                                  <div key={index} className="bg-muted/50 p-3 rounded border-l-2 border-primary/20">
                                    <div className="text-sm">{description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {onus.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Router className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma ONU cadastrada ainda.</p>
                      <p className="text-sm">Crie a primeira ONU para começar.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocols" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Histórico de Protocolos ({protocols.length})
                </CardTitle>
                <CardDescription>
                  Todos os protocolos registrados pelos agentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {protocols.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum protocolo registrado ainda.</p>
                    <p className="text-sm">Os protocolos aparecerão aqui quando os agentes começarem a registrá-los.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...protocols].reverse().map((protocol) => (
                      <div key={protocol.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-lg">Protocolo: {protocol.number}</h4>
                              <Badge variant="secondary">{protocol.agentName}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {protocol.timestamp}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-muted/50 px-3 py-1 rounded text-sm">
                              ID: {protocol.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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