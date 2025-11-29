import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { useBoardData } from '../hooks/UseBoardData';
import BoardHeader from '../components/board/BoardHeader';
import BoardToolbar from '../components/board/BoardToolbar';
import ObjectExplorer from '../components/board/ObjectEplorer'; // <--- NEW IMPORT
import { COLORS } from '../constants/colors';

export default function Board({ user }) {
  const { boardId } = useParams();
  const containerRef = useRef(null);
  
  // UI State
  const [activeTool, setActiveTool] = useState('move'); 
  const [color, setColor] = useState(COLORS[0]);
  const [selectedId, setSelectedId] = useState(null);
  const [connectStartId, setConnectStartId] = useState(null);

  // Data Hook
  const { 
      elements, cursors, 
      addElement, updateElementPosition, deleteElement, updateMyCursor, 
      undo, redo 
  } = useBoardData(boardId, user);
  
  const stateRef = useRef({ activeTool: 'move', color: COLORS[0], connectStartId: null });
  useEffect(() => { stateRef.current = { activeTool, color, connectStartId }; }, [activeTool, color, connectStartId]);

  // Three.js Refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null); 
  const meshMap = useRef(new Map());
  const cursorMap = useRef(new Map());
  const connectionsRef = useRef([]); 
  
  // Interaction Refs
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []); 
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef(new THREE.Vector3());
  const dragStartPosRaw = useRef(new THREE.Vector3());
  const dragObjectRef = useRef(null);
  const currentLineRef = useRef(null); 
  const cursorMeshRef = useRef(null);
  
  const keysPressed = useRef({});

  // ========================================================================
  // 1. Three.js Initialization (With Stars!)
  // ========================================================================
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f19'); // Darker, space-like blue
    scene.fog = new THREE.FogExp2('#0b0f19', 0.02);
    sceneRef.current = scene;

    // --- NEW: Lively Starfield ---
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 100; // Spread across 100 units
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8});
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    // -----------------------------

    // Grid
    const gridHelper = new THREE.GridHelper(100, 100, '#1e293b', '#0f172a');
    gridHelper.position.y = -0.01; 
    scene.add(gridHelper);

    // Floor (Shadow Receiver)
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02; 
    floor.receiveShadow = true; 
    scene.add(floor);

    // Ghost Cursor
    const cursorGeo = new THREE.BoxGeometry(1, 0.1, 1);
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    cursorMesh.visible = false;
    scene.add(cursorMesh);
    cursorMeshRef.current = cursorMesh;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.position = 'absolute';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(labelRenderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI; // Free look
    controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
    controls.touches = { ONE: THREE.TOUCH.DOLLY_PAN, TWO: THREE.TOUCH.ROTATE };
    controlsRef.current = controls;

    // --- Listeners ---
    const getRayPlaneIntersection = (clientX, clientY) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x, y }, camera);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        return target;
    };
    
    const getIntersects = (clientX, clientY, objects) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x, y }, camera);
        return raycaster.intersectObjects(objects, false);
    };

    const onPointerDown = async (e) => {
        if (e.button !== 0) return;
        const point = getRayPlaneIntersection(e.clientX, e.clientY);
        
        // Eraser Click Logic
        if (stateRef.current.activeTool === 'eraser') {
             isDraggingRef.current = true;
             const interactables = Array.from(meshMap.current.values()).filter(o => o.userData.isInteractable);
             const hits = getIntersects(e.clientX, e.clientY, interactables);
             if (hits.length > 0) {
                 const id = hits[0].object.userData.id;
                 sceneRef.current.remove(hits[0].object);
                 meshMap.current.delete(id);
                 deleteElement(id, { id, type: 'unknown' });
             }
             return; // Stop processing other tools
        }

        if (!point) return;
        const { activeTool, color, connectStartId } = stateRef.current;

        if (activeTool === 'cube') {
            addElement({ type: 'cube', pos: { x: Math.round(point.x), y: 0.5, z: Math.round(point.z) }, color });
        } 
        else if (activeTool === 'database') {
            addElement({ type: 'database', pos: { x: Math.round(point.x), y: 0.75, z: Math.round(point.z) }, color });
        }
        else if (activeTool === 'text') {
            const text = prompt("Enter note text:", "Note");
            if (text) addElement({ type: 'note', pos: { x: point.x, y: 0.5, z: point.z }, text, color: '#F59E0B' });
        }
        else if (activeTool === 'pen') {
            isDraggingRef.current = true;
            currentLineRef.current = { points: [{ x: point.x, y: 0.02, z: point.z }], color: color };
        }
        else if (activeTool === 'connect') {
             const interactables = Array.from(meshMap.current.values()).filter(o => o.userData.isInteractable);
             const hits = getIntersects(e.clientX, e.clientY, interactables);
             if (hits.length > 0) {
                 const hitId = hits[0].object.userData.id;
                 if (connectStartId === null) setConnectStartId(hitId);
                 else {
                     if (hitId !== connectStartId) addElement({ type: 'connection', from: connectStartId, to: hitId, color: '#94a3b8' });
                     setConnectStartId(null);
                 }
             } else setConnectStartId(null);
        }
        else if (activeTool === 'move') {
            const interactables = Array.from(meshMap.current.values()).filter(o => o.userData.isInteractable);
            const hits = getIntersects(e.clientX, e.clientY, interactables);
            if (hits.length > 0) {
                const hit = hits[0];
                setSelectedId(hit.object.userData.id);
                isDraggingRef.current = true;
                dragObjectRef.current = hit.object;
                dragStartPosRaw.current.copy(hit.object.position);
                dragStartRef.current.copy(point).sub(hit.object.position);
            } else {
                setSelectedId(null);
            }
        }
    };

    const onPointerMove = (e) => {
        const point = getRayPlaneIntersection(e.clientX, e.clientY);
        
        // Eraser Drag Logic
        if (stateRef.current.activeTool === 'eraser' && isDraggingRef.current) {
            const interactables = Array.from(meshMap.current.values()).filter(o => o.userData.isInteractable);
            const hits = getIntersects(e.clientX, e.clientY, interactables);
            if (hits.length > 0) {
                 const id = hits[0].object.userData.id;
                 sceneRef.current.remove(hits[0].object);
                 meshMap.current.delete(id);
                 deleteElement(id, { id, type: 'unknown' });
            }
        }

        if (point) {
            cursorMeshRef.current.visible = stateRef.current.activeTool !== 'eraser'; // Hide cursor for eraser
            if (stateRef.current.activeTool === 'cube' || stateRef.current.activeTool === 'database') {
                cursorMeshRef.current.position.set(Math.round(point.x), 0.05, Math.round(point.z));
            } else {
                cursorMeshRef.current.position.set(point.x, 0.05, point.z);
            }
            updateMyCursor({ x: point.x, z: point.z });
        } else {
            cursorMeshRef.current.visible = false;
        }

        if (!isDraggingRef.current || !point) return;

        if (stateRef.current.activeTool === 'move' && dragObjectRef.current) {
            const newPos = new THREE.Vector3().copy(point).sub(dragStartRef.current);
            newPos.y = dragObjectRef.current.position.y;
            dragObjectRef.current.position.copy(newPos);
        }

        if (stateRef.current.activeTool === 'pen' && currentLineRef.current) {
            const newPoint = { x: point.x, y: 0.02, z: point.z };
            currentLineRef.current.points.push(newPoint);
            if (!currentLineRef.current.mesh) {
                const geo = new THREE.BufferGeometry();
                const mat = new THREE.LineBasicMaterial({ color: stateRef.current.color });
                const mesh = new THREE.Line(geo, mat);
                mesh.raycast = () => {}; 
                sceneRef.current.add(mesh);
                currentLineRef.current.mesh = mesh;
            }
            const points = currentLineRef.current.points;
            const positions = new Float32Array(points.length * 3);
            points.forEach((p, i) => { positions[i*3] = p.x; positions[i*3+1] = p.y; positions[i*3+2] = p.z; });
            currentLineRef.current.mesh.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        }
    };

    const onPointerUp = async () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        
        if (stateRef.current.activeTool === 'pen' && currentLineRef.current) {
            if (currentLineRef.current.mesh) {
                sceneRef.current.remove(currentLineRef.current.mesh);
                currentLineRef.current.mesh.geometry.dispose();
            }
            addElement({ type: 'line', points: currentLineRef.current.points, color: currentLineRef.current.color });
            currentLineRef.current = null;
        }

        if (stateRef.current.activeTool === 'move' && dragObjectRef.current) {
            const obj = dragObjectRef.current;
            const oldPos = { x: dragStartPosRaw.current.x, y: dragStartPosRaw.current.y, z: dragStartPosRaw.current.z };
            updateElementPosition(
                obj.userData.id, 
                { x: obj.position.x, y: obj.position.y, z: obj.position.z },
                oldPos
            );
            dragObjectRef.current = null;
        }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // Slow rotation for stars to make it feel alive
      stars.rotation.y += 0.0002; 

      if (keysPressed.current['w'] || keysPressed.current['a'] || keysPressed.current['s'] || keysPressed.current['d']) {
          const speed = 0.5;
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          const right = new THREE.Vector3();
          right.crossVectors(forward, camera.up).normalize();
          const dir = new THREE.Vector3();

          if (keysPressed.current['w']) dir.addScaledVector(forward, speed);
          if (keysPressed.current['s']) dir.addScaledVector(forward, -speed);
          if (keysPressed.current['d']) dir.addScaledVector(right, speed);
          if (keysPressed.current['a']) dir.addScaledVector(right, -speed);

          camera.position.add(dir);
          controls.target.add(dir);
      }

      connectionsRef.current.forEach(conn => {
          const fromMesh = meshMap.current.get(conn.from);
          const toMesh = meshMap.current.get(conn.to);
          const lineMesh = meshMap.current.get(conn.id);
          if (fromMesh && toMesh && lineMesh) {
              const pos = lineMesh.geometry.attributes.position.array;
              pos[0] = fromMesh.position.x; pos[1] = fromMesh.position.y; pos[2] = fromMesh.position.z;
              pos[3] = toMesh.position.x; pos[4] = toMesh.position.y; pos[5] = toMesh.position.z;
              lineMesh.geometry.attributes.position.needsUpdate = true;
          }
      });
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      if (containerRef.current) containerRef.current.innerHTML = '';
      renderer.dispose();
    };
  }, []);

  // --- Keyboard Listeners ---
  useEffect(() => {
      const handleKeyDown = (e) => {
          const key = e.key.toLowerCase();
          if (['w', 'a', 's', 'd'].includes(key)) keysPressed.current[key] = true;
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
      };
      const handleKeyUp = (e) => {
          const key = e.key.toLowerCase();
          if (['w', 'a', 's', 'd'].includes(key)) keysPressed.current[key] = false;
      };
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
      };
  }, [undo, redo]);

  // --- Scene Sync ---
  useEffect(() => {
    if (!sceneRef.current) return;
    connectionsRef.current = elements.filter(e => e.type === 'connection');
    const currentIds = new Set(elements.map(e => e.id));
    meshMap.current.forEach((obj, id) => {
      if (!currentIds.has(id)) {
        sceneRef.current.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.userData.label) obj.remove(obj.userData.label);
        meshMap.current.delete(id);
      }
    });

    elements.forEach(data => {
      let obj = meshMap.current.get(data.id);
      if (!obj) {
        if (data.type === 'cube') {
          obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'cube' };
          obj.castShadow = true; obj.receiveShadow = true;
          sceneRef.current.add(obj);
        } else if (data.type === 'database') {
          obj = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'database' };
          obj.castShadow = true; obj.receiveShadow = true;
          sceneRef.current.add(obj);
        } else if (data.type === 'connection') {
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
          obj = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: data.color, linewidth: 2 }));
          obj.userData = { id: data.id, type: 'connection' };
          sceneRef.current.add(obj);
        } else if (data.type === 'line') {
           const geo = new THREE.BufferGeometry();
           const pos = new Float32Array(data.points.length * 3);
           data.points.forEach((p,i)=>{pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z});
           geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
           obj = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: data.color }));
           obj.userData = { id: data.id, type: 'line' };
           sceneRef.current.add(obj);
        } else if (data.type === 'note') {
           obj = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
           obj.userData = { isInteractable: true, id: data.id, type: 'note' };
           const div = document.createElement('div');
           div.className = 'bg-yellow-200 text-slate-900 p-2 rounded shadow-lg text-sm font-mono max-w-[150px] break-words';
           div.textContent = data.text;
           const label = new CSS2DObject(div);
           label.position.set(0, 0.5, 0);
           obj.add(label);
           obj.userData.label = label;
           sceneRef.current.add(obj);
        }
        meshMap.current.set(data.id, obj);
      }
      
      if (obj && data.type !== 'line' && data.type !== 'connection') {
        obj.position.set(data.pos.x, data.pos.y, data.pos.z);
        if(obj.material && obj.material.color) obj.material.color.set(data.color);
        if (data.type === 'note' && obj.userData.label) obj.userData.label.element.textContent = data.text;
        
        if (obj.material) {
            let emissive = 0x000000;
            if (selectedId === data.id) emissive = 0x333333;
            if (connectStartId === data.id) emissive = 0x004400; 
            obj.material.emissive = new THREE.Color(emissive);
        }
      }
    });
  }, [elements, selectedId, connectStartId]);

  useEffect(() => {
      if (!sceneRef.current) return;
      const activeIds = new Set(cursors.map(c => c.id));
      cursorMap.current.forEach((mesh, id) => {
          if (!activeIds.has(id)) {
              sceneRef.current.remove(mesh);
              cursorMap.current.delete(id);
          }
      });
      cursors.forEach(cursorData => {
          let mesh = cursorMap.current.get(cursorData.id);
          if (!mesh) {
              const geo = new THREE.ConeGeometry(0.2, 0.5, 8);
              geo.rotateX(Math.PI);
              const mat = new THREE.MeshBasicMaterial({ color: cursorData.color || '#ff0000' });
              mesh = new THREE.Mesh(geo, mat);
              sceneRef.current.add(mesh);
              cursorMap.current.set(cursorData.id, mesh);
          }
          mesh.position.set(cursorData.x, 0.5, cursorData.z);
      });
  }, [cursors]);

  const handleDeleteWrapper = () => {
      if (selectedId) {
          const obj = elements.find(e => e.id === selectedId);
          deleteElement(selectedId, obj); 
          setSelectedId(null);
      }
  };
  const handleCopyId = () => navigator.clipboard.writeText(window.location.href);

  // --- NEW: Flight Navigation Logic ---
  const handleNavigate = (item) => {
      setSelectedId(item.id);
      
      // Calculate target position
      const targetPos = new THREE.Vector3(item.pos.x, item.pos.y, item.pos.z);
      
      // Move controls target to object
      // (For MVP, we snap. For smoothness, we'd need a tween library, but keeping it dependency-light)
      controlsRef.current.target.copy(targetPos);
      
      // Move Camera to a nice offset
      cameraRef.current.position.set(targetPos.x + 5, targetPos.y + 5, targetPos.z + 5);
      
      controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 select-none">
      <div ref={containerRef} className="w-full h-full cursor-crosshair" onContextMenu={(e) => e.preventDefault()} />
      <BoardHeader onCopy={handleCopyId} />
      
      {/* NEW: Object Explorer */}
      <ObjectExplorer 
        elements={elements} 
        onNavigate={handleNavigate} 
        selectedId={selectedId} 
      />

      <BoardToolbar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        color={color} 
        setColor={setColor} 
        selectedId={selectedId} 
        onDelete={handleDeleteWrapper}
        connectStartId={connectStartId}
      />
    </div>
  );
}