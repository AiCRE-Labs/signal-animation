import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SignalAnimation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pointsRef = useRef([]);
  const textPixelsRef = useRef([]);
  
  const [animationState, setAnimationState] = useState("initial");
  const [clickable, setClickable] = useState(false);
  
  // Initialize points on first render
  useEffect(() => {
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const numPoints = 2000;
    
    // Initialize points with random positions
    pointsRef.current = Array.from({ length: numPoints }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * width * 0.3;
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
    
    // Draw text
    offscreenCtx.fillStyle = 'black';
    offscreenCtx.font = 'bold 90px Arial';
    offscreenCtx.textAlign = 'center';
    offscreenCtx.textBaseline = 'middle';
    offscreenCtx.fillText('Finding the signal', width / 2, height / 2);
    
    // Get image data
    const imageData = offscreenCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Find black pixels (text)
    const textPixels = [];
    const pixelDensity = 3; // Sample every nth pixel
    
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
    
    // If not enough pixels found, create manual text
    if (textPixels.length < 200) {
      console.log("Using manual text pixel generation");
      const manualPixels = [];
      const text = "Finding the signal";
      const letterWidth = 40;
      const letterHeight = 80;
      const startX = width/2 - (text.length * letterWidth)/2;
      const startY = height/2;
      
      // Create a simple grid for each letter
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === " ") continue;
        
        const letterX = startX + i * letterWidth;
        
        // For each letter, create a grid of points
        for (let y = -letterHeight/2; y < letterHeight/2; y += 4) {
          for (let x = -letterWidth/2; x < letterWidth/2; x += 4) {
            if (Math.random() < 0.6) { // Add randomness
              manualPixels.push({
                x: letterX + x,
                y: startY + y
              });
            }
          }
        }
      }
      
      console.log(`Created ${manualPixels.length} manual text pixels`);
      textPixelsRef.current = manualPixels;
    } else {
      textPixelsRef.current = textPixels;
    }
    
    // Start initial animation
    setAnimationState("initial");
  }, []);
  
  // Run animation when state changes
  useEffect(() => {
    if (!canvasRef.current) return;
    
    console.log(`Running animation for state: ${animationState}`);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Animation configuration
    const pointSize = 2;
    const animationDuration = 2000;
    const totalDelayTime = 800; // ms delay spread across all points
    const pointDelay = totalDelayTime / pointsRef.current.length;
    
    // Color scale based on animation state
    const getColorScale = (t) => {
      switch (animationState) {
        case "circle":
          return d3.interpolateViridis(t);
        case "wave":
          return d3.interpolateInferno(t);
        case "text":
          return d3.interpolatePlasma(t);
        default:
          return d3.interpolateRainbow(t);
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
      case "circle":
        // Circle/phyllotaxis layout
        const theta = Math.PI * (3 - Math.sqrt(5)); // Golden angle
        points.forEach((point, i) => {
          const index = i;
          const radius = 6 * Math.sqrt(index);
          const angle = index * theta;
          
          point.targetX = width / 2 + radius * Math.cos(angle);
          point.targetY = height / 2 + radius * Math.sin(angle);
          
          // Update color 
          const t = i / points.length;
          const color = d3.rgb(getColorScale(t));
          point.targetColor = [color.r / 255, color.g / 255, color.b / 255];
        });
        break;
        
      case "wave":
        // Wave layout
        points.forEach((point, i) => {
          const xPos = (i % 100) * (width / 100);
          const baseY = height / 2;
          const waveHeight = 140;
          const offset = Math.floor(i / 100) * 4;
          const yPos = baseY + Math.sin((i % 100) / 15 + offset) * waveHeight * (0.5 + (i % 3) / 6);
          
          point.targetX = xPos;
          point.targetY = yPos;
          
          // Update color
          const t = i / points.length;
          const color = d3.rgb(getColorScale(t));
          point.targetColor = [color.r / 255, color.g / 255, color.b / 255];
        });
        break;
        
      case "text":
        // Text layout
        const textPixels = textPixelsRef.current;
        points.forEach((point, i) => {
          if (i < textPixels.length) {
            // Assign to text pixel
            point.targetX = textPixels[i].x;
            point.targetY = textPixels[i].y;
            
            // Color gradient for text
            const t = i / textPixels.length;
            const color = d3.rgb(getColorScale(t));
            point.targetColor = [color.r / 255, color.g / 255, color.b / 255];
          } else {
            // Move excess points off-screen
            point.targetX = -100;
            point.targetY = -100;
            // Make them transparent
            point.targetColor = [0, 0, 0, 0];
          }
        });
        break;
        
      case "initial":
        // Random to circle animation on start
        const initTheta = Math.PI * (3 - Math.sqrt(5));
        points.forEach((point, i) => {
          const index = i;
          const radius = 6 * Math.sqrt(index);
          const angle = index * initTheta;
          
          point.targetX = width / 2 + radius * Math.cos(angle);
          point.targetY = height / 2 + radius * Math.sin(angle);
          
          // Update color 
          const t = i / points.length;
          const color = d3.rgb(getColorScale(t));
          point.targetColor = [color.r / 255, color.g / 255, color.b / 255];
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
        
        // Make clickable after completing the full cycle
        if (animationState === "text") {
          setClickable(true);
        }
        
        // Auto-advance to next state after a pause
        const timeoutId = setTimeout(() => {
          advanceState();
        }, 1500);
        
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
  }, [animationState]);
  
  // Function to advance to the next animation state
  const advanceState = () => {
    setAnimationState(prevState => {
      switch (prevState) {
        case "initial":
          return "circle";
        case "circle": 
          return "wave";
        case "wave":
          return "text";
        case "text":
          return "circle";
        default:
          return "circle";
      }
    });
  };
  
  // Canvas click handler for manual transitions
  const handleCanvasClick = () => {
    if (clickable) {
      setClickable(false);
      advanceState();
    }
  };
  
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
    <div className="w-full h-full flex flex-col items-center justify-center bg-white">
      <div className="relative w-full max-w-3xl">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={400} 
          className="w-full h-auto border border-gray-200 rounded shadow-lg bg-white"
          onClick={handleCanvasClick}
        />
        {/* {clickable && (
          <div className="absolute top-4 right-4 text-lg font-bold text-gray-700">
            Click Me!
          </div>
        )} */}
      </div>
      {/* <div className="mt-4 text-sm text-gray-600">
        Based on Nick Strayer's visualization technique using particle transitions between states
      </div> */}
    </div>
  );
};

export default SignalAnimation;