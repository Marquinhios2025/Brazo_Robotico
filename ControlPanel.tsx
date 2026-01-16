
import React from 'react';
import { ArmState, MotorType } from './types';

interface ControlPanelProps {
  state: ArmState;
  onAngleChange: (motor: MotorType, angle: number) => void;
  disabled: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ state, onAngleChange, disabled }) => {
  const motors = [
    { id: MotorType.BASE, label: 'Base', value: state.a },
    { id: MotorType.HOMBRO, label: 'Hombro', value: state.b },
    { id: MotorType.CODO, label: 'Codo', value: state.c },
    { id: MotorType.MUNECA, label: 'Muñeca', value: state.d },
  ];

  return (
    <section className="space-y-6">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Ajuste Manual
      </label>
      <div className="space-y-6">
        {motors.map((m) => (
          <div key={m.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{m.label}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{m.value}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={m.value}
              disabled={disabled}
              onChange={(e) => onAngleChange(m.id, parseInt(e.target.value))}
              className="w-full disabled:opacity-50"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ControlPanel;
