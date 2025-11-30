import React from 'react';
import { SectorStats } from '../../types';

interface Props {
  data: SectorStats[];
}

const SectorComparisonChart: React.FC<Props> = ({ data }) => {
  // Calculate global max for scaling bars proportionally
  const maxVal = Math.max(
    ...data.map(d => d.topCount),
    ...data.map(d => d.lowCount),
    1
  );

  return (
    <div className="w-full h-full p-6 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 flex-shrink-0">
            <h3 className="text-white font-bold text-xl flex items-center gap-3">
            <span className="w-1.5 h-8 bg-primary rounded-full"></span>
            Disparidade de Atuação: Menor vs Maior Cargo
            </h3>
            
            <div className="flex gap-4 text-xs font-medium bg-zinc-900/50 p-2 rounded-lg border border-white/5 mt-2 md:mt-0">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-zinc-700 rounded-sm"></div>
                    <span className="text-gray-400">Menor Atuação (Esq)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-sm"></div>
                    <span className="text-primary">Maior Atuação (Dir)</span>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-[300px]">
            {data.map((item, idx) => {
                const leftWidth = (item.lowCount / maxVal) * 100;
                const rightWidth = (item.topCount / maxVal) * 100;
                
                return (
                    <div key={idx} className="group flex items-center text-sm relative hover:bg-white/5 p-2 rounded-lg transition-colors border border-transparent hover:border-white/5">
                        
                        {/* LEFT SIDE: MENOR ATUAÇÃO */}
                        <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
                             <div className="flex flex-col items-end min-w-0 flex-shrink text-right">
                                <span className="text-xs text-gray-400 truncate w-full max-w-[120px] md:max-w-[220px] font-medium leading-tight" title={item.lowSector}>
                                    {item.lowSector}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                    {item.lowCount} alunos
                                </span>
                            </div>
                            <div className="w-[100px] md:w-[150px] flex justify-end">
                                <div 
                                    className="h-5 md:h-6 bg-zinc-700 rounded-l-md transition-all duration-500 group-hover:bg-zinc-600 relative min-w-[2px]"
                                    style={{ width: `${Math.max(leftWidth, 1)}%` }}
                                >
                                </div>
                            </div>
                        </div>

                        {/* CENTER: COMPANY NAME */}
                        <div className="w-[120px] md:w-[160px] flex justify-center items-center px-2 flex-shrink-0 relative">
                             {/* Center Line decoration */}
                             <div className="absolute inset-y-0 w-px bg-gray-800 left-1/2 -translate-x-1/2 -z-10 group-hover:bg-gray-700"></div>
                             
                             <span className="text-white font-bold text-[10px] md:text-xs uppercase tracking-wider text-center bg-card px-3 py-1 z-10 border border-gray-800 group-hover:border-gray-600 rounded-full shadow-sm transition-colors w-full truncate">
                                {item.company}
                             </span>
                        </div>

                        {/* RIGHT SIDE: MAIOR ATUAÇÃO */}
                        <div className="flex-1 flex items-center justify-start gap-3 min-w-0">
                            <div className="w-[100px] md:w-[150px] flex justify-start">
                                <div 
                                    className="h-5 md:h-6 bg-primary rounded-r-md transition-all duration-500 group-hover:brightness-110 shadow-[0_0_10px_rgba(225,20,87,0.2)] relative min-w-[2px]"
                                    style={{ width: `${Math.max(rightWidth, 1)}%` }}
                                >
                                </div>
                            </div>
                            <div className="flex flex-col items-start min-w-0 flex-shrink text-left">
                                <span className="text-xs text-white truncate w-full max-w-[120px] md:max-w-[220px] font-bold leading-tight" title={item.topSector}>
                                    {item.topSector}
                                </span>
                                <span className="text-[10px] text-primary/80 font-mono mt-0.5">
                                    {item.topCount} alunos
                                </span>
                            </div>
                        </div>

                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default SectorComparisonChart;