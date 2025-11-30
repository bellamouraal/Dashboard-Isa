import { StudentRecord, SectorStats } from '../types';

// Helper function to categorize raw role names into groups
// Defined at the top so it's available for all functions
export const categorizeRole = (role: string): string => {
  if (!role) return 'Não Especificado';
  const r = role.toLowerCase().trim();
  
  if (r.match(/dev|desenvolvedor|programador|software|engineer|engenheiro|frontend|backend|fullstack|mobile|android|ios|web|java|python|node|react|angular|vue|php|.net|c#|golang|ruby|coder/)) return 'Desenvolvimento';
  if (r.match(/dados|data|analytics|bi|business intelligence|cientista|estatistico|etl|big data|machine learning|ia|ai/)) return 'Dados & Analytics';
  if (r.match(/qa|teste|quality|qualidade|tester|automatizacao|test/)) return 'QA & Testes';
  if (r.match(/design|ux|ui|produto|product|arte|criativo|web designer|designer|art/)) return 'Design & Produto';
  if (r.match(/infra|cloud|devops|rede|suporte|sysadmin|aws|azure|gcp|sre|servidores|linux|windows|network/)) return 'Infra & Cloud';
  if (r.match(/cyber|security|seguranca|hacker|pentest|defesa|soc|siem|ciber/)) return 'Cibersegurança';
  if (r.match(/agil|agile|scrum|kanban|po|product owner|gerente|gestao|coordenador|lider|tech lead|cto|head|diretor|ceo|cfo|cio|manager|supervis/)) return 'Gestão & Agilidade';
  if (r.match(/estagio|estagiario|trainee|jovem aprendiz|intern/)) return 'Estágio/Trainee';
  if (r.match(/banco|dba|sql|oracle|mysql|postgres|mongodb|database/)) return 'Banco de Dados';
  if (r.match(/suporte|help desk|atendimento|tecnico|service desk/)) return 'Suporte Técnico';
  if (r.match(/consultor|consultoria|analista funcional|sap|erp|totvs/)) return 'Consultoria/ERP';
  
  // New Categories to reduce "Outras Funções"
  if (r.match(/marketing|mkt|growth|social media|redes sociais|conteudo|copywriter|midia/)) return 'Marketing & Growth';
  if (r.match(/comercial|vendas|sales|sdr|bdr|executivo de contas|vendedor|account|conta/)) return 'Comercial & Vendas';
  if (r.match(/financeiro|finance|financas|contabil|contabilidade|fiscal|tesouraria|audit/)) return 'Financeiro';
  if (r.match(/rh|recursos humanos|gente|gestao de pessoas|recrutamento|tech recruiter|talent|r&s/)) return 'RH & Pessoas';
  if (r.match(/juridico|legal|advogado|direito|compliance/)) return 'Jurídico';
  if (r.match(/operacoes|ops|logistica|supply|atendimento|back office|administrativo|auxiliar|assistente/)) return 'Operações & Admin';

  return 'Outras Funções'; 
};

// Helper function to format specific roles (preserving nuances like Jr, Pleno, etc)
const formatSpecificRole = (role: string): string => {
  if (!role) return 'Não Especificado';
  // Standardize to Title Case for better display
  return role
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // remove extra spaces
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const processHiresPerCompany = (data: StudentRecord[]) => {
  const counts: Record<string, number> = {};
  data.forEach(d => {
    if (d.company) counts[d.company] = (counts[d.company] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const processInternshipsByCompany = (data: StudentRecord[]) => {
  const counts: Record<string, number> = {};
  
  data.forEach(d => {
    if (!d.company || !d.role) return;
    
    const roleLower = d.role.toLowerCase();
    // Check for keywords related to internship/trainee
    const isInternship = /estagio|estágio|estagiario|estagiário|trainee|aprendiz|intern/.test(roleLower);
    
    if (isInternship) {
      counts[d.company] = (counts[d.company] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const processTalentLabImpact = (data: StudentRecord[]) => {
  const counts: Record<string, number> = {};

  data.forEach(d => {
    // Normalize string to Title Case or Upper Case to avoid duplicates like "Mentoria" and "mentoria"
    let action = d.talentLabAction?.trim() || 'Não Informado';
    
    // Capitalize first letter logic for cleaner display
    action = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    
    // Group negative/empty responses
    if (['Não', 'Nao', 'No', '-', '', 'Na', 'N/a', 'Null', 'Undefined'].includes(action)) {
      action = 'Sem Ação';
    }

    counts[action] = (counts[action] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort descending
};

export const processStateDistribution = (data: StudentRecord[]) => {
  const counts: Record<string, number> = {};
  
  const stateMap: Record<string, string> = {
    'ACRE': 'AC', 'ALAGOAS': 'AL', 'AMAPA': 'AP', 'AMAPÁ': 'AP', 'AMAZONAS': 'AM',
    'BAHIA': 'BA', 'CEARA': 'CE', 'CEARÁ': 'CE', 'DISTRITO FEDERAL': 'DF',
    'ESPIRITO SANTO': 'ES', 'ESPÍRITO SANTO': 'ES', 'GOIAS': 'GO', 'GOIÁS': 'GO',
    'MARANHAO': 'MA', 'MARANHÃO': 'MA', 'MATO GROSSO': 'MT', 'MATO GROSSO DO SUL': 'MS',
    'MINAS GERAIS': 'MG', 'PARA': 'PA', 'PARÁ': 'PA', 'PARAIBA': 'PB', 'PARAÍBA': 'PB',
    'PARANA': 'PR', 'PARANÁ': 'PR', 'PERNAMBUCO': 'PE', 'PIAUI': 'PI', 'PIAUÍ': 'PI',
    'RIO DE JANEIRO': 'RJ', 'RIO GRANDE DO NORTE': 'RN', 'RIO GRANDE DO SUL': 'RS',
    'RONDONIA': 'RO', 'RONDÔNIA': 'RO', 'RORAIMA': 'RR', 'SANTA CATARINA': 'SC',
    'SAO PAULO': 'SP', 'SÃO PAULO': 'SP', 'SERGIPE': 'SE', 'TOCANTINS': 'TO'
  };

  data.forEach(d => {
    let rawState = d.state?.toUpperCase().trim();
    if (!rawState) return;

    // Check if it's a full name in our map
    let uf = stateMap[rawState];

    // If not in map, maybe it is already a UF (length 2)
    if (!uf) {
      if (rawState.length === 2) {
        uf = rawState;
      } else {
        // Fallback: Try to clean accents and check map again or take first 2
        // Simple accent removal
        const clean = rawState.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        uf = stateMap[clean] || clean.substring(0, 2);
      }
    }

    if (uf) counts[uf] = (counts[uf] || 0) + 1;
  });
  return counts;
};

export const processSectorComparison = (data: StudentRecord[]): SectorStats[] => {
  const companies = Array.from(new Set(data.map(d => d.company)));
  
  return companies.map(company => {
    const companyData = data.filter(d => d.company === company);
    const roleCounts: Record<string, number> = {};
    
    companyData.forEach(d => {
      // NOTE: Using formatSpecificRole to ensure we get details like "Dev Jr" vs "Dev Pleno"
      // instead of broad categorization.
      const roleName = formatSpecificRole(d.role || '');
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });

    const entries = Object.entries(roleCounts);
    if (entries.length === 0) {
       return { company, topSector: '-', topCount: 0, lowSector: '-', lowCount: 0 };
    }

    // Sort by count descending
    entries.sort((a, b) => b[1] - a[1]);
    
    // Filter out "Não Especificado" to avoid empty labels
    const specificEntries = entries.filter(([name]) => name !== 'Não Especificado');

    // Default to the raw entries if filtering removed everything
    const validEntries = specificEntries.length > 0 ? specificEntries : entries;

    const topEntry = validEntries[0];
    const lowEntry = validEntries[validEntries.length - 1];
    
    return {
      company,
      topSector: topEntry[0], 
      topCount: topEntry[1],
      lowSector: lowEntry[0], 
      lowCount: lowEntry[1]
    };
  });
};

export const processRolesByCompany = (data: StudentRecord[], company: string) => {
  const companyData = data.filter(d => d.company === company);
  const roleCounts: Record<string, number> = {};
  
  companyData.forEach(d => {
    // Apply categorization to ensure consistency for the pie charts
    // We keep broad categories here for better visual summary
    const category = categorizeRole(d.role || '');
    roleCounts[category] = (roleCounts[category] || 0) + 1;
  });

  // Convert to array and sort by count descending
  // Returns ALL categories found
  return Object.entries(roleCounts)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);
};