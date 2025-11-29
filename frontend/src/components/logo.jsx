import React from 'react';

export default function Logo({ className = "w-7 h-7", color = "text-blue-500" }) {
  return (
    <svg 
      viewBox="0 0 110 110" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer Hexagon (Cube Outline) */}
      <path 
        d="M50 5 L93.3 30 V80 L50 105 L6.7 80 V30 L50 5Z" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinejoin="round"
        className="opacity-100"
      />
      
      {/* Inner Cube (The Tesseract Core) */}
      <path 
        d="M50 25 L75 40 V70 L50 85 L25 70 V40 L50 25Z" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinejoin="round"
        className="opacity-80"
      />
      
      {/* Connecting Lines (Hyper-dimensional links) */}
      <path d="M50 5 V25" stroke="currentColor" strokeWidth="4" className="opacity-50"/>
      <path d="M93.3 30 L75 40" stroke="currentColor" strokeWidth="4" className="opacity-50"/>
      <path d="M93.3 80 L75 70" stroke="currentColor" strokeWidth="4" className="opacity-50"/>
      <path d="M50 105 V85" stroke="currentColor" strokeWidth="4" className="opacity-50"/>
      <path d="M6.7 80 L25 70" stroke="currentColor" strokeWidth="4" className="opacity-50"/>
      <path d="M6.7 30 L25 40" stroke="currentColor" strokeWidth="4" className="opacity-50"/>
      
      {/* Center Glow (Optional) */}
      <circle cx="50" cy="55" r="8" fill="currentColor" className="animate-pulse" />
    </svg>
  );
}