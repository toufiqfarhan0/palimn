import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const CosmicMemoryCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 18;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Cloud (Starfield / Memory dust)
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0x818cf8), // Indigo
      new THREE.Color(0x34d399), // Emerald
      new THREE.Color(0xfbbf24), // Amber
    ];

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 45;
      positions[i3 + 1] = (Math.random() - 0.5) * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Major Temporal Nodes (Spheres)
    const nodeGroup = new THREE.Group();
    const nodeCoords = [
      { x: -5, y: 2, z: 0, color: 0xfbbf24, size: 0.45, label: 'Bangalore (2021)' },
      { x: 4, y: -2, z: 2, color: 0x34d399, size: 0.55, label: 'Hyderabad (2023)' },
      { x: 0, y: 0, z: -1, color: 0x38bdf8, size: 0.65, label: 'User (Alex)' },
      { x: 6, y: 3, z: -2, color: 0x818cf8, size: 0.4, label: 'Session 48' },
      { x: -6, y: -3, z: 1, color: 0xa78bfa, size: 0.38, label: 'Session 12' },
    ];

    nodeCoords.forEach((nc) => {
      const sphereGeo = new THREE.SphereGeometry(nc.size, 24, 24);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: nc.color,
        wireframe: true,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.set(nc.x, nc.y, nc.z);
      nodeGroup.add(mesh);
    });

    scene.add(nodeGroup);

    // Energy Line Connecting Bangalore -> SUPERSEDES -> Hyderabad
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.5,
      gapSize: 0.25,
      linewidth: 1,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5, 2, 0),
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(4, -2, 2),
    ]);
    const energyLine = new THREE.Line(lineGeo, lineMat);
    energyLine.computeLineDistances();
    scene.add(energyLine);

    // Mouse tracking for parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Slow orbital rotation
      particles.rotation.y = elapsedTime * 0.04;
      particles.rotation.x = elapsedTime * 0.02;
      nodeGroup.rotation.y = elapsedTime * 0.06;

      // Parallax easing
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      camera.position.x = targetX * 2.5;
      camera.position.y = targetY * 1.5;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden opacity-80"
      style={{ zIndex: 0 }}
    />
  );
};
