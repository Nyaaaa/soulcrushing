import React from 'react';
import { Box, Flex, Text, Badge, Tooltip } from '@chakra-ui/react';
import { Network as NetworkIcon, Server, Shield, Database, Eye } from 'lucide-react';
import { GameState, executeCommand } from '../game/commandParser';

interface NetworkMapProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

// Computes the point on the rectangular border of 'from' facing 'to'
function getBorderIntersection(
  from: { x: number; y: number },
  to: { x: number; y: number },
  hw = 6.8, // half-width of node box in %
  hh = 12.5 // half-height of node box in %
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return { x: from.x, y: from.y };

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx * hh > absDy * hw) {
    // Intersects left or right edge
    const scale = hw / absDx;
    return {
      x: from.x + Math.sign(dx) * hw,
      y: from.y + dy * scale,
    };
  } else {
    // Intersects top or bottom edge
    const scale = hh / absDy;
    return {
      x: from.x + dx * scale,
      y: from.y + Math.sign(dy) * hh,
    };
  }
}

export const NetworkMap: React.FC<NetworkMapProps> = ({ gameState, setGameState }) => {
  const nodes = gameState.mission.nodes;

  const getNodeIcon = (type: string, size = 16) => {
    switch (type) {
      case 'gateway':
        return <NetworkIcon size={size} />;
      case 'proxy':
        return <Shield size={size} />;
      case 'database':
        return <Database size={size} />;
      case 'sentry':
        return <Eye size={size} />;
      default:
        return <Server size={size} />;
    }
  };

  const handleNodeClick = (ip: string) => {
    if (!gameState.discoveredNodeIps.includes(ip)) return;
    if (gameState.breachedNodeIps.includes(ip)) {
      executeCommand(`connect ${ip}`, gameState, setGameState);
    } else {
      executeCommand(`probe ${ip}`, gameState, setGameState);
    }
  };

  return (
    <Box
      h="100%"
      display="flex"
      flexDirection="column"
      bg="rgba(10, 12, 18, 0.95)"
      borderRadius="lg"
      border="1px solid rgba(0, 240, 255, 0.25)"
      boxShadow="0 0 25px rgba(0, 240, 255, 0.08)"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        px={4}
        py={2.5}
        bg="rgba(16, 20, 30, 0.9)"
        borderBottom="1px solid rgba(0, 240, 255, 0.2)"
        alignItems="center"
        justifyContent="space-between"
      >
        <Flex alignItems="center" gap={2}>
          <NetworkIcon size={16} color="#00f0ff" />
          <Text fontSize="xs" fontWeight="bold" letterSpacing="0.1em" color="#00f0ff" fontFamily="monospace">
            TOPOLOGY_GRAPH // {gameState.mission.targetSubnet}
          </Text>
        </Flex>
        <Badge colorScheme="cyan" variant="subtle" fontSize="2xs">
          {gameState.breachedNodeIps.length}/{nodes.length} BREACHED
        </Badge>
      </Flex>

      {/* SVG Canvas & Node Overlay */}
      <Box flex="1" position="relative" p={4} minH="220px">
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ff0055" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {/* Connection Lines (border-to-border) */}
          {nodes.map((node) =>
            node.connectedTo.map((targetId) => {
              const targetNode = nodes.find((n) => n.id === targetId);
              if (!targetNode) return null;

              const isVisible =
                gameState.discoveredNodeIps.includes(node.ip) &&
                gameState.discoveredNodeIps.includes(targetNode.ip);

              if (!isVisible) return null;

              const isBreachedLine =
                gameState.breachedNodeIps.includes(node.ip) &&
                gameState.breachedNodeIps.includes(targetNode.ip);

              const p1 = getBorderIntersection(node.coordinates, targetNode.coordinates);
              const p2 = getBorderIntersection(targetNode.coordinates, node.coordinates);

              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={`${p1.x}%`}
                  y1={`${p1.y}%`}
                  x2={`${p2.x}%`}
                  y2={`${p2.y}%`}
                  stroke={isBreachedLine ? '#00ff88' : 'rgba(0, 240, 255, 0.4)'}
                  strokeWidth={isBreachedLine ? '2' : '1.5'}
                  strokeDasharray={isBreachedLine ? 'none' : '4 4'}
                  filter={isBreachedLine ? 'drop-shadow(0px 0px 4px #00ff88)' : 'none'}
                />
              );
            })
          )}
        </svg>

        {/* Node Cards */}
        {nodes.map((node) => {
          const isDiscovered = gameState.discoveredNodeIps.includes(node.ip);
          const isBreached = gameState.breachedNodeIps.includes(node.ip);
          const isActive = gameState.activeNodeIp === node.ip;

          let borderColor = 'rgba(255, 255, 255, 0.15)';
          let bgColor = '#090c14';
          let textColor = '#718096';
          let glow = 'none';

          if (isDiscovered) {
            borderColor = 'rgba(0, 240, 255, 0.5)';
            textColor = '#00f0ff';
            bgColor = '#09131a';
            if (isBreached) {
              borderColor = '#00ff88';
              bgColor = '#071712';
              textColor = '#00ff88';
              glow = '0 0 16px rgba(0, 255, 136, 0.35)';
            }
            if (isActive) {
              borderColor = '#00f0ff';
              bgColor = '#061924';
              glow = '0 0 20px rgba(0, 240, 255, 0.8)';
            }
          }

          return (
            <Tooltip
              key={node.id}
              label={
                isDiscovered
                  ? `${node.hostname} (${node.ip}) - ${isBreached ? 'BREACHED (Click to Connect)' : 'Click to Probe'}`
                  : 'UNKNOWN NODE (Scan required)'
              }
              bg="rgba(10, 12, 18, 0.95)"
              color="#00f0ff"
              border="1px solid rgba(0, 240, 255, 0.4)"
              fontSize="xs"
              borderRadius="md"
            >
              <Box
                position="absolute"
                left={`${node.coordinates.x}%`}
                top={`${node.coordinates.y}%`}
                transform="translate(-50%, -50%)"
                zIndex={2}
                p={2.5}
                borderRadius="lg"
                bg={bgColor}
                border="2px solid"
                borderColor={borderColor}
                boxShadow={glow}
                cursor={isDiscovered ? 'pointer' : 'not-allowed'}
                onClick={() => handleNodeClick(node.ip)}
                transition="all 0.2s ease"
                _hover={{
                  transform: 'translate(-50%, -50%) scale(1.08)',
                  borderColor: isDiscovered ? '#00f0ff' : borderColor,
                }}
                textAlign="center"
              >
                <Flex justifyContent="center" color={textColor} mb={1}>
                  {getNodeIcon(node.type, 18)}
                </Flex>
                <Text
                  fontSize="2xs"
                  fontFamily="monospace"
                  fontWeight="bold"
                  color={textColor}
                  whiteSpace="nowrap"
                >
                  {isDiscovered ? node.hostname.split('.')[0] : '???'}
                </Text>
                <Text fontSize="3xs" color="gray.500" fontFamily="monospace">
                  {isDiscovered ? node.ip : '?.?.?.?'}
                </Text>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};
