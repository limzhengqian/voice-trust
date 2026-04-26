// D3 force-directed trust graph. Nodes are users in the network,
// edges are TRUSTS / GUARANTEES relationships from Neptune.

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function TrustGraph({ network, onNodeClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!network) return;
    const W = 340, H = 280;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${W} ${H}`);

    const me = network.me;
    const direct = network.direct || [];
    const extended = network.extended || [];

    const colorByRole = { self: '#1A4FBE', guarantor: '#5B3FD9', guarantee: '#1FB36B', extended: '#94A3B8' };

    const nodes = [
      { id: me.id, name: 'You', role: 'self', score: me.trust_score, r: 24 },
      ...direct.map(d => ({
        id: d.id, name: d.name?.split(' ')[0] || d.id,
        role: d.role || 'guarantee',
        score: d.trust_score, r: 18, strength: d.strength,
      })),
      ...extended.map(d => ({
        id: d.id, name: d.name?.split(' ')[0] || d.id,
        role: 'extended', score: d.trust_score, r: 14,
      })),
    ];

    const links = [
      ...direct.map(d => ({ source: me.id, target: d.id, strength: d.strength || 0.7, type: 'direct' })),
      ...extended.map(d => ({ source: d.via || me.id, target: d.id, strength: 0.5, type: 'extended' })),
    ].filter(l => nodes.find(n => n.id === l.source) && nodes.find(n => n.id === l.target));

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => 80 - (d.strength || 0.5) * 30))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(d => d.r + 6));

    const link = svg.append('g').selectAll('line').data(links).join('line')
      .attr('stroke', d => d.type === 'extended' ? '#CBD5E1' : (d.strength > 0.7 ? '#1FB36B' : '#F59E0B'))
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => d.strength * 3 + 1)
      .attr('stroke-dasharray', d => d.type === 'extended' ? '4 3' : 'none');

    const node = svg.append('g').selectAll('g').data(nodes).join('g')
      .style('cursor', 'pointer')
      .on('click', (_e, d) => { if (d.role !== 'self') onNodeClick?.(d); });

    node.filter(d => d.role === 'guarantee').append('circle')
      .attr('r', d => d.r).attr('fill', 'none')
      .attr('stroke', d => colorByRole[d.role]).attr('stroke-width', 2).attr('opacity', 0.4)
      .style('animation', 'nodePulse 2s ease-in-out infinite');

    node.append('circle').attr('r', d => d.r)
      .attr('fill', d => colorByRole[d.role])
      .attr('stroke', '#fff').attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,.15))');

    node.append('text').text(d => d.score)
      .attr('text-anchor', 'middle').attr('dy', 4)
      .attr('font-size', '10px').attr('font-weight', '800')
      .attr('font-family', 'Sora,sans-serif').attr('fill', '#fff');

    node.append('text').text(d => d.name)
      .attr('text-anchor', 'middle').attr('dy', d => d.r + 14)
      .attr('font-size', '10px').attr('font-weight', '600')
      .attr('font-family', 'Sora,sans-serif').attr('fill', '#0B1B3F');

    sim.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${Math.max(d.r, Math.min(W - d.r, d.x))}, ${Math.max(d.r, Math.min(H - d.r, d.y))})`);
    });

    return () => sim.stop();
  }, [network, onNodeClick]);

  return <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />;
}
