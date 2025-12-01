import React, { useState } from 'react';
import { Upload, Zap, LayoutDashboard, Tag } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { StudentRecord } from './types';
import { generateSampleData } from './services/geminiService';

const App: React.FC = () => {
  const [data, setData] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDataLoaded = (loadedData: StudentRecord[]) => {
    setData(loadedData);
  };

  const handleGenerateSample = async () => {
    setLoading(true);
    try {
      const sample = await generateSampleData();
      setData(sample);
    } catch (error) {
      console.error("Failed to generate data", error);
      alert("Failed to generate sample data using Gemini. Please check your API Key or try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary selection:text-white">
      <header className="border-b border-primary/20 bg-dark/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="text-primary w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wider flex items-center gap-2">
              TALENT<span className="text-primary">LAB</span> ANALYTICS
              <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full border border-white/5 font-mono">v2.18</span>
            </h1>
          </div>
          {data.length > 0 && (
            <button 
              onClick={() => setData([])}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Upload className="w-3 h-3" /> Upload New File
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-in fade-in zoom-in duration-500">
             <div className="text-center space-y-4 max-w-lg">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-primary/50 shadow-[0_0_30px_rgba(225,20,87,0.3)]">
                   <LayoutDashboard className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                  Dashboard de Impacto
                </h2>
                <p className="text-gray-400">
                  Carregue sua planilha (Excel ou CSV) para visualizar a análise demográfica, contratações e o impacto do Talent Lab nas empresas parceiras.
                </p>
             </div>
             
             <div className="w-full max-w-md space-y-4">
               <FileUpload onDataLoaded={handleDataLoaded} />
               
               <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-gray-500">Ou</span>
                  </div>
                </div>

                <button
                  onClick={handleGenerateSample}
                  disabled={loading}
                  className="w-full py-4 rounded-xl border border-primary/30 hover:bg-primary/5 text-primary transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <span className="animate-pulse">Gerando dados com IA...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Gerar Dados de Exemplo (Gemini)
                    </>
                  )}
                </button>
             </div>
          </div>
        ) : (
          <Dashboard data={data} />
        )}
      </main>
    </div>
  );
};

export default App;