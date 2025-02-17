import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import { roundRobinMatchesAtom } from './matches';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { saveTournament } from '../../utils/db';
import { router } from 'expo-router';

type ResultRecord = {
  id: string;
  name: string;
  wins: number;
  losses: number;
  points: number;
};

export default function RoundRobinResultScreen() {
  const matches = useAtomValue(roundRobinMatchesAtom);

  // 勝敗記録を集計
  const results = matches.reduce((acc, match) => {
    if (!match.winner) return acc;

    // 勝者の記録
    if (!acc[match.winner.id]) {
      acc[match.winner.id] = {
        id: match.winner.id,
        name: match.winner.name,
        wins: 0,
        losses: 0,
        points: 0,
      };
    }
    acc[match.winner.id].wins += 1;
    acc[match.winner.id].points += 3;

    // 敗者の記録
    const loser = match.winner.id === match.player1.id ? match.player2 : match.player1;
    if (!acc[loser.id]) {
      acc[loser.id] = {
        id: loser.id,
        name: loser.name,
        wins: 0,
        losses: 0,
        points: 0,
      };
    }
    acc[loser.id].losses += 1;

    return acc;
  }, {} as Record<string, ResultRecord>);

  // 順位順にソート
  const sortedResults = Object.values(results).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  const handleSave = async () => {
    try {
      const participants = Object.values(results).map(({ id, name }) => ({ id, name }));
      await saveTournament(participants, matches);
      router.push('/');
    } catch (error) {
      console.error('Failed to save tournament:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>最終結果</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.resultsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.rankCell]}>順位</Text>
            <Text style={[styles.headerCell, styles.nameCell]}>名前</Text>
            <Text style={[styles.headerCell, styles.statsCell]}>勝</Text>
            <Text style={[styles.headerCell, styles.statsCell]}>敗</Text>
            <Text style={[styles.headerCell, styles.statsCell]}>Pts</Text>
          </View>

          {sortedResults.map((result, index) => (
            <View 
              key={result.id} 
              style={[
                styles.tableRow,
                index === 0 && styles.winnerRow
              ]}>
              <View style={[styles.cell, styles.rankCell]}>
                <Text style={[
                  styles.rankText,
                  index === 0 && styles.winnerText
                ]}>
                  {index + 1}
                </Text>
                {index === 0 && (
                  <MaterialIcons name="emoji-events" size={16} color="#FFD700" />
                )}
              </View>
              <Text style={[
                styles.cell, 
                styles.nameCell,
                index === 0 && styles.winnerText
              ]}>
                {result.name}
              </Text>
              <Text style={[
                styles.cell, 
                styles.statsCell,
                index === 0 && styles.winnerText
              ]}>
                {result.wins}
              </Text>
              <Text style={[
                styles.cell, 
                styles.statsCell,
                index === 0 && styles.winnerText
              ]}>
                {result.losses}
              </Text>
              <Text style={[
                styles.cell, 
                styles.statsCell,
                index === 0 && styles.winnerText
              ]}>
                {result.points}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.matchHistory}>
          <Text style={styles.historyTitle}>対戦履歴</Text>
          {matches.map((match) => (
            <View key={match.id} style={styles.historyMatch}>
              <View style={styles.matchResult}>
                <Text style={[
                  styles.playerName,
                  match.winner?.id === match.player1.id && styles.winnerName
                ]}>
                  {match.player1.name}
                </Text>
                <Text style={styles.vsText}>vs</Text>
                <Text style={[
                  styles.playerName,
                  match.winner?.id === match.player2.id && styles.winnerName
                ]}>
                  {match.player2.name}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>保存して終了</Text>
        <MaterialIcons name="save" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  scrollView: {
    flex: 1,
  },
  resultsTable: {
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F6F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    padding: 12,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    padding: 12,
  },
  winnerRow: {
    backgroundColor: '#E3F2FD',
  },
  cell: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  rankCell: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameCell: {
    flex: 1,
  },
  statsCell: {
    width: 50,
    textAlign: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  winnerText: {
    color: '#007AFF',
  },
  matchHistory: {
    margin: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  historyMatch: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  winnerName: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vsText: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});