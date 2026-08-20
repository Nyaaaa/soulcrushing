import React from 'react';
import { Box, Flex, Text, VStack, HStack, Badge, Checkbox } from '@chakra-ui/react';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { MissionObjective } from '../game/missionData';

interface ObjectiveTrackerProps {
  objectives: MissionObjective[];
  missionTitle: string;
}

export const ObjectiveTracker: React.FC<ObjectiveTrackerProps> = ({ objectives, missionTitle }) => {
  const completedCount = objectives.filter((o) => o.completed).length;

  return (
    <Box
      p={3.5}
      bg="rgba(10, 12, 18, 0.95)"
      borderRadius="lg"
      border="1px solid rgba(0, 240, 255, 0.25)"
      boxShadow="0 0 15px rgba(0, 240, 255, 0.05)"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Flex alignItems="center" gap={2}>
          <Target size={16} color="#00f0ff" />
          <Text fontSize="xs" fontWeight="bold" letterSpacing="0.08em" color="#00f0ff" fontFamily="monospace">
            MISSION_OBJECTIVES // {missionTitle}
          </Text>
        </Flex>
        <Badge colorScheme="cyan" variant="solid" fontSize="2xs" px={2} borderRadius="full">
          {completedCount}/{objectives.length}
        </Badge>
      </Flex>

      <VStack align="stretch" spacing={2}>
        {objectives.map((obj) => (
          <Box
            key={obj.id}
            p={2}
            borderRadius="md"
            bg={obj.completed ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.02)'}
            border="1px solid"
            borderColor={obj.completed ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.06)'}
          >
            <HStack spacing={2} alignItems="flex-start">
              <Box mt={0.5}>
                {obj.completed ? (
                  <CheckCircle2 size={14} color="#00ff88" />
                ) : (
                  <Circle size={14} color="#718096" />
                )}
              </Box>
              <Box flex="1">
                <HStack justifyContent="space-between">
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={obj.completed ? '#00ff88' : '#e2e8f0'}
                    textDecoration={obj.completed ? 'line-through' : 'none'}
                    fontFamily="monospace"
                  >
                    {obj.title}
                  </Text>
                  {obj.optional && (
                    <Badge colorScheme="purple" fontSize="3xs">
                      OPTIONAL
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="2xs" color="gray.400" mt={0.5} lineHeight="1.3">
                  {obj.description}
                </Text>
              </Box>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};
