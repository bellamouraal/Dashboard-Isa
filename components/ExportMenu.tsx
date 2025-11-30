import React, { useState } from 'react';
import { Download, FileDown, FileImage, Loader2, Presentation } from 'lucide-react';
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
    } catch (error) {
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

    } catch (error) {
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
                resolve({ data: obj.image, width, height });
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

    } catch (error) {
      console.error("PPT Export failed", error);
      alert("Falha ao gerar PowerPoint. Tente novamente.");
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