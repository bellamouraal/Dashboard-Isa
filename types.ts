export interface StudentRecord {
  id: string;
  name: string;
  company: string; // Empresa
  role: string;    // Cargo
  sector: string;  // Setor
  state: string;   // Estado (Sigla ex: SP, RJ)
  talentLabAction: string; // Ação Talent Lab (ex: "Sim", "Mentoria", "Hackathon", "Não")
}

export interface CompanyStats {
  company: string;
  hires: number;
}

export interface SectorStats {
  company: string;
  topSector: string;
  topCount: number;
  lowSector: string;
  lowCount: number;
}

export interface StateStats {
  id: string; // UF code
  value: number;
}