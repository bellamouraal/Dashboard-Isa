import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

interface Props {
  company: string;
  data: { role: string; count: number }[];
}

// Generate a gradient palette based on the primary color #E11457
const COLORS = [
  '#E11457', // Primary
  '#b31045', // Darker
  '#ff4d88', // Lighter
  '#800b32', // Deep Wine
  '#ff80aa', // Pale Pink
  '#4d071d', // Very Dark
  '#990d3b',
  '#cc124f'
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

  // Safety check if payload isn't ready
  if (!payload || !payload.role) return null;

  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="#fff" className="text-xs font-bold" style={{ textShadow: '0px 0px 4px rgba(0,0,0,0.8)' }}>
        {payload.role}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#E11457" className="text-sm font-bold">
        {value} Alunos
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0px 0px 6px rgba(225, 20, 87, 0.5))' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

const CompanyRoleChart: React.FC<Props> = ({ company, data }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Calculate total leads for this company
  const totalLeads = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  return (
    <div className="bg-card border border-gray-800 rounded-xl p-4 hover:border-primary/50 transition-colors duration-300 relative group flex flex-col">
        {/* Background glow effect */}
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all pointer-events-none"></div>

        <div className="flex justify-between items-center mb-2 z-10 relative border-b border-gray-800 pb-2">
            <h4 className="text-white font-bold text-sm truncate max-w-[70%]">
            {company}
            </h4>
            <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            {totalLeads} Leads
            </span>
        </div>
        
        {/* Explicit height is crucial for Recharts to render correctly inside flex containers in some browsers */}
        <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="role"
                        onMouseEnter={onPieEnter}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              stroke="rgba(0,0,0,0.5)"
                              strokeWidth={1}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default CompanyRoleChart;