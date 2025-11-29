import React from 'react';
import Header from '../components/header';

export default function About() {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans">
      <Header />
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          About HyperSpace
        </h1>
        <div className="space-y-6 text-lg leading-relaxed">
          <p>
            HyperSpace was born from a simple frustration: 2D whiteboards are flat, boring, and disconnected from the complex systems we try to design.
          </p>
          <p>
            We believe that software architecture is inherently multi-dimensional. Databases live "behind" APIs. Services sit "on top" of infrastructure. Why design them on a flat piece of paper?
          </p>
          <p>
            HyperSpace combines the ease of a whiteboard with the depth of a 3D engine, powered by real-time collaboration technology that lets teams inhabit the same digital space, no matter where they are physically located.
          </p>
        </div>
      </div>
    </div>
  );
}