import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Shield } from "lucide-react";

export const ServiceAccountStatus: React.FC = () => {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="flex items-center space-x-3 p-4">
        <Shield className="h-5 w-5 text-green-600" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-green-800">
              Google Sheets conectado via Conta de Serviço
            </span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-sm text-green-700">
            Integração segura configurada com autenticação do servidor
          </p>
        </div>
      </CardContent>
    </Card>
  );
};