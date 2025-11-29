import React from 'react';
import Header from '../components/header';
import { Github, Linkedin, Mail } from 'lucide-react';

export default function Creator() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans">
      <Header />
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center">
        <div className="w-32 h-32 bg-slate-800 rounded-full mx-auto mb-8 border-4 border-blue-600 shadow-xl overflow-hidden relative">
            {/* Placeholder for your image */}
            <div className="absolute inset-0 flex items-center justify-center text-4xl">👨‍💻</div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-2">The Architect</h1>
        <p className="text-blue-400 font-medium mb-8">Full Stack DevOps Engineer</p>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          <p className="mb-6">
            Hi, I built HyperSpace to demonstrate the power of modern web technologies combined with rigorous DevOps practices. 
            I specialize in building scalable microservices, automating infrastructure, and creating immersive user experiences.
          </p>
          
          <div className="flex justify-center gap-6 mt-8">
            <a href="#" className="p-3 bg-slate-800 rounded-full hover:bg-white hover:text-black transition-all">
                <Github size={24} />
            </a>
            <a href="#" className="p-3 bg-slate-800 rounded-full hover:bg-[#0077b5] hover:text-white transition-all">
                <Linkedin size={24} />
            </a>
            <a href="#" className="p-3 bg-slate-800 rounded-full hover:bg-red-500 hover:text-white transition-all">
                <Mail size={24} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}