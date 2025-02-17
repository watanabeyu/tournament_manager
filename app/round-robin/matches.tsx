import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { EmojiEventsIcon, ArrowForwardIcon } from '../../components/icons';

type Member = {
  id: string;
  name: string;
};

type Match = {
  id: string;
  player1: Member;
  player2: Member;
  winner?: Member;
};

export const roundRobinMatchesAtom = atom<Match[]>([]);

function generateRoundRobinMatches(players: Member[]): Match[] {
  const matches: Match[] = [];
  let matchId = 0;

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({
        id: String(matchId++),
        player1: players[i],
        player2: players[j],
      });
    }
  }

  return matches;
}

export default function RoundRobinMatchesScreen() {
  const [matches, setMatches] = useAtom(roundRobinMatchesAtom);
  const params = useLocalSearchParams<{ members: string }>();
  const members = params.members ? JSON.parse(params.members) : [];

  useEffect(() => {
    if (members.length > 0) {
      const initialMatches = generateRoundRobinMatches(members);
      setMatches(initialMatches);
    }
  }, [params.members]);

  const handleWinnerSelect = (match: Match, winner: Member) => {
    if (match.winner?.id === winner.id) {
      setMatches(matches.map(m =>
        m.id === match.id ? { ...m, winner: undefined } : m
      ));
      return;
    }

    setMatches(matches.map(m =>
      m.id === match.id ? { ...m, winner } : m
    ));
  };

  const isAllMatchesComplete = matches.every(match => match.winner);

  const getMatchResult = (player1: Member, player2: Member) => {
    const match = matches.find(
      m => (m.player1.id === player1.id && m.player2.id === player2.id) ||
           (m.player1.id === player2.id && m.player2.id === player1.id)
    );

    if (!match) return null;

    const isPlayer1First = match.player1.id === player1.id;
    return {
      match,
      isWinner: match.winner?.id === player1.id,
      isLoser: match.winner?.id === player2.id,
      player1: isPlayer1First ? match.player1 : match.player2,
      player2: isPlayer1First ? match.player2 : match.player1,
    };
  };

  const renderMatchCell = (rowMember: Member, colMember: Member) => {
    const result = getMatchResult(rowMember, colMember);
    if (!result) return null;

    return (
      <TouchableOpacity
        key={`${rowMember.id}-${colMember.id}`}
        style={[
          styles.matchCell,
          result.isWinner && styles.winnerCell,
          result.isLoser && styles.loserCell,
        ]}
        onPress={() => handleWinnerSelect(result.match, rowMember)}>
        {result.isWinner && (
          <EmojiEventsIcon size={16} color="#007AFF" />
        )}
        {result.isLoser && (
          <Text style={styles.loseText}>×</Text>
        )}
        {!result.match.winner && (
          <Text style={styles.vsText}>vs</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} horizontal>
        <ScrollView>
          <View style={styles.tableContainer}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.headerCell}>
                <Text style={styles.headerText}>対戦表</Text>
              </View>
              {members.map((member) => (
                <View key={member.id} style={styles.headerCell}>
                  <Text style={styles.headerText}>{member.name}</Text>
                </View>
              ))}
            </View>

            {/* Match Rows */}
            {members.map((rowMember, rowIndex) => (
              <View key={rowMember.id} style={styles.tableRow}>
                <View style={styles.headerCell}>
                  <Text style={styles.headerText}>{rowMember.name}</Text>
                </View>
                {members.map((colMember, colIndex) => {
                  if (rowIndex === colIndex) {
                    return (
                      <View key={colMember.id} style={styles.disabledCell}>
                        <Text style={styles.disabledText}>-</Text>
                      </View>
                    );
                  }

                  // 対戦カードを表示（両側で選択可能）
                  return renderMatchCell(rowMember, colMember);
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.resultButton,
          !isAllMatchesComplete && styles.disabledResultButton,
        ]}
        onPress={() => router.push('/round-robin/result')}
        disabled={!isAllMatchesComplete}>
        <Text style={[
          styles.buttonText,
          !isAllMatchesComplete && styles.disabledButtonText,
        ]}>結果を確認</Text>
        <ArrowForwardIcon 
          size={24} 
          color={isAllMatchesComplete ? "#fff" : "#8E8E93"} 
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
  tableContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F6F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerCell: {
    width: 100,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  matchCell: {
    width: 100,
    height: 100,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    backgroundColor: '#F6F8FA',
  },
  winnerCell: {
    backgroundColor: '#E3F2FD',
  },
  loserCell: {
    backgroundColor: '#FFF3F2',
  },
  disabledCell: {
    width: 100,
    height: 100,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    backgroundColor: '#F2F2F7',
  },
  disabledText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  loseText: {
    fontSize: 24,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: 'bold',
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