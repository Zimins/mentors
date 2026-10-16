'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  Box,
  Cpu,
  Eye,
  EyeOff,
  Grid,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCw,
  Send,
  Sparkles,
  Code2,
  X,
} from 'lucide-react';
import { Scene3DSpec, Scene3DNode, Scene3DConnection } from '@/types/mentor';

export interface Argon3DViewerProps {
  scene: Scene3DSpec;
  accentColor?: string;
  onRequestGenerate3D?: (topic: string) => void;
  isGenerating?: boolean;
  className?: string;
}

interface AnimatedNodeMeshProps {
  node: Scene3DNode;
  index: number;
  globalWireframe: boolean;
  showLabels: boolean;
  isSelected: boolean;
  accentColor: string;
  onSelect: (node: Scene3DNode) => void;
}

function AnimatedNodeMesh({
  node,
  index,
  globalWireframe,
  showLabels,
  isSelected,
  accentColor,
  onSelect,
}: AnimatedNodeMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const basePosition = useMemo(
    () => new THREE.Vector3(node.position[0], node.position[1], node.position[2]),
    [node.position]
  );

  const baseScale = useMemo(
    () => new THREE.Vector3(node.scale[0] || 1, node.scale[1] || 1, node.scale[2] || 1),
    [node.scale]
  );

  useFrame((state, delta) => {
    const speed = node.animationSpeed ?? 1;
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      if (node.animation === 'float') {
        groupRef.current.position.set(
          basePosition.x,
          basePosition.y + Math.sin(t * 2.0 * speed + index * 0.9) * 0.25,
          basePosition.z
        );
      } else if (node.animation === 'orbit') {
        const radius = 0.35;
        groupRef.current.position.set(
          basePosition.x + Math.cos(t * 1.4 * speed + index) * radius,
          basePosition.y + Math.sin(t * 1.8 * speed + index) * 0.12,
          basePosition.z + Math.sin(t * 1.4 * speed + index) * radius
        );
      } else {
        groupRef.current.position.copy(basePosition);
      }
    }

    if (meshRef.current) {
      if (node.animation === 'rotate') {
        meshRef.current.rotation.y += delta * 0.9 * speed;
        meshRef.current.rotation.x += delta * 0.35 * speed;
      }

      if (node.animation === 'pulse') {
        const pulseFactor = 1 + Math.sin(t * 2.8 * speed + index) * 0.12;
        const hoverBoost = hovered || isSelected ? 1.08 : 1.0;
        meshRef.current.scale.set(
          baseScale.x * pulseFactor * hoverBoost,
          baseScale.y * pulseFactor * hoverBoost,
          baseScale.z * pulseFactor * hoverBoost
        );
      } else {
        const hoverBoost = hovered || isSelected ? 1.08 : 1.0;
        meshRef.current.scale.set(
          baseScale.x * hoverBoost,
          baseScale.y * hoverBoost,
          baseScale.z * hoverBoost
        );
      }
    }
  });

  const renderGeometry = () => {
    switch (node.shape) {
      case 'sphere':
        return <sphereGeometry args={[0.65, 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.55, 0.55, 1.1, 32]} />;
      case 'cone':
        return <coneGeometry args={[0.65, 1.2, 32]} />;
      case 'torus':
        return <torusGeometry args={[0.6, 0.22, 20, 48]} />;
      case 'box':
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const labelYOffset = (node.scale?.[1] || 1) * 0.75 + 0.55;

  return (
    <group ref={groupRef} position={node.position}>
      <mesh
        ref={meshRef}
        rotation={node.rotation ? [node.rotation[0], node.rotation[1], node.rotation[2]] : [0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={node.color || accentColor}
          emissive={node.emissive || node.color || accentColor}
          emissiveIntensity={isSelected ? 0.85 : hovered ? 0.65 : 0.32}
          metalness={node.metalness ?? 0.45}
          roughness={node.roughness ?? 0.25}
          wireframe={Boolean(node.wireframe || globalWireframe)}
          transparent={node.opacity !== undefined && node.opacity < 1}
          opacity={node.opacity ?? 1}
        />
      </mesh>

      {/* Selection / Hover Halo */}
      {(isSelected || hovered) && (
        <mesh
          rotation={node.rotation ? [node.rotation[0], node.rotation[1], node.rotation[2]] : [0, 0, 0]}
          scale={[
            (node.scale[0] || 1) * 1.22,
            (node.scale[1] || 1) * 1.22,
            (node.scale[2] || 1) * 1.22,
          ]}
        >
          {renderGeometry()}
          <meshBasicMaterial
            color={isSelected ? '#ffffff' : accentColor}
            wireframe
            transparent
            opacity={isSelected ? 0.55 : 0.28}
          />
        </mesh>
      )}

      {/* 3D Floating Node Label */}
      {showLabels && node.label && (
        <Html distanceFactor={10} position={[0, labelYOffset, 0]} center zIndexRange={[10, 0]}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node);
            }}
            className={`group flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight transition-all duration-200 backdrop-blur-md border shadow-lg ${
              isSelected
                ? 'bg-white/20 text-white border-white/60 scale-110 ring-2 ring-cyan-400/50'
                : 'bg-slate-950/80 text-slate-100 border-white/15 hover:bg-slate-900/95 hover:border-white/40'
            }`}
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{
                backgroundColor: node.color || accentColor,
                boxShadow: `0 0 8px ${node.color || accentColor}`,
              }}
            />
            <span>{node.label}</span>
          </button>
        </Html>
      )}
    </group>
  );
}

