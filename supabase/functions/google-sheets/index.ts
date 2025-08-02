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

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(credentials.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const jwt = await JWT.sign(payload, privateKey, { alg: 'RS256' });

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

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function makeGoogleSheetsRequest(endpoint: string, options: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
  const url = `${baseUrl}${endpoint}`;
  
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
    throw new Error(`Google Sheets API error: ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, range, values } = await req.json()

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
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})