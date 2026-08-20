import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Text, Button, Badge, Progress, HStack } from '@chakra-ui/react';
import { soundFx } from '../../game/soundFx';

interface SentryOverloadMinigameProps {
  timeLimit: number;
  iceLevel?: number;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
}

const SWEEP_SPEED_BY_ICE: Record<number, number> = { 1: 0.85, 2: 1.15, 3: 1.6 };
const WINDOW_WIDTH_BY_ICE: Record<number, number> = { 1: 40, 2: 30, 3: 20 };
const HITS_REQUIRED_BY_ICE: Record<number, number> = { 1: 3, 2: 3, 3: 4 };

export const SentryOverloadMinigame: React.FC<SentryOverloadMinigameProps> = ({
  timeLimit,
  iceLevel = 1,
  onSuccess,
  onFailure,
}) => {
  const sweepSpeed = SWEEP_SPEED_BY_ICE[iceLevel] ?? 1.15;
  const windowWidth = WINDOW_WIDTH_BY_ICE[iceLevel] ?? 30;
  const hitsRequired = HITS_REQUIRED_BY_ICE[iceLevel] ?? 3;

  const [pulsePosition, setPulsePosition] = useState(0); // 0 to 100
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [justHit, setJustHit] = useState(false);

  const pulsePosRef = useRef(0);
  const hitsRef = useRef(0);
  const isFinishedRef = useRef(false);

  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;

  // Resonance sweet spot window, centered at 50% and narrowing with ICE tier
  const SWEET_SPOT_START = 50 - windowWidth / 2;
  const SWEET_SPOT_END = 50 + windowWidth / 2;

  const endTimeRef = useRef(Date.now() + timeLimit * 1000);

  // Smooth, rhythmic oscillating frequency needle
  useEffect(() => {
    let animId: number;
    let currentPos = 0;
    let currentDir: 'right' | 'left' = 'right';

    const loop = () => {
      if (isFinishedRef.current) return;

      if (currentDir === 'right') {
        currentPos += sweepSpeed;
        if (currentPos >= 100) {
          currentPos = 100;
          currentDir = 'left';
        }
      } else {
        currentPos -= sweepSpeed;
        if (currentPos <= 0) {
          currentPos = 0;
          currentDir = 'right';
        }
      }

      pulsePosRef.current = currentPos;
      setPulsePosition(currentPos);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [sweepSpeed]);

  // Robust countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isFinishedRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        isFinishedRef.current = true;
        clearInterval(timer);
        soundFx.playAccessDenied();
        onFailureRef.current('SENTRY COUNTER-PULSE: Overload time expired.');
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const mountTimeRef = useRef(Date.now() + 250);

  const handlePulse = useCallback(() => {
    if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;
    const current = pulsePosRef.current;

    if (current >= SWEET_SPOT_START && current <= SWEET_SPOT_END) {
      soundFx.playKeyClick();
      setJustHit(true);
      setTimeout(() => setJustHit(false), 200);

      const nextHits = hitsRef.current + 1;
      hitsRef.current = nextHits;
      setHits(nextHits);

      if (nextHits >= hitsRequired) {
        isFinishedRef.current = true;
        soundFx.playBreach();
        onSuccessRef.current();
      }
    } else {
      isFinishedRef.current = true;
      soundFx.playAccessDenied();
      onFailureRef.current('PHASE DESYNC: Frequency pulse missed resonance window.');
    }
  }, [hitsRequired, SWEET_SPOT_START, SWEET_SPOT_END]);

  // Window key listener for Space, Enter, ArrowDown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePulse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePulse]);

  return (
    <Box p={4} bg="rgba(8, 10, 16, 0.95)" borderRadius="lg" border="1px solid #00f0ff">
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="xs" fontWeight="bold" color="#00f0ff" fontFamily="monospace">
          SENTRY_OVERLOAD // WAVEFORM_RESONANCE
        </Text>
        <Badge colorScheme={timeLeft <= 5 ? 'red' : 'cyan'} fontSize="xs" fontFamily="monospace">
          TIME: {timeLeft}s
        </Badge>
      </Flex>

      <Progress
        value={(timeLeft / timeLimit) * 100}
        size="xs"
        colorScheme={timeLeft <= 5 ? 'red' : 'cyan'}
        borderRadius="full"
        mb={4}
      />

      {/* Waveform Gauge Container */}
      <Box
        position="relative"
        h="75px"
        bg={justHit ? 'rgba(0, 255, 136, 0.15)' : 'rgba(0, 0, 0, 0.6)'}
        borderRadius="md"
        border="1px solid"
        borderColor={justHit ? '#00ff88' : 'rgba(0, 240, 255, 0.3)'}
        mb={4}
        overflow="hidden"
        transition="all 0.15s ease"
      >
        {/* Resonance Target Zone */}
        <Box
          position="absolute"
          left={`${SWEET_SPOT_START}%`}
          width={`${SWEET_SPOT_END - SWEET_SPOT_START}%`}
          top={0}
          bottom={0}
          bg="rgba(0, 255, 136, 0.2)"
          borderLeft="2px dashed #00ff88"
          borderRight="2px dashed #00ff88"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="3xs" color="#00ff88" fontFamily="monospace" fontWeight="bold">
            RESONANCE TARGET ({SWEET_SPOT_START}% - {SWEET_SPOT_END}%)
          </Text>
        </Box>

        {/* Oscillating Frequency Needle */}
        <Box
          position="absolute"
          left={`${pulsePosition}%`}
          top={0}
          bottom={0}
          width="6px"
          bg={pulsePosition >= SWEET_SPOT_START && pulsePosition <= SWEET_SPOT_END ? '#00ff88' : '#ff0055'}
          boxShadow={`0 0 12px ${pulsePosition >= SWEET_SPOT_START && pulsePosition <= SWEET_SPOT_END ? '#00ff88' : '#ff0055'}`}
          transform="translateX(-50%)"
        />
      </Box>

      {/* Progress Indicators */}
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="2xs" color="gray.400" fontFamily="monospace">
          SYNCS REQUIRED:
        </Text>
        <HStack spacing={1.5}>
          {Array.from({ length: hitsRequired }, (_, i) => i + 1).map((h) => (
            <Badge
              key={h}
              colorScheme={h <= hits ? 'green' : 'gray'}
              fontSize="xs"
              px={2.5}
              py={0.5}
              borderRadius="sm"
            >
              {h <= hits ? `SYNC #${h} READY` : `SYNC #${h}`}
            </Badge>
          ))}
        </HStack>
      </Flex>

      <Button
        w="100%"
        colorScheme="teal"
        bg="#00f0ff"
        color="#000000"
        fontFamily="monospace"
        fontWeight="bold"
        fontSize="xs"
        onClick={handlePulse}
        _hover={{ bg: '#38bdf8' }}
        mb={2}
      >
        FIRE FREQUENCY PULSE [SPACE / ENTER / CLICK]
      </Button>

      <Text fontSize="3xs" color="gray.500" fontFamily="monospace" textAlign="center">
        Press SPACE, ENTER, or ARROW KEYS when the needle is inside the green resonance window.
      </Text>
    </Box>
  );
};
