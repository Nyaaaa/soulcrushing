import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  Badge,
  Progress,
  HStack,
} from '@chakra-ui/react';
import { soundFx } from '../../game/soundFx';

interface BufferOverflowMinigameProps {
  timeLimit: number;
  iceLevel?: number;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
}

const TOLERANCE_BY_ICE: Record<number, number> = { 1: 7, 2: 5, 3: 3 };

export const BufferOverflowMinigame: React.FC<BufferOverflowMinigameProps> = ({
  timeLimit,
  iceLevel = 1,
  onSuccess,
  onFailure,
}) => {
  const tolerance = TOLERANCE_BY_ICE[iceLevel] ?? 5;
  const requiresCanary = iceLevel >= 3;

  const [targetOffset] = useState(() => Math.floor(Math.random() * 60) + 20); // 20 to 80
  const [currentOffset, setCurrentOffset] = useState(50);
  const [targetCanaryOffset] = useState(() => Math.floor(Math.random() * 60) + 20);
  const [currentCanaryOffset, setCurrentCanaryOffset] = useState(50);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const offsetRef = useRef(50);
  const canaryOffsetRef = useRef(50);
  const isFinishedRef = useRef(false);

  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;

  const endTimeRef = useRef(Date.now() + timeLimit * 1000);

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
        onFailureRef.current('STACK TIMEOUT: Memory buffer stabilized before injection.');
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const mountTimeRef = useRef(Date.now() + 250);

  const handleInject = useCallback(() => {
    if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;
    const diff = Math.abs(offsetRef.current - targetOffset);
    const canaryDiff = Math.abs(canaryOffsetRef.current - targetCanaryOffset);
    const eipAligned = diff <= tolerance;
    const canaryAligned = !requiresCanary || canaryDiff <= tolerance;

    if (eipAligned && canaryAligned) {
      isFinishedRef.current = true;
      soundFx.playBreach();
      onSuccessRef.current();
    } else {
      isFinishedRef.current = true;
      soundFx.playAccessDenied();
      const failedField = !eipAligned ? 'EIP' : 'CANARY';
      onFailureRef.current(
        `SEGFAULT: Invalid ${failedField} offset alignment (EIP ${offsetRef.current}/${targetOffset}${
          requiresCanary ? `, CANARY ${canaryOffsetRef.current}/${targetCanaryOffset}` : ''
        }). Stack corrupted.`
      );
    }
  }, [targetOffset, targetCanaryOffset, tolerance, requiresCanary]);

  // Arrow key controls for slider
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        soundFx.playKeyClick();
        setCurrentOffset((prev) => {
          const next = Math.max(0, prev - (e.shiftKey ? 5 : 1));
          offsetRef.current = next;
          return next;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        soundFx.playKeyClick();
        setCurrentOffset((prev) => {
          const next = Math.min(100, prev + (e.shiftKey ? 5 : 1));
          offsetRef.current = next;
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleInject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInject]);

  return (
    <Box p={4} bg="rgba(8, 10, 16, 0.95)" borderRadius="lg" border="1px solid #00f0ff">
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="xs" fontWeight="bold" color="#00f0ff" fontFamily="monospace">
          BUFFER_OVERFLOW // INSTRUCTION_POINTER_ALIGNMENT
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

      <Box mb={4} p={3} bg="rgba(0, 0, 0, 0.4)" borderRadius="md" border="1px solid rgba(255, 255, 255, 0.1)">
        <Flex justifyContent="space-between" mb={2} fontSize="2xs" fontFamily="monospace" color="gray.400">
          <Text>
            TARGET EIP OFFSET: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{targetOffset} BYTES</span> (&plusmn;{tolerance})
          </Text>
          <Text>
            CURRENT PAYLOAD: <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{currentOffset} BYTES</span>
          </Text>
        </Flex>

        <Slider
          value={currentOffset}
          min={0}
          max={100}
          step={1}
          onChange={(val) => {
            soundFx.playKeyClick();
            offsetRef.current = val;
            setCurrentOffset(val);
          }}
          mb={2}
        >
          <SliderTrack bg="rgba(255, 255, 255, 0.1)">
            <SliderFilledTrack bg="#00f0ff" />
          </SliderTrack>
          <SliderThumb boxSize={4} bg="#00f0ff" />
        </Slider>

        <HStack justifyContent="space-between" fontSize="3xs" color="gray.500" fontFamily="monospace">
          <Text>0x00 [NOP SLED]</Text>
          <Text>0x40 [CANARY]</Text>
          <Text>0x80 [RET ADDRESS]</Text>
        </HStack>

        {requiresCanary && (
          <>
            <Flex justifyContent="space-between" mb={2} mt={3} fontSize="2xs" fontFamily="monospace" color="gray.400">
              <Text>
                TARGET CANARY OFFSET:{' '}
                <span style={{ color: '#ff0055', fontWeight: 'bold' }}>{targetCanaryOffset} BYTES</span> (&plusmn;{tolerance})
              </Text>
              <Text>
                CURRENT: <span style={{ color: '#ff8800', fontWeight: 'bold' }}>{currentCanaryOffset} BYTES</span>
              </Text>
            </Flex>
            <Slider
              value={currentCanaryOffset}
              min={0}
              max={100}
              step={1}
              onChange={(val) => {
                soundFx.playKeyClick();
                canaryOffsetRef.current = val;
                setCurrentCanaryOffset(val);
              }}
            >
              <SliderTrack bg="rgba(255, 255, 255, 0.1)">
                <SliderFilledTrack bg="#ff8800" />
              </SliderTrack>
              <SliderThumb boxSize={4} bg="#ff8800" />
            </Slider>
          </>
        )}
      </Box>

      <Button
        w="100%"
        colorScheme="teal"
        bg="#00f0ff"
        color="#000000"
        fontFamily="monospace"
        fontWeight="bold"
        fontSize="xs"
        onClick={handleInject}
        _hover={{ bg: '#38bdf8' }}
        mb={2}
      >
        INJECT BUFFER OVERFLOW PAYLOAD [ENTER / SPACE]
      </Button>

      <Text fontSize="3xs" color="gray.500" fontFamily="monospace" textAlign="center">
        Use LEFT / RIGHT ARROW KEYS to adjust the EIP offset{requiresCanary ? ', drag the CANARY slider,' : ''} & ENTER to inject payload
      </Text>
    </Box>
  );
};
