
import React, { useEffect, useRef } from 'react';
import { LogEntry } from './types';

const Console: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1 bg-white"
    >
      {logs.length === 0 && (
        <div className="text-gray-300 italic py-4 text-center">Sin actividad en el puerto serie</div>
      )}
      {logs.map((log, i) => (
        <div key={i} className="flex gap-4 px-2 py-1 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
          <span className="text-gray-400 shrink-0 w-16">{log.timestamp}</span>
          <span className={`font-bold shrink-0 w-8 ${
            log.type === 'tx' ? 'text-blue-500' : 
            log.type === 'rx' ? 'text-green-600' : 
            log.type === 'error' ? 'text-red-500' : 'text-gray-400'
          }`}>
            {log.type === 'tx' ? 'OUT' : log.type === 'rx' ? 'IN' : 'SYS'}
          </span>
          <span className={`${
            log.type === 'error' ? 'text-red-600 font-semibold' : 'text-gray-600'
          }`}>
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Console;
