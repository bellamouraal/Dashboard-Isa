import { GoogleGenAI } from "@google/genai";
import { StudentRecord } from "../types";

export const generateSampleData = async (): Promise<StudentRecord[]> => {
  try {
    // Robust API Key retrieval for Vite/Vercel environments
    let apiKey = '';
    
    // 1. Try Vite standard (import.meta.env)
    // We access import.meta safely
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY;
      }
    } catch (e) {
      // Ignore
    }

    // 2. Fallback to process.env (Node.js/Test) ONLY if safe
    if (!apiKey) {
      try {
        // Double check process existence to prevent "ReferenceError: process is not defined"
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || '';
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!apiKey) {
      throw new Error("API Key not configured. Please set VITE_API_KEY in Vercel.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt engineered to return a raw CSV string
    const prompt = `
      Gere um CSV com 60 linhas de dados fictícios para um dashboard de análise de contratações de alunos.
      Os dados devem ser realistas para o mercado de tecnologia no Brasil.
      
      Colunas necessárias (exatamente nesta ordem, separadas por vírgula):
      Nome,Empresa,Cargo,Setor,Estado,AcaoTalentLab

      Regras:
      1. Empresas: Use "TechCorp", "InovaData", "FutureBank", "SoftSolutions", "AgileSystems".
      2. Cargos: "Desenvolvedor Jr", "Analista de Dados", "QA", "UX Designer", "DevOps", "Product Owner".
      3. Setor: "Tecnologia", "Financeiro", "Saúde", "Varejo", "Consultoria".
      4. Estado: Siglas de estados brasileiros (SP, RJ, MG, SC, PR, PE, RS). Concentre mais em SP e RJ.
      5. AcaoTalentLab: "Mentoria", "Hackathon", "Workshop", "Não", "Sim". (Cerca de 70% deve ter alguma ação).
      
      Retorne APENAS o texto CSV puro, sem formatação de markdown (sem \`\`\`csv). Comece com o cabeçalho.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const csvText = response.text;
    
    // Parse the generated CSV here to reuse the logic in the main app, or just return basic parsing
    const lines = csvText?.trim().split('\n');
    if (!lines) return [];

    const data: StudentRecord[] = [];
    
    // Skip header row 0
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 5) continue;

      data.push({
        id: `gen-${i}`,
        name: cols[0],
        company: cols[1],
        role: cols[2],
        sector: cols[3],
        state: cols[4],
        talentLabAction: cols[5]
      });
    }

    return data;

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback static data if API fails to ensure app doesn't break during demo
    return [
       { id: '1', name: 'João Silva', company: 'TechCorp', role: 'Dev Jr', sector: 'Tech', state: 'SP', talentLabAction: 'Hackathon' },
       { id: '2', name: 'Maria Souza', company: 'InovaData', role: 'Data Analyst', sector: 'Financeiro', state: 'RJ', talentLabAction: 'Mentoria' },
       { id: '3', name: 'Pedro Santos', company: 'FutureBank', role: 'QA', sector: 'Financeiro', state: 'MG', talentLabAction: 'Não' },
       { id: '4', name: 'Ana Lima', company: 'TechCorp', role: 'DevOps', sector: 'Tech', state: 'SP', talentLabAction: 'Sim' },
       { id: '5', name: 'Lucas Pereira', company: 'SoftSolutions', role: 'UX Designer', sector: 'Consultoria', state: 'SC', talentLabAction: 'Workshop' },
    ];
  }
};