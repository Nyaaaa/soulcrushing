import React, { useEffect } from 'react';
import { Box, Flex, Text, Progress, Badge, Button, HStack } from '@chakra-ui/react';
import { AlertTriangle, Radio, ShieldAlert, Flame } from 'lucide-react';
import { GameState, executeCommand } from '../game/commandParser';
import { soundFx } from '../game/soundFx';
import {
  PlayerInventoryUpgrades,
  DEFAULT_PLAYER_UPGRADES,
  STEALTH_TRACE_REDUCTION,
  TRACE_PURGER_REDUCTION_PCT,
} from '../game/marketData';

interface TraceMeterProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  upgrades?: PlayerInventoryUpgrades;
}

export const TraceMeter: React.FC<TraceMeterProps> = ({
  gameState,
  setGameState,
  upgrades = DEFAULT_PLAYER_UPGRADES,
}) => {
  const { trace, traceRate, isCompleted, isTraced } = gameState;
  const purgerTier = upgrades.trace_purger || 0;
  const maxCharges = purgerTier;
  const chargesUsed = gameState.scrubChargesUsed || 0;
  const availableCharges = Math.max(0, maxCharges - chargesUsed);
  const reductionAmount = TRACE_PURGER_REDUCTION_PCT[purgerTier] ?? 20;

  // Real-time trace tick effect when connected to remote nodes
  useEffect(() => {
    if (isCompleted || isTraced || !gameState.activeNodeIp) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.isCompleted || prev.isTraced || !prev.activeNodeIp) return prev;
        const stealthReduction = STEALTH_TRACE_REDUCTION[upgrades.stealth_cloak || 0] ?? 0;
        const effectiveRate = Math.max(0.15, prev.traceRate * (1 - stealthReduction));
        const nextTrace = Math.min(100, Math.round((prev.trace + effectiveRate) * 10) / 10);
        const newlyTraced = nextTrace >= 100;

        if (newlyTraced) {
          soundFx.playAccessDenied();
          return {
            ...prev,
            trace: 100,
            isTraced: true,
            terminalLogs: [
              ...prev.terminalLogs,
              {
                id: `trace_kill_${Date.now()}`,
                type: 'error',
                text: 'CRITICAL ALERT: Counter-Trace reached 100%! Cyberdeck connection severed by corporate ICE. Mission failed.',
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
              },
            ],
          };
        }

        if (nextTrace >= 80 && Math.random() > 0.6) {
          soundFx.playAlarmPulse();
        }

        return { ...prev, trace: nextTrace };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [gameState.activeNodeIp, isCompleted, isTraced, setGameState, upgrades.stealth_cloak]);

  let statusColor = '#00f0ff';
  let badgeColor = 'cyan';
  let statusText = 'INCOGNITO / IDLE';

  if (gameState.activeNodeIp) {
    if (trace < 35) {
      statusColor = '#00ff88';
      badgeColor = 'green';
      statusText = 'TRACE PASSIVE';
    } else if (trace < 70) {
      statusColor = '#ffb700';
      badgeColor = 'yellow';
      statusText = 'ELEVATED HEAT';
    } else {
      statusColor = '#ff0055';
      badgeColor = 'red';
      statusText = 'BLACKOUT IMMINENT';
    }
  }

  const handlePurgeTrace = () => {
    executeCommand('scrub', gameState, setGameState, undefined, upgrades);
  };

  return (
    <Box
      p={3.5}
      bg="rgba(10, 12, 18, 0.95)"
      borderRadius="lg"
      border="1px solid"
      borderColor={trace >= 70 ? '#ff0055' : 'rgba(0, 240, 255, 0.25)'}
      boxShadow={trace >= 70 ? '0 0 20px rgba(255, 0, 85, 0.3)' : '0 0 15px rgba(0, 240, 255, 0.05)'}
      transition="all 0.3s ease"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Flex alignItems="center" gap={2}>
          {trace >= 70 ? (
            <ShieldAlert size={16} color="#ff0055" />
          ) : (
            <Radio size={16} color={statusColor} />
          )}
          <Text fontSize="xs" fontWeight="bold" letterSpacing="0.08em" color={statusColor} fontFamily="monospace">
            COUNTER_TRACE_DETECTION
          </Text>
        </Flex>
        <Badge colorScheme={badgeColor} variant="solid" fontSize="2xs" px={2} borderRadius="full">
          {statusText}
        </Badge>
      </Flex>

      {/* Progress Bar */}
      <Progress
        value={trace}
        size="sm"
        borderRadius="full"
        bg="rgba(255, 255, 255, 0.08)"
        colorScheme={trace >= 70 ? 'red' : trace >= 35 ? 'yellow' : 'cyan'}
        hasStripe={trace >= 50}
        isAnimated={trace >= 50}
        mb={2}
      />

      <Flex justifyContent="space-between" fontSize="2xs" color="gray.400" fontFamily="monospace" mb={2.5}>
        <Text>
          TRACE HEAT: <span style={{ color: statusColor, fontWeight: 'bold' }}>{trace}%</span>
        </Text>
        <Text>
          VELOCITY:{' '}
          <span style={{ color: traceRate < 1 ? '#00ff88' : '#e2e8f0' }}>
            {gameState.activeNodeIp ? `+${traceRate * 0.67}%/s` : '0%/s (LOCAL)'}
          </span>
        </Text>
      </Flex>

      {/* Trace Scrubber / Purge Action Bar */}
      {purgerTier > 0 ? (
        <Button
          size="xs"
          w="100%"
          colorScheme="orange"
          bg="rgba(255, 136, 0, 0.2)"
          borderColor="#ff8800"
          borderWidth="1px"
          color="#ff8800"
          leftIcon={<Flame size={13} />}
          isDisabled={availableCharges <= 0 || trace <= 0}
          onClick={handlePurgeTrace}
          fontFamily="monospace"
          fontSize="2xs"
          _hover={{ bg: 'rgba(255, 136, 0, 0.35)' }}
        >
          PURGE TRACE (-{reductionAmount}%) [{availableCharges}/{maxCharges} CHARGES]
        </Button>
      ) : (
        <HStack justifyContent="space-between" fontSize="3xs" color="gray.500" fontFamily="monospace">
          <Text>LOG SCRUBBER: NOT INSTALLED</Text>
          <Text color="cyan.500">BUY AT BLACK MARKET</Text>
        </HStack>
      )}
    </Box>
  );
};
