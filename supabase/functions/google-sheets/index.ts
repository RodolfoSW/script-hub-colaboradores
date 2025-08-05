
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { JWT } from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

const SPREADSHEET_ID = "18FLQ3d0A6zbaWmGpVxQ5-MS5acC4f-5u2FTvPvWl0qM";

async function getAccessToken(): Promise<string> {
  console.log('Iniciando processo de autenticação...');
  
  const credentials: ServiceAccountCredentials = {
    type: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_TYPE') || '',
    project_id: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PROJECT_ID') || '',
    private_key_id: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID') || '',
    private_key: (Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || '').replace(/\\n/g, '\n'),
    client_email: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL') || '',
    client_id: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_ID') || '',
    auth_uri: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_AUTH_URI') || '',
    token_uri: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_TOKEN_URI') || '',
    auth_provider_x509_cert_url: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL') || '',
    client_x509_cert_url: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL') || '',
    universe_domain: Deno.env.get('GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN') || ''
  };

  console.log('Credenciais carregadas, email:', credentials.client_email);

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now,
  };

  console.log('Criando JWT...');

  // Converter a chave privada para formato correto
  const privateKeyPem = credentials.private_key;
  
  // Remover cabeçalhos e rodapés e converter para ArrayBuffer
  const privateKeyB64 = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(privateKeyB64), c => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  console.log('Chave privada importada, assinando JWT...');

  const jwt = await JWT.sign(payload, privateKey, { alg: 'RS256' });

  console.log('JWT criado, solicitando token de acesso...');

  const tokenResponse = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Erro ao obter token:', errorText);
    throw new Error(`Erro na autenticação: ${tokenResponse.statusText} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  console.log('Token de acesso obtido com sucesso');
  return tokenData.access_token;
}

async function makeGoogleSheetsRequest(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
  const url = `${baseUrl}${endpoint}`;
  
  console.log('Fazendo requisição para:', url);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Erro na API do Google Sheets:', errorText);
    throw new Error(`Google Sheets API error: ${response.statusText} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('Resposta recebida com sucesso');
  return result;
}

serve(async (req) => {
  console.log('Recebendo requisição:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, range, values } = await req.json()
    console.log('Ação solicitada:', action, 'Range:', range);

    switch (action) {
      case 'read':
        const readResponse = await makeGoogleSheetsRequest(`/values/${range || 'A:U'}`);
        return new Response(
          JSON.stringify({ data: readResponse.values || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'write':
        await makeGoogleSheetsRequest(`/values/${range}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ values })
        });
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'append':
        await makeGoogleSheetsRequest('/values/A:U:append?valueInputOption=USER_ENTERED', {
          method: 'POST',
          body: JSON.stringify({ values: [values] })
        });
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
