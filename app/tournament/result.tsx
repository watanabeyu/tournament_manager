import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { matchesAtom } from './matches';

export default function TournamentResultScreen() {
  const matches = useAtomValue(matchesAtom);

  // 優勝者を取得
  const finalMatch = matches.find(match => {
    const matchesInSameRound = matches.filter(m => m.round === match.round);
    return matchesInSameRound.length === 1;
  });

  const winner = finalMatch?.winner;

  // ラウンドごとの結果を整理
  const resultsByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    if (match.winner) {
      acc[match.round].push({
        winner: match.winner,
        loser: match.winner.id === match.player1.id ? match.player2 : match.player1,
      });
    }
    return acc;
  }, {} as Record<number, { winner: { id: string; name: string }; loser: { id: string; name: string } | 'BYE' }[]>);

  return (
    <View style={styles.container}>
      {winner && (
        <View style={styles.winnerSection}>
          <MaterialIcons name="emoji-events" size={64} color="#FFD700" />
          <Text style={styles.congratsText}>おめでとうございます！</Text>
          <Text style={styles.winnerName}>{winner.name}</Text>
          <Text style={styles.winnerTitle}>優勝</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {Object.entries(resultsByRound)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([round, results]) => (
            <View key={round} style={styles.roundSection}>
              <Text style={styles.roundTitle}>Round {round}</Text>
              {results.map((result, index) => (
                <View key={index} style={styles.matchResult}>
                  <View style={styles.playerResult}>
                    <MaterialIcons name="emoji-events" size={20} color="#FFD700" />
                    <Text style={styles.winnerText}>{result.winner.name}</Text>
                  </View>
                  <Text style={styles.vsText}>vs</Text>
                  <View style={styles.playerResult}>
                    <MaterialIcons name="close" size={20} color="#FF3B30" />
                    <Text style={styles.loserText}>
                      {result.loser === 'BYE' ? '不戦勝' : result.loser.name}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  winnerSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  winnerTitle: {
    fontSize: 20,
    color: '#8E8E93',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  roundSection: {
    padding: 16,
    marginBottom: 8,
  },
  roundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  matchResult: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerResult: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  winnerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  loserText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  vsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
});