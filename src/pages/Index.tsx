import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { 
  Search, 
  Headphones, 
  DollarSign, 
  FileText, 
  Wifi, 
  Router, 
  Copy,
  ExternalLink
} from "lucide-react";

interface OnuModel {
  id: string;
  brand: string;
  model: string;
  description: string;
  images: string[];
  specs: string[];
}

interface Script {
  id: string;
  title: string;
  description: string;
  category: "support" | "financial" | "other";
  content: string;
  tags: string[];
}

const onuModels: OnuModel[] = [
  {
    id: "1",
    brand: "NOKIA",
    model: "G-240W-C",
    description: "ONU GPON com WiFi integrado",
    images: [
      "/api/placeholder/400/300",
      "/api/placeholder/400/300", 
      "/api/placeholder/400/300"
    ],
    specs: ["GPON", "WiFi 2.4GHz", "4 portas Ethernet", "1 porta USB"]
  },
  {
    id: "2", 
    brand: "DATACOM",
    model: "DM985-404",
    description: "ONU GPON residencial",
    images: [
      "/api/placeholder/400/300",
      "/api/placeholder/400/300",
      "/api/placeholder/400/300"
    ],
    specs: ["GPON", "4 portas Ethernet", "2 portas FXS", "WiFi dual band"]
  },
  {
    id: "3",
    brand: "HUAWEI", 
    model: "HG8245H",
    description: "Gateway GPON multifuncional",
    images: [
      "/api/placeholder/400/300",
      "/api/placeholder/400/300",
      "/api/placeholder/400/300"
    ],
    specs: ["GPON", "4 portas GE", "2 portas FXS", "WiFi 802.11n", "1 porta USB"]
  },
  {
    id: "4",
    brand: "TPLINK",
    model: "TX-6610",
    description: "ONU GPON com WiFi AC",
    images: [
      "/api/placeholder/400/300", 
      "/api/placeholder/400/300",
      "/api/placeholder/400/300"
    ],
    specs: ["GPON", "WiFi AC1200", "4 portas Gigabit", "2 antenas externas"]
  }
];

const scripts: Script[] = [
  {
    id: "1",
    title: "Verificação de Sinal",
    description: "Script para verificar qualidade do sinal GPON",
    category: "support",
    content: "show interface gpon-onu_1/1/1:1",
    tags: ["gpon", "sinal", "troubleshooting"]
  },
  {
    id: "2", 
    title: "Reset de ONU",
    description: "Procedimento para reset remoto da ONU",
    category: "support", 
    content: "onu reset gpon-onu_1/1/1:1",
    tags: ["reset", "onu", "gpon"]
  },
  {
    id: "3",
    title: "Consulta de Débitos",
    description: "Verificar débitos pendentes do cliente",
    category: "financial",
    content: "SELECT * FROM debitos WHERE cliente_id = ?",
    tags: ["débitos", "financeiro", "consulta"]
  },
  {
    id: "4",
    title: "Gerar Boleto",
    description: "Script para gerar segunda via de boleto",
    category: "financial", 
    content: "EXEC sp_gerar_boleto @cliente_id, @vencimento",
    tags: ["boleto", "cobrança", "financeiro"]
  },
  {
    id: "5",
    title: "Backup de Configuração",
    description: "Fazer backup das configurações da OLT",
    category: "other",
    content: "copy running-config tftp://192.168.1.100/backup.cfg",
    tags: ["backup", "configuração", "olt"]
  }
];

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "support" | "financial" | "other">("all");

  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         script.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || script.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
            <Badge variant="secondary" className="text-sm">
              Agente: João Silva
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="scripts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="scripts" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Scripts</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScripts.map((script) => (
                <Card key={script.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{script.title}</CardTitle>
                        <CardDescription className="mt-1">{script.description}</CardDescription>
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
                      <div className="bg-muted p-3 rounded-md font-mono text-sm">
                        {script.content}
                      </div>
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
                          onClick={() => copyToClipboard(script.content)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredScripts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum script encontrado</h3>
                <p className="text-muted-foreground">Tente ajustar sua busca ou filtros.</p>
              </div>
            )}
          </TabsContent>

          {/* ONU Models Tab */}
          <TabsContent value="onu-models" className="space-y-6">
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
                        <CardDescription className="mt-1">{onu.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Image Carousel */}
                    <Carousel className="w-full">
                      <CarouselContent>
                        {onu.images.map((image, index) => (
                          <CarouselItem key={index}>
                            <div className="flex aspect-video items-center justify-center p-6 bg-muted rounded-lg">
                              <img 
                                src={image} 
                                alt={`${onu.brand} ${onu.model} - Visão ${index + 1}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>

                    {/* Specifications */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Especificações</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {onu.specs.map((spec, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-primary rounded-full"></div>
                            <span className="text-sm text-muted-foreground">{spec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Manual Técnico
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;