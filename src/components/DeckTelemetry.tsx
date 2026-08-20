import React from 'react';
import { Box, Flex, Text, VStack, HStack, Badge, Tag, TagLabel } from '@chakra-ui/react';
import { Cpu, Key, FileText, Lock, Unlock } from 'lucide-react';
import { GameState } from '../game/commandParser';

interface DeckTelemetryProps {
  gameState: GameState;
}

export const DeckTelemetry: React.FC<DeckTelemetryProps> = ({ gameState }) => {
  const { inventory } = gameState;

  return (
    <Box
      p={3.5}
      bg="rgba(10, 12, 18, 0.95)"
      borderRadius="lg"
      border="1px solid rgba(0, 240, 255, 0.25)"
      boxShadow="0 0 15px rgba(0, 240, 255, 0.05)"
    >
      <Flex alignItems="center" gap={2} mb={3}>
        <Cpu size={16} color="#00f0ff" />
        <Text fontSize="xs" fontWeight="bold" letterSpacing="0.08em" color="#00f0ff" fontFamily="monospace">
          CYBERDECK_MODULES & DATA_LOOT
        </Text>
      </Flex>

      <VStack spacing={3} align="stretch">
        {/* Exploits */}
        <Box>
          <Text fontSize="2xs" color="gray.400" fontWeight="bold" mb={1} fontFamily="monospace">
            INSTALLED EXPLOIT CHIPS:
          </Text>
          <Flex wrap="wrap" gap={1.5}>
            {inventory.exploits.map((e) => (
              <Tag
                key={e}
                size="sm"
                variant="subtle"
                bg="rgba(0, 240, 255, 0.1)"
                color="#00f0ff"
                border="1px solid rgba(0, 240, 255, 0.2)"
                fontFamily="monospace"
                fontSize="2xs"
              >
                <TagLabel>{e}</TagLabel>
              </Tag>
            ))}
          </Flex>
        </Box>

        {/* Keyring */}
        <Box>
          <Text fontSize="2xs" color="gray.400" fontWeight="bold" mb={1} fontFamily="monospace">
            CIPHER KEYRING:
          </Text>
          {inventory.keys.length === 0 ? (
            <Text fontSize="2xs" color="gray.600" fontStyle="italic">
              No cipher keys acquired yet
            </Text>
          ) : (
            <Flex wrap="wrap" gap={1.5}>
              {inventory.keys.map((k) => (
                <HStack
                  key={k}
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  bg="rgba(0, 255, 136, 0.1)"
                  border="1px solid #00ff88"
                  color="#00ff88"
                  fontSize="2xs"
                  fontFamily="monospace"
                >
                  <Key size={12} />
                  <Text>{k}</Text>
                </HStack>
              ))}
            </Flex>
          )}
        </Box>

        {/* Exfiltrated Files */}
        <Box>
          <Text fontSize="2xs" color="gray.400" fontWeight="bold" mb={1} fontFamily="monospace">
            EXFILTRATED LOOT (/cyberdeck/loot/):
          </Text>
          {inventory.downloadedFiles.length === 0 ? (
            <Text fontSize="2xs" color="gray.600" fontStyle="italic">
              No files exfiltrated yet
            </Text>
          ) : (
            <VStack align="stretch" spacing={1}>
              {inventory.downloadedFiles.map((file) => (
                <Flex
                  key={file.name}
                  justifyContent="space-between"
                  alignItems="center"
                  p={1.5}
                  borderRadius="sm"
                  bg="rgba(255, 255, 255, 0.03)"
                  border="1px solid rgba(255, 255, 255, 0.08)"
                  fontSize="2xs"
                  fontFamily="monospace"
                >
                  <HStack spacing={1.5}>
                    <FileText size={12} color="#00f0ff" />
                    <Text color="#e2e8f0">{file.name}</Text>
                  </HStack>
                  <Badge
                    colorScheme={file.decrypted ? 'green' : 'red'}
                    variant="subtle"
                    fontSize="3xs"
                    px={1.5}
                  >
                    {file.decrypted ? 'DECRYPTED' : 'ENCRYPTED'}
                  </Badge>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};
