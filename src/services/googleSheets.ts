interface User {
  id: string;
  username: string;
  name: string;
  password: string;
  role: string;
  createdAt: string;
}

interface Script {
  id: string;
  title: string;
  description: string;
  category: "support" | "financial" | "other";
  content: string;
  tags: string[];
  createdAt: string;
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

interface Protocol {
  id: string;
  number: string;
  agentName: string;
  timestamp: string;
}

const SPREADSHEET_ID = "18FLQ3d0A6zbaWmGpVxQ5-MS5acC4f-5u2FTvPvWl0qM";

// Função para obter a API key do localStorage
function getApiKey(): string | null {
  return localStorage.getItem("google_sheets_api_key");
}

// Colunas da planilha conforme especificado pelo usuário
const COLUMNS = {
  USERNAME: 0,        // Nome de usuário
  FULL_NAME: 1,       // Nome completo
  PASSWORD: 2,        // Senha
  ROLE: 3,            // Cargo
  SCRIPT_TITLE: 4,    // Título(script)
  SCRIPT_CATEGORY: 5, // Categoria(script)
  SCRIPT_CONTENT: 6,  // Conteúdo do Script
  ONU_MODEL: 7,       // Modelo(ONU)
  ONU_BRAND: 8,       // Marca(ONU)
  ONU_MANUAL_LINK: 9, // Link do Manual (ONU)
  ONU_IMAGE_1: 10,    // Imagem 1(ONU)
  ONU_IMAGE_2: 11,    // Imagem 2(ONU)
  ONU_IMAGE_3: 12,    // Imagem 3(ONU)
  ONU_IMAGE_4: 13,    // Imagem 4(ONU)
  ONU_DESC_1: 14,     // Descrição 1(ONU)
  ONU_DESC_2: 15,     // Descrição 2(ONU)
  ONU_DESC_3: 16,     // Descrição 3(ONU)
  ONU_DESC_4: 17,     // Descrição 4(ONU)
  PROTOCOLS: 18,      // Protocolos
  HISTORY: 19,        // Histórico
  SCRIPT_CHANGES: 20  // de Alterações nos Scripts
};

// Função para fazer requisições para a Google Sheets API
async function makeGoogleSheetsRequest(endpoint: string, options: RequestInit = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key não configurada');
  }
  
