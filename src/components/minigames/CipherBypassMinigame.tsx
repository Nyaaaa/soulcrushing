import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Flex, Text, SimpleGrid, Button, Badge, Progress, HStack } from '@chakra-ui/react';
import { soundFx } from '../../game/soundFx';

interface CipherBypassMinigameProps {
  timeLimit: number;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
}

const HEX_POOL = ['1C', '55', '7A', 'BD', 'E9', 'FF'];
const MATRIX_SIZE = 4;

function generateSolvablePuzzle() {
  const mat: string[][] = Array.from({ length: MATRIX_SIZE }, () =>
    Array.from({ length: MATRIX_SIZE }, () => HEX_POOL[Math.floor(Math.random() * HEX_POOL.length)])
  );

  // Step 1: Start at row 0, pick a col c0
  const c0 = Math.floor(Math.random() * MATRIX_SIZE);
  const t0 = mat[0][c0];

  // Step 2: In col c0, pick a row r1 (1 to 3)
  const r1 = Math.floor(Math.random() * (MATRIX_SIZE - 1)) + 1;
  const t1 = mat[r1][c0];

  // Step 3: In row r1, pick a col c2 != c0
  const otherCols = [0, 1, 2, 3].filter((c) => c !== c0);
  const c2 = otherCols[Math.floor(Math.random() * otherCols.length)];
  const t2 = mat[r1][c2];

  return {
    matrix: mat,
    targetSeq: [t0, t1, t2],
    initialCursor: { r: 0, c: 0 },
  };
}

