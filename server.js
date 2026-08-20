import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const missionsPath = path.join(__dirname, 'src', 'game', 'missions.json');
const MISSIONS = JSON.parse(fs.readFileSync(missionsPath, 'utf8'));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));

// REST APIs
// 1. Get Missions
app.get('/api/game/missions', (req, res) => {
  res.json(MISSIONS);
});

// 2. Load Save State
app.get('/api/game/state/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const save = db.getSave(playerId);
    if (!save) {
      return res.status(404).json({ message: 'No save found for player' });
    }
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Save Game State
app.post('/api/game/state', (req, res) => {
  try {
    const { playerId, missionId, stage, trace, discoveredNodes, breachedNodes, inventory, isCompleted } = req.body;
    const id = `save_${playerId || 'operative_alpha'}_${missionId || 'null_dawn'}`;

    const saved = db.saveState({
      id,
      playerId: playerId || 'operative_alpha',
      missionId: missionId || 'null_dawn',
      stage: stage || 'active',
      trace: trace || 0,
      discoveredNodes: typeof discoveredNodes === 'string' ? discoveredNodes : JSON.stringify(discoveredNodes),
      breachedNodes: typeof breachedNodes === 'string' ? breachedNodes : JSON.stringify(breachedNodes),
      inventory: typeof inventory === 'string' ? inventory : JSON.stringify(inventory),
      isCompleted: !!isCompleted,
    });

    res.json({ success: true, save: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get Leaderboard
app.get('/api/game/leaderboard', (req, res) => {
  try {
    const leaderboard = db.getLeaderboard(25);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Submit Score
app.post('/api/game/leaderboard', (req, res) => {
  try {
    const { playerHandle, missionId, completionTimeSeconds, tracePercent, score } = req.body;
    const entry = db.addLeaderboardEntry({
      playerHandle: playerHandle || 'ANON_OPERATIVE',
      missionId: missionId || 'null_dawn',
      completionTimeSeconds: completionTimeSeconds || 60,
      tracePercent: tracePercent || 0,
      score: score || 10000,
    });
    res.json({ success: true, entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Wallet & Upgrades
app.get('/api/game/market', (req, res) => {
  try {
    const wallet = db.getWallet('operative_alpha');
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Buy Upgrade
app.post('/api/game/market/buy', (req, res) => {
  try {
    const { upgradeId, cost } = req.body;
    const wallet = db.buyUpgrade('operative_alpha', upgradeId, cost);
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 8. Complete Incursion & Payout Bounty
app.post('/api/game/incursion/complete', (req, res) => {
  try {
    const { playerHandle, missionId, bounty, completionTimeSeconds, tracePercent, score } = req.body;
    const wallet = db.addCredits('operative_alpha', bounty || 10000);
    const entry = db.addLeaderboardEntry({
      playerHandle: playerHandle || 'OPERATIVE_ALPHA',
      missionId: missionId || 'incursion',
      completionTimeSeconds: completionTimeSeconds || 60,
      tracePercent: tracePercent || 0,
      score: score || 12000,
    });
    res.json({ success: true, wallet, entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback all SPA routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Cyberdeck Server] Running on http://localhost:${PORT}`);
});
