import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Badge,
  HStack,
  VStack,
  Flex,
  Divider,
  useToast,
  Progress,
} from '@chakra-ui/react';
import { ShoppingCart, Shield, Cpu, Radio, Zap, Coins, Check, ArrowRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CYBERDECK_UPGRADES, PlayerInventoryUpgrades, DEFAULT_PLAYER_UPGRADES } from '../game/marketData';
import { soundFx } from '../game/soundFx';

interface MarketPageProps {
  wallet: { credits: number; upgrades: PlayerInventoryUpgrades };
  setWallet: React.Dispatch<React.SetStateAction<{ credits: number; upgrades: PlayerInventoryUpgrades }>>;
}

export const MarketPage: React.FC<MarketPageProps> = ({ wallet, setWallet }) => {
  const [loadingUpgrade, setLoadingUpgrade] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchWallet = () => {
    fetch('/api/game/market')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.credits === 'number') {
          setWallet(data);
        }
      })
      .catch(() => {
        // Fallback to local state
      });
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const getUpgradeIcon = (cat: string) => {
    switch (cat) {
      case 'stealth':
        return <Shield size={22} color="#00ff88" />;
      case 'purger':
        return <Flame size={22} color="#ff8800" />;
      case 'cpu':
        return <Cpu size={22} color="#00f0ff" />;
      case 'scanner':
        return <Radio size={22} color="#ffb700" />;
      case 'crypto':
        return <Zap size={22} color="#d946ef" />;
      default:
        return <ShoppingCart size={22} color="#00f0ff" />;
    }
  };

  const handleBuy = (upgradeId: keyof PlayerInventoryUpgrades, cost: number) => {
    if (wallet.credits < cost) {
      soundFx.playAccessDenied();
      toast({
        title: 'INSUFFICIENT CREDITS',
        description: `You need ${cost.toLocaleString()} CR to purchase this upgrade. Complete incursion contracts to earn bounties.`,
        status: 'error',
        duration: 3500,
      });
      return;
    }

    setLoadingUpgrade(upgradeId);
    soundFx.playKeyClick();

    fetch('/api/game/market/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upgradeId, cost }),
    })
      .then((res) => res.json())
      .then((data) => {
        soundFx.playAccessGranted();
        if (data.wallet) {
          setWallet(data.wallet);
        } else {
          setWallet((prev) => ({
            credits: prev.credits - cost,
            upgrades: {
              ...prev.upgrades,
              [upgradeId]: prev.upgrades[upgradeId] + 1,
            },
          }));
        }
        toast({
          title: 'CYBERDECK HARDWARE INSTALLED',
          description: `Successfully upgraded ${upgradeId.replace('_', ' ').toUpperCase()}!`,
          status: 'success',
          duration: 3500,
        });
      })
      .catch(() => {
        // Fallback local purchase
        setWallet((prev) => ({
          credits: prev.credits - cost,
          upgrades: {
            ...prev.upgrades,
            [upgradeId]: prev.upgrades[upgradeId] + 1,
          },
        }));
      })
      .finally(() => setLoadingUpgrade(null));
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
      <Box maxW="1500px" mx="auto">
      {/* Header & Wallet Banner */}
      <Flex justifyContent="space-between" alignItems="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <HStack spacing={3} mb={2}>
            <ShoppingCart size={26} color="#00f0ff" />
            <Heading size="lg" color="#00f0ff" fontFamily="monospace" letterSpacing="0.05em">
              DARK_WEB // CYBERDECK_BLACK_MARKET
            </Heading>
          </HStack>
          <Text color="gray.400" fontSize="sm" fontFamily="monospace">
            Reinvest incursion bounty proceeds into military-grade exploit chips, proxy arrays, and overclock hardware.
          </Text>
        </Box>

        {/* Wallet Pill */}
        <HStack
          p={3.5}
          bg="rgba(10, 12, 18, 0.95)"
          borderRadius="lg"
          border="1px solid #ffb700"
          boxShadow="0 0 25px rgba(255, 183, 0, 0.15)"
          spacing={3}
        >
          <Coins size={22} color="#ffb700" />
          <Box>
            <Text fontSize="3xs" color="gray.400" fontFamily="monospace" letterSpacing="0.08em">
              OPERATIVE CREDITS
            </Text>
            <Text fontSize="lg" fontWeight="bold" color="#ffb700" fontFamily="monospace">
              {wallet.credits.toLocaleString()} CR
            </Text>
          </Box>
        </HStack>
      </Flex>

      {/* Upgrades Grid */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
        {CYBERDECK_UPGRADES.map((upgrade) => {
          const currentTier = (wallet.upgrades[upgrade.id as keyof PlayerInventoryUpgrades] || 0);
          const maxTier = upgrade.tiers.length;
          const nextTierInfo = currentTier < maxTier ? upgrade.tiers[currentTier] : null;
          const isMaxed = currentTier >= maxTier;

          return (
            <Box
              key={upgrade.id}
              p={6}
              bg="rgba(10, 12, 18, 0.95)"
              borderRadius="xl"
              border="1px solid rgba(0, 240, 255, 0.25)"
              boxShadow="0 0 25px rgba(0, 240, 255, 0.06)"
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
            >
              <Box mb={4}>
                <Flex justifyContent="space-between" alignItems="center" mb={3}>
                  <HStack spacing={3}>
                    <Box p={2} borderRadius="md" bg="rgba(255, 255, 255, 0.05)">
                      {getUpgradeIcon(upgrade.category)}
                    </Box>
                    <Box>
                      <Heading size="sm" color="#ffffff" fontFamily="monospace">
                        {upgrade.name}
                      </Heading>
                      <Text fontSize="2xs" color="cyan.400" fontFamily="monospace">
                        TIER {currentTier} OF {maxTier} INSTALLED
                      </Text>
                    </Box>
                  </HStack>
                  <Badge colorScheme={isMaxed ? 'green' : 'cyan'} fontSize="2xs" px={2} py={0.5}>
                    {isMaxed ? 'MAX LEVEL' : `LEVEL ${currentTier}`}
                  </Badge>
                </Flex>

                <Text fontSize="xs" color="gray.300" fontFamily="monospace" mb={4}>
                  {upgrade.description}
                </Text>

                <Progress
                  value={(currentTier / maxTier) * 100}
                  size="xs"
                  colorScheme={isMaxed ? 'green' : 'cyan'}
                  borderRadius="full"
                  mb={4}
                />

                {/* Tier Effects List */}
                <VStack align="stretch" spacing={2} bg="rgba(0, 0, 0, 0.35)" p={3} borderRadius="md">
                  {upgrade.tiers.map((t) => {
                    const isUnlocked = currentTier >= t.tier;
                    return (
                      <Flex
                        key={t.tier}
                        justifyContent="space-between"
                        alignItems="center"
                        fontSize="2xs"
                        fontFamily="monospace"
                        color={isUnlocked ? '#00ff88' : 'gray.500'}
                      >
                        <HStack spacing={2}>
                          {isUnlocked ? <Check size={12} color="#00ff88" /> : <Box w="12px" />}
                          <Text fontWeight={isUnlocked ? 'bold' : 'normal'}>
                            T{t.tier}: {t.name}
                          </Text>
                        </HStack>
                        <Text>{t.effect}</Text>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>

              {/* Purchase Button */}
              {isMaxed ? (
                <Button
                  isDisabled
                  size="md"
                  colorScheme="green"
                  variant="outline"
                  fontFamily="monospace"
                  fontSize="xs"
                >
                  SYSTEM FULLY OPTIMIZED (MAX LEVEL)
                </Button>
              ) : (
                <Button
                  colorScheme="teal"
                  bg="#00f0ff"
                  color="#000000"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fontSize="xs"
                  isLoading={loadingUpgrade === upgrade.id}
                  onClick={() => handleBuy(upgrade.id as keyof PlayerInventoryUpgrades, nextTierInfo!.cost)}
                  _hover={{ bg: '#38bdf8' }}
                >
                  UPGRADE TO TIER {nextTierInfo!.tier} ({nextTierInfo!.cost.toLocaleString()} CR)
                </Button>
              )}
            </Box>
          );
        })}
      </SimpleGrid>

        {/* Footer Return Button */}
        <Button
          rightIcon={<ArrowRight size={16} />}
          variant="ghost"
          color="#00f0ff"
          fontFamily="monospace"
          fontSize="xs"
          onClick={() => navigate('/')}
          _hover={{ bg: 'rgba(0, 240, 255, 0.1)' }}
        >
          RETURN TO CYBERDECK HUD
        </Button>
      </Box>
    </Box>
  );
};
