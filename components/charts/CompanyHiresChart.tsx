import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface Props {
  data: { name: string; value: number }[];
}

const CompanyHiresChart: React.FC<Props> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="w-full h-[300px]">
      <h3 className="text-white mb-4 font-semibold tracking-wide text-sm border-l-4 border-primary pl-2">
        Contratados por Empresa
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={90} 
            tick={{ fill: '#aaa', fontSize: 11, fontWeight: 500 }}
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
            itemStyle={{ color: '#E11457' }}
          />
          <Bar 
            dataKey="value" 
            barSize={24} 
            radius={[0, 4, 4, 0]}
          >
            {
              data.map((entry, index) => (
                <Cell 
                  cursor="pointer"
                  key={`cell-${index}`} 
                  fill={activeIndex === index ? '#ff3377' : '#E11457'} 
                  fillOpacity={activeIndex === index ? 1 : 0.7}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{ transition: 'all 0.3s ease' }}
                />
              ))
            }
            <LabelList 
              dataKey="value" 
              position="right" 
              style={{ fill: '#fff', fontSize: '12px', fontWeight: 'bold' }} 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompanyHiresChart;