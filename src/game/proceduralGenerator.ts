import { Mission, NetworkNode, NodePort, MissionObjective } from './missionData';

const CORPS = [
  { name: 'Kenshiro Biotech', domain: 'kenshiro-bio.net', desc: 'Genomic synthesis and neuro-augmentation research.' },
  { name: 'Aether Dynamics', domain: 'aether-dyn.corp', desc: 'Orbital energy distribution and sub-space relay networks.' },
  { name: 'OmniCorp Neural', domain: 'omnicorp-neural.io', desc: 'Autonomous AI security grids and sentient firewall daemons.' },
  { name: 'Vance Heavy Cybernetics', domain: 'vance-heavy.com', desc: 'Military exoskeleton schematics and covert weapons manufacturing.' },
  { name: 'Tyrell Cyber-Bio', domain: 'tyrell-core.sec', desc: 'Offshore biometric identity vault and dark-pool financial ledgers.' },
  { name: 'Hydra Aerospace Defense', domain: 'hydra-aero.mil', desc: 'Automated drone swarm telemetry and orbital defense grids.' },
];

const CODENAMES = ['VOID-PULSE', 'GHOST-ECHO', 'BLACK-LOTUS', 'CIPHER-BLADE', 'NEURAL-SHATTER', 'ZERO-HORIZON'];

type NodeRole = 'gateway' | 'proxy' | 'database' | 'sentry';
type ExploitType = 'port_brute' | 'buffer_overflow' | 'cipher_bypass' | 'sentry_overload';

interface DifficultyConfig {
  nodeCountRange: [number, number];
  iceBiasOffset: number;
  timeLimitSeconds: number;
  rewardRange: [number, number];
}

const DIFFICULTY_CONFIG: Record<Mission['difficulty'], DifficultyConfig> = {
  Green: { nodeCountRange: [3, 4], iceBiasOffset: -1, timeLimitSeconds: 240, rewardRange: [6000, 12000] },
  Amber: { nodeCountRange: [4, 5], iceBiasOffset: 0, timeLimitSeconds: 200, rewardRange: [12000, 22000] },
  'Red / Black-ICE': { nodeCountRange: [5, 6], iceBiasOffset: 1, timeLimitSeconds: 160, rewardRange: [20000, 35000] },
};

// Non-gateway node types, weighted so sentries stay the minority of the graph.
const NON_GATEWAY_TYPES: { type: NodeRole; weight: number }[] = [
  { type: 'proxy', weight: 4 },
  { type: 'database', weight: 4 },
  { type: 'sentry', weight: 2 },
];

const EXPLOITS_NON_SENTRY: ExploitType[] = ['port_brute', 'cipher_bypass', 'buffer_overflow'];

const EXPLOIT_PORT: Record<ExploitType, { port: number; service: string }> = {
  port_brute: { port: 22, service: 'OpenSSH (Vulnerable Handshake)' },
  cipher_bypass: { port: 443, service: 'SSL Neural Token Authenticator' },
  buffer_overflow: { port: 5432, service: 'NeuralSQL Enterprise Data Engine' },
  sentry_overload: { port: 9000, service: 'Neural Pulse Watchdog' },
};

