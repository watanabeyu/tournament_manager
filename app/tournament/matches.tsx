import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

type Member = {
  id: string;
  name: string;
};

type Match = {
  id: string;
  round: number;
  player1: Member | null;
  player2: Member | 'BYE' | null;
  winner?: Member;
  position: number;
};

export const matchesAtom = atom<Match[]>([]);

function generateTournamentMatches(players: Member[]): Match[] {
  const matches: Match[] = [];
  const totalPlayers = players.length;
  const rounds = Math.ceil(Math.log2(totalPlayers));
  const totalMatches = Math.pow(2, rounds) - 1;
  let matchId = 0;

  // 1回戦のマッチを生成
  const firstRoundMatches = Math.ceil(totalPlayers / 2);
  for (let i = 0; i < firstRoundMatches; i++) {
    const match: Match = {
      id: String(matchId++),
      round: 1,
      player1: players[i * 2] || null,
      player2: i * 2 + 1 < totalPlayers ? players[i * 2 + 1] : 'BYE',
      position: i,
    };
    matches.push(match);

    // BYEの場合は自動的に勝者を設定し、次のラウンドのマッチを作成
    if (match.player2 === 'BYE' && match.player1) {
      match.winner = match.player1;
    }
  }

  // 2回戦以降のマッチを生成
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        id: String(matchId++),
        round,
        player1: null,
        player2: null,
        position: i,
      };
      matches.push(match);
    }
  }

  // BYEの試合の勝者を次のラウンドに進める
  matches.forEach(match => {
    if (match.winner) {
      const nextRoundMatch = findNextRoundMatch(matches, match);
      if (nextRoundMatch) {
        const isEvenPosition = match.position % 2 === 0;
        if (isEvenPosition) {
          nextRoundMatch.player1 = match.winner;
        } else {
          nextRoundMatch.player2 = match.winner;
        }
      }
    }
  });

  return matches;
}

function findNextRoundMatch(matches: Match[], currentMatch: Match): Match | null {
  const nextRound = currentMatch.round + 1;
  const nextPosition = Math.floor(currentMatch.position / 2);
  return matches.find(m => m.round === nextRound && m.position === nextPosition) || null;
}

function clearMatchResults(matches: Match[], startMatchId: string): Match[] {
  const startMatch = matches.find(m => m.id === startMatchId);
  if (!startMatch) return matches;

  return matches.map(match => {
    if (match.id === startMatchId) {
      return { ...match, winner: undefined };
    }

    if (match.round > startMatch.round) {
      const isRelatedMatch = 
        (match.player1?.id === startMatch.winner?.id) || 
        (match.player2 !== 'BYE' && match.player2?.id === startMatch.winner?.id);
      
      if (isRelatedMatch) {
        const position = Math.floor(Number(startMatch.id) / 2);
        const isFirstPlayer = Number(startMatch.id) % 2 === 0;
        return {
          ...match,
          winner: undefined,
          player1: isFirstPlayer ? null : match.player1,
          player2: isFirstPlayer ? match.player2 : null,
        };
      }
    }
    return match;
  });
}