export const CipherBypassMinigame: React.FC<CipherBypassMinigameProps> = ({
  timeLimit,
  onSuccess,
  onFailure,
}) => {
  const [puzzle] = useState(() => generateSolvablePuzzle());
  const { matrix, targetSeq } = puzzle;

  const [isRowMode, setIsRowMode] = useState<boolean>(true);
  const [activeRow, setActiveRow] = useState<number>(0);
  const [activeCol, setActiveCol] = useState<number>(0);
  const [cursor, setCursor] = useState<{ r: number; c: number }>({ r: 0, c: 0 });

  const [buffer, setBuffer] = useState<string[]>([]);
  const [usedCoords, setUsedCoords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;

  const endTimeRef = useRef(Date.now() + timeLimit * 1000);
  const isFinishedRef = useRef(false);

  // Robust Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isFinishedRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        isFinishedRef.current = true;
        clearInterval(timer);
        soundFx.playAccessDenied();
        onFailureRef.current('CIPHER LOCKOUT: Key derivation matrix expired.');
      }
    }, 250);

    return () => clearInterval(timer);
  }, []);

  const mountTimeRef = useRef(Date.now() + 250);

  const selectCell = useCallback(
    (r: number, c: number) => {
      if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;
      const coordKey = `${r},${c}`;
      if (usedCoords.includes(coordKey)) return;

      if (isRowMode && r !== activeRow) return;
      if (!isRowMode && c !== activeCol) return;

      const val = matrix[r][c];
      soundFx.playKeyClick();

      const newBuffer = [...buffer, val];
      setBuffer(newBuffer);
      setUsedCoords((prev) => [...prev, coordKey]);

      const joinedBuffer = newBuffer.join('-');
      const joinedTarget = targetSeq.join('-');

      if (joinedBuffer.includes(joinedTarget)) {
        isFinishedRef.current = true;
        soundFx.playAccessGranted();
        onSuccessRef.current();
        return;
      }

      if (newBuffer.length >= 4) {
        isFinishedRef.current = true;
        soundFx.playAccessDenied();
        onFailureRef.current('BUFFER EXHAUSTED: Failed to complete cipher path.');
        return;
      }

      // Switch mode and align cursor
      if (isRowMode) {
        setActiveCol(c);
        setIsRowMode(false);
        setCursor({ r: (r + 1) % MATRIX_SIZE, c });
      } else {
        setActiveRow(r);
        setIsRowMode(true);
        setCursor({ r, c: (c + 1) % MATRIX_SIZE });
      }
    },
    [activeRow, activeCol, buffer, isRowMode, matrix, targetSeq, usedCoords]
  );

  // Keyboard navigation listener (Arrow keys, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinishedRef.current || Date.now() < mountTimeRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        soundFx.playKeyClick();

        setCursor((prev) => {
          let newR = prev.r;
          let newC = prev.c;

          if (isRowMode) {
            newR = activeRow;
            if (e.key === 'ArrowLeft') newC = (prev.c - 1 + MATRIX_SIZE) % MATRIX_SIZE;
            if (e.key === 'ArrowRight') newC = (prev.c + 1) % MATRIX_SIZE;
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') newC = (prev.c + 1) % MATRIX_SIZE;
          } else {
            newC = activeCol;
            if (e.key === 'ArrowUp') newR = (prev.r - 1 + MATRIX_SIZE) % MATRIX_SIZE;
            if (e.key === 'ArrowDown') newR = (prev.r + 1) % MATRIX_SIZE;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') newR = (prev.r + 1) % MATRIX_SIZE;
          }

          return { r: newR, c: newC };
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCell(cursor.r, cursor.c);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCol, activeRow, cursor.c, cursor.r, isRowMode, selectCell]);

  return (
    <Box p={4} bg="rgba(8, 10, 16, 0.95)" borderRadius="lg" border="1px solid #00f0ff">
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="xs" fontWeight="bold" color="#00f0ff" fontFamily="monospace">
          CIPHER_BYPASS // MATRIX_ROUTING ({isRowMode ? `ROW ${activeRow + 1}` : `COL ${activeCol + 1}`})
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
        mb={3}
      />

      {/* Target and Buffer display */}
      <Flex justifyContent="space-between" mb={3} gap={2} flexWrap="wrap">
        <Box p={2} bg="rgba(0, 240, 255, 0.08)" borderRadius="md" flex="1">
          <Text fontSize="3xs" color="gray.400" fontFamily="monospace">TARGET SEQUENCE:</Text>
          <HStack spacing={1}>
            {targetSeq.map((hex, i) => (
              <Badge key={i} colorScheme="cyan" fontSize="2xs">{hex}</Badge>
            ))}
          </HStack>
        </Box>
        <Box p={2} bg="rgba(0, 255, 136, 0.08)" borderRadius="md" flex="1">
          <Text fontSize="3xs" color="gray.400" fontFamily="monospace">BUFFER ({buffer.length}/4):</Text>
          <HStack spacing={1}>
            {buffer.map((hex, i) => (
              <Badge key={i} colorScheme="green" fontSize="2xs">{hex}</Badge>
            ))}
          </HStack>
        </Box>
      </Flex>

      {/* Matrix Grid */}
      <SimpleGrid columns={4} spacing={1.5} mb={3}>
        {matrix.map((row, r) =>
          row.map((val, c) => {
            const isUsed = usedCoords.includes(`${r},${c}`);
            const isSelectable = isRowMode ? r === activeRow && !isUsed : c === activeCol && !isUsed;
            const isCursor = cursor.r === r && cursor.c === c;

            let borderStyle = '1px solid transparent';
            if (isCursor) {
              borderStyle = '2px solid #ffb700';
            } else if (isSelectable) {
              borderStyle = '1px solid #00f0ff';
            }

            return (
              <Button
                key={`${r}-${c}`}
                onClick={() => selectCell(r, c)}
                size="sm"
                isDisabled={isUsed || !isSelectable}
                variant={isSelectable ? 'solid' : 'ghost'}
                bg={
                  isCursor
                    ? 'rgba(255, 183, 0, 0.25)'
                    : isSelectable
                    ? 'rgba(0, 240, 255, 0.2)'
                    : isUsed
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'transparent'
                }
                border={borderStyle}
                boxShadow={isCursor ? '0 0 10px rgba(255, 183, 0, 0.5)' : 'none'}
                color={isUsed ? 'gray.700' : isCursor ? '#ffb700' : isSelectable ? '#00f0ff' : 'gray.400'}
                fontFamily="monospace"
                fontSize="xs"
              >
                {isUsed ? '--' : val}
              </Button>
            );
          })
        )}
      </SimpleGrid>

      <Text fontSize="3xs" color="gray.500" fontFamily="monospace" textAlign="center">
        Use ARROW KEYS to navigate & ENTER / SPACE to select
      </Text>
    </Box>
  );
};
