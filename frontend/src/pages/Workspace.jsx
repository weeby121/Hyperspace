import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js'; 
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { ArrowLeft, Share2, Eye, Edit3, Copy, Check } from 'lucide-react';

import { useBoardData } from '../hooks/UseBoardData';
import BoardToolbar from '../components/board/BoardToolbar';
import ObjectExplorer from '../components/board/ObjectExplorer';
import { COLORS } from '../constants/colors';

export default function Board({ user }) {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  // UI State
  const [activeTool, setActiveTool] = useState('translate'); 
  const [color, setColor] = useState(COLORS[0]);
  const [selectedId, setSelectedId] = useState(null);
  const [connectStartId, setConnectStartId] = useState(null);
  const [mode, setMode] = useState('edit');
  const [copied, setCopied] = useState(false);

  // Data Hook
  const { 
      elements, cursors, 
      addElement, updateElementTransform, updateElementRotation, deleteElement, updateMyCursor, 
      undo, redo 
  } = useBoardData(boardId, user);
  
  const stateRef = useRef({ activeTool: 'translate', color: COLORS[0], connectStartId: null });
  useEffect(() => { stateRef.current = { activeTool, color, connectStartId }; }, [activeTool, color, connectStartId]);

  // Three.js Refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null); 
  const transformControlRef = useRef(null); 
  const meshMap = useRef(new Map());
  const cursorMap = useRef(new Map());
  const connectionsRef = useRef([]); 
  const fontRef = useRef(null); 
  const dragStartRotation = useRef(new THREE.Euler());
  const dragStartPosRaw = useRef(new THREE.Vector3());
  const dragStartRef = useRef(new THREE.Vector3());
  const dragObjectRef = useRef(null);
  
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const isDraggingRef = useRef(false);
  const currentLineRef = useRef(null); 
  const cursorMeshRef = useRef(null);
  const keysPressed = useRef({});

  // ... (Initialization - Unchanged) ...
  useEffect(() => {
    if (!containerRef.current) return;
    const loader = new FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => { fontRef.current = font; });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f19');
    scene.fog = new THREE.FogExp2('#0b0f19', 0.02);
    sceneRef.current = scene;

    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) starPos[i] = (Math.random() - 0.5) * 100;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8})));

    const gridHelper = new THREE.GridHelper(100, 100, '#1e293b', '#0f172a');
    gridHelper.position.y = -0.01; 
    scene.add(gridHelper);

    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02; 
    floor.receiveShadow = true; 
    scene.add(floor);

    const cursorGeo = new THREE.BoxGeometry(1, 0.1, 1);
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
    const cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    cursorMesh.visible = false;
    scene.add(cursorMesh);
    cursorMeshRef.current = cursorMesh;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(8, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.position = 'absolute';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = '2';
    containerRef.current.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI; 
    controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
    controls.touches = { ONE: THREE.TOUCH.DOLLY_PAN, TWO: THREE.TOUCH.ROTATE };
    controlsRef.current = controls;

    const transformControl = new TransformControls(camera, renderer.domElement);
    transformControl.setMode('translate'); 
    transformControl.addEventListener('dragging-changed', (event) => { controls.enabled = !event.value; });
    scene.add(transformControl.getHelper()); 
    transformControlRef.current = transformControl;

    const getRayPlaneIntersection = (clientX, clientY) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera({ x, y }, camera);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), target);
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
        
        if (stateRef.current.activeTool === 'eraser') {
             // Eraser Logic
             isDraggingRef.current = true;
             const interactables = Array.from(meshMap.current.values()).filter(o => o.userData.isInteractable);
             const hits = getIntersects(e.clientX, e.clientY, interactables);
             if (hits.length > 0) {
                 const id = hits[0].object.userData.id;
                 sceneRef.current.remove(hits[0].object);
                 meshMap.current.delete(id);
                 if (transformControlRef.current.object === hits[0].object) transformControlRef.current.detach();
                 deleteElement(id, { id, type: 'unknown' });
             }
             return;
        }

        if (!point) return;
        const { activeTool, color, connectStartId } = stateRef.current;

        if (activeTool === 'translate' || activeTool === 'rotate') {
            if (transformControlRef.current.axis) return; 
            const interactables = Array.from(meshMap.current.values()).filter(o => o.userData.isInteractable);
            const hits = getIntersects(e.clientX, e.clientY, interactables);
            if (hits.length > 0) {
                const hit = hits[0];
                setSelectedId(hit.object.userData.id);
                transformControlRef.current.detach();
                transformControlRef.current.attach(hit.object);
                isDraggingRef.current = true;
                dragObjectRef.current = hit.object;
                dragStartPosRaw.current.copy(hit.object.position);
                dragStartRef.current.copy(point).sub(hit.object.position);
            } else {
                setSelectedId(null);
                transformControlRef.current.detach();
            }
            return; 
        }

        // --- UPDATED CREATION LOGIC ---
        if (activeTool === 'cube') {
            addElement({ type: 'cube', pos: { x: Math.round(point.x), y: 0.5, z: Math.round(point.z) }, color });
        }
        else if (activeTool === 'sphere') {
            addElement({ type: 'sphere', pos: { x: Math.round(point.x), y: 0.5, z: Math.round(point.z) }, color });
        }
        else if (activeTool === 'cylinder') {
            addElement({ type: 'cylinder', pos: { x: Math.round(point.x), y: 0.5, z: Math.round(point.z) }, color });
        }
        else if (activeTool === 'cone') {
            addElement({ type: 'cone', pos: { x: Math.round(point.x), y: 0.5, z: Math.round(point.z) }, color });
        }
        else if (activeTool === 'torus') {
            addElement({ type: 'torus', pos: { x: Math.round(point.x), y: 0.2, z: Math.round(point.z) }, color });
        }
        else if (activeTool === 'database') {
            addElement({ type: 'database', pos: { x: Math.round(point.x), y: 0.75, z: Math.round(point.z) }, color });
        }
        else if (activeTool === 'text') {
            const text = prompt("Note Text:", "Note");
            if(text) addElement({ type: 'note', pos: { x: point.x, y: 0.5, z: point.z }, text, color: '#F59E0B' });
        }
        else if (activeTool === 'text3d') {
            const text = prompt("3D Title:", "System");
            if (text && fontRef.current) {
                const dx = cameraRef.current.position.x - point.x;
                const dz = cameraRef.current.position.z - point.z;
                const angle = Math.atan2(dx, dz);
                addElement({ type: 'text3d', pos: { x: point.x, y: 0.5, z: point.z }, text, color, rot: angle });
            }
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
    };

    // ... (Move/Up/Animate - Unchanged) ...
    const onPointerMove = (e) => {
        const point = getRayPlaneIntersection(e.clientX, e.clientY);
        if (stateRef.current.activeTool === 'eraser' && isDraggingRef.current) {
            const interactables = Array.from(meshMap.current.values()).filter(o => o.userData.isInteractable);
            const hits = getIntersects(e.clientX, e.clientY, interactables);
            if (hits.length > 0) {
                 const id = hits[0].object.userData.id;
                 sceneRef.current.remove(hits[0].object);
                 meshMap.current.delete(id);
                 if (transformControlRef.current.object === hits[0].object) transformControlRef.current.detach();
                 deleteElement(id, { id, type: 'unknown' });
            }
        }
        if (point) {
            const t = stateRef.current.activeTool;
            cursorMeshRef.current.visible = (t !== 'eraser' && t !== 'translate' && t !== 'rotate');
            if (['cube','sphere','cylinder','cone','database'].includes(t)) cursorMeshRef.current.position.set(Math.round(point.x), 0.05, Math.round(point.z));
            else cursorMeshRef.current.position.set(point.x, 0.05, point.z);
            updateMyCursor({ x: point.x, z: point.z });
        } else cursorMeshRef.current.visible = false;

        if (!isDraggingRef.current || !point) return;
        if (stateRef.current.activeTool === 'translate' && dragObjectRef.current) {
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
        if (stateRef.current.activeTool === 'translate' && dragObjectRef.current) {
            const obj = dragObjectRef.current;
            const oldPos = { x: dragStartPosRaw.current.x, y: dragStartPosRaw.current.y, z: dragStartPosRaw.current.z };
            updateElementTransform(obj.userData.id, { pos: { x: obj.position.x, y: obj.position.y, z: obj.position.z }, rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z } }, { pos: oldPos, rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z } });
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
      if (keysPressed.current['w'] || keysPressed.current['a'] || keysPressed.current['s'] || keysPressed.current['d']) {
          const speed = 0.5;
          const forward = new THREE.Vector3(); camera.getWorldDirection(forward);
          const right = new THREE.Vector3(); right.crossVectors(forward, camera.up).normalize();
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
        if (!containerRef.current) return;
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        labelRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
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

  // ... (Gizmo logic, Keyboard - Unchanged) ...
  useEffect(() => {
      const control = transformControlRef.current;
      if (!control) return;
      const callback = (event) => {
          if (!event.value) { 
              const obj = control.object;
              if (obj) {
                  const newPos = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
                  const newRot = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };
                  updateElementTransform(obj.userData.id, { pos: newPos, rotation: newRot }, { pos: dragStartTransform.current.pos, rotation: dragStartTransform.current.rot });
              }
          } else {
              const obj = control.object;
              if (obj) {
                  dragStartTransform.current.pos = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
                  dragStartTransform.current.rot = { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z };
              }
          }
      };
      control.addEventListener('dragging-changed', callback);
      return () => control.removeEventListener('dragging-changed', callback);
  }, [updateElementTransform]);

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

  useEffect(() => {
      if (transformControlRef.current) {
          if (activeTool === 'translate' || activeTool === 'rotate') {
              transformControlRef.current.setMode(activeTool);
          } else {
              transformControlRef.current.detach();
          }
      }
  }, [activeTool]);

  useEffect(() => {
    if (!sceneRef.current) return;
    connectionsRef.current = elements.filter(e => e.type === 'connection');
    const currentIds = new Set(elements.map(e => e.id));
    meshMap.current.forEach((obj, id) => {
      if (!currentIds.has(id)) {
        sceneRef.current.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.userData.label) obj.remove(obj.userData.label);
        if (transformControlRef.current && transformControlRef.current.object === obj) transformControlRef.current.detach();
        meshMap.current.delete(id);
      }
    });
    
    // --- UPDATED ELEMENT RENDERING ---
    elements.forEach(data => {
      let obj = meshMap.current.get(data.id);
      if (!obj) {
        if (data.type === 'cube') {
          obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'cube' };
          obj.castShadow = true; obj.receiveShadow = true; sceneRef.current.add(obj);
        } 
        // --- NEW SHAPES ---
        else if (data.type === 'sphere') {
          obj = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'sphere' };
          obj.castShadow = true; obj.receiveShadow = true; sceneRef.current.add(obj);
        }
        else if (data.type === 'cylinder') {
          obj = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'cylinder' };
          obj.castShadow = true; obj.receiveShadow = true; sceneRef.current.add(obj);
        }
        else if (data.type === 'cone') {
          obj = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 32), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'cone' };
          obj.castShadow = true; obj.receiveShadow = true; sceneRef.current.add(obj);
        }
        else if (data.type === 'torus') {
          // Torus needs to stand up or lie down? Usually lying down looks better for diagrams
          obj = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.15, 16, 100), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'torus' };
          obj.rotation.x = -Math.PI / 2; // Lie flat
          obj.castShadow = true; obj.receiveShadow = true; sceneRef.current.add(obj);
        }
        // ------------------
        else if (data.type === 'database') {
          obj = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.5, 32), new THREE.MeshStandardMaterial({ color: data.color }));
          obj.userData = { isInteractable: true, id: data.id, type: 'database' };
          obj.castShadow = true; obj.receiveShadow = true; sceneRef.current.add(obj);
        } else if (data.type === 'text3d') {
            if (fontRef.current) {
                const geo = new TextGeometry(data.text, { font: fontRef.current, size: 0.5, depth: 0.1, curveSegments: 12, bevelEnabled: false });
                geo.center(); 
                const mat = new THREE.MeshStandardMaterial({ color: data.color });
                obj = new THREE.Mesh(geo, mat);
                obj.userData = { isInteractable: true, id: data.id, type: 'text3d' };
                if (data.rot !== undefined) obj.rotation.y = data.rot;
                obj.castShadow = true; obj.receiveShadow = true; sceneRef.current.add(obj);
            }
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
        if (obj) meshMap.current.set(data.id, obj);
      }
      
      if (obj && data.type !== 'line' && data.type !== 'connection') {
        obj.position.set(data.pos.x, data.pos.y, data.pos.z);
        if(obj.material && obj.material.color) obj.material.color.set(data.color);
        if (data.type === 'note' && obj.userData.label) obj.userData.label.element.textContent = data.text;
        
        if (data.rotation) {
            obj.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        } else if (data.rot !== undefined && !data.rotation) {
            if(data.type === 'text3d') obj.rotation.y = data.rot;
        }

        if (obj.material) {
            let emissive = 0x000000;
            if (selectedId === data.id) emissive = 0x333333;
            if (connectStartId === data.id) emissive = 0x004400; 
            obj.material.emissive = new THREE.Color(emissive);
        }
      }
    });
  }, [elements, selectedId, connectStartId]);

  // ... (Remote Cursor & Render - Unchanged) ...
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
          transformControlRef.current.detach();
      }
  };
  const handleCopyId = () => {
      navigator.clipboard.writeText(boardId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };
  const handleNavigate = (item) => {
      setSelectedId(item.id);
      const targetPos = new THREE.Vector3(item.pos.x, item.pos.y, item.pos.z);
      controlsRef.current.target.copy(targetPos);
      cameraRef.current.position.set(targetPos.x + 5, targetPos.y + 5, targetPos.z + 5);
      controlsRef.current.update();
  };

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-300 font-sans overflow-hidden p-4 gap-4">
      <div className="flex-1 relative bg-slate-900/50 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col">
          <div ref={containerRef} className="absolute inset-0 cursor-crosshair" onContextMenu={(e) => e.preventDefault()} />
          <div className="absolute top-4 left-4 z-10 pointer-events-auto">
              <button onClick={() => navigate('/')} className="bg-slate-800/90 hover:bg-slate-700 text-white p-3 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2 backdrop-blur-md">
                <ArrowLeft size={18} /><span className="font-semibold text-sm hidden md:inline">Dashboard</span>
              </button>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
              <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full p-1 flex gap-1 shadow-2xl">
                  <button onClick={() => setMode('edit')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Edit3 size={12} /> Edit</button>
                  <button onClick={() => setMode('preview')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${mode === 'preview' ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Eye size={12} /> View</button>
              </div>
          </div>
      </div>
      <div className="w-80 flex flex-col gap-4">
          <div className="bg-[#0f172a] border border-slate-700/50 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Share Code</span>{copied && <span className="text-xs text-green-400 flex items-center gap-1 font-bold"><Check size={12}/> Copied</span>}</div>
              <div className="flex gap-2"><div className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 flex-1 truncate select-all">{boardId}</div><button onClick={handleCopyId} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20" title="Copy Link"><Share2 size={16} /></button></div>
          </div>
          <div className="flex-1 min-h-0"><ObjectExplorer elements={elements} onNavigate={handleNavigate} selectedId={selectedId} /></div>
          <BoardToolbar activeTool={activeTool} setActiveTool={(tool) => { setActiveTool(tool); if (tool !== 'translate' && tool !== 'rotate') { setSelectedId(null); if (transformControlRef.current) transformControlRef.current.detach(); } }} color={color} setColor={setColor} selectedId={selectedId} onDelete={handleDeleteWrapper} />
      </div>
    </div>
  );
}