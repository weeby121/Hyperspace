import React, { useEffect, useRef, useState } from 'react';
import { signInWithPopup, signInAnonymously } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { ShieldCheck, Zap, Users, ArrowRight, Layers, Sparkles } from 'lucide-react';
import Header from '../components/header';

export default function Login() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [showLoginCard, setShowLoginCard] = useState(false);
  
  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); navigate('/'); } 
    catch (error) { console.error("Login Failed:", error); }
  };

  const handleGuestLogin = async () => {
    try { await signInAnonymously(auth); navigate('/'); } 
    catch (error) { console.error("Guest Login Failed:", error); }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617'); 
    scene.fog = new THREE.FogExp2('#020617', 0.02);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 8, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0x3b82f6, 0x000000, 0.8);
    scene.add(hemiLight);
    const spotLight = new THREE.SpotLight(0x60a5fa, 50); 
    spotLight.position.set(10, 20, 10);
    spotLight.castShadow = true;
    scene.add(spotLight);

    const gridSize = 45; 
    const count = gridSize * gridSize;
    const geometry = new THREE.BoxGeometry(0.8, 3, 0.8); 
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3b82f6, roughness: 0.2, metalness: 0.6,
        emissive: 0x2563eb, emissiveIntensity: 0.5 
    });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh);

    const dummy = new THREE.Object3D();
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      let i = 0;
      for (let x = 0; x < gridSize; x++) {
          for (let z = 0; z < gridSize; z++) {
              const dist = Math.sqrt((x-20)*(x-20) + (z-20)*(z-20));
              const y = Math.sin(dist * 0.2 - time * 1.5) * 1.5 + Math.sin(x * 0.3 + time) * 0.5;
              dummy.position.set(x - gridSize / 2, y - 6, z - gridSize / 2); // LOWERED THE WAVES (y-6)
              dummy.scale.y = 1 + (y * 0.4); 
              dummy.updateMatrix();
              mesh.setMatrixAt(i++, dummy.matrix);
          }
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.rotation.y = time * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        if (containerRef.current) containerRef.current.innerHTML = '';
        renderer.dispose();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020617] overflow-hidden font-sans selection:bg-blue-500/30">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      {/* Darker overlay to make text pop */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 via-transparent to-[#020617] z-0 pointer-events-none" />

      <Header onLoginClick={() => setShowLoginCard(true)} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {!showLoginCard ? (
            <div className="text-center max-w-4xl animate-fade-in-up">
                {/* Floating Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-sm font-semibold mb-8 backdrop-blur-md shadow-lg">
                    <Sparkles size={16} />
                    <span>Real-time 3D Collaboration</span>
                </div>
                
                {/* Main Title - Brighter Gradient & Shadow */}
                <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight leading-tight drop-shadow-2xl">
                    Think in <br/>
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent filter drop-shadow-lg">
                        Three Dimensions
                    </span>
                </h1>
                
                {/* Subtitle - More readable color */}
                <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                    Escape the flatland of 2D whiteboards. Design complex systems, architectures, and ideas in a living, breathing 3D workspace.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                        onClick={() => setShowLoginCard(true)}
                        className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-blue-500/25 shadow-2xl transition-all hover:scale-105 ring-1 ring-blue-400/20"
                    >
                        Start Creating Free
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                        onClick={() => navigate('/about')}
                        className="flex items-center justify-center gap-2 bg-[#0f172a]/80 hover:bg-[#1e293b] text-white border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg backdrop-blur-md transition-all shadow-lg"
                    >
                        Learn More
                    </button>
                </div>
            </div>
        ) : (
            // Login Card (Same as before)
            <div className="w-full max-w-md backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-fade-in-up">
                <div className="p-10 pb-6 text-center relative">
                    <button onClick={() => setShowLoginCard(false)} className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors">
                        <ArrowRight size={20} className="rotate-180" />
                    </button>
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-6">
                        <Layers className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400 text-sm">Sign in to access your universes</p>
                </div>
                <div className="p-8 pt-2 space-y-4">
                    <button onClick={handleGoogleLogin} className="w-full flex items-center justify-between bg-white hover:bg-slate-50 text-slate-900 py-4 px-6 rounded-xl transition-all font-bold">
                        <div className="flex items-center gap-3">
                             <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 4.66c1.61 0 3.06.55 4.21 1.64l3.16-3.16C17.45 1.19 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                             <span>Sign in with Google</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400" />
                    </button>
                    <button onClick={handleGuestLogin} className="w-full py-3 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wide">
                        Continue as Guest
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}