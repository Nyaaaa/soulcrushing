import React from 'react';
import { Box, Flex, HStack, Text, Button, Badge } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Terminal, Shield, Trophy, Activity, ShoppingCart, Coins, Wrench } from 'lucide-react';

interface NavbarProps {
  credits?: number;
  onOpenDevWindow?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ credits, onOpenDevWindow }) => {
  const location = useLocation();

  const navItems = [
    { label: 'CYBERDECK HUD', path: '/', icon: <Terminal size={15} /> },
    { label: 'MISSIONS DOSSIER', path: '/missions', icon: <Shield size={15} /> },
    { label: 'BLACK MARKET', path: '/market', icon: <ShoppingCart size={15} /> },
    { label: 'LEADERBOARD', path: '/leaderboard', icon: <Trophy size={15} /> },
  ];

  return (
    <Box
      as="header"
      bg="rgba(8, 10, 15, 0.98)"
      borderBottom="1px solid rgba(0, 240, 255, 0.3)"
      boxShadow="0 0 20px rgba(0, 240, 255, 0.1)"
      px={6}
      py={3}
      position="sticky"
      top={0}
      zIndex={100}
    >
      <Flex justifyContent="space-between" alignItems="center" maxW="1800px" mx="auto">
        {/* Brand / Logo */}
        <HStack spacing={3}>
          <Box
            p={1.5}
            borderRadius="md"
            bg="rgba(0, 240, 255, 0.1)"
            border="1px solid rgba(0, 240, 255, 0.4)"
          >
            <Activity size={18} color="#00f0ff" />
          </Box>
          <Box>
            <Text
              fontSize="sm"
              fontWeight="900"
              letterSpacing="0.15em"
              color="#00f0ff"
              fontFamily="'JetBrains Mono', monospace"
              textShadow="0 0 10px rgba(0, 240, 255, 0.6)"
            >
              SOULCRUSHING
            </Text>
            <Text fontSize="3xs" color="gray.400" letterSpacing="0.1em" fontFamily="monospace">
              CYBERDECK_INTRUSION_SIM v4.2
            </Text>
          </Box>
        </HStack>

        {/* Navigation Tabs */}
        <HStack spacing={2}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                as={RouterLink}
                to={item.path}
                leftIcon={item.icon}
                size="sm"
                variant="ghost"
                fontFamily="monospace"
                fontSize="xs"
                letterSpacing="0.05em"
                color={isActive ? '#00f0ff' : 'gray.400'}
                bg={isActive ? 'rgba(0, 240, 255, 0.12)' : 'transparent'}
                border="1px solid"
                borderColor={isActive ? 'rgba(0, 240, 255, 0.4)' : 'transparent'}
                boxShadow={isActive ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none'}
                _hover={{
                  color: '#00f0ff',
                  bg: 'rgba(0, 240, 255, 0.08)',
                  borderColor: 'rgba(0, 240, 255, 0.3)',
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </HStack>

        {/* Operative Telemetry Status & Dev Button */}
        <HStack spacing={3} display={{ base: 'none', md: 'flex' }}>
          {typeof credits === 'number' && (
            <HStack
              px={2.5}
              py={0.5}
              borderRadius="md"
              bg="rgba(255, 183, 0, 0.1)"
              border="1px solid #ffb700"
              color="#ffb700"
              fontSize="2xs"
              fontFamily="monospace"
              fontWeight="bold"
            >
              <Coins size={13} color="#ffb700" />
              <Text>{credits.toLocaleString()} CR</Text>
            </HStack>
          )}

          {onOpenDevWindow && (
            <Button
              leftIcon={<Wrench size={13} />}
              size="xs"
              colorScheme="yellow"
              variant="outline"
              fontFamily="monospace"
              fontSize="2xs"
              onClick={onOpenDevWindow}
              title="Toggle Dev Window (~ or F2)"
            >
              DEV TOOLS [~]
            </Button>
          )}

          <Badge colorScheme="purple" variant="outline" fontSize="2xs" px={2} py={0.5} fontFamily="monospace">
            OP: OPERATIVE_ALPHA
          </Badge>
          <Badge colorScheme="green" variant="solid" fontSize="2xs" px={2} py={0.5} fontFamily="monospace">
            UPLINK SECURE
          </Badge>
        </HStack>
      </Flex>
    </Box>
  );
};
