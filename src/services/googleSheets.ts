import { supabase } from "@/integrations/supabase/client";

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

// Funções de conversão de dados
function convertSupabaseToUser(row: any): User {
  return {
    id: row.id?.toString() || Date.now().toString(),
    username: row["Nome de usuário"] || '',
    name: row["Nome completo"] || '',
    password: row["Senha"] || '',
    role: row["Cargo"] || '',
    createdAt: row.data ? new Date(row.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  };
}

function convertSupabaseToScript(row: any): Script {
  return {
    id: row.id?.toString() || Date.now().toString(),
    title: row["Título"] || '',
    description: row["Descrição"] || '',
    category: (row["Categoria"] || 'support') as "support" | "financial" | "other",
    content: row["Conteúdo do Script"] || '',
    tags: row["Tags (separadas por vírgula)"] ? row["Tags (separadas por vírgula)"].split(',').map((t: string) => t.trim()) : [],
    createdAt: row.data ? new Date(row.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  };
}

function convertSupabaseToONU(row: any): ONU {
  const images = [row["Imagem 1"], row["Imagem 2"], row["Imagem 3"], row["Imagem 4"]].filter(Boolean);
  const descriptions = [row["Descrição 1"], row["Descrição 2"], row["Descrição 3"], row["Descrição 4"]].filter(Boolean);
  
  return {
    id: row.id?.toString() || Date.now().toString(),
    model: row["Modelo"] || '',
    brand: row["Marca"] || '',
    images: images,
    descriptions: descriptions,
    manualLink: row["Link do Manual (opcional)"] || undefined,
    createdAt: row.data ? new Date(row.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  };
}

function convertSupabaseToProtocol(row: any): Protocol {
  return {
    id: row.id?.toString() || Date.now().toString(),
    number: row["Histórico de Protocolos"] || '',
    agentName: row["Nome completo"] || '',
    timestamp: row.data ? new Date(row.data).toISOString() : new Date().toISOString()
  };
}

// Funções principais usando Supabase
export async function getUsersFromStorage(): Promise<User[]> {
  try {
    console.log('👥 Iniciando carregamento de usuários do Supabase');
    const { data, error } = await supabase
      .from('baseUsuario')
      .select('*')
      .not('Nome de usuário', 'is', null)
      .not('Nome completo', 'is', null);

    if (error) {
      console.error('❌ ERRO ao carregar usuários do Supabase:', error);
      throw error;
    }

    const users = data?.map(convertSupabaseToUser) || [];
    console.log('✅ Usuários carregados com sucesso:', users.length);
    
    return users.length > 0 ? users : [
      { id: "1", username: "agente", name: "João Silva", role: "N1 Callcenter", createdAt: "2024-01-15", password: "123456" }
    ];
  } catch (error) {
    console.error('❌ ERRO ao carregar usuários do Supabase:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("system_users");
    return stored ? JSON.parse(stored) : [
      { id: "1", username: "agente", name: "João Silva", role: "N1 Callcenter", createdAt: "2024-01-15", password: "123456" }
    ];
  }
}

export async function saveUsersToStorage(users: User[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de usuários no Supabase');
    console.log('👥 Número de usuários a salvar:', users.length);
    
    // Para cada usuário, inserir ou atualizar no Supabase
    for (const user of users) {
      const userData = {
        "Nome de usuário": user.username,
        "Nome completo": user.name,
        "Senha": user.password,
        "Cargo": user.role,
        data: user.createdAt
      };

      // Tentar inserir ou atualizar
      const { error } = await supabase
        .from('baseUsuario')
        .upsert(userData, { 
          onConflict: 'Nome de usuário'
        });

      if (error) {
        console.error('❌ ERRO ao salvar usuário:', user.username, error);
      }
    }
    
    console.log('✅ Usuários salvos com sucesso no Supabase');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar usuários no Supabase:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("system_users", JSON.stringify(users));
    throw error;
  }
}

export async function getScriptsFromStorage(): Promise<Script[]> {
  try {
    console.log('📝 Iniciando carregamento de scripts do Supabase');
    const { data, error } = await supabase
      .from('baseUsuario')
      .select('*')
      .not('Título', 'is', null)
      .not('Conteúdo do Script', 'is', null);

    if (error) {
      console.error('❌ ERRO ao carregar scripts do Supabase:', error);
      throw error;
    }

    const scripts = data?.map(convertSupabaseToScript) || [];
    console.log('✅ Scripts carregados com sucesso:', scripts.length);
    return scripts;
  } catch (error) {
    console.error('❌ ERRO ao carregar scripts do Supabase:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("system_scripts");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveScriptsToStorage(scripts: Script[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de scripts no Supabase');
    console.log('📝 Número de scripts a salvar:', scripts.length);
    
    // Para cada script, inserir ou atualizar no Supabase
    for (const script of scripts) {
      const scriptData = {
        "Título": script.title,
        "Descrição": script.description,
        "Categoria": script.category,
        "Conteúdo do Script": script.content,
        "Tags (separadas por vírgula)": script.tags.join(', '),
        data: script.createdAt
      };

      // Tentar inserir ou atualizar
      const { error } = await supabase
        .from('baseUsuario')
        .upsert(scriptData, { 
          onConflict: 'Título'
        });

      if (error) {
        console.error('❌ ERRO ao salvar script:', script.title, error);
      }
    }
    
    console.log('✅ Scripts salvos com sucesso no Supabase');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar scripts no Supabase:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("system_scripts", JSON.stringify(scripts));
    throw error;
  }
}

export async function getONUsFromStorage(): Promise<ONU[]> {
  try {
    console.log('📡 Iniciando carregamento de ONUs do Supabase');
    const { data, error } = await supabase
      .from('baseUsuario')
      .select('*')
      .not('Modelo', 'is', null)
      .not('Marca', 'is', null);

    if (error) {
      console.error('❌ ERRO ao carregar ONUs do Supabase:', error);
      throw error;
    }

    const onus = data?.map(convertSupabaseToONU) || [];
    console.log('✅ ONUs carregados com sucesso:', onus.length);
    return onus;
  } catch (error) {
    console.error('❌ ERRO ao carregar ONUs do Supabase:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("system_onus");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveONUsToStorage(onus: ONU[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de ONUs no Supabase');
    console.log('📡 Número de ONUs a salvar:', onus.length);
    
    // Para cada ONU, inserir ou atualizar no Supabase
    for (const onu of onus) {
      const onuData = {
        "Modelo": onu.model,
        "Marca": onu.brand,
        "Imagem 1": onu.images[0] || null,
        "Imagem 2": onu.images[1] || null,
        "Imagem 3": onu.images[2] || null,
        "Imagem 4": onu.images[3] || null,
        "Descrição 1": onu.descriptions[0] || null,
        "Descrição 2": onu.descriptions[1] || null,
        "Descrição 3": onu.descriptions[2] || null,
        "Descrição 4": onu.descriptions[3] || null,
        "Link do Manual (opcional)": onu.manualLink || null,
        data: onu.createdAt
      };

      // Tentar inserir ou atualizar
      const { error } = await supabase
        .from('baseUsuario')
        .upsert(onuData, { 
          onConflict: 'Modelo'
        });

      if (error) {
        console.error('❌ ERRO ao salvar ONU:', onu.model, error);
      }
    }
    
    console.log('✅ ONUs salvos com sucesso no Supabase');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar ONUs no Supabase:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("system_onus", JSON.stringify(onus));
    throw error;
  }
}

export async function getProtocolsFromStorage(): Promise<Protocol[]> {
  try {
    console.log('📋 Iniciando carregamento de protocolos do Supabase');
    const { data, error } = await supabase
      .from('baseUsuario')
      .select('*')
      .not('Histórico de Protocolos', 'is', null);

    if (error) {
      console.error('❌ ERRO ao carregar protocolos do Supabase:', error);
      throw error;
    }

    const protocols = data?.map(convertSupabaseToProtocol) || [];
    console.log('✅ Protocolos carregados com sucesso:', protocols.length);
    return protocols;
  } catch (error) {
    console.error('❌ ERRO ao carregar protocolos do Supabase:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("protocols");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveProtocolsToStorage(protocols: Protocol[]): Promise<void> {
  try {
    console.log('💾 Iniciando salvamento de protocolos no Supabase');
    console.log('📋 Número de protocolos a salvar:', protocols.length);
    
    // Para cada protocolo, inserir ou atualizar no Supabase
    for (const protocol of protocols) {
      const protocolData = {
        "Histórico de Protocolos": protocol.number,
        "Nome completo": protocol.agentName,
        data: protocol.timestamp
      };

      // Tentar inserir ou atualizar
      const { error } = await supabase
        .from('baseUsuario')
        .upsert(protocolData, { 
          onConflict: 'Histórico de Protocolos'
        });

      if (error) {
        console.error('❌ ERRO ao salvar protocolo:', protocol.number, error);
      }
    }
    
    console.log('✅ Protocolos salvos com sucesso no Supabase');
    
  } catch (error) {
    console.error('❌ ERRO ao salvar protocolos no Supabase:', error);
    console.log('🔄 Usando fallback para localStorage devido ao erro');
    localStorage.setItem("protocols", JSON.stringify(protocols));
    throw error;
  }
}

export async function getScriptLogsFromStorage(): Promise<any[]> {
  try {
    console.log('📜 Iniciando carregamento de logs do Supabase');
    const { data, error } = await supabase
      .from('baseUsuario')
      .select('*')
      .not('Histórico de Alterações nos Scripts', 'is', null);

    if (error) {
      console.error('❌ ERRO ao carregar logs do Supabase:', error);
      throw error;
    }

    // Converter logs se existirem
    const logs = data?.map(row => ({
      id: row.id?.toString() || Date.now().toString(),
      scriptTitle: row["Título"] || '',
      agentName: row["Nome completo"] || '',
      action: "Editou conteúdo",
      timestamp: row.data ? new Date(row.data).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
      changes: row["Histórico de Alterações nos Scripts"] || ''
    })) || [];

    console.log('✅ Logs carregados com sucesso:', logs.length);
    return logs;
  } catch (error) {
    console.error('❌ ERRO ao carregar logs do Supabase:', error);
    console.log('🔄 Usando fallback para localStorage');
    const stored = localStorage.getItem("script_logs");
    return stored ? JSON.parse(stored) : [];
  }
}
