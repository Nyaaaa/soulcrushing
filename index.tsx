import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme, Box, useToast } from '@chakra-ui/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './src/components/Navbar';
import { GameHudPage } from './src/pages/GameHudPage';
import { MissionsPage } from './src/pages/MissionsPage';
import { MarketPage } from './src/pages/MarketPage';
import { LeaderboardPage } from './src/pages/LeaderboardPage';
import { DevWindow } from './src/components/DevWindow';
import { MinigameOverlay, ActiveExploitSession } from './src/components/minigames/MinigameOverlay';
import { INITIAL_STATE, GameState } from './src/game/commandParser';
import { DEFAULT_PLAYER_UPGRADES, PlayerInventoryUpgrades } from './src/game/marketData';

const cyberTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: '#07080c',
        color: '#e2e8f0',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        overflowX: 'hidden',
      },
    },
  },
  colors: {
    cyber: {
      50: '#e0fbff',
      100: '#b8f5ff',
      400: '#00f0ff',
      500: '#00d4e3',
      900: '#031b24',
    },
    neonGreen: '#00ff88',
    neonRed: '#ff0055',
    neonAmber: '#ffb700',
  },
});

function GameApp() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [wallet, setWallet] = useState<{ credits: number; upgrades: PlayerInventoryUpgrades }>({
    credits: 15000,
    upgrades: DEFAULT_PLAYER_UPGRADES,
  });
  const [isDevWindowOpen, setIsDevWindowOpen] = useState(false);
  const [sandboxMinigame, setSandboxMinigame] = useState<ActiveExploitSession | null>(null);
  const toast = useToast();

  // Load persistent wallet on startup
  useEffect(() => {
    fetch('/api/game/market')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.credits === 'number') {
          setWallet(data);
        }
      })
      .catch(() => {});
  }, []);

  // Global hotkey for Dev Window (~ or F2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~' || e.key === 'F2') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          setIsDevWindowOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global game timer ticker
  useEffect(() => {
    if (gameState.isCompleted || gameState.isTraced) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.isCompleted || prev.isTraced) return prev;
        return {
          ...prev,
          timeElapsedSeconds: prev.timeElapsedSeconds + 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isCompleted, gameState.isTraced]);

  return (
    <Box h="100vh" maxH="100vh" display="flex" flexDirection="column" bg="#07080c" color="#e2e8f0" overflow="hidden">
      <Navbar credits={wallet.credits} onOpenDevWindow={() => setIsDevWindowOpen(true)} />
      <Box flex="1" minH="0" overflow="hidden" position="relative">
        <Routes>
          <Route
            path="/"
            element={
              <GameHudPage
                gameState={gameState}
                setGameState={setGameState}
                upgrades={wallet.upgrades}
              />
            }
          />
          <Route path="/missions" element={<MissionsPage setGameState={setGameState} />} />
          <Route
            path="/market"
            element={<MarketPage wallet={wallet} setWallet={setWallet} />}
          />
          <Route
            path="/leaderboard"
            element={<LeaderboardPage gameState={gameState} />}
          />
        </Routes>
      </Box>

      {/* Developer Tools Modal */}
      <DevWindow
        isOpen={isDevWindowOpen}
        onClose={() => setIsDevWindowOpen(false)}
        gameState={gameState}
        setGameState={setGameState}
        wallet={wallet}
        setWallet={setWallet}
        onLaunchMinigameTest={(session) => setSandboxMinigame(session)}
      />

      {/* Sandbox Minigame Overlay (if launched from Dev Window) */}
      <MinigameOverlay
        session={sandboxMinigame}
        upgrades={wallet.upgrades}
        onSuccess={() => {
          toast({ title: 'SANDBOX MINIGAME PASSED', status: 'success', duration: 2000 });
          setSandboxMinigame(null);
        }}
        onFailure={(reason) => {
          toast({ title: 'SANDBOX MINIGAME FAILED', description: reason, status: 'error', duration: 2500 });
          setSandboxMinigame(null);
        }}
        onCancel={() => setSandboxMinigame(null)}
      />
    </Box>
  );
}

function App() {
  return (
    <ChakraProvider theme={cyberTheme}>
      <BrowserRouter>
        <GameApp />
      </BrowserRouter>
    </ChakraProvider>
  );
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);