import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Badge,
  Button,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Shield, Target, Clock, Coins, Terminal, ArrowRight } from 'lucide-react';
import { MISSIONS } from '../game/missionData';
import { generateProceduralMission } from '../game/proceduralGenerator';
import { GameState } from '../game/commandParser';
import { soundFx } from '../game/soundFx';

interface MissionsPageProps {
  setGameState?: React.Dispatch<React.SetStateAction<GameState>>;
}

export const MissionsPage: React.FC<MissionsPageProps> = ({ setGameState }) => {
  const navigate = useNavigate();

  const handleGenerateIncursion = () => {
    soundFx.playAccessGranted();
    const newMission = generateProceduralMission();
    if (setGameState) {
      setGameState((prev) => ({
        ...prev,
        mission: newMission,
        activeNodeIp: null,
        discoveredNodeIps: [newMission.nodes[0].ip],
        breachedNodeIps: [],
        trace: 0,
        isTraced: false,
        isCompleted: false,
        timeElapsedSeconds: 0,
        inventory: {
          ...prev.inventory,
          keys: [],
          downloadedFiles: [],
        },
        terminalLogs: [
          ...prev.terminalLogs,
          {
            id: `inc_${Date.now()}`,
            type: 'system',
            text: `*** CONTRACT LOADED: ${newMission.title} [Target: ${newMission.targetCorp} (${newMission.targetSubnet})] ***`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          },
        ],
      }));
    }
    navigate('/');
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
      <Box maxW="1400px" mx="auto">
      <Flex justifyContent="space-between" alignItems="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <HStack spacing={3} mb={2}>
            <Shield size={24} color="#00f0ff" />
            <Heading size="lg" color="#00f0ff" fontFamily="monospace" letterSpacing="0.05em">
              OPERATION_DOSSIERS // AVAILABLE_CONTRACTS
            </Heading>
          </HStack>
          <Text color="gray.400" fontSize="sm" fontFamily="monospace">
            Select a covert corporate infiltration target or generate an endless procedural contract.
          </Text>
        </Box>

        <Button
          leftIcon={<Target size={16} />}
          colorScheme="purple"
          bg="purple.600"
          _hover={{ bg: 'purple.500' }}
          fontFamily="monospace"
          fontSize="xs"
          onClick={handleGenerateIncursion}
        >
          GENERATE PROCEDURAL INCURSION
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {MISSIONS.map((m) => (
          <Box
            key={m.id}
            p={6}
            bg="rgba(10, 12, 18, 0.95)"
            borderRadius="lg"
            border="1px solid rgba(0, 240, 255, 0.3)"
            boxShadow="0 0 25px rgba(0, 240, 255, 0.08)"
            position="relative"
            overflow="hidden"
          >
            {/* Header Badge */}
            <Flex justifyContent="space-between" alignItems="center" mb={4}>
              <Badge colorScheme="purple" fontSize="xs" px={2.5} py={0.5} borderRadius="full">
                {m.codename}
              </Badge>
              <Badge
                colorScheme={m.difficulty === 'Amber' ? 'yellow' : 'red'}
                fontSize="xs"
                px={2.5}
                py={0.5}
                borderRadius="full"
              >
                DIFFICULTY: {m.difficulty}
              </Badge>
            </Flex>

            <Heading size="md" color="#ffffff" fontFamily="monospace" mb={2}>
              {m.title}
            </Heading>
            <Text color="cyan.300" fontSize="xs" fontWeight="bold" fontFamily="monospace" mb={4}>
              TARGET CORP: {m.targetCorp} [{m.targetSubnet}]
            </Text>

            <Divider borderColor="rgba(255, 255, 255, 0.1)" mb={4} />

            {/* Briefing text */}
            <VStack align="stretch" spacing={2} mb={6} bg="rgba(0, 0, 0, 0.3)" p={3.5} borderRadius="md">
              {m.briefing.map((b, i) => (
                <Text key={i} fontSize="xs" color="gray.300" fontFamily="monospace" lineHeight="1.4">
                  {b}
                </Text>
              ))}
            </VStack>

            {/* Stats */}
            <HStack spacing={6} mb={6} fontSize="xs" color="gray.400" fontFamily="monospace">
              <HStack spacing={1.5}>
                <Coins size={16} color="#ffb700" />
                <Text>
                  BOUNTY: <span style={{ color: '#ffb700', fontWeight: 'bold' }}>{m.reward.toLocaleString()} CR</span>
                </Text>
              </HStack>
              <HStack spacing={1.5}>
                <Clock size={16} color="#00f0ff" />
                <Text>
                  TRACE LIMIT: <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{m.timeLimitSeconds}s</span>
                </Text>
              </HStack>
              <HStack spacing={1.5}>
                <Target size={16} color="#00ff88" />
                <Text>
                  NODES: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{m.nodes.length} Target Vectors</span>
                </Text>
              </HStack>
            </HStack>

            {/* Deploy Button */}
            <Button
              rightIcon={<ArrowRight size={16} />}
              colorScheme="teal"
              bg="#00f0ff"
              color="#000000"
              fontWeight="bold"
              fontFamily="monospace"
              fontSize="sm"
              w="100%"
              _hover={{ bg: '#38bdf8', transform: 'translateY(-1px)' }}
              onClick={() => navigate('/')}
            >
              DEPLOY CYBERDECK UPLINK
            </Button>
          </Box>
        ))}
      </SimpleGrid>
      </Box>
    </Box>
  );
};
