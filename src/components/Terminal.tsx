import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Input,
  IconButton,
  HStack,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { Terminal as TerminalIcon, CornerDownLeft, Volume2, VolumeX, Trash2 } from 'lucide-react';
import { GameState, executeCommand, getAutocompletionResult } from '../game/commandParser';
import { soundFx } from '../game/soundFx';
import { MinigameOverlay, ActiveExploitSession } from './minigames/MinigameOverlay';
import { PlayerInventoryUpgrades, DEFAULT_PLAYER_UPGRADES } from '../game/marketData';

interface TerminalProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  upgrades?: PlayerInventoryUpgrades;
}

export const Terminal: React.FC<TerminalProps> = ({ gameState, setGameState, upgrades = DEFAULT_PLAYER_UPGRADES }) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeMinigame, setActiveMinigame] = useState<ActiveExploitSession | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameState.terminalLogs]);

  const triggerMinigame = (session: ActiveExploitSession) => {
    inputRef.current?.blur();
    setTimeout(() => {
      setActiveMinigame(session);
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (!inputVal.trim()) return;

      const cmd = inputVal;
      setHistory((prev) => [...prev, cmd]);
      setHistoryIdx(-1);
      setInputVal('');

      executeCommand(cmd, gameState, setGameState, triggerMinigame, upgrades);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const newIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(newIdx);
      setInputVal(history[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const newIdx = historyIdx + 1;
      if (newIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(newIdx);
        setInputVal(history[newIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const result = getAutocompletionResult(inputVal, gameState);
      if (!result) {
        soundFx.playKeyClick();
        return;
      }

      soundFx.playKeyClick();
      setInputVal(result.replacementInput);

      if (result.matches.length > 1) {
        setGameState((prev) => ({
          ...prev,
          terminalLogs: [
            ...prev.terminalLogs,
            {
              id: `tab_${Date.now()}`,
              type: 'info',
              text: `Suggestions: ${result.matches.join('  |  ')}`,
            },
          ],
        }));
      }
    } else {
      if (soundEnabled && e.key.length === 1) {
        soundFx.playKeyClick();
      }
    }
  };

  const refocusInput = () => {
    // Chakra's modal has no element to return focus to (we blurred the input on open),
    // so without this the user has to click the terminal again after every minigame.
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleMinigameSuccess = (targetIp: string) => {
    setActiveMinigame(null);
    refocusInput();
    soundFx.playBreach();

    const node = gameState.mission.nodes.find((n) => n.ip === targetIp);
    const hostname = node?.hostname || targetIp;

    const newBreached = [...gameState.breachedNodeIps, targetIp];
    const newlyDiscovered = new Set(gameState.discoveredNodeIps);

    node?.connectedTo.forEach((tgtId) => {
      const found = gameState.mission.nodes.find((n) => n.id === tgtId);
      if (found) newlyDiscovered.add(found.ip);
    });

    let updatedTraceRate = gameState.traceRate;
    if (node?.type === 'sentry') {
      updatedTraceRate = 0.25;
    }

    const updatedObjectives = gameState.mission.objectives.map((obj) => {
      if (obj.trigger.kind === 'breach' && obj.trigger.nodeId === node?.id) return { ...obj, completed: true };
      return obj;
    });

    setGameState((prev) => ({
      ...prev,
      breachedNodeIps: newBreached,
      discoveredNodeIps: Array.from(newlyDiscovered),
      traceRate: updatedTraceRate,
      mission: { ...prev.mission, objectives: updatedObjectives },
      terminalLogs: [
        ...prev.terminalLogs,
        {
          id: `minigame_win_${Date.now()}`,
          type: 'success',
          text: `EXPLOIT SUCCESSFUL: Defense ICE shattered on ${hostname} (${targetIp}). Root shell unlocked. Type "connect ${targetIp}" to open remote session.`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
      ],
    }));
  };

  const handleMinigameFailure = (reason: string) => {
    setActiveMinigame(null);
    refocusInput();
    soundFx.playAccessDenied();

    setGameState((prev) => ({
      ...prev,
      trace: Math.min(100, prev.trace + 15),
      terminalLogs: [
        ...prev.terminalLogs,
        {
          id: `minigame_fail_${Date.now()}`,
          type: 'error',
          text: `EXPLOIT FAILED: ${reason} Counter-trace increased by +15%!`,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        },
      ],
    }));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
  };

  const clearLogs = () => {
    setGameState((prev) => ({ ...prev, terminalLogs: [] }));
  };

  const runQuickAction = (cmd: string) => {
    executeCommand(cmd, gameState, setGameState, triggerMinigame, upgrades);
    inputRef.current?.focus();
  };

  return (
    <Box
      h="100%"
      w="100%"
      minH="0"
      maxH="100%"
      display="flex"
      flexDirection="column"
      bg="rgba(10, 12, 18, 0.95)"
      borderRadius="lg"
      border="1px solid rgba(0, 240, 255, 0.25)"
      boxShadow="0 0 25px rgba(0, 240, 255, 0.08), inset 0 0 15px rgba(0, 0, 0, 0.8)"
      overflow="hidden"
      position="relative"
    >
      {/* Terminal Title Bar */}
      <Flex
        flexShrink={0}
        px={4}
        py={2.5}
        bg="rgba(16, 20, 30, 0.9)"
        borderBottom="1px solid rgba(0, 240, 255, 0.2)"
        alignItems="center"
        justifyContent="space-between"
      >
        <HStack spacing={3}>
          <TerminalIcon size={16} color="#00f0ff" />
          <Text fontSize="xs" fontWeight="bold" letterSpacing="0.1em" color="#00f0ff" fontFamily="monospace">
            CYBERDECK_SHELL // {gameState.activeNodeIp ? `UPLINK:${gameState.activeNodeIp}` : 'LOCAL_ROOT'}
          </Text>
          <Badge
            colorScheme={gameState.activeNodeIp ? 'green' : 'cyan'}
            variant="subtle"
            fontSize="2xs"
            px={2}
            borderRadius="full"
          >
            {gameState.activeNodeIp ? 'REMOTE ACTIVE' : 'STEALTH MODE'}
          </Badge>
        </HStack>

        <HStack spacing={1}>
          <Tooltip label={soundEnabled ? 'Mute SFX' : 'Enable SFX'}>
            <IconButton
              aria-label="Toggle Sound"
              icon={soundEnabled ? <Volume2 size={15} color="#00f0ff" /> : <VolumeX size={15} color="#718096" />}
              size="xs"
              variant="ghost"
              onClick={toggleSound}
              _hover={{ bg: 'rgba(0, 240, 255, 0.15)' }}
            />
          </Tooltip>
          <Tooltip label="Clear Screen">
            <IconButton
              aria-label="Clear Logs"
              icon={<Trash2 size={15} color="#718096" />}
              size="xs"
              variant="ghost"
              onClick={clearLogs}
              _hover={{ bg: 'rgba(255, 0, 85, 0.15)', color: '#ff0055' }}
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Quick Action Chips Bar */}
      <HStack
        flexShrink={0}
        px={4}
        py={1.5}
        bg="rgba(12, 15, 24, 0.6)"
        borderBottom="1px solid rgba(255, 255, 255, 0.05)"
        spacing={2}
        overflowX="auto"
      >
        <Text fontSize="2xs" color="gray.500" fontWeight="bold">
          QUICK:
        </Text>
        {[
          { label: 'scan', cmd: 'scan' },
          { label: 'scrub', cmd: 'scrub' },
          { label: 'help', cmd: 'help' },
          { label: 'new-incursion', cmd: 'new-incursion' },
          { label: 'market', cmd: 'market' },
          { label: 'status', cmd: 'status' },
          { label: 'inventory', cmd: 'inventory' },
          { label: 'ls', cmd: 'ls' },
          ...(gameState.activeNodeIp ? [{ label: 'disconnect', cmd: 'disconnect' }] : []),
        ].map((action) => (
          <Badge
            key={action.label}
            as="button"
            onClick={() => runQuickAction(action.cmd)}
            cursor="pointer"
            bg="rgba(0, 240, 255, 0.08)"
            color="#00f0ff"
            border="1px solid rgba(0, 240, 255, 0.2)"
            fontSize="2xs"
            px={2}
            py={0.5}
            borderRadius="md"
            _hover={{ bg: 'rgba(0, 240, 255, 0.25)', transform: 'translateY(-1px)' }}
            transition="all 0.15s ease"
          >
            {action.label}
          </Badge>
        ))}
      </HStack>

      {/* Terminal Log Output Stream */}
      <Box
        ref={logContainerRef}
        flex="1 1 0%"
        minH="0"
        overflowY="auto"
        overflowX="hidden"
        p={4}
        fontFamily="'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
        fontSize="sm"
        lineHeight="1.5"
        onClick={() => inputRef.current?.focus()}
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(10, 12, 18, 0.9)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 240, 255, 0.3)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0, 240, 255, 0.6)',
          },
        }}
      >
        {gameState.terminalLogs.map((log) => {
          let color = '#e2e8f0';
          let bg = 'transparent';
          let borderLeft = 'none';

          if (log.type === 'cmd') {
            color = '#00f0ff';
          } else if (log.type === 'success') {
            color = '#00ff88';
            bg = 'rgba(0, 255, 136, 0.04)';
            borderLeft = '2px solid #00ff88';
          } else if (log.type === 'warning') {
            color = '#ffb700';
            bg = 'rgba(255, 183, 0, 0.05)';
            borderLeft = '2px solid #ffb700';
          } else if (log.type === 'error') {
            color = '#ff0055';
            bg = 'rgba(255, 0, 85, 0.08)';
            borderLeft = '2px solid #ff0055';
          } else if (log.type === 'system') {
            color = '#38bdf8';
          } else if (log.type === 'ascii') {
            color = '#00f0ff';
          }

          return (
            <Box
              key={log.id}
              mb={2}
              p={borderLeft !== 'none' ? 2 : 0}
              bg={bg}
              borderLeft={borderLeft}
              borderRadius={borderLeft !== 'none' ? 'sm' : 'none'}
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              color={color}
              textShadow={log.type === 'ascii' || log.type === 'success' ? '0 0 8px currentColor' : 'none'}
            >
              {log.text}
            </Box>
          );
        })}
      </Box>

      {/* Terminal Input Line */}
      <Flex
        flexShrink={0}
        px={3}
        py={2.5}
        bg="rgba(14, 18, 28, 0.95)"
        borderTop="1px solid rgba(0, 240, 255, 0.2)"
        alignItems="center"
      >
        <Text
          color={gameState.activeNodeIp ? '#00ff88' : '#00f0ff'}
          fontWeight="bold"
          fontFamily="monospace"
          fontSize="sm"
          mr={2}
          userSelect="none"
        >
          {gameState.activeNodeIp ? `[remote@${gameState.activeNodeIp}]$` : `[operative@cyberdeck]$`}
        </Text>
        <Input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="unstyled"
          color="#ffffff"
          fontFamily="'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
          fontSize="sm"
          placeholder="type a command (e.g. scan, crack, new-incursion)..."
          _placeholder={{ color: 'rgba(255, 255, 255, 0.25)' }}
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <IconButton
          aria-label="Submit command"
          icon={<CornerDownLeft size={16} color="#00f0ff" />}
          size="xs"
          variant="ghost"
          onClick={() => {
            if (!inputVal.trim()) return;
            executeCommand(inputVal, gameState, setGameState, triggerMinigame, upgrades);
            setInputVal('');
          }}
          _hover={{ bg: 'rgba(0, 240, 255, 0.15)' }}
        />
      </Flex>

      {/* Minigame Overlay Modal */}
      <MinigameOverlay
        session={activeMinigame}
        upgrades={upgrades}
        onSuccess={handleMinigameSuccess}
        onFailure={handleMinigameFailure}
        onCancel={() => {
          setActiveMinigame(null);
          refocusInput();
        }}
      />
    </Box>
  );
};
