import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { audioSynth } from '../services/AudioSynth';

export const AudioVisualizer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Use getBoundingClientRect to ensure accurate dimensions
    const rect = svgRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Set up D3 scales
    // The AudioSynth analyser frequencyBinCount is default 256 for fftSize=512
    const numBins = 128; // Display first half of the bins (lower frequencies usually look better)
    
    const x = d3.scaleLinear()
      .domain([0, numBins - 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 255])
      .range([height, height * 0.5]); // Don't let the waves go too high up, keep them lower

    // Generate area path
    const area = d3.area<number>()
      .x((_, i) => x(i))
      .y0(height)
      .y1(d => y(d))
      .curve(d3.curveMonotoneX);

    // Generate line path
    const line = d3.line<number>()
      .x((_, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    // Add a gradient for the aesthetic
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "cyber-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#E056FD")
      .attr("stop-opacity", 0.3);
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#000000")
      .attr("stop-opacity", 0.0);

    const areaPath = svg.append("path")
      .attr("fill", "url(#cyber-gradient)")
      .attr("stroke", "none");

    const linePath = svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "#FF003C")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.4);

    let animationId: number;
    
    // Store empty array for fallback
    const emptyArray = new Array(numBins).fill(0);

    const renderLoop = () => {
      const spectrum = audioSynth.getSpectrum();
      
      let dataToRender: number[];
      if (spectrum) {
        // Take a slice to focus on the lower/mid frequencies which are more active
        dataToRender = Array.from(spectrum).slice(0, numBins);
      } else {
        dataToRender = emptyArray;
      }
      
      areaPath.datum(dataToRender).attr("d", area);
      linePath.datum(dataToRender).attr("d", line);
      
      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    // Resize observer to update scales when the window is resized
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      x.range([0, newWidth]);
      y.range([newHeight, newHeight * 0.5]);
    });
    
    resizeObserver.observe(svgRef.current);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <svg 
      ref={svgRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-[0] mix-blend-screen" 
      preserveAspectRatio="none"
    />
  );
};
