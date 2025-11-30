import React, { useState } from 'react';
import { Download, FileDown, FileImage, Loader2, Presentation, FileCode } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';
import gifshot from 'gifshot';
import { StudentRecord } from '../types';
import * as Processor from '../services/dataProcessing';

interface ExportMenuProps {
  data: StudentRecord[];
}

const ExportMenu: React.FC<ExportMenuProps> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // 1. Raw Data
      const wsRaw = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, wsRaw, "Dados Brutos");

      // 2. Summary: Hires per Company (Great for Canva Bar Charts)
      const hires = Processor.processHiresPerCompany(data);
      const wsHires = XLSX.utils.json_to_sheet(hires);
      XLSX.utils.book_append_sheet(wb, wsHires, "Contratações por Empresa");

      // 3. Summary: Internships (Great for Canva)
      const interns = Processor.processInternshipsByCompany(data);
      const wsInterns = XLSX.utils.json_to_sheet(interns);
      XLSX.utils.book_append_sheet(wb, wsInterns, "Estágios");

      // 4. Summary: States (Great for Canva Maps)
      const states = Processor.processStateDistribution(data);
      const stateArr = Object.entries(states).map(([uf, count]) => ({ Estado: uf, Alunos: count }));
      const wsStates = XLSX.utils.json_to_sheet(stateArr);
      XLSX.utils.book_append_sheet(wb, wsStates, "Demográfico");

      XLSX.writeFile(wb, "talent_lab_export_canva.xlsx");
    } catch (error: any) {
      console.error("Excel export failed", error);
      alert("Falha ao exportar Excel.");
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setProgress('Gerando PDF...');
    const element = document.getElementById('dashboard-content');
    if (!element) {
        setIsExporting(false);
        return;
    }

    try {
      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#000000',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const imgH = (imgHeight * pdfWidth) / imgWidth;

      let heightLeft = imgH;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgH);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgH);
        heightLeft -= pdfHeight;
      }

      pdf.save("talent_lab_dashboard.pdf");

    } catch (error: any) {
      console.error("PDF export failed", error);
      alert("Falha ao exportar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
      setIsOpen(false);
      setProgress('');
    }
  };

  // Helper to generate a GIF from a DOM element
  const generateChartGif = async (elementId: string): Promise<{ data: string, width: number, height: number } | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;

    const frames: string[] = [];
    const frameCount = 5; // Number of frames to capture
    
    // Capture dimensions once
    const canvasRef = await html2canvas(element, { scale: 1, backgroundColor: '#121212', useCORS: true });
    const width = canvasRef.width;
    const height = canvasRef.height;

    // Capture frames
    for (let i = 0; i < frameCount; i++) {
        // We capture slightly different moments or just repeat to form the GIF container
        // Note: html2canvas is static, but this format allows PPT to see it as a "Movie/GIF" container
        const canvas = await html2canvas(element, {
            scale: 2, // High res
            backgroundColor: '#121212',
            useCORS: true,
            logging: false
        });
        frames.push(canvas.toDataURL('image/png'));
        // Small delay to simulate time passing (helps if there are CSS animations running, though html2canvas struggles with them)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Promise((resolve, reject) => {
        gifshot.createGIF({
            images: frames,
            gifWidth: width,  // Use original dimensions
            gifHeight: height,
            interval: 0.2, // 200ms per frame
            numFrames: frameCount,
            frameDuration: 1,
            fontWeight: 'normal',
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontColor: '#ffffff',
            textAlign: 'center',
            textBaseline: 'bottom',
            sampleInterval: 10,
            numWorkers: 2
        }, (obj: any) => {
            if (!obj.error) {
                // Fix: explicit cast for obj.image from unknown/any to string
                resolve({ data: obj.image as string, width, height });
            } else {
                console.error("GIF generation error", obj.errorMsg);
                // Fallback to static image if GIF fails
                resolve({ data: frames[0], width, height });
            }
        });
    });
  };

  const handleExportPPT = async () => {
    setIsExporting(true);
    setProgress('Inicializando exportação...');
    
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'Talent Lab Analytics';
      pptx.title = 'Dashboard Report';
      
      // Background color for all slides
      pptx.defineSlideMaster({
        title: 'MASTER_DARK',
        background: { color: '000000' },
      });

      const chartIds = [
        { id: 'chart-hires', title: 'Contratações por Empresa' },
        { id: 'chart-internships', title: 'Vagas de Estágio e Trainee' },
        { id: 'chart-impact', title: 'Impacto Talent Lab' },
        { id: 'chart-map', title: 'Distribuição Demográfica' },
        { id: 'chart-comparison', title: 'Comparativo de Atuação' }
      ];

      // Add individual companies
      const companies = Array.from(new Set(data.map(d => d.company)));
      for (const company of companies) {
        const companyName = String(company);
        const id = `chart-role-${companyName.replace(/\s+/g, '-')}`;
        chartIds.push({ id, title: `Detalhes: ${companyName}` });
      }

      let count = 0;
      for (const item of chartIds) {
        count++;
        setProgress(`Gerando slide ${count} de ${chartIds.length}...`);
        
        const result = await generateChartGif(item.id);
        
        if (result) {
            const slide = pptx.addSlide({ masterName: 'MASTER_DARK' });
            
            // Title
            slide.addText(item.title, {
              x: 0.5, y: 0.3, w: '90%', fontSize: 18, color: 'E11457', bold: true, fontFace: 'Arial'
            });

            // Calculate Aspect Ratio to Avoid Distortion
            // PPT slide (16:9) is approx 10 x 5.625 inches
            const MAX_W = 9.5;
            const MAX_H = 4.5;
            const startY = 0.8;

            const imgRatio = result.width / result.height;
            const slideRatio = MAX_W / MAX_H;

            let finalW, finalH;

            if (imgRatio > slideRatio) {
                // Width constrained
                finalW = MAX_W;
                finalH = MAX_W / imgRatio;
            } else {
                // Height constrained
                finalH = MAX_H;
                finalW = MAX_H * imgRatio;
            }
            
            // Center horizontally
            const finalX = (10 - finalW) / 2;

            // Add GIF (Base64)
            slide.addImage({
              data: result.data,
              x: finalX,
              y: startY,
              w: finalW,
              h: finalH
            });
        }
      }

      pptx.writeFile({ fileName: 'TalentLab_Dashboard_Animated.pptx' });

    } catch (error: any) {
      console.error("PPT Export failed", error);
      alert("Falha ao gerar PowerPoint. Tente novamente.");
    } finally {
      setIsExporting(false);
      setIsOpen(false);
      setProgress('');
    }
  };

  const handleExportHTML = async () => {
    setIsExporting(true);
    setProgress('Compilando Relatório HTML...');

    try {
        // 1. Process Data upfront to avoid logic duplication in the HTML file
        const hiresData = Processor.processHiresPerCompany(data);
        const impactData = Processor.processTalentLabImpact(data);
        const comparisonData = Processor.processSectorComparison(data);
        const internshipData = Processor.processInternshipsByCompany(data);
        
        // Prepare roles data per company
        const companies = Array.from(new Set(data.map(d => d.company)));
        const rolesData: any[] = [];
        companies.forEach(comp => {
            rolesData.push({
                company: comp,
                data: Processor.processRolesByCompany(data, comp)
            });
        });

        // 2. Capture Map as Image (Map uses D3 and external Fetch, hard to embed in standalone HTML)
        let mapImage = "";
        const mapElement = document.getElementById('chart-map');
        if (mapElement) {
             const canvas = await html2canvas(mapElement as HTMLElement, {
                scale: 1.5,
                backgroundColor: '#121212',
                useCORS: true,
                logging: false
             });
             mapImage = canvas.toDataURL('image/png');
        }

        // 3. Construct the HTML String
        // This is a minimal React app injected into a single string
        const htmlContent: string = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Talent Lab - Relatório Interativo</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: { primary: '#E11457', dark: '#0a0a0a', card: '#121212' },
            fontFamily: { sans: ['Inter', 'sans-serif'] },
          },
        },
      };
    </script>

    <!-- React Dependencies -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/prop-types/prop-types.min.js"></script>
    
    <!-- Recharts Dependencies (PINNED VERSION TO PREVENT BLACK SCREEN) -->
    <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"></script>
    
    <!-- Babel for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        body { background-color: #000; color: white; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #1a1a1a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    </style>

    <!-- Error Handler -->
    <script>
        window.onerror = function(message, source, lineno, colno, error) {
            document.body.innerHTML = '<div style="color:red; padding:20px; font-family:sans-serif;"><h1>Erro ao carregar relatório</h1><p>' + message + '</p><p>Linha: ' + lineno + '</p></div>';
            console.error(error);
        };
    </script>
</head>
<body>
    <div id="root"></div>

    <!-- Inject Data -->
    <script>
        window.REPORT_DATA = {
            hires: ${JSON.stringify(hiresData)},
            impact: ${JSON.stringify(impactData)},
            internships: ${JSON.stringify(internshipData)},
            comparison: ${JSON.stringify(comparisonData)},
            roles: ${JSON.stringify(rolesData)},
            mapImage: "${mapImage}"
        };
    </script>

    <!-- React Application -->
    <script type="text/babel" data-presets="env,react">
        const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Sector } = Recharts;
        const { useState } = React;
        const COLORS = ['#E11457', '#b31045', '#ff4d88', '#555555', '#333333'];

        // --- COMPONENTS ---

        const CustomTooltip = ({ active, payload, label }) => {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-zinc-900 border border-zinc-800 p-2 rounded text-white text-xs">
                        <p className="font-bold">{label || payload[0].name}</p>
                        <p style={{ color: payload[0].fill }}>{payload[0].value} Alunos</p>
                    </div>
                );
            }
            return null;
        };

        const SimpleBarChart = ({ data, title, color }) => {
             const [activeIndex, setActiveIndex] = useState(null);
             return (
                <div className="bg-card rounded-2xl p-6 border border-gray-800 shadow-xl h-[300px]">
                    <h3 className="text-white mb-4 font-semibold text-sm border-l-4 pl-2" style={{borderColor: color}}>{title}</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30 }} onMouseLeave={() => setActiveIndex(null)}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={90} tick={{ fill: '#aaa', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                            <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={index} cursor="pointer" fill={activeIndex === index ? '#fff' : color} fillOpacity={activeIndex === index ? 1 : 0.8} onMouseEnter={() => setActiveIndex(index)} />
                                ))}
                                <LabelList dataKey="value" position="right" style={{ fill: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             )
        }

        const renderActiveShape = (props) => {
          const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
          return (
            <g>
              <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#fff" className="text-xs font-bold">{payload.name || payload.role}</text>
              <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#E11457" className="text-sm font-bold">{value} Le.</text>
              <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
              <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 10} fill={fill} opacity={0.3} />
            </g>
          );
        };

        const InteractivePie = ({ data, title }) => {
            const [activeIndex, setActiveIndex] = useState(0);
            return (
                <div className="bg-card rounded-2xl p-6 border border-gray-800 shadow-xl h-[300px]">
                     <h3 className="text-white mb-4 font-semibold text-sm border-l-4 border-primary pl-2">{title}</h3>
                     <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie activeIndex={activeIndex} activeShape={renderActiveShape} data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" onMouseEnter={(_, index) => setActiveIndex(index)}>
                                {data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                            </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                </div>
            )
        }

        const ComparisonChart = ({ data }) => {
             const maxVal = Math.max(...data.map(d => d.topCount), ...data.map(d => d.lowCount), 1);
             return (
                <div className="bg-card rounded-2xl border border-gray-800 p-6">
                    <h3 className="text-white font-bold text-xl mb-6">Disparidade de Atuação</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {data.map((item, idx) => (
                            <div key={idx} className="flex items-center text-sm group hover:bg-white/5 p-2 rounded">
                                <div className="flex-1 flex justify-end gap-3">
                                    <div className="text-right"><div className="text-gray-400 text-xs">{item.lowSector}</div><div className="text-xs text-zinc-500">{item.lowCount}</div></div>
                                    <div className="w-[100px] flex justify-end"><div className="h-4 bg-zinc-700 rounded-l" style={{ width: (item.lowCount/maxVal)*100 + '%' }}></div></div>
                                </div>
                                <div className="w-[120px] text-center px-2"><span className="text-[10px] bg-black border border-zinc-700 px-2 py-1 rounded-full uppercase">{item.company}</span></div>
                                <div className="flex-1 flex justify-start gap-3">
                                    <div className="w-[100px] flex justify-start"><div className="h-4 bg-primary rounded-r" style={{ width: (item.topCount/maxVal)*100 + '%' }}></div></div>
                                    <div className="text-left"><div className="text-white text-xs">{item.topSector}</div><div className="text-primary text-xs">{item.topCount}</div></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             )
        }

        const RoleDonut = ({ company, data }) => {
            const [idx, setIdx] = useState(0);
            return (
                 <div className="bg-card border border-gray-800 rounded-xl p-4 h-[250px]">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                        <h4 className="text-white font-bold text-xs">{company}</h4>
                        <span className="text-primary text-[10px] border border-primary/20 px-2 rounded-full">{data.reduce((a,b) => a + b.count, 0)}</span>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie activeIndex={idx} activeShape={renderActiveShape} data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="count" nameKey="role" onMouseEnter={(_, i) => setIdx(i)}>
                                {data.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                 </div>
            )
        }

        // --- MAIN APP ---

        const ReportApp = () => {
            const { hires, impact, internships, comparison, roles, mapImage } = window.REPORT_DATA;
            
            return (
                <div className="max-w-7xl mx-auto p-6 space-y-8">
                    <header className="flex justify-between items-center border-b border-gray-800 pb-4">
                        <h1 className="text-2xl font-bold flex items-center gap-2">TALENT<span className="text-primary">LAB</span> REPORT</h1>
                        <span className="text-xs text-gray-500">Gerado em: {new Date().toLocaleDateString()}</span>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SimpleBarChart data={hires} title="Contratados por Empresa" color="#E11457" />
                        <SimpleBarChart data={internships} title="Vagas de Estágio" color="#06b6d4" />
                        <InteractivePie data={impact} title="Ações Talent Lab" />
                        
                        {/* Static Map Image */}
                        <div className="bg-card rounded-2xl p-6 border border-gray-800 shadow-xl h-[300px] flex flex-col">
                             <h3 className="text-white mb-2 font-semibold text-sm border-l-4 border-primary pl-2">Demográfico</h3>
                             <div className="flex-1 flex items-center justify-center overflow-hidden">
                                {mapImage ? <img src={mapImage} className="max-w-full max-h-full object-contain" /> : <p className="text-gray-500 text-xs">Mapa não disponível</p>}
                             </div>
                        </div>
                    </div>

                    <ComparisonChart data={comparison} />

                    <div>
                        <h3 className="text-white mb-4 text-lg font-bold border-l-4 border-primary pl-2">Detalhamento por Empresa</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {roles.map((r, i) => (
                                <RoleDonut key={i} company={r.company} data={r.data} />
                            ))}
                        </div>
                    </div>
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<ReportApp />);
    </script>
</body>
</html>
        `;

        // 4. Download File
        const blob = new Blob([htmlContent as string], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'TalentLab_Relatorio_Interativo.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error: any) {
        console.error("HTML Export Error", error);
        alert("Erro ao gerar relatório HTML");
    } finally {
        setIsExporting(false);
        setIsOpen(false);
        setProgress('');
    }
  };


  return (
    <div className="relative inline-block text-left">
      {/* Progress Overlay */}
      {isExporting && progress && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-white text-lg font-bold">{progress}</h3>
            <p className="text-gray-400 text-sm mt-2">Isso pode levar alguns segundos...</p>
        </div>
      )}

      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isExporting}
          className="inline-flex justify-center w-full rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-zinc-900 text-sm font-medium text-gray-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
          Exportar
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-zinc-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-700 z-50">
          <div className="py-1">
            <button
              onClick={handleExportExcel}
              className="group flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 w-full text-left"
            >
              <FileDown className="mr-3 h-4 w-4 text-green-500" />
              Planilha Interativa (Canva)
            </button>
          </div>
          <div className="py-1">
             <button
              onClick={handleExportPPT}
              className="group flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 w-full text-left"
            >
              <Presentation className="mr-3 h-4 w-4 text-orange-500" />
              PowerPoint (GIF Animado)
            </button>
          </div>
          <div className="py-1">
             <button
              onClick={handleExportHTML}
              className="group flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 w-full text-left"
            >
              <FileCode className="mr-3 h-4 w-4 text-blue-500" />
              Relatório Interativo (HTML)
            </button>
          </div>
          <div className="py-1">
            <button
              onClick={handleExportPDF}
              className="group flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 w-full text-left"
            >
              <FileImage className="mr-3 h-4 w-4 text-red-500" />
              Download PDF (Visual)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;