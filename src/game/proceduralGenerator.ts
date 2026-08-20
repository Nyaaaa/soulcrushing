import { Mission, NetworkNode, MissionObjective } from './missionData';

const CORPS = [
  { name: 'Kenshiro Biotech', domain: 'kenshiro-bio.net', desc: 'Genomic synthesis and neuro-augmentation research.' },
  { name: 'Aether Dynamics', domain: 'aether-dyn.corp', desc: 'Orbital energy distribution and sub-space relay networks.' },
  { name: 'OmniCorp Neural', domain: 'omnicorp-neural.io', desc: 'Autonomous AI security grids and sentient firewall daemons.' },
  { name: 'Vance Heavy Cybernetics', domain: 'vance-heavy.com', desc: 'Military exoskeleton schematics and covert weapons manufacturing.' },
  { name: 'Tyrell Cyber-Bio', domain: 'tyrell-core.sec', desc: 'Offshore biometric identity vault and dark-pool financial ledgers.' },
  { name: 'Hydra Aerospace Defense', domain: 'hydra-aero.mil', desc: 'Automated drone swarm telemetry and orbital defense grids.' },
];

const CODENAMES = ['VOID-PULSE', 'GHOST-ECHO', 'BLACK-LOTUS', 'CIPHER-BLADE', 'NEURAL-SHATTER', 'ZERO-HORIZON'];

