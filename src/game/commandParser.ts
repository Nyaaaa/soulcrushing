import { NetworkNode, Mission, MISSIONS } from './missionData';
import { soundFx } from './soundFx';
import { generateProceduralMission } from './proceduralGenerator';
import { PlayerInventoryUpgrades, TRACE_PURGER_REDUCTION_PCT, DECRYPTION_ACCEL_BONUS_PCT } from './marketData';
import { ActiveExploitSession } from '../components/minigames/MinigameOverlay';

export interface TerminalOutputLine {
  id: string;
  type: 'cmd' | 'info' | 'success' | 'warning' | 'error' | 'system' | 'ascii';
  text: string;
  timestamp?: string;
}

export interface GameState {
  mission: Mission;
  activeNodeIp: string | null;
  discoveredNodeIps: string[];
  breachedNodeIps: string[];
  inventory: {
    exploits: string[];
    keys: string[];
    downloadedFiles: { name: string; content: string; decrypted?: boolean; isTargetPayload?: boolean }[];
  };
  trace: number;
  traceRate: number;
  isTraced: boolean;
  isCompleted: boolean;
  timeElapsedSeconds: number;
  scrubChargesUsed: number;
  terminalLogs: TerminalOutputLine[];
}

export const INITIAL_STATE: GameState = {
  mission: JSON.parse(JSON.stringify(MISSIONS[0])),
  activeNodeIp: null,
  discoveredNodeIps: ['192.168.0.1'],
  breachedNodeIps: [],
  inventory: {
    exploits: ['port_brute', 'cipher_bypass', 'buffer_overflow', 'sentry_overload'],
    keys: [],
    downloadedFiles: [],
  },
  trace: 0,
  traceRate: 1,
  isTraced: false,
  isCompleted: false,
  timeElapsedSeconds: 0,
  scrubChargesUsed: 0,
  terminalLogs: [
    {
      id: 'boot_1',
      type: 'ascii',
      text: [
        '  ██████╗  ██████╗ ██╗   ██╗██╗      ██████╗██████╗ ██╗   ██╗███████╗██╗  ██╗██╗███╗   ██╗ ██████╗ ',
        '  ██╔════╝ ██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██║   ██║██╔════╝██║  ██║██║████╗  ██║██╔════╝ ',
        '  ███████╗ ██║   ██║██║   ██║██║     ██║     ██████╔╝██║   ██║███████╗███████║██║██╔██╗ ██║██║  ███╗',
        '  ╚════██║ ██║   ██║██║   ██║██║     ██║     ██╔══██╗██║   ██║╚════██║██╔══██║██║██║╚██╗██║██║   ██║',
        '  ███████║ ╚██████╔╝╚██████╔╝███████╗╚██████╗██║  ██║╚██████╔╝███████║██║  ██║██║██║ ╚████║╚██████╔╝',
        '  ╚══════╝  ╚═════╝  ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ',
      ].join('\n'),
    },
    {
      id: 'boot_2',
      type: 'system',
      text: 'CYBERDECK v4.2-PRO // NEURAL INTERFACE ONLINE // STEALTH PROTOCOL ENGAGED',
    },
    {
      id: 'boot_3',
      type: 'info',
      text: 'MISSION ACTIVATED: Operation Null-Dawn [Target: Asphalt-Core Subnet 192.168.0.0/24]',
    },
    {
      id: 'boot_4',
      type: 'warning',
      text: 'Type "help" for a list of intrusion commands, "scan" to map subnet, or "new-incursion" for procedural contracts.',
    },
  ],
};

