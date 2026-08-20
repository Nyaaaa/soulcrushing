export interface NodePort {
  port: number;
  service: string;
  exploit: 'port_brute' | 'buffer_overflow' | 'cipher_bypass' | 'sentry_overload';
  status: 'open' | 'filtered' | 'closed';
  cracked?: boolean;
}

export interface NodeFile {
  name: string;
  content: string;
  size: string;
  encrypted?: boolean;
  requiredKey?: string;
  isTargetPayload?: boolean;
}

export interface NetworkNode {
  id: string;
  ip: string;
  hostname: string;
  type: 'gateway' | 'proxy' | 'database' | 'sentry';
  iceLevel: number; // 1 (Light), 2 (Moderate), 3 (Heavy/Black-ICE)
  description: string;
  ports: NodePort[];
  files: NodeFile[];
  discovered: boolean;
  breached: boolean;
  coordinates: { x: number; y: number }; // For visual topology graph
  connectedTo: string[]; // Connected node IDs
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  codename: string;
  targetCorp: string;
  targetSubnet: string;
  difficulty: 'Green' | 'Amber' | 'Red / Black-ICE';
  reward: number;
  timeLimitSeconds: number;
  briefing: string[];
  objectives: MissionObjective[];
  nodes: NetworkNode[];
}

import missionsJson from './missions.json';

export const MISSIONS: Mission[] = missionsJson as unknown as Mission[];

