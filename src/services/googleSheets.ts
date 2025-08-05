
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

const SPREADSHEET_ID = "1eAgZ1p9eYEhOVMoNdNI4IClzJ5Zg04AI3ExPyO0AjfU";

// Função para fazer chamadas para a Edge Function do Supabase
async function callSupabaseFunction(action: string, data: any = {}) {
  console.log('Chamando função do Supabase:', action, data);
  
  const response = await fetch('https://kxfqbfcqfczfkwcxxngd.supabase.co/functions/v1/google-sheets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZnFiZmNxZmN6ZmtXY3h4bmdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM0MjI1MjUsImV4cCI6MjA0ODk5ODUyNX0.CrJw9t9A1djV02Hpkk8yFJhMLhvuMVRmKQUZzEhgXx4'
    },
    body: JSON.stringify({
      action,
      ...data
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erro na resposta:', errorData);
    throw new Error(errorData.error || 'Erro na comunicação com o backend');
  }

  const result = await response.json();
  console.log('Resposta recebida:', result);
  return result;
}

// Função para ler dados da planilha
async function readSheetData(range: string = 'A:U') {
  try {
    console.log('Lendo dados da planilha, range:', range);
    const response = await callSupabaseFunction('read', { range });
    console.log('Dados lidos:', response.data?.length || 0, 'linhas');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao ler dados da planilha:', error);
    return [];
  }
}

// Função para escrever dados na planilha
async function writeSheetData(range: string, values: any[][]) {
  try {
    console.log('Escrevendo dados na planilha, range:', range, 'linhas:', values.length);
    await callSupabaseFunction('write', { range, values });
    console.log('Dados escritos com sucesso');
  } catch (error) {
    console.error('Erro ao escrever dados na planilha:', error);
    throw error;
  }
}

// Função para limpar a planilha e reescrever todos os dados
async function clearAndWriteAllData(users: User[], scripts: Script[], onus: ONU[], protocols: Protocol[]) {
  try {
    console.log('Limpando e reescrevendo todos os dados...');
    
    const allRows: any[][] = [];
    
    // Cabeçalho
    allRows.push([
      'Tipo', 'ID', 'Nome de usuário', 'Nome completo', 'Senha', 'Cargo', 
      'Título(script)', 'Categoria(script)', 'Conteúdo do Script', 
      'Modelo(ONU)', 'Marca(ONU)', 'Link do Manual (ONU)', 
      'Imagens(ONU)', 'Descrições(ONU)', 'Número Protocolo', 'Nome Agente', 
      'Timestamp', 'Tags', 'Criado em', 'Dados JSON'
    ]);
    
    // Adicionar usuários
    users.forEach(user => {
      allRows.push([
        'USER', user.id, user.username, user.name, user.password, user.role,
        '', '', '', '', '', '', '', '', '', '', '', '', user.createdAt, ''
      ]);
    });
    
    // Adicionar scripts
    scripts.forEach(script => {
      allRows.push([
        'SCRIPT', script.id, '', '', '', '', script.title, script.category, 
        script.content, '', '', '', '', '', '', '', '', 
        script.tags.join(','), script.createdAt, ''
      ]);
    });
    
    // Adicionar ONUs
    onus.forEach(onu => {
      allRows.push([
        'ONU', onu.id, '', '', '', '', '', '', '', onu.model, onu.brand, 
        onu.manualLink || '', JSON.stringify(onu.images), 
        JSON.stringify(onu.descriptions), '', '', '', '', onu.createdAt, ''
      ]);
    });
    
    // Adicionar protocolos
    protocols.forEach(protocol => {
      allRows.push([
        'PROTOCOL', protocol.id, '', '', '', '', '', '', '', '', '', '', 
        '', '', protocol.number, protocol.agentName, protocol.timestamp, 
        '', '', ''
      ]);
    });
    
    // Escrever tudo de uma vez
    await writeSheetData('A:T', allRows);
    console.log('Todos os dados foram escritos com sucesso');
    
  } catch (error) {
    console.error('Erro ao limpar e escrever dados:', error);
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
    const type = row[0]; // Primeiro campo indica o tipo
    
    if (type === 'USER' && row[2] && row[3]) { // username e name
      users.push({
        id: row[1] || (index + 1).toString(),
        username: row[2] || '',
        name: row[3] || '',
        password: row[4] || '',
        role: row[5] || '',
        createdAt: row[18] || new Date().toISOString().split('T')[0]
      });
    }
    
    if (type === 'SCRIPT' && row[6] && row[8]) { // title e content
      scripts.push({
        id: row[1] || (index + 1).toString(),
        title: row[6] || '',
        description: row[6] || '',
        category: (row[7] || 'support') as "support" | "financial" | "other",
        content: row[8] || '',
        tags: row[17] ? row[17].split(',') : [],
        createdAt: row[18] || new Date().toISOString().split('T')[0]
      });
    }
    
    if (type === 'ONU' && row[9] && row[10]) { // model e brand
      let images: string[] = [];
      let descriptions: string[] = [];
      
      try {
        if (row[12]) images = JSON.parse(row[12]);
        if (row[13]) descriptions = JSON.parse(row[13]);
      } catch (error) {
        console.warn('Erro ao parsear dados da ONU:', error);
      }
      
      onus.push({
        id: row[1] || (index + 1).toString(),
        model: row[9] || '',
        brand: row[10] || '',
        images: images,
        descriptions: descriptions,
        manualLink: row[11] || undefined,
        createdAt: row[18] || new Date().toISOString().split('T')[0]
      });
    }
    
    if (type === 'PROTOCOL' && row[14]) { // number
      protocols.push({
        id: row[1] || (index + 1).toString(),
        number: row[14] || '',
        agentName: row[15] || '',
        timestamp: row[16] || new Date().toISOString()
      });
    }
  });
  
  return { users, scripts, onus, protocols };
}