export function executeCommand(
  rawInput: string,
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  onTriggerMinigame?: (session: ActiveExploitSession) => void,
  upgrades?: PlayerInventoryUpgrades
): void {
  const trimmed = rawInput.trim();
  if (!trimmed) return;

  const now = new Date().toLocaleTimeString('en-US', { hour12: false });
  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  const promptSymbol = state.activeNodeIp ? `[remote@${state.activeNodeIp}]$` : `[operative@cyberdeck]$`;
  const cmdLog: TerminalOutputLine = {
    id: `cmd_${Date.now()}`,
    type: 'cmd',
    text: `${promptSymbol} ${trimmed}`,
    timestamp: now,
  };

  const newLogs: TerminalOutputLine[] = [cmdLog];

  if (state.isTraced) {
    newLogs.push({
      id: `err_${Date.now()}`,
      type: 'error',
      text: 'FATAL: SYSTEM BLACKOUT. Connection terminated by Corporate Countermeasures. Type "new-incursion" to launch a new contract.',
    });
    setState((prev) => ({ ...prev, terminalLogs: [...prev.terminalLogs, ...newLogs] }));
    soundFx.playAccessDenied();
    return;
  }

  const helper = (type: TerminalOutputLine['type'], text: string) => {
    newLogs.push({ id: `log_${Date.now()}_${Math.random()}`, type, text, timestamp: now });
  };

  switch (command) {
    case 'help': {
      soundFx.playKeyClick();
      helper(
        'info',
        [
          '=== CYBERDECK COMMAND PROTOCOLS ===',
          '  scan [subnet]           - Map active nodes across the target subnet',
          '  probe <ip>              - Inspect open ports, security ICE, and vulnerabilities',
          '  crack <ip> <exploit>    - Deploy intrusion mini-game (port_brute, cipher_bypass, etc.)',
          '  connect <ip>            - Establish interactive remote shell on a breached node',
          '  disconnect              - Close remote shell and return to local cyberdeck',
          '  ls                      - List files on the active filesystem',
          '  cat <file>              - Output contents of a file',
          '  download <file>         - Exfiltrate remote file to local cyberdeck storage',
          '  decrypt <file>          - Decipher encrypted data and collect bounty credits',
          '  scrub / purge           - Deploy log scrubber to reduce active counter-trace heat',
          '  deck / inventory        - Inspect cyberdeck hardware, payload chips, and keys',
          '  market                  - Dark web black market overview',
          '  new-incursion           - Generate a fresh procedural incursion contract',
          '  status                  - View mission dossier, timer, and counter-trace meter',
          '  save                    - Persist game state to neural cloud (SQLite Database)',
          '  clear                   - Purge terminal display logs',
        ].join('\n')
      );
      break;
    }

    case 'clear': {
      setState((prev) => ({ ...prev, terminalLogs: [] }));
      return;
    }

    case 'scrub':
    case 'purge':
    case 'burn-proxy': {
      const purgerTier = upgrades?.trace_purger || 0;
      if (purgerTier <= 0) {
        soundFx.playAccessDenied();
        helper(
          'error',
          'HARDWARE MODULE REQUIRED: Signal Jammer & Log Scrubber is not installed.\nPurchase this hardware in the Black Market (/market) or type "market" to view upgrade catalog.'
        );
        break;
      }

      const maxCharges = purgerTier;
      const chargesUsed = state.scrubChargesUsed || 0;

      if (chargesUsed >= maxCharges) {
        soundFx.playAccessDenied();
        helper(
          'error',
          `EXHAUSTED: All ${maxCharges} log scrubber charges have been depleted for this incursion. Complete contract or generate a new incursion to recharge.`
        );
        break;
      }

      if (state.trace <= 0) {
        helper('warning', 'COUNTER-TRACE CLEAR: Detection heat is already at 0.0%.');
        break;
      }

      const reduction = TRACE_PURGER_REDUCTION_PCT[purgerTier] ?? 20;
      const newTrace = Math.max(0, Math.round((state.trace - reduction) * 10) / 10);

      soundFx.playAccessGranted();
      helper(
        'success',
        [
          `[+] LOG SCRUBBER DEPLOYED: Burned decoy IP & flooded remote IDS telemetry!`,
          `>> Counter-trace purged by -${reduction}% (Current heat: ${newTrace}%)`,
          `>> Charges remaining: ${maxCharges - chargesUsed - 1}/${maxCharges}`,
        ].join('\n')
      );

      setState((prev) => ({
        ...prev,
        trace: newTrace,
        scrubChargesUsed: chargesUsed + 1,
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'dev':
    case 'debug': {
      soundFx.playAccessGranted();
      helper(
        'system',
        [
          '=== CYBERDECK DEVELOPER DEBUG MODE ===',
          'Press `~` (tilde/backtick) or click "DEV TOOLS [~]" in the top navigation bar to toggle the Dev Window.',
          'Features: Instant node breach/reveal, credit adjustments, hardware tier overrides, and minigame sandbox testing.',
        ].join('\n')
      );
      break;
    }

    case 'market':
    case 'shop': {
      soundFx.playKeyClick();
      helper(
        'info',
        [
          '=== DARK WEB BLACK MARKET PROTOCOL ===',
          'Access the Black Market via the top navigation bar or navigate to /market.',
          'AVAILABLE HARDWARE UPGRADES:',
          '  - Proxy Bouncer & ICE Cloak (-15% to -60% trace speed)',
          '  - Neural CPU Overclocker (+25% to +100% puzzle time window)',
          '  - Automated Deep Port Sniffer (Auto-reveals ports/exploits on scan)',
          '  - Decryption Neural Accelerator (+15% to +50% bonus credit payouts)',
        ].join('\n')
      );
      break;
    }

    case 'new-incursion':
    case 'incursion':
    case 'contract': {
      soundFx.playAccessGranted();
      const newMission = generateProceduralMission();
      const initialNodeIp = newMission.nodes[0].ip;

      helper(
        'system',
        [
          '========================================================================',
          `*** NEW INCURSION GENERATED: ${newMission.title} ***`,
          `Target Megacorp:  ${newMission.targetCorp}`,
          `Target Subnet:    ${newMission.targetSubnet}`,
          `Security Rating:  ${newMission.difficulty}`,
          `Estimated Bounty: ${newMission.reward.toLocaleString()} CR`,
          '========================================================================',
          'Type "scan" to map perimeter gateway.',
        ].join('\n')
      );

      setState((prev) => ({
        ...prev,
        mission: newMission,
        activeNodeIp: null,
        discoveredNodeIps: [initialNodeIp],
        breachedNodeIps: [],
        trace: 0,
        isTraced: false,
        isCompleted: false,
        timeElapsedSeconds: 0,
        scrubChargesUsed: 0,
        inventory: {
          ...prev.inventory,
          keys: [],
          downloadedFiles: [],
        },
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'status': {
      soundFx.playKeyClick();
      const activeText = state.activeNodeIp ? `REMOTE SHELL -> ${state.activeNodeIp}` : 'LOCAL CYBERDECK (ROOT)';
      const completedObj = state.mission.objectives.filter((o) => o.completed).length;
      const totalObj = state.mission.objectives.length;
      helper(
        'system',
        [
          `--- MISSION STATUS: ${state.mission.title} ---`,
          `Target Corp:      ${state.mission.targetCorp}`,
          `Uplink Status:    ${activeText}`,
          `Counter-Trace:    ${state.trace}% [Threshold: 100%]`,
          `Time Elapsed:     ${state.timeElapsedSeconds}s`,
          `Objectives:       ${completedObj}/${totalObj} Completed`,
          `Nodes Breached:   ${state.breachedNodeIps.length}/${state.mission.nodes.length}`,
        ].join('\n')
      );
      break;
    }

    case 'scan': {
      soundFx.playKeyClick();
      const targetSubnet = args[0] || state.mission.targetSubnet;
      helper('system', `Initiating ARP / ICMP Subnet Sweep on ${targetSubnet}...`);

      const allNodes = state.mission.nodes;
      const discovered = new Set(state.discoveredNodeIps);

      allNodes.forEach((node) => {
        if (node.type === 'gateway') discovered.add(node.ip);
        if (state.breachedNodeIps.length > 0) {
          state.breachedNodeIps.forEach((bIp) => {
            const bNode = allNodes.find((n) => n.ip === bIp);
            bNode?.connectedTo.forEach((tgtId) => {
              const targetNode = allNodes.find((n) => n.id === tgtId);
              if (targetNode) discovered.add(targetNode.ip);
            });
          });
        }
      });

      const updatedDiscovered = Array.from(discovered);
      const snifferTier = upgrades?.port_sniffer || 0;

      const scanResults = allNodes
        .filter((n) => updatedDiscovered.includes(n.ip))
        .map((n) => {
          let extraInfo = '';
          if (snifferTier >= 1) extraInfo += ` | ICE: Tier ${n.iceLevel}`;
          if (snifferTier >= 2) extraInfo += ` | Ports: [${n.ports.map((p) => p.port).join(',')}]`;
          if (snifferTier >= 3) extraInfo += ` | Vulns: [${n.ports.map((p) => p.exploit).join(',')}]`;

          return `  [+] Node: ${n.ip.padEnd(16)} | Host: ${n.hostname.padEnd(28)}${extraInfo} | Status: ${
            state.breachedNodeIps.includes(n.ip) ? 'BREACHED' : 'SECURE (LOCKED)'
          }`;
        })
        .join('\n');

      helper('success', `Scan complete. Found ${updatedDiscovered.length} active node(s):\n${scanResults}`);

      const updatedObjectives = state.mission.objectives.map((obj) =>
        obj.trigger.kind === 'scan' ? { ...obj, completed: true } : obj
      );

      setState((prev) => ({
        ...prev,
        discoveredNodeIps: updatedDiscovered,
        mission: { ...prev.mission, objectives: updatedObjectives },
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'probe': {
      if (!args[0]) {
        soundFx.playAccessDenied();
        helper('error', 'SYNTAX ERROR: probe <target_ip>. Example: probe 192.168.0.1');
        break;
      }
      const targetIp = args[0];
      const targetNode = state.mission.nodes.find((n) => n.ip === targetIp);

      if (!targetNode || !state.discoveredNodeIps.includes(targetIp)) {
        soundFx.playAccessDenied();
        helper('error', `HOST UNREACHABLE: Target ${targetIp} not discovered in active subnet.`);
        break;
      }

      soundFx.playKeyClick();
      helper('system', `Probing port vulnerabilities & ICE defenses on ${targetIp} (${targetNode.hostname})...`);

      const portReport = targetNode.ports
        .map(
          (p) =>
            `  - Port ${p.port.toString().padEnd(5)} [${p.status.toUpperCase()}] ${p.service}\n    * Vulnerable Payload: ${p.exploit}`
        )
        .join('\n');

      helper(
        'info',
        [
          `--- NODE TELEMETRY [${targetNode.ip}] ---`,
          `Hostname:     ${targetNode.hostname}`,
          `Node Type:    ${targetNode.type.toUpperCase()}`,
          `ICE Barrier:  Tier ${targetNode.iceLevel}`,
          `Description:  ${targetNode.description}`,
          `Open Ports:`,
          portReport,
        ].join('\n')
      );
      break;
    }

    case 'crack': {
      if (args.length < 2) {
        soundFx.playAccessDenied();
        helper('error', 'SYNTAX ERROR: crack <target_ip> <payload>. Example: crack 192.168.0.1 port_brute');
        break;
      }
      const [targetIp, exploit] = args;
      const targetNode = state.mission.nodes.find((n) => n.ip === targetIp);

      if (!targetNode || !state.discoveredNodeIps.includes(targetIp)) {
        soundFx.playAccessDenied();
        helper('error', `DEPLOYMENT FAILED: Node ${targetIp} is not reachable.`);
        break;
      }

      if (state.breachedNodeIps.includes(targetIp)) {
        helper('warning', `NODE ALREADY BREACHED: ${targetIp} is unlocked. Run "connect ${targetIp}" for remote shell.`);
        break;
      }

      const matchingPort = targetNode.ports.find((p) => p.exploit === exploit);
      if (!matchingPort) {
        soundFx.playAccessDenied();
        helper(
          'error',
          `EXPLOIT REJECTED: ${exploit} is incompatible with defenses on ${targetIp}. Run "probe ${targetIp}" to inspect vulnerabilities.`
        );
        setState((prev) => ({
          ...prev,
          trace: Math.min(100, prev.trace + 10),
          terminalLogs: [...prev.terminalLogs, ...newLogs],
        }));
        return;
      }

      // Minigame trigger
      if (onTriggerMinigame) {
        helper('system', `INITIALIZING EXPLOIT [${exploit}] -> Engaging bypass matrix on ${targetNode.hostname}:${matchingPort.port}...`);
        setState((prev) => ({ ...prev, terminalLogs: [...prev.terminalLogs, ...newLogs] }));
        onTriggerMinigame({
          targetIp,
          targetHostname: targetNode.hostname,
          exploit: exploit as any,
          port: matchingPort.port,
          iceLevel: targetNode.iceLevel,
        });
        return;
      }

      // Direct breach fallback
      soundFx.playBreach();
      helper('success', `ACCESS GRANTED: Defense ICE shattered on ${targetNode.hostname} (${targetIp}).`);

      const newBreached = [...state.breachedNodeIps, targetIp];
      const newlyDiscovered = new Set(state.discoveredNodeIps);

      targetNode.connectedTo.forEach((tgtId) => {
        const found = state.mission.nodes.find((n) => n.id === tgtId);
        if (found) newlyDiscovered.add(found.ip);
      });

      setState((prev) => ({
        ...prev,
        breachedNodeIps: newBreached,
        discoveredNodeIps: Array.from(newlyDiscovered),
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'connect': {
      if (!args[0]) {
        soundFx.playAccessDenied();
        helper('error', 'SYNTAX ERROR: connect <target_ip>. Example: connect 192.168.0.1');
        break;
      }
      const targetIp = args[0];
      if (!state.breachedNodeIps.includes(targetIp)) {
        soundFx.playAccessDenied();
        helper('error', `ACCESS DENIED: Node ${targetIp} has not been breached. Deploy payload with "crack" first.`);
        break;
      }

      const node = state.mission.nodes.find((n) => n.ip === targetIp);
      soundFx.playAccessGranted();
      helper('success', `UPLINK ESTABLISHED -> Remote shell active on ${node?.hostname} (${targetIp}). Type "ls" to inspect node directory.`);

      setState((prev) => ({
        ...prev,
        activeNodeIp: targetIp,
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'disconnect':
    case 'exit': {
      if (!state.activeNodeIp) {
        helper('info', 'Already on local cyberdeck root environment.');
        break;
      }
      soundFx.playKeyClick();
      helper('system', `UPLINK SEVERED: Disconnected from ${state.activeNodeIp}. Returned to local cyberdeck.`);
      setState((prev) => ({
        ...prev,
        activeNodeIp: null,
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'ls': {
      soundFx.playKeyClick();
      if (!state.activeNodeIp) {
        const lootList = state.inventory.downloadedFiles.map((f) => `  ${f.name.padEnd(30)} [${f.decrypted ? 'DECRYPTED' : 'ENCRYPTED'}]`).join('\n') || '  (no exfiltrated files)';
        helper('info', `=== LOCAL STORAGE: /cyberdeck/loot/ ===\n${lootList}`);
      } else {
        const node = state.mission.nodes.find((n) => n.ip === state.activeNodeIp);
        if (!node) break;
        const fileList = node.files
          .map((f) => `  -rw-r--r-- 1 root root ${f.size.padEnd(8)} ${f.name}${f.encrypted ? ' [LOCKED / ENCRYPTED]' : ''}`)
          .join('\n');
        helper('info', `Directory contents of ${node.hostname}:/\n${fileList}`);
      }
      break;
    }

    case 'cat': {
      if (!args[0]) {
        soundFx.playAccessDenied();
        helper('error', 'SYNTAX ERROR: cat <filename>. Example: cat routing.log');
        break;
      }
      const filename = args[0];
      soundFx.playKeyClick();

      if (!state.activeNodeIp) {
        const localFile = state.inventory.downloadedFiles.find((f) => f.name === filename);
        if (!localFile) {
          soundFx.playAccessDenied();
          helper('error', `FILE NOT FOUND: "${filename}" not in local cyberdeck storage.`);
          break;
        }
        helper('info', `--- /cyberdeck/loot/${filename} ---\n${localFile.content}`);
      } else {
        const node = state.mission.nodes.find((n) => n.ip === state.activeNodeIp);
        const remoteFile = node?.files.find((f) => f.name === filename);
        if (!remoteFile) {
          soundFx.playAccessDenied();
          helper('error', `FILE NOT FOUND: "${filename}" does not exist on ${node?.hostname}.`);
          break;
        }
        helper('info', `--- ${filename} [${remoteFile.size}] ---\n${remoteFile.content}`);
      }
      break;
    }

    case 'download': {
      if (!state.activeNodeIp) {
        soundFx.playAccessDenied();
        helper('error', 'OPERATION INVALID: Connect to a remote node first using "connect <ip>".');
        break;
      }
      if (!args[0]) {
        soundFx.playAccessDenied();
        helper('error', 'SYNTAX ERROR: download <filename>. Example: download ledger_2084_corrupted.enc');
        break;
      }

      const filename = args[0];
      const node = state.mission.nodes.find((n) => n.ip === state.activeNodeIp);
      const file = node?.files.find((f) => f.name === filename);

      if (!file) {
        soundFx.playAccessDenied();
        helper('error', `DOWNLOAD FAILED: "${filename}" does not exist on remote node.`);
        break;
      }

      if (state.inventory.downloadedFiles.some((f) => f.name === filename)) {
        helper('warning', `File "${filename}" already exists in local storage /cyberdeck/loot/.`);
        break;
      }

      soundFx.playAccessGranted();
      helper('system', `Transmitting packet stream for "${filename}" [${file.size}]...`);
      helper('success', `DOWNLOAD COMPLETE: Exfiltrated "${filename}" to /cyberdeck/loot/.`);

      const newDownloaded = [
        ...state.inventory.downloadedFiles,
        { name: file.name, content: file.content, isTargetPayload: file.isTargetPayload },
      ];
      const newKeys = [...state.inventory.keys];

      if (filename.includes('key')) {
        const match = file.content.match(/0x[0-9A-Fa-f]+/);
        const keyHex = match ? match[0] : '0x9FA884B2CC11';
        newKeys.push(keyHex);
        helper('system', `KEYRING UPDATED: Acquired Vault Cipher Key: ${keyHex}`);
      }

      const updatedObjectives = state.mission.objectives.map((obj) => {
        if (obj.trigger.kind === 'downloadKey' && obj.trigger.nodeId === node?.id && filename.includes('key')) {
          return { ...obj, completed: true };
        }
        if (obj.trigger.kind === 'downloadPayload' && obj.trigger.nodeId === node?.id && file.isTargetPayload) {
          return { ...obj, completed: true };
        }
        return obj;
      });

      setState((prev) => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          keys: newKeys,
          downloadedFiles: newDownloaded,
        },
        mission: { ...prev.mission, objectives: updatedObjectives },
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'decrypt': {
      if (!args[0]) {
        soundFx.playAccessDenied();
        helper('error', 'SYNTAX ERROR: decrypt <filename>. Example: decrypt ledger_2084_corrupted.enc');
        break;
      }

      const filename = args[0];
      const file = state.inventory.downloadedFiles.find((f) => f.name === filename);

      if (!file) {
        soundFx.playAccessDenied();
        helper('error', `DECRYPTION ERROR: File "${filename}" must be downloaded to /cyberdeck/loot/ first.`);
        break;
      }

      if (file.decrypted) {
        helper('info', `File "${filename}" is already decrypted.`);
        break;
      }

      if (state.inventory.keys.length === 0) {
        soundFx.playAccessDenied();
        helper('error', 'DECRYPTION FAILED: Missing Cipher Key. Exfiltrate the key from the Authentication Proxy first.');
        break;
      }

      const keyUsed = state.inventory.keys[0];
      soundFx.playMissionComplete();
      helper('system', `Running Neural Cipher Engine with Key [${keyUsed}]...`);

      if (!file.isTargetPayload) {
        helper(
          'success',
          `DECRYPTION COMPLETE: "${filename}" decoded, but it isn't the mission's target payload — no bounty awarded. Decrypt the exfiltrated target file to complete the contract.`
        );
        const updatedFiles = state.inventory.downloadedFiles.map((f) =>
          f.name === filename ? { ...f, decrypted: true } : f
        );
        setState((prev) => ({
          ...prev,
          inventory: { ...prev.inventory, downloadedFiles: updatedFiles },
          terminalLogs: [...prev.terminalLogs, ...newLogs],
        }));
        return;
      }

      const cryptoTier = upgrades?.decryption_accel || 0;
      const bonusPct = DECRYPTION_ACCEL_BONUS_PCT[cryptoTier] ?? 0;
      const baseReward = state.mission.reward;
      const totalPayout = baseReward + Math.floor(baseReward * (bonusPct / 100));

      helper(
        'success',
        [
          '========================================================================',
          `         *** ${state.mission.title.toUpperCase()} COMPLETED ***         `,
          '========================================================================',
          'PAYLOAD DECRYPTION SUCCESSFUL:',
          `>> RECOVERED BOUNTY: +${totalPayout.toLocaleString()} NEO-CREDITS ${bonusPct > 0 ? `(+${bonusPct}% CRYPTO ACCELERATOR BONUS)` : ''}`,
          '>> BOUNTY TRANSFERRED DIRECTLY TO YOUR BLACK MARKET WALLET!',
          '>> Type "new-incursion" to launch your next contract or "market" to buy upgrades!',
          '========================================================================',
        ].join('\n')
      );

      fetch('/api/game/incursion/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerHandle: 'OPERATIVE_ALPHA',
          missionId: state.mission.id,
          bounty: totalPayout,
          completionTimeSeconds: state.timeElapsedSeconds,
          tracePercent: state.trace,
          score: Math.max(1000, 20000 - state.timeElapsedSeconds * 40 - state.trace * 80),
        }),
      }).catch(() => {});

      const updatedFiles = state.inventory.downloadedFiles.map((f) =>
        f.name === filename ? { ...f, decrypted: true } : f
      );

      const updatedObjectives = state.mission.objectives.map((obj) =>
        obj.trigger.kind === 'decrypt' ? { ...obj, completed: true } : obj
      );

      setState((prev) => ({
        ...prev,
        isCompleted: true,
        inventory: { ...prev.inventory, downloadedFiles: updatedFiles },
        mission: { ...prev.mission, objectives: updatedObjectives },
        terminalLogs: [...prev.terminalLogs, ...newLogs],
      }));
      return;
    }

    case 'inventory':
    case 'deck': {
      soundFx.playKeyClick();
      const exploitList = state.inventory.exploits.map((e) => `  [CHIP] ${e}`).join('\n');
      const keyList = state.inventory.keys.map((k) => `  [KEY]  ${k}`).join('\n') || '  (none)';
      const lootList = state.inventory.downloadedFiles.map((f) => `  [DATA] ${f.name} (${f.decrypted ? 'DECRYPTED' : 'ENCRYPTED'})`).join('\n') || '  (none)';

      helper(
        'info',
        [
          '=== CYBERDECK HARDWARE & DATA INVENTORY ===',
          'INSTALLED EXPLOIT MODULES:',
          exploitList,
          'ACQUIRED CIPHER KEYS:',
          keyList,
          'EXFILTRATED LOOT / PAYLOADS:',
          lootList,
        ].join('\n')
      );
      break;
    }

    case 'save': {
      soundFx.playAccessGranted();
      helper('system', 'Serializing cyberdeck memory and saving state to SQLite database...');

      fetch('/api/game/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: 'operative_alpha',
          missionId: state.mission.id,
          trace: state.trace,
          discoveredNodes: JSON.stringify(state.discoveredNodeIps),
          breachedNodes: JSON.stringify(state.breachedNodeIps),
          inventory: JSON.stringify(state.inventory),
          isCompleted: state.isCompleted,
        }),
      })
        .then((res) => res.json())
        .then(() => {
          setState((prev) => ({
            ...prev,
            terminalLogs: [
              ...prev.terminalLogs,
              {
                id: `save_${Date.now()}`,
                type: 'success',
                text: 'STATE SAVED: Neural checkpoint registered with central server database.',
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
              },
            ],
          }));
        })
        .catch(() => {});
      break;
    }

    default: {
      soundFx.playAccessDenied();
      helper('error', `COMMAND UNRECOGNIZED: "${command}". Type "help" for a list of intrusion protocols.`);
      break;
    }
  }

  setState((prev) => ({ ...prev, terminalLogs: [...prev.terminalLogs, ...newLogs] }));
}

export interface AutocompleteResult {
  replacementInput: string;
  matches: string[];
  hasExpanded: boolean;
  isSingleMatch: boolean;
}

function getLongestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}

export function getAutocompletionResult(input: string, state: GameState): AutocompleteResult | null {
  const isTrailingSpace = input.endsWith(' ');
  const rawTokens = input.trim().split(/\s+/).filter(Boolean);
  const tokens = input.trim() === '' ? [] : rawTokens;

  const currentToken = isTrailingSpace || tokens.length === 0 ? '' : tokens[tokens.length - 1];
  const tokenIndex = isTrailingSpace ? tokens.length : Math.max(0, tokens.length - 1);

  const baseCommands = [
    'help',
    'scan',
    'probe',
    'crack',
    'connect',
    'disconnect',
    'ls',
    'cat',
    'download',
    'decrypt',
    'scrub',
    'purge',
    'deck',
    'inventory',
    'market',
    'new-incursion',
    'dev',
    'status',
    'save',
    'clear',
  ];

  let candidates: string[] = [];
  const cmd = tokens[0]?.toLowerCase() || '';

  if (tokenIndex === 0) {
    candidates = baseCommands;
  } else if (tokenIndex === 1) {
    if (cmd === 'probe' || cmd === 'crack') {
      candidates = state.discoveredNodeIps;
    } else if (cmd === 'connect') {
      candidates = state.breachedNodeIps.length > 0 ? state.breachedNodeIps : state.discoveredNodeIps;
    } else if (cmd === 'scan') {
      candidates = [state.mission.targetSubnet];
    } else if (cmd === 'cat' || cmd === 'download') {
      if (state.activeNodeIp) {
        const node = state.mission.nodes.find((n) => n.ip === state.activeNodeIp);
        candidates = node?.files.map((f) => f.name) || [];
      } else {
        candidates = state.inventory.downloadedFiles.map((f) => f.name);
      }
    } else if (cmd === 'decrypt') {
      candidates = state.inventory.downloadedFiles.map((f) => f.name);
    } else if (cmd === 'help') {
      candidates = baseCommands;
    }
  } else if (tokenIndex === 2) {
    if (cmd === 'crack') {
      const targetIp = tokens[1];
      const targetNode = state.mission.nodes.find((n) => n.ip === targetIp);
      const nodeExploits = targetNode?.ports.map((p) => p.exploit) || [];
      candidates = Array.from(new Set([...nodeExploits, ...state.inventory.exploits]));
    }
  }

  const matches = candidates.filter((c) =>
    c.toLowerCase().startsWith(currentToken.toLowerCase())
  );

  if (matches.length === 0) {
    return null;
  }

  let prefix = '';
  if (isTrailingSpace) {
    prefix = input;
  } else {
    const priorTokens = tokens.slice(0, tokenIndex);
    prefix = priorTokens.length > 0 ? priorTokens.join(' ') + ' ' : '';
  }

  if (matches.length === 1) {
    return {
      replacementInput: `${prefix}${matches[0]} `,
      matches,
      hasExpanded: true,
      isSingleMatch: true,
    };
  }

  const lcp = getLongestCommonPrefix(matches);
  const hasExpanded = lcp.length > currentToken.length;
  const replacementInput = hasExpanded ? `${prefix}${lcp}` : input;

  return {
    replacementInput,
    matches,
    hasExpanded,
    isSingleMatch: false,
  };
}

export function getAutocompletions(input: string, state: GameState): string[] {
  const result = getAutocompletionResult(input, state);
  return result ? result.matches : [];
}
