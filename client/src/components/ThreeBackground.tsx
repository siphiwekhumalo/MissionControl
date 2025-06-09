import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  scene?: 'particles' | 'radar' | 'matrix';
  className?: string;
}

export default function ThreeBackground({ scene = 'particles', className = '' }: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const threeScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    sceneRef.current = threeScene;
    rendererRef.current = renderer;

    if (scene === 'particles') {
      setupParticleField(threeScene, camera);
    } else if (scene === 'radar') {
      setupRadarSweep(threeScene, camera);
    } else if (scene === 'matrix') {
      setupMatrixRain(threeScene, camera);
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      if (scene === 'particles') {
        animateParticles(threeScene);
      } else if (scene === 'radar') {
        animateRadar(threeScene);
      } else if (scene === 'matrix') {
        animateMatrix(threeScene);
      }
      
      renderer.render(threeScene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [scene]);

  return <div ref={containerRef} className={`absolute inset-0 ${className}`} />;
}

// Particle field animation
function setupParticleField(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const particleCount = 1000;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 200;
    positions[i + 1] = (Math.random() - 0.5) * 200;
    positions[i + 2] = (Math.random() - 0.5) * 200;
    
    velocities[i] = (Math.random() - 0.5) * 0.02;
    velocities[i + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i + 2] = (Math.random() - 0.5) * 0.02;
  }

  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.userData = { velocities };

  const material = new THREE.PointsMaterial({
    color: 0x00ff88,
    size: 0.5,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });

  const particleSystem = new THREE.Points(particles, material);
  scene.add(particleSystem);
  
  camera.position.z = 50;
}

function animateParticles(scene: THREE.Scene) {
  scene.children.forEach(child => {
    if (child instanceof THREE.Points) {
      const positions = child.geometry.attributes.position.array as Float32Array;
      const velocities = child.geometry.userData.velocities;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        // Wrap around boundaries
        if (Math.abs(positions[i]) > 100) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 100) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 100) velocities[i + 2] *= -1;
      }
      
      child.geometry.attributes.position.needsUpdate = true;
      child.rotation.y += 0.001;
    }
  });
}

// Radar sweep animation
function setupRadarSweep(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  // Radar grid
  const gridGeometry = new THREE.RingGeometry(10, 50, 32);
  const gridMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.1,
    wireframe: true,
  });
  const grid = new THREE.Mesh(gridGeometry, gridMaterial);
  scene.add(grid);

  // Radar sweep line
  const sweepGeometry = new THREE.BufferGeometry();
  const sweepPositions = new Float32Array([0, 0, 0, 50, 0, 0]);
  sweepGeometry.setAttribute('position', new THREE.BufferAttribute(sweepPositions, 3));
  
  const sweepMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.8,
  });
  
  const sweepLine = new THREE.Line(sweepGeometry, sweepMaterial);
  scene.add(sweepLine);
  
  // Add some blips
  for (let i = 0; i < 10; i++) {
    const blipGeometry = new THREE.CircleGeometry(0.5, 8);
    const blipMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7,
    });
    const blip = new THREE.Mesh(blipGeometry, blipMaterial);
    blip.position.set(
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 80,
      0
    );
    scene.add(blip);
  }
  
  camera.position.z = 80;
}

function animateRadar(scene: THREE.Scene) {
  const time = Date.now() * 0.001;
  
  scene.children.forEach(child => {
    if (child instanceof THREE.Line) {
      child.rotation.z = time * 0.5;
    }
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CircleGeometry) {
      child.material.opacity = 0.3 + 0.4 * Math.sin(time * 2 + child.position.x);
    }
  });
}

// Matrix rain effect
function setupMatrixRain(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const columns = 80; // More columns for fuller screen
  const dropSpeed = 0.15; // Slower speed
  
  for (let i = 0; i < columns; i++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(50 * 3); // More drops per column
    const drops = [];
    
    for (let j = 0; j < 50; j++) {
      const x = (i - columns / 2) * 1.5; // Tighter spacing
      const y = Math.random() * 150 - 75; // Taller screen coverage
      const z = Math.random() * 20 - 10; // Add depth variation
      
      positions[j * 3] = x;
      positions[j * 3 + 1] = y;
      positions[j * 3 + 2] = z;
      
      drops.push({ 
        speed: Math.random() * dropSpeed + 0.05, // Slower base speed
        opacity: Math.random() * 0.8 + 0.2 // Varying opacity
      });
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.userData = { drops };
    
    const material = new THREE.PointsMaterial({
      color: 0x00ff88,
      size: Math.random() * 1.5 + 0.5, // Varying sizes
      transparent: true,
      opacity: 0.7,
    });
    
    const points = new THREE.Points(geometry, material);
    scene.add(points);
  }
  
  camera.position.z = 60; // Pull back camera for wider view
}

function animateMatrix(scene: THREE.Scene) {
  scene.children.forEach(child => {
    if (child instanceof THREE.Points) {
      const positions = child.geometry.attributes.position.array as Float32Array;
      const drops = child.geometry.userData.drops;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= drops[i / 3].speed;
        
        // Reset when drops fall off screen (expanded range)
        if (positions[i + 1] < -75) {
          positions[i + 1] = 75 + Math.random() * 20;
          // Add slight horizontal drift
          positions[i] += (Math.random() - 0.5) * 0.1;
        }
      }
      
      child.geometry.attributes.position.needsUpdate = true;
      // Slow rotation for extra depth
      child.rotation.z += 0.0005;
    }
  });
}