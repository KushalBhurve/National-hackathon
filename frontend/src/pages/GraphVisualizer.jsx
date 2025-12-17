import React, { useMemo, useRef, useCallback, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const GraphVisualizer = ({ traceData, dimensions }) => {
  const fgRef = useRef();
  const [hoverNode, setHoverNode] = useState(null);

  // Styling Constants
  const COLORS = {
    start: '#10b981',      // Emerald
    source: '#8b5cf6',     // Violet
    knowledge: '#137fec',  // FactoryOS Blue
    text: '#94a3b8',       // Slate 400
    link: '#233648',       // Dark Slate
    highlight: '#ffffff'
  };

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={traceData}
      width={dimensions.width}
      height={dimensions.height}
      
      // --- BACKGROUND & GLOBAL ---
      backgroundColor="#0b1219"
      d3AlphaDecay={0.02} // Slower settling for smoother animation
      cooldownTime={3000}
      
      // --- LINKS (Organic "Flow" Style) ---
      linkCurvature={0.25} // Curved lines look more professional
      linkColor={() => COLORS.link}
      linkWidth={link => link.source === hoverNode || link.target === hoverNode ? 2 : 1}
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={0.006}
      linkDirectionalParticleWidth={2}
      linkDirectionalParticleColor={() => COLORS.knowledge}

      // --- NODES (Depth & Interaction) ---
      onNodeHover={setHoverNode}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const isHovered = node === hoverNode;
        const size = isHovered ? 7 : 5;
        const label = node.name;
        const fontSize = 13 / globalScale;

        // 1. Draw Outer Glow (Halo)
        if (isHovered || node.role === 'start') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, size * 2.2, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.role === 'start' ? `${COLORS.start}22` : `${COLORS.knowledge}22`;
          ctx.fill();
        }

        // 2. Draw Node Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        
        // Shadow for depth
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = COLORS[node.role] || COLORS.knowledge;
        ctx.fill();
        
        // Border
        ctx.strokeStyle = isHovered ? COLORS.highlight : 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1.5 / globalScale;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow for text

        // 3. Professional Typography
        if (globalScale > 1.5 || isHovered) {
          ctx.font = `${isHovered ? '600' : '400'} ${fontSize}px "Space Grotesk", Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Text Backdrop (for readability)
          const textWidth = ctx.measureText(label).width;
          ctx.fillStyle = '#0b1219ee';
          ctx.fillRect(node.x - textWidth/2 - 2, node.y + size + 4, textWidth + 4, fontSize + 2);

          ctx.fillStyle = traceData ? '#ffffff' : COLORS.text;
          ctx.fillText(label, node.x, node.y + size + 10);
        }
      }}
      
      // Performance Optimization
      nodeCanvasObjectMode={() => 'replace'}
    />
  );
};

export default GraphVisualizer;