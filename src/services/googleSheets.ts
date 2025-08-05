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
  console.log('🔄 Iniciando chamada para função do Supabase');
  console.log('📋 Ação:', action);
  console.log('📊 Dados enviados:', data);
  console.log('📍 URL da função:', 'https://kxfqbfcqfczfkwcxxngd.supabase.co/functions/v1/google-sheets');
  
  try {
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

    console.log('📡 Status da resposta HTTP:', response.status, response.statusText);
    console.log('🌐 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ERRO - Resposta não ok:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      
      // Tentar parsear como JSON se possível
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ ERRO JSON:', errorJson);
        throw new Error(`Erro ${response.status}: ${errorJson.error || errorText}`);
      } catch (parseError) {
        console.error('❌ ERRO - Não foi possível parsear erro como JSON:', parseError);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('✅ Resposta recebida com sucesso:', result);
    return result;
    
  } catch (fetchError) {
    console.error('❌ ERRO CRÍTICO na chamada da função:', {
      name: fetchError.name,
      message: fetchError.message,
      stack: fetchError.stack
    });
    
    // Verificar se é erro de rede
    if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
      console.error('🌐 Erro de conectividade - Verifique a conexão com a internet');
    }
    
    throw fetchError;
  }
}

// Função para ler dados da planilha
async function readSheetData(range: string = 'A:U') {
  try {
    console.log('📖 Iniciando leitura da planilha');
    console.log('📍 Range solicitado:', range);
    console.log('📊 ID da planilha:', SPREADSHEET_ID);
    
    const response = await callSupabaseFunction('read', { range });
    const dataLength = response.data?.length || 0;
    
    console.log('📈 Dados lidos com sucesso:', dataLength, 'linhas');
    console.log('📋 Primeiras 3 linhas (para debug):', response.data?.slice(0, 3));
    
    return response.data || [];
  } catch (error) {
    console.error('❌ ERRO ao ler dados da planilha:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    console.log('🔄 Retornando array vazio devido ao erro');
    return [];
  }
}

// Função para escrever dados na planilha
async function writeSheetData(range: string, values: any[][]) {
  try {
    console.log('✍️ Iniciando escrita na planilha');
    console.log('📍 Range:', range);
    console.log('📊 Número de linhas a escrever:', values.length);
    console.log('📋 Primeira linha (cabeçalho):', values[0]);
    console.log('📋 Segunda linha (exemplo):', values[1]);
    
    const response = await callSupabaseFunction('write', { range, values });
    
    console.log('✅ Dados escritos com sucesso na planilha');
    return response;
    
  } catch (error) {
    console.error('❌ ERRO ao escrever dados na planilha:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      range: range,
      dataSize: values.length
    });
    throw error;
  }
}

// Função para limpar a planilha e reescrever todos os dados
async function clearAndWriteAllData(users: User[], scripts: Script[], onus: ONU[], protocols: Protocol[]) {
  try {
    console.log('🧹 Iniciando limpeza e reescrita de todos os dados');
    console.log('👥 Usuários:', users.length);
    console.log('📝 Scripts:', scripts.length);
    console.log('📡 ONUs:', onus.length);
    console.log('📋 Protocolos:', protocols.length);
    
    const allRows: any[][] = [];
    
    // Cabeçalho
    console.log('📋 Criando cabeçalho');
    allRows.push([
      'Tipo', 'ID', 'Nome de usuário', 'Nome completo', 'Senha', 'Cargo', 
      'Título(script)', 'Categoria(script)', 'Conteúdo do Script', 
      'Modelo(ONU)', 'Marca(ONU)', 'Link do Manual (ONU)', 
      'Imagens(ONU)', 'Descrições(ONU)', 'Número Protocolo', 'Nome Agente', 
      'Timestamp', 'Tags', 'Criado em', 'Dados JSON'
    ]);
    
    // Adicionar usuários
    console.log('👥 Adicionando usuários às linhas');
    users.forEach((user, index) => {
      console.log(`👤 Processando usuário ${index + 1}:`, user.username);
      allRows.push([
        'USER', user.id, user.username, user.name, user.password, user.role,
        '', '', '', '', '', '', '', '', '', '', '', '', user.createdAt, ''
      ]);
    });
    
    // Adicionar scripts
    console.log('📝 Adicionando scripts às linhas');
    scripts.forEach((script, index) => {
      console.log(`📄 Processando script ${index + 1}:`, script.title);
      allRows.push([
        'SCRIPT', script.id, '', '', '', '', script.title, script.category, 
        script.content, '', '', '', '', '', '', '', '', 
        script.tags.join(','), script.createdAt, ''
      ]);
    });
    
    // Adicionar ONUs
    console.log('📡 Adicionando ONUs às linhas');
    onus.forEach((onu, index) => {
      console.log(`📶 Processando ONU ${index + 1}:`, onu.model);
      allRows.push([
        'ONU', onu.id, '', '', '', '', '', '', '', onu.model, onu.brand, 
        onu.manualLink || '', JSON.stringify(onu.images), 
        JSON.stringify(onu.descriptions), '', '', '', '', onu.createdAt, ''
      ]);
    });
    
    // Adicionar protocolos
    console.log('📋 Adicionando protocolos às linhas');
    protocols.forEach((protocol, index) => {
      console.log(`📞 Processando protocolo ${index + 1}:`, protocol.number);
      allRows.push([
        'PROTOCOL', protocol.id, '', '', '', '', '', '', '', '', '', '', 
        '', '', protocol.number, protocol.agentName, protocol.timestamp, 
        '', '', ''
      ]);
    });
    
    console.log('📊 Total de linhas preparadas:', allRows.length);
    
    // Escrever tudo de uma vez
    console.log('💾 Iniciando escrita na planilha...');
    await writeSheetData('A:T', allRows);
    console.log('✅ Todos os dados foram escritos com sucesso na planilha');
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao limpar e escrever dados:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      usersCount: users.length,
      scriptsCount: scripts.length,
      onusCount: onus.length,
      protocolsCount: protocols.length
    });
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
    console.log('👥 Iniciando carregamento de usuários do Google Sheets');
    const sheetData = await readSheetData();
    const { users } = parseSheetDataToObjects(sheetData);
    console.log('✅ Usuários carregados com sucesso:', users.length);
    return users.length > 0 ? users : [
      { id: "1", username: "agente", name: "João Silva", role: "N1 Callcenter", createdAt: "2024-01-15", password: "123456" }
    ];
  } catch (error) {
    console.error('❌ ERRO ao carregar usuários do Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("system_users");
    return stored ? JSON.parse(stored) : [
      { id: "1", username: "agente", name: "João Silva", role: "N1 Callcenter", createdAt: "2024-01-15", password: "123456" }
    ];
  }
}

export async function saveUsersToStorage(users: User[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de usuários no Google Sheets');
    console.log('👥 Número de usuários a salvar:', users.length);
    
    // Carregar dados existentes
    console.log('📖 Carregando dados existentes da planilha');
    const sheetData = await readSheetData();
    const { scripts, onus, protocols } = parseSheetDataToObjects(sheetData);
    
    console.log('📊 Dados existentes carregados - Scripts:', scripts.length, 'ONUs:', onus.length, 'Protocolos:', protocols.length);
    
    // Reescrever tudo
    console.log('💾 Iniciando reescrita completa dos dados');
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('✅ Usuários salvos com sucesso no Google Sheets');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar usuários no Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("system_users", JSON.stringify(users));
    throw error;
  }
}

export async function getScriptsFromStorage(): Promise<Script[]> {
  try {
    console.log('📝 Iniciando carregamento de scripts do Google Sheets');
    const sheetData = await readSheetData();
    const { scripts } = parseSheetDataToObjects(sheetData);
    console.log('✅ Scripts carregados com sucesso:', scripts.length);
    return scripts;
  } catch (error) {
    console.error('❌ ERRO ao carregar scripts do Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("system_scripts");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveScriptsToStorage(scripts: Script[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de scripts no Google Sheets');
    console.log('📝 Número de scripts a salvar:', scripts.length);
    
    // Carregar dados existentes
    console.log('📖 Carregando dados existentes da planilha');
    const sheetData = await readSheetData();
    const { users, onus, protocols } = parseSheetDataToObjects(sheetData);
    
    console.log('📊 Dados existentes carregados - Usuários:', users.length, 'ONUs:', onus.length, 'Protocolos:', protocols.length);
    
    // Reescrever tudo
    console.log('💾 Iniciando reescrita completa dos dados');
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('✅ Scripts salvos com sucesso no Google Sheets');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar scripts no Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("system_scripts", JSON.stringify(scripts));
    throw error;
  }
}

export async function getONUsFromStorage(): Promise<ONU[]> {
  try {
    console.log('📡 Iniciando carregamento de ONUs do Google Sheets');
    const sheetData = await readSheetData();
    const { onus } = parseSheetDataToObjects(sheetData);
    console.log('✅ ONUs carregados com sucesso:', onus.length);
    return onus;
  } catch (error) {
    console.error('❌ ERRO ao carregar ONUs do Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("system_onus");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveONUsToStorage(onus: ONU[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de ONUs no Google Sheets');
    console.log('📡 Número de ONUs a salvar:', onus.length);
    
    // Carregar dados existentes
    console.log('📖 Carregando dados existentes da planilha');
    const sheetData = await readSheetData();
    const { users, scripts, protocols } = parseSheetDataToObjects(sheetData);
    
    console.log('📊 Dados existentes carregados - Usuários:', users.length, 'Scripts:', scripts.length, 'Protocolos:', protocols.length);
    
    // Reescrever tudo
    console.log('💾 Iniciando reescrita completa dos dados');
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('✅ ONUs salvos com sucesso no Google Sheets');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar ONUs no Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("system_onus", JSON.stringify(onus));
    throw error;
  }
}

export async function getProtocolsFromStorage(): Promise<Protocol[]> {
  try {
    console.log('📋 Iniciando carregamento de protocolos do Google Sheets');
    const sheetData = await readSheetData();
    const { protocols } = parseSheetDataToObjects(sheetData);
    console.log('✅ Protocolos carregados com sucesso:', protocols.length);
    return protocols;
  } catch (error) {
    console.error('❌ ERRO ao carregar protocolos do Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("protocols");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveProtocolsToStorage(protocols: Protocol[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de protocolos no Google Sheets');
    console.log('📋 Número de protocolos a salvar:', protocols.length);
    
    // Carregar dados existentes
    console.log('📖 Carregando dados existentes da planilha');
    const sheetData = await readSheetData();
    const { users, scripts, onus } = parseSheetDataToObjects(sheetData);
    
    console.log('📊 Dados existentes carregados - Usuários:', users.length, 'Scripts:', scripts.length, 'ONUs:', onus.length);
    
    // Reescrever tudo
    console.log('💾 Iniciando reescrita completa dos dados');
    await clearAndWriteAllData(users, scripts, onus, protocols);
    console.log('✅ Protocolos salvos com sucesso no Google Sheets');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar protocolos no Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("protocols", JSON.stringify(protocols));
    throw error;
  }
}

export async function getScriptLogsFromStorage(): Promise<any[]> {
  try {
    console.log('📜 Iniciando carregamento de logs do Google Sheets');
    const sheetData = await readSheetData();
    console.log('ℹ️ Logs ainda não implementados na estrutura atual');
    return [];
  } catch (error) {
    console.error('❌ ERRO ao carregar logs do Google Sheets:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("script_logs");
    return stored ? JSON.parse(stored) : [];
  }
}
