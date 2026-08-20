import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Text, SimpleGrid, Button, HStack, Badge, Progress } from '@chakra-ui/react';
import { soundFx } from '../../game/soundFx';

interface PortBruteMinigameProps {
  timeLimit: number;
  iceLevel?: number;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
}

const HEX_CHARS = ['1A', '3F', '7B', '9C', 'A2', 'C4', 'E8', 'FF', '55', 'BD', 'D1', '04'];
const HEX_DIGITS = '0123456789ABCDEF';

// A visually-similar-but-wrong byte (one digit off), so scanning the grid for the right
// value at a glance isn't enough — matching is by value, so an exact duplicate would make
// the puzzle easier, not harder.
function nearMissByte(hex: string): string {
  const idx = Math.floor(Math.random() * hex.length);
  let digit = HEX_DIGITS[Math.floor(Math.random() * HEX_DIGITS.length)];
  while (digit === hex[idx]) digit = HEX_DIGITS[Math.floor(Math.random() * HEX_DIGITS.length)];
  return hex.slice(0, idx) + digit + hex.slice(idx + 1);
}

// Grid side length and target sequence length both scale with ICE tier.
const COLS_BY_ICE: Record<number, number> = { 1: 3, 2: 4, 3: 5 };
const SEQ_LEN_BY_ICE: Record<number, number> = { 1: 3, 2: 4, 3: 5 };

export const PortBruteMinigame: React.FC<PortBruteMinigameProps> = ({
  timeLimit,
  iceLevel = 1,
  onSuccess,
  onFailure,
}) => {
  const cols = COLS_BY_ICE[iceLevel] ?? 4;
  const gridSize = cols * cols;
  const seqLen = SEQ_LEN_BY_ICE[iceLevel] ?? 3;
  const hasDecoys = iceLevel >= 3;

  const [targetSeq] = useState<string[]>(() =>
    Array.from({ length: seqLen }, () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)])
  );

  const [grid] = useState<string[]>(() => {
    const cells = [...targetSeq];
    while (cells.length < gridSize) {
      // At higher ICE tiers, scatter near-miss lookalikes of the target bytes (one digit off)
      // so a careless glance can misread a decoy as the real thing.
      const useDecoy = hasDecoys && Math.random() < 0.4;
      cells.push(useDecoy ? nearMissByte(targetSeq[Math.floor(Math.random() * targetSeq.length)]) : HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]);
    }
    return cells.sort(() => Math.random() - 0.5);
  });

  const [cursorIdx, setCursorIdx] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;

  const endTimeRef = useRef(Date.now() + timeLimit * 1000);
  const isFinishedRef = useRef(false);

  // Reliable Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isFinishedRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        isFinishedRef.current = true;
        clearInterval(timer);
        soundFx.playAccessDenied();
        onFailureRef.current('BUFFER TIMEOUT: Exploit handshake expired.');
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const mountTimeRef = useRef(Date.now() + 250);

  const handleCellClick = useCallback(
    (hex: string) => {
      if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;

      if (hex === targetSeq[currentIndex]) {
        soundFx.playKeyClick();
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        if (nextIndex >= targetSeq.length) {
          isFinishedRef.current = true;
          soundFx.playAccessGranted();
          onSuccessRef.current();
        }
      } else {
        isFinishedRef.current = true;
        soundFx.playAccessDenied();
        onFailureRef.current('CHECKSUM MISMATCH: Wrong hex byte entered in sequence.');
      }
    },
    [currentIndex, targetSeq]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        soundFx.playKeyClick();
        setCursorIdx((prev) => (prev % cols === cols - 1 ? prev - (cols - 1) : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        soundFx.playKeyClick();
        setCursorIdx((prev) => (prev % cols === 0 ? prev + (cols - 1) : prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        soundFx.playKeyClick();
        setCursorIdx((prev) => (prev + cols) % gridSize);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        soundFx.playKeyClick();
        setCursorIdx((prev) => (prev - cols + gridSize) % gridSize);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCellClick(grid[cursorIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursorIdx, grid, handleCellClick, cols, gridSize]);

  return (
    <Box p={4} bg="rgba(8, 10, 16, 0.95)" borderRadius="lg" border="1px solid #00f0ff">
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="xs" fontWeight="bold" color="#00f0ff" fontFamily="monospace">
          PORT_BRUTE // SEQUENCE_ALIGNMENT
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

      {/* Target Sequence */}
      <Box mb={4} p={2.5} bg="rgba(0, 240, 255, 0.08)" borderRadius="md" border="1px dashed rgba(0, 240, 255, 0.4)">
        <Text fontSize="2xs" color="gray.400" fontFamily="monospace" mb={1}>
          REQUIRED SEQUENCE BUFFER (SELECT IN ORDER):
        </Text>
        <HStack spacing={2}>
          {targetSeq.map((hex, i) => (
            <Box
              key={i}
              px={3}
              py={1}
              borderRadius="sm"
              bg={i < currentIndex ? '#00ff88' : i === currentIndex ? '#00f0ff' : 'rgba(255, 255, 255, 0.1)'}
              color={i < currentIndex ? '#000000' : i === currentIndex ? '#000000' : '#ffffff'}
              fontFamily="monospace"
              fontWeight="bold"
              fontSize="sm"
            >
              {hex}
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Grid */}
      <SimpleGrid columns={cols} spacing={2} mb={3}>
        {grid.map((hex, idx) => {
          const isCursor = cursorIdx === idx;
          return (
            <Button
              key={idx}
              onClick={() => {
                setCursorIdx(idx);
                handleCellClick(hex);
              }}
              size="sm"
              variant="outline"
              borderColor={isCursor ? '#ffb700' : 'rgba(0, 240, 255, 0.3)'}
              borderWidth={isCursor ? '2px' : '1px'}
              boxShadow={isCursor ? '0 0 10px rgba(255, 183, 0, 0.5)' : 'none'}
              bg={isCursor ? 'rgba(255, 183, 0, 0.2)' : 'transparent'}
              color={isCursor ? '#ffb700' : '#00f0ff'}
              fontFamily="monospace"
              fontSize="xs"
              _hover={{ bg: 'rgba(0, 240, 255, 0.2)', borderColor: '#00f0ff' }}
            >
              {hex}
            </Button>
          );
        })}
      </SimpleGrid>

      <Text fontSize="3xs" color="gray.500" fontFamily="monospace" textAlign="center">
        Use ARROW KEYS to navigate cells & ENTER / SPACE to select byte
      </Text>
    </Box>
  );
};