  const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;
  const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${apiKey}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Google Sheets API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Função para ler dados da planilha
async function readSheetData(range: string = 'A:U') {
  try {
    const response = await makeGoogleSheetsRequest(`/values/${range}`);
    return response.values || [];
  } catch (error) {
    console.error('Erro ao ler dados da planilha:', error);
    return [];
  }
}

// Função para escrever dados na planilha
async function writeSheetData(range: string, values: any[][]) {
  try {
    const response = await makeGoogleSheetsRequest(`/values/${range}`, {
      method: 'PUT',
      body: JSON.stringify({
        values: values,
        valueInputOption: 'RAW'
      })
    });
    return response;
  } catch (error) {
    console.error('Erro ao escrever dados na planilha:', error);
    throw error;
  }
}

// Função para adicionar nova linha na planilha
async function appendSheetData(values: any[]) {
  try {
    const response = await makeGoogleSheetsRequest('/values/A:U:append', {
      method: 'POST',
      body: JSON.stringify({
        values: [values],
        valueInputOption: 'RAW'
      })
    });
    return response;
  } catch (error) {
    console.error('Erro ao adicionar dados na planilha:', error);
    throw error;
  }
}

// Função para converter dados da planilha para objetos
function parseSheetDataToObjects(sheetData: any[][]): { users: User[], scripts: Script[], onus: ONU[], protocols: Protocol[] } {
  const users: User[] = [];
  const scripts: Script[] = [];
  const onus: ONU[] = [];
  const protocols: Protocol[] = [];
  
  // Pular o cabeçalho (primeira linha)
  const dataRows = sheetData.slice(1);
  
  dataRows.forEach((row, index) => {
    // Processar usuários
    if (row[COLUMNS.USERNAME] && row[COLUMNS.FULL_NAME]) {
      users.push({
        id: (index + 1).toString(),
        username: row[COLUMNS.USERNAME] || '',
        name: row[COLUMNS.FULL_NAME] || '',
        password: row[COLUMNS.PASSWORD] || '',
        role: row[COLUMNS.ROLE] || '',
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    
    // Processar scripts
    if (row[COLUMNS.SCRIPT_TITLE] && row[COLUMNS.SCRIPT_CONTENT]) {
      scripts.push({
        id: (index + 1).toString(),
        title: row[COLUMNS.SCRIPT_TITLE] || '',
        description: row[COLUMNS.SCRIPT_TITLE] || '',
        category: (row[COLUMNS.SCRIPT_CATEGORY] || 'support') as "support" | "financial" | "other",
        content: row[COLUMNS.SCRIPT_CONTENT] || '',
        tags: [],
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    
    // Processar ONUs
    if (row[COLUMNS.ONU_MODEL] && row[COLUMNS.ONU_BRAND]) {
      const images = [
        row[COLUMNS.ONU_IMAGE_1],
        row[COLUMNS.ONU_IMAGE_2],
        row[COLUMNS.ONU_IMAGE_3],
        row[COLUMNS.ONU_IMAGE_4]
      ].filter(img => img);
      
      const descriptions = [
        row[COLUMNS.ONU_DESC_1],
        row[COLUMNS.ONU_DESC_2],
        row[COLUMNS.ONU_DESC_3],
        row[COLUMNS.ONU_DESC_4]
      ].filter(desc => desc);
      
      onus.push({
        id: (index + 1).toString(),
        model: row[COLUMNS.ONU_MODEL] || '',
        brand: row[COLUMNS.ONU_BRAND] || '',
        images,
        descriptions,
        manualLink: row[COLUMNS.ONU_MANUAL_LINK] || undefined,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    
    // Processar protocolos
    if (row[COLUMNS.PROTOCOLS]) {
      try {
        const protocolsData = JSON.parse(row[COLUMNS.PROTOCOLS]);
        if (Array.isArray(protocolsData)) {
          protocols.push(...protocolsData);
        }
      } catch (error) {
        console.warn('Erro ao parsear protocolos:', error);
      }
    }
  });
  
  return { users, scripts, onus, protocols };
}

// Função para converter objetos para dados da planilha
function convertObjectsToSheetData(users: User[], scripts: Script[], onus: ONU[], protocols: Protocol[]): any[][] {
  const rows: any[][] = [];
  
  // Criar um mapa para organizar os dados por linha
  const dataMap = new Map<string, any[]>();
  
  // Adicionar usuários
  users.forEach(user => {
    const rowKey = `user_${user.id}`;
    dataMap.set(rowKey, new Array(21).fill(''));
    const row = dataMap.get(rowKey)!;
    row[COLUMNS.USERNAME] = user.username;
    row[COLUMNS.FULL_NAME] = user.name;
    row[COLUMNS.PASSWORD] = user.password;
    row[COLUMNS.ROLE] = user.role;
  });
  
  // Adicionar scripts
  scripts.forEach(script => {
    const rowKey = `script_${script.id}`;
    if (!dataMap.has(rowKey)) {
      dataMap.set(rowKey, new Array(21).fill(''));
    }
    const row = dataMap.get(rowKey)!;
    row[COLUMNS.SCRIPT_TITLE] = script.title;
    row[COLUMNS.SCRIPT_CATEGORY] = script.category;
    row[COLUMNS.SCRIPT_CONTENT] = script.content;
  });
  
  // Adicionar ONUs
  onus.forEach(onu => {
    const rowKey = `onu_${onu.id}`;
    if (!dataMap.has(rowKey)) {
      dataMap.set(rowKey, new Array(21).fill(''));
    }
    const row = dataMap.get(rowKey)!;
    row[COLUMNS.ONU_MODEL] = onu.model;
    row[COLUMNS.ONU_BRAND] = onu.brand;
    row[COLUMNS.ONU_MANUAL_LINK] = onu.manualLink || '';
    
    // Adicionar imagens
    onu.images.forEach((image, index) => {
      if (index < 4) {
        row[COLUMNS.ONU_IMAGE_1 + index] = image;
      }
    });
    
    // Adicionar descrições
    onu.descriptions.forEach((desc, index) => {
      if (index < 4) {
        row[COLUMNS.ONU_DESC_1 + index] = desc;
      }
    });
  });
  
  // Adicionar protocolos como JSON na primeira linha disponível
  if (protocols.length > 0) {
    const firstRow = Array.from(dataMap.values())[0] || new Array(21).fill('');
    firstRow[COLUMNS.PROTOCOLS] = JSON.stringify(protocols);
  }
  
  return Array.from(dataMap.values());
}

// Funções principais para substituir o localStorage
export async function getUsersFromStorage(): Promise<User[]> {
  try {
    const sheetData = await readSheetData();
    const { users } = parseSheetDataToObjects(sheetData);
    return users.length > 0 ? users : [
      { id: "1", username: "agente", name: "João Silva", role: "N1 Callcenter", createdAt: "2024-01-15", password: "123456" }
    ];
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    // Fallback para localStorage
    const stored = localStorage.getItem("system_users");
    return stored ? JSON.parse(stored) : [
      { id: "1", username: "agente", name: "João Silva", role: "N1 Callcenter", createdAt: "2024-01-15", password: "123456" }
    ];
  }
}

export async function saveUsersToStorage(users: User[]): Promise<void> {
  try {
    const sheetData = await readSheetData();
    const { scripts, onus, protocols } = parseSheetDataToObjects(sheetData);
    const newSheetData = convertObjectsToSheetData(users, scripts, onus, protocols);
    
    // Adicionar cabeçalho
    const header = [
      'Nome de usuário', 'Nome completo', 'Senha', 'Cargo', 'Título(script)', 
      'Categoria(script)', 'Conteúdo do Script', 'Modelo(ONU)', 'Marca(ONU)', 
      'Link do Manual (ONU)', 'Imagem 1(ONU)', 'Imagem 2(ONU)', 'Imagem 3(ONU)', 
      'Imagem 4(ONU)', 'Descrição 1(ONU)', 'Descrição 2(ONU)', 'Descrição 3(ONU)', 
      'Descrição 4(ONU)', 'Protocolos', 'Histórico', 'de Alterações nos Scripts'
    ];
    
    await writeSheetData('A:U', [header, ...newSheetData]);
  } catch (error) {
    console.error('Erro ao salvar usuários:', error);
    // Fallback para localStorage
    localStorage.setItem("system_users", JSON.stringify(users));
  }
}

export async function getScriptsFromStorage(): Promise<Script[]> {
  try {
    const sheetData = await readSheetData();
    const { scripts } = parseSheetDataToObjects(sheetData);
    return scripts.length > 0 ? scripts : [];
  } catch (error) {
    console.error('Erro ao carregar scripts:', error);
    // Fallback para localStorage
    const stored = localStorage.getItem("system_scripts");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveScriptsToStorage(scripts: Script[]): Promise<void> {
  try {
    const sheetData = await readSheetData();
    const { users, onus, protocols } = parseSheetDataToObjects(sheetData);
    const newSheetData = convertObjectsToSheetData(users, scripts, onus, protocols);
    
    // Adicionar cabeçalho
    const header = [
      'Nome de usuário', 'Nome completo', 'Senha', 'Cargo', 'Título(script)', 
      'Categoria(script)', 'Conteúdo do Script', 'Modelo(ONU)', 'Marca(ONU)', 
      'Link do Manual (ONU)', 'Imagem 1(ONU)', 'Imagem 2(ONU)', 'Imagem 3(ONU)', 
      'Imagem 4(ONU)', 'Descrição 1(ONU)', 'Descrição 2(ONU)', 'Descrição 3(ONU)', 
      'Descrição 4(ONU)', 'Protocolos', 'Histórico', 'de Alterações nos Scripts'
    ];
    
    await writeSheetData('A:U', [header, ...newSheetData]);
  } catch (error) {
    console.error('Erro ao salvar scripts:', error);
    // Fallback para localStorage
    localStorage.setItem("system_scripts", JSON.stringify(scripts));
  }
}

export async function getONUsFromStorage(): Promise<ONU[]> {
  try {
    const sheetData = await readSheetData();
    const { onus } = parseSheetDataToObjects(sheetData);
    return onus;
  } catch (error) {
    console.error('Erro ao carregar ONUs:', error);
    // Fallback para localStorage
    const stored = localStorage.getItem("system_onus");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveONUsToStorage(onus: ONU[]): Promise<void> {
  try {
    const sheetData = await readSheetData();
    const { users, scripts, protocols } = parseSheetDataToObjects(sheetData);
    const newSheetData = convertObjectsToSheetData(users, scripts, onus, protocols);
    
    // Adicionar cabeçalho
    const header = [
      'Nome de usuário', 'Nome completo', 'Senha', 'Cargo', 'Título(script)', 
      'Categoria(script)', 'Conteúdo do Script', 'Modelo(ONU)', 'Marca(ONU)', 
      'Link do Manual (ONU)', 'Imagem 1(ONU)', 'Imagem 2(ONU)', 'Imagem 3(ONU)', 
      'Imagem 4(ONU)', 'Descrição 1(ONU)', 'Descrição 2(ONU)', 'Descrição 3(ONU)', 
      'Descrição 4(ONU)', 'Protocolos', 'Histórico', 'de Alterações nos Scripts'
    ];
    
    await writeSheetData('A:U', [header, ...newSheetData]);
  } catch (error) {
    console.error('Erro ao salvar ONUs:', error);
    // Fallback para localStorage
    localStorage.setItem("system_onus", JSON.stringify(onus));
  }
}

export async function getProtocolsFromStorage(): Promise<Protocol[]> {
  try {
    const sheetData = await readSheetData();
    const { protocols } = parseSheetDataToObjects(sheetData);
    return protocols;
  } catch (error) {
    console.error('Erro ao carregar protocolos:', error);
    // Fallback para localStorage
    const stored = localStorage.getItem("protocols");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveProtocolsToStorage(protocols: Protocol[]): Promise<void> {
  try {
    const sheetData = await readSheetData();
    const { users, scripts, onus } = parseSheetDataToObjects(sheetData);
    const newSheetData = convertObjectsToSheetData(users, scripts, onus, protocols);
    
    // Adicionar cabeçalho
    const header = [
      'Nome de usuário', 'Nome completo', 'Senha', 'Cargo', 'Título(script)', 
      'Categoria(script)', 'Conteúdo do Script', 'Modelo(ONU)', 'Marca(ONU)', 
      'Link do Manual (ONU)', 'Imagem 1(ONU)', 'Imagem 2(ONU)', 'Imagem 3(ONU)', 
      'Imagem 4(ONU)', 'Descrição 1(ONU)', 'Descrição 2(ONU)', 'Descrição 3(ONU)', 
      'Descrição 4(ONU)', 'Protocolos', 'Histórico', 'de Alterações nos Scripts'
    ];
    
    await writeSheetData('A:U', [header, ...newSheetData]);
  } catch (error) {
    console.error('Erro ao salvar protocolos:', error);
    // Fallback para localStorage
    localStorage.setItem("protocols", JSON.stringify(protocols));
  }
}

export async function getScriptLogsFromStorage(): Promise<any[]> {
  try {
    const sheetData = await readSheetData();
    // Buscar logs na coluna de histórico
    const logs = sheetData.slice(1).map(row => {
      if (row[COLUMNS.HISTORY]) {
        try {
          return JSON.parse(row[COLUMNS.HISTORY]);
        } catch (error) {
          return [];
        }
      }
      return [];
    }).flat();
    
    return logs;
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
    // Fallback para localStorage
    const stored = localStorage.getItem("script_logs");
    return stored ? JSON.parse(stored) : [];
  }
}