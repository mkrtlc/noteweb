import React, { useEffect, useRef, useCallback, useState } from 'react';
import ForceGraph3DLib from '3d-force-graph';
import * as THREE from 'three';
import { GraphData } from '../types';
import { RotateCcw, ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';

// Cast to constructor type
const ForceGraph3D = ForceGraph3DLib as unknown as new (element: HTMLElement) => any;

// Create a text sprite for node labels
function createTextSprite(text: string, isActive: boolean) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  // Set canvas size
  canvas.width = 256;
  canvas.height = 64;

  // Configure text style
  context.font = `${isActive ? 'bold ' : ''}24px Arial, sans-serif`;
  context.fillStyle = isActive ? '#0f172a' : '#64748b';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // Draw text
  context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 10);

  // Create sprite
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(30, 7.5, 1);

  return sprite;
}

interface GraphView3DProps {
  data: GraphData;
  onNodeClick: (nodeId: string) => void;
  activeNodeId?: string;
}

const GraphView3D: React.FC<GraphView3DProps> = React.memo(({ data, onNodeClick, activeNodeId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  // Wait for container to have dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const checkDimensions = () => {
      if (containerRef.current && containerRef.current.clientHeight > 0) {
        setIsReady(true);
      }
    };

    // Check immediately and after a short delay
    checkDimensions();
    const timer = setTimeout(checkDimensions, 100);

    return () => clearTimeout(timer);
  }, []);

  // Initialize 3D Graph
  useEffect(() => {
    if (!containerRef.current || !isReady || data.nodes.length === 0) return;

    const container = containerRef.current;

    // Clear any existing canvas
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 200;

    // Create graph instance
    const graph = new ForceGraph3D(container)
      .width(width)
      .height(height)
      .backgroundColor('#f8fafc') // slate-50
      .nodeThreeObject((node: any) => {
        // Create a group to hold sphere + label
        const group = new THREE.Group();

        // Create sphere
        const isActive = node.id === activeNodeId;
        const sphereGeometry = new THREE.SphereGeometry(isActive ? 5 : 3);
        const sphereMaterial = new THREE.MeshLambertMaterial({
          color: isActive ? '#0ea5e9' : '#64748b',
          transparent: true,
          opacity: 0.9
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphere);

        // Create text label
        const label = createTextSprite(node.title, isActive);
        label.position.set(0, isActive ? 8 : 6, 0); // Position above sphere
        group.add(label);

        return group;
      })
      .nodeLabel(() => '') // Disable default hover label since we show text always
      .linkColor(() => '#cbd5e1')
      .linkWidth(1)
      .linkOpacity(0.6)
      .onNodeClick((node: any) => {
        onNodeClick(node.id);
      })
      .onNodeHover((node: any) => {
        container.style.cursor = node ? 'pointer' : 'default';
      });

    // Configure forces for tighter clustering
    graph.d3Force('charge')?.strength(-30);
    graph.d3Force('link')?.distance(20);

    // Add centering force
    graph.d3Force('center')?.strength(0.3);

    // Load the data
    graph.graphData({
      nodes: data.nodes.map(n => ({ ...n })),
      links: data.links.map(l => ({ ...l }))
    });

    graphRef.current = graph;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && graphRef.current) {
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        if (newWidth > 0 && newHeight > 0) {
          graphRef.current.width(newWidth).height(newHeight);
        }
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      // Clean up Three.js resources
      if (graphRef.current) {
        graphRef.current._destructor?.();
        graphRef.current = null;
      }
      // Clear container
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [data, onNodeClick, isReady]);

  // Update node appearance when activeNodeId changes
  useEffect(() => {
    if (!graphRef.current) return;

    // Refresh node objects to update active state
    graphRef.current.nodeThreeObject((node: any) => {
      const group = new THREE.Group();

      const isActive = node.id === activeNodeId;
      const sphereGeometry = new THREE.SphereGeometry(isActive ? 5 : 3);
      const sphereMaterial = new THREE.MeshLambertMaterial({
        color: isActive ? '#0ea5e9' : '#64748b',
        transparent: true,
        opacity: 0.9
      });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      group.add(sphere);

      const label = createTextSprite(node.title, isActive);
      label.position.set(0, isActive ? 8 : 6, 0);
      group.add(label);

      return group;
    });
  }, [activeNodeId]);

  // Control handlers
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const camera = graphRef.current.camera();
      const distance = camera.position.length();
      graphRef.current.cameraPosition(
        { x: camera.position.x * 0.7, y: camera.position.y * 0.7, z: camera.position.z * 0.7 },
        null,
        500
      );
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const camera = graphRef.current.camera();
      graphRef.current.cameraPosition(
        { x: camera.position.x * 1.4, y: camera.position.y * 1.4, z: camera.position.z * 1.4 },
        null,
        500
      );
    }
  }, []);

  const handleReset = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.cameraPosition(
        { x: 0, y: 0, z: 300 },
        { x: 0, y: 0, z: 0 },
        1000
      );
    }
  }, []);

  const handleLocate = useCallback(() => {
    if (!graphRef.current || !activeNodeId) return;

    const graphData = graphRef.current.graphData();
    const node = graphData.nodes.find((n: any) => n.id === activeNodeId);

    if (node && node.x !== undefined) {
      graphRef.current.cameraPosition(
        { x: node.x, y: node.y, z: node.z + 100 },
        { x: node.x, y: node.y, z: node.z },
        1000
      );
    }
  }, [activeNodeId]);

  return (
    <div className="w-full h-full relative bg-slate-50 overflow-hidden group" style={{ minHeight: '200px' }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleLocate}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          title="Locate Active Note"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

export default GraphView3D;