export function generateProceduralMission(seed = Date.now()): Mission {
  const rand = (max: number) => Math.floor(Math.random() * max);
  const corp = CORPS[rand(CORPS.length)];
  const codename = `${CODENAMES[rand(CODENAMES.length)]}-${rand(90) + 10}`;
  const subnetOctet = rand(240) + 10;
  const subnetPrefix = rand(2) === 0 ? `10.128.${subnetOctet}` : `172.16.${subnetOctet}`;
  const targetSubnet = `${subnetPrefix}.0/24`;
  const missionId = `incursion_${Date.now()}`;
  const reward = 10000 + rand(15000);
  const cipherKeyHex = `0x${Math.random().toString(16).substr(2, 10).toUpperCase()}`;

  const nodes: NetworkNode[] = [
    {
      id: 'node_gw',
      ip: `${subnetPrefix}.1`,
      hostname: `gateway-01.${corp.domain}`,
      type: 'gateway',
      iceLevel: 1,
      description: `Perimeter ingress firewall for ${corp.name}.`,
      discovered: true,
      breached: false,
      coordinates: { x: 15, y: 50 },
      connectedTo: ['node_proxy'],
      ports: [
        {
          port: 22,
          service: 'OpenSSH (Vulnerable Handshake)',
          exploit: 'port_brute',
          status: 'open',
        },
      ],
      files: [
        {
          name: 'routing_table.conf',
          size: '3.4 KB',
          content: `ROUTING PROTOCOL ACTIVE:\nNEXT HOP -> ${subnetPrefix}.18 [AUTH-PROXY]\nSTATUS: FILTERED`,
        },
        {
          name: 'sys_banner.txt',
          size: '1.2 KB',
          content: `WARNING: UNAUTHORIZED INTRUSION AT ${corp.name.toUpperCase()} IS MONITORED BY BLACK-ICE.`,
        },
      ],
    },
    {
      id: 'node_proxy',
      ip: `${subnetPrefix}.18`,
      hostname: `auth-relay.${corp.domain}`,
      type: 'proxy',
      iceLevel: 2,
      description: 'Internal authentication server and access token issuer.',
      discovered: false,
      breached: false,
      coordinates: { x: 45, y: 30 },
      connectedTo: ['node_vault', 'node_sentry'],
      ports: [
        {
          port: 443,
          service: 'SSL Neural Token Authenticator',
          exploit: 'cipher_bypass',
          status: 'open',
        },
      ],
      files: [
        {
          name: 'vault_access.key',
          size: '0.9 KB',
          content: `KEY_ID: ${cipherKeyHex}\nPURPOSE: VAULT_PRIMARY_DECRYPT\nISSUER: ${corp.name.toUpperCase()}`,
        },
        {
          name: 'internal_memo.txt',
          size: '2.1 KB',
          content: `TOP SECRET MEMO:\nPrimary asset vault located at ${subnetPrefix}.77.\nSentry AI watchdog at ${subnetPrefix}.99 active.`,
        },
      ],
    },
    {
      id: 'node_vault',
      ip: `${subnetPrefix}.77`,
      hostname: `datavault.${corp.domain}`,
      type: 'database',
      iceLevel: 3,
      description: 'Secure corporate datavault with encrypted asset payload.',
      discovered: false,
      breached: false,
      coordinates: { x: 80, y: 35 },
      connectedTo: [],
      ports: [
        {
          port: 5432,
          service: 'NeuralSQL Enterprise Data Engine',
          exploit: 'buffer_overflow',
          status: 'open',
        },
      ],
      files: [
        {
          name: 'classified_assets.enc',
          size: '24.8 KB',
          content: `--- BEGIN CLASSIFIED CORPORATE DATA ---\nCORP: ${corp.name}\nASSETS: ${reward * 1000} NEO-CREDITS QUARANTINED\nCONSPIRACY: COVERT BLACKOUT PROTOCOL VERIFIED\n--- END CLASSIFIED CORPORATE DATA ---`,
          encrypted: true,
          requiredKey: cipherKeyHex,
          isTargetPayload: true,
        },
      ],
    },
    {
      id: 'node_sentry',
      ip: `${subnetPrefix}.99`,
      hostname: `sentry-daemon.${corp.domain}`,
      type: 'sentry',
      iceLevel: 3,
      description: 'Autonomous trace hunter daemon.',
      discovered: false,
      breached: false,
      coordinates: { x: 65, y: 75 },
      connectedTo: [],
      ports: [
        {
          port: 9000,
          service: 'Neural Pulse Watchdog',
          exploit: 'sentry_overload',
          status: 'open',
        },
      ],
      files: [
        {
          name: 'trace_watchdog.cfg',
          size: '1.5 KB',
          content: `WATCHDOG TARGET VECTOR: ACTIVE_INTRUSION\nHEURISTICS: SENTRY ARMED`,
        },
      ],
    },
  ];

  const objectives: MissionObjective[] = [
    {
      id: 'obj_scan_gateway',
      title: 'Map Perimeter Gateway',
      description: `Scan target subnet (${targetSubnet}) and probe ${subnetPrefix}.1.`,
      completed: false,
    },
    {
      id: 'obj_breach_gateway',
      title: 'Breach Gateway & Locate Auth Proxy',
      description: `Deploy exploit against ${subnetPrefix}.1 to uncover ${subnetPrefix}.18.`,
      completed: false,
    },
    {
      id: 'obj_extract_key',
      title: 'Acquire Decryption Token',
      description: `Breach ${subnetPrefix}.18 and download vault_access.key.`,
      completed: false,
    },
    {
      id: 'obj_exfiltrate_ledger',
      title: 'Exfiltrate Classified Assets',
      description: `Breach ${subnetPrefix}.77 and download classified_assets.enc.`,
      completed: false,
    },
    {
      id: 'obj_decrypt_ledger',
      title: 'Decrypt Target Payload',
      description: `Run decrypt command with acquired cipher key.`,
      completed: false,
    },
    {
      id: 'obj_overload_sentry',
      title: '(Optional) Overload Sentry Watchdog',
      description: `Overload daemon at ${subnetPrefix}.99 to reduce trace rate.`,
      completed: false,
      optional: true,
    },
  ];

  return {
    id: missionId,
    title: `Operation ${codename}`,
    codename: `${codename}`,
    targetCorp: corp.name,
    targetSubnet: targetSubnet,
    difficulty: rand(2) === 0 ? 'Amber' : 'Red / Black-ICE',
    reward,
    timeLimitSeconds: 200,
    briefing: [
      `OPERATIVE CONTRACT // ${codename}`,
      `Target: ${corp.name} (${corp.desc})`,
      `Infiltrate subnet ${targetSubnet}, breach perimeter gateways, extract encryption keys, and exfiltrate "classified_assets.enc" before trace detection hits 100%.`,
    ],
    objectives,
    nodes,
  };
}
