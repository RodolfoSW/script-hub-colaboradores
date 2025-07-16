import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Headphones, 
  DollarSign, 
  FileText, 
  Wifi, 
  Router, 
  Copy,
  ExternalLink,
  Edit,
  Save,
  X,
  LogOut,
  Hash,
  Plus
} from "lucide-react";

interface OnuModel {
  id: string;
  brand: string;
  model: string;
  descriptions: string[];
  images: string[];
  manualLink?: string;
  createdAt: string;
}

interface Script {
  id: string;
  title: string;
  description: string;
  category: "support" | "financial" | "other";
  content: string;
  tags: string[];
  detailsTooltip?: string;
}

interface Protocol {
  id: string;
  number: string;
  agentName: string;
  timestamp: string;
}

// Função para converter links do Google Drive para URLs diretas de imagem
const convertGoogleDriveLink = (url: string): string => {
  if (!url) return url;
  
  // Verifica se é um link do Google Drive
  const googleDriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch) {
    const fileId = googleDriveMatch[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return url;
};

// Função para carregar ONUs do localStorage (gerenciadas pelo admin)
const getONUsFromStorage = (): OnuModel[] => {
  try {
    const stored = localStorage.getItem("system_onus");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar ONUs:", error);
    return [];
  }
};

// Função para carregar scripts do localStorage (gerenciados pelo admin)
const getScriptsFromStorage = (): Script[] => {
  try {
    const stored = localStorage.getItem("system_scripts");
    if (stored) {
      return JSON.parse(stored);
    }
    // Scripts padrão caso não haja nada no localStorage
    return [
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
        detailsTooltip: `Testes a serem realizados:
• Ping ipv4 ipv6
• TraceRouter
• Verificar canais do wifi 2.4 e 5.8
• Realizar Neighboring Ap
• Verificar com o cliente aonde está instalado a ONU
• Verificar se tem algum dispositivo Static em Home Network
• Potência da ONU
• Potência da OLT
• Extrato de conexão`
      },
      {
        id: "2", 
        title: "POTENCIA FORA DO PADRÃO",
        description: "Verificação e correção de problemas de potência na ONU",
        category: "support", 
        content: `VERIFICADO EM TESTES QUE O(A) RAIMUNDO GABRIEL FERREIRA DA SILVA
TELL: (96) 99127-3053
M SINAL BAIXO POTÊNCIA NA ONU FORA DO PADRÃO

INFORMATIVO ENCAMINHADO VIA CHAT ATIVO
--------------------------------------------------------------------------------------------------------------------

POTÊNCIA NA ONU   -25.23 dBm    /  POTÊNCIA NA -30.0 
REALIZAR A LEITURA DE POTÊNCIA NA PORTA DO CLIENTE NA CTO E NA PTO E TAMBÉM A LIMPEZA DOS CONECTORES E/OU SUBSTITUIÇÃO 
- OBSERVAR CURVAS NO DROP DE FIBRA), ATENDIMENTO ABERTO DE FORMA PROATIVA. 
MCP.09.747.03
PORTA: 03

DESCONEXÃO AUTOMÁTICA, ALARME AMS PENDENTE: , ont-gen-rx-lwarn, TIPO ALARME: Alerta, POSSÍVEL SOLUÇÃO: Verificar meio físico da CTO até a ONT (conectores, cordão, acopladores, drop)`,
        tags: ["potência", "sinal", "onu", "cto", "pto", "drop", "fibra"],
        detailsTooltip: `• Potência da ONU
• Potência da OLT
• Extrato de conexão`
      },
      {
        id: "3",
        title: "Consulta de Débitos",
        description: "Verificar débitos pendentes do cliente",
        category: "financial",
        content: "SELECT * FROM debitos WHERE cliente_id = ?",
        tags: ["débitos", "financeiro", "consulta"]
      }
    ];
  } catch (error) {
    console.error("Erro ao carregar scripts:", error);
    // Retornar scripts padrão em caso de erro
    return [
      {
        id: "1",
        title: "Conexão lenta",
        description: "Cliente reportou lentidão na conexão",
        category: "support",
        content: "CLIENTE REPORTOU LENTIDÃO NA CONEXÃO.\n\nONU ATIVA E OPERACIONAL.\nSTATUS DE CONEXÃO: ESTABELECIDO.",
        tags: ["lentidão", "conexão", "ping", "latência", "reboot"]
      }
    ];
  }
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Verificar se o usuário está autenticado
  const getCurrentUser = () => {
    try {
      const stored = localStorage.getItem("current_user");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  
  // Redirecionar para login se não estiver autenticado
  if (!currentUser) {
    navigate("/");
    return null;
  }
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "support" | "financial" | "other">("all");
  const [editingScript, setEditingScript] = useState<string | null>(null);
  
  // Carregar scripts do localStorage (gerenciados pelo admin)
  const scripts = getScriptsFromStorage();
  const [scriptContents, setScriptContents] = useState<Record<string, string>>(
    scripts.reduce((acc, script) => ({ ...acc, [script.id]: script.content }), {})
  );
  
  // Carregar ONUs do localStorage (gerenciadas pelo admin)
  const onuModels = getONUsFromStorage();

  // Estados para protocolos
  const [protocolNumber, setProtocolNumber] = useState("");
  
  // Funções para gerenciar protocolos
  const getProtocolsFromStorage = (): Protocol[] => {
    const stored = localStorage.getItem("system_protocols");
    return stored ? JSON.parse(stored) : [];
  };

  const saveProtocolsToStorage = (protocols: Protocol[]) => {
    localStorage.setItem("system_protocols", JSON.stringify(protocols));
  };

  const getUserProtocolCount = (agentName: string): number => {
    const protocols = getProtocolsFromStorage();
    return protocols.filter(p => p.agentName === agentName).length;
  };

  const handleAddProtocol = () => {
    if (!protocolNumber.trim()) {
      toast({
        title: "Erro",
        description: "Digite o número do protocolo.",
        variant: "destructive",
      });
      return;
    }

    const protocols = getProtocolsFromStorage();
    const protocolExists = protocols.some(p => p.number === protocolNumber.trim());
    
    if (protocolExists) {
      toast({
        title: "Erro",
        description: "Este protocolo já foi registrado.",
        variant: "destructive",
      });
      return;
    }

    const newProtocol: Protocol = {
      id: Date.now().toString(),
      number: protocolNumber.trim(),
      agentName: currentUser.name,
      timestamp: new Date().toLocaleString('pt-BR')
    };

    const updatedProtocols = [...protocols, newProtocol];
    saveProtocolsToStorage(updatedProtocols);
    setProtocolNumber("");

    toast({
      title: "Protocolo adicionado!",
      description: `Protocolo ${protocolNumber} registrado com sucesso.`,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("current_user");
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/");
  };

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || script.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text: string) => {
    const currentUser = getCurrentUser();
    const userInfo = `Agente: ${currentUser.name}${currentUser.role ? ` - ${currentUser.role}` : ''}\n\n`;
    const fullContent = userInfo + text;
    navigator.clipboard.writeText(fullContent);
    
    toast({
      title: "Script copiado!",
      description: "Script copiado com informações do agente.",
    });
  };

  const handleEditScript = (scriptId: string) => {
    setEditingScript(scriptId);
  };

  const saveScriptLog = (scriptId: string, oldContent: string, newContent: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;

    const currentUser = getCurrentUser();
    const logEntry = {
      id: Date.now().toString(),
      scriptTitle: script.title,
      agentName: currentUser.name,
      action: "Editou conteúdo",
      timestamp: new Date().toLocaleString('pt-BR'),
      changes: `Alterou o script "${script.title}"`
    };

    const existingLogs = JSON.parse(localStorage.getItem("script_logs") || "[]");
    const updatedLogs = [logEntry, ...existingLogs];
    localStorage.setItem("script_logs", JSON.stringify(updatedLogs));
  };

  const handleSaveScript = (scriptId: string) => {
    const originalScript = scripts.find(s => s.id === scriptId);
    const newContent = scriptContents[scriptId];
    
    if (originalScript && originalScript.content !== newContent) {
      saveScriptLog(scriptId, originalScript.content, newContent);
      
      toast({
        title: "Script salvo com sucesso!",
        description: "As alterações foram registradas no histórico.",
      });
    }
    
    setEditingScript(null);
  };

  const handleCancelEdit = (scriptId: string) => {
    const originalScript = scripts.find(s => s.id === scriptId);
    if (originalScript) {
      setScriptContents(prev => ({
        ...prev,
        [scriptId]: originalScript.content
      }));
    }
    setEditingScript(null);
  };

  const handleContentChange = (scriptId: string, newContent: string) => {
    setScriptContents(prev => ({
      ...prev,
      [scriptId]: newContent
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Router className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Portal do Agente</h1>
                <p className="text-sm text-muted-foreground">Plataforma de Scripts e Suporte Técnico</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                Agente: {currentUser.name}
              </Badge>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="scripts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="scripts" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Scripts</span>
            </TabsTrigger>
            <TabsTrigger value="protocols" className="flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span>Protocolos ({getUserProtocolCount(currentUser.name)})</span>
            </TabsTrigger>
            <TabsTrigger value="onu-models" className="flex items-center space-x-2">
              <Wifi className="h-4 w-4" />
              <span>Modelos ONU</span>
            </TabsTrigger>
          </TabsList>

          {/* Scripts Tab */}
          <TabsContent value="scripts" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar scripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="support" className="flex items-center space-x-2">
                    <Headphones className="h-4 w-4" />
                    <span>Suporte</span>
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Financeiro</span>
                  </TabsTrigger>
                  <TabsTrigger value="other">Outros</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Scripts Grid */}
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredScripts.map((script) => (
                  <Card key={script.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{script.title}</CardTitle>
                          <CardDescription className="mt-1">{script.description}</CardDescription>
                          <div className="mt-2 space-y-1">
                            <Badge variant="outline" className="text-xs">
                              Agente: {currentUser.name}
                            </Badge>
                            {currentUser.role && (
                              <div>
                                <Badge variant="secondary" className="text-xs">
                                  {currentUser.role}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={script.category === "support" ? "default" : 
                                  script.category === "financial" ? "secondary" : "outline"}
                          className="ml-2"
                        >
                          {script.category === "support" ? "Suporte" : 
                           script.category === "financial" ? "Financeiro" : "Outros"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {editingScript === script.id ? (
                          <div className="space-y-2">
                            <Textarea 
                              value={scriptContents[script.id]}
                              onChange={(e) => handleContentChange(script.id, e.target.value)}
                              className="min-h-[120px] font-mono text-sm"
                              placeholder="Conteúdo do script..."
                            />
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleSaveScript(script.id)}
                                className="flex-1"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Salvar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCancelEdit(script.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-muted p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
                            {scriptContents[script.id]}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {script.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => copyToClipboard(scriptContents[script.id])}
                            className="flex-1"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </Button>
                          
                          {editingScript === script.id ? null : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditScript(script.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          )}
                          
                          {script.detailsTooltip ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Detalhes
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="whitespace-pre-line text-sm">
                                  {script.detailsTooltip}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Detalhes
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TooltipProvider>

            {filteredScripts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum script encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
              </div>
            )}
          </TabsContent>

          {/* Protocols Tab */}
          <TabsContent value="protocols" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Registrar Protocolo
                </CardTitle>
                <CardDescription>
                  Digite o número do protocolo para registrar o atendimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Input 
                      placeholder="Digite o número do protocolo..."
                      value={protocolNumber}
                      onChange={(e) => setProtocolNumber(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddProtocol();
                        }
                      }}
                    />
                  </div>
                  <Button onClick={handleAddProtocol}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resumo de Protocolos</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {getUserProtocolCount(currentUser.name)} protocolo(s)
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Total de protocolos registrados por você
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Agente: <span className="font-semibold">{currentUser.name}</span>
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {getUserProtocolCount(currentUser.name)} protocolos tratados
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONU Models Tab */}
          <TabsContent value="onu-models" className="space-y-6">
            {onuModels.length === 0 ? (
              <div className="text-center py-12">
                <Wifi className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma ONU cadastrada</h3>
                <p className="text-muted-foreground">As ONUs cadastradas pelo admin aparecerão aqui.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {onuModels.map((onu) => (
                  <Card key={onu.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center space-x-2">
                            <span>{onu.brand}</span>
                            <Badge variant="outline">{onu.model}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">{onu.descriptions[0] || "Sem descrição"}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Image Carousel */}
                      <Carousel className="w-full">
                        <CarouselContent>
                          {onu.images.length > 0 ? (
                            onu.images.map((image, index) => (
                              <CarouselItem key={index}>
                                <div className="flex aspect-video items-center justify-center p-6 bg-muted rounded-lg">
                                  <img 
                                    src={convertGoogleDriveLink(image)} 
                                    alt={`${onu.brand} ${onu.model} - Imagem ${index + 1}`}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<div class="text-center text-muted-foreground">Imagem ${index + 1} não carregou</div>`;
                                      }
                                    }}
                                  />
                                </div>
                              </CarouselItem>
                            ))
                          ) : (
                            <CarouselItem>
                              <div className="flex aspect-video items-center justify-center p-6 bg-muted rounded-lg">
                                <div className="text-center text-muted-foreground">
                                  <Wifi className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>Nenhuma imagem disponível</p>
                                </div>
                              </div>
                            </CarouselItem>
                          )}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>

                      {/* Descriptions */}
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Descrições</h4>
                        <div className="space-y-2">
                          {onu.descriptions.filter(desc => desc.trim() !== "").map((desc, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-muted-foreground">{desc}</span>
                            </div>
                          ))}
                          {onu.descriptions.filter(desc => desc.trim() !== "").length === 0 && (
                            <p className="text-sm text-muted-foreground">Nenhuma descrição disponível.</p>
                          )}
                        </div>
                      </div>

                      {onu.manualLink && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.open(onu.manualLink, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Manual Técnico
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;