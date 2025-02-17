import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// データベースを開く
const db = SQLite.openDatabaseSync('tournaments.db');

// テーブルの初期化（変数なし）
db.execAsync(`
  CREATE TABLE IF NOT EXISTS round_robin_tournaments (
    id TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (unixepoch()),
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS round_robin_participants (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS round_robin_matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    player1_id TEXT NOT NULL,
    player2_id TEXT NOT NULL,
    winner_id TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS tournament_tournaments (
    id TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (unixepoch()),
    completed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS tournament_participants (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS tournament_matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    player1_id TEXT NOT NULL,
    player2_id TEXT,
    winner_id TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    completed_at INTEGER
  );
`);

export interface Tournament {
  id: string;
  created_at: number;
  completed_at: number | null;
}

export interface Participant {
  id: string;
  tournament_id: string;
  name: string;
  created_at: number;
}

export interface Match {
  id: string;
  tournament_id: string;
  round?: number;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  created_at: number;
  completed_at: number | null;
}

export const saveTournament = async (
  participants: { id: string; name: string }[],
  matches: {
    id: string;
    round?: number;
    player1: { id: string; name: string };
    player2: { id: string; name: string } | 'BYE' | null;
    winner?: { id: string; name: string };
  }[]
) => {
  const tournamentId = Math.random().toString(36).substring(7);
  const now = Math.floor(Date.now() / 1000);
  const isTournament = matches.some(match => 'round' in match);
  const tablePrefix = isTournament ? 'tournament' : 'round_robin';
  
  // トーナメントを作成（変数あり）
  await db.runAsync(
    `INSERT INTO ${tablePrefix}_tournaments (id, created_at) VALUES (?, ?)`,
    [tournamentId, now]
  );

  // 参加者を登録（変数あり）
  for (const participant of participants) {
    await db.runAsync(
      `INSERT INTO ${tablePrefix}_participants (id, tournament_id, name, created_at) VALUES (?, ?, ?, ?)`,
      [participant.id, tournamentId, participant.name, now]
    );
  }

  // 試合を登録（変数あり）
  for (const match of matches) {
    if (isTournament) {
      await db.runAsync(
        `INSERT INTO tournament_matches 
         (id, tournament_id, round, player1_id, player2_id, winner_id, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          match.id,
          tournamentId,
          match.round,
          match.player1.id,
          match.player2 === 'BYE' ? null : match.player2?.id,
          match.winner?.id || null,
          now,
          match.winner ? now : null
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO round_robin_matches 
         (id, tournament_id, player1_id, player2_id, winner_id, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          match.id,
          tournamentId,
          match.player1.id,
          (match.player2 as { id: string }).id,
          match.winner?.id || null,
          now,
          match.winner ? now : null
        ]
      );
    }
  }

  // すべての試合が完了している場合、トーナメントを完了状態に更新（変数あり）
  if (matches.every(match => match.winner)) {
    await db.runAsync(
      `UPDATE ${tablePrefix}_tournaments SET completed_at = ? WHERE id = ?`,
      [now, tournamentId]
    );
  }

  return true;
};

export const getTournamentHistory = async (): Promise<{
  tournament: Tournament;
  participants: Participant[];
  matches: Match[];
}[]> => {
  // トーナメント一覧を取得（変数なし）
  const roundRobinTournaments = await db.getAllAsync<Tournament>(
    'SELECT * FROM round_robin_tournaments ORDER BY created_at DESC'
  );

  const tournamentTournaments = await db.getAllAsync<Tournament>(
    'SELECT * FROM tournament_tournaments ORDER BY created_at DESC'
  );

  // 各トーナメントの詳細情報を取得
  const roundRobinResults = await Promise.all(
    roundRobinTournaments.map(async tournament => {
      // 参加者を取得（変数あり）
      const participants = await db.getAllAsync<Participant>(
        'SELECT * FROM round_robin_participants WHERE tournament_id = ?',
        [tournament.id]
      );

      // 試合を取得（変数あり）
      const matches = await db.getAllAsync<Match>(
        'SELECT * FROM round_robin_matches WHERE tournament_id = ?',
        [tournament.id]
      );

      return {
        tournament,
        participants,
        matches,
      };
    })
  );

  const tournamentResults = await Promise.all(
    tournamentTournaments.map(async tournament => {
      // 参加者を取得（変数あり）
      const participants = await db.getAllAsync<Participant>(
        'SELECT * FROM tournament_participants WHERE tournament_id = ?',
        [tournament.id]
      );

      // 試合を取得（変数あり）
      const matches = await db.getAllAsync<Match>(
        'SELECT * FROM tournament_matches WHERE tournament_id = ?',
        [tournament.id]
      );

      return {
        tournament,
        participants,
        matches,
      };
    })
  );

  // 結果を結合して日付順にソート
  return [...roundRobinResults, ...tournamentResults].sort(
    (a, b) => b.tournament.created_at - a.tournament.created_at
  );
};

export default db;