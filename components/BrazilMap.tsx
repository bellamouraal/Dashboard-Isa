import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

interface BrazilMapProps {
  data: Record<string, number>;
}

const BrazilMap: React.FC<BrazilMapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    // Fetch topology for Brazil
    fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error("Error loading map data", err));
  }, []);

  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const width = 400;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Map projection
    const projection = d3.geoMercator()
      .center([-52, -15])
      .scale(550)
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Color scale
    const values = Object.values(data) as number[];
    const maxVal = values.length > 0 ? Math.max(...values) : 1;
    
    // Scale from dark gray to primary color
    const colorScale = d3.scaleSequential()
      .domain([0, maxVal])
      .interpolator(d3.interpolateRgbBasis(["#1a1a1a", "#4a051c", "#E11457"]));

    const g = svg.append("g");

    // Draw states
    g.selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", pathGenerator as any)
      .attr("fill", (d: any) => {
        const sigla = d.properties.sigla;
        const val = data[sigla] || 0;
        return val > 0 ? colorScale(val) : '#121212';
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d: any) {
        d3.select(this)
          .attr("fill", "#fff")
          .attr("stroke", "#E11457")
          .attr("stroke-width", 1.5);
      })
      .on("mouseout", function(event, d: any) {
        const sigla = d.properties.sigla;
        const val = data[sigla] || 0;
        d3.select(this)
          .attr("fill", val > 0 ? colorScale(val) : '#121212')
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5);
      })
      .append("title")
      .text((d: any) => `${d.properties.name}: ${data[d.properties.sigla] || 0} alunos`);

    // Add Text Labels for Counts inside map
    g.selectAll("text")
      .data(geoData.features)
      .enter()
      .append("text")
      .attr("transform", (d: any) => {
         const centroid = pathGenerator.centroid(d);
         return `translate(${centroid[0]},${centroid[1]})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d: any) => {
        const val = data[d.properties.sigla];
        return val ? val : "";
      })
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("pointer-events", "none") // Let clicks pass through to the path
      .style("text-shadow", "0px 0px 3px #000");

  }, [geoData, data]);

  // Create sorted list for legend
  const sortedStates = Object.entries(data).sort((a, b) => (b[1] as number) - (a[1] as number));

  return (
    <div className="w-full h-full flex flex-col items-center justify-between">
      <h3 className="text-white mb-2 font-semibold tracking-wide text-sm w-full text-left border-l-4 border-primary pl-2">
        Distribuição Demográfica (Estado)
      </h3>
      
      {geoData ? (
        <svg ref={svgRef} viewBox="0 0 400 400" className="w-full max-h-[250px] drop-shadow-[0_0_10px_rgba(225,20,87,0.1)]" />
      ) : (
        <div className="text-gray-500 animate-pulse text-xs my-10">Carregando mapa...</div>
      )}

      {/* Legend Area */}
      <div className="w-full mt-4 bg-zinc-900/50 rounded-lg p-3 max-h-[120px] overflow-y-auto custom-scrollbar border border-white/5">
        <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-2 sticky top-0 bg-zinc-900/90 w-full backdrop-blur-sm">
          Detalhamento por Estado
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {sortedStates.length > 0 ? (
            sortedStates.map(([uf, count]) => (
              <div key={uf} className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/5">
                <span className="text-gray-400 text-xs font-bold">{uf}</span>
                <span className="text-primary text-xs font-mono">{count}</span>
              </div>
            ))
          ) : (
            <span className="text-gray-600 text-xs col-span-4 text-center py-2">Nenhum dado demográfico</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrazilMap;