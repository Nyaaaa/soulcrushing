import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', '..', 'game_db.json');

const DEFAULT_DB = {
  wallets: {
    operative_alpha: {
      credits: 15000,
      upgrades: {
        stealth_cloak: 0,
        cpu_overclock: 0,
        port_sniffer: 0,
        decryption_accel: 0,
      },
    },
  },
  gameSaves: {},
  leaderboard: [
    {
      id: 'seed_1',
      playerHandle: 'ZERO_COOL',
      missionId: 'null_dawn',
      completionTimeSeconds: 42,
      tracePercent: 14,
      score: 18450,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'seed_2',
      playerHandle: 'ACID_BURN',
      missionId: 'null_dawn',
      completionTimeSeconds: 58,
      tracePercent: 22,
      score: 16200,
      createdAt: new Date(Date.now() - 18000000).toISOString(),
    },
    {
      id: 'seed_3',
      playerHandle: 'GIBSON_PHANTOM',
      missionId: 'null_dawn',
      completionTimeSeconds: 79,
      tracePercent: 38,
      score: 13800,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'seed_4',
      playerHandle: 'NEO_V4',
      missionId: 'null_dawn',
      completionTimeSeconds: 95,
      tracePercent: 54,
      score: 11400,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'seed_5',
      playerHandle: 'CRASH_OVERRIDE',
      missionId: 'null_dawn',
      completionTimeSeconds: 112,
      tracePercent: 68,
      score: 9800,
      createdAt: new Date(Date.now() - 259200000).toISOString(),
    },
  ],
};

class FileDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.wallets) parsed.wallets = DEFAULT_DB.wallets;
        return parsed;
      }
    } catch {
      // Fallback default
    }
    this.save(DEFAULT_DB);
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }

  save(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  getWallet(playerId = 'operative_alpha') {
    if (!this.data.wallets) this.data.wallets = {};
    if (!this.data.wallets[playerId]) {
      this.data.wallets[playerId] = {
        credits: 15000,
        upgrades: {
          stealth_cloak: 0,
          trace_purger: 0,
          cpu_overclock: 0,
          port_sniffer: 0,
          decryption_accel: 0,
        },
      };
      this.save(this.data);
    }
    if (this.data.wallets[playerId].upgrades.trace_purger === undefined) {
      this.data.wallets[playerId].upgrades.trace_purger = 0;
      this.save(this.data);
    }
    return this.data.wallets[playerId];
  }

  addCredits(playerId = 'operative_alpha', amount = 0) {
    const wallet = this.getWallet(playerId);
    wallet.credits += amount;
    this.save(this.data);
    return wallet;
  }

  buyUpgrade(playerId = 'operative_alpha', upgradeId, cost) {
    const wallet = this.getWallet(playerId);
    if (wallet.credits < cost) {
      throw new Error('INSUFFICIENT CREDITS');
    }
    wallet.credits -= cost;
    wallet.upgrades[upgradeId] = (wallet.upgrades[upgradeId] || 0) + 1;
    this.save(this.data);
    return wallet;
  }

  getSave(playerId) {
    const saves = Object.values(this.data.gameSaves).filter((s) => s.playerId === playerId);
    if (saves.length === 0) return null;
    saves.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return saves[0];
  }

  saveState(record) {
    const updated = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    this.data.gameSaves[record.id] = updated;
    this.save(this.data);
    return updated;
  }

  getLeaderboard(limit = 25) {
    return [...this.data.leaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  addLeaderboardEntry(entry) {
    const newEntry = {
      ...entry,
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.leaderboard.push(newEntry);
    this.save(this.data);
    return newEntry;
  }
}

export const db = new FileDatabase();
