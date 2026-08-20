export interface CyberdeckUpgradeTier {
  tier: number;
  name: string;
  cost: number;
  effect: string;
}

export interface CyberdeckUpgrade {
  id: string;
  name: string;
  category: 'stealth' | 'cpu' | 'scanner' | 'crypto' | 'purger';
  icon: string;
  description: string;
  tiers: CyberdeckUpgradeTier[];
}

export interface PlayerInventoryUpgrades {
  stealth_cloak: number; // Tier 0 to 4
  cpu_overclock: number; // Tier 0 to 4
  port_sniffer: number; // Tier 0 to 3
  decryption_accel: number; // Tier 0 to 3
  trace_purger: number; // Tier 0 to 4
}

export const CYBERDECK_UPGRADES: CyberdeckUpgrade[] = [
  {
    id: 'stealth_cloak',
    name: 'Proxy Bouncer & ICE Cloak',
    category: 'stealth',
    icon: 'Shield',
    description: 'Rotates dynamic proxy tunnels to reduce counter-trace speed and detection velocity.',
    tiers: [
      { tier: 1, name: 'Single-Hop Proxy Relay', cost: 2500, effect: '-15% counter-trace accumulation speed' },
      { tier: 2, name: 'Ghost Cipher Bouncer Array', cost: 6000, effect: '-30% counter-trace accumulation speed' },
      { tier: 3, name: 'Multi-Node Darknet Shifter', cost: 14000, effect: '-45% counter-trace accumulation speed' },
      { tier: 4, name: 'Quantum Void Stealth Cloak', cost: 30000, effect: '-60% counter-trace accumulation speed' },
    ],
  },
  {
    id: 'trace_purger',
    name: 'Signal Jammer & Log Scrubber',
    category: 'purger',
    icon: 'Flame',
    description: 'Floods remote IDS logs and burns decoy routes to actively reduce accumulated counter-trace heat.',
    tiers: [
      { tier: 1, name: 'Packet Log Flusher', cost: 3000, effect: 'Unlocks "scrub" command: -20% trace heat (1 charge/run)' },
      { tier: 2, name: 'Burner Proxy Array', cost: 7000, effect: '"scrub" reduces trace by -30% (2 charges/run)' },
      { tier: 3, name: 'Quantum Decoy Injector', cost: 15000, effect: '"scrub" reduces trace by -40% (3 charges/run)' },
      { tier: 4, name: 'Zero-Trace EMP Siphon', cost: 28000, effect: '"scrub" reduces trace by -50% (4 charges/run)' },
    ],
  },
  {
    id: 'cpu_overclock',
    name: 'Neural CPU Overclocker',
    category: 'cpu',
    icon: 'Cpu',
    description: 'Boosts cyberdeck clock cycles to slow down puzzle timers and extend exploit deployment windows.',
    tiers: [
      { tier: 1, name: 'Liquid Helium Heat Sink', cost: 3000, effect: '+25% time window during hacking minigames' },
      { tier: 2, name: 'Sub-Zero Dual Core Booster', cost: 7500, effect: '+50% time window during hacking minigames' },
      { tier: 3, name: 'Tachyon Overclock Chipset', cost: 16000, effect: '+75% time window during hacking minigames' },
      { tier: 4, name: 'Zero-Point Neural Hyperclock', cost: 32000, effect: '+100% time window during hacking minigames' },
    ],
  },
  {
    id: 'port_sniffer',
    name: 'Automated Deep Port Sniffer',
    category: 'scanner',
    icon: 'Radio',
    description: 'Passive packet analyzer that automatically probes remote nodes when performing a subnet scan.',
    tiers: [
      { tier: 1, name: 'Passive Header Sniffer', cost: 4000, effect: 'Automatically detects ICE tier when running "scan"' },
      { tier: 2, name: 'Deep Packet Dissector', cost: 10000, effect: 'Automatically reveals all open ports when running "scan"' },
      { tier: 3, name: 'AI Vulnerability Predictor', cost: 22000, effect: 'Automatically identifies compatible exploit payloads upon "scan"' },
    ],
  },
  {
    id: 'decryption_accel',
    name: 'Decryption Neural Accelerator',
    category: 'crypto',
    icon: 'Zap',
    description: 'Hardware crypto co-processor that enhances data exfiltration yields and payout bounties.',
    tiers: [
      { tier: 1, name: 'AES-GCM Dedicated Pipeline', cost: 3500, effect: '+15% bonus credit bounty from decrypted files' },
      { tier: 2, name: 'Quantum Key Derivator', cost: 9000, effect: '+30% bonus credit bounty from decrypted files' },
      { tier: 3, name: 'Black-ICE Neural Siphon', cost: 24000, effect: '+50% bonus credit bounty from decrypted files' },
    ],
  },
];

export const DEFAULT_PLAYER_UPGRADES: PlayerInventoryUpgrades = {
  stealth_cloak: 0,
  trace_purger: 0,
  cpu_overclock: 0,
  port_sniffer: 0,
  decryption_accel: 0,
};