export default function TournamentMatchesScreen() {
  const [matches, setMatches] = useAtom(matchesAtom);
  const params = useLocalSearchParams<{ members: string }>();

  useEffect(() => {
    const members = params.members ? JSON.parse(params.members) : [];
    if (members.length > 0) {
      const initialMatches = generateTournamentMatches(members);
      setMatches(initialMatches);
    }
  }, [params.members]);

  const hasWinner = matches.some(match => {
    const matchesInSameRound = matches.filter(m => m.round === match.round);
    return matchesInSameRound.length === 1 && match.winner;
  });

  const handleWinnerSelect = (match: Match, winner: Member) => {
    if (match.winner?.id === winner.id) {
      setMatches(clearMatchResults(matches, match.id));
      return;
    }

    let updatedMatches = matches.map(m =>
      m.id === match.id ? { ...m, winner } : m
    );

    const nextMatch = findNextRoundMatch(matches, match);
    if (nextMatch) {
      const isEvenPosition = match.position % 2 === 0;
      updatedMatches = updatedMatches.map(m => {
        if (m.id === nextMatch.id) {
          return {
            ...m,
            player1: isEvenPosition ? winner : m.player1,
            player2: isEvenPosition ? m.player2 : winner,
          };
        }
        return m;
      });
    }

    setMatches(updatedMatches);
  };

  const isMatchPlayable = (match: Match): boolean => {
    if (match.player2 === 'BYE') return false;
    return (
      match.player1 !== null &&
      match.player2 !== null &&
      match.player1.name.trim() !== '' &&
      match.player2.name.trim() !== ''
    );
  };

  const renderMatch = (match: Match) => (
    <View key={match.id} style={styles.matchCard}>
      <View style={styles.roundBadge}>
        <Text style={styles.roundText}>Round {match.round}</Text>
      </View>
      <View style={styles.matchContent}>
        <View style={styles.matchRow}>
          <TouchableOpacity
            style={[
              styles.playerButton,
              !isMatchPlayable(match) && styles.disabledButton,
              match.winner?.id === match.player1?.id && styles.winnerButton,
            ]}
            onPress={() => match.player1 && handleWinnerSelect(match, match.player1)}
            disabled={!isMatchPlayable(match)}>
            <Text
              style={[
                styles.playerText,
                !isMatchPlayable(match) && styles.disabledText,
                match.winner?.id === match.player1?.id && styles.winnerText,
              ]}>
              {match.player1?.name || '未定'}
            </Text>
            {match.winner?.id === match.player1?.id && (
              <MaterialIcons name="emoji-events" size={16} color="#FFD700" />
            )}
          </TouchableOpacity>

          <Text style={styles.vsText}>vs</Text>

          <TouchableOpacity
            style={[
              styles.playerButton,
              !isMatchPlayable(match) && styles.disabledButton,
              match.winner?.id === (match.player2 !== 'BYE' && match.player2 !== null ? match.player2.id : '') && styles.winnerButton,
            ]}
            onPress={() => match.player2 !== 'BYE' && match.player2 !== null && handleWinnerSelect(match, match.player2)}
            disabled={!isMatchPlayable(match)}>
            <Text
              style={[
                styles.playerText,
                !isMatchPlayable(match) && styles.disabledText,
                match.winner?.id === (match.player2 !== 'BYE' && match.player2 !== null ? match.player2.id : '') && styles.winnerText,
              ]}>
              {match.player2 === 'BYE' ? 'BYE' : match.player2?.name || '未定'}
            </Text>
            {match.winner?.id === (match.player2 !== 'BYE' && match.player2 !== null ? match.player2.id : '') && (
              <MaterialIcons name="emoji-events" size={16} color="#FFD700" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {Object.entries(matchesByRound).map(([round, roundMatches]) => (
          <View key={round} style={styles.roundSection}>
            <Text style={styles.roundTitle}>Round {round}</Text>
            {roundMatches.map(renderMatch)}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[
          styles.resultButton,
          !hasWinner && styles.disabledResultButton,
        ]}
        onPress={() => router.push('/tournament/result')}
        disabled={!hasWinner}>
        <Text style={[
          styles.buttonText,
          !hasWinner && styles.disabledButtonText,
        ]}>結果を確認</Text>
        <MaterialIcons 
          name="arrow-forward" 
          size={24} 
          color={hasWinner ? "#fff" : "#8E8E93"} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  scrollView: {
    flex: 1,
  },
  roundSection: {
    padding: 16,
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roundBadge: {
    backgroundColor: '#F6F8FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  roundText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  matchContent: {
    padding: 16,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  playerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F8FA',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#F2F2F7',
    opacity: 0.7,
  },
  winnerButton: {
    backgroundColor: '#E3F2FD',
  },
  playerText: {
    fontSize: 16,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  disabledText: {
    color: '#8E8E93',
  },
  winnerText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: 'bold',
    textTransform: 'lowercase',
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 8,
  },
  disabledResultButton: {
    backgroundColor: '#F2F2F7',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#8E8E93',
  },
});