import { GameRecords } from '../types/game';

const RECORDS_STORAGE_KEY = 'sommet_blanc_records_v1';

export function getSavedRecords(): GameRecords {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bestTimeSec: typeof parsed.bestTimeSec === 'number' ? parsed.bestTimeSec : 0,
        bestDistanceM: typeof parsed.bestDistanceM === 'number' ? parsed.bestDistanceM : 0,
        bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
        totalCoins: typeof parsed.totalCoins === 'number' ? parsed.totalCoins : 250, // 250 starter gift coins!
        totalGamesPlayed: typeof parsed.totalGamesPlayed === 'number' ? parsed.totalGamesPlayed : 0,
      };
    }
  } catch {
    // Ignore storage issues
  }
  return {
    bestTimeSec: 0,
    bestDistanceM: 0,
    bestScore: 0,
    totalCoins: 250,
    totalGamesPlayed: 0,
  };
}

export function saveRecordsIfBetter(
  timeSec: number,
  distanceM: number,
  score: number,
  coinsEarned: number
): {
  records: GameRecords;
  isNewBestTime: boolean;
  isNewBestDistance: boolean;
  isNewBestScore: boolean;
  newGamesCount: number;
} {
  const current = getSavedRecords();
  const isNewBestTime = timeSec > current.bestTimeSec;
  const isNewBestDistance = distanceM > current.bestDistanceM;
  const isNewBestScore = score > current.bestScore;
  const newGamesCount = current.totalGamesPlayed + 1;

  const updated: GameRecords = {
    bestTimeSec: Math.max(current.bestTimeSec, timeSec),
    bestDistanceM: Math.max(current.bestDistanceM, distanceM),
    bestScore: Math.max(current.bestScore, score),
    totalCoins: current.totalCoins + coinsEarned,
    totalGamesPlayed: newGamesCount,
  };

  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }

  return {
    records: updated,
    isNewBestTime,
    isNewBestDistance,
    isNewBestScore,
    newGamesCount,
  };
}

export function spendCoins(amount: number): boolean {
  const current = getSavedRecords();
  if (current.totalCoins >= amount) {
    current.totalCoins -= amount;
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Ignore
    }
    return true;
  }
  return false;
}

export function addCoins(amount: number) {
  const current = getSavedRecords();
  current.totalCoins += amount;
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore
  }
}

export function formatGameTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}.${tenths}`;
}