interface ConnectionBeamProps {
  connection: Scene3DConnection;
  fromNode: Scene3DNode;
  toNode: Scene3DNode;
  index: number;
  showLabels: boolean;
  accentColor: string;
}

function ConnectionBeam({
  connection,
  fromNode,
  toNode,
  index,
  showLabels,
  accentColor,
}: ConnectionBeamProps) {
  const packet1Ref = useRef<THREE.Mesh>(null);
  const packet2Ref = useRef<THREE.Mesh>(null);

  const startVec = useMemo(
    () => new THREE.Vector3(fromNode.position[0], fromNode.position[1], fromNode.position[2]),
    [fromNode.position]
  );
  const endVec = useMemo(
    () => new THREE.Vector3(toNode.position[0], toNode.position[1], toNode.position[2]),
    [toNode.position]
  );
  const midPoint = useMemo(
    () =>
      [
        (fromNode.position[0] + toNode.position[0]) / 2,
        (fromNode.position[1] + toNode.position[1]) / 2 + 0.22,
        (fromNode.position[2] + toNode.position[2]) / 2,
      ] as [number, number, number],
    [fromNode.position, toNode.position]
  );

  const beamColor = connection.color || accentColor || '#38bdf8';

  useFrame((state) => {
    if (!connection.animatedPacket) return;
    const t1 = (state.clock.elapsedTime * 0.65 + index * 0.27) % 1;
    const t2 = (state.clock.elapsedTime * 0.65 + index * 0.27 + 0.5) % 1;

    if (packet1Ref.current) {
      packet1Ref.current.position.lerpVectors(startVec, endVec, t1);
    }
    if (packet2Ref.current) {
      packet2Ref.current.position.lerpVectors(startVec, endVec, t2);
    }
  });

  return (
    <group>
      <Line
        points={[fromNode.position, toNode.position]}
        color={beamColor}
        lineWidth={2}
        transparent
        opacity={0.65}
      />

      {connection.animatedPacket && (
        <>
          <mesh ref={packet1Ref} position={fromNode.position}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={beamColor}
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={packet2Ref} position={fromNode.position}>
            <sphereGeometry args={[0.075, 12, 12]} />
            <meshStandardMaterial
              color={beamColor}
              emissive={beamColor}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
        </>
      )}

      {showLabels && connection.label && (
        <Html position={midPoint} center distanceFactor={12} zIndexRange={[5, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/75 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
            {connection.label}
          </div>
        </Html>
      )}
    </group>
  );
}

function buildFallbackThreeJsHtml(scene: Scene3DSpec, accentColor: string): string {
  if (scene.threejsHtmlCode && scene.threejsHtmlCode.trim().length > 0) {
    return scene.threejsHtmlCode;
  }

  const safeNodes = JSON.stringify(scene.nodes || []);
  const safeConnections = JSON.stringify(scene.connections || []);
  const bg = scene.backgroundColor || '#050811';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${bg}; font-family: system-ui, sans-serif; color: #f8fafc; }
    #hud { position: absolute; bottom: 12px; left: 12px; background: rgba(2,6,23,0.78); border: 1px solid rgba(56,189,248,0.3); border-radius: 10px; padding: 8px 12px; font-size: 12px; backdrop-filter: blur(8px); pointer-events: none; }
    #hud strong { color: ${accentColor}; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
  <div id="hud">
    <strong>Gemini 4 Argon Raw WebGL Runtime</strong> · ${scene.title.replace(/</g, '&lt;')}
  </div>
  <script>
    const nodes = ${safeNodes};
    const connections = ${safeConnections};
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('${bg}');
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);
    const point = new THREE.PointLight(0xffffff, 1.3);
    point.position.set(8, 10, 8);
    scene.add(point);

    const grid = new THREE.GridHelper(22, 22, '${accentColor}', 0x1e293b);
    grid.position.y = -3.2;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);
    const meshes = [];

    nodes.forEach((n, idx) => {
      let geo;
      if (n.shape === 'sphere') geo = new THREE.SphereGeometry(0.65, 28, 28);
      else if (n.shape === 'cylinder') geo = new THREE.CylinderGeometry(0.55, 0.55, 1.1, 28);
      else if (n.shape === 'cone') geo = new THREE.ConeGeometry(0.65, 1.2, 28);
      else if (n.shape === 'torus') geo = new THREE.TorusGeometry(0.6, 0.22, 16, 40);
      else geo = new THREE.BoxGeometry(1, 1, 1);

      const mat = new THREE.MeshStandardMaterial({
        color: n.color || '${accentColor}',
        emissive: n.emissive || n.color || '${accentColor}',
        emissiveIntensity: 0.35,
        metalness: 0.5,
        roughness: 0.25,
        wireframe: Boolean(n.wireframe)
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(n.position[0], n.position[1], n.position[2]);
      mesh.scale.set(n.scale[0] || 1, n.scale[1] || 1, n.scale[2] || 1);
      group.add(mesh);
      meshes.push({ mesh, node: n, idx });
    });

    connections.forEach((c) => {
      const from = nodes.find((n) => n.id === c.fromId);
      const to = nodes.find((n) => n.id === c.toId);
      if (from && to) {
        const pts = [
          new THREE.Vector3(...from.position),
          new THREE.Vector3(...to.position)
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const lineMat = new THREE.LineBasicMaterial({ color: c.color || '${accentColor}' });
        group.add(new THREE.Line(lineGeo, lineMat));
      }
    });

    let isDragging = false;
    let prevX = 0, prevY = 0;
    window.addEventListener('pointerdown', (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
    window.addEventListener('pointerup', () => { isDragging = false; });
    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      group.rotation.y += (e.clientX - prevX) * 0.008;
      group.rotation.x += (e.clientY - prevY) * 0.008;
      prevX = e.clientX;
      prevY = e.clientY;
    });

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!isDragging) group.rotation.y += 0.0035;
      meshes.forEach(({ mesh, node, idx }) => {
        mesh.rotation.y += 0.01;
        if (node.animation === 'float') {
          mesh.position.y = node.position[1] + Math.sin(t * 2 + idx) * 0.22;
        }
      });
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;
}

const QUICK_3D_TOPICS = [
  'B-Tree Node Split',
  'TCP 3-Way Handshake',
  'Quantum Entanglement Spin',
  'Transformer Self-Attention',
];

export function Argon3DViewer({
  scene,
  accentColor = '#38bdf8',
  onRequestGenerate3D,
  isGenerating = false,
  className = '',
}: Argon3DViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [globalWireframe, setGlobalWireframe] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [rawHtmlMode, setRawHtmlMode] = useState(scene.mode === 'threejs_html');
  const [cameraResetKey, setCameraResetKey] = useState(0);
  const [selectedNode, setSelectedNode] = useState<Scene3DNode | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync mode when a new scene arrives from Gemini 4 Argon
  useEffect(() => {
    setRawHtmlMode(scene.mode === 'threejs_html' && Boolean(scene.threejsHtmlCode));
    setSelectedNode(null);
  }, [scene]);

  const nodes = useMemo(() => scene.nodes ?? [], [scene.nodes]);
  const connections = useMemo(() => scene.connections ?? [], [scene.connections]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, Scene3DNode>();
    for (const n of nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [nodes]);

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = topicInput.trim();
    if (!trimmed || !onRequestGenerate3D || isGenerating) return;
    onRequestGenerate3D(trimmed);
    setTopicInput('');
  };

  const handleQuickTopic = (topic: string) => {
    if (!onRequestGenerate3D || isGenerating) return;
    onRequestGenerate3D(topic);
  };

  const rawHtmlDoc = useMemo(
    () => buildFallbackThreeJsHtml(scene, accentColor),
    [scene, accentColor]
  );

  return (
    <div
      className={`relative flex flex-col rounded-2xl border border-white/10 bg-slate-950/90 shadow-2xl overflow-hidden transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50' : 'h-full min-h-[430px]'
      } ${className}`}
    >
      {/* Top Control Toolbar */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/90 px-4 py-2.5 backdrop-blur-xl">
        {/* Left: Gemini 4 Argon Badge & Scene Title */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm border border-white/20"
            style={{
              background: `linear-gradient(135deg, ${accentColor}33, rgba(139, 92, 246, 0.35))`,
            }}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            <span>✨ Powered by Gemini 4 Argon (gemini-4-argon)</span>
          </span>

          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">{scene.title}</h3>
            <span className="hidden md:inline-block rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400 border border-white/10">
              {nodes.length} Nodes · {connections.length} Vectors
            </span>
          </div>
        </div>

        {/* Right: Interactive 3D Viewport Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            title="Toggle Auto-Rotate"
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">Auto-Rotate</span>
          </button>

          <button
            type="button"
            onClick={() => setGlobalWireframe((v) => !v)}
            title="Toggle Wireframe Mode"
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
              globalWireframe
                ? 'bg-purple-500/20 text-purple-200 border-purple-400/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Wireframe</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLabels((v) => !v)}
            title="Toggle Node Labels"
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
              showLabels
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            {showLabels ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Node Labels</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCameraResetKey((k) => k + 1);
              setSelectedNode(null);
            }}
            title="Reset Camera"
            className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Camera</span>
          </button>

          <button
            type="button"
            onClick={() => setRawHtmlMode((v) => !v)}
            title="Switch between Structured 3D Scene and Raw Argon Shader/HTML View"
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border ${
              rawHtmlMode
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">
              {rawHtmlMode ? 'Structured 3D Mode' : 'Raw Argon Shader/HTML View'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? 'Minimize Viewport' : 'Expand Viewport'}
            className="inline-flex items-center justify-center rounded-lg bg-white/5 p-1.5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Interactive "Ask Argon 3D" Generation Bar */}
      {onRequestGenerate3D && (
        <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/60 px-4 py-2 backdrop-blur-md">
          <form onSubmit={handleGenerateSubmit} className="flex flex-1 items-center gap-2 min-w-[260px]">
            <div className="relative flex-1">
              <Cpu className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-400" />
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                disabled={isGenerating}
                placeholder="Ask Argon 3D: e.g., B-Tree Node Split, TCP 3-Way Handshake, Quantum Entanglement Spin..."
                className="w-full rounded-xl border border-white/15 bg-slate-950/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!topicInput.trim() || isGenerating}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-all disabled:opacity-40 shadow-md hover:brightness-110 shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing 3D...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Generate 3D Model</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Topic Chips */}
          <div className="hidden xl:flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 mr-1">Try 3D:</span>
            {QUICK_3D_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                disabled={isGenerating}
                onClick={() => handleQuickTopic(topic)}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200 transition-all disabled:opacity-40"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 3D Viewport Area */}
      <div className="relative flex-1 w-full min-h-[320px] bg-slate-950">
        {/* Loading Overlay when Gemini 4 Argon is generating a new 3D structure */}
        {isGenerating && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-md">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/20">
              <Box className="h-8 w-8 text-cyan-300 animate-bounce" />
            </div>
            <p className="mt-3 text-sm font-bold text-white">
              Synthesizing 3D Scene with Gemini 4 Argon (gemini-4-argon)...
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Computing spatial node topology, directional vectors, and animated data packets
            </p>
          </div>
        )}

        {rawHtmlMode ? (
          <iframe
            title={`Argon 3D Raw View - ${scene.title}`}
            srcDoc={rawHtmlDoc}
            sandbox="allow-scripts"
            className="h-full w-full border-0 min-h-[320px]"
          />
        ) : (
          <Canvas
            key={cameraResetKey}
            camera={{
              position: scene.cameraPosition || [0, 2.6, 7.8],
              fov: 48,
            }}
            onPointerMissed={() => setSelectedNode(null)}
            className="h-full w-full"
          >
            <color attach="background" args={[scene.backgroundColor || '#050814']} />
            <fog attach="fog" args={[scene.backgroundColor || '#050814', 12, 32]} />

            {/* Studio Lighting */}
            <ambientLight intensity={0.75} />
            <directionalLight position={[10, 14, 10]} intensity={1.45} />
            <pointLight position={[-10, -6, -8]} intensity={0.9} color={accentColor} />
            <pointLight position={[0, 8, -10]} intensity={0.6} color="#a855f7" />

            {/* Deep Space Starfield & Reference Grid */}
            <Stars radius={55} depth={35} count={1600} factor={3} saturation={0.6} fade speed={1.2} />
            <gridHelper
              args={[24, 24, accentColor, '#1e293b']}
              position={[0, -3.2, 0]}
            />

            {/* Scene Nodes */}
            <Float speed={1.1} rotationIntensity={0.05} floatIntensity={0.12}>
              <group>
                {nodes.map((node, index) => (
                  <AnimatedNodeMesh
                    key={node.id}
                    node={node}
                    index={index}
                    globalWireframe={globalWireframe}
                    showLabels={showLabels}
                    isSelected={selectedNode?.id === node.id}
                    accentColor={accentColor}
                    onSelect={(clickedNode) => setSelectedNode(clickedNode)}
                  />
                ))}

                {/* Connections & Animated Data Packets */}
                {connections.map((conn, index) => {
                  const fromNode = nodeMap.get(conn.fromId);
                  const toNode = nodeMap.get(conn.toId);
                  if (!fromNode || !toNode) return null;
                  return (
                    <ConnectionBeam
                      key={`${conn.fromId}-${conn.toId}-${index}`}
                      connection={conn}
                      fromNode={fromNode}
                      toNode={toNode}
                      index={index}
                      showLabels={showLabels}
                      accentColor={accentColor}
                    />
                  );
                })}
              </group>
            </Float>

            <OrbitControls
              makeDefault
              autoRotate={autoRotate}
              autoRotateSpeed={1.1}
              enableDamping
              dampingFactor={0.06}
              minDistance={2.5}
              maxDistance={22}
            />
          </Canvas>
        )}

        {/* Concept Summary HUD (Bottom Left) */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-md rounded-xl border border-white/10 bg-slate-950/80 p-3 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300">
            <Layers className="h-3.5 w-3.5" />
            <span>3D Architecture Overview</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">{scene.conceptSummary}</p>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {scene.interactiveControlsHint ||
              '🖱️ Drag to orbit 360° · Scroll to zoom · Click any 3D node to inspect its tooltip & coordinates'}
          </p>
        </div>

        {/* Selected Node Inspector Overlay Card (Bottom Right) */}
        {selectedNode && (
          <div className="absolute bottom-3 right-3 z-20 w-80 rounded-xl border border-cyan-400/40 bg-slate-900/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: selectedNode.color || accentColor,
                    boxShadow: `0 0 10px ${selectedNode.color || accentColor}`,
                  }}
                />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {selectedNode.label || selectedNode.id}
                  </h4>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                    Shape: {selectedNode.shape} · Anim: {selectedNode.animation || 'none'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-200 bg-slate-950/70 rounded-lg p-2.5 border border-white/10">
              {selectedNode.tooltip ||
                `${selectedNode.label || selectedNode.id} is a core component of this interactive 3D concept simulation.`}
            </p>

            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>
                XYZ: [{selectedNode.position.map((n) => Number(n).toFixed(1)).join(', ')}]
              </span>
              <span>
                Scale: [{selectedNode.scale.map((n) => Number(n).toFixed(1)).join('×')}]
              </span>
            </div>
          </div>
        )}

        {/* Quick Node Selector Pills (Top Left inside Canvas) */}
        {!rawHtmlMode && nodes.length > 0 && (
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 max-w-[75%]">
            {nodes.slice(0, 6).map((node) => {
              const active = selectedNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNode(active ? null : node)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-all backdrop-blur-md border ${
                    active
                      ? 'bg-cyan-500/25 text-white border-cyan-400/60 shadow-sm'
                      : 'bg-slate-950/65 text-slate-300 border-white/10 hover:bg-slate-900/90 hover:text-white'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: node.color || accentColor }}
                  />
                  <span className="truncate max-w-[110px]">{node.label || node.id}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Argon3DViewer;