function weightedPick<T>(items: { type: T; weight: number }[], rand: (max: number) => number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rand(total);
  for (const item of items) {
    if (roll < item.weight) return item.type;
    roll -= item.weight;
  }
  return items[items.length - 1].type;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function describeNode(type: NodeRole, corpName: string): string {
  switch (type) {
    case 'gateway':
      return `Perimeter ingress firewall for ${corpName}.`;
    case 'proxy':
      return 'Internal authentication server and access token issuer.';
    case 'database':
      return 'Secure corporate datastore holding encrypted assets.';
    case 'sentry':
      return 'Autonomous trace hunter daemon.';
  }
}

interface DraftNode {
  id: string;
  type: NodeRole;
  parentId: string | null;
  children: string[];
  hostOctet: number;
  iceLevel: number;
}

export function generateProceduralMission(seed = Date.now()): Mission {
  const rand = (max: number) => Math.floor(Math.random() * max);

  const corp = CORPS[rand(CORPS.length)];
  const codename = `${CODENAMES[rand(CODENAMES.length)]}-${rand(90) + 10}`;
  const subnetOctet = rand(240) + 10;
  const subnetPrefix = rand(2) === 0 ? `10.128.${subnetOctet}` : `172.16.${subnetOctet}`;
  const targetSubnet = `${subnetPrefix}.0/24`;
  const missionId = `incursion_${Date.now()}`;
  const cipherKeyHex = `0x${Math.random().toString(16).substr(2, 10).toUpperCase()}`;

  const difficulties: Mission['difficulty'][] = ['Green', 'Amber', 'Red / Black-ICE'];
  const difficulty = difficulties[rand(difficulties.length)];
  const config = DIFFICULTY_CONFIG[difficulty];
  const nodeCount = config.nodeCountRange[0] + rand(config.nodeCountRange[1] - config.nodeCountRange[0] + 1);
  const reward = config.rewardRange[0] + rand(config.rewardRange[1] - config.rewardRange[0]);

  // --- Topology: random-recursive-tree rooted at the gateway. Each new node attaches to a
  // random already-placed node with fewer than 3 children, so the graph stays connected and
  // connectedTo references are always valid by construction. ---
  const usedOctets = new Set<number>([1]);
  const nextOctet = () => {
    let octet = rand(240) + 10;
    while (usedOctets.has(octet)) octet = rand(240) + 10;
    usedOctets.add(octet);
    return octet;
  };

  const draft: DraftNode[] = [{ id: 'node_0', type: 'gateway', parentId: null, children: [], hostOctet: 1, iceLevel: 1 }];
  for (let i = 1; i < nodeCount; i++) {
    const type = weightedPick(NON_GATEWAY_TYPES, rand);
    const eligibleParents = draft.filter((n) => n.children.length < 3);
    const parent = eligibleParents[rand(eligibleParents.length)] || draft[0];
    const node: DraftNode = { id: `node_${i}`, type, parentId: parent.id, children: [], hostOctet: nextOctet(), iceLevel: 1 };
    parent.children.push(node.id);
    draft.push(node);
  }

  // --- Depth via BFS from the gateway (drives both ICE level and canvas layout) ---
  const depthOf = new Map<string, number>([['node_0', 0]]);
  const bfsQueue = ['node_0'];
  while (bfsQueue.length) {
    const id = bfsQueue.shift()!;
    const d = depthOf.get(id)!;
    const n = draft.find((x) => x.id === id)!;
    n.children.forEach((cid) => {
      depthOf.set(cid, d + 1);
      bfsQueue.push(cid);
    });
  }
  const maxDepth = Math.max(...Array.from(depthOf.values()));

  // --- Role assignment: a random non-gateway, non-sentry node holds the payload; its parent
  // holds the decryption key, preserving "breach parent before payload" pacing. ---
  const payloadCandidates = draft.filter((n) => n.type !== 'gateway' && n.type !== 'sentry');
  const payloadDraft = payloadCandidates.length > 0 ? payloadCandidates[rand(payloadCandidates.length)] : draft[draft.length - 1];
  const keyDraft = draft.find((n) => n.id === payloadDraft.parentId) || draft[0];
  const sentryDrafts = draft.filter((n) => n.type === 'sentry');

  // --- Exploit assignment: sentries always get sentry_overload, everything else rolls freely
  // across the other three exploits so a given exploit isn't pinned to one node type. ---
  const exploitOf = new Map<string, ExploitType>(
    draft.map((n) => [n.id, n.type === 'sentry' ? 'sentry_overload' : EXPLOITS_NON_SENTRY[rand(EXPLOITS_NON_SENTRY.length)]])
  );

  // --- ICE level: scales with depth + difficulty bias, with jitter, clamped 1-3 ---
  draft.forEach((n) => {
    if (n.type === 'gateway') return;
    n.iceLevel = clamp(1 + depthOf.get(n.id)! + config.iceBiasOffset + (rand(3) - 1), 1, 3);
  });
  if (difficulty === 'Red / Black-ICE' && !draft.some((n) => n.iceLevel === 3)) {
    const deepest = draft
      .filter((n) => n.type !== 'gateway')
      .reduce((a, b) => (depthOf.get(b.id)! > depthOf.get(a.id)! ? b : a));
    deepest.iceLevel = 3;
  }

  // --- Layout: BFS-depth columns, siblings spread evenly within each column ---
  const byDepth = new Map<number, DraftNode[]>();
  draft.forEach((n) => {
    const d = depthOf.get(n.id)!;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n);
  });
  const coordsOf = new Map<string, { x: number; y: number }>();
  byDepth.forEach((nodesAtDepth, d) => {
    const x = maxDepth === 0 ? 50 : 12 + (d / maxDepth) * 76;
    nodesAtDepth.forEach((n, i) => {
      const count = nodesAtDepth.length;
      const y = count === 1 ? 50 : 15 + (i / (count - 1)) * 70;
      coordsOf.set(n.id, { x, y });
    });
  });

  // --- Materialize NetworkNode objects ---
  const nodes: NetworkNode[] = draft.map((n) => {
    const ip = `${subnetPrefix}.${n.hostOctet}`;
    const exploit = exploitOf.get(n.id)!;
    const { port, service } = EXPLOIT_PORT[exploit];
    const ports: NodePort[] = [{ port, service, exploit, status: 'open' }];

    const files: NetworkNode['files'] = [];
    if (n.type === 'gateway') {
      const firstHop = draft.find((x) => x.parentId === n.id);
      files.push({
        name: 'routing_table.conf',
        size: '3.4 KB',
        content: `ROUTING PROTOCOL ACTIVE:\nNEXT HOP -> ${
          firstHop ? `${subnetPrefix}.${firstHop.hostOctet}` : 'UNKNOWN'
        } [SUBNET RELAY]\nSTATUS: FILTERED`,
      });
      files.push({
        name: 'sys_banner.txt',
        size: '1.2 KB',
        content: `WARNING: UNAUTHORIZED INTRUSION AT ${corp.name.toUpperCase()} IS MONITORED BY BLACK-ICE.`,
      });
    }
    if (n.id === keyDraft.id) {
      const sentryNote =
        sentryDrafts.length > 0
          ? `\nSentry AI watchdog${sentryDrafts.length > 1 ? 's' : ''} at ${sentryDrafts
              .map((s) => `${subnetPrefix}.${s.hostOctet}`)
              .join(', ')} active.`
          : '';
      files.push({
        name: 'vault_access.key',
        size: '0.9 KB',
        content: `KEY_ID: ${cipherKeyHex}\nPURPOSE: VAULT_PRIMARY_DECRYPT\nISSUER: ${corp.name.toUpperCase()}`,
      });
      files.push({
        name: 'internal_memo.txt',
        size: '2.1 KB',
        content: `TOP SECRET MEMO:\nPrimary asset vault located at ${subnetPrefix}.${payloadDraft.hostOctet}.${sentryNote}`,
      });
    }
    if (n.id === payloadDraft.id) {
      files.push({
        name: 'classified_assets.enc',
        size: '24.8 KB',
        content: `--- BEGIN CLASSIFIED CORPORATE DATA ---\nCORP: ${corp.name}\nASSETS: ${
          reward * 1000
        } NEO-CREDITS QUARANTINED\nCONSPIRACY: COVERT BLACKOUT PROTOCOL VERIFIED\n--- END CLASSIFIED CORPORATE DATA ---`,
        encrypted: true,
        requiredKey: cipherKeyHex,
        isTargetPayload: true,
      });
    }
    if (n.type === 'sentry') {
      files.push({
        name: 'trace_watchdog.cfg',
        size: '1.5 KB',
        content: 'WATCHDOG TARGET VECTOR: ACTIVE_INTRUSION\nHEURISTICS: SENTRY ARMED',
      });
    }
    if (files.length === 0) {
      files.push({
        name: 'node_status.log',
        size: '0.8 KB',
        content: `NODE STATUS: OPERATIONAL\nCORP: ${corp.name.toUpperCase()}\nNo classified assets stored on this host.`,
      });
    }

    return {
      id: n.id,
      ip,
      hostname: `${n.type}-${n.hostOctet}.${corp.domain}`,
      type: n.type,
      iceLevel: n.iceLevel,
      description: describeNode(n.type, corp.name),
      discovered: n.type === 'gateway',
      breached: false,
      coordinates: coordsOf.get(n.id)!,
      connectedTo: n.children,
      ports,
      files,
    };
  });

  const gatewayNode = nodes[0];
  const keyNode = nodes.find((n) => n.id === keyDraft.id)!;
  const payloadNode = nodes.find((n) => n.id === payloadDraft.id)!;
  const sentryNodes = nodes.filter((n) => n.type === 'sentry');

  const objectives: MissionObjective[] = [
    {
      id: 'obj_scan_gateway',
      title: 'Map Perimeter Gateway',
      description: `Scan target subnet (${targetSubnet}) and probe ${gatewayNode.ip}.`,
      completed: false,
      trigger: { kind: 'scan' },
    },
    {
      id: 'obj_breach_gateway',
      title: 'Breach Gateway',
      description: `Deploy exploit against ${gatewayNode.ip} to uncover connected nodes.`,
      completed: false,
      trigger: { kind: 'breach', nodeId: gatewayNode.id },
    },
    {
      id: 'obj_extract_key',
      title: 'Acquire Decryption Token',
      description: `Breach ${keyNode.ip} and download vault_access.key.`,
      completed: false,
      trigger: { kind: 'downloadKey', nodeId: keyNode.id },
    },
    {
      id: 'obj_exfiltrate_payload',
      title: 'Exfiltrate Classified Assets',
      description: `Breach ${payloadNode.ip} and download classified_assets.enc.`,
      completed: false,
      trigger: { kind: 'downloadPayload', nodeId: payloadNode.id },
    },
    {
      id: 'obj_decrypt_payload',
      title: 'Decrypt Target Payload',
      description: 'Run decrypt command with the acquired cipher key.',
      completed: false,
      trigger: { kind: 'decrypt' },
    },
    ...sentryNodes.map((s, i) => ({
      id: `obj_overload_sentry_${i}`,
      title: `(Optional) Overload Sentry Watchdog${sentryNodes.length > 1 ? ` #${i + 1}` : ''}`,
      description: `Overload daemon at ${s.ip} to reduce trace rate.`,
      completed: false,
      optional: true,
      trigger: { kind: 'breach' as const, nodeId: s.id },
    })),
  ];

  return {
    id: missionId,
    title: `Operation ${codename}`,
    codename,
    targetCorp: corp.name,
    targetSubnet,
    difficulty,
    reward,
    timeLimitSeconds: config.timeLimitSeconds,
    briefing: [
      `OPERATIVE CONTRACT // ${codename}`,
      `Target: ${corp.name} (${corp.desc})`,
      `Infiltrate subnet ${targetSubnet} (${nodes.length} known vectors), breach perimeter defenses, extract encryption keys, and exfiltrate "classified_assets.enc" before trace detection hits 100%.`,
    ],
    objectives,
    nodes,
  };
}
