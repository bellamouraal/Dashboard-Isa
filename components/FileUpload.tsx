import React from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import { StudentRecord } from '../types';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  onDataLoaded: (data: StudentRecord[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  
  const processData = (rawData: any[][]) => {
    if (rawData.length < 2) return; // Need at least header and one row

    // Normalize headers
    const headers = rawData[0].map(h => String(h).trim().toLowerCase());
    const result: StudentRecord[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      // Skip empty rows
      if (!row || row.length === 0) continue;

      const record: any = { id: `row-${i}` };
      
      const getValueAtIndex = (index: number) => {
        if (index === -1 || index >= row.length || row[index] === undefined || row[index] === null) return '';
        return String(row[index]).trim();
      };

      // Helper to find value by header match or fallback index
      const getVal = (possibleHeaders: string[], indexFallback: number) => {
         const idx = headers.findIndex(h => possibleHeaders.some(ph => h.includes(ph)));
         return idx !== -1 ? getValueAtIndex(idx) : getValueAtIndex(indexFallback);
      };

      record.name = getVal(['nome', 'aluno', 'student'], 0) || 'Unknown';
      record.company = getVal(['empresa', 'company', 'parceiro'], 1) || 'Unknown';
      record.role = getVal(['cargo', 'role', 'posicao'], 2) || 'Analista';
      record.sector = getVal(['setor', 'area', 'departamento'], 3) || 'Tech';
      record.state = getVal(['estado', 'uf', 'location'], 4) || 'SP';
      record.talentLabAction = getVal(['talent', 'lab', 'acao'], 5) || 'Não';

      // Basic validation: ignore rows that look completely empty or invalid
      if (record.name === 'Unknown' && record.company === 'Unknown') continue;

      result.push(record as StudentRecord);
    }
    
    onDataLoaded(result);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        // Read the file as an ArrayBuffer
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Grab the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays (header: 1)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        processData(jsonData);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Erro ao processar o arquivo. Verifique se é um Excel ou CSV válido.");
      }
    };
    
    // Read as ArrayBuffer to support both Excel and CSV via XLSX library
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-primary/30 border-dashed rounded-xl cursor-pointer bg-card hover:bg-primary/5 transition-all group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <FileSpreadsheet className="w-8 h-8 mb-3 text-primary group-hover:scale-110 transition-transform" />
          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-white">Clique para upload</span> ou arraste a planilha</p>
          <p className="text-xs text-gray-500">Suporta Excel (.xlsx, .xls) e CSV</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
          onChange={handleFileChange} 
        />
      </label>
    </div>
  );
};

export default FileUpload;