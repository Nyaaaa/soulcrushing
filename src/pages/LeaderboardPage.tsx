import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  Button,
  Input,
  useToast,
} from '@chakra-ui/react';
import { Trophy, Clock, Zap, Shield, User, Award } from 'lucide-react';
import { GameState } from '../game/commandParser';

interface LeaderboardItem {
  id: string;
  playerHandle: string;
  missionId: string;
  completionTimeSeconds: number;
  tracePercent: number;
  score: number;
  createdAt: string;
}

interface LeaderboardPageProps {
  gameState: GameState;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ gameState }) => {
  const [scores, setScores] = useState<LeaderboardItem[]>([]);
  const [handle, setHandle] = useState('OPERATIVE_ALPHA');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const fetchScores = () => {
    fetch('/api/game/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setScores(data);
      })
      .catch(() => {
        // Mock fallback if offline
        setScores([
          {
            id: 'mock_1',
            playerHandle: 'ZERO_COOL',
            missionId: 'null_dawn',
            completionTimeSeconds: 42,
            tracePercent: 12,
            score: 18450,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'mock_2',
            playerHandle: 'ACID_BURN',
            missionId: 'null_dawn',
            completionTimeSeconds: 58,
            tracePercent: 24,
            score: 15200,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'mock_3',
            playerHandle: 'GIBSON_PHANTOM',
            missionId: 'null_dawn',
            completionTimeSeconds: 84,
            tracePercent: 45,
            score: 12100,
            createdAt: new Date().toISOString(),
          },
        ]);
      });
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleSubmitScore = () => {
    if (!gameState.isCompleted) {
      toast({
        title: 'Mission Incomplete',
        description: 'Complete Operation Null-Dawn before transmitting your metrics.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    const calculatedScore = Math.max(
      1000,
      20000 - gameState.timeElapsedSeconds * 50 - gameState.trace * 100
    );

    fetch('/api/game/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerHandle: handle.toUpperCase().trim() || 'ANON_OPERATIVE',
        missionId: gameState.mission.id,
        completionTimeSeconds: gameState.timeElapsedSeconds || 65,
        tracePercent: gameState.trace,
        score: calculatedScore,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        toast({
          title: 'Score Broadcasted',
          description: `Score ${calculatedScore} points logged to operative network!`,
          status: 'success',
          duration: 4000,
        });
        fetchScores();
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box
      h="100%"
      w="100%"
      overflowY="auto"
      overflowX="hidden"
      p={6}
      pb={16}
      css={{
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-track': { background: 'rgba(10, 12, 18, 0.9)' },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(0, 240, 255, 0.3)', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0, 240, 255, 0.6)' },
      }}
    >
      <Box maxW="1200px" mx="auto">
      <Box mb={8}>
        <HStack spacing={3} mb={2}>
          <Trophy size={24} color="#00f0ff" />
          <Heading size="lg" color="#00f0ff" fontFamily="monospace" letterSpacing="0.05em">
            GLOBAL_OPERATIVE_LEADERBOARD
          </Heading>
        </HStack>
        <Text color="gray.400" fontSize="sm" fontFamily="monospace">
          Hall of fame rankings for the fastest and most stealthy intrusion operatives.
        </Text>
      </Box>

      {/* Submit Current Run Banner */}
      {gameState.isCompleted && (
        <Box
          p={4}
          mb={8}
          bg="rgba(0, 255, 136, 0.08)"
          borderRadius="lg"
          border="1px solid #00ff88"
          boxShadow="0 0 20px rgba(0, 255, 136, 0.2)"
        >
          <HStack justifyContent="space-between" flexWrap="wrap" gap={4}>
            <VStack align="flex-start" spacing={1}>
              <HStack>
                <Award size={18} color="#00ff88" />
                <Text fontWeight="bold" color="#00ff88" fontFamily="monospace" fontSize="sm">
                  OPERATION NULL-DAWN VICTORY DETECTED!
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.300" fontFamily="monospace">
                Time: {gameState.timeElapsedSeconds}s | Final Trace: {gameState.trace}% | Stealth Rating: A+
              </Text>
            </VStack>

            <HStack spacing={3}>
              <Input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="OPERATIVE HANDLE"
                size="sm"
                bg="rgba(0, 0, 0, 0.4)"
                border="1px solid #00ff88"
                color="#ffffff"
                fontFamily="monospace"
                w="180px"
              />
              <Button
                colorScheme="green"
                size="sm"
                fontFamily="monospace"
                onClick={handleSubmitScore}
                isLoading={loading}
              >
                SUBMIT METRICS
              </Button>
            </HStack>
          </HStack>
        </Box>
      )}

      {/* Leaderboard Table */}
      <Box
        bg="rgba(10, 12, 18, 0.95)"
        borderRadius="lg"
        border="1px solid rgba(0, 240, 255, 0.25)"
        boxShadow="0 0 25px rgba(0, 240, 255, 0.08)"
        overflowX="auto"
      >
        <Table variant="simple" size="md">
          <Thead bg="rgba(16, 20, 30, 0.9)">
            <Tr>
              <Th color="#00f0ff" fontFamily="monospace">RANK</Th>
              <Th color="#00f0ff" fontFamily="monospace">OPERATIVE</Th>
              <Th color="#00f0ff" fontFamily="monospace">OPERATION</Th>
              <Th color="#00f0ff" fontFamily="monospace">BREACH TIME</Th>
              <Th color="#00f0ff" fontFamily="monospace">HEAT %</Th>
              <Th color="#00f0ff" fontFamily="monospace" isNumeric>SCORE BOUNTY</Th>
            </Tr>
          </Thead>
          <Tbody>
            {scores.map((s, idx) => (
              <Tr key={s.id} _hover={{ bg: 'rgba(0, 240, 255, 0.04)' }}>
                <Td fontFamily="monospace" fontWeight="bold" color={idx === 0 ? '#ffb700' : idx === 1 ? '#00f0ff' : '#e2e8f0'}>
                  #{idx + 1}
                </Td>
                <Td fontFamily="monospace" fontWeight="bold" color="#ffffff">
                  {s.playerHandle}
                </Td>
                <Td fontFamily="monospace" color="gray.400">
                  {s.missionId.toUpperCase()}
                </Td>
                <Td fontFamily="monospace" color="#00f0ff">
                  {s.completionTimeSeconds}s
                </Td>
                <Td fontFamily="monospace">
                  <Badge colorScheme={s.tracePercent > 50 ? 'red' : 'green'} fontSize="2xs">
                    {s.tracePercent}%
                  </Badge>
                </Td>
                <Td fontFamily="monospace" fontWeight="bold" color="#00ff88" isNumeric>
                  {s.score.toLocaleString()} PTS
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      </Box>
    </Box>
  );
};
