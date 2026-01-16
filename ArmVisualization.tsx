
import React from 'react';
import { ArmState } from './types';

const ArmVisualization: React.FC<{ state: ArmState }> = ({ state }) => {
  // Dimensiones del lienzo virtual
  const width = 600;
  const height = 400; // Reducido para ajustarse mejor a contenedores rectangulares
  
  // Punto de origen (Base del brazo) - Centrado horizontalmente y cerca del fondo
  const cx = width / 2;
  const cy = height - 60; 

  // Longitudes de los segmentos (ajustadas para el nuevo tamaño)
  const L1 = 100; // Hombro
  const L2 = 80;  // Codo
  const L3 = 50;  // Muñeca

  // Conversión de ángulos a Radianes
  // El firmware usa 0-180. Ajustamos para que 90 sea la vertical.
  const radB = (state.b - 90) * (Math.PI / 180);
  const radC = (state.c - 90) * (Math.PI / 180) + radB;
  const radD = (state.d - 90) * (Math.PI / 180) + radC;

  // Cálculo de posiciones cinemáticas
  const x1 = cx + L1 * Math.sin(radB);
  const y1 = cy - L1 * Math.cos(radB);

  const x2 = x1 + L2 * Math.sin(radC);
  const y2 = y1 - L2 * Math.cos(radC);

  const x3 = x2 + L3 * Math.sin(radD);
  const y3 = y2 - L3 * Math.cos(radD);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="max-w-full max-h-full w-auto h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Guía de suelo minimalista */}
        <line x1="50" y1={cy} x2={width - 50} y2={cy} stroke="#f1f5f9" strokeWidth="4" strokeLinecap="round" />
        <line x1="150" y1={cy} x2={width - 150} y2={cy} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        
        {/* Base del brazo */}
        <rect x={cx - 30} y={cy} width="60" height="12" fill="#94a3b8" rx="2" />
        <path d={`M ${cx-20} ${cy} L ${cx-10} ${cy-15} L ${cx+10} ${cy-15} L ${cx+20} ${cy} Z`} fill="#64748b" />

        {/* Eslabones (Segmentos) */}
        <g strokeLinecap="round">
          {/* Segmento 1: Hombro a Codo */}
          <line x1={cx} y1={cy - 5} x2={x1} y2={y1} stroke="#334155" strokeWidth="12" />
          {/* Segmento 2: Codo a Muñeca */}
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#475569" strokeWidth="8" />
          {/* Segmento 3: Muñeca a Pinza */}
          <line x1={x2} y1={y2} x2={x3} y2={y3} stroke="#64748b" strokeWidth="4" />
        </g>

        {/* Articulaciones (Puntos de giro) */}
        <circle cx={cx} cy={cy - 5} r="7" fill="white" stroke="#334155" strokeWidth="2" />
        <circle cx={x1} cy={y1} r="5" fill="white" stroke="#475569" strokeWidth="2" />
        <circle cx={x2} cy={y2} r="4" fill="white" stroke="#64748b" strokeWidth="2" />
        
        {/* Efector final (Imán) */}
        <g transform={`translate(${x3}, ${y3}) rotate(${state.d - 90})`}>
          <rect 
            x="-10" y="0" width="20" height="14" rx="1" 
            fill={state.iman ? "#3b82f6" : "#f8fafc"} 
            stroke={state.iman ? "#2563eb" : "#cbd5e1"} 
            strokeWidth="2"
          />
          {state.iman && (
             <line x1="-6" y1="18" x2="6" y2="18" stroke="#3b82f6" strokeWidth="2" strokeDasharray="2 2" />
          )}
        </g>
      </svg>
    </div>
  );
};

export default ArmVisualization;
