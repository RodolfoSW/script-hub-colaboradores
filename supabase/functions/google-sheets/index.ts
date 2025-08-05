
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

const SPREADSHEET_ID = "1eAgZ1p9eYEhOVMoNdNI4IClzJ5Zg04AI3ExPyO0AjfU";

async function getAccessToken(): Promise<string> {
  console.log('🔐 Iniciando processo de autenticação Google Sheets...');
  
  // Verificar se todas as variáveis de ambiente estão presentes
  const envVars = {
    'GOOGLE_SERVICE_ACCOUNT_TYPE': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_TYPE'),
    'GOOGLE_SERVICE_ACCOUNT_PROJECT_ID': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PROJECT_ID'),
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID'),
    'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') ? '[PRESENTE]' : '[AUSENTE]',
    'GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL'),
    'GOOGLE_SERVICE_ACCOUNT_CLIENT_ID': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_ID'),
    'GOOGLE_SERVICE_ACCOUNT_AUTH_URI': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_AUTH_URI'),
    'GOOGLE_SERVICE_ACCOUNT_TOKEN_URI': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_TOKEN_URI'),
    'GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL'),
    'GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL'),
    'GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN': Deno.env.get('GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN')
  };
  
  console.log('🔍 Verificando variáveis de ambiente:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅ Presente' : '❌ Ausente'}`);
  });
  
  const missingVars = Object.entries(envVars).filter(([key, value]) => !value);
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente ausentes:', missingVars.map(([key]) => key));
    throw new Error(`Variáveis de ambiente ausentes: ${missingVars.map(([key]) => key).join(', ')}`);
  }
  
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

  console.log('✅ Credenciais carregadas para email:', credentials.client_email);
  console.log('📋 Project ID:', credentials.project_id);
  console.log('🔑 Private Key ID:', credentials.private_key_id);

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now,
  };

  console.log('🔐 Payload JWT criado:', {
    iss: payload.iss,
    scope: payload.scope,
    aud: payload.aud,
    exp: new Date(payload.exp * 1000).toISOString(),
    iat: new Date(payload.iat * 1000).toISOString()
  });

  try {
    // Converter a chave privada para formato correto
    const privateKeyPem = credentials.private_key;
    console.log('🔑 Processando chave privada (primeiros 50 chars):', privateKeyPem.substring(0, 50) + '...');
    
    // Remover cabeçalhos e rodapés e converter para ArrayBuffer
    const privateKeyB64 = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, '');

    console.log('🔧 Chave privada processada (base64 length):', privateKeyB64.length);

    const binaryDer = Uint8Array.from(atob(privateKeyB64), c => c.charCodeAt(0));
    console.log('🔧 Chave convertida para Uint8Array, size:', binaryDer.length);

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

    console.log('✅ Chave privada importada com sucesso');

    const jwt = await JWT.sign(payload, privateKey, { alg: 'RS256' });
    console.log('✅ JWT criado com sucesso (primeiros 50 chars):', jwt.substring(0, 50) + '...');

    console.log('🌐 Solicitando token de acesso do Google...');
    console.log('📍 Token URI:', credentials.token_uri);

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

    console.log('📡 Response status do Google:', tokenResponse.status, tokenResponse.statusText);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Erro na autenticação do Google:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        errorText: errorText
      });
      throw new Error(`Erro na autenticação: ${tokenResponse.statusText} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token de acesso obtido com sucesso');
    console.log('⏰ Token type:', tokenData.token_type);
    console.log('⏰ Expires in:', tokenData.expires_in, 'seconds');
    
    return tokenData.access_token;
    
  } catch (cryptoError) {
    console.error('❌ ERRO CRÍTICO na criação do JWT:', {
      name: cryptoError.name,
      message: cryptoError.message,
      stack: cryptoError.stack
    });
    throw cryptoError;
  }
}

async function makeGoogleSheetsRequest(endpoint: string, options: RequestInit = {}) {
  console.log('📊 Iniciando requisição para Google Sheets API');
  console.log('📍 Endpoint:', endpoint);
  console.log('🔧 Method:', options.method || 'GET');
  
  try {
    const accessToken = await getAccessToken();
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
    const url = `${baseUrl}${endpoint}`;
    
    console.log('🌐 URL completa:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('📡 Response status da Google Sheets API:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na Google Sheets API:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        url: url
      });
      throw new Error(`Google Sheets API error: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Resposta da Google Sheets API recebida com sucesso');
    
    // Log específico para operações de leitura
    if (options.method !== 'PUT' && options.method !== 'POST') {
      console.log('📊 Dados lidos - Número de linhas:', result.values?.length || 0);
    }
    
    return result;
    
  } catch (apiError) {
    console.error('❌ ERRO CRÍTICO na requisição da Google Sheets API:', {
      name: apiError.name,
      message: apiError.message,
      stack: apiError.stack,
      endpoint: endpoint
    });
    throw apiError;
  }
}

serve(async (req) => {
  console.log('🚀 Recebendo requisição na Edge Function');
  console.log('🔧 Method:', req.method);
  console.log('📍 URL:', req.url);
  console.log('📋 Headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Respondendo OPTIONS request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json();
    const { action, range, values } = requestBody;
    
    console.log('📥 Dados da requisição:');
    console.log('  🎯 Ação:', action);
    console.log('  📍 Range:', range);
    console.log('  📊 Valores (length):', Array.isArray(values) ? values.length : 'N/A');

    switch (action) {
      case 'read':
        console.log('📖 Executando operação de LEITURA');
        const readResponse = await makeGoogleSheetsRequest(`/values/${range || 'A:U'}`);
        const responseData = { data: readResponse.values || [] };
        console.log('✅ Leitura concluída, retornando', responseData.data.length, 'linhas');
        return new Response(
          JSON.stringify(responseData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'write':
        console.log('✍️ Executando operação de ESCRITA');
        console.log('📊 Escrevendo', Array.isArray(values) ? values.length : 0, 'linhas');
        await makeGoogleSheetsRequest(`/values/${range}?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          body: JSON.stringify({ values })
        });
        console.log('✅ Escrita concluída com sucesso');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'append':
        console.log('➕ Executando operação de ADIÇÃO');
        await makeGoogleSheetsRequest('/values/A:U:append?valueInputOption=USER_ENTERED', {
          method: 'POST',
          body: JSON.stringify({ values: [values] })
        });
        console.log('✅ Adição concluída com sucesso');
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        console.error('❌ Ação inválida solicitada:', action);
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na Edge Function:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: {
          name: error.name,
          stack: error.stack?.substring(0, 500) // Limitar stack trace
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
