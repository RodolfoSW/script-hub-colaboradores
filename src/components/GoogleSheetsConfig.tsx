import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, ExternalLink, Key, CheckCircle, XCircle } from "lucide-react";

interface GoogleSheetsConfigProps {
  onConfigured: (apiKey: string) => void;
}

export const GoogleSheetsConfig: React.FC<GoogleSheetsConfigProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se já existe uma API key configurada
    const storedApiKey = localStorage.getItem("google_sheets_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsConfigured(true);
      onConfigured(storedApiKey);
    }
  }, [onConfigured]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma API key válida.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Testar a API key fazendo uma requisição simples
      const testResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/18FLQ3d0A6zbaWmGpVxQ5-MS5acC4f-5u2FTvPvWl0qM?key=${apiKey}`
      );

      if (testResponse.ok) {
        localStorage.setItem("google_sheets_api_key", apiKey);
        setIsConfigured(true);
        onConfigured(apiKey);
        setIsOpen(false);
        
        toast({
          title: "Configuração salva!",
          description: "Google Sheets configurado com sucesso.",
        });
      } else {
        throw new Error("API key inválida");
      }
    } catch (error) {
      toast({
        title: "Erro na configuração",
        description: "Verifique se a API key está correta e se tem as permissões necessárias.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveConfig = () => {
    localStorage.removeItem("google_sheets_api_key");
    setApiKey("");
    setIsConfigured(false);
    setIsOpen(false);
    
    toast({
      title: "Configuração removida",
      description: "A integração com Google Sheets foi desativada.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Google Sheets
          {isConfigured ? (
            <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 ml-2 text-red-500" />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configurar Google Sheets</DialogTitle>
          <DialogDescription>
            Configure a integração com Google Sheets para salvar os dados da aplicação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como configurar:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-2">
                <p><strong>1.</strong> Acesse o Google Cloud Console</p>
                <p><strong>2.</strong> Crie um novo projeto ou selecione um existente</p>
                <p><strong>3.</strong> Ative a Google Sheets API</p>
                <p><strong>4.</strong> Crie uma API key em "Credenciais"</p>
                <p><strong>5.</strong> Configure as restrições da API para Google Sheets API</p>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://console.cloud.google.com/", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Google Cloud Console
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://docs.google.com/spreadsheets/d/18FLQ3d0A6zbaWmGpVxQ5-MS5acC4f-5u2FTvPvWl0qM/edit?usp=sharing", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Planilha
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key">API Key do Google Sheets</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua API key aqui..."
                className="mt-1"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSaveApiKey}
                disabled={isLoading}
                className="flex-1"
              >
                <Key className="h-4 w-4 mr-2" />
                {isLoading ? "Testando..." : "Salvar Configuração"}
              </Button>
              
              {isConfigured && (
                <Button
                  variant="destructive"
                  onClick={handleRemoveConfig}
                  size="sm"
                >
                  Remover
                </Button>
              )}
            </div>
          </div>

          <Card className="bg-muted">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>Importante:</strong> Certifique-se de que a planilha está compartilhada 
                publicamente ou que sua API key tem acesso à planilha especificada.
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};