import { useEffect, useRef } from 'react';

interface ThreeBackgroundProps {
  scene?: 'particles' | 'radar' | 'matrix';
  className?: string;
}

export default function ThreeBackgroundSimple({ scene = 'particles', className = '' }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Create animated particles using CSS
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: 2px;
        height: 2px;
        background: rgba(0, 255, 136, 0.6);
        border-radius: 50%;
        pointer-events: none;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${3 + Math.random() * 4}s ease-in-out infinite alternate;
        animation-delay: ${Math.random() * 2}s;
        box-shadow: 0 0 6px rgba(0, 255, 136, 0.8);
      `;
      container.appendChild(particle);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
        50% { opacity: 0.8; }
        100% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Cleanup
      container.innerHTML = '';
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [scene]);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0, 255, 136, 0.1) 0%, transparent 70%)',
      }}
    />
  );
}