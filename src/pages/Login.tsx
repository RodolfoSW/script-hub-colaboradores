import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Lock } from "lucide-react";

import { getUsersFromStorage } from "@/services/googleSheets";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Verificar admin
    if (username === "admin" && password === "admin") {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao painel administrativo.",
      });
      navigate("/admin");
      setIsLoading(false);
      return;
    }

    // Verificar usuários criados no sistema
    try {
      const systemUsers = await getUsersFromStorage();
      const foundUser = systemUsers.find((user: any) => 
        user.username === username && user.password === password
      );

      if (foundUser) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${foundUser.name}!`,
        });
        // Salvar informações do usuário logado
        localStorage.setItem("current_user", JSON.stringify({
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          role: foundUser.role
        }));
        navigate("/portal");
      } else {
        toast({
          title: "Erro no login",
          description: "Usuário ou senha incorretos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast({
        title: "Erro no sistema",
        description: "Não foi possível verificar as credenciais.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Portal do Agente</CardTitle>
          <CardDescription>
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Credenciais padrão:</p>
            <p>Admin - Usuário: <code className="bg-muted px-1 rounded">admin</code> | Senha: <code className="bg-muted px-1 rounded">admin</code></p>
            <p>Agente padrão - Usuário: <code className="bg-muted px-1 rounded">agente</code> | Senha: <code className="bg-muted px-1 rounded">123456</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;