// Funções principais para substituir o localStorage
export async function getUsersFromStorage(): Promise<User[]> {
  try {
    console.log('Carregando usuários do Google Sheets...');
    const sheetData = await readSheetData();
    const { users } = parseSheetDataToObjects(sheetData);
    console.log('Usuários carregados:', users.length);
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
    console.log('Salvando usuários no Google Sheets...');
    
    // Carregar dados existentes
    const sheetData = await readSheetData();
    const { scripts, onus, protocols } = parseSheetDataToObjects(sheetData);
    
    // Reescrever tudo
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('Usuários salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar usuários:', error);
    // Fallback para localStorage
    localStorage.setItem("system_users", JSON.stringify(users));
    throw error;
  }
}

export async function getScriptsFromStorage(): Promise<Script[]> {
  try {
    console.log('Carregando scripts do Google Sheets...');
    const sheetData = await readSheetData();
    const { scripts } = parseSheetDataToObjects(sheetData);
    console.log('Scripts carregados:', scripts.length);
    return scripts;
  } catch (error) {
    console.error('Erro ao carregar scripts:', error);
    // Fallback para localStorage
    const stored = localStorage.getItem("system_scripts");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveScriptsToStorage(scripts: Script[]): Promise<void> {
  try {
    console.log('Salvando scripts no Google Sheets...');
    
    // Carregar dados existentes
    const sheetData = await readSheetData();
    const { users, onus, protocols } = parseSheetDataToObjects(sheetData);
    
    // Reescrever tudo
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('Scripts salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar scripts:', error);
    // Fallback para localStorage
    localStorage.setItem("system_scripts", JSON.stringify(scripts));
    throw error;
  }
}

export async function getONUsFromStorage(): Promise<ONU[]> {
  try {
    console.log('Carregando ONUs do Google Sheets...');
    const sheetData = await readSheetData();
    const { onus } = parseSheetDataToObjects(sheetData);
    console.log('ONUs carregados:', onus.length);
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
    console.log('Salvando ONUs no Google Sheets...');
    
    // Carregar dados existentes
    const sheetData = await readSheetData();
    const { users, scripts, protocols } = parseSheetDataToObjects(sheetData);
    
    // Reescrever tudo
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('ONUs salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar ONUs:', error);
    // Fallback para localStorage
    localStorage.setItem("system_onus", JSON.stringify(onus));
    throw error;
  }
}

export async function getProtocolsFromStorage(): Promise<Protocol[]> {
  try {
    console.log('Carregando protocolos do Google Sheets...');
    const sheetData = await readSheetData();
    const { protocols } = parseSheetDataToObjects(sheetData);
    console.log('Protocolos carregados:', protocols.length);
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
    console.log('Salvando protocolos no Google Sheets...');
    
    // Carregar dados existentes
    const sheetData = await readSheetData();
    const { users, scripts, onus } = parseSheetDataToObjects(sheetData);
    
    // Reescrever tudo
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('Protocolos salvos com sucesso');
  } catch (error) {
    console.error('Erro ao salvar protocolos:', error);
    // Fallback para localStorage
    localStorage.setItem("protocols", JSON.stringify(protocols));
    throw error;
  }
}

export async function getScriptLogsFromStorage(): Promise<any[]> {
  try {
    console.log('Carregando logs do Google Sheets...');
    const sheetData = await readSheetData();
    // Por enquanto, retornar array vazio já que logs não estão implementados na nova estrutura
    return [];
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
    // Fallback para localStorage
    const stored = localStorage.getItem("script_logs");
    return stored ? JSON.parse(stored) : [];
  }
}
