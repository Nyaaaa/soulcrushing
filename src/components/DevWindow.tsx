import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Flex,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Box,
  useToast,
} from '@chakra-ui/react';
import { Terminal, Wrench, Shield, Cpu, Radio, Zap, Coins, Skull, RefreshCw, Play, Flame } from 'lucide-react';
import { GameState } from '../game/commandParser';
import { PlayerInventoryUpgrades, UPGRADE_MAX_TIER } from '../game/marketData';
import { ActiveExploitSession } from './minigames/MinigameOverlay';
import { generateProceduralMission } from '../game/proceduralGenerator';
import { soundFx } from '../game/soundFx';

interface DevWindowProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  wallet: { credits: number; upgrades: PlayerInventoryUpgrades };
  setWallet: React.Dispatch<React.SetStateAction<{ credits: number; upgrades: PlayerInventoryUpgrades }>>;
  onLaunchMinigameTest?: (session: ActiveExploitSession) => void;
}

export const DevWindow: React.FC<DevWindowProps> = ({
  isOpen,
  onClose,
  gameState,
  setGameState,
  wallet,
  setWallet,
  onLaunchMinigameTest,
}) => {
  const toast = useToast();
  const [sandboxIceLevel, setSandboxIceLevel] = useState(1);

  const addCredits = (amount: number) => {
    soundFx.playAccessGranted();
    setWallet((prev) => ({ ...prev, credits: Math.max(0, prev.credits + amount) }));
    toast({
      title: 'DEV WALLET UPDATED',
      description: `${amount >= 0 ? '+' : ''}${amount.toLocaleString()} CR`,
      status: 'info',
      duration: 1500,
    });
  };

  const adjustUpgradeTier = (upgradeKey: keyof PlayerInventoryUpgrades, delta: number, maxTier: number) => {
    soundFx.playKeyClick();
    setWallet((prev) => {
      const current = prev.upgrades[upgradeKey] || 0;
      const next = Math.max(0, Math.min(maxTier, current + delta));
      return {
        ...prev,
        upgrades: {
          ...prev.upgrades,
          [upgradeKey]: next,
        },
      };
    });
  };

  const maxAllUpgrades = () => {
    soundFx.playAccessGranted();
    setWallet((prev) => ({
      ...prev,
      upgrades: { ...UPGRADE_MAX_TIER },
    }));
  };

  const resetAllUpgrades = () => {
    soundFx.playAccessDenied();
    setWallet((prev) => ({
      ...prev,
      upgrades: {
        stealth_cloak: 0,
        trace_purger: 0,
        cpu_overclock: 0,
        port_sniffer: 0,
        decryption_accel: 0,
      },
    }));
  };

  const revealAllNodes = () => {
    soundFx.playKeyClick();
    const allIps = gameState.mission.nodes.map((n) => n.ip);
    setGameState((prev) => ({ ...prev, discoveredNodeIps: allIps }));
    toast({ title: 'ALL NODES REVEALED', status: 'success', duration: 1500 });
  };

  const breachAllNodes = () => {
    soundFx.playBreach();
    const allIps = gameState.mission.nodes.map((n) => n.ip);
    setGameState((prev) => ({
      ...prev,
      discoveredNodeIps: allIps,
      breachedNodeIps: allIps,
    }));
    toast({ title: 'ALL NODES BREACHED', status: 'success', duration: 1500 });
  };

  const setTrace = (val: number) => {
    soundFx.playKeyClick();
    setGameState((prev) => ({
      ...prev,
      trace: val,
      isTraced: val >= 100,
    }));
  };

  const generateNewMission = () => {
    soundFx.playAccessGranted();
    const newM = generateProceduralMission();
    setGameState((prev) => ({
      ...prev,
      mission: newM,
      activeNodeIp: null,
      discoveredNodeIps: [newM.nodes[0].ip],
      breachedNodeIps: [],
      trace: 0,
      isTraced: false,
      isCompleted: false,
      timeElapsedSeconds: 0,
      inventory: { ...prev.inventory, keys: [], downloadedFiles: [] },
    }));
    toast({ title: 'NEW PROCEDURAL CONTRACT GENERATED', status: 'info', duration: 2000 });
  };

  const testMinigame = (exploit: ActiveExploitSession['exploit'], iceLevel: number) => {
    if (onLaunchMinigameTest) {
      onLaunchMinigameTest({
        targetIp: '127.0.0.1',
        targetHostname: 'sandbox-test.local',
        exploit,
        port: 8080,
        iceLevel,
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay bg="rgba(0, 0, 0, 0.85)" backdropFilter="blur(6px)" />
      <ModalContent
        bg="rgba(12, 16, 26, 0.98)"
        border="1px solid #ffb700"
        boxShadow="0 0 40px rgba(255, 183, 0, 0.2)"
        borderRadius="xl"
        color="#e2e8f0"
      >
        <ModalHeader borderBottom="1px solid rgba(255, 183, 0, 0.2)" pb={3}>
          <Flex justifyContent="space-between" alignItems="center">
            <HStack spacing={2.5}>
              <Wrench size={20} color="#ffb700" />
              <Text fontSize="sm" fontFamily="monospace" color="#ffb700" fontWeight="bold">
                CYBERDECK_DEBUG_WINDOW // DEV_TOOLS
              </Text>
            </HStack>
            <Badge colorScheme="yellow" fontSize="3xs" px={2}>
              DEVELOPER MODE ACTIVE
            </Badge>
          </Flex>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />

        <ModalBody py={5}>
          <VStack align="stretch" spacing={5}>
            {/* Section 1: Wallet & Currency */}
            <Box p={3.5} bg="rgba(0, 0, 0, 0.4)" borderRadius="lg" border="1px solid rgba(255, 183, 0, 0.2)">
              <Flex justifyContent="space-between" alignItems="center" mb={3}>
                <HStack spacing={2}>
                  <Coins size={16} color="#ffb700" />
                  <Text fontSize="xs" fontWeight="bold" fontFamily="monospace" color="#ffb700">
                    OPERATIVE WALLET: {wallet.credits.toLocaleString()} CR
                  </Text>
                </HStack>
              </Flex>

              <HStack spacing={2} flexWrap="wrap">
                <Button size="xs" colorScheme="yellow" variant="outline" onClick={() => addCredits(1000)}>
                  +1,000 CR
                </Button>
                <Button size="xs" colorScheme="yellow" variant="outline" onClick={() => addCredits(10000)}>
                  +10,000 CR
                </Button>
                <Button size="xs" colorScheme="yellow" variant="outline" onClick={() => addCredits(50000)}>
                  +50,000 CR
                </Button>
                <Button size="xs" colorScheme="red" variant="ghost" onClick={() => setWallet((p) => ({ ...p, credits: 0 }))}>
                  Reset to 0
                </Button>
              </HStack>
            </Box>

            {/* Section 2: Hardware Upgrades Tier Tuner */}
            <Box p={3.5} bg="rgba(0, 0, 0, 0.4)" borderRadius="lg" border="1px solid rgba(0, 240, 255, 0.2)">
              <Flex justifyContent="space-between" alignItems="center" mb={3}>
                <HStack spacing={2}>
                  <Cpu size={16} color="#00f0ff" />
                  <Text fontSize="xs" fontWeight="bold" fontFamily="monospace" color="#00f0ff">
                    CYBERDECK HARDWARE MODULES (UPGRADE / DOWNGRADE)
                  </Text>
                </HStack>
                <HStack spacing={1}>
                  <Button size="2xs" colorScheme="teal" variant="outline" onClick={maxAllUpgrades}>
                    MAX ALL
                  </Button>
                  <Button size="2xs" colorScheme="red" variant="outline" onClick={resetAllUpgrades}>
                    RESET ALL
                  </Button>
                </HStack>
              </Flex>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                {[
                  { key: 'stealth_cloak', name: 'Stealth Cloak', icon: <Shield size={14} color="#00ff88" /> },
                  { key: 'trace_purger', name: 'Log Scrubber', icon: <Flame size={14} color="#ff8800" /> },
                  { key: 'cpu_overclock', name: 'CPU Overclock', icon: <Cpu size={14} color="#00f0ff" /> },
                  { key: 'port_sniffer', name: 'Port Sniffer', icon: <Radio size={14} color="#ffb700" /> },
                  { key: 'decryption_accel', name: 'Decryption Accel', icon: <Zap size={14} color="#d946ef" /> },
                ].map((item) => {
                  const maxTier = UPGRADE_MAX_TIER[item.key as keyof PlayerInventoryUpgrades];
                  const currentTier = wallet.upgrades[item.key as keyof PlayerInventoryUpgrades] || 0;
                  return (
                    <Flex
                      key={item.key}
                      p={2}
                      bg="rgba(255, 255, 255, 0.03)"
                      borderRadius="md"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <HStack spacing={2}>
                        {item.icon}
                        <Box>
                          <Text fontSize="2xs" fontFamily="monospace" fontWeight="bold">
                            {item.name}
                          </Text>
                          <Text fontSize="3xs" color="cyan.400" fontFamily="monospace">
                            Tier {currentTier} / {maxTier}
                          </Text>
                        </Box>
                      </HStack>

                      <HStack spacing={1}>
                        <Button
                          size="xs"
                          w="24px"
                          h="24px"
                          minW="24px"
                          isDisabled={currentTier <= 0}
                          onClick={() => adjustUpgradeTier(item.key as keyof PlayerInventoryUpgrades, -1, maxTier)}
                        >
                          -
                        </Button>
                        <Button
                          size="xs"
                          w="24px"
                          h="24px"
                          minW="24px"
                          colorScheme="teal"
                          isDisabled={currentTier >= maxTier}
                          onClick={() => adjustUpgradeTier(item.key as keyof PlayerInventoryUpgrades, 1, maxTier)}
                        >
                          +
                        </Button>
                      </HStack>
                    </Flex>
                  );
                })}
              </SimpleGrid>
            </Box>

            {/* Section 3: Incursion & Network Cheats */}
            <Box p={3.5} bg="rgba(0, 0, 0, 0.4)" borderRadius="lg" border="1px solid rgba(255, 0, 85, 0.2)">
              <Text fontSize="xs" fontWeight="bold" fontFamily="monospace" color="#ff0055" mb={3}>
                NETWORK & INCURSION CHEATS
              </Text>
              <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2} mb={3}>
                <Button size="xs" colorScheme="cyan" variant="outline" onClick={revealAllNodes}>
                  Reveal All Nodes
                </Button>
                <Button size="xs" colorScheme="green" variant="outline" onClick={breachAllNodes}>
                  Breach All Nodes
                </Button>
                <Button size="xs" colorScheme="purple" variant="outline" onClick={generateNewMission}>
                  New Incursion
                </Button>
              </SimpleGrid>

              <HStack spacing={2} fontSize="2xs" fontFamily="monospace" color="gray.400">
                <Text>Trace Set:</Text>
                <Button size="2xs" colorScheme="green" onClick={() => setTrace(0)}>
                  0% (Clear)
                </Button>
                <Button size="2xs" colorScheme="yellow" onClick={() => setTrace(50)}>
                  50%
                </Button>
                <Button size="2xs" colorScheme="red" onClick={() => setTrace(95)}>
                  95% (Warning)
                </Button>
                <Button size="2xs" colorScheme="red" variant="solid" onClick={() => setTrace(100)}>
                  100% (Kill)
                </Button>
              </HStack>
            </Box>

            {/* Section 4: Minigame Direct Launcher Sandbox */}
            <Box p={3.5} bg="rgba(0, 0, 0, 0.4)" borderRadius="lg" border="1px solid rgba(255, 255, 255, 0.15)">
              <Flex justifyContent="space-between" alignItems="center" mb={3}>
                <Text fontSize="xs" fontWeight="bold" fontFamily="monospace" color="purple.300">
                  MINIGAME SANDBOX LAUNCHER (TEST ANY PUZZLE)
                </Text>
                <HStack spacing={1}>
                  <Text fontSize="3xs" color="gray.400" fontFamily="monospace" mr={1}>
                    ICE:
                  </Text>
                  {[1, 2, 3].map((tier) => (
                    <Button
                      key={tier}
                      size="2xs"
                      colorScheme="purple"
                      variant={sandboxIceLevel === tier ? 'solid' : 'outline'}
                      onClick={() => setSandboxIceLevel(tier)}
                    >
                      {tier}
                    </Button>
                  ))}
                </HStack>
              </Flex>
              <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={2}>
                <Button
                  size="xs"
                  colorScheme="purple"
                  leftIcon={<Play size={12} />}
                  onClick={() => testMinigame('port_brute', sandboxIceLevel)}
                >
                  Port Brute
                </Button>
                <Button
                  size="xs"
                  colorScheme="purple"
                  leftIcon={<Play size={12} />}
                  onClick={() => testMinigame('buffer_overflow', sandboxIceLevel)}
                >
                  Buffer Overflow
                </Button>
                <Button
                  size="xs"
                  colorScheme="purple"
                  leftIcon={<Play size={12} />}
                  onClick={() => testMinigame('cipher_bypass', sandboxIceLevel)}
                >
                  Cipher Bypass
                </Button>
                <Button
                  size="xs"
                  colorScheme="purple"
                  leftIcon={<Play size={12} />}
                  onClick={() => testMinigame('sentry_overload', sandboxIceLevel)}
                >
                  Sentry Overload
                </Button>
              </SimpleGrid>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
