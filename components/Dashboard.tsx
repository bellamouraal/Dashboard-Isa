import React, { useMemo } from 'react';
import { StudentRecord } from '../types';
import * as Processor from '../services/dataProcessing';
import CompanyHiresChart from './charts/CompanyHiresChart';
import TalentImpactChart from './charts/TalentImpactChart';
import BrazilMap from './BrazilMap';
import SectorComparisonChart from './charts/SectorComparisonChart';
import CompanyRoleChart from './charts/CompanyRoleChart';
import InternshipChart from './charts/InternshipChart';
import ExportMenu from './ExportMenu';

interface DashboardProps {
  data: StudentRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  
  // Memoize data processing for performance
  const hiresData = useMemo(() => Processor.processHiresPerCompany(data), [data]);
  const impactData = useMemo(() => Processor.processTalentLabImpact(data), [data]);
  const mapData = useMemo(() => Processor.processStateDistribution(data), [data]);
  const sectorComparisonData = useMemo(() => Processor.processSectorComparison(data), [data]);
  const internshipData = useMemo(() => Processor.processInternshipsByCompany(data), [data]);
  
  const companies = useMemo(() => Array.from(new Set(data.map(d => d.company))), [data]);

  return (
    <div id="dashboard-content" className="space-y-8 pb-12 animate-in fade-in duration-700 relative">
      
      {/* Export Button Row */}
      <div className="flex justify-end mb-2">
        <ExportMenu data={data} />
      </div>

      {/* Top Row: Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Hires per Company */}
        <div id="chart-hires" className="bg-card rounded-2xl p-6 border border-gray-800 shadow-xl hover:shadow-[0_0_20px_rgba(225,20,87,0.1)] transition-shadow">
          <CompanyHiresChart data={hiresData} />
        </div>

        {/* Card 2: Internships */}
        <div id="chart-internships" className="bg-card rounded-2xl p-6 border border-gray-800 shadow-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-shadow">
          <InternshipChart data={internshipData} />
        </div>

        {/* Card 3: Impact */}
        <div id="chart-impact" className="bg-card rounded-2xl p-6 border border-gray-800 shadow-xl hover:shadow-[0_0_20px_rgba(225,20,87,0.1)] transition-shadow">
          <TalentImpactChart data={impactData} />
        </div>

        {/* Card 4: Map */}
        <div id="chart-map" className="bg-card rounded-2xl p-6 border border-gray-800 shadow-xl hover:shadow-[0_0_20px_rgba(225,20,87,0.1)] transition-shadow">
          <BrazilMap data={mapData} />
        </div>
      </div>

      {/* Middle Row: Comparison Bar Chart */}
      <div id="chart-comparison" className="bg-card rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
        <SectorComparisonChart data={sectorComparisonData} />
      </div>

      {/* Bottom Section: Individual Company Charts */}
      <div id="chart-roles-container">
        <h3 className="text-white mb-6 font-semibold tracking-wide text-lg flex items-center gap-2">
           <span className="w-2 h-6 bg-primary rounded-full"></span>
           Análise Detalhada por Empresa (Cargos)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {companies.map(company => (
            <div key={company} id={`chart-role-${company.replace(/\s+/g, '-')}`}>
              <CompanyRoleChart 
                company={company} 
                data={Processor.processRolesByCompany(data, company)} 
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;