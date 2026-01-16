
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Zap, 
  Settings, 
  Activity, 
  Box, 
  Power, 
  RefreshCcw, 
  Save, 
  Download, 
  Cpu,
  Terminal as TerminalIcon
} from 'lucide-react';
import { ArmState, LogEntry } from './types';
import ArmVisualization from './ArmVisualization';
import ControlPanel from './ControlPanel';
import Console from './Console';

const App: React.FC = () => {
  const [port, setPort] = useState<any | null>(null);
  const [writer, setWriter] = useState<WritableStreamDefaultWriter | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [armState, setArmState] = useState<ArmState>({
    a: 90,
    b: 90,
    c: 90,
    d: 90,
    iman: false,
    auto: false,
    obj: false,
  });

  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-49), entry]);
  }, []);

  const sendCommand = async (cmd: string) => {
    if (!writer) return;
    try {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(cmd + '\n'));
      addLog(cmd, 'tx');
    } catch (error) {
      addLog(`Error: ${error}`, 'error');
    }
  };

  const connectSerial = async () => {
    if (!("serial" in navigator)) {
      alert("La API Web Serial no es compatible con este navegador.");
      return;
    }

    try {
      const selectedPort = await (navigator as any).serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      
      const writerInstance = selectedPort.writable.getWriter();
      setPort(selectedPort);
      setWriter(writerInstance);
      setIsConnected(true);
      addLog("Conexión establecida", "info");

      readLoop(selectedPort);
    } catch (error) {
      addLog(`Error de conexión: ${error}`, "error");
    }
  };

  const disconnectSerial = async () => {
    if (readerRef.current) await readerRef.current.cancel();
    if (writer) {
      writer.releaseLock();
      await writer.close();
    }
    if (port) await port.close();
    
    setIsConnected(false);
    setPort(null);
    setWriter(null);
    addLog("Desconectado", "info");
  };

  const readLoop = async (selectedPort: any) => {
    const textDecoder = new TextDecoder();
    while (selectedPort.readable) {
      const reader = selectedPort.readable.getReader();
      readerRef.current = reader;
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += textDecoder.decode(value);
          const lines = buffer.split(/[\r\n]+/);
          buffer = lines.pop() || "";
          
          lines.forEach(line => {
            if (line.trim()) {
              addLog(line.trim(), 'rx');
              parseIncoming(line.trim());
            }
          });
        }
      } catch (error) {
        addLog(`Error de lectura: ${error}`, 'error');
      } finally {
        reader.releaseLock();
      }
    }
  };

  const parseIncoming = (line: string) => {
    if (line.includes("STATUS")) {
      const matches = line.match(/A=(\d+) B=(\d+) C=(\d+) D=(\d+) IMAN=(\d+) AUTO=(\d+) OBJ=(\d+)/);
      if (matches) {
        setArmState({
          a: parseInt(matches[1]),
          b: parseInt(matches[2]),
          c: parseInt(matches[3]),
          d: parseInt(matches[4]),
          iman: matches[5] === "1",
          auto: matches[6] === "1",
          obj: matches[7] === "1",
        });
      }
    } else if (line.includes("IMAN ON")) setArmState(p => ({ ...p, iman: true }));
    else if (line.includes("IMAN OFF")) setArmState(p => ({ ...p, iman: false }));
    else if (line.includes("MODO AUTO")) setArmState(p => ({ ...p, auto: true }));
    else if (line.includes("MODO MANUAL")) setArmState(p => ({ ...p, auto: false }));
  };

  useEffect(() => {
    let interval: any;
    if (isConnected) {
      interval = setInterval(() => sendCommand('T'), 5000);
    }
    return () => clearInterval(interval);
  }, [isConnected, writer]);

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 p-6 gap-6">
      {/* Sidebar - Panel de Control */}
      <aside className="w-80 flex flex-col gap-6 shrink-0">
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4 shadow-sm">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Cpu className="text-gray-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">RoboArm</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Control de Hardware</p>
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 overflow-y-auto space-y-8 shadow-sm">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Estado
              </label>
              <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isConnected ? "text-blue-600" : "text-gray-400"}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-blue-500" : "bg-gray-300"}`} />
                {isConnected ? "ACTIVO" : "OFFLINE"}
              </div>
            </div>
            
            <button 
              onClick={isConnected ? disconnectSerial : connectSerial}
              className={`w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-all border text-xs ${
                isConnected 
                  ? "bg-white border-gray-200 text-gray-600 hover:border-gray-300" 
                  : "bg-gray-900 border-gray-900 text-white hover:bg-gray-800 shadow-sm"
              }`}
            >
              <Power className="w-4 h-4" />
              {isConnected ? "Desconectar" : "Conectar Brazo"}
            </button>
          </section>

          <ControlPanel 
            state={armState} 
            onAngleChange={(motor, ang) => sendCommand(`${motor}${ang}`)}
            disabled={!isConnected}
          />

          <section className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Comandos
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => sendCommand(armState.iman ? 'J' : 'L')}
                disabled={!isConnected}
                className={`p-3 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-2 transition-colors ${
                  armState.iman 
                    ? "bg-blue-50 border-blue-100 text-blue-700" 
                    : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Box className="w-5 h-5" />
                <span>Imán {armState.iman ? 'Off' : 'On'}</span>
              </button>

              <button 
                onClick={() => sendCommand(armState.auto ? 'M0' : 'M1')}
                disabled={!isConnected}
                className={`p-3 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-2 transition-colors ${
                  armState.auto 
                    ? "bg-gray-100 border-gray-200 text-gray-800" 
                    : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Activity className="w-5 h-5" />
                <span>{armState.auto ? "Manual" : "Auto"}</span>
              </button>

              <button onClick={() => sendCommand('R')} disabled={!isConnected} className="p-3 rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 text-[11px] font-bold flex flex-col items-center gap-2">
                <RefreshCcw className="w-5 h-5" />
                <span>Reposo</span>
              </button>

              <button onClick={() => sendCommand('T')} disabled={!isConnected} className="p-3 rounded-lg border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 text-[11px] font-bold flex flex-col items-center gap-2">
                <Download className="w-5 h-5" />
                <span>Sync</span>
              </button>
            </div>

            {armState.auto && (
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Secuencias</p>
                <div className="flex gap-2">
                  <button onClick={() => sendCommand('S1')} className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 rounded text-[10px] font-bold hover:border-gray-300">Rutina 1</button>
                  <button onClick={() => sendCommand('S2')} className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 rounded text-[10px] font-bold hover:border-gray-300">Rutina 2</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => sendCommand('E1')} disabled={!isConnected} className="py-2 border border-gray-100 rounded text-[9px] font-bold text-gray-400 hover:bg-gray-50 uppercase tracking-tighter">
                <Save className="w-3 h-3 inline mr-1" /> Guardar
              </button>
              <button onClick={() => sendCommand('E0')} disabled={!isConnected} className="py-2 border border-gray-100 rounded text-[9px] font-bold text-gray-400 hover:bg-gray-50 uppercase tracking-tighter">
                <Download className="w-3 h-3 inline mr-1" /> Cargar
              </button>
            </div>
          </section>
        </div>
      </aside>

      {/* Main - Visualización y Consola */}
      <main className="flex-1 flex flex-col gap-6 min-w-0 h-full">
        <div className="flex-1 bg-white border border-gray-200 rounded-xl relative overflow-hidden shadow-sm flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Esquema Cinemático</h2>
              <p className="text-[10px] text-gray-400 font-medium">Proyección de ejes en tiempo real</p>
            </div>
            <div className="flex gap-2">
               {armState.obj && (
                 <div className="bg-green-50 text-green-600 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border border-green-100">
                   Sensor Detectado
                 </div>
               )}
               {armState.iman && (
                 <div className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border border-blue-100">
                   Magneto ON
                 </div>
               )}
            </div>
          </div>
          <div className="flex-1 relative min-h-0 w-full overflow-hidden">
            <ArmVisualization state={armState} />
          </div>
        </div>

        <div className="h-48 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm shrink-0">
          <div className="px-6 py-2 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-3.5 h-3.5" /> Log de Sistema
            </div>
            <span className="font-mono opacity-50">9600 bps</span>
          </div>
          <Console logs={logs} />
        </div>
      </main>
    </div>
  );
};

export default App;
