
export interface ArmState {
  a: number; // Base
  b: number; // Shoulder
  c: number; // Elbow
  d: number; // Wrist
  iman: boolean;
  auto: boolean;
  obj: boolean;
}

export type LogEntry = {
  timestamp: string;
  type: 'tx' | 'rx' | 'info' | 'error';
  message: string;
};

export enum MotorType {
  BASE = 'A',
  HOMBRO = 'B',
  CODO = 'C',
  MUNECA = 'D'
}
