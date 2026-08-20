import React from 'react';
import { Box, Grid, GridItem, VStack } from '@chakra-ui/react';
import { GameState } from '../game/commandParser';
import { Terminal } from '../components/Terminal';
import { NetworkMap } from '../components/NetworkMap';
import { TraceMeter } from '../components/TraceMeter';
import { ObjectiveTracker } from '../components/ObjectiveTracker';
import { DeckTelemetry } from '../components/DeckTelemetry';

import { PlayerInventoryUpgrades, DEFAULT_PLAYER_UPGRADES } from '../game/marketData';

interface GameHudPageProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  upgrades?: PlayerInventoryUpgrades;
}

export const GameHudPage: React.FC<GameHudPageProps> = ({
  gameState,
  setGameState,
  upgrades = DEFAULT_PLAYER_UPGRADES,
}) => {
  return (
    <Box p={4} maxW="1800px" mx="auto" w="100%" h="100%" minH="0" overflow="hidden">
      <Grid
        templateColumns={{ base: '1fr', lg: '7fr 5fr' }}
        gap={4}
        h="100%"
        minH="0"
      >
        {/* Left Column: Interactive Cyberdeck Terminal */}
        <GridItem h="100%" minH="0" overflow="hidden" display="flex" flexDirection="column">
          <Terminal gameState={gameState} setGameState={setGameState} upgrades={upgrades} />
        </GridItem>

        {/* Right Column: Visual Telemetry, Network Graph & Objectives */}
        <GridItem h="100%" minH="0" overflowY="auto" overflowX="hidden" pr={2}>
          <VStack spacing={4} align="stretch" pb={4}>
            <TraceMeter gameState={gameState} setGameState={setGameState} upgrades={upgrades} />
            <Box h="280px" minH="280px" flexShrink={0}>
              <NetworkMap gameState={gameState} setGameState={setGameState} />
            </Box>
            <ObjectiveTracker
              objectives={gameState.mission.objectives}
              missionTitle={gameState.mission.title}
            />
            <DeckTelemetry gameState={gameState} />
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};
