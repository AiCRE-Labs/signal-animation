import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SignalAnimation = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pointsRef = useRef([]);
  const textPixelsRef = useRef([]);
  
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const [animationState, setAnimationState] = useState("initial");
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Get container dimensions
        const containerWidth = containerRef.current.clientWidth;
        // Keep aspect ratio of 10:7
        const containerHeight = containerWidth * 0.7;
        
        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };
    
    // Set initial size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Update canvas when dimensions change
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      
      // Reset animation state to restart with new dimensions
      setAnimationState("initial");
    }
  }, [dimensions]);
  
  // Initialize points when animation state is "initial"
  useEffect(() => {
    if (animationState !== "initial" || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    
    // Adjust number of points based on screen size
    // Increased density factor (changed from 250 to 150) to get more points
    const numPoints = Math.min(10000, Math.max(6000, Math.floor(width * height / 150)));
    
    console.log(`Initializing ${numPoints} points for canvas size ${width}x${height}`);
    
    // Initialize points with random positions
    pointsRef.current = Array.from({ length: numPoints }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * width * 0.4;
      const x = width / 2 + Math.cos(angle) * distance;
      const y = height / 2 + Math.sin(angle) * distance;
      
      return {
        id: i,
        x: x,
        y: y,
        targetX: x,
        targetY: y,
        startX: x,
        startY: y,
        color: [0.5, 0.5, 0.8],
        startColor: [0.5, 0.5, 0.8],
        targetColor: [0.5, 0.5, 0.8]
      };
    });
    
    // Generate text pixels
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    // Clear the offscreen canvas
    offscreenCtx.fillStyle = 'white';
    offscreenCtx.fillRect(0, 0, width, height);
    
    // Draw text with adjusted font size to prevent clipping
    offscreenCtx.fillStyle = 'black';
    
    // Dynamically calculate font size based on canvas width
    // Increased minimum font size for better visibility on small screens
    let fontSize = Math.max(30, Math.min(70, width * 0.08));
    offscreenCtx.font = `bold ${fontSize}px Arial`;
    offscreenCtx.textAlign = 'center';
    offscreenCtx.textBaseline = 'bottom';
    
    const text = 'Finding the Signal';
    
    // Calculate text width and ensure it fits
    let textWidth = offscreenCtx.measureText(text).width;
    
    // If text is too wide, reduce font size until it fits with padding
    const padding = width * 0.1; // 10% padding on each side
    while (textWidth > width - padding * 2 && fontSize > 26) {
      fontSize -= 2;
      offscreenCtx.font = `bold ${fontSize}px Arial`;
      textWidth = offscreenCtx.measureText(text).width;
    }
    
    // Draw the text, positioned in top third of canvas
    // Updated to be positioned higher up for better separation from EKG
    offscreenCtx.fillText(text, width / 2, height * 0.3);
    
    // Get image data
    const imageData = offscreenCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Find black pixels (text)
    const textPixels = [];
    // Reduced pixel density to sample more text points (from 5 to 2)
    const pixelDensity = Math.max(2, Math.min(3, Math.floor(width / 400)));
    
    for (let y = 0; y < height; y += pixelDensity) {
      for (let x = 0; x < width; x += pixelDensity) {
        const i = (y * width + x) * 4;
        // If pixel is dark (text)
        if (data[i] < 50) {
          textPixels.push({ x, y });
        }
      }
    }
    
    console.log(`Found ${textPixels.length} text pixels`);
    textPixelsRef.current = textPixels;
    
    // Start the animation cycle
    setAnimationState("hexagon");
  }, [animationState, dimensions]);
  
  // Run animation when state changes (and isn't "initial")
  useEffect(() => {
    if (!canvasRef.current || animationState === "initial") return;
    
    console.log(`Running animation for state: ${animationState}`);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Animation configuration
    // Smaller screens get proportionally sized points
    const pointSize = width < 600 ? Math.max(0.5, width / 800) : 1;
    const animationDuration = 2000;
    const totalDelayTime = 100;
    const pointDelay = totalDelayTime / pointsRef.current.length;
    
    // Color scale based on animation state
    const getColorScale = (t) => {
      switch (animationState) {
        case "hexagon":
          return d3.interpolatePlasma(t);
        case "wave":
          return d3.interpolatePlasma(t);
        case "text":
          return d3.interpolatePlasma(t);
        default:
          return d3.interpolatePlasma(t);
      }
    };
    
    // Apply layouts based on current state
    const points = pointsRef.current;
    
    // Set start positions to current positions
    points.forEach(point => {
      point.startX = point.x;
      point.startY = point.y;
      point.startColor = [...point.color];
    });
    
    // Apply appropriate layout
    switch (animationState) {
      case "hexagon":
        // Create a grid of evenly-spaced hexagons centered in the canvas
        
        // Calculate optimal hexagon size and spacing based on canvas dimensions
        const hexMargin = width * 0.05; // 5% margin
        const availableWidth = width - (hexMargin * 2);
        const availableHeight = height * 0.5; // Use middle 50% of canvas
        const verticalOffset = height * 0.05; // Start 5% down the canvas for vertical centering
        
        // Determine grid size based on screen size
        // Reduced number of hexagons for small screens
        const gridCols = width < 600 ? 2 : (width < 900 ? 4 : 6);
        const gridRows = width < 600 ? 2 : (width < 900 ? 4 : 6);
        
        // Calculate hexagon dimensions
        const hexHorizontalSpacing = availableWidth / gridCols;
        const hexVerticalSpacing = availableHeight / gridRows;
        const hexRadius = Math.min(hexHorizontalSpacing, hexVerticalSpacing) * 0.55;
        const pointsPerEdge = Math.max(6, Math.min(10, Math.floor(width / 100))); // Scale with screen size
        
        // Function to create a proper hexagon with straight edges
        function createHexagonPoints(centerX, centerY, size) {
          const hexPoints = [];
          
          // Create 6 edges with points distributed along each edge
          for (let edge = 0; edge < 6; edge++) {
            // Calculate the start and end angles for this edge
            const startAngle = edge * (Math.PI / 3);
            const endAngle = ((edge + 1) % 6) * (Math.PI / 3);
            
            // Calculate start and end coordinates for this edge
            const startX = centerX + Math.cos(startAngle) * size;
            const startY = centerY + Math.sin(startAngle) * size;
            const endX = centerX + Math.cos(endAngle) * size;
            const endY = centerY + Math.sin(endAngle) * size;
            
            // Add points along this edge
            for (let i = 0; i < pointsPerEdge; i++) {
              const t = i / pointsPerEdge;
              hexPoints.push({
                x: startX + (endX - startX) * t,
                y: startY + (endY - startY) * t,
                edge: edge
              });
            }
          }
          
          return hexPoints;
        }
        
        // Generate all hexagons in the grid
        const allHexagons = [];
        
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            // Calculate center position with honeycomb offset
            const offsetX = row % 2 === 0 ? 0 : hexHorizontalSpacing / 3;
            
            // Position hexagons evenly across available space in center of canvas
            const centerX = hexMargin + (col * hexHorizontalSpacing) + (hexHorizontalSpacing / 3) + offsetX;
            const centerY = verticalOffset + (row * hexVerticalSpacing) + (hexVerticalSpacing / 3);
            
            // Create this hexagon
            const hexPoints = createHexagonPoints(centerX, centerY, hexRadius);
            
            // Add to collection with position info
            allHexagons.push({
              points: hexPoints,
              centerX,
              centerY,
              row,
              col
            });
          }
        }
        
        // Distribute all points among the hexagons
        points.forEach((point, i) => {
          // Determine which hexagon and which point within that hexagon
          const hexIndex = i % allHexagons.length;
          const hex = allHexagons[hexIndex];
          
          // Calculate point position within the hexagon
          const pointsPerHex = Math.floor(points.length / allHexagons.length);
          const indexInHex = Math.floor(i / allHexagons.length);
          
          // If we have more points than edge points, add some interior points
          let x, y;
          let edgeIndex = -1;
          
          if (indexInHex < hex.points.length) {
            // Place points along the edges
            const hexPoint = hex.points[indexInHex];
            x = hexPoint.x;
            y = hexPoint.y;
            edgeIndex = hexPoint.edge;
          } else {
            // Place additional points in the interior
            const innerIndex = indexInHex - hex.points.length;
            const innerRadius = hexRadius * (0.8 - (innerIndex % 5) * 0.15);
            const angle = (innerIndex * 0.53) % (Math.PI * 2); // Use golden ratio for distribution
            
            x = hex.centerX + Math.cos(angle) * innerRadius;
            y = hex.centerY + Math.sin(angle) * innerRadius;
            edgeIndex = Math.floor(angle / (Math.PI / 3));
          }
          
          // Position this point
          point.targetX = x;
          point.targetY = y;
          
          // Color based on position and edge
          const rowColFactor = (hex.row / gridRows + hex.col / gridCols) / 2;
          const edgeFactor = edgeIndex >= 0 ? edgeIndex / 6 : 0;
          const t = (rowColFactor * 0.7 + edgeFactor * 0.3) % 1.0;
          
          const color = d3.rgb(getColorScale(t));
          point.targetColor = [color.r / 255, color.g / 255, color.b / 255];
        });
        break;
        
      case "wave":
        // Pulsing EKG wave positioned in the bottom half of the canvas
        // IMPORTANT CHANGE: Dynamic positioning of EKG based on screen size
        // For small screens, place EKG lower to avoid text overlap
        
        // Calculate optimal EKG position based on screen size
        const baseYPosition = width < 600 
          ? height * 0.55  // On small screens, position EKG lower (55% down)
          : height * 0.45; // On larger screens, keep it closer to middle (45% down)
        
        // Calculate EKG wave height that won't interfere with text
        // Make the wave smaller on small screens
        const ekgHeight = width < 600 
          ? height * 0.07  // Smaller wave on small screens (7% of height)
          : height * 0.1;  // Normal wave on larger screens (10% of height)
          
        // Reduce amplitude of the wave on small screens
        const sWaveDepth = width < 600
          ? height * 0.003  // Smaller S wave on small screens
          : height * 0.004; // Normal S wave on larger screens
          
        const tWaveHeight = width < 600
          ? height * 0.02  // Smaller T wave on small screens
          : height * 0.03; // Normal T wave on larger screens
          
        // Thinner EKG line on small screens
        const rowThickness = width < 600 ? 0.5 : 1.5;
        
        points.forEach((point, i) => {
          // Distribute points across width
          const xSegments = Math.max(50, Math.min(100, Math.floor(width / 10)));
          const segment = i % xSegments;
          const xPos = (width * segment) / xSegments;
          
          // Use our dynamic base position
          const baseY = baseYPosition;
          
          // Create a single moving EKG spike
          const now = Date.now();
          const pulseSpeed = 5000; // Time for one complete cycle in ms
          const pulsePosition = ((now % pulseSpeed) / pulseSpeed) * xSegments;
          
          // Calculate distance from spike center
          const distanceFromSpike = Math.abs(segment - pulsePosition);
          
          let yPos;
          
          // Create the EKG spike pattern when near the pulse position
          if (distanceFromSpike < 5) {
            // Standard EKG pattern (P-QRS-T wave)
            const localProgress = (5 - distanceFromSpike) / 5;
            
            if (distanceFromSpike < 1) {
              // Main spike (R wave) - sharp upward peak
              yPos = baseY - Math.pow(1 - distanceFromSpike, 2) * ekgHeight;
            } 
            else if (distanceFromSpike < 2) {
              // S wave - small downward deflection after R
              yPos = baseY + ((distanceFromSpike - 1) * (2 - distanceFromSpike)) * sWaveDepth;
            }
            else if (distanceFromSpike < 3.5) {
              // T wave - smaller rounded upward deflection
              const tWaveProgress = (distanceFromSpike - 2) / 1.5;
              yPos = baseY - Math.sin(tWaveProgress * Math.PI) * tWaveHeight;
            }
            else {
              // Return to baseline
              yPos = baseY;
            }
          } 
          else {
            // Baseline with minimal variation (reduced from 2 to 0.5)
            yPos = baseY + (Math.sin(segment * 0.1) * 0.5);
          }
          
          // Add row offset for points to create thickness in the line
          const rowIndex = Math.floor(i / xSegments);
          
          // Significantly reduced vertical spread for non-spike areas
          // Calculate if we're in a spike area or not
          const isNearSpike = distanceFromSpike < 5;
          
          // Use different row thickness based on proximity to spike
          const effectiveRowThickness = isNearSpike ? rowThickness : rowThickness * 0.3;
          
          // Calculate row offset with reduced vertical spread for non-spike areas
          const rowOffset = (rowIndex - Math.floor(points.length / xSegments / 2)) * effectiveRowThickness;
          
          point.targetX = xPos;
          point.targetY = yPos + rowOffset;
          
          // Color gradient with brighter colors near the spike
          const t = Math.max(0, Math.min(1, 1 - (distanceFromSpike / xSegments) * 3));
          const color = d3.rgb(getColorScale(t));
          point.targetColor = [color.r / 255, color.g / 255, color.b / 255];
        });
        break;
        
      case "text":
        // Text layout - keep the positions from the text pixels
        const textPixels = textPixelsRef.current;
        points.forEach((point, i) => {
          if (i < textPixels.length) {
            // Assign to text pixel - no change needed as text is already positioned correctly
            point.targetX = textPixels[i].x;
            point.targetY = textPixels[i].y;
            
            // Color gradient for text
            const t = i / textPixels.length;
            const color = d3.rgb(getColorScale(t));
            point.targetColor = [color.r / 255, color.g / 255, color.b / 255];
          } else {
            // Make excess points transparent
            point.targetColor = [0, 0, 0, 0];
          }
        });
        break;
    }
    
    // Animation loop
    let startTime = null;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Clear canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      let allDone = true;
      
      // Draw each point
      points.forEach((point, i) => {
        // Individual delay based on index
        const delay = i * pointDelay;
        
        // If still in delay period
        if (elapsed < delay) {
          // Draw at start position
          ctx.fillStyle = `rgb(
            ${Math.round(point.startColor[0] * 255)}, 
            ${Math.round(point.startColor[1] * 255)}, 
            ${Math.round(point.startColor[2] * 255)}
          )`;
          ctx.beginPath();
          ctx.arc(point.startX, point.startY, pointSize, 0, Math.PI * 2);
          ctx.fill();
          
          allDone = false;
          return;
        }
        
        // Calculate progress with easing
        let progress = Math.min(1, (elapsed - delay) / animationDuration);
        progress = easeCubicInOut(progress);
        
        if (progress < 1) allDone = false;
        
        // Interpolate position and color
        point.x = lerp(point.startX, point.targetX, progress);
        point.y = lerp(point.startY, point.targetY, progress);
        
        point.color = [
          lerp(point.startColor[0], point.targetColor[0], progress),
          lerp(point.startColor[1], point.targetColor[1], progress),
          lerp(point.startColor[2], point.targetColor[2], progress)
        ];
        
        // Only draw points that are on screen
        if (point.x > -pointSize && point.x < width + pointSize &&
            point.y > -pointSize && point.y < height + pointSize) {
          
          ctx.fillStyle = `rgb(
            ${Math.round(point.color[0] * 255)}, 
            ${Math.round(point.color[1] * 255)}, 
            ${Math.round(point.color[2] * 255)}
          )`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      if (!allDone) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, proceed to next state after a delay
        console.log(`Animation to ${animationState} complete`);
        
        // Auto-advance to next state after a pause
        const timeoutId = setTimeout(() => {
          setAnimationState(prevState => {
            switch (prevState) {
              case "hexagon":
                return "wave";
              case "wave":
                return "text";
              case "text":
                return "hexagon";
              default:
                return "hexagon";
            }
          });
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationState, dimensions]);
  
  // Helper functions
  function lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }
  
  function easeCubicInOut(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 + (--t) * (2 * t) * (2 * t);
  }
  
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div 
        ref={containerRef}
        className="w-full max-w-6xl mx-auto"
      > 
        <canvas 
          ref={canvasRef}
          className="w-full h-auto border border-gray-200 rounded-lg shadow-lg bg-white"
          style={{ aspectRatio: '10/7' }}
        />
      </div>
    </div>
  );
};

export default SignalAnimation